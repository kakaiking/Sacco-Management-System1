const express = require("express");
const router = express.Router();
const { Accounts, Members, Products, AccountTypes } = require("../models");
const { validateToken } = require("../middlewares/AuthMiddleware");
const { logViewOperation, logCreateOperation, logUpdateOperation, logDeleteOperation } = require("../middlewares/LoggingMiddleware");

// Helper function to generate Account ID
const generateAccountId = (accountTypeId, memberId) => {
  // Extract digits from AccountType ID (remove AT- prefix)
  const accountTypeDigits = accountTypeId.replace('AT-', '');
  // Extract digits from Member ID (remove M- prefix) 
  const memberDigits = memberId.replace('M-', '');
  return `A-${accountTypeDigits}${memberDigits}`;
};

// Helper function to generate Account Number
const generateAccountNumber = () => {
  const randomNum = Math.floor(1000000000 + Math.random() * 9000000000); // 10 digits
  return randomNum.toString();
};

// Helper function to respond
const respond = (res, code, message, entity) => {
  res.status(code).json({ code, message, entity });
};

// Test endpoint to create account without authentication
router.post("/test", async (req, res) => {
  try {
    const data = req.body || {};
    const username = "test-user";
    
    const payload = {
      accountId: data.accountId,
      accountNumber: data.accountNumber || generateAccountNumber(), // Add accountNumber field
      accountName: data.accountName,
      memberId: data.memberId,
      productId: data.productId,
      accountTypeId: data.accountTypeId,
      availableBalance: data.availableBalance || 0,
      clearBalance: data.clearBalance || 0,
      debitBalance: data.debitBalance || 0,
      creditBalance: data.creditBalance || 0,
      status: data.status || 'Active',
      saccoId: data.saccoId,
      createdOn: new Date(),
      createdBy: username,
    };
    
    const created = await Accounts.create(payload);
    respond(res, 201, "Account created successfully (TEST MODE)", created);
  } catch (err) {
    console.error("Error creating account (TEST):", err);
    respond(res, 500, `Server error: ${err.message}`, null);
  }
});

// Test endpoint to get account by ID without authentication
router.get("/test/:id", async (req, res) => {
  try {
    // Check if the ID is numeric (primary key) or string (accountId)
    const isNumeric = /^\d+$/.test(req.params.id);
    const whereClause = isNumeric ? { id: req.params.id } : { accountId: req.params.id };
    
    const account = await Accounts.findOne({
      where: whereClause,
      include: [
        {
          model: Members,
          as: 'member',
          required: false
        },
        {
          model: Products,
          as: 'product',
          required: false
        },
        {
          model: AccountTypes,
          as: 'accountTypeDefinition',
          required: false
        }
      ]
    });
    
    if (!account || account.isDeleted) {
      return respond(res, 404, "Account not found");
    }
    
    respond(res, 200, "Account fetched successfully (TEST MODE)", account);
  } catch (err) {
    respond(res, 500, err.message);
  }
});

// Test endpoint to verify database connection
router.get("/test", validateToken, async (req, res) => {
  try {
    console.log("Testing database connection...");
    
    // Test Members table
    const memberCount = await Members.count();
    console.log("Members count:", memberCount);
    
    // Test Products table
    const productCount = await Products.count();
    console.log("Products count:", productCount);
    
    // Test Accounts table
    const accountCount = await Accounts.count();
    console.log("Accounts count:", accountCount);
    
    // Get first member and product for testing
    const firstMember = await Members.findOne({ where: { isDeleted: 0 } });
    const firstProduct = await Products.findOne({ where: { isDeleted: 0 } });
    
    respond(res, 200, "Database test successful", {
      memberCount,
      productCount,
      accountCount,
      firstMember: firstMember ? { id: firstMember.id, memberNo: firstMember.memberNo, name: `${firstMember.firstName} ${firstMember.lastName}` } : null,
      firstProduct: firstProduct ? { id: firstProduct.id, productId: firstProduct.productId, name: firstProduct.productName } : null
    });
  } catch (err) {
    console.error("Database test error:", err);
    respond(res, 500, `Database test failed: ${err.message}`, null);
  }
});

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
        { accountName: { [require('sequelize').Op.like]: `%${q}%` } }
      ];
    }

    const accounts = await Accounts.findAll({
      where: whereClause,
      include: [
        { model: Members, as: 'member' },
        { 
          model: Products, 
          as: 'product',
          attributes: ['id', 'productId', 'productName', 'saccoId', 'productType', 'productStatus', 'status', 'description', 'createdOn', 'createdBy', 'modifiedOn', 'modifiedBy', 'approvedBy', 'approvedOn', 'verifierRemarks', 'isDeleted']
        },
        { model: AccountTypes, as: 'accountTypeDefinition' }
      ],
      order: [['createdOn', 'DESC']]
    });
    respond(res, 200, "Accounts fetched", accounts);
  } catch (err) {
    console.error("Error fetching accounts:", err);
    respond(res, 500, "Internal server error", null);
  }
});

// Get accounts by member ID
router.get("/member/:memberId", validateToken, logViewOperation("Account"), async (req, res) => {
  try {
    console.log("Fetching accounts for member ID:", req.params.memberId);
    
    const accounts = await Accounts.findAll({
      where: { 
        memberId: req.params.memberId,
        isDeleted: 0 
      },
      include: [
        { model: Members, as: 'member' },
        { 
          model: Products, 
          as: 'product',
          required: false // Make it a LEFT JOIN to handle missing products
        },
        { 
          model: AccountTypes, 
          as: 'accountTypeDefinition',
          required: false // Make it a LEFT JOIN to handle missing account types
        }
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
        { model: AccountTypes, as: 'accountTypeDefinition' }
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

    // Validate required fields based on account type
    const accountType = data.accountType || 'MEMBER';
    
    if (accountType === 'MEMBER') {
      if (!data.memberId) {
        return respond(res, 400, "Member ID is required for member accounts", null);
      }
      if (!data.accountTypeId) {
        return respond(res, 400, "Account Type ID is required for member accounts", null);
      }
    } else if (accountType === 'GL') {
      if (!data.saccoId) {
        return respond(res, 400, "SACCO ID is required for GL accounts", null);
      }
    }

    let member = null;
    let accountTypeRecord = null;

    // Get member and account type details only for member accounts
    if (accountType === 'MEMBER') {
      console.log("Looking for member with ID:", data.memberId);
      member = await Members.findByPk(data.memberId);
      console.log("Member found:", member ? `${member.memberNo} - ${member.firstName} ${member.lastName}` : "NOT FOUND");
      
      console.log("Looking for account type with ID:", data.accountTypeId);
      accountTypeRecord = await AccountTypes.findByPk(data.accountTypeId, {
        include: [{ model: Products, as: 'product' }]
      });
      console.log("Account type found:", accountTypeRecord ? `${accountTypeRecord.accountTypeId} - ${accountTypeRecord.accountTypeName}` : "NOT FOUND");
      
      if (!member) {
        console.log("Member not found for ID:", data.memberId);
        return respond(res, 400, `Member with ID ${data.memberId} not found`, null);
      }
      if (!accountTypeRecord) {
        console.log("Account type not found for ID:", data.accountTypeId);
        return respond(res, 400, `Account type with ID ${data.accountTypeId} not found`, null);
      }

      console.log("Found member:", member.memberNo, "and account type:", accountTypeRecord.accountTypeId);
    }

    // Generate account ID based on account type
    let accountId, accountName;
    
    if (accountType === 'MEMBER') {
      accountId = generateAccountId(accountTypeRecord.accountTypeId, member.memberNo);
      
      // Generate account name using member's name and product name if appliedOnMemberOnboarding is true
      if (accountTypeRecord.appliedOnMemberOnboarding && accountTypeRecord.product) {
        const memberName = `${member.firstName} ${member.lastName}`;
        const productName = accountTypeRecord.product.productName;
        accountName = `${memberName}'s ${productName} Account`;
      } else {
        accountName = accountTypeRecord.accountTypeName;
      }
    } else {
      // For GL accounts, generate different ID format
      const glRandomNum = Math.floor(1000000 + Math.random() * 9000000);
      accountId = `GL-${glRandomNum}`;
      accountName = data.accountName || "GL Account";
    }

    console.log("Generated accountId:", accountId);
    console.log("Account name:", accountName);
    
    // Check if account ID already exists
    const existingAccount = await Accounts.findOne({
      where: {
        accountId: accountId
      }
    });
    
    if (existingAccount) {
      console.log("Account ID already exists:", existingAccount.accountId);
      return respond(res, 409, "Account ID already exists, please try again", null);
    }

    const payload = {
      accountId,
      saccoId: data.saccoId || (member ? member.saccoId : null),
      accountType: accountType,
      accountTypeId: data.accountTypeId ? parseInt(data.accountTypeId) : null,
      memberId: data.memberId ? parseInt(data.memberId) : null,
      productId: accountTypeRecord ? accountTypeRecord.productId : (data.productId ? parseInt(data.productId) : null),
      accountName,
      availableBalance: parseFloat(data.availableBalance) || 0.00,
      status: data.status || "Active",
      remarks: data.remarks || null,
      createdBy: username,
      createdOn: new Date(),
      isDeleted: 0
    };

    console.log("Creating account with payload:", payload);

    let account;
    try {
      account = await Accounts.create(payload);
      console.log("Account created with ID:", account.id);
    } catch (createError) {
      console.error("Error during Accounts.create():", createError);
      throw createError; // Re-throw to be caught by outer catch
    }

    const createdAccount = await Accounts.findByPk(account.id, {
      include: [
        { model: Members, as: 'member' },
        { model: Products, as: 'product' },
        { model: AccountTypes, as: 'accountTypeDefinition' }
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
      return respond(res, 400, "Invalid member or product reference", null);
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
      availableBalance: data.availableBalance,
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
        { model: AccountTypes, as: 'accountTypeDefinition' }
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
