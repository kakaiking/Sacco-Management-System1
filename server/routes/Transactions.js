const express = require("express");
const router = express.Router();
const { Transactions, Accounts, GLAccounts, Members, Products, Sacco, sequelize } = require("../models");
const { validateToken } = require("../middlewares/AuthMiddleware");
const { logViewOperation, logCreateOperation, logUpdateOperation, logDeleteOperation } = require("../middlewares/LoggingMiddleware");
const { Op } = require("sequelize");

// Helper function to generate Transaction ID
const generateTransactionId = () => {
  const randomNum = Math.floor(1000000 + Math.random() * 9000000);
  return `T-${randomNum}`;
};

// Helper function to generate Reference Number
const generateReferenceNumber = () => {
  const randomNum = Math.floor(1000000 + Math.random() * 9000000);
  return `REF-${randomNum}`;
};

// Helper function to respond
const respond = (res, code, message, entity) => {
  res.status(code).json({ code, message, entity });
};

// List transactions
router.get("/", validateToken, logViewOperation("Transaction"), async (req, res) => {
  try {
    const { status, q } = req.query;
    const where = { 
      isDeleted: 0,
      status: { [Op.ne]: "Deleted" }
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
          as: 'memberAccount',
          include: [
            { model: Members, as: 'member' },
            { model: Products, as: 'product' }
          ],
          required: false
        },
        { 
          model: GLAccounts, 
          as: 'glAccount',
          include: [
            { model: Sacco, as: 'sacco' }
          ],
          required: false
        }
      ],
      order: [["referenceNumber", "DESC"], ["entryType", "ASC"]] 
    });
    
    respond(res, 200, "Transactions fetched", transactions);
  } catch (err) {
    console.error("Error fetching transactions:", err);
    respond(res, 500, `Server error: ${err.message}`, null);
  }
});

// List cash transactions
router.get("/cash", validateToken, logViewOperation("Cash Transaction"), async (req, res) => {
  try {
    const { status, q, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const where = { 
      isDeleted: 0,
      status: { [Op.ne]: "Deleted" }
    };
    
    if (status) where.status = status;
    if (q) {
      where[Op.or] = [
        { transactionId: { [Op.like]: `%${q}%` } },
        { referenceNumber: { [Op.like]: `%${q}%` } },
        { remarks: { [Op.like]: `%${q}%` } }
      ];
    }
    
    const { count, rows: transactions } = await Transactions.findAndCountAll({ 
      where, 
      include: [
        { model: Sacco, as: 'sacco' },
        { 
          model: Accounts, 
          as: 'memberAccount',
          include: [
            { model: Members, as: 'member' },
            { model: Products, as: 'product' }
          ],
          required: false
        },
        { 
          model: GLAccounts, 
          as: 'glAccount',
          include: [
            { model: Sacco, as: 'sacco' }
          ],
          required: false
        }
      ],
      order: [["referenceNumber", "DESC"], ["entryType", "ASC"]],
      limit: parseInt(limit),
      offset: offset
    });
    
    // Group transactions by reference number to show only one entry per transaction
    const groupedTransactions = {};
    transactions.forEach(transaction => {
      if (!groupedTransactions[transaction.referenceNumber]) {
        groupedTransactions[transaction.referenceNumber] = {
          ...transaction.toJSON(),
          transactionType: transaction.type === 'WITHDRAWAL' ? 'debit' : 'credit'
        };
      }
    });
    
    const cashTransactions = Object.values(groupedTransactions);
    
    respond(res, 200, "Cash transactions fetched", {
      transactions: cashTransactions,
      totalItems: count,
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page)
    });
  } catch (err) {
    console.error("Error fetching cash transactions:", err);
    respond(res, 500, `Server error: ${err.message}`, null);
  }
});

// Get transaction by ID
router.get("/:id", validateToken, logViewOperation("Transaction"), async (req, res) => {
  try {
    // Validate that the ID is a number
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return respond(res, 400, "Invalid transaction ID. ID must be a number.", null);
    }
    
    const transaction = await Transactions.findByPk(id, {
      include: [
        { model: Sacco, as: 'sacco' },
        { 
          model: Accounts, 
          as: 'memberAccount',
          include: [
            { model: Members, as: 'member' },
            { model: Products, as: 'product' }
          ],
          required: false
        },
        { 
          model: GLAccounts, 
          as: 'glAccount',
          include: [
            { model: Sacco, as: 'sacco' }
          ],
          required: false
        }
      ]
    });
    
    if (!transaction || transaction.isDeleted) {
      return respond(res, 404, "Transaction not found", null);
    }
    
    respond(res, 200, "Transaction fetched", transaction);
  } catch (err) {
    console.error("Error fetching transaction:", err);
    respond(res, 500, `Server error: ${err.message}`, null);
  }
});

// Get transactions by member ID
router.get("/member/:memberId", validateToken, logViewOperation("Transaction"), async (req, res) => {
  try {
    const { memberId } = req.params;
    const { status, limit = 50 } = req.query;
    
    const where = { 
      isDeleted: 0,
      status: { [Op.ne]: "Deleted" }
    };
    
    if (status) where.status = status;
    
    const transactions = await Transactions.findAll({ 
      where, 
      include: [
        { model: Sacco, as: 'sacco' },
        { 
          model: Accounts, 
          as: 'memberAccount',
          where: { memberId: memberId },
          include: [
            { model: Members, as: 'member' },
            { model: Products, as: 'product' }
          ],
          required: true
        },
        { 
          model: GLAccounts, 
          as: 'glAccount',
          include: [
            { model: Sacco, as: 'sacco' }
          ],
          required: false
        }
      ],
      order: [["createdOn", "DESC"]],
      limit: parseInt(limit)
    });
    
    respond(res, 200, "Member transactions fetched", transactions);
  } catch (err) {
    console.error("Error fetching member transactions:", err);
    respond(res, 500, `Server error: ${err.message}`, null);
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
          as: 'memberAccount',
          include: [
            { model: Members, as: 'member' },
            { model: Products, as: 'product' }
          ],
          required: false
        },
        { 
          model: GLAccounts, 
          as: 'glAccount',
          include: [
            { model: Sacco, as: 'sacco' }
          ],
          required: false
        }
      ],
      order: [['entryType', 'ASC']]
    });
    
    if (!transactions || transactions.length === 0) {
      return respond(res, 404, "Transaction not found", null);
    }
    
    respond(res, 200, "Transaction entries fetched", transactions);
  } catch (err) {
    console.error("Error fetching transaction by reference:", err);
    respond(res, 500, `Server error: ${err.message}`, null);
  }
});

// Get transactions by account ID (for account statements)
router.get("/account/:accountId", validateToken, logViewOperation("Transaction"), async (req, res) => {
  try {
    const { accountId } = req.params;
    const { fromDate, toDate, status } = req.query;
    
    console.log('=== FETCHING ACCOUNT TRANSACTIONS ===');
    console.log(`Account ID: ${accountId}`);
    console.log(`From Date: ${fromDate}`);
    console.log(`To Date: ${toDate}`);
    console.log(`Status Filter: ${status}`);
    
    const where = { 
      accountId: accountId,
      isDeleted: 0,
      status: { [Op.ne]: "Deleted" }
    };
    
    if (status) where.status = status;
    
    // Add date filter if provided
    if (fromDate && toDate) {
      where.createdOn = {
        [Op.between]: [new Date(fromDate), new Date(toDate + ' 23:59:59')]
      };
    } else if (fromDate) {
      where.createdOn = {
        [Op.gte]: new Date(fromDate)
      };
    } else if (toDate) {
      where.createdOn = {
        [Op.lte]: new Date(toDate + ' 23:59:59')
      };
    }
    
    console.log('Where clause:', JSON.stringify(where, null, 2));
    
    const transactions = await Transactions.findAll({ 
      where, 
      include: [
        { model: Sacco, as: 'sacco' },
        { 
          model: Accounts, 
          as: 'memberAccount',
          include: [
            { model: Members, as: 'member' },
            { model: Products, as: 'product' }
          ],
          required: false
        },
        { 
          model: GLAccounts, 
          as: 'glAccount',
          include: [
            { model: Sacco, as: 'sacco' }
          ],
          required: false
        }
      ],
      order: [["createdOn", "ASC"], ["id", "ASC"]]
    });
    
    console.log(`Found ${transactions.length} transactions for account ${accountId}`);
    
    if (transactions.length > 0) {
      console.log('Sample transaction:', {
        id: transactions[0].id,
        accountId: transactions[0].accountId,
        entryType: transactions[0].entryType,
        amount: transactions[0].amount,
        status: transactions[0].status,
        createdOn: transactions[0].createdOn
      });
    }
    
    respond(res, 200, "Account transactions fetched", transactions);
  } catch (err) {
    console.error("Error fetching account transactions:", err);
    respond(res, 500, `Server error: ${err.message}`, null);
  }
});

// Create transaction with double-entry
router.post("/", validateToken, logCreateOperation("Transaction"), async (req, res) => {
  const dbTransaction = await sequelize.transaction();
  
  try {
    const data = req.body || {};
    const username = req.user?.username || "System";
    
    console.log("Creating transaction with data:", data);
    
    // Validate required fields
    if (!data.saccoId) {
      await dbTransaction.rollback();
      return respond(res, 400, "Sacco ID is required", null);
    }
    if (!data.debitAccountId) {
      await dbTransaction.rollback();
      return respond(res, 400, "Debit Account ID is required", null);
    }
    if (!data.creditAccountId) {
      await dbTransaction.rollback();
      return respond(res, 400, "Credit Account ID is required", null);
    }
    if (!data.amount || data.amount <= 0) {
      await dbTransaction.rollback();
      return respond(res, 400, "Valid amount is required", null);
    }

    // Check if debit and credit accounts are different
    if (data.debitAccountId === data.creditAccountId) {
      await dbTransaction.rollback();
      return respond(res, 400, "Debit and credit accounts cannot be the same", null);
    }

    console.log("Looking up accounts...");
    
    // Verify accounts exist and belong to the same sacco
    // Check both member accounts and GL accounts
    const [debitMemberAccount, debitGLAccount, creditMemberAccount, creditGLAccount] = await Promise.all([
      Accounts.findOne({ 
        where: { accountId: data.debitAccountId },
        include: [{ model: Members, as: 'member' }],
        transaction: dbTransaction
      }),
      GLAccounts.findOne({ 
        where: { glAccountId: data.debitAccountId },
        transaction: dbTransaction
      }),
      Accounts.findOne({ 
        where: { accountId: data.creditAccountId },
        include: [{ model: Members, as: 'member' }],
        transaction: dbTransaction
      }),
      GLAccounts.findOne({ 
        where: { glAccountId: data.creditAccountId },
        transaction: dbTransaction
      })
    ]);

    // Determine which accounts were found
    const debitAccount = debitMemberAccount || debitGLAccount;
    const creditAccount = creditMemberAccount || creditGLAccount;

    console.log("Debit account found:", !!debitAccount);
    console.log("Credit account found:", !!creditAccount);

    if (!debitAccount || !creditAccount) {
      await dbTransaction.rollback();
      return respond(res, 400, "One or both accounts not found", null);
    }

    // Check if accounts belong to the same SACCO (with better validation)
    const debitSaccoId = debitAccount.saccoId?.toString().trim();
    const creditSaccoId = creditAccount.saccoId?.toString().trim();
    const requestSaccoId = data.saccoId?.toString().trim();
    
    console.log("SACCO ID validation:");
    console.log(`  Request SACCO ID: "${requestSaccoId}"`);
    console.log(`  Debit Account SACCO ID: "${debitSaccoId}"`);
    console.log(`  Credit Account SACCO ID: "${creditSaccoId}"`);
    
    if (!debitSaccoId || !creditSaccoId || !requestSaccoId) {
      await dbTransaction.rollback();
      return respond(res, 400, "SACCO ID is missing from accounts or request", null);
    }
    
    if (debitSaccoId !== requestSaccoId || creditSaccoId !== requestSaccoId) {
      await dbTransaction.rollback();
      return respond(res, 400, `Accounts must belong to the same SACCO. Debit: ${debitSaccoId}, Credit: ${creditSaccoId}, Request: ${requestSaccoId}`, null);
    }
    
    if (debitSaccoId !== creditSaccoId) {
      await dbTransaction.rollback();
      return respond(res, 400, `Debit and credit accounts must belong to the same SACCO. Debit: ${debitSaccoId}, Credit: ${creditSaccoId}`, null);
    }

    // Check if debit account has sufficient balance (for GL accounts)
    if (debitAccount.accountType === 'GL' && debitAccount.availableBalance < parseFloat(data.amount)) {
      await dbTransaction.rollback();
      return respond(res, 400, "Insufficient balance in debit account", null);
    }

    const referenceNumber = generateReferenceNumber();
    const amount = parseFloat(data.amount);
    
    console.log("Creating transaction entries...");
    
    // Determine if transaction is being approved on creation
    const status = data.status || "Pending";
    const isApproved = status === "Approved";
    
    // Create debit entry
    const debitEntry = await Transactions.create({
      transactionId: generateTransactionId(),
      referenceNumber,
      saccoId: data.saccoId,
      accountId: data.debitAccountId,
      entryType: 'DEBIT',
      amount: amount,
      type: data.type || null,
      status: status,
      remarks: data.remarks || null,
      createdOn: new Date(),
      createdBy: username,
      approvedBy: isApproved ? username : null,
      approvedOn: isApproved ? new Date() : null,
    }, { transaction: dbTransaction });

    // Create credit entry
    const creditEntry = await Transactions.create({
      transactionId: generateTransactionId(),
      referenceNumber,
      saccoId: data.saccoId,
      accountId: data.creditAccountId,
      entryType: 'CREDIT',
      amount: amount,
      type: data.type || null,
      status: status,
      remarks: data.remarks || null,
      createdOn: new Date(),
      createdBy: username,
      approvedBy: isApproved ? username : null,
      approvedOn: isApproved ? new Date() : null,
    }, { transaction: dbTransaction });

    console.log("Transaction entries created successfully");

    // Update account balances based on transaction status
    if (data.status === "Approved") {
      console.log("Updating account balances for approved transaction...");
      
      // Update debit account balance (decrease clear balance)
      if (debitMemberAccount) {
        // Update in ONE query to avoid double-updates
        await sequelize.query(
          `UPDATE accounts 
           SET clearBalance = clearBalance - :amount,
               availableBalance = (clearBalance - :amount) + unsupervisedCredits - unsupervisedDebits - frozenAmount - pendingCharges,
               modifiedOn = :modifiedOn,
               modifiedBy = :modifiedBy
           WHERE accountId = :accountId`,
          { 
            replacements: { 
              amount: amount,
              accountId: data.debitAccountId,
              modifiedOn: new Date(),
              modifiedBy: username
            },
            transaction: dbTransaction
          }
        );
      } else if (debitGLAccount) {
        await GLAccounts.update(
          { 
            availableBalance: sequelize.literal(`availableBalance - ${amount}`),
            modifiedOn: new Date(),
            modifiedBy: username
          },
          { 
            where: { glAccountId: data.debitAccountId },
            transaction: dbTransaction
          }
        );
      }

      // Update credit account balance (increase clear balance)
      if (creditMemberAccount) {
        // Update in ONE query to avoid double-updates
        await sequelize.query(
          `UPDATE accounts 
           SET clearBalance = clearBalance + :amount,
               availableBalance = (clearBalance + :amount) + unsupervisedCredits - unsupervisedDebits - frozenAmount - pendingCharges,
               modifiedOn = :modifiedOn,
               modifiedBy = :modifiedBy
           WHERE accountId = :accountId`,
          { 
            replacements: { 
              amount: amount,
              accountId: data.creditAccountId,
              modifiedOn: new Date(),
              modifiedBy: username
            },
            transaction: dbTransaction
          }
        );
      } else if (creditGLAccount) {
        await GLAccounts.update(
          { 
            availableBalance: sequelize.literal(`availableBalance + ${amount}`),
            modifiedOn: new Date(),
            modifiedBy: username
          },
          { 
            where: { glAccountId: data.creditAccountId },
            transaction: dbTransaction
          }
        );
      }
    } else {
      console.log("Updating pending balances for transaction with status:", data.status);
      
      // Update pending balances for pending transactions
      // BOTH debit and credit sides need to be updated
      
      // Debit account: increase unsupervisedDebits (pending debit)
      if (debitMemberAccount) {
        // Update in ONE query to avoid double-updates
        await sequelize.query(
          `UPDATE accounts 
           SET unsupervisedDebits = unsupervisedDebits + :amount,
               availableBalance = clearBalance + unsupervisedCredits - (unsupervisedDebits + :amount) - frozenAmount - pendingCharges,
               modifiedOn = :modifiedOn,
               modifiedBy = :modifiedBy
           WHERE accountId = :accountId`,
          { 
            replacements: { 
              amount: amount,
              accountId: data.debitAccountId,
              modifiedOn: new Date(),
              modifiedBy: username
            },
            transaction: dbTransaction
          }
        );
      }

      // Credit account: increase unsupervisedCredits (pending credit)
      if (creditMemberAccount) {
        // Update in ONE query to avoid double-updates
        await sequelize.query(
          `UPDATE accounts 
           SET unsupervisedCredits = unsupervisedCredits + :amount,
               availableBalance = clearBalance + (unsupervisedCredits + :amount) - unsupervisedDebits - frozenAmount - pendingCharges,
               modifiedOn = :modifiedOn,
               modifiedBy = :modifiedBy
           WHERE accountId = :accountId`,
          { 
            replacements: { 
              amount: amount,
              accountId: data.creditAccountId,
              modifiedOn: new Date(),
              modifiedBy: username
            },
            transaction: dbTransaction
          }
        );
      }
    }
    
    await dbTransaction.commit();
    console.log("Transaction committed successfully");
    
    // Fetch both entries with all associations
    const transactionEntries = await Transactions.findAll({
      where: { referenceNumber },
      include: [
        { model: Sacco, as: 'sacco' },
        { 
          model: Accounts, 
          as: 'memberAccount',
          include: [
            { model: Members, as: 'member' },
            { model: Products, as: 'product' }
          ],
          required: false
        },
        { 
          model: GLAccounts, 
          as: 'glAccount',
          include: [
            { model: Sacco, as: 'sacco' }
          ],
          required: false
        }
      ],
      order: [['entryType', 'ASC']]
    });
    
    respond(res, 201, "Transaction created with double-entry", transactionEntries);
  } catch (err) {
    await dbTransaction.rollback();
    console.error("Error creating transaction:", err);
    respond(res, 500, `Server error: ${err.message}`, null);
  }
});

// Approve transaction (update account balances)
router.put("/reference/:referenceNumber/approve", validateToken, logUpdateOperation("Transaction"), async (req, res) => {
  const dbTransaction = await sequelize.transaction();
  
  try {
    const { referenceNumber } = req.params;
    const username = req.user?.username || "System";
    
    // Get both entries for this transaction
    const transactionEntries = await Transactions.findAll({
      where: { 
        referenceNumber,
        isDeleted: 0,
        status: "Pending"
      },
      transaction: dbTransaction
    });
    
    if (transactionEntries.length !== 2) {
      await dbTransaction.rollback();
      return respond(res, 400, "Transaction must have exactly 2 entries (debit and credit)", null);
    }
    
    const debitEntry = transactionEntries.find(entry => entry.entryType === 'DEBIT');
    const creditEntry = transactionEntries.find(entry => entry.entryType === 'CREDIT');
    
    if (!debitEntry || !creditEntry) {
      await dbTransaction.rollback();
      return respond(res, 400, "Transaction must have both debit and credit entries", null);
    }
    
    // Get account details for balance validation
    const [debitMemberAccount, debitGLAccount, creditMemberAccount, creditGLAccount] = await Promise.all([
      Accounts.findOne({ 
        where: { accountId: debitEntry.accountId },
        transaction: dbTransaction
      }),
      GLAccounts.findOne({ 
        where: { glAccountId: debitEntry.accountId },
        transaction: dbTransaction
      }),
      Accounts.findOne({ 
        where: { accountId: creditEntry.accountId },
        transaction: dbTransaction
      }),
      GLAccounts.findOne({ 
        where: { glAccountId: creditEntry.accountId },
        transaction: dbTransaction
      })
    ]);

    const debitAccount = debitMemberAccount || debitGLAccount;
    const creditAccount = creditMemberAccount || creditGLAccount;
    
    // Check if debit account has sufficient balance (for GL accounts)
    if (debitGLAccount && debitAccount.availableBalance < parseFloat(debitEntry.amount)) {
      await dbTransaction.rollback();
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
        transaction: dbTransaction
      }
    );
    
    // Update account balances - move from pending to clear balances
    const amount = parseFloat(debitEntry.amount);
    
    // Update debit account balance (move from pending debit to clear balance decrease)
    if (debitMemberAccount) {
      // For member accounts: Update all fields in ONE query to avoid double-updates
      // Formula: availableBalance = clearBalance + unsupervisedCredits - unsupervisedDebits - frozenAmount - pendingCharges
      await sequelize.query(
        `UPDATE accounts 
         SET unsupervisedDebits = unsupervisedDebits - :amount,
             clearBalance = clearBalance - :amount,
             availableBalance = (clearBalance - :amount) + unsupervisedCredits - (unsupervisedDebits - :amount) - frozenAmount - pendingCharges,
             modifiedOn = :modifiedOn,
             modifiedBy = :modifiedBy
         WHERE accountId = :accountId`,
        {
          replacements: {
            amount: amount,
            accountId: debitEntry.accountId,
            modifiedOn: new Date(),
            modifiedBy: username
          },
          transaction: dbTransaction
        }
      );
    } else if (debitGLAccount) {
      // For GL accounts: just update availableBalance directly
      await GLAccounts.update(
        { 
          availableBalance: sequelize.literal(`availableBalance - ${amount}`),
          modifiedOn: new Date(),
          modifiedBy: username
        },
        { 
          where: { glAccountId: debitEntry.accountId },
          transaction: dbTransaction
        }
      );
    }

    // Update credit account balance (move from pending credit to clear balance increase)
    if (creditMemberAccount) {
      // For member accounts: Update all fields in ONE query to avoid double-updates
      // Formula: availableBalance = clearBalance + unsupervisedCredits - unsupervisedDebits - frozenAmount - pendingCharges
      await sequelize.query(
        `UPDATE accounts 
         SET unsupervisedCredits = unsupervisedCredits - :amount,
             clearBalance = clearBalance + :amount,
             availableBalance = (clearBalance + :amount) + (unsupervisedCredits - :amount) - unsupervisedDebits - frozenAmount - pendingCharges,
             modifiedOn = :modifiedOn,
             modifiedBy = :modifiedBy
         WHERE accountId = :accountId`,
        {
          replacements: {
            amount: amount,
            accountId: creditEntry.accountId,
            modifiedOn: new Date(),
            modifiedBy: username
          },
          transaction: dbTransaction
        }
      );
    } else if (creditGLAccount) {
      // For GL accounts: just update availableBalance directly
      await GLAccounts.update(
        { 
          availableBalance: sequelize.literal(`availableBalance + ${amount}`),
          modifiedOn: new Date(),
          modifiedBy: username
        },
        { 
          where: { glAccountId: creditEntry.accountId },
          transaction: dbTransaction
        }
      );
    }
    
    await dbTransaction.commit();
    
    // Fetch updated transaction entries
    const updatedEntries = await Transactions.findAll({
      where: { referenceNumber },
      include: [
        { model: Sacco, as: 'sacco' },
        { 
          model: Accounts, 
          as: 'memberAccount',
          include: [
            { model: Members, as: 'member' },
            { model: Products, as: 'product' }
          ],
          required: false
        },
        { 
          model: GLAccounts, 
          as: 'glAccount',
          include: [
            { model: Sacco, as: 'sacco' }
          ],
          required: false
        }
      ],
      order: [['entryType', 'ASC']]
    });
    
    respond(res, 200, "Transaction approved and account balances updated", updatedEntries);
  } catch (err) {
    await dbTransaction.rollback();
    console.error("Error approving transaction:", err);
    respond(res, 500, `Server error: ${err.message}`, null);
  }
});

// Update transaction
router.put("/:id", validateToken, logUpdateOperation("Transaction"), async (req, res) => {
  try {
    // Validate that the ID is a number
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return respond(res, 400, "Invalid transaction ID. ID must be a number.", null);
    }
    
    const data = req.body || {};
    const username = req.user?.username || "System";
    
    const updatePayload = {
      amount: data.amount !== undefined ? parseFloat(data.amount) : undefined,
      type: data.type !== undefined ? data.type : undefined,
      status: data.status || undefined,
      remarks: data.remarks !== undefined ? data.remarks : undefined,
      verifierRemarks: data.verifierRemarks || undefined,
      modifiedOn: new Date(),
      modifiedBy: username,
    };

    // Remove undefined values
    Object.keys(updatePayload).forEach(key => {
      if (updatePayload[key] === undefined) {
        delete updatePayload[key];
      }
    });

    const [count] = await Transactions.update(updatePayload, { 
      where: { 
        id: id, 
        isDeleted: 0,
        status: { [Op.ne]: "Deleted" }
      } 
    });
    
    if (!count) return respond(res, 404, "Transaction not found", null);
    
    const updated = await Transactions.findByPk(id, {
      include: [
        { model: Sacco, as: 'sacco' },
        { 
          model: Accounts, 
          as: 'memberAccount',
          include: [
            { model: Members, as: 'member' },
            { model: Products, as: 'product' }
          ],
          required: false
        },
        { 
          model: GLAccounts, 
          as: 'glAccount',
          include: [
            { model: Sacco, as: 'sacco' }
          ],
          required: false
        }
      ]
    });
    
    respond(res, 200, "Transaction updated", updated);
  } catch (err) {
    console.error("Error updating transaction:", err);
    respond(res, 500, `Server error: ${err.message}`, null);
  }
});

// Soft delete transaction
router.delete("/:id", validateToken, logDeleteOperation("Transaction"), async (req, res) => {
  const dbTransaction = await sequelize.transaction();
  
  try {
    // Validate that the ID is a number
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      await dbTransaction.rollback();
      return respond(res, 400, "Invalid transaction ID. ID must be a number.", null);
    }
    
    // First, get the transaction to find its reference number
    const transaction = await Transactions.findOne({
      where: { id: id, isDeleted: 0 },
      transaction: dbTransaction
    });
    
    if (!transaction) {
      await dbTransaction.rollback();
      return respond(res, 404, "Transaction not found", null);
    }
    
    // Get all transactions with the same reference number
    const relatedTransactions = await Transactions.findAll({
      where: { 
        referenceNumber: transaction.referenceNumber,
        isDeleted: 0,
        status: { [Op.ne]: "Deleted" }
      },
      transaction: dbTransaction
    });
    
    // Reverse account balances for all related transactions
    for (const txn of relatedTransactions) {
      const amount = parseFloat(txn.amount);
      
      if (txn.entryType === 'DEBIT') {
        // Reverse debit: add back to debit account
        await Accounts.update(
          { 
            availableBalance: sequelize.literal(`availableBalance + ${amount}`),
            modifiedOn: new Date(),
            modifiedBy: req.user?.username || "System"
          },
          { 
            where: { accountId: txn.accountId },
            transaction: dbTransaction
          }
        );
      } else if (txn.entryType === 'CREDIT') {
        // Reverse credit: subtract from credit account
        await Accounts.update(
          { 
            availableBalance: sequelize.literal(`availableBalance - ${amount}`),
            modifiedOn: new Date(),
            modifiedBy: req.user?.username || "System"
          },
          { 
            where: { accountId: txn.accountId },
            transaction: dbTransaction
          }
        );
      }
    }
    
    // Mark all related transactions as deleted
    const [count] = await Transactions.update({ 
      isDeleted: 1, 
      status: "Deleted",
      modifiedOn: new Date(),
      modifiedBy: req.user?.username || "System"
    }, { 
      where: { 
        referenceNumber: transaction.referenceNumber,
        isDeleted: 0
      },
      transaction: dbTransaction
    });
    
    await dbTransaction.commit();
    
    if (!count) return respond(res, 404, "Transaction not found", null);
    
    respond(res, 200, "Transaction deleted and balances reversed", null);
  } catch (err) {
    await dbTransaction.rollback();
    console.error("Error deleting transaction:", err);
    respond(res, 500, `Server error: ${err.message}`, null);
  }
});

// Create cash transaction with double-entry
router.post("/cash", validateToken, logCreateOperation("Cash Transaction"), async (req, res) => {
  const dbTransaction = await sequelize.transaction();
  
  try {
    const data = req.body || {};
    const username = req.user?.username || "System";
    
    console.log("Creating cash transaction with data:", data);
    
    // Validate required fields
    if (!data.saccoId) {
      await dbTransaction.rollback();
      return respond(res, 400, "Sacco ID is required", null);
    }
    if (!data.memberAccountId) {
      await dbTransaction.rollback();
      return respond(res, 400, "Member Account ID is required", null);
    }
    if (!data.tillGlAccountId) {
      await dbTransaction.rollback();
      return respond(res, 400, "Till GL Account ID is required", null);
    }
    if (!data.amount || data.amount <= 0) {
      await dbTransaction.rollback();
      return respond(res, 400, "Valid amount is required", null);
    }
    if (!data.transactionType || !['debit', 'credit'].includes(data.transactionType)) {
      await dbTransaction.rollback();
      return respond(res, 400, "Transaction type must be 'debit' or 'credit'", null);
    }

    console.log("Looking up accounts...");
    
    // Verify member account exists
    const memberAccount = await Accounts.findOne({ 
      where: { accountId: data.memberAccountId },
      include: [{ model: Members, as: 'member' }],
      transaction: dbTransaction
    });

    if (!memberAccount) {
      await dbTransaction.rollback();
      return respond(res, 400, "Member account not found", null);
    }

    // Verify till GL account exists
    const tillGlAccount = await GLAccounts.findOne({ 
      where: { glAccountId: data.tillGlAccountId },
      transaction: dbTransaction
    });

    if (!tillGlAccount) {
      await dbTransaction.rollback();
      return respond(res, 400, "Till GL account not found", null);
    }

    // Check if accounts belong to the same SACCO
    const memberSaccoId = memberAccount.saccoId?.toString().trim();
    const tillSaccoId = tillGlAccount.saccoId?.toString().trim();
    const requestSaccoId = data.saccoId?.toString().trim();
    
    console.log("SACCO ID validation:");
    console.log(`  Request SACCO ID: "${requestSaccoId}"`);
    console.log(`  Member Account SACCO ID: "${memberSaccoId}"`);
    console.log(`  Till GL Account SACCO ID: "${tillSaccoId}"`);
    
    if (!memberSaccoId || !tillSaccoId || !requestSaccoId) {
      await dbTransaction.rollback();
      return respond(res, 400, "SACCO ID is missing from accounts or request", null);
    }
    
    if (memberSaccoId !== requestSaccoId || tillSaccoId !== requestSaccoId) {
      await dbTransaction.rollback();
      return respond(res, 400, `Accounts must belong to the same SACCO. Member: ${memberSaccoId}, Till: ${tillSaccoId}, Request: ${requestSaccoId}`, null);
    }

    // Check if till has sufficient balance for withdrawals
    if (data.transactionType === 'debit' && tillGlAccount.availableBalance < parseFloat(data.amount)) {
      await dbTransaction.rollback();
      return respond(res, 400, "Insufficient balance in till", null);
    }

    const referenceNumber = generateReferenceNumber();
    const amount = parseFloat(data.amount);
    
    console.log("Creating cash transaction entries...");
    
    // Determine debit and credit accounts based on transaction type
    let debitAccountId, creditAccountId;
    
    if (data.transactionType === 'debit') {
      // Member withdrawal: Debit member account, Credit till
      debitAccountId = data.memberAccountId;
      creditAccountId = data.tillGlAccountId;
    } else {
      // Member deposit: Debit till, Credit member account
      debitAccountId = data.tillGlAccountId;
      creditAccountId = data.memberAccountId;
    }
    
    // Determine if transaction is being approved on creation
    const status = data.status || "Pending";
    const isApproved = status === "Approved";
    
    // Create debit entry
    const debitEntry = await Transactions.create({
      transactionId: generateTransactionId(),
      referenceNumber,
      saccoId: data.saccoId,
      accountId: debitAccountId,
      entryType: 'DEBIT',
      amount: amount,
      type: data.transactionType === 'debit' ? 'WITHDRAWAL' : 'DEPOSIT',
      status: status,
      remarks: data.remarks || null,
      createdOn: new Date(),
      createdBy: username,
      approvedBy: isApproved ? username : null,
      approvedOn: isApproved ? new Date() : null,
    }, { transaction: dbTransaction });

    // Create credit entry
    const creditEntry = await Transactions.create({
      transactionId: generateTransactionId(),
      referenceNumber,
      saccoId: data.saccoId,
      accountId: creditAccountId,
      entryType: 'CREDIT',
      amount: amount,
      type: data.transactionType === 'debit' ? 'WITHDRAWAL' : 'DEPOSIT',
      status: status,
      remarks: data.remarks || null,
      createdOn: new Date(),
      createdBy: username,
      approvedBy: isApproved ? username : null,
      approvedOn: isApproved ? new Date() : null,
    }, { transaction: dbTransaction });

    console.log("Cash transaction entries created successfully");

    // Update account balances based on transaction status
    if (data.status === "Approved") {
      console.log("Updating account balances for approved cash transaction...");
      
      // Update debit account balance
      if (data.transactionType === 'debit') {
        // Member withdrawal: debit is member account
        await sequelize.query(
          `UPDATE accounts 
           SET clearBalance = clearBalance - :amount,
               availableBalance = (clearBalance - :amount) + unsupervisedCredits - unsupervisedDebits - frozenAmount - pendingCharges,
               modifiedOn = :modifiedOn,
               modifiedBy = :modifiedBy
           WHERE accountId = :accountId`,
          { 
            replacements: { 
              amount: amount,
              accountId: debitAccountId,
              modifiedOn: new Date(),
              modifiedBy: username
            },
            transaction: dbTransaction
          }
        );
      } else {
        // Member deposit: debit is till GL account
        await GLAccounts.update(
          { 
            availableBalance: sequelize.literal(`availableBalance - ${amount}`),
            modifiedOn: new Date(),
            modifiedBy: username
          },
          { 
            where: { glAccountId: debitAccountId },
            transaction: dbTransaction
          }
        );
      }

      // Update credit account balance
      if (data.transactionType === 'debit') {
        // Member withdrawal: credit is till GL account
        await GLAccounts.update(
          { 
            availableBalance: sequelize.literal(`availableBalance + ${amount}`),
            modifiedOn: new Date(),
            modifiedBy: username
          },
          { 
            where: { glAccountId: creditAccountId },
            transaction: dbTransaction
          }
        );
      } else {
        // Member deposit: credit is member account
        await sequelize.query(
          `UPDATE accounts 
           SET clearBalance = clearBalance + :amount,
               availableBalance = (clearBalance + :amount) + unsupervisedCredits - unsupervisedDebits - frozenAmount - pendingCharges,
               modifiedOn = :modifiedOn,
               modifiedBy = :modifiedBy
           WHERE accountId = :accountId`,
          { 
            replacements: { 
              amount: amount,
              accountId: creditAccountId,
              modifiedOn: new Date(),
              modifiedBy: username
            },
            transaction: dbTransaction
          }
        );
      }
    } else {
      console.log("Updating pending balances for cash transaction with status:", data.status);
      
      // Update pending balances for pending transactions
      // BOTH debit and credit sides need to be updated with unsupervised fields
      
      if (data.transactionType === 'debit') {
        // Member withdrawal: debit is member account, credit is till
        // Update member account unsupervised debits in ONE query
        await sequelize.query(
          `UPDATE accounts 
           SET unsupervisedDebits = unsupervisedDebits + :amount,
               availableBalance = clearBalance + unsupervisedCredits - (unsupervisedDebits + :amount) - frozenAmount - pendingCharges,
               modifiedOn = :modifiedOn,
               modifiedBy = :modifiedBy
           WHERE accountId = :accountId`,
          { 
            replacements: { 
              amount: amount,
              accountId: debitAccountId,
              modifiedOn: new Date(),
              modifiedBy: username
            },
            transaction: dbTransaction
          }
        );
      }

      if (data.transactionType === 'credit') {
        // Member deposit: credit is member account, debit is till
        // Update member account unsupervised credits in ONE query
        await sequelize.query(
          `UPDATE accounts 
           SET unsupervisedCredits = unsupervisedCredits + :amount,
               availableBalance = clearBalance + (unsupervisedCredits + :amount) - unsupervisedDebits - frozenAmount - pendingCharges,
               modifiedOn = :modifiedOn,
               modifiedBy = :modifiedBy
           WHERE accountId = :accountId`,
          { 
            replacements: { 
              amount: amount,
              accountId: creditAccountId,
              modifiedOn: new Date(),
              modifiedBy: username
            },
            transaction: dbTransaction
          }
        );
      }
    }
    
    await dbTransaction.commit();
    console.log("Cash transaction committed successfully");
    
    // Fetch both entries with all associations
    const transactionEntries = await Transactions.findAll({
      where: { referenceNumber },
      include: [
        { model: Sacco, as: 'sacco' },
        { 
          model: Accounts, 
          as: 'memberAccount',
          include: [
            { model: Members, as: 'member' },
            { model: Products, as: 'product' }
          ],
          required: false
        },
        { 
          model: GLAccounts, 
          as: 'glAccount',
          include: [
            { model: Sacco, as: 'sacco' }
          ],
          required: false
        }
      ],
      order: [['entryType', 'ASC']]
    });
    
    respond(res, 201, "Cash transaction created with double-entry", transactionEntries);
  } catch (err) {
    await dbTransaction.rollback();
    console.error("Error creating cash transaction:", err);
    respond(res, 500, `Server error: ${err.message}`, null);
  }
});

module.exports = router;