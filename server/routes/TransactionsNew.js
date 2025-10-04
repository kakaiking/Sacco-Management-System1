const express = require("express");
const router = express.Router();
const { Transactions, Accounts, Members, Products, Sacco, sequelize } = require("../models");
const { validateToken } = require("../middlewares/AuthMiddleware");
const { logViewOperation, logCreateOperation, logUpdateOperation, logDeleteOperation } = require("../middlewares/LoggingMiddleware");
const { Op } = require("sequelize");
const { recalculateMultipleAccountBalances } = require("../helpers/balanceCalculation");

// Helper function to generate Transaction ID
const generateTransactionId = () => {
  const randomNum = Math.floor(1000000 + Math.random() * 9000000); // 7 digits
  return `T-${randomNum}`;
};

// Helper function to generate Reference Number
const generateReferenceNumber = () => {
  const randomNum = Math.floor(1000000 + Math.random() * 9000000); // 7 digits
  return `REF-${randomNum}`;
};

// Helper function to respond
const respond = (res, code, message, entity) => {
  res.status(code).json({ code, message, entity });
};

// List with optional status filter and search
router.get("/", validateToken, logViewOperation("Transaction"), async (req, res) => {
  try {
    const { status, q } = req.query;
    const where = { 
      isDeleted: 0,
      status: { [Op.ne]: "Deleted" } // Exclude deleted transactions
    };
    if (status) where.status = status;
    if (q) {
      where[Op.or] = [
        { transactionId: { [Op.like]: `%${q}%` } },
        { referenceNumber: { [Op.like]: `%${q}%` } },
        { remarks: { [Op.like]: `%${q}%` } }
      ];
    }
    const transactions = await Transactions.findAll({ 
      where, 
      include: [
        { model: Sacco, as: 'sacco' },
        { 
          model: Accounts, 
          as: 'account',
          include: [
            { model: Members, as: 'member' },
            { model: Products, as: 'product' }
          ]
        }
      ],
      order: [["referenceNumber", "DESC"], ["entryType", "ASC"]] 
    });
    respond(res, 200, "Transactions fetched", transactions);
  } catch (err) {
    respond(res, 500, err.message);
  }
});

// Get one
router.get("/:id", validateToken, logViewOperation("Transaction"), async (req, res) => {
  try {
    const transaction = await Transactions.findByPk(req.params.id, {
      include: [
        { model: Sacco, as: 'sacco' },
        { 
          model: Accounts, 
          as: 'account',
          include: [
            { model: Members, as: 'member' },
            { model: Products, as: 'product' }
          ]
        }
      ]
    });
    if (!transaction || transaction.isDeleted) return respond(res, 404, "Not found");
    respond(res, 200, "Transaction fetched", transaction);
  } catch (err) {
    respond(res, 500, err.message);
  }
});

// Get transaction by reference number (both entries)
router.get("/reference/:referenceNumber", validateToken, logViewOperation("Transaction"), async (req, res) => {
  try {
    const transactions = await Transactions.findAll({
      where: { 
        referenceNumber: req.params.referenceNumber,
        isDeleted: 0,
        status: { [Op.ne]: "Deleted" }
      },
      include: [
        { model: Sacco, as: 'sacco' },
        { 
          model: Accounts, 
          as: 'account',
          include: [
            { model: Members, as: 'member' },
            { model: Products, as: 'product' }
          ]
        }
      ],
      order: [['entryType', 'ASC']]
    });
    if (!transactions || transactions.length === 0) return respond(res, 404, "Transaction not found");
    respond(res, 200, "Transaction entries fetched", transactions);
  } catch (err) {
    respond(res, 500, err.message);
  }
});

// Create
router.post("/", validateToken, logCreateOperation("Transaction"), async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const data = req.body || {};
    const username = req.user?.username || null;
    
    // Validate required fields
    if (!data.saccoId) {
      return respond(res, 400, "Sacco ID is required", null);
    }
    if (!data.debitAccountId) {
      return respond(res, 400, "Debit Account ID is required", null);
    }
    if (!data.creditAccountId) {
      return respond(res, 400, "Credit Account ID is required", null);
    }
    if (!data.amount || data.amount <= 0) {
      return respond(res, 400, "Valid amount is required", null);
    }

    // Check if debit and credit accounts are different
    if (data.debitAccountId === data.creditAccountId) {
      return respond(res, 400, "Debit and credit accounts cannot be the same", null);
    }

    // Verify accounts exist and belong to the same sacco (using accountId string)
    const [debitAccount, creditAccount] = await Promise.all([
      Accounts.findOne({ 
        where: { accountId: data.debitAccountId },
        include: [{ model: Members, as: 'member' }],
        transaction 
      }),
      Accounts.findOne({ 
        where: { accountId: data.creditAccountId },
        include: [{ model: Members, as: 'member' }],
        transaction 
      })
    ]);

    if (!debitAccount || !creditAccount) {
      await transaction.rollback();
      return respond(res, 400, "One or both accounts not found", null);
    }

    if (debitAccount.saccoId !== data.saccoId || creditAccount.saccoId !== data.saccoId) {
      await transaction.rollback();
      return respond(res, 400, "Accounts must belong to the same SACCO", null);
    }

    // Check if debit account has sufficient balance (for asset accounts)
    if (debitAccount.accountType === 'GL' && debitAccount.availableBalance < parseFloat(data.amount)) {
      await transaction.rollback();
      return respond(res, 400, "Insufficient balance in debit account", null);
    }

    const referenceNumber = generateReferenceNumber();
    const amount = parseFloat(data.amount);
    
    // Create debit entry
    const debitEntry = await Transactions.create({
      transactionId: generateTransactionId(),
      referenceNumber,
      saccoId: data.saccoId,
      accountId: data.debitAccountId, // Use accountId string
      entryType: 'DEBIT',
      amount: amount,
      type: data.type || null,
      status: data.status || "Pending",
      remarks: data.remarks || null,
      createdOn: new Date(),
      createdBy: username,
      // Include old columns for backward compatibility
      debitAccountId: debitAccount.id,
      creditAccountId: creditAccount.id,
    }, { transaction });

    // Create credit entry
    const creditEntry = await Transactions.create({
      transactionId: generateTransactionId(),
      referenceNumber, // Same reference number
      saccoId: data.saccoId,
      accountId: data.creditAccountId, // Use accountId string
      entryType: 'CREDIT',
      amount: amount,
      type: data.type || null,
      status: data.status || "Pending",
      remarks: data.remarks || null,
      createdOn: new Date(),
      createdBy: username,
      // Include old columns for backward compatibility
      debitAccountId: debitAccount.id,
      creditAccountId: creditAccount.id,
    }, { transaction });

    // Update account balances based on transaction status
    const status = data.status || "Pending";
    if (status === "Approved") {
      // For approved transactions, update clear balance directly
      // Note: availableBalance and totalBalance will be recalculated after
      
      // Debit account: decrease clear balance
      await Accounts.update(
        { 
          clearBalance: sequelize.literal(`clearBalance - ${amount}`),
          modifiedOn: new Date(),
          modifiedBy: username
        },
        { 
          where: { accountId: data.debitAccountId },
          transaction
        }
      );

      // Credit account: increase clear balance
      await Accounts.update(
        { 
          clearBalance: sequelize.literal(`clearBalance + ${amount}`),
          modifiedOn: new Date(),
          modifiedBy: username
        },
        { 
          where: { accountId: data.creditAccountId },
          transaction
        }
      );
    } else {
      // For pending transactions, update unsupervised fields
      // The availableBalance will be recalculated after:
      // availableBalance = clearBalance + unsupervisedCredits - unsupervisedDebits - frozenAmount - pendingCharges
      
      // Debit account: increase unsupervised debits
      await Accounts.update(
        { 
          unsupervisedDebits: sequelize.literal(`unsupervisedDebits + ${amount}`),
          modifiedOn: new Date(),
          modifiedBy: username
        },
        { 
          where: { accountId: data.debitAccountId },
          transaction
        }
      );

      // Credit account: increase unsupervised credits
      await Accounts.update(
        { 
          unsupervisedCredits: sequelize.literal(`unsupervisedCredits + ${amount}`),
          modifiedOn: new Date(),
          modifiedBy: username
        },
        { 
          where: { accountId: data.creditAccountId },
          transaction
        }
      );
    }
    
    // Recalculate availableBalance and totalBalance for both accounts
    await recalculateMultipleAccountBalances(
      Accounts, 
      [data.debitAccountId, data.creditAccountId], 
      transaction
    );
    
    await transaction.commit();
    
    // Fetch both entries with all associations
    const transactionEntries = await Transactions.findAll({
      where: { referenceNumber },
      include: [
        { model: Sacco, as: 'sacco' },
        { 
          model: Accounts, 
          as: 'account',
          include: [
            { model: Members, as: 'member' },
            { model: Products, as: 'product' }
          ]
        }
      ],
      order: [['entryType', 'ASC']]
    });
    
    respond(res, 201, "Transaction created with double-entry", transactionEntries);
  } catch (err) {
    await transaction.rollback();
    console.error("Error creating transaction:", err);
    respond(res, 500, `Server error: ${err.message}`, null);
  }
});

// Approve transaction (update account balances)
router.put("/reference/:referenceNumber/approve", validateToken, logUpdateOperation("Transaction"), async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { referenceNumber } = req.params;
    const username = req.user?.username || null;
    
    // Get both entries for this transaction
    const transactionEntries = await Transactions.findAll({
      where: { 
        referenceNumber,
        isDeleted: 0,
        status: "Pending"
      },
      include: [{ model: Accounts, as: 'account' }],
      transaction
    });
    
    if (transactionEntries.length !== 2) {
      await transaction.rollback();
      return respond(res, 400, "Transaction must have exactly 2 entries (debit and credit)", null);
    }
    
    const debitEntry = transactionEntries.find(entry => entry.entryType === 'DEBIT');
    const creditEntry = transactionEntries.find(entry => entry.entryType === 'CREDIT');
    
    if (!debitEntry || !creditEntry) {
      await transaction.rollback();
      return respond(res, 400, "Transaction must have both debit and credit entries", null);
    }
    
    // Check if debit account has sufficient balance (for asset accounts)
    if (debitEntry.account.accountType === 'GL' && debitEntry.account.availableBalance < parseFloat(debitEntry.amount)) {
      await transaction.rollback();
      return respond(res, 400, "Insufficient balance in debit account", null);
    }
    
    // Update both transaction entries to approved
    await Transactions.update(
      { 
        status: "Approved",
        approvedBy: username,
        approvedOn: new Date(),
        modifiedOn: new Date(),
        modifiedBy: username
      },
      { 
        where: { referenceNumber },
        transaction 
      }
    );
    
    // Update account balances - move from unsupervised to clear
    const amount = parseFloat(debitEntry.amount);

    // Check sufficient unsupervised amounts
    const unsupervisedDebits = parseFloat(debitEntry.account.unsupervisedDebits || 0);
    const unsupervisedCredits = parseFloat(creditEntry.account.unsupervisedCredits || 0);
    
    if (unsupervisedDebits < amount) {
      await transaction.rollback();
      return respond(res, 400, "Insufficient unsupervised debits in debit account", null);
    }
    if (unsupervisedCredits < amount) {
      await transaction.rollback();
      return respond(res, 400, "Insufficient unsupervised credits in credit account", null);
    }

    // Debit account: move from unsupervised to clear balance
    // - Reduce unsupervised debits
    // - Reduce clear balance (money leaving)
    // Note: availableBalance will be recalculated after
    await Accounts.update(
      { 
        unsupervisedDebits: sequelize.literal(`unsupervisedDebits - ${amount}`),
        clearBalance: sequelize.literal(`clearBalance - ${amount}`),
        modifiedOn: new Date(),
        modifiedBy: username
      },
      { 
        where: { accountId: debitEntry.accountId },
        transaction
      }
    );

    // Credit account: move from unsupervised to clear balance
    // - Reduce unsupervised credits
    // - Increase clear balance (money arriving)
    // Note: availableBalance will be recalculated after
    await Accounts.update(
      { 
        unsupervisedCredits: sequelize.literal(`unsupervisedCredits - ${amount}`),
        clearBalance: sequelize.literal(`clearBalance + ${amount}`),
        modifiedOn: new Date(),
        modifiedBy: username
      },
      { 
        where: { accountId: creditEntry.accountId },
        transaction
      }
    );
    
    // Recalculate availableBalance and totalBalance for both accounts
    await recalculateMultipleAccountBalances(
      Accounts, 
      [debitEntry.accountId, creditEntry.accountId], 
      transaction
    );
    
    await transaction.commit();
    
    // Fetch updated transaction entries
    const updatedEntries = await Transactions.findAll({
      where: { referenceNumber },
      include: [
        { model: Sacco, as: 'sacco' },
        { 
          model: Accounts, 
          as: 'account',
          include: [
            { model: Members, as: 'member' },
            { model: Products, as: 'product' }
          ]
        }
      ],
      order: [['entryType', 'ASC']]
    });
    
    respond(res, 200, "Transaction approved and account balances updated", updatedEntries);
  } catch (err) {
    await transaction.rollback();
    console.error("Error approving transaction:", err);
    respond(res, 500, `Server error: ${err.message}`, null);
  }
});

// Soft delete
router.delete("/:id", validateToken, logDeleteOperation("Transaction"), async (req, res) => {
  try {
    const [count] = await Transactions.update({ 
      isDeleted: 1, 
      status: "Deleted",
      modifiedOn: new Date(),
      modifiedBy: req.user?.username || "System"
    }, { where: { id: req.params.id } });
    if (!count) return respond(res, 404, "Not found");
    respond(res, 200, "Transaction deleted");
  } catch (err) {
    respond(res, 500, err.message);
  }
});

module.exports = router;
