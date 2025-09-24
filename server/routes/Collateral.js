const express = require("express");
const router = express.Router();
const { Collateral, Members, LoanApplicationCollateral } = require("../models");
const { validateToken } = require("../middlewares/AuthMiddleware");
const { logViewOperation, logCreateOperation, logUpdateOperation, logDeleteOperation } = require("../middlewares/LoggingMiddleware");
const { Op } = require("sequelize");

const respond = (res, code, message, entity) => {
  res.status(code).json({ code, message, entity });
};

// Generate unique collateral ID
const generateCollateralId = () => {
  const prefix = "COL";
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
};

// List with optional filters and search
router.get("/", validateToken, logViewOperation("Collateral"), async (req, res) => {
  try {
    const { memberId, collateralType, status, q, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const where = { 
      isDeleted: 0,
      status: { [Op.ne]: "Deleted" }
    };
    
    if (memberId) where.memberId = memberId;
    if (collateralType) where.collateralType = collateralType;
    if (status) where.status = status;
    
    if (q) {
      where[Op.or] = [
        { collateralId: { [Op.like]: `%${q}%` } },
        { description: { [Op.like]: `%${q}%` } },
        { documentNumber: { [Op.like]: `%${q}%` } },
        { location: { [Op.like]: `%${q}%` } }
      ];
    }
    
    const { count, rows: collaterals } = await Collateral.findAndCountAll({ 
      where, 
      include: [
        {
          model: Members,
          as: 'member',
          required: false,
          attributes: ['id', 'firstName', 'lastName', 'memberNo']
        }
      ],
      order: [["createdOn", "DESC"]],
      limit: parseInt(limit),
      offset: offset
    });
    
    respond(res, 200, "Collaterals fetched", {
      collaterals,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (err) {
    respond(res, 500, err.message);
  }
});

// Get one
router.get("/:id", validateToken, logViewOperation("Collateral"), async (req, res) => {
  try {
    const collateral = await Collateral.findByPk(req.params.id, {
      include: [
        {
          model: Members,
          as: 'member',
          required: false,
          attributes: ['id', 'firstName', 'lastName', 'memberNo']
        }
      ]
    });
    
    if (!collateral || collateral.isDeleted || collateral.status === "Deleted") {
      return respond(res, 404, "Collateral not found");
    }
    
    respond(res, 200, "Collateral fetched", collateral);
  } catch (err) {
    respond(res, 500, err.message);
  }
});

// Get collaterals by member
router.get("/member/:memberId", validateToken, logViewOperation("Collateral"), async (req, res) => {
  try {
    const { memberId } = req.params;
    const { status } = req.query;
    
    const where = { 
      memberId: memberId,
      isDeleted: 0,
      status: { [Op.ne]: "Deleted" }
    };
    
    if (status) where.status = status;
    
    const collaterals = await Collateral.findAll({ 
      where, 
      include: [
        {
          model: Members,
          as: 'member',
          required: false,
          attributes: ['id', 'firstName', 'lastName', 'memberNo']
        }
      ],
      order: [["createdOn", "DESC"]]
    });
    
    respond(res, 200, "Member collaterals fetched", collaterals);
  } catch (err) {
    respond(res, 500, err.message);
  }
});

// Create
router.post("/", validateToken, logCreateOperation("Collateral"), async (req, res) => {
  try {
    console.log("=== COLLATERAL CREATION DEBUG ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    console.log("User:", req.user);
    
    const data = req.body || {};
    const username = req.user?.username || null;
    
    // Validate required fields
    if (!data.memberNo) {
      return respond(res, 400, "Member ID is required");
    }
    if (!data.collateralType) {
      return respond(res, 400, "Collateral type is required");
    }
    if (!data.description) {
      return respond(res, 400, "Description is required");
    }
    if (!data.value || parseFloat(data.value) <= 0) {
      return respond(res, 400, "Valid collateral value is required");
    }
    
    // Verify member exists
    const member = await Members.findByPk(data.memberNo);
    if (!member) {
      return respond(res, 400, "Member not found");
    }
    
    const payload = {
      collateralId: generateCollateralId(),
      memberNo: data.memberNo,
      collateralType: data.collateralType,
      description: data.description,
      value: parseFloat(data.value),
      currency: data.currency || 'USD',
      ownershipType: data.ownershipType || 'Full Ownership',
      ownershipPercentage: data.ownershipPercentage ? parseFloat(data.ownershipPercentage) : 100.00,
      location: data.location || null,
      condition: data.condition || null,
      appraisalDate: data.appraisalDate ? new Date(data.appraisalDate) : null,
      appraisedBy: data.appraisedBy || null,
      appraisalValue: data.appraisalValue ? parseFloat(data.appraisalValue) : null,
      documentNumber: data.documentNumber || null,
      documentType: data.documentType || null,
      insurancePolicyNumber: data.insurancePolicyNumber || null,
      insuranceCompany: data.insuranceCompany || null,
      insuranceExpiryDate: data.insuranceExpiryDate ? new Date(data.insuranceExpiryDate) : null,
      lienHolder: data.lienHolder || null,
      lienAmount: data.lienAmount ? parseFloat(data.lienAmount) : null,
      status: data.status || "Active",
      remarks: data.remarks || null,
      createdOn: new Date(),
      createdBy: username,
    };
    
    console.log("Creating collateral with payload:", JSON.stringify(payload, null, 2));
    const created = await Collateral.create(payload);
    console.log("Collateral created successfully:", created.id);
    
    // Fetch the created collateral with member details
    const createdWithDetails = await Collateral.findByPk(created.id, {
      include: [
        {
          model: Members,
          as: 'member',
          required: false,
          attributes: ['id', 'firstName', 'lastName', 'memberNo']
        }
      ]
    });
    
    respond(res, 201, "Collateral created successfully", createdWithDetails);
  } catch (err) {
    console.error("=== COLLATERAL CREATION ERROR ===");
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);
    console.error("Full error:", err);
    
    // Map common Sequelize errors to client-friendly messages
    if (err?.name === 'SequelizeUniqueConstraintError') {
      return respond(res, 400, 'Collateral ID already exists');
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
router.put("/:id", validateToken, logUpdateOperation("Collateral"), async (req, res) => {
  try {
    const data = req.body || {};
    const username = req.user?.username || null;
    
    const updatePayload = {
      collateralType: data.collateralType,
      description: data.description,
      value: data.value ? parseFloat(data.value) : undefined,
      currency: data.currency,
      ownershipType: data.ownershipType,
      ownershipPercentage: data.ownershipPercentage ? parseFloat(data.ownershipPercentage) : undefined,
      location: data.location,
      condition: data.condition,
      appraisalDate: data.appraisalDate ? new Date(data.appraisalDate) : undefined,
      appraisedBy: data.appraisedBy,
      appraisalValue: data.appraisalValue ? parseFloat(data.appraisalValue) : undefined,
      documentNumber: data.documentNumber,
      documentType: data.documentType,
      insurancePolicyNumber: data.insurancePolicyNumber,
      insuranceCompany: data.insuranceCompany,
      insuranceExpiryDate: data.insuranceExpiryDate ? new Date(data.insuranceExpiryDate) : undefined,
      lienHolder: data.lienHolder,
      lienAmount: data.lienAmount ? parseFloat(data.lienAmount) : undefined,
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
    
    const [count] = await Collateral.update(updatePayload, { 
      where: { 
        id: req.params.id, 
        isDeleted: 0,
        status: { [Op.ne]: "Deleted" }
      } 
    });
    
    if (!count) return respond(res, 404, "Collateral not found");
    
    const updated = await Collateral.findByPk(req.params.id, {
      include: [
        {
          model: Members,
          as: 'member',
          required: false,
          attributes: ['id', 'firstName', 'lastName', 'memberNo']
        }
      ]
    });
    
    respond(res, 200, "Collateral updated", updated);
  } catch (err) {
    respond(res, 500, err.message);
  }
});

// Update status
router.put("/:id/status", validateToken, logUpdateOperation("Collateral"), async (req, res) => {
  try {
    const { status } = req.body;
    const username = req.user?.username || null;
    
    if (!status) {
      return respond(res, 400, "Status is required");
    }
    
    // Validate status values
    const validStatuses = ["Active", "Inactive", "Under Review", "Rejected", "Released"];
    if (!validStatuses.includes(status)) {
      return respond(res, 400, "Invalid status. Must be one of: " + validStatuses.join(", "));
    }
    
    const updatePayload = {
      status: status,
      modifiedOn: new Date(),
      modifiedBy: username,
    };
    
    // If approving, set approved fields
    if (status === "Active") {
      updatePayload.approvedOn = new Date();
      updatePayload.approvedBy = username;
    }
    
    const [count] = await Collateral.update(updatePayload, { 
      where: { 
        id: req.params.id, 
        isDeleted: 0,
        status: { [Op.ne]: "Deleted" }
      } 
    });
    
    if (!count) return respond(res, 404, "Collateral not found");
    
    const updated = await Collateral.findByPk(req.params.id, {
      include: [
        {
          model: Members,
          as: 'member',
          required: false,
          attributes: ['id', 'firstName', 'lastName', 'memberNo']
        }
      ]
    });
    
    respond(res, 200, "Collateral status updated", updated);
  } catch (err) {
    respond(res, 500, err.message);
  }
});

// Soft delete
router.delete("/:id", validateToken, logDeleteOperation("Collateral"), async (req, res) => {
  try {
    const [count] = await Collateral.update({ 
      isDeleted: 1, 
      status: "Deleted",
      modifiedOn: new Date(),
      modifiedBy: req.user?.username || "System"
    }, { where: { id: req.params.id } });
    
    if (!count) return respond(res, 404, "Collateral not found");
    
    respond(res, 200, "Collateral deleted");
  } catch (err) {
    respond(res, 500, err.message);
  }
});

// Get available collaterals for a member (for loan application)
router.get("/member/:memberId/available", validateToken, logViewOperation("Collateral"), async (req, res) => {
  try {
    const { memberId } = req.params;
    const { loanApplicationId } = req.query;
    
    const where = { 
      memberId: memberId,
      isDeleted: 0,
      status: "Active"
    };
    
    // If checking for a specific loan application, exclude collaterals already used
    if (loanApplicationId) {
      const usedCollaterals = await LoanApplicationCollateral.findAll({
        where: { loanApplicationId: loanApplicationId },
        attributes: ['collateralId']
      });
      
      const usedCollateralIds = usedCollaterals.map(uc => uc.collateralId);
      if (usedCollateralIds.length > 0) {
        where.id = { [Op.notIn]: usedCollateralIds };
      }
    }
    
    const collaterals = await Collateral.findAll({ 
      where, 
      include: [
        {
          model: Members,
          as: 'member',
          required: false,
          attributes: ['id', 'firstName', 'lastName', 'memberNo']
        }
      ],
      order: [["createdOn", "DESC"]]
    });
    
    respond(res, 200, "Available collaterals fetched", collaterals);
  } catch (err) {
    respond(res, 500, err.message);
  }
});

module.exports = router;
