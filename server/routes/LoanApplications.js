const express = require("express");
const router = express.Router();
const { LoanApplications, Members, LoanProducts } = require("../models");
const { validateToken } = require("../middlewares/AuthMiddleware");
const { logViewOperation, logCreateOperation, logUpdateOperation, logDeleteOperation } = require("../middlewares/LoggingMiddleware");
const { Op } = require("sequelize");

const respond = (res, code, message, entity) => {
  res.status(code).json({ code, message, entity });
};

// List with optional status filter and search
router.get("/", validateToken, logViewOperation("LoanApplication"), async (req, res) => {
  try {
    const { status, q } = req.query;
    const where = { 
      isDeleted: 0,
      status: { [Op.ne]: "Deleted" } // Exclude deleted loan applications
    };
    if (status) where.status = status;
    if (q) {
      where[Op.or] = [
        { loanApplicationId: { [Op.like]: `%${q}%` } },
        { loanName: { [Op.like]: `%${q}%` } },
        { status: { [Op.like]: `%${q}%` } },
      ];
    }
    const loanApplications = await LoanApplications.findAll({ 
      where, 
      include: [
        {
          model: Members,
          as: 'member',
          required: false
        },
        {
          model: LoanProducts,
          as: 'product',
          required: false,
          include: [
            {
              model: require("../models").AccountTypes,
              as: 'accountTypes',
              required: false,
              include: [
                {
                  model: require("../models").Currency,
                  as: 'currencyInfo',
                  required: false
                }
              ]
            }
          ]
        },
        {
          model: require("../models").Collateral,
          as: 'collaterals',
          required: false,
          through: {
            attributes: ['assignedValue', 'isPrimary']
          }
        }
      ],
      order: [["createdOn", "DESC"]] 
    });
    respond(res, 200, "Loan applications fetched", loanApplications);
  } catch (err) {
    respond(res, 500, err.message);
  }
});

// Get loan applications by member ID
router.get("/member/:memberId", validateToken, logViewOperation("LoanApplication"), async (req, res) => {
  try {
    const { memberId } = req.params;
    const { status } = req.query;
    
    const where = { 
      memberId: memberId,
      isDeleted: 0,
      status: { [Op.ne]: "Deleted" }
    };
    
    if (status) where.status = status;
    
    const loanApplications = await LoanApplications.findAll({ 
      where, 
      include: [
        {
          model: Members,
          as: 'member',
          required: false
        },
        {
          model: LoanProducts,
          as: 'product',
          required: false,
          include: [
            {
              model: require("../models").AccountTypes,
              as: 'accountTypes',
              required: false,
              include: [
                {
                  model: require("../models").Currency,
                  as: 'currencyInfo',
                  required: false
                }
              ]
            }
          ]
        },
        {
          model: require("../models").Collateral,
          as: 'collaterals',
          required: false,
          through: {
            attributes: ['assignedValue', 'isPrimary']
          }
        }
      ],
      order: [["createdOn", "DESC"]]
    });
    
    respond(res, 200, "Member loan applications fetched", loanApplications);
  } catch (err) {
    respond(res, 500, err.message);
  }
});

// Get one
router.get("/:id", validateToken, logViewOperation("LoanApplication"), async (req, res) => {
  try {
    const loanApplication = await LoanApplications.findByPk(req.params.id, {
      include: [
        {
          model: Members,
          as: 'member',
          required: false
        },
        {
          model: LoanProducts,
          as: 'product',
          required: false,
          include: [
            {
              model: require("../models").AccountTypes,
              as: 'accountTypes',
              required: false,
              include: [
                {
                  model: require("../models").Currency,
                  as: 'currencyInfo',
                  required: false
                }
              ]
            }
          ]
        }
      ]
    });
    if (!loanApplication || loanApplication.isDeleted || loanApplication.status === "Deleted") return respond(res, 404, "Not found");
    respond(res, 200, "Loan application fetched", loanApplication);
  } catch (err) {
    respond(res, 500, err.message);
  }
});

// Test endpoint without authentication
router.post("/test", async (req, res) => {
  try {
    console.log("=== LOAN APPLICATION CREATION TEST DEBUG ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    
    const data = req.body || {};
    const username = "test-user";
    
    // Validate required fields
    if (!data.loanName) {
      return respond(res, 400, "Loan name is required");
    }
    if (!data.memberId) {
      return respond(res, 400, "Member ID is required");
    }
    if (!data.productId) {
      return respond(res, 400, "Product ID is required");
    }
    if (!data.loanAmount || parseFloat(data.loanAmount) <= 0) {
      return respond(res, 400, "Valid loan amount is required");
    }
    
    // Verify member exists
    const member = await Members.findByPk(data.memberId);
    if (!member) {
      return respond(res, 400, "Member not found");
    }
    
    // Verify product exists
    const product = await LoanProducts.findByPk(data.productId);
    if (!product) {
      return respond(res, 400, "Loan product not found");
    }
    
    // Auto-generate loanApplicationId if not provided
    let loanApplicationId = data.loanApplicationId;
    if (!loanApplicationId) {
      const timestamp = Date.now().toString().slice(-6);
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      loanApplicationId = `LA-${timestamp}${randomNum}`;
    }
    
    const payload = {
      loanApplicationId: loanApplicationId,
      loanName: data.loanName,
      memberId: data.memberId,
      productId: data.productId,
      loanAmount: parseFloat(data.loanAmount),
      mainRepaymentAccountId: data.mainRepaymentAccountId || null,
      collateralId: data.collateralId || null,
      guarantors: data.guarantors ? JSON.stringify(data.guarantors) : null,
      status: data.status || "Pending Appraisal",
      remarks: data.remarks || null,
      createdOn: new Date(),
      createdBy: username,
    };
    
    console.log("Creating loan application with payload:", JSON.stringify(payload, null, 2));
    const created = await LoanApplications.create(payload);
    console.log("Loan application created successfully:", created.id);
    
    // Fetch the created application with member and product details
    const createdWithDetails = await LoanApplications.findByPk(created.id, {
      include: [
        {
          model: Members,
          as: 'member',
          required: false
        },
        {
          model: LoanProducts,
          as: 'product',
          required: false
        }
      ]
    });
    
    respond(res, 201, "Loan application created successfully (TEST MODE)", createdWithDetails);
  } catch (err) {
    console.error("=== LOAN APPLICATION CREATION ERROR ===");
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);
    console.error("Full error:", err);
    
    // Map common Sequelize errors to client-friendly messages
    if (err?.name === 'SequelizeUniqueConstraintError') {
      return respond(res, 400, 'Loan application ID already exists');
    }
    if (err?.name === 'SequelizeValidationError') {
      const detail = err?.errors?.[0]?.message || 'Validation error';
      return respond(res, 400, detail);
    }
    if (err?.name === 'SequelizeForeignKeyConstraintError') {
      return respond(res, 400, 'Invalid member ID');
    }
    respond(res, 500, err.message || 'Internal server error');
  }
});

// Create
router.post("/", validateToken, logCreateOperation("LoanApplication"), async (req, res) => {
  try {
    console.log("=== LOAN APPLICATION CREATION DEBUG ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    console.log("User:", req.user);
    
    const data = req.body || {};
    const username = req.user?.username || null;
    
    // Validate required fields
    if (!data.loanName) {
      return respond(res, 400, "Loan name is required");
    }
    if (!data.memberId) {
      return respond(res, 400, "Member ID is required");
    }
    if (!data.productId) {
      return respond(res, 400, "Product ID is required");
    }
    if (!data.loanAmount || parseFloat(data.loanAmount) <= 0) {
      return respond(res, 400, "Valid loan amount is required");
    }
    
    // Verify member exists
    const member = await Members.findByPk(data.memberId);
    if (!member) {
      return respond(res, 400, "Member not found");
    }
    
    // Verify product exists
    const product = await LoanProducts.findByPk(data.productId);
    if (!product) {
      return respond(res, 400, "Loan product not found");
    }
    
    const payload = {
      loanApplicationId: data.loanApplicationId,
      loanName: data.loanName,
      memberId: data.memberId,
      productId: data.productId,
      loanAmount: parseFloat(data.loanAmount),
      mainRepaymentAccountId: data.mainRepaymentAccountId || null,
      collateralAmount: data.collateralAmount ? parseFloat(data.collateralAmount) : null,
      guarantors: data.guarantors ? JSON.stringify(data.guarantors) : null,
      status: data.status || "Pending Appraisal",
      remarks: data.remarks || null,
      createdOn: new Date(),
      createdBy: username,
    };
    
    console.log("Creating loan application with payload:", JSON.stringify(payload, null, 2));
    const created = await LoanApplications.create(payload);
    console.log("Loan application created successfully:", created.id);
    
    // Fetch the created application with member and product details
    const createdWithDetails = await LoanApplications.findByPk(created.id, {
      include: [
        {
          model: Members,
          as: 'member',
          required: false
        },
        {
          model: LoanProducts,
          as: 'product',
          required: false
        }
      ]
    });
    
    respond(res, 201, "Loan application created successfully", createdWithDetails);
  } catch (err) {
    console.error("=== LOAN APPLICATION CREATION ERROR ===");
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);
    console.error("Full error:", err);
    
    // Map common Sequelize errors to client-friendly messages
    if (err?.name === 'SequelizeUniqueConstraintError') {
      return respond(res, 400, 'Loan application ID already exists');
    }
    if (err?.name === 'SequelizeValidationError') {
      const detail = err?.errors?.[0]?.message || 'Validation error';
      return respond(res, 400, detail);
    }
    if (err?.name === 'SequelizeForeignKeyConstraintError') {
      return respond(res, 400, 'Invalid member ID');
    }
    respond(res, 500, err.message || 'Internal server error');
  }
});

// Update
router.put("/:id", validateToken, logUpdateOperation("LoanApplication"), async (req, res) => {
  try {
    const data = req.body || {};
    const username = req.user?.username || null;
    
    const updatePayload = {
      loanName: data.loanName,
      memberId: data.memberId,
      productId: data.productId,
      loanAmount: data.loanAmount,
      status: data.status,
      remarks: data.remarks,
      verifierRemarks: data.verifierRemarks,
      modifiedOn: new Date(),
      modifiedBy: username,
    };
    
    // Remove undefined values
    Object.keys(updatePayload).forEach(key => {
      if (updatePayload[key] === undefined) {
        delete updatePayload[key];
      }
    });
    
    const [count] = await LoanApplications.update(updatePayload, { 
      where: { 
        id: req.params.id, 
        isDeleted: 0,
        status: { [Op.ne]: "Deleted" }
      } 
    });
    if (!count) return respond(res, 404, "Not found");
    const updated = await LoanApplications.findByPk(req.params.id, {
      include: [
        {
          model: Members,
          as: 'member',
          required: false
        },
        {
          model: LoanProducts,
          as: 'product',
          required: false
        }
      ]
    });
    respond(res, 200, "Loan application updated", updated);
  } catch (err) {
    respond(res, 500, err.message);
  }
});

// Disburse loan application
router.put("/:id/disburse", validateToken, logUpdateOperation("LoanApplication"), async (req, res) => {
  try {
    console.log('=== DISBURSEMENT START ===');
    const { status } = req.body;
    const username = req.user?.username || null;
    const userRole = req.user?.role || null;
    console.log('User:', username, 'Role:', userRole);
    
    // Only cashiers can disburse funds
    if (userRole !== 'Cashier') {
      return respond(res, 403, "Only cashiers can disburse loan funds");
    }
    
    if (!status || status !== "Disbursed") {
      return respond(res, 400, "Status must be 'Disbursed' for disbursement");
    }
    
    // Get the loan application with member and product details
    console.log('Getting loan application:', req.params.id);
    const loanApplication = await LoanApplications.findByPk(req.params.id, {
      include: [
        {
          model: Members,
          as: 'member',
          required: true
        },
        {
          model: LoanProducts,
          as: 'product',
          required: true
        }
      ]
    });
    console.log('Loan application found:', loanApplication ? 'Yes' : 'No');
    
    if (!loanApplication || loanApplication.isDeleted) {
      return respond(res, 404, "Loan application not found");
    }
    
    if (loanApplication.status !== "Sanctioned") {
      return respond(res, 400, "Only sanctioned loan applications can be disbursed");
    }
    
    // Get the cashier's till
    const { Till } = require("../models");
    const till = await Till.findOne({
      where: {
        userId: req.user.id,
        isActive: 1
      }
    });
    
    if (!till) {
      return respond(res, 400, "Cashier must have an active till to disburse funds");
    }
    
    // Get the till's GL account
    const { GLAccounts } = require("../models");
    const tillGLAccount = await GLAccounts.findByPk(till.glAccountId);
    
    if (!tillGLAccount) {
      return respond(res, 400, "Till GL account not found");
    }
    
    // Check if till has sufficient balance
    if (parseFloat(tillGLAccount.availableBalance) < parseFloat(loanApplication.loanAmount)) {
      return respond(res, 400, "Insufficient funds in till to disburse loan amount");
    }
    
    // Create loan account for the member
    const { Accounts, AccountTypes } = require("../models");
    
    // Get the loan product's account type with currency information
    const loanAccountType = await AccountTypes.findOne({
      where: {
        accountTypeName: loanApplication.product.loanProductName + " Account Type"
      },
      include: [
        {
          model: require("../models").Currency,
          as: 'currency',
          required: false
        }
      ]
    });
    
    if (!loanAccountType) {
      return respond(res, 400, "Loan account type not found for this product");
    }
    
    // Get currency information
    const { Currency } = require("../models");
    const currency = await Currency.findOne({
      where: {
        currencyCode: loanAccountType.currency
      }
    });
    
    if (!currency) {
      return respond(res, 400, "Currency not found for this loan product");
    }
    
    // Generate loan account ID
    const generateAccountId = () => {
      const prefix = "LA";
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `${prefix}-${timestamp}-${random}`;
    };
    
    // Create the loan account
    const loanAccount = await Accounts.create({
      accountId: generateAccountId(),
      accountName: `${loanApplication.member.firstName} ${loanApplication.member.lastName} - ${loanApplication.product.loanProductName}`,
      memberId: loanApplication.memberId,
      productId: loanApplication.productId,
      accountTypeId: loanAccountType.id,
      availableBalance: 0,
      clearBalance: 0,
      status: "Active",
      createdBy: username,
      createdOn: new Date()
    });
    
    // Create the disbursement transaction
    const { Transactions } = require("../models");
    
    const transaction = await Transactions.create({
      transactionId: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      transactionType: "Loan Disbursement",
      transactionDate: new Date(),
      amount: parseFloat(loanApplication.loanAmount),
      description: `Loan disbursement for ${loanApplication.loanName} (${currency.symbol || currency.currencyCode})`,
      reference: loanApplication.loanApplicationId,
      status: "Pending",
      createdBy: username,
      createdOn: new Date(),
      // Debit the till GL account
      debitAccountId: tillGLAccount.id,
      debitAmount: parseFloat(loanApplication.loanAmount),
      // Credit the member's loan account
      creditAccountId: loanAccount.id,
      creditAmount: parseFloat(loanApplication.loanAmount)
    });
    
    // Update loan application status
    await LoanApplications.update({
      status: "Disbursed",
      modifiedOn: new Date(),
      modifiedBy: username
    }, {
      where: { id: req.params.id }
    });
    
    respond(res, 200, `Loan disbursed successfully (${currency.symbol || currency.currencyCode})`, {
      loanApplication: loanApplication,
      loanAccount: loanAccount,
      transaction: transaction,
      currency: {
        code: currency.currencyCode,
        symbol: currency.symbol,
        name: currency.currencyName
      }
    });
  } catch (err) {
    console.error("Disbursement error:", err);
    console.error("Error stack:", err.stack);
    respond(res, 500, err.message);
  }
});

// Test endpoint for disbursement without authentication
router.put("/:id/disburse/test", async (req, res) => {
  const dbTransaction = await require('../models').sequelize.transaction();
  
  try {
    const { status } = req.body;
    const username = "test-user";
    
    if (!status) {
      await dbTransaction.rollback();
      return respond(res, 400, "Status is required");
    }
    
    // Validate status values for disbursement
    const validDisbursementStatuses = ["Disbursed"];
    if (!validDisbursementStatuses.includes(status)) {
      await dbTransaction.rollback();
      return respond(res, 400, "Invalid disbursement status. Must be: Disbursed");
    }
    
    // Find the loan application
    const loanApplication = await LoanApplications.findByPk(req.params.id, {
      include: [
        {
          model: Members,
          as: 'member',
          required: false
        },
        {
          model: LoanProducts,
          as: 'product',
          required: false
        }
      ],
      transaction: dbTransaction
    });
    
    if (!loanApplication || loanApplication.isDeleted) {
      await dbTransaction.rollback();
      return respond(res, 404, "Loan application not found");
    }
    
    // Check if application is in correct status for disbursement
    if (loanApplication.status !== "Sanctioned") {
      await dbTransaction.rollback();
      return respond(res, 400, `Cannot disburse loan application with status: ${loanApplication.status}. Only 'Sanctioned' applications can be disbursed.`);
    }
    
    // Create loan account automatically
    const { Accounts, AccountTypes } = require("../models");
    
    // Generate loan account ID
    const generateLoanAccountId = () => {
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `LOAN-${timestamp}-${random}`;
    };
    
    // Create the loan account
    const loanAccount = await Accounts.create({
      accountId: generateLoanAccountId(),
      accountName: `${loanApplication.member.firstName} ${loanApplication.member.lastName} - ${loanApplication.product.loanProductName} Loan`,
      memberId: loanApplication.memberId,
      productId: loanApplication.productId,
      accountTypeId: 2, // Assuming 2 is loan account type
      availableBalance: parseFloat(loanApplication.loanAmount),
      clearBalance: parseFloat(loanApplication.loanAmount),
      debitBalance: 0,
      creditBalance: parseFloat(loanApplication.loanAmount),
      status: "Active",
      saccoId: loanApplication.member.saccoId,
      createdOn: new Date(),
      createdBy: username
    }, { transaction: dbTransaction });
    
    // Create disbursement transaction
    const { Transactions } = require("../models");
    
    const transaction = await Transactions.create({
      transactionId: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      referenceNumber: `DISB-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      saccoId: loanApplication.member.saccoId,
      accountId: loanAccount.accountId,
      accountType: 'MEMBER',
      entryType: 'CREDIT',
      amount: parseFloat(loanApplication.loanAmount),
      type: 'LOAN_DISBURSEMENT',
      status: 'Approved',
      remarks: `Loan disbursement for ${loanApplication.loanName} - ${loanApplication.loanApplicationId}`,
      createdOn: new Date(),
      createdBy: username,
    }, { transaction: dbTransaction });
    
    // Update loan application status and link to loan account
    const updatePayload = {
      status: status,
      mainRepaymentAccountId: loanAccount.accountId,
      modifiedOn: new Date(),
      modifiedBy: username,
      disbursedOn: new Date(),
      disbursedBy: username,
    };
    
    const [count] = await LoanApplications.update(updatePayload, { 
      where: { 
        id: req.params.id, 
        isDeleted: 0,
        status: "Sanctioned" // Only allow disbursement of sanctioned applications
      },
      transaction: dbTransaction
    });
    
    if (!count) {
      await dbTransaction.rollback();
      return respond(res, 400, "Failed to disburse loan application. Application may have not been Sanctioned yet");
    }
    
    await dbTransaction.commit();
    
    // Fetch the updated application
    const updated = await LoanApplications.findByPk(req.params.id, {
      include: [
        {
          model: Members,
          as: 'member',
          required: false
        },
        {
          model: LoanProducts,
          as: 'product',
          required: false
        }
      ]
    });
    
    respond(res, 200, "Loan application disbursed successfully with loan account created (TEST MODE)", {
      loanApplication: updated,
      loanAccount: loanAccount,
      transaction: transaction
    });
  } catch (err) {
    await dbTransaction.rollback();
    console.error("Disbursement error:", err);
    respond(res, 500, err.message || "Internal server error during disbursement");
  }
});


// Test endpoint for status update without authentication
router.put("/:id/status/test", async (req, res) => {
  try {
    const { status } = req.body;
    const username = "test-user";
    
    if (!status) {
      return respond(res, 400, "Status is required");
    }
    
    // Validate status values
    const validStatuses = ["Pending Appraisal", "Sanctioned", "Approved", "Rejected", "Disbursed"];
    if (!validStatuses.includes(status)) {
      return respond(res, 400, "Invalid status. Must be one of: " + validStatuses.join(", "));
    }
    
    const updatePayload = {
      status: status,
      modifiedOn: new Date(),
      modifiedBy: username,
    };
    
    // If approving or sanctioning, set approved fields
    if (status === "Approved" || status === "Sanctioned") {
      updatePayload.approvedOn = new Date();
      updatePayload.approvedBy = username;
    }
    
    const [count] = await LoanApplications.update(updatePayload, { 
      where: { 
        id: req.params.id, 
        isDeleted: 0,
        status: { [Op.ne]: "Deleted" }
      } 
    });
    
    if (!count) return respond(res, 404, "Loan application not found");
    
    const updated = await LoanApplications.findByPk(req.params.id, {
      include: [
        {
          model: Members,
          as: 'member',
          required: false
        },
        {
          model: LoanProducts,
          as: 'product',
          required: false
        }
      ]
    });
    
    respond(res, 200, "Loan application status updated (TEST MODE)", updated);
  } catch (err) {
    respond(res, 500, err.message);
  }
});

// Update status
router.put("/:id/status", validateToken, logUpdateOperation("LoanApplication"), async (req, res) => {
  try {
    const { status } = req.body;
    const username = req.user?.username || null;
    
    if (!status) {
      return respond(res, 400, "Status is required");
    }
    
    // Validate status values
    const validStatuses = ["Pending Appraisal", "Sanctioned", "Approved", "Rejected", "Disbursed"];
    if (!validStatuses.includes(status)) {
      return respond(res, 400, "Invalid status. Must be one of: " + validStatuses.join(", "));
    }
    
    const updatePayload = {
      status: status,
      modifiedOn: new Date(),
      modifiedBy: username,
    };
    
    // If approving or sanctioning, set approved fields
    if (status === "Approved" || status === "Sanctioned") {
      updatePayload.approvedOn = new Date();
      updatePayload.approvedBy = username;
    }
    
    const [count] = await LoanApplications.update(updatePayload, { 
      where: { 
        id: req.params.id, 
        isDeleted: 0,
        status: { [Op.ne]: "Deleted" }
      } 
    });
    
    if (!count) return respond(res, 404, "Loan application not found");
    
    const updated = await LoanApplications.findByPk(req.params.id, {
      include: [
        {
          model: Members,
          as: 'member',
          required: false
        },
        {
          model: LoanProducts,
          as: 'product',
          required: false
        }
      ]
    });
    
    respond(res, 200, "Loan application status updated", updated);
  } catch (err) {
    respond(res, 500, err.message);
  }
});

// Soft delete
router.delete("/:id", validateToken, logDeleteOperation("LoanApplication"), async (req, res) => {
  try {
    const [count] = await LoanApplications.update({ 
      isDeleted: 1, 
      status: "Deleted",
      modifiedOn: new Date(),
      modifiedBy: req.user?.username || "System"
    }, { where: { id: req.params.id } });
    if (!count) return respond(res, 404, "Not found");
    respond(res, 200, "Loan application deleted");
  } catch (err) {
    respond(res, 500, err.message);
  }
});

// Assign collateral to loan application
router.post("/:id/collateral", validateToken, logUpdateOperation("LoanApplication"), async (req, res) => {
  try {
    const { collateralId, assignedValue, isPrimary } = req.body;
    const username = req.user?.username || null;
    
    if (!collateralId) {
      return respond(res, 400, "Collateral ID is required");
    }
    
    // Verify loan application exists
    const loanApplication = await LoanApplications.findByPk(req.params.id);
    if (!loanApplication || loanApplication.isDeleted) {
      return respond(res, 404, "Loan application not found");
    }
    
    // Verify collateral exists and belongs to the same member
    const { Collateral } = require("../models");
    const collateral = await Collateral.findByPk(collateralId);
    if (!collateral || collateral.isDeleted || collateral.memberId !== loanApplication.memberId) {
      return respond(res, 400, "Invalid collateral or collateral does not belong to the loan applicant");
    }
    
    // Check if collateral is already assigned to this loan application
    const { LoanApplicationCollateral } = require("../models");
    const existingAssignment = await LoanApplicationCollateral.findOne({
      where: {
        loanApplicationId: req.params.id,
        collateralId: collateralId
      }
    });
    
    if (existingAssignment) {
      return respond(res, 400, "Collateral is already assigned to this loan application");
    }
    
    // Create the assignment
    const assignment = await LoanApplicationCollateral.create({
      loanApplicationId: req.params.id,
      collateralId: collateralId,
      assignedValue: assignedValue ? parseFloat(assignedValue) : collateral.value,
      isPrimary: isPrimary || false,
      createdOn: new Date(),
      createdBy: username
    });
    
    respond(res, 201, "Collateral assigned successfully", assignment);
  } catch (err) {
    respond(res, 500, err.message);
  }
});

// Remove collateral from loan application
router.delete("/:id/collateral/:collateralId", validateToken, logUpdateOperation("LoanApplication"), async (req, res) => {
  try {
    const { LoanApplicationCollateral } = require("../models");
    
    const assignment = await LoanApplicationCollateral.findOne({
      where: {
        loanApplicationId: req.params.id,
        collateralId: req.params.collateralId
      }
    });
    
    if (!assignment) {
      return respond(res, 404, "Collateral assignment not found");
    }
    
    await assignment.destroy();
    
    respond(res, 200, "Collateral removed from loan application");
  } catch (err) {
    respond(res, 500, err.message);
  }
});

// Get available collaterals for a loan application
router.get("/:id/available-collaterals", validateToken, logViewOperation("LoanApplication"), async (req, res) => {
  try {
    const loanApplication = await LoanApplications.findByPk(req.params.id);
    if (!loanApplication || loanApplication.isDeleted) {
      return respond(res, 404, "Loan application not found");
    }
    
    const { Collateral, LoanApplicationCollateral } = require("../models");
    
    // Get collaterals already assigned to this loan application
    const assignedCollaterals = await LoanApplicationCollateral.findAll({
      where: { loanApplicationId: req.params.id },
      attributes: ['collateralId']
    });
    
    const assignedCollateralIds = assignedCollaterals.map(ac => ac.collateralId);
    
    // Get available collaterals for the member
    const where = {
      memberId: loanApplication.memberId,
      isDeleted: 0,
      status: "Active"
    };
    
    if (assignedCollateralIds.length > 0) {
      where.id = { [Op.notIn]: assignedCollateralIds };
    }
    
    const availableCollaterals = await Collateral.findAll({
      where,
      include: [
        {
          model: require("../models").Members,
          as: 'member',
          required: false,
          attributes: ['id', 'firstName', 'lastName', 'memberId']
        }
      ],
      order: [["createdOn", "DESC"]]
    });
    
    respond(res, 200, "Available collaterals fetched", availableCollaterals);
  } catch (err) {
    respond(res, 500, err.message);
  }
});

module.exports = router;
