const express = require("express");
const router = express.Router();
const { AccountTypes, Products, LoanProducts, Sacco } = require("../models");
const { validateToken } = require("../middlewares/AuthMiddleware");
const { logViewOperation, logCreateOperation, logUpdateOperation, logDeleteOperation } = require("../middlewares/LoggingMiddleware");
const { Op } = require("sequelize");

const respond = (res, code, message, entity) => {
  res.status(code).json({ code, message, entity });
};

// Helper function to generate AccountType ID
const generateAccountTypeId = (productId) => {
  const productDigits = productId.replace('P-', '');
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `AT-${productDigits}${randomNum}`;
};

// List with optional status filter and search
router.get("/", validateToken, logViewOperation("AccountType"), async (req, res) => {
  try {
    const { status, q, productId } = req.query;
    const where = { 
      isDeleted: 0,
      status: { [Op.ne]: "Deleted" }
    };
    
    if (status) where.status = status;
    if (productId) where.productId = productId;
    
    if (q) {
      where[Op.or] = [
        { accountTypeId: { [Op.like]: `%${q}%` } },
        { accountTypeName: { [Op.like]: `%${q}%` } },
        { currency: { [Op.like]: `%${q}%` } },
      ];
    }
    
    const accountTypes = await AccountTypes.findAll({ 
      where, 
      include: [
        { 
          model: Products, 
          as: 'product',
          attributes: ['id', 'productId', 'productName', 'saccoId', 'productType', 'productStatus', 'status', 'description', 'createdOn', 'createdBy', 'modifiedOn', 'modifiedBy', 'approvedBy', 'approvedOn', 'verifierRemarks', 'isDeleted']
        },
        { 
          model: LoanProducts, 
          as: 'loanProduct',
          attributes: ['id', 'loanProductId', 'loanProductName', 'saccoId', 'loanProductType', 'loanProductStatus', 'status', 'description', 'createdOn', 'createdBy', 'modifiedOn', 'modifiedBy', 'approvedBy', 'approvedOn', 'verifierRemarks', 'isDeleted']
        },
        { model: Sacco, as: 'sacco' }
      ],
      order: [["createdOn", "DESC"]] 
    });
    respond(res, 200, "Account types fetched", accountTypes);
  } catch (err) {
    respond(res, 500, err.message);
  }
});

// Get account types by product ID
router.get("/product/:productId", validateToken, logViewOperation("AccountType"), async (req, res) => {
  try {
    const accountTypes = await AccountTypes.findAll({
      where: { 
        productId: req.params.productId,
        isDeleted: 0,
        status: { [Op.ne]: "Deleted" }
      },
      include: [
        { 
          model: Products, 
          as: 'product',
          attributes: ['id', 'productId', 'productName', 'saccoId', 'productType', 'productStatus', 'status', 'description', 'createdOn', 'createdBy', 'modifiedOn', 'modifiedBy', 'approvedBy', 'approvedOn', 'verifierRemarks', 'isDeleted']
        },
        { 
          model: LoanProducts, 
          as: 'loanProduct',
          attributes: ['id', 'loanProductId', 'loanProductName', 'saccoId', 'loanProductType', 'loanProductStatus', 'status', 'description', 'createdOn', 'createdBy', 'modifiedOn', 'modifiedBy', 'approvedBy', 'approvedOn', 'verifierRemarks', 'isDeleted']
        },
        { model: Sacco, as: 'sacco' }
      ],
      order: [["createdOn", "DESC"]]
    });
    respond(res, 200, "Product account types fetched", accountTypes);
  } catch (err) {
    respond(res, 500, err.message);
  }
});

// Get one
router.get("/:id", validateToken, logViewOperation("AccountType"), async (req, res) => {
  try {
    const accountType = await AccountTypes.findByPk(req.params.id, {
      include: [
        { 
          model: Products, 
          as: 'product',
          attributes: ['id', 'productId', 'productName', 'saccoId', 'productType', 'productStatus', 'status', 'description', 'createdOn', 'createdBy', 'modifiedOn', 'modifiedBy', 'approvedBy', 'approvedOn', 'verifierRemarks', 'isDeleted']
        },
        { 
          model: LoanProducts, 
          as: 'loanProduct',
          attributes: ['id', 'loanProductId', 'loanProductName', 'saccoId', 'loanProductType', 'loanProductStatus', 'status', 'description', 'createdOn', 'createdBy', 'modifiedOn', 'modifiedBy', 'approvedBy', 'approvedOn', 'verifierRemarks', 'isDeleted']
        },
        { 
          model: LoanProducts, 
          as: 'loanProduct',
          attributes: ['id', 'loanProductId', 'loanProductName', 'saccoId', 'loanProductType', 'loanProductStatus', 'status', 'description', 'createdOn', 'createdBy', 'modifiedOn', 'modifiedBy', 'approvedBy', 'approvedOn', 'verifierRemarks', 'isDeleted']
        },
        { model: Sacco, as: 'sacco' }
      ]
    });
    if (!accountType || accountType.isDeleted || accountType.status === "Deleted") {
      return respond(res, 404, "Not found");
    }
    respond(res, 200, "Account type fetched", accountType);
  } catch (err) {
    respond(res, 500, err.message);
  }
});

// Create
router.post("/", validateToken, logCreateOperation("AccountType"), async (req, res) => {
  try {
    const data = req.body || {};
    const username = req.user?.username || null;
    
    // Validate required fields
    if (!data.productId) {
      return respond(res, 400, "Product ID is required");
    }
    
    // Get product details
    const product = await Products.findByPk(data.productId);
    if (!product || product.isDeleted) {
      return respond(res, 400, "Product not found");
    }
    
    const accountTypeId = generateAccountTypeId(product.productId);
    
    const payload = {
      accountTypeId,
      accountTypeName: data.accountTypeName || `${product.productName} Account Type`,
      saccoId: data.saccoId || product.saccoId,
      productId: data.productId,
      accountType: data.accountType || 'MEMBER',
      bosaFosa: data.bosaFosa || product.productType || 'BOSA',
      debitCredit: data.debitCredit || 'DEBIT',
      appliedOnMemberOnboarding: data.appliedOnMemberOnboarding || false,
      isWithdrawable: data.isWithdrawable !== undefined ? data.isWithdrawable : true,
      withdrawableFrom: data.withdrawableFrom || null,
      interestRate: data.interestRate || null,
      interestType: data.interestType || null,
      interestCalculationRule: data.interestCalculationRule || null,
      interestFrequency: data.interestFrequency || null,
      chargeIds: data.chargeIds || null,
      currency: data.currency || 'KES', // Default to KES since Products no longer has currency
      status: "Draft",
      remarks: data.remarks || null,
      createdOn: new Date(),
      createdBy: username,
    };
    
    const created = await AccountTypes.create(payload);
    
    // Fetch the created account type with associations
    const createdWithAssociations = await AccountTypes.findByPk(created.id, {
      include: [
        { 
          model: Products, 
          as: 'product',
          attributes: ['id', 'productId', 'productName', 'saccoId', 'productType', 'productStatus', 'status', 'description', 'createdOn', 'createdBy', 'modifiedOn', 'modifiedBy', 'approvedBy', 'approvedOn', 'verifierRemarks', 'isDeleted']
        },
        { 
          model: LoanProducts, 
          as: 'loanProduct',
          attributes: ['id', 'loanProductId', 'loanProductName', 'saccoId', 'loanProductType', 'loanProductStatus', 'status', 'description', 'createdOn', 'createdBy', 'modifiedOn', 'modifiedBy', 'approvedBy', 'approvedOn', 'verifierRemarks', 'isDeleted']
        },
        { model: Sacco, as: 'sacco' }
      ]
    });
    
    respond(res, 201, "Account type created", createdWithAssociations);
  } catch (err) {
    respond(res, 500, err.message);
  }
});

// Update
router.put("/:id", validateToken, logUpdateOperation("AccountType"), async (req, res) => {
  try {
    const data = req.body || {};
    const username = req.user?.username || null;
    
    const updatePayload = {
      accountTypeName: data.accountTypeName,
      accountType: data.accountType,
      bosaFosa: data.bosaFosa,
      debitCredit: data.debitCredit,
      appliedOnMemberOnboarding: data.appliedOnMemberOnboarding,
      isWithdrawable: data.isWithdrawable,
      withdrawableFrom: data.withdrawableFrom,
      interestRate: data.interestRate,
      interestType: data.interestType,
      interestCalculationRule: data.interestCalculationRule,
      interestFrequency: data.interestFrequency,
      chargeIds: data.chargeIds,
      currency: data.currency,
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
    
    const [count] = await AccountTypes.update(updatePayload, { 
      where: { 
        id: req.params.id, 
        isDeleted: 0,
        status: { [Op.ne]: "Deleted" }
      } 
    });
    
    if (!count) return respond(res, 404, "Not found");
    
    const updated = await AccountTypes.findByPk(req.params.id, {
      include: [
        { 
          model: Products, 
          as: 'product',
          attributes: ['id', 'productId', 'productName', 'saccoId', 'productType', 'productStatus', 'status', 'description', 'createdOn', 'createdBy', 'modifiedOn', 'modifiedBy', 'approvedBy', 'approvedOn', 'verifierRemarks', 'isDeleted']
        },
        { 
          model: LoanProducts, 
          as: 'loanProduct',
          attributes: ['id', 'loanProductId', 'loanProductName', 'saccoId', 'loanProductType', 'loanProductStatus', 'status', 'description', 'createdOn', 'createdBy', 'modifiedOn', 'modifiedBy', 'approvedBy', 'approvedOn', 'verifierRemarks', 'isDeleted']
        },
        { model: Sacco, as: 'sacco' }
      ]
    });
    
    respond(res, 200, "Account type updated", updated);
  } catch (err) {
    respond(res, 500, err.message);
  }
});

// Soft delete
router.delete("/:id", validateToken, logDeleteOperation("AccountType"), async (req, res) => {
  try {
    const [count] = await AccountTypes.update({ 
      isDeleted: 1, 
      status: "Deleted",
      modifiedOn: new Date(),
      modifiedBy: req.user?.username || "System"
    }, { where: { id: req.params.id } });
    
    if (!count) return respond(res, 404, "Not found");
    respond(res, 200, "Account type deleted");
  } catch (err) {
    respond(res, 500, err.message);
  }
});

// Submit account type for approval (change status from Draft to Pending)
router.put("/:id/submit", validateToken, logUpdateOperation("AccountType"), async (req, res) => {
  try {
    const username = req.user?.username || null;
    
    const [count] = await AccountTypes.update({ 
      status: "Pending",
      modifiedOn: new Date(),
      modifiedBy: username
    }, { 
      where: { 
        id: req.params.id, 
        isDeleted: 0,
        status: "Draft"
      } 
    });
    
    if (!count) return respond(res, 404, "Account type not found or not in draft status");
    
    const updated = await AccountTypes.findByPk(req.params.id, {
      include: [
        { 
          model: Products, 
          as: 'product',
          attributes: ['id', 'productId', 'productName', 'saccoId', 'productType', 'productStatus', 'status', 'description', 'createdOn', 'createdBy', 'modifiedOn', 'modifiedBy', 'approvedBy', 'approvedOn', 'verifierRemarks', 'isDeleted']
        },
        { 
          model: LoanProducts, 
          as: 'loanProduct',
          attributes: ['id', 'loanProductId', 'loanProductName', 'saccoId', 'loanProductType', 'loanProductStatus', 'status', 'description', 'createdOn', 'createdBy', 'modifiedOn', 'modifiedBy', 'approvedBy', 'approvedOn', 'verifierRemarks', 'isDeleted']
        },
        { model: Sacco, as: 'sacco' }
      ]
    });
    
    respond(res, 200, "Account type submitted for approval", updated);
  } catch (err) {
    respond(res, 500, err.message);
  }
});

// Approve account type (change status from Pending to Active)
router.put("/:id/approve", validateToken, logUpdateOperation("AccountType"), async (req, res) => {
  try {
    const username = req.user?.username || null;
    const { verifierRemarks } = req.body || {};
    
    const [count] = await AccountTypes.update({ 
      status: "Active",
      approvedBy: username,
      approvedOn: new Date(),
      verifierRemarks: verifierRemarks || null,
      modifiedOn: new Date(),
      modifiedBy: username
    }, { 
      where: { 
        id: req.params.id, 
        isDeleted: 0,
        status: "Pending"
      } 
    });
    
    if (!count) return respond(res, 404, "Account type not found or not in pending status");
    
    const updated = await AccountTypes.findByPk(req.params.id, {
      include: [
        { 
          model: Products, 
          as: 'product',
          attributes: ['id', 'productId', 'productName', 'saccoId', 'productType', 'productStatus', 'status', 'description', 'createdOn', 'createdBy', 'modifiedOn', 'modifiedBy', 'approvedBy', 'approvedOn', 'verifierRemarks', 'isDeleted']
        },
        { 
          model: LoanProducts, 
          as: 'loanProduct',
          attributes: ['id', 'loanProductId', 'loanProductName', 'saccoId', 'loanProductType', 'loanProductStatus', 'status', 'description', 'createdOn', 'createdBy', 'modifiedOn', 'modifiedBy', 'approvedBy', 'approvedOn', 'verifierRemarks', 'isDeleted']
        },
        { model: Sacco, as: 'sacco' }
      ]
    });
    
    respond(res, 200, "Account type approved", updated);
  } catch (err) {
    respond(res, 500, err.message);
  }
});

// Reject account type (change status from Pending back to Draft)
router.put("/:id/reject", validateToken, logUpdateOperation("AccountType"), async (req, res) => {
  try {
    const username = req.user?.username || null;
    const { verifierRemarks } = req.body || {};
    
    const [count] = await AccountTypes.update({ 
      status: "Draft",
      verifierRemarks: verifierRemarks || null,
      modifiedOn: new Date(),
      modifiedBy: username
    }, { 
      where: { 
        id: req.params.id, 
        isDeleted: 0,
        status: "Pending"
      } 
    });
    
    if (!count) return respond(res, 404, "Account type not found or not in pending status");
    
    const updated = await AccountTypes.findByPk(req.params.id, {
      include: [
        { 
          model: Products, 
          as: 'product',
          attributes: ['id', 'productId', 'productName', 'saccoId', 'productType', 'productStatus', 'status', 'description', 'createdOn', 'createdBy', 'modifiedOn', 'modifiedBy', 'approvedBy', 'approvedOn', 'verifierRemarks', 'isDeleted']
        },
        { 
          model: LoanProducts, 
          as: 'loanProduct',
          attributes: ['id', 'loanProductId', 'loanProductName', 'saccoId', 'loanProductType', 'loanProductStatus', 'status', 'description', 'createdOn', 'createdBy', 'modifiedOn', 'modifiedBy', 'approvedBy', 'approvedOn', 'verifierRemarks', 'isDeleted']
        },
        { model: Sacco, as: 'sacco' }
      ]
    });
    
    respond(res, 200, "Account type rejected and returned to draft", updated);
  } catch (err) {
    respond(res, 500, err.message);
  }
});

// Activate account type (change status from Draft to Active) - Legacy endpoint
router.put("/:id/activate", validateToken, logUpdateOperation("AccountType"), async (req, res) => {
  try {
    const username = req.user?.username || null;
    
    const [count] = await AccountTypes.update({ 
      status: "Active",
      approvedBy: username,
      approvedOn: new Date(),
      modifiedOn: new Date(),
      modifiedBy: username
    }, { 
      where: { 
        id: req.params.id, 
        isDeleted: 0,
        status: "Draft"
      } 
    });
    
    if (!count) return respond(res, 404, "Account type not found or not in draft status");
    
    const updated = await AccountTypes.findByPk(req.params.id, {
      include: [
        { 
          model: Products, 
          as: 'product',
          attributes: ['id', 'productId', 'productName', 'saccoId', 'productType', 'productStatus', 'status', 'description', 'createdOn', 'createdBy', 'modifiedOn', 'modifiedBy', 'approvedBy', 'approvedOn', 'verifierRemarks', 'isDeleted']
        },
        { 
          model: LoanProducts, 
          as: 'loanProduct',
          attributes: ['id', 'loanProductId', 'loanProductName', 'saccoId', 'loanProductType', 'loanProductStatus', 'status', 'description', 'createdOn', 'createdBy', 'modifiedOn', 'modifiedBy', 'approvedBy', 'approvedOn', 'verifierRemarks', 'isDeleted']
        },
        { model: Sacco, as: 'sacco' }
      ]
    });
    
    respond(res, 200, "Account type activated", updated);
  } catch (err) {
    respond(res, 500, err.message);
  }
});

module.exports = router;

