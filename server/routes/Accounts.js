const express = require("express");
const router = express.Router();
const { Accounts, Members, Products, Branch, Currency, AccountOfficers } = require("../models");
const { validateToken } = require("../middlewares/AuthMiddleware");
const { logViewOperation, logCreateOperation, logUpdateOperation, logDeleteOperation } = require("../middlewares/LoggingMiddleware");

// Helper function to generate Account ID
const generateAccountId = (memberNo, productId) => {
  // Extract digits from Product ID (remove PRD- prefix if exists)
  const productDigits = productId.toString().replace('PRD-', '');
  // Extract digits from Member No (remove M- prefix if exists) 
  const memberDigits = memberNo.replace('M-', '');
  return `A-${productDigits}${memberDigits}`;
};

// Helper function to respond
const respond = (res, code, message, entity) => {
  res.status(code).json({ code, message, entity });
};

// Get all accounts
router.get("/", validateToken, logViewOperation("Account"), async (req, res) => {
  try {
    const { status, q, accountType } = req.query;
    
    // Build where clause
    const whereClause = { isDeleted: 0 };
    
    // Add status filter if provided
    if (status) {
      whereClause.status = status;
    }
    
    // Add account type filter if provided
    if (accountType) {
      whereClause.accountType = accountType;
    }
    
    // Add search filter if provided
    if (q) {
      whereClause[require('sequelize').Op.or] = [
        { accountId: { [require('sequelize').Op.like]: `%${q}%` } },
        { shortName: { [require('sequelize').Op.like]: `%${q}%` } },
        { memberNo: { [require('sequelize').Op.like]: `%${q}%` } }
      ];
    }

    const accounts = await Accounts.findAll({
      where: whereClause,
      include: [
        { model: Members, as: 'member' },
        { model: Products, as: 'product' },
        { model: Branch, as: 'branch' },
        { model: Currency, as: 'currency' },
        { model: AccountOfficers, as: 'accountOfficer' }
      ],
      order: [['createdOn', 'DESC']]
    });
    respond(res, 200, "Accounts fetched", accounts);
  } catch (err) {
    console.error("Error fetching accounts:", err);
    respond(res, 500, "Internal server error", null);
  }
});

// Get accounts by member number
router.get("/member/:memberNo", validateToken, logViewOperation("Account"), async (req, res) => {
  try {
    console.log("Fetching accounts for member number:", req.params.memberNo);
    
    const accounts = await Accounts.findAll({
      where: { 
        memberNo: req.params.memberNo,
        isDeleted: 0 
      },
      include: [
        { model: Members, as: 'member' },
        { model: Products, as: 'product' },
        { model: Branch, as: 'branch' },
        { model: Currency, as: 'currency' },
        { model: AccountOfficers, as: 'accountOfficer' }
      ],
      order: [['createdOn', 'DESC']]
    });
    
    console.log("Found accounts:", accounts.length);
    respond(res, 200, "Member accounts fetched", accounts);
  } catch (err) {
    console.error("Error fetching member accounts:", err);
    respond(res, 500, `Internal server error: ${err.message}`, null);
  }
});

// Get single account
router.get("/:id", validateToken, logViewOperation("Account"), async (req, res) => {
  try {
    const account = await Accounts.findByPk(req.params.id, {
      include: [
        { model: Members, as: 'member' },
        { model: Products, as: 'product' },
        { model: Branch, as: 'branch' },
        { model: Currency, as: 'currency' },
        { model: AccountOfficers, as: 'accountOfficer' }
      ]
    });
    if (!account || account.isDeleted) return respond(res, 404, "Account not found", null);
    respond(res, 200, "Account fetched", account);
  } catch (err) {
    respond(res, 500, "Internal server error", null);
  }
});

// Create new account
router.post("/", validateToken, logCreateOperation("Account"), async (req, res) => {
  try {
    const data = req.body || {};
    const username = req.user?.username || "System";

    console.log("Creating account with data:", data);

    // Validate required fields
    if (!data.memberNo) {
      return respond(res, 400, "Member number is required", null);
    }
    if (!data.productId) {
      return respond(res, 400, "Product ID is required", null);
    }
    if (!data.saccoId) {
      return respond(res, 400, "SACCO ID is required", null);
    }
    if (!data.branchId) {
      return respond(res, 400, "Branch ID is required", null);
    }

    // Get member details
    const member = await Members.findOne({
      where: { memberNo: data.memberNo, isDeleted: 0 }
    });
    
    if (!member) {
      return respond(res, 400, `Member with number ${data.memberNo} not found`, null);
    }

    // Get product details
    const product = await Products.findByPk(data.productId, {
      where: { isDeleted: 0 }
    });
    
    if (!product) {
      return respond(res, 400, `Product with ID ${data.productId} not found`, null);
    }

    // Generate account ID
    const accountId = generateAccountId(data.memberNo, data.productId);
    
    // Check if account ID already exists
    const existingAccount = await Accounts.findOne({
      where: {
        accountId: accountId,
        isDeleted: 0
      }
    });
    
    if (existingAccount) {
      return respond(res, 409, "Account ID already exists, please try again", null);
    }

    const payload = {
      saccoId: data.saccoId,
      branchId: data.branchId,
      memberNo: data.memberNo,
      productId: parseInt(data.productId),
      accountId,
      shortName: data.shortName || `${member.firstName} ${member.lastName}`,
      accountType: 'Savings', // Always set to Savings for this module
      currencyId: data.currencyId || 1, // Default to first currency
      address: data.address || member.address,
      city: data.city || member.city,
      phone: data.phone || member.personalPhone,
      alternativePhone: data.alternativePhone || member.alternativePhone,
      kraPin: data.kraPin || member.kraPin,
      emailId: data.emailId || member.email,
      operatingMode: data.operatingMode || 'Self',
      operatingInstructions: data.operatingInstructions || null,
      accountOfficerId: data.accountOfficerId || null,
      clearBalance: parseFloat(data.clearBalance) || 0.00,
      unclearBalance: parseFloat(data.unclearBalance) || 0.00,
      unsupervisedCredits: parseFloat(data.unsupervisedCredits) || 0.00,
      unsupervisedDebits: parseFloat(data.unsupervisedDebits) || 0.00,
      frozenAmount: parseFloat(data.frozenAmount) || 0.00,
      creditRate: parseFloat(data.creditRate) || 0.0000,
      debitRate: parseFloat(data.debitRate) || 0.0000,
      penaltyRate: parseFloat(data.penaltyRate) || 0.0000,
      pendingCharges: parseFloat(data.pendingCharges) || 0.00,
      availableBalance: parseFloat(data.availableBalance) || 0.00,
      totalBalance: parseFloat(data.totalBalance) || 0.00,
      creditInterest: parseFloat(data.creditInterest) || 0.00,
      debitInterest: parseFloat(data.debitInterest) || 0.00,
      minimumBalance: parseFloat(data.minimumBalance) || 0.00,
      fixedBalance: parseFloat(data.fixedBalance) || 0.00,
      status: data.status || "Active",
      remarks: data.remarks || null,
      createdBy: username,
      createdOn: new Date(),
      isDeleted: 0
    };

    console.log("Creating account with payload:", payload);

    const account = await Accounts.create(payload);

    const createdAccount = await Accounts.findByPk(account.id, {
      include: [
        { model: Members, as: 'member' },
        { model: Products, as: 'product' },
        { model: Branch, as: 'branch' },
        { model: Currency, as: 'currency' },
        { model: AccountOfficers, as: 'accountOfficer' }
      ]
    });

    console.log("Retrieved created account:", createdAccount);

    respond(res, 201, "Account created", createdAccount);
  } catch (err) {
    console.error("=== DETAILED ERROR CREATING ACCOUNT ===");
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);
    console.error("Error stack:", err.stack);
    console.error("Original error:", err.original);
    console.error("Parent error:", err.parent);
    console.error("SQL:", err.sql);
    console.error("Parameters:", err.parameters);
    console.error("Full error object:", JSON.stringify(err, null, 2));
    console.error("=== END ERROR DETAILS ===");
    
    // Return more specific error messages
    if (err.name === 'SequelizeValidationError') {
      return respond(res, 400, `Validation error: ${err.errors.map(e => e.message).join(', ')}`, null);
    }
    if (err.name === 'SequelizeUniqueConstraintError') {
      return respond(res, 409, `Duplicate entry: ${err.errors.map(e => e.message).join(', ')}`, null);
    }
    if (err.name === 'SequelizeForeignKeyConstraintError') {
      return respond(res, 400, "Invalid member, product, branch, or currency reference", null);
    }
    if (err.name === 'SequelizeDatabaseError') {
      const errorMsg = err.message || err.original?.message || "Unknown database error";
      return respond(res, 500, `Database error: ${errorMsg}`, null);
    }
    
    respond(res, 500, `Server error: ${err.message}`, null);
  }
});

// Update account
router.put("/:id", validateToken, logUpdateOperation("Account"), async (req, res) => {
  try {
    const data = req.body || {};
    const username = req.user?.username || null;

    console.log("Updating account with data:", data);

    const updatePayload = {
      shortName: data.shortName,
      address: data.address,
      city: data.city,
      phone: data.phone,
      alternativePhone: data.alternativePhone,
      kraPin: data.kraPin,
      emailId: data.emailId,
      operatingMode: data.operatingMode,
      operatingInstructions: data.operatingInstructions,
      accountOfficerId: data.accountOfficerId,
      clearBalance: data.clearBalance,
      unclearBalance: data.unclearBalance,
      unsupervisedCredits: data.unsupervisedCredits,
      unsupervisedDebits: data.unsupervisedDebits,
      frozenAmount: data.frozenAmount,
      creditRate: data.creditRate,
      debitRate: data.debitRate,
      penaltyRate: data.penaltyRate,
      pendingCharges: data.pendingCharges,
      availableBalance: data.availableBalance,
      totalBalance: data.totalBalance,
      creditInterest: data.creditInterest,
      debitInterest: data.debitInterest,
      minimumBalance: data.minimumBalance,
      fixedBalance: data.fixedBalance,
      modifiedOn: new Date(),
      modifiedBy: username,
    };

    // If status is being changed, update status-related fields
    if (data.status) {
      updatePayload.status = data.status;
      updatePayload.statusChangedBy = username;
      updatePayload.statusChangedOn = new Date();
    }

    // If remarks are provided, update them
    if (data.remarks || data.verifierRemarks) {
      updatePayload.remarks = data.remarks || data.verifierRemarks;
    }

    console.log("Update payload:", updatePayload);

    const [count] = await Accounts.update(updatePayload, { 
      where: { id: req.params.id, isDeleted: 0 } 
    });
    
    if (!count) return respond(res, 404, "Account not found", null);
    
    const updated = await Accounts.findByPk(req.params.id, {
      include: [
        { model: Members, as: 'member' },
        { model: Products, as: 'product' },
        { model: Branch, as: 'branch' },
        { model: Currency, as: 'currency' },
        { model: AccountOfficers, as: 'accountOfficer' }
      ]
    });
    
    console.log("Updated account:", updated);
    respond(res, 200, "Account updated", updated);
  } catch (err) {
    console.error("Error updating account:", err);
    respond(res, 500, "Internal server error", null);
  }
});

// Soft delete account
router.delete("/:id", validateToken, logDeleteOperation("Account"), async (req, res) => {
  try {
    const username = req.user?.username || null;
    const [count] = await Accounts.update(
      { 
        isDeleted: 1, 
        modifiedOn: new Date(), 
        modifiedBy: username 
      },
      { where: { id: req.params.id, isDeleted: 0 } }
    );
    
    if (!count) return respond(res, 404, "Account not found", null);
    respond(res, 200, "Account deleted", null);
  } catch (err) {
    respond(res, 500, "Internal server error", null);
  }
});

module.exports = router;
