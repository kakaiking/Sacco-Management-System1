const express = require("express");
const router = express.Router();
const { GLAccounts, Sacco } = require("../models");
const { validateToken } = require("../middlewares/AuthMiddleware");
const { logViewOperation, logCreateOperation, logUpdateOperation, logDeleteOperation } = require("../middlewares/LoggingMiddleware");

// Helper function to generate GL Account ID
const generateGLAccountId = (category, subCategory = null) => {
  const categoryPrefix = {
    'ASSET': 'A',
    'LIABILITY': 'L', 
    'EQUITY': 'E',
    'INCOME': 'I',
    'EXPENSE': 'X'
  };
  
  const prefix = categoryPrefix[category] || 'G';
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const subCategorySuffix = subCategory ? subCategory.substring(0, 2).toUpperCase() : '';
  
  return `GL-${prefix}${subCategorySuffix}${randomNum}`;
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

// Get all GL accounts
router.get("/", validateToken, logViewOperation("GL Account"), async (req, res) => {
  try {
    const { status, category, q } = req.query;
    
    // Build where clause
    const whereClause = { isDeleted: 0 };
    
    // Add status filter if provided
    if (status) {
      whereClause.status = status;
    }
    
    // Add category filter if provided
    if (category) {
      whereClause.accountCategory = category;
    }
    
    // Add search filter if provided
    if (q) {
      whereClause[require('sequelize').Op.or] = [
        { glAccountId: { [require('sequelize').Op.like]: `%${q}%` } },
        { accountName: { [require('sequelize').Op.like]: `%${q}%` } }
      ];
    }

    const glAccounts = await GLAccounts.findAll({
      where: whereClause,
      include: [
        { model: Sacco, as: 'sacco' },
        { model: GLAccounts, as: 'parentAccount' },
        { model: GLAccounts, as: 'childAccounts' }
      ],
      order: [['accountCategory', 'ASC'], ['accountName', 'ASC']]
    });
    respond(res, 200, "GL Accounts fetched", glAccounts);
  } catch (err) {
    console.error("Error fetching GL accounts:", err);
    respond(res, 500, "Internal server error", null);
  }
});

// Get GL accounts by category
router.get("/category/:category", validateToken, logViewOperation("GL Account"), async (req, res) => {
  try {
    const { category } = req.params;
    const glAccounts = await GLAccounts.findAll({
      where: { 
        accountCategory: category.toUpperCase(),
        isDeleted: 0 
      },
      include: [
        { model: Sacco, as: 'sacco' },
        { model: GLAccounts, as: 'parentAccount' }
      ],
      order: [['accountName', 'ASC']]
    });
    respond(res, 200, "GL Accounts by category fetched", glAccounts);
  } catch (err) {
    respond(res, 500, "Internal server error", null);
  }
});

// Get single GL account
router.get("/:id", validateToken, logViewOperation("GL Account"), async (req, res) => {
  try {
    const glAccount = await GLAccounts.findByPk(req.params.id, {
      include: [
        { model: Sacco, as: 'sacco' },
        { model: GLAccounts, as: 'parentAccount' },
        { model: GLAccounts, as: 'childAccounts' }
      ]
    });
    if (!glAccount || glAccount.isDeleted) return respond(res, 404, "GL Account not found", null);
    respond(res, 200, "GL Account fetched", glAccount);
  } catch (err) {
    respond(res, 500, "Internal server error", null);
  }
});

// Create new GL account
router.post("/", validateToken, logCreateOperation("GL Account"), async (req, res) => {
  try {
    const data = req.body || {};
    const username = req.user?.username || "System";

    console.log("Creating GL account with data:", data);

    // Validate required fields
    if (!data.saccoId) {
      return respond(res, 400, "SACCO ID is required", null);
    }
    if (!data.accountName) {
      return respond(res, 400, "Account name is required", null);
    }
    if (!data.accountCategory) {
      return respond(res, 400, "Account category is required", null);
    }

    // Get SACCO details
    const sacco = await Sacco.findOne({ where: { saccoId: data.saccoId } });
    if (!sacco) {
      return respond(res, 400, `SACCO with ID ${data.saccoId} not found`, null);
    }

    // Generate GL account ID
    const glAccountId = generateGLAccountId(data.accountCategory, data.accountSubCategory);

    // Determine normal balance based on category
    const normalBalance = ['ASSET', 'EXPENSE'].includes(data.accountCategory) ? 'DEBIT' : 'CREDIT';

    // Check if GL account ID already exists
    const existingAccount = await GLAccounts.findOne({
      where: {
        glAccountId: glAccountId
      }
    });
    
    if (existingAccount) {
      return respond(res, 409, "GL Account ID already exists, please try again", null);
    }

    const payload = {
      glAccountId,
      saccoId: data.saccoId,
      accountName: data.accountName,
      accountCategory: data.accountCategory.toUpperCase(),
      accountSubCategory: data.accountSubCategory || null,
      parentAccountId: data.parentAccountId ? parseInt(data.parentAccountId) : null,
      accountLevel: data.accountLevel || 1,
      isParentAccount: data.isParentAccount || false,
      normalBalance,
      availableBalance: parseFloat(data.availableBalance) || 0.00,
      status: data.status || "Active",
      remarks: data.remarks || null,
      createdBy: username,
      createdOn: new Date(),
      isDeleted: 0
    };

    console.log("Creating GL account with payload:", payload);

    const glAccount = await GLAccounts.create(payload);

    const createdGLAccount = await GLAccounts.findByPk(glAccount.id, {
      include: [
        { model: Sacco, as: 'sacco' },
        { model: GLAccounts, as: 'parentAccount' }
      ]
    });

    respond(res, 201, "GL Account created", createdGLAccount);
  } catch (err) {
    console.error("Error creating GL account:", err);
    
    if (err.name === 'SequelizeValidationError') {
      return respond(res, 400, `Validation error: ${err.errors.map(e => e.message).join(', ')}`, null);
    }
    if (err.name === 'SequelizeUniqueConstraintError') {
      return respond(res, 409, `Duplicate entry: ${err.errors.map(e => e.message).join(', ')}`, null);
    }
    if (err.name === 'SequelizeForeignKeyConstraintError') {
      return respond(res, 400, "Invalid SACCO or parent account reference", null);
    }
    
    respond(res, 500, `Server error: ${err.message}`, null);
  }
});

// Update GL account
router.put("/:id", validateToken, logUpdateOperation("GL Account"), async (req, res) => {
  try {
    const data = req.body || {};
    const username = req.user?.username || null;

    console.log("Updating GL account with data:", data);

    const updatePayload = {
      accountName: data.accountName,
      accountSubCategory: data.accountSubCategory,
      parentAccountId: data.parentAccountId ? parseInt(data.parentAccountId) : null,
      accountLevel: data.accountLevel,
      isParentAccount: data.isParentAccount,
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

    const [count] = await GLAccounts.update(updatePayload, { 
      where: { id: req.params.id, isDeleted: 0 } 
    });
    
    if (!count) return respond(res, 404, "GL Account not found", null);
    
    const updated = await GLAccounts.findByPk(req.params.id, {
      include: [
        { model: Sacco, as: 'sacco' },
        { model: GLAccounts, as: 'parentAccount' }
      ]
    });
    
    respond(res, 200, "GL Account updated", updated);
  } catch (err) {
    console.error("Error updating GL account:", err);
    respond(res, 500, "Internal server error", null);
  }
});

// Soft delete GL account
router.delete("/:id", validateToken, logDeleteOperation("GL Account"), async (req, res) => {
  try {
    const username = req.user?.username || null;
    const [count] = await GLAccounts.update(
      { 
        isDeleted: 1, 
        modifiedOn: new Date(), 
        modifiedBy: username 
      },
      { where: { id: req.params.id, isDeleted: 0 } }
    );
    
    if (!count) return respond(res, 404, "GL Account not found", null);
    respond(res, 200, "GL Account deleted", null);
  } catch (err) {
    respond(res, 500, "Internal server error", null);
  }
});

module.exports = router;
