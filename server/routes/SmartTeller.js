const express = require("express");
const router = express.Router();
const { sequelize } = require("../models");
const { Transactions, Accounts, GLAccounts, Sacco, Members, Products } = require("../models");
const { validateToken } = require("../middlewares/AuthMiddleware");
const { logCreateOperation, logUpdateOperation, logDeleteOperation } = require("../middlewares/LoggingMiddleware");

// Helper function to respond with consistent format
const respond = (res, status, message, data = null) => {
  res.status(status).json({
    success: status >= 200 && status < 300,
    message,
    entity: data
  });
};

// Generate unique reference number for Smart Teller transactions
const generateReferenceNumber = () => {
  const randomNum = Math.floor(1000000 + Math.random() * 9000000); // 7 digits
  return `REF-${randomNum}`;
};

// Create Smart Teller transaction with multiple entries
router.post("/", validateToken, logCreateOperation("SmartTeller"), async (req, res) => {
  const dbTransaction = await sequelize.transaction();
  
  try {
    const data = req.body || {};
    const username = req.user?.username || "System";
    
    console.log("Creating Smart Teller transaction with data:", data);
    
    // Validate required fields
    if (!data.saccoId) {
      await dbTransaction.rollback();
      return respond(res, 400, "Sacco ID is required", null);
    }

    if (!data.entries || !Array.isArray(data.entries) || data.entries.length < 2) {
      await dbTransaction.rollback();
      return respond(res, 400, "At least two entries are required", null);
    }

    // Validate entries
    const validEntries = data.entries.filter(entry => 
      entry.accountId && entry.amount && parseFloat(entry.amount) > 0
    );

    if (validEntries.length < 2) {
      await dbTransaction.rollback();
      return respond(res, 400, "At least two valid entries are required", null);
    }

    // Check if we have both debit and credit entries
    const hasDebit = validEntries.some(entry => entry.type === "debit");
    const hasCredit = validEntries.some(entry => entry.type === "credit");

    if (!hasDebit || !hasCredit) {
      await dbTransaction.rollback();
      return respond(res, 400, "At least one debit and one credit entry are required", null);
    }

    // Calculate totals and validate balance
    const totalDebits = validEntries
      .filter(entry => entry.type === "debit")
      .reduce((sum, entry) => sum + parseFloat(entry.amount), 0);

    const totalCredits = validEntries
      .filter(entry => entry.type === "credit")
      .reduce((sum, entry) => sum + parseFloat(entry.amount), 0);

    const balance = totalDebits - totalCredits;

    if (Math.abs(balance) > 0.01) { // Allow for small floating point differences
      await dbTransaction.rollback();
      return respond(res, 400, `Transaction is not balanced. Difference: ${balance.toFixed(2)}`, null);
    }

    // Generate reference number
    const referenceNumber = generateReferenceNumber();

    console.log("Looking up accounts...");
    
    // Verify all accounts exist and belong to the same sacco
    const accountLookups = await Promise.all(
      validEntries.map(async (entry) => {
        const [memberAccount, glAccount] = await Promise.all([
          Accounts.findOne({ 
            where: { accountId: entry.accountId },
            include: [{ model: Members, as: 'member' }],
            transaction: dbTransaction
          }),
          GLAccounts.findOne({ 
            where: { glAccountId: entry.accountId },
            transaction: dbTransaction
          })
        ]);

        const account = memberAccount || glAccount;
        if (!account) {
          throw new Error(`Account ${entry.accountId} not found`);
        }

        // Verify account belongs to the same sacco
        const accountSaccoId = account.saccoId || (account.sacco ? account.sacco.saccoId : null);
        if (accountSaccoId !== data.saccoId) {
          throw new Error(`Account ${entry.accountId} does not belong to the specified SACCO`);
        }

        return {
          entry,
          account,
          accountType: memberAccount ? 'MEMBER' : 'GL'
        };
      })
    );

    console.log("Creating transaction entries...");

    // Create transaction entries
    const transactionEntries = [];
    let entryCounter = 1;
    
    for (const { entry, account, accountType } of accountLookups) {
      // Generate unique transaction ID for each entry
      const uniqueTransactionId = `${data.transactionId}-${entry.type.toUpperCase()}-${entryCounter.toString().padStart(3, '0')}`;
      
      const transactionEntry = await Transactions.create({
        transactionId: uniqueTransactionId,
        referenceNumber,
        saccoId: data.saccoId,
        accountId: entry.accountId,
        accountType,
        entryType: entry.type.toUpperCase(),
        amount: parseFloat(entry.amount),
        type: data.transactionType || "TRANSFER",
        status: data.status || "Pending",
        remarks: data.remarks || "",
        createdBy: username,
        createdOn: new Date(),
        modifiedBy: username,
        modifiedOn: new Date()
      }, { transaction: dbTransaction });

      transactionEntries.push(transactionEntry);
      entryCounter++;
    }

    console.log("Updating account balances based on transaction status...");

    // Update account balances based on transaction status
    if (data.status === "Approved") {
      // Validate member account balances before processing
      for (const { entry, account, accountType } of accountLookups) {
        const amount = parseFloat(entry.amount);
        
        if (accountType === 'MEMBER' && entry.type === "debit") {
          // Check if member account has sufficient balance for debit
          const currentBalance = parseFloat(account.availableBalance);
          if (currentBalance < amount) {
            await dbTransaction.rollback();
            return respond(res, 400, `Insufficient balance in account ${account.accountId}. Available: ${currentBalance.toFixed(2)}, Required: ${amount.toFixed(2)}`, null);
          }
        }
      }
      
      // Process balance updates
      for (const { entry, account, accountType } of accountLookups) {
        const amount = parseFloat(entry.amount);
        
        if (accountType === 'MEMBER') {
          // For member accounts
          if (entry.type === "debit") {
            // Debit: decrease clear balance (for asset accounts)
            await Accounts.update(
              { 
                clearBalance: sequelize.literal(`clearBalance - ${amount}`),
                availableBalance: sequelize.literal(`availableBalance - ${amount}`),
                modifiedOn: new Date(),
                modifiedBy: username
              },
              { 
                where: { accountId: entry.accountId },
                transaction: dbTransaction
              }
            );
          } else {
            // Credit: increase clear balance
            await Accounts.update(
              { 
                clearBalance: sequelize.literal(`clearBalance + ${amount}`),
                availableBalance: sequelize.literal(`availableBalance + ${amount}`),
                modifiedOn: new Date(),
                modifiedBy: username
              },
              { 
                where: { accountId: entry.accountId },
                transaction: dbTransaction
              }
            );
          }
        } else {
          // For GL accounts - use availableBalance field
          if (entry.type === "debit") {
            // Debit: increase balance (for asset accounts)
            await GLAccounts.update(
              { 
                availableBalance: sequelize.literal(`availableBalance + ${amount}`),
                modifiedOn: new Date(),
                modifiedBy: username
              },
              { 
                where: { glAccountId: entry.accountId },
                transaction: dbTransaction
              }
            );
          } else {
            // Credit: decrease balance
            await GLAccounts.update(
              { 
                availableBalance: sequelize.literal(`availableBalance - ${amount}`),
                modifiedOn: new Date(),
                modifiedBy: username
              },
              { 
                where: { glAccountId: entry.accountId },
                transaction: dbTransaction
              }
            );
          }
        }
      }
    } else {
      console.log("Updating pending balances for Smart Teller transaction with status:", data.status);
      
      // Update pending balances for pending transactions
      for (const { entry, account, accountType } of accountLookups) {
        const amount = parseFloat(entry.amount);
        
        if (accountType === 'MEMBER') {
          // For member accounts
          if (entry.type === "debit") {
            // Debit: increase pending debit balance
            await Accounts.update(
              { 
                debitBalance: sequelize.literal(`debitBalance + ${amount}`),
                modifiedOn: new Date(),
                modifiedBy: username
              },
              { 
                where: { accountId: entry.accountId },
                transaction: dbTransaction
              }
            );
          } else {
            // Credit: increase pending credit balance
            await Accounts.update(
              { 
                creditBalance: sequelize.literal(`creditBalance + ${amount}`),
                modifiedOn: new Date(),
                modifiedBy: username
              },
              { 
                where: { accountId: entry.accountId },
                transaction: dbTransaction
              }
            );
          }
        }
      }
    }
    
    await dbTransaction.commit();
    console.log("Smart Teller transaction committed successfully");
    
    // Fetch all entries with associations
    const finalTransactionEntries = await Transactions.findAll({
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
      order: [['entryType', 'ASC'], ['createdOn', 'ASC']]
    });
    
    respond(res, 201, "Smart Teller transaction created successfully", finalTransactionEntries);
  } catch (err) {
    await dbTransaction.rollback();
    console.error("Error creating Smart Teller transaction:", err);
    respond(res, 500, `Server error: ${err.message}`, null);
  }
});

// Get Smart Teller transactions by reference number
router.get("/reference/:referenceNumber", validateToken, async (req, res) => {
  try {
    const { referenceNumber } = req.params;
    
    const transactions = await Transactions.findAll({
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
      order: [['entryType', 'ASC'], ['createdOn', 'ASC']]
    });

    if (transactions.length === 0) {
      return respond(res, 404, "Smart Teller transaction not found", null);
    }

    respond(res, 200, "Smart Teller transaction retrieved successfully", transactions);
  } catch (err) {
    console.error("Error retrieving Smart Teller transaction:", err);
    respond(res, 500, `Server error: ${err.message}`, null);
  }
});

// Get all Smart Teller transactions (with pagination)
router.get("/", validateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, saccoId } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {
      referenceNumber: {
        [sequelize.Op.like]: 'REF-%'
      }
    };

    if (status) {
      whereClause.status = status;
    }

    if (saccoId) {
      whereClause.saccoId = saccoId;
    }

    const { count, rows } = await Transactions.findAndCountAll({
      where: whereClause,
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
      order: [['createdOn', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    // Group transactions by reference number
    const groupedTransactions = {};
    rows.forEach(transaction => {
      const ref = transaction.referenceNumber;
      if (!groupedTransactions[ref]) {
        groupedTransactions[ref] = {
          referenceNumber: ref,
          saccoId: transaction.saccoId,
          sacco: transaction.sacco,
          status: transaction.status,
          createdBy: transaction.createdBy,
          createdOn: transaction.createdOn,
          modifiedBy: transaction.modifiedBy,
          modifiedOn: transaction.modifiedOn,
          entries: []
        };
      }
      groupedTransactions[ref].entries.push(transaction);
    });

    const smartTellerTransactions = Object.values(groupedTransactions);

    respond(res, 200, "Smart Teller transactions retrieved successfully", {
      transactions: smartTellerTransactions,
      totalCount: count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });
  } catch (err) {
    console.error("Error retrieving Smart Teller transactions:", err);
    respond(res, 500, `Server error: ${err.message}`, null);
  }
});

// Update Smart Teller transaction status
router.put("/:referenceNumber/status", validateToken, logUpdateOperation("SmartTeller"), async (req, res) => {
  const dbTransaction = await sequelize.transaction();
  
  try {
    const { referenceNumber } = req.params;
    const { status, remarks } = req.body;
    const username = req.user?.username || "System";

    if (!status) {
      await dbTransaction.rollback();
      return respond(res, 400, "Status is required", null);
    }

    // Get all transactions with this reference number
    const transactions = await Transactions.findAll({
      where: { referenceNumber },
      transaction: dbTransaction
    });

    if (transactions.length === 0) {
      await dbTransaction.rollback();
      return respond(res, 404, "Smart Teller transaction not found", null);
    }

    // Update all transactions
    await Transactions.update(
      {
        status,
        remarks: remarks || "",
        modifiedBy: username,
        modifiedOn: new Date(),
        ...(status === "Approved" && { approvedBy: username, approvedOn: new Date() })
      },
      {
        where: { referenceNumber },
        transaction: dbTransaction
      }
    );

    // Handle account balance updates based on status change
    const previousStatus = transactions[0].status;
    
    if (status === "Approved" && previousStatus !== "Approved") {
      // Validate member account balances before approving
      for (const transaction of transactions) {
        if (transaction.accountType === 'MEMBER' && transaction.entryType === "DEBIT") {
          // Get current account balance
          const account = await Accounts.findOne({
            where: { accountId: transaction.accountId },
            transaction: dbTransaction
          });
          
          if (account) {
            const currentBalance = parseFloat(account.availableBalance);
            const amount = parseFloat(transaction.amount);
            
            if (currentBalance < amount) {
              await dbTransaction.rollback();
              return respond(res, 400, `Insufficient balance in account ${account.accountId}. Available: ${currentBalance.toFixed(2)}, Required: ${amount.toFixed(2)}`, null);
            }
          }
        }
      }
      
      // Approving transaction - move from pending to clear balances
      for (const transaction of transactions) {
        const amount = transaction.amount;
        
        if (transaction.accountType === 'MEMBER') {
          // For member accounts
          if (transaction.entryType === "DEBIT") {
            // Debit: move from pending debit to clear balance decrease
            await Accounts.update(
              { 
                debitBalance: sequelize.literal(`debitBalance - ${amount}`),
                clearBalance: sequelize.literal(`clearBalance - ${amount}`),
                availableBalance: sequelize.literal(`availableBalance - ${amount}`),
                modifiedOn: new Date(),
                modifiedBy: username
              },
              { 
                where: { accountId: transaction.accountId },
                transaction: dbTransaction
              }
            );
          } else {
            // Credit: move from pending credit to clear balance increase
            await Accounts.update(
              { 
                creditBalance: sequelize.literal(`creditBalance - ${amount}`),
                clearBalance: sequelize.literal(`clearBalance + ${amount}`),
                availableBalance: sequelize.literal(`availableBalance + ${amount}`),
                modifiedOn: new Date(),
                modifiedBy: username
              },
              { 
                where: { accountId: transaction.accountId },
                transaction: dbTransaction
              }
            );
          }
        } else {
          // For GL accounts - use availableBalance field
          if (transaction.entryType === "DEBIT") {
            // Debit: increase balance (for asset accounts)
            await GLAccounts.update(
              { 
                availableBalance: sequelize.literal(`availableBalance + ${amount}`),
                modifiedOn: new Date(),
                modifiedBy: username
              },
              { 
                where: { glAccountId: transaction.accountId },
                transaction: dbTransaction
              }
            );
          } else {
            // Credit: decrease balance
            await GLAccounts.update(
              { 
                availableBalance: sequelize.literal(`availableBalance - ${amount}`),
                modifiedOn: new Date(),
                modifiedBy: username
              },
              { 
                where: { glAccountId: transaction.accountId },
                transaction: dbTransaction
              }
            );
          }
        }
      }
    } else if ((status === "Rejected" || status === "Cancelled") && previousStatus === "Approved") {
      // Rejecting or cancelling an approved transaction - reverse balance changes
      for (const transaction of transactions) {
        const amount = transaction.amount;
        
        if (transaction.accountType === 'MEMBER') {
          // For member accounts - reverse the previous balance change
          if (transaction.entryType === "DEBIT") {
            // Reverse debit: increase balance back
            await Accounts.update(
              { 
                availableBalance: sequelize.literal(`availableBalance + ${amount}`),
                modifiedOn: new Date(),
                modifiedBy: username
              },
              { 
                where: { accountId: transaction.accountId },
                transaction: dbTransaction
              }
            );
          } else {
            // Reverse credit: decrease balance back
            await Accounts.update(
              { 
                availableBalance: sequelize.literal(`availableBalance - ${amount}`),
                modifiedOn: new Date(),
                modifiedBy: username
              },
              { 
                where: { accountId: transaction.accountId },
                transaction: dbTransaction
              }
            );
          }
        } else {
          // For GL accounts - reverse the previous balance change
          if (transaction.entryType === "DEBIT") {
            // Reverse debit: decrease balance back
            await GLAccounts.update(
              { 
                availableBalance: sequelize.literal(`availableBalance - ${amount}`),
                modifiedOn: new Date(),
                modifiedBy: username
              },
              { 
                where: { glAccountId: transaction.accountId },
                transaction: dbTransaction
              }
            );
          } else {
            // Reverse credit: increase balance back
            await GLAccounts.update(
              { 
                availableBalance: sequelize.literal(`availableBalance + ${amount}`),
                modifiedOn: new Date(),
                modifiedBy: username
              },
              { 
                where: { glAccountId: transaction.accountId },
                transaction: dbTransaction
              }
            );
          }
        }
      }
    }

    await dbTransaction.commit();

    // Fetch updated transactions
    const updatedTransactions = await Transactions.findAll({
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
      order: [['entryType', 'ASC'], ['createdOn', 'ASC']]
    });

    respond(res, 200, "Smart Teller transaction status updated successfully", updatedTransactions);
  } catch (err) {
    await dbTransaction.rollback();
    console.error("Error updating Smart Teller transaction status:", err);
    respond(res, 500, `Server error: ${err.message}`, null);
  }
});

// Delete Smart Teller transaction
router.delete("/:referenceNumber", validateToken, logDeleteOperation("SmartTeller"), async (req, res) => {
  const dbTransaction = await sequelize.transaction();
  
  try {
    const { referenceNumber } = req.params;

    // Check if transaction exists
    const transactions = await Transactions.findAll({
      where: { referenceNumber },
      transaction: dbTransaction
    });

    if (transactions.length === 0) {
      await dbTransaction.rollback();
      return respond(res, 404, "Smart Teller transaction not found", null);
    }

    // Check if any transaction is already approved
    const approvedTransaction = transactions.find(t => t.status === "Approved");
    if (approvedTransaction) {
      await dbTransaction.rollback();
      return respond(res, 400, "Cannot delete approved transactions", null);
    }

    // Delete all transactions with this reference number
    await Transactions.destroy({
      where: { referenceNumber },
      transaction: dbTransaction
    });

    await dbTransaction.commit();

    respond(res, 200, "Smart Teller transaction deleted successfully", null);
  } catch (err) {
    await dbTransaction.rollback();
    console.error("Error deleting Smart Teller transaction:", err);
    respond(res, 500, `Server error: ${err.message}`, null);
  }
});

module.exports = router;
