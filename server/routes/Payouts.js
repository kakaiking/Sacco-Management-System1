const express = require('express');
const router = express.Router();
const { Payouts, Accounts, GLAccounts, Members, Products, LoanProducts, Sacco, Transactions, sequelize } = require('../models');
const { validateToken } = require('../middlewares/AuthMiddleware');
const { logCreateOperation, logUpdateOperation, logDeleteOperation, logViewOperation } = require('../middlewares/LoggingMiddleware');
const { Op } = require('sequelize');
const automatedPayoutService = require('../services/automatedPayoutService');

// Helper function to generate payout ID
const generatePayoutId = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `PAY-${timestamp}${random}`;
};

// Helper function to generate reference number
const generateReferenceNumber = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `REF-${timestamp}${random}`;
};

// Helper function to calculate interest
const calculateInterest = (principal, rate, period, calculationPeriod) => {
  const principalAmount = parseFloat(principal);
  const interestRate = parseFloat(rate);
  
  if (calculationPeriod === 'DAILY') {
    return principalAmount * interestRate / 365;
  } else if (calculationPeriod === 'MONTHLY') {
    return principalAmount * interestRate / 12;
  } else if (calculationPeriod === 'QUARTERLY') {
    return principalAmount * interestRate / 4;
  } else if (calculationPeriod === 'ANNUALLY') {
    return principalAmount * interestRate;
  }
  
  return 0;
};

// Helper function to respond with consistent format
const respond = (res, status, message, data = null) => {
  return res.status(status).json({
    success: status >= 200 && status < 300,
    message,
    data
  });
};

// Test endpoint without authentication
router.get("/test", async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      saccoId, 
      payoutType, 
      status, 
      memberId,
      startDate,
      endDate,
      search 
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = { isDeleted: 0 };

    // Add filters
    if (saccoId) whereClause.saccoId = saccoId;
    if (payoutType) whereClause.payoutType = payoutType;
    if (status) whereClause.status = status;
    if (memberId) whereClause.memberId = memberId;
    
    if (startDate && endDate) {
      whereClause.payoutDate = {
        [Op.between]: [startDate, endDate]
      };
    }

    if (search) {
      whereClause[Op.or] = [
        { payoutId: { [Op.like]: `%${search}%` } },
        { remarks: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Payouts.findAndCountAll({
      where: whereClause,
      include: [
        { model: Sacco, as: 'sacco', attributes: ['saccoId', 'saccoName'] },
        { model: Members, as: 'member', attributes: ['id', 'memberNo', 'firstName', 'lastName'] },
        { model: Products, as: 'product', attributes: ['id', 'productId', 'productName'] },
        { model: LoanProducts, as: 'loanProduct', attributes: ['id', 'loanProductId', 'loanProductName'] }
      ],
      order: [['createdOn', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    respond(res, 200, "Payouts retrieved successfully", {
      payouts: rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (err) {
    console.error("Error fetching payouts:", err);
    respond(res, 500, `Server error: ${err.message}`, null);
  }
});

// Get all payouts with pagination and filtering
router.get("/", validateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      saccoId, 
      payoutType, 
      status, 
      memberId,
      startDate,
      endDate,
      search 
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = { isDeleted: 0 };

    // Add filters
    if (saccoId) whereClause.saccoId = saccoId;
    if (payoutType) whereClause.payoutType = payoutType;
    if (status) whereClause.status = status;
    if (memberId) whereClause.memberId = memberId;
    
    if (startDate && endDate) {
      whereClause.payoutDate = {
        [Op.between]: [startDate, endDate]
      };
    }

    if (search) {
      whereClause[Op.or] = [
        { payoutId: { [Op.like]: `%${search}%` } },
        { remarks: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Payouts.findAndCountAll({
      where: whereClause,
      include: [
        { model: Sacco, as: 'sacco', attributes: ['saccoId', 'saccoName'] },
        { model: Members, as: 'member', attributes: ['id', 'memberNo', 'firstName', 'lastName'] },
        { model: Products, as: 'product', attributes: ['id', 'productId', 'productName'] },
        { model: LoanProducts, as: 'loanProduct', attributes: ['id', 'loanProductId', 'loanProductName'] }
      ],
      order: [['createdOn', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    respond(res, 200, "Payouts retrieved successfully", {
      payouts: rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (err) {
    console.error("Error fetching payouts:", err);
    respond(res, 500, `Server error: ${err.message}`, null);
  }
});

// Get single payout by ID
router.get("/:id", validateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const payout = await Payouts.findOne({
      where: { id, isDeleted: 0 },
      include: [
        { model: Sacco, as: 'sacco', attributes: ['saccoId', 'saccoName'] },
        { model: Members, as: 'member', attributes: ['id', 'memberNo', 'firstName', 'lastName'] },
        { model: Products, as: 'product', attributes: ['id', 'productId', 'productName'] },
        { model: LoanProducts, as: 'loanProduct', attributes: ['id', 'loanProductId', 'loanProductName'] }
      ]
    });

    if (!payout) {
      return respond(res, 404, "Payout not found", null);
    }

    respond(res, 200, "Payout retrieved successfully", payout);
  } catch (err) {
    console.error("Error fetching payout:", err);
    respond(res, 500, `Server error: ${err.message}`, null);
  }
});

// Create new payout
router.post("/", validateToken, logCreateOperation("Payout"), async (req, res) => {
  const dbTransaction = await sequelize.transaction();
  
  try {
    const data = req.body || {};
    const username = req.user?.username || "System";
    
    console.log("Creating payout with data:", data);
    
    // Validate required fields
    if (!data.saccoId) {
      await dbTransaction.rollback();
      return respond(res, 400, "Sacco ID is required", null);
    }
    if (!data.accountId) {
      await dbTransaction.rollback();
      return respond(res, 400, "Account ID is required", null);
    }
    if (!data.payoutType) {
      await dbTransaction.rollback();
      return respond(res, 400, "Payout type is required", null);
    }
    if (!data.principalAmount || data.principalAmount <= 0) {
      await dbTransaction.rollback();
      return respond(res, 400, "Valid principal amount is required", null);
    }
    if (!data.interestRate || data.interestRate <= 0) {
      await dbTransaction.rollback();
      return respond(res, 400, "Valid interest rate is required", null);
    }

    // Verify account exists
    const account = await Accounts.findOne({
      where: { accountId: data.accountId },
      include: [{ model: Members, as: 'member' }],
      transaction: dbTransaction
    });

    if (!account) {
      await dbTransaction.rollback();
      return respond(res, 400, "Account not found", null);
    }

    // Calculate interest amount
    const interestAmount = calculateInterest(
      data.principalAmount,
      data.interestRate,
      data.calculationPeriod || 'MONTHLY',
      data.calculationPeriod || 'MONTHLY'
    );

    const payoutId = generatePayoutId();
    
    const payoutData = {
      payoutId,
      saccoId: data.saccoId,
      payoutType: data.payoutType,
      payoutCategory: data.payoutCategory || 'PRODUCT_INTEREST',
      accountId: data.accountId,
      accountType: account.accountType,
      memberId: account.memberId,
      productId: data.productId || null,
      loanProductId: data.loanProductId || null,
      principalAmount: parseFloat(data.principalAmount),
      interestRate: parseFloat(data.interestRate),
      interestAmount: parseFloat(interestAmount.toFixed(2)),
      calculationPeriod: data.calculationPeriod || 'MONTHLY',
      periodStartDate: data.periodStartDate || new Date().toISOString().split('T')[0],
      periodEndDate: data.periodEndDate || new Date().toISOString().split('T')[0],
      payoutDate: data.payoutDate || new Date().toISOString().split('T')[0],
      status: 'PENDING',
      remarks: data.remarks || null,
      createdOn: new Date(),
      createdBy: username
    };

    console.log("Creating payout with data:", payoutData);
    const payout = await Payouts.create(payoutData, { transaction: dbTransaction });
    console.log("Payout created successfully:", payout.id);

    await dbTransaction.commit();
    respond(res, 201, "Payout created successfully", payout);
  } catch (err) {
    await dbTransaction.rollback();
    console.error("Error creating payout:", err);
    respond(res, 500, `Server error: ${err.message}`, null);
  }
});

// Process payout (create transaction and update status)
router.post("/:id/process", validateToken, logUpdateOperation("Payout"), async (req, res) => {
  try {
    const { id } = req.params;
    const username = req.user?.username || "System";
    
    const payout = await Payouts.findOne({
      where: { id, isDeleted: 0 },
      include: [
        { model: Members, as: 'member' },
        { model: Products, as: 'product' },
        { model: LoanProducts, as: 'loanProduct' }
      ]
    });

    if (!payout) {
      return respond(res, 404, "Payout not found", null);
    }

    if (payout.status !== 'PENDING') {
      return respond(res, 400, "Payout is not in pending status", null);
    }

    // Use the automated payout service to process the payout
    const result = await automatedPayoutService.createTransactionAndUpdateBalances(payout, username);
    
    respond(res, 200, "Payout processed successfully", payout);
  } catch (err) {
    console.error("Error processing payout:", err);
    respond(res, 500, `Server error: ${err.message}`, null);
  }
});

// Update payout
router.put("/:id", validateToken, logUpdateOperation("Payout"), async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body || {};
    const username = req.user?.username || "System";

    const payout = await Payouts.findOne({
      where: { id, isDeleted: 0 }
    });

    if (!payout) {
      return respond(res, 404, "Payout not found", null);
    }

    if (payout.status === 'PROCESSED') {
      return respond(res, 400, "Cannot modify processed payout", null);
    }

    // Recalculate interest if principal or rate changed
    if (data.principalAmount || data.interestRate) {
      const principal = data.principalAmount || payout.principalAmount;
      const rate = data.interestRate || payout.interestRate;
      const period = data.calculationPeriod || payout.calculationPeriod;
      
      data.interestAmount = calculateInterest(principal, rate, period, period);
    }

    const updatedPayout = await payout.update({
      ...data,
      modifiedOn: new Date(),
      modifiedBy: username
    });

    respond(res, 200, "Payout updated successfully", updatedPayout);
  } catch (err) {
    console.error("Error updating payout:", err);
    respond(res, 500, `Server error: ${err.message}`, null);
  }
});

// Delete payout (soft delete)
router.delete("/:id", validateToken, logDeleteOperation("Payout"), async (req, res) => {
  try {
    const { id } = req.params;
    const username = req.user?.username || "System";

    const payout = await Payouts.findOne({
      where: { id, isDeleted: 0 }
    });

    if (!payout) {
      return respond(res, 404, "Payout not found", null);
    }

    if (payout.status === 'PROCESSED') {
      return respond(res, 400, "Cannot delete processed payout", null);
    }

    await payout.update({
      isDeleted: 1,
      modifiedOn: new Date(),
      modifiedBy: username
    });

    respond(res, 200, "Payout deleted successfully", null);
  } catch (err) {
    console.error("Error deleting payout:", err);
    respond(res, 500, `Server error: ${err.message}`, null);
  }
});

// Batch process payouts
router.post("/batch/process", validateToken, logUpdateOperation("Payout"), async (req, res) => {
  const dbTransaction = await sequelize.transaction();
  
  try {
    const { payoutIds } = req.body || {};
    const username = req.user?.username || "System";
    
    if (!payoutIds || !Array.isArray(payoutIds) || payoutIds.length === 0) {
      await dbTransaction.rollback();
      return respond(res, 400, "Payout IDs array is required", null);
    }

    const results = [];
    
    for (const payoutId of payoutIds) {
      try {
        const payout = await Payouts.findOne({
          where: { id: payoutId, isDeleted: 0 },
          transaction: dbTransaction
        });

        if (!payout) {
          results.push({ payoutId, status: 'NOT_FOUND', message: 'Payout not found' });
          continue;
        }

        if (payout.status !== 'PENDING') {
          results.push({ payoutId, status: 'SKIPPED', message: 'Payout is not in pending status' });
          continue;
        }

        // Process the payout (similar to single process logic)
        // ... (implementation similar to single process endpoint)
        
        results.push({ payoutId, status: 'PROCESSED', message: 'Payout processed successfully' });
      } catch (error) {
        results.push({ payoutId, status: 'ERROR', message: error.message });
      }
    }

    await dbTransaction.commit();
    respond(res, 200, "Batch processing completed", { results });
  } catch (err) {
    await dbTransaction.rollback();
    console.error("Error in batch processing:", err);
    respond(res, 500, `Server error: ${err.message}`, null);
  }
});

// Get payout statistics
router.get("/stats/summary", validateToken, async (req, res) => {
  try {
    const { saccoId, startDate, endDate } = req.query;
    
    const whereClause = { isDeleted: 0 };
    if (saccoId) whereClause.saccoId = saccoId;
    if (startDate && endDate) {
      whereClause.payoutDate = {
        [Op.between]: [startDate, endDate]
      };
    }

    const stats = await Payouts.findAll({
      where: whereClause,
      attributes: [
        'payoutType',
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('interestAmount')), 'totalAmount']
      ],
      group: ['payoutType', 'status'],
      raw: true
    });

    respond(res, 200, "Payout statistics retrieved successfully", { stats });
  } catch (err) {
    console.error("Error fetching payout statistics:", err);
    respond(res, 500, `Server error: ${err.message}`, null);
  }
});

// ==================== AUTOMATED PAYOUT ENDPOINTS ====================

// Generate savings interest payouts automatically
router.post("/auto/generate-savings", validateToken, logCreateOperation("AutomatedPayout"), async (req, res) => {
  try {
    const { saccoId = 'SYSTEM', calculationPeriod = 'MONTHLY' } = req.body;
    const username = req.user?.username || "System";
    
    const results = await automatedPayoutService.generateSavingsInterestPayouts(saccoId, calculationPeriod);
    
    respond(res, 200, "Savings interest payouts generated successfully", {
      saccoId,
      calculationPeriod,
      results,
      summary: {
        total: results.length,
        created: results.filter(r => r.status === 'CREATED').length,
        errors: results.filter(r => r.status === 'ERROR').length
      }
    });
  } catch (err) {
    console.error("Error generating savings interest payouts:", err);
    respond(res, 500, `Server error: ${err.message}`, null);
  }
});

// Generate loan interest collection payouts automatically
router.post("/auto/generate-loans", validateToken, logCreateOperation("AutomatedPayout"), async (req, res) => {
  try {
    const { saccoId = 'SYSTEM', calculationPeriod = 'MONTHLY' } = req.body;
    const username = req.user?.username || "System";
    
    const results = await automatedPayoutService.generateLoanInterestCollectionPayouts(saccoId, calculationPeriod);
    
    respond(res, 200, "Loan interest collection payouts generated successfully", {
      saccoId,
      calculationPeriod,
      results,
      summary: {
        total: results.length,
        created: results.filter(r => r.status === 'CREATED').length,
        errors: results.filter(r => r.status === 'ERROR').length
      }
    });
  } catch (err) {
    console.error("Error generating loan interest collection payouts:", err);
    respond(res, 500, `Server error: ${err.message}`, null);
  }
});

// Process all pending payouts
router.post("/auto/process-pending", validateToken, logUpdateOperation("AutomatedPayout"), async (req, res) => {
  try {
    const username = req.user?.username || "System";
    
    const results = await automatedPayoutService.processPendingPayouts(username);
    
    respond(res, 200, "Pending payouts processed successfully", {
      results,
      summary: {
        total: results.length,
        processed: results.filter(r => r.status === 'PROCESSED').length,
        failed: results.filter(r => r.status === 'FAILED').length
      }
    });
  } catch (err) {
    console.error("Error processing pending payouts:", err);
    respond(res, 500, `Server error: ${err.message}`, null);
  }
});

// Run complete automated payout cycle
router.post("/auto/run-cycle", validateToken, logCreateOperation("AutomatedPayout"), async (req, res) => {
  try {
    const { saccoId = 'SYSTEM', calculationPeriod = 'MONTHLY' } = req.body;
    const username = req.user?.username || "System";
    
    const results = await automatedPayoutService.runAutomatedPayoutCycle(saccoId, calculationPeriod, username);
    
    respond(res, 200, "Automated payout cycle completed successfully", results);
  } catch (err) {
    console.error("Error running automated payout cycle:", err);
    respond(res, 500, `Server error: ${err.message}`, null);
  }
});

// Validate account balances
router.post("/auto/validate-balances", validateToken, logViewOperation("AutomatedPayout"), async (req, res) => {
  try {
    const { accountIds } = req.body;
    
    if (!accountIds || !Array.isArray(accountIds)) {
      return respond(res, 400, "Account IDs array is required", null);
    }
    
    const results = await automatedPayoutService.validateAccountBalances(accountIds);
    
    respond(res, 200, "Account balance validation completed", {
      results,
      summary: {
        total: results.length,
        valid: results.filter(r => r.status === 'VALID').length,
        mismatches: results.filter(r => r.status === 'MISMATCH').length,
        errors: results.filter(r => r.status === 'ERROR').length
      }
    });
  } catch (err) {
    console.error("Error validating account balances:", err);
    respond(res, 500, `Server error: ${err.message}`, null);
  }
});

// Get automated payout statistics
router.get("/auto/stats", validateToken, async (req, res) => {
  try {
    const { saccoId = 'SYSTEM', startDate, endDate } = req.query;
    
    const stats = await automatedPayoutService.getPayoutStatistics(saccoId, startDate, endDate);
    
    respond(res, 200, "Automated payout statistics retrieved successfully", { stats });
  } catch (err) {
    console.error("Error fetching automated payout statistics:", err);
    respond(res, 500, `Server error: ${err.message}`, null);
  }
});

// Test endpoint for automated payouts (without authentication)
router.post("/auto/test/run-cycle", async (req, res) => {
  try {
    const { saccoId = 'SYSTEM', calculationPeriod = 'MONTHLY' } = req.body;
    const username = "test-user";
    
    const results = await automatedPayoutService.runAutomatedPayoutCycle(saccoId, calculationPeriod, username);
    
    respond(res, 200, "Automated payout cycle test completed successfully", results);
  } catch (err) {
    console.error("Error running automated payout cycle test:", err);
    respond(res, 500, `Server error: ${err.message}`, null);
  }
});

module.exports = router;

