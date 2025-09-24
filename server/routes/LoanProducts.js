const express = require("express");
const router = express.Router();
const { LoanProducts, AccountTypes, Sacco } = require("../models");
const { validateToken } = require("../middlewares/AuthMiddleware");
const { logViewOperation, logCreateOperation, logUpdateOperation, logDeleteOperation } = require("../middlewares/LoggingMiddleware");
const { Op } = require("sequelize");

const respond = (res, code, message, entity) => {
  res.status(code).json({ code, message, entity });
};

// List with optional status filter and search
router.get("/", validateToken, logViewOperation("LoanProduct"), async (req, res) => {
  try {
    const { status, q } = req.query;
    const where = { 
      isDeleted: 0,
      status: { [Op.ne]: "Deleted" } // Exclude deleted loan products
    };
    if (status) where.status = status;
    if (q) {
      where[Op.or] = [
        { loanProductId: { [Op.like]: `%${q}%` } },
        { loanProductName: { [Op.like]: `%${q}%` } },
        { loanProductType: { [Op.like]: `%${q}%` } },
        { description: { [Op.like]: `%${q}%` } },
      ];
    }
    const loanProducts = await LoanProducts.findAll({ 
      where, 
      include: [
        {
          model: Sacco,
          as: 'sacco',
          required: false
        }
      ],
      order: [["createdOn", "DESC"]] 
    });
    respond(res, 200, "Loan products fetched", loanProducts);
  } catch (err) {
    respond(res, 500, err.message);
  }
});

// Get one
router.get("/:id", validateToken, logViewOperation("LoanProduct"), async (req, res) => {
  try {
    const loanProduct = await LoanProducts.findByPk(req.params.id, {
      include: [
        {
          model: Sacco,
          as: 'sacco',
          required: false
        }
      ]
    });
    if (!loanProduct || loanProduct.isDeleted || loanProduct.status === "Deleted") return respond(res, 404, "Not found");
    respond(res, 200, "Loan product fetched", loanProduct);
  } catch (err) {
    respond(res, 500, err.message);
  }
});

// Test endpoint without authentication
router.post("/test", async (req, res) => {
  try {
    console.log("=== LOAN PRODUCT CREATION TEST DEBUG ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    
    const data = req.body || {};
    const username = "test-user";
    
    // Look up the correct Sacco ID from the saccoId
    let saccoDbId = null;
    if (data.saccoId) {
      const sacco = await Sacco.findOne({ where: { saccoId: data.saccoId } });
      if (sacco) {
        saccoDbId = sacco.id;
        console.log(`Mapped saccoId ${data.saccoId} to database ID ${saccoDbId}`);
      } else {
        console.error(`Sacco with saccoId ${data.saccoId} not found`);
        return respond(res, 400, `Sacco with ID ${data.saccoId} not found`);
      }
    }
    
    // Auto-generate loanProductId if not provided
    let loanProductId = data.loanProductId;
    if (!loanProductId) {
      // Generate a unique ID based on loan product name and timestamp
      const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
      const namePrefix = data.loanProductName
        ? data.loanProductName.replace(/[^A-Za-z0-9]/g, '').substring(0, 3).toUpperCase()
        : 'LP';
      loanProductId = `${namePrefix}${timestamp}`;
      console.log(`Auto-generated loanProductId: ${loanProductId}`);
    }
    
    const payload = {
      loanProductId: loanProductId,
      loanProductName: data.loanProductName,
      saccoId: saccoDbId,
      loanProductType: data.loanProductType || 'LOAN',
      loanProductStatus: data.loanProductStatus || "Pending",
      status: "Pending",
      description: data.description || null,
      needGuarantors: data.needGuarantors || false,
      maxGuarantors: data.maxGuarantors || null,
      minGuarantors: data.minGuarantors || null,
      createdOn: new Date(),
      createdBy: username,
    };
    
    console.log("Creating loan product with payload:", JSON.stringify(payload, null, 2));
    const created = await LoanProducts.create(payload);
    console.log("Loan product created successfully:", created.id);
    
    // Try to automatically create a default AccountType for this loan product
    let accountType = null;
    try {
      console.log("=== ACCOUNT TYPE CREATION DEBUG ===");
      console.log("Loan product created with ID:", created.id);
      console.log("Loan product data:", JSON.stringify(created.dataValues, null, 2));
      console.log("Sacco DB ID:", saccoDbId);
      
      // Validate required data before creating account type
      if (!created.id) {
        throw new Error("Loan product ID is missing");
      }
      if (!saccoDbId) {
        throw new Error("Sacco ID is missing");
      }
      if (!created.loanProductId) {
        throw new Error("Loan product ID string is missing");
      }
      if (!created.loanProductName) {
        throw new Error("Loan product name is missing");
      }
      
      const generateAccountTypeId = (loanProductId) => {
        // Extract the numeric part from the loan product ID (last 6 digits)
        const productDigits = loanProductId.slice(-6);
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        return `AT-${productDigits}${randomNum}`;
      };
      
      const accountTypeId = generateAccountTypeId(created.loanProductId);
      console.log("Generated account type ID:", accountTypeId);
      
      // Check if account type ID already exists
      const existingAccountType = await AccountTypes.findOne({ where: { accountTypeId } });
      if (existingAccountType) {
        throw new Error(`Account type with ID ${accountTypeId} already exists`);
      }
      
      const accountTypePayload = {
        accountTypeId: accountTypeId,
        accountTypeName: `${created.loanProductName} Account Type`,
        saccoId: saccoDbId || 'SYSTEM', // Use 'SYSTEM' as default if no saccoId provided
        productId: created.id,
        accountType: 'MEMBER',
        bosaFosa: 'BOSA', // Always use BOSA for loan products
        debitCredit: 'DEBIT',
        appliedOnMemberOnboarding: false,
        isWithdrawable: false, // Loan accounts are typically not withdrawable
        withdrawableFrom: null,
        interestRate: null,
        interestType: null,
        interestCalculationRule: null,
        interestFrequency: null,
        chargeIds: null,
        currency: 'KES', // Default currency
        status: 'Draft',
        createdOn: new Date(),
        createdBy: username,
      };
      
      console.log("Account type payload validation:");
      console.log("- accountTypeId:", accountTypePayload.accountTypeId, typeof accountTypePayload.accountTypeId);
      console.log("- accountTypeName:", accountTypePayload.accountTypeName, typeof accountTypePayload.accountTypeName);
      console.log("- saccoId:", accountTypePayload.saccoId, typeof accountTypePayload.saccoId);
      console.log("- productId:", accountTypePayload.productId, typeof accountTypePayload.productId);
      console.log("- accountType:", accountTypePayload.accountType, typeof accountTypePayload.accountType);
      console.log("- bosaFosa:", accountTypePayload.bosaFosa, typeof accountTypePayload.bosaFosa);
      console.log("- debitCredit:", accountTypePayload.debitCredit, typeof accountTypePayload.debitCredit);
      console.log("- currency:", accountTypePayload.currency, typeof accountTypePayload.currency);
      console.log("- status:", accountTypePayload.status, typeof accountTypePayload.status);
      
      // Validate enum values
      const validAccountTypes = ['MEMBER', 'GL'];
      const validBosaFosa = ['BOSA', 'FOSA'];
      const validDebitCredit = ['DEBIT', 'CREDIT'];
      const validStatuses = ['Draft', 'Pending', 'Active', 'Inactive', 'Deleted'];
      
      if (!validAccountTypes.includes(accountTypePayload.accountType)) {
        throw new Error(`Invalid accountType: ${accountTypePayload.accountType}. Must be one of: ${validAccountTypes.join(', ')}`);
      }
      if (!validBosaFosa.includes(accountTypePayload.bosaFosa)) {
        throw new Error(`Invalid bosaFosa: ${accountTypePayload.bosaFosa}. Must be one of: ${validBosaFosa.join(', ')}`);
      }
      if (!validDebitCredit.includes(accountTypePayload.debitCredit)) {
        throw new Error(`Invalid debitCredit: ${accountTypePayload.debitCredit}. Must be one of: ${validDebitCredit.join(', ')}`);
      }
      if (!validStatuses.includes(accountTypePayload.status)) {
        throw new Error(`Invalid status: ${accountTypePayload.status}. Must be one of: ${validStatuses.join(', ')}`);
      }
      
      console.log("All validations passed. Creating account type...");
      console.log("Full payload:", JSON.stringify(accountTypePayload, null, 2));
      
      accountType = await AccountTypes.create(accountTypePayload);
      console.log("✅ Account type created successfully!");
      console.log("Account type ID:", accountType.id);
      console.log("Account type data:", JSON.stringify(accountType.dataValues, null, 2));
      
    } catch (accountTypeError) {
      console.error("❌ ACCOUNT TYPE CREATION FAILED");
      console.error("Error name:", accountTypeError.name);
      console.error("Error message:", accountTypeError.message);
      console.error("Error stack:", accountTypeError.stack);
      
      // Handle specific error types
      if (accountTypeError.name === 'SequelizeValidationError') {
        console.error("Validation errors:");
        accountTypeError.errors.forEach((error, index) => {
          console.error(`  ${index + 1}. Field: ${error.path}, Message: ${error.message}, Value: ${error.value}`);
        });
      } else if (accountTypeError.name === 'SequelizeUniqueConstraintError') {
        console.error("Unique constraint violation:");
        console.error("Fields:", accountTypeError.fields);
        console.error("Table:", accountTypeError.table);
      } else if (accountTypeError.name === 'SequelizeForeignKeyConstraintError') {
        console.error("Foreign key constraint error:");
        console.error("Table:", accountTypeError.table);
        console.error("Fields:", accountTypeError.fields);
        console.error("Value:", accountTypeError.value);
        console.error("Index:", accountTypeError.index);
      } else if (accountTypeError.name === 'SequelizeDatabaseError') {
        console.error("Database error:");
        console.error("SQL:", accountTypeError.sql);
        console.error("Parameters:", accountTypeError.parameters);
        if (accountTypeError.original) {
          console.error("Original error:", accountTypeError.original);
        }
      }
      
      console.error("Full error object:", JSON.stringify(accountTypeError, null, 2));
      // Continue without failing the loan product creation
    }
    
    const responseData = { loanProduct: created };
    if (accountType) {
      responseData.accountType = accountType;
    }
    
    respond(res, 201, accountType ? "Loan product created with default account type" : "Loan product created successfully", responseData);
  } catch (err) {
    console.error("=== LOAN PRODUCT CREATION TEST ERROR ===");
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);
    console.error("Full error:", err);
    
    // Map common Sequelize errors to client-friendly messages
    if (err?.name === 'SequelizeUniqueConstraintError') {
      return respond(res, 400, 'Loan product ID already exists');
    }
    if (err?.name === 'SequelizeValidationError') {
      const detail = err?.errors?.[0]?.message || 'Validation error';
      return respond(res, 400, detail);
    }
    respond(res, 500, err.message || 'Internal server error');
  }
});

// Create
router.post("/", validateToken, logCreateOperation("LoanProduct"), async (req, res) => {
  try {
    console.log("=== LOAN PRODUCT CREATION DEBUG ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    console.log("User:", req.user);
    
    const data = req.body || {};
    const username = req.user?.username || null;
    
    // Look up the correct Sacco ID from the saccoId
    let saccoDbId = null;
    if (data.saccoId) {
      const sacco = await Sacco.findOne({ where: { saccoId: data.saccoId } });
      if (sacco) {
        saccoDbId = sacco.id;
        console.log(`Mapped saccoId ${data.saccoId} to database ID ${saccoDbId}`);
      } else {
        console.error(`Sacco with saccoId ${data.saccoId} not found`);
        return respond(res, 400, `Sacco with ID ${data.saccoId} not found`);
      }
    }
    
    // Auto-generate loanProductId if not provided
    let loanProductId = data.loanProductId;
    if (!loanProductId) {
      // Generate a unique ID based on loan product name and timestamp
      const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
      const namePrefix = data.loanProductName
        ? data.loanProductName.replace(/[^A-Za-z0-9]/g, '').substring(0, 3).toUpperCase()
        : 'LP';
      loanProductId = `${namePrefix}${timestamp}`;
      console.log(`Auto-generated loanProductId: ${loanProductId}`);
    }
    
    const payload = {
      loanProductId: loanProductId,
      loanProductName: data.loanProductName,
      saccoId: saccoDbId,
      loanProductType: data.loanProductType || 'LOAN',
      loanProductStatus: data.loanProductStatus || "Pending",
      status: "Pending",
      description: data.description || null,
      needGuarantors: data.needGuarantors || false,
      maxGuarantors: data.maxGuarantors || null,
      minGuarantors: data.minGuarantors || null,
      createdOn: new Date(),
      createdBy: username,
    };
    
    console.log("Creating loan product with payload:", JSON.stringify(payload, null, 2));
    const created = await LoanProducts.create(payload);
    console.log("Loan product created successfully:", created.id);
    
    // Try to automatically create a default AccountType for this loan product
    let accountType = null;
    try {
      const generateAccountTypeId = (loanProductId) => {
        // Extract the numeric part from the loan product ID (last 6 digits)
        const productDigits = loanProductId.slice(-6);
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        return `AT-${productDigits}${randomNum}`;
      };
      
      const accountTypePayload = {
        accountTypeId: generateAccountTypeId(created.loanProductId),
        accountTypeName: `${created.loanProductName} Account Type`,
        saccoId: saccoDbId || 'SYSTEM', // Use 'SYSTEM' as default if no saccoId provided
        productId: created.id,
        accountType: 'MEMBER',
        bosaFosa: 'BOSA', // Always use BOSA for loan products
        debitCredit: 'DEBIT',
        appliedOnMemberOnboarding: false,
        isWithdrawable: false, // Loan accounts are typically not withdrawable
        withdrawableFrom: null,
        interestRate: null,
        interestType: null,
        interestCalculationRule: null,
        interestFrequency: null,
        chargeIds: null,
        currency: 'KES', // Default currency
        status: 'Draft',
        createdOn: new Date(),
        createdBy: username,
      };
      
      console.log("Creating account type with payload:", JSON.stringify(accountTypePayload, null, 2));
      accountType = await AccountTypes.create(accountTypePayload);
      console.log("Account type created successfully:", accountType.id);
    } catch (accountTypeError) {
      console.error("❌ ACCOUNT TYPE CREATION FAILED (AUTHENTICATED)");
      console.error("Error name:", accountTypeError.name);
      console.error("Error message:", accountTypeError.message);
      console.error("Error stack:", accountTypeError.stack);
      
      // Handle specific error types
      if (accountTypeError.name === 'SequelizeValidationError') {
        console.error("Validation errors:");
        accountTypeError.errors.forEach((error, index) => {
          console.error(`  ${index + 1}. Field: ${error.path}, Message: ${error.message}, Value: ${error.value}`);
        });
      } else if (accountTypeError.name === 'SequelizeUniqueConstraintError') {
        console.error("Unique constraint violation:");
        console.error("Fields:", accountTypeError.fields);
        console.error("Table:", accountTypeError.table);
      } else if (accountTypeError.name === 'SequelizeForeignKeyConstraintError') {
        console.error("Foreign key constraint error:");
        console.error("Table:", accountTypeError.table);
        console.error("Fields:", accountTypeError.fields);
        console.error("Value:", accountTypeError.value);
        console.error("Index:", accountTypeError.index);
      } else if (accountTypeError.name === 'SequelizeDatabaseError') {
        console.error("Database error:");
        console.error("SQL:", accountTypeError.sql);
        console.error("Parameters:", accountTypeError.parameters);
        if (accountTypeError.original) {
          console.error("Original error:", accountTypeError.original);
        }
      }
      
      console.error("Full error object:", JSON.stringify(accountTypeError, null, 2));
      // Continue without failing the loan product creation
    }
    
    const responseData = { loanProduct: created };
    if (accountType) {
      responseData.accountType = accountType;
    }
    
    respond(res, 201, accountType ? "Loan product created with default account type" : "Loan product created successfully", responseData);
  } catch (err) {
    console.error("=== LOAN PRODUCT CREATION ERROR ===");
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);
    console.error("Full error:", err);
    
    // Map common Sequelize errors to client-friendly messages
    if (err?.name === 'SequelizeUniqueConstraintError') {
      return respond(res, 400, 'Loan product ID already exists');
    }
    if (err?.name === 'SequelizeValidationError') {
      const detail = err?.errors?.[0]?.message || 'Validation error';
      return respond(res, 400, detail);
    }
    respond(res, 500, err.message || 'Internal server error');
  }
});

// Test endpoint for update without authentication
router.put("/:id/test", async (req, res) => {
  try {
    const data = req.body || {};
    const username = "test-user";
    const updatePayload = {
      loanProductId: data.loanProductId,
      loanProductName: data.loanProductName,
      saccoId: data.saccoId,
      loanProductType: data.loanProductType,
      loanProductStatus: data.loanProductStatus,
      description: data.description,
      needGuarantors: data.needGuarantors,
      maxGuarantors: data.maxGuarantors,
      minGuarantors: data.minGuarantors,
      verifierRemarks: data.verifierRemarks,
      status: data.status,
      modifiedOn: new Date(),
      modifiedBy: username,
    };
    
    // Remove undefined values
    Object.keys(updatePayload).forEach(key => {
      if (updatePayload[key] === undefined) {
        delete updatePayload[key];
      }
    });
    
    const [count] = await LoanProducts.update(updatePayload, { 
      where: { 
        id: req.params.id, 
        isDeleted: 0,
        status: { [Op.ne]: "Deleted" }
      } 
    });
    if (!count) return respond(res, 404, "Not found");
    const updated = await LoanProducts.findByPk(req.params.id);
    respond(res, 200, "Loan product updated (TEST MODE)", updated);
  } catch (err) {
    respond(res, 500, err.message);
  }
});

// Update
router.put("/:id", validateToken, logUpdateOperation("LoanProduct"), async (req, res) => {
  try {
    const data = req.body || {};
    const username = req.user?.username || null;
    const updatePayload = {
      loanProductId: data.loanProductId,
      loanProductName: data.loanProductName,
      saccoId: data.saccoId,
      loanProductType: data.loanProductType,
      loanProductStatus: data.loanProductStatus,
      description: data.description,
      needGuarantors: data.needGuarantors,
      maxGuarantors: data.maxGuarantors,
      minGuarantors: data.minGuarantors,
      verifierRemarks: data.verifierRemarks,
      status: data.status,
      modifiedOn: new Date(),
      modifiedBy: username,
    };
    
    // Remove undefined values
    Object.keys(updatePayload).forEach(key => {
      if (updatePayload[key] === undefined) {
        delete updatePayload[key];
      }
    });
    
    const [count] = await LoanProducts.update(updatePayload, { 
      where: { 
        id: req.params.id, 
        isDeleted: 0,
        status: { [Op.ne]: "Deleted" }
      } 
    });
    if (!count) return respond(res, 404, "Not found");
    const updated = await LoanProducts.findByPk(req.params.id);
    respond(res, 200, "Loan product updated", updated);
  } catch (err) {
    respond(res, 500, err.message);
  }
});

// Soft delete
router.delete("/:id", validateToken, logDeleteOperation("LoanProduct"), async (req, res) => {
  try {
    const [count] = await LoanProducts.update({ 
      isDeleted: 1, 
      status: "Deleted",
      modifiedOn: new Date(),
      modifiedBy: req.user?.username || "System"
    }, { where: { id: req.params.id } });
    if (!count) return respond(res, 404, "Not found");
    respond(res, 200, "Loan product deleted");
  } catch (err) {
    respond(res, 500, err.message);
  }
});


module.exports = router;
