const express = require("express");
const router = express.Router();
const { Branch } = require("../models");
const { validateToken } = require("../middlewares/AuthMiddleware");
const { logViewOperation, logCreateOperation, logUpdateOperation, logDeleteOperation } = require("../middlewares/LoggingMiddleware");

const respond = (res, code, message, entity = null) => {
  res.status(code).json({ code, message, entity });
};

const handleError = (res, err, defaultMessage = "An error occurred") => {
  console.error("Branch Route Error:", err);
  
  // Handle Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    const validationErrors = err.errors.map(error => error.message).join(', ');
    return respond(res, 400, `Validation Error: ${validationErrors}`);
  }
  
  // Handle Sequelize unique constraint errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0]?.path || 'field';
    return respond(res, 409, `${field} already exists`);
  }
  
  // Handle Sequelize foreign key constraint errors
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return respond(res, 400, "Referenced record does not exist");
  }
  
  // Handle database connection errors
  if (err.name === 'SequelizeConnectionError') {
    return respond(res, 503, "Database connection failed");
  }
  
  // Handle generic errors
  const errorMessage = err.message || defaultMessage;
  return respond(res, 500, errorMessage);
};

// List with optional status filter and search
router.get("/", validateToken, logViewOperation("Branch"), async (req, res) => {
  try {
    const { status, q, saccoId } = req.query;
    const where = { isDeleted: 0 };
    
    // Validate status filter if provided
    if (status && !['Active', 'Inactive'].includes(status)) {
      return respond(res, 400, "Invalid status filter. Must be 'Active' or 'Inactive'");
    }
    
    if (status) where.status = status;
    if (saccoId) where.saccoId = saccoId;
    
    if (q) {
      const { Op } = require("sequelize");
      where[Op.or] = [
        { branchId: { [Op.like]: `%${q}%` } },
        { branchName: { [Op.like]: `%${q}%` } },
        { branchLocation: { [Op.like]: `%${q}%` } },
      ];
    }
    
    const branches = await Branch.findAll({ where, order: [["createdOn", "DESC"]] });
    respond(res, 200, "Branches fetched successfully", branches);
  } catch (err) {
    handleError(res, err, "Failed to fetch branches");
  }
});

// Get one
router.get("/:id", validateToken, logViewOperation("Branch"), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return respond(res, 400, "Invalid branch ID");
    }
    
    const branch = await Branch.findByPk(id);
    if (!branch || branch.isDeleted) {
      return respond(res, 404, "Branch not found");
    }
    
    respond(res, 200, "Branch fetched successfully", branch);
  } catch (err) {
    handleError(res, err, "Failed to fetch branch");
  }
});

// Create
router.post("/", validateToken, logCreateOperation("Branch"), async (req, res) => {
  try {
    const data = req.body || {};
    const username = req.user?.username || null;
    
    // Validate required fields
    if (!data.branchId || !data.saccoId || !data.branchName) {
      return respond(res, 400, "Missing required fields: branchId, saccoId, and branchName are required");
    }
    
    const payload = {
      branchId: data.branchId.trim(),
      saccoId: data.saccoId.trim(),
      branchName: data.branchName.trim(),
      branchLocation: data.branchLocation ? data.branchLocation.trim() : null,
      status: "Active",
      createdOn: new Date(),
      createdBy: username,
    };
    
    const created = await Branch.create(payload);
    respond(res, 201, "Branch created successfully", created);
  } catch (err) {
    handleError(res, err, "Failed to create branch");
  }
});

// Update
router.put("/:id", validateToken, logUpdateOperation("Branch"), async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body || {};
    const username = req.user?.username || null;
    
    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return respond(res, 400, "Invalid branch ID");
    }
    
    // Check if branch exists and is not deleted
    const existingBranch = await Branch.findOne({ where: { id, isDeleted: 0 } });
    if (!existingBranch) {
      return respond(res, 404, "Branch not found");
    }
    
    // Validate required fields if provided
    if (data.branchId !== undefined && !data.branchId) {
      return respond(res, 400, "branchId cannot be empty");
    }
    if (data.saccoId !== undefined && !data.saccoId) {
      return respond(res, 400, "saccoId cannot be empty");
    }
    if (data.branchName !== undefined && !data.branchName) {
      return respond(res, 400, "branchName cannot be empty");
    }
    
    // Validate status if provided
    if (data.status && !['Active', 'Inactive'].includes(data.status)) {
      return respond(res, 400, "Invalid status. Must be 'Active' or 'Inactive'");
    }
    
    const updatePayload = {
      branchId: data.branchId ? data.branchId.trim() : undefined,
      saccoId: data.saccoId ? data.saccoId.trim() : undefined,
      branchName: data.branchName ? data.branchName.trim() : undefined,
      branchLocation: data.branchLocation !== undefined ? (data.branchLocation ? data.branchLocation.trim() : null) : undefined,
      status: data.status || undefined,
      verifierRemarks: data.verifierRemarks !== undefined ? (data.verifierRemarks ? data.verifierRemarks.trim() : null) : undefined,
      modifiedOn: new Date(),
      modifiedBy: username,
    };
    
    // Remove undefined values
    Object.keys(updatePayload).forEach(key => {
      if (updatePayload[key] === undefined) {
        delete updatePayload[key];
      }
    });
    
    const [count] = await Branch.update(updatePayload, { where: { id, isDeleted: 0 } });
    if (!count) {
      return respond(res, 404, "Branch not found or no changes made");
    }
    
    const updated = await Branch.findByPk(id);
    respond(res, 200, "Branch updated successfully", updated);
  } catch (err) {
    handleError(res, err, "Failed to update branch");
  }
});

// Bulk status update
router.put("/bulk/status", validateToken, logUpdateOperation("Branch"), async (req, res) => {
  try {
    const { ids, status, verifierRemarks } = req.body;
    const username = req.user?.username || null;
    
    // Validate required fields
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return respond(res, 400, "ids array is required and must not be empty");
    }
    
    if (!status || !['Active', 'Inactive'].includes(status)) {
      return respond(res, 400, "status is required and must be 'Active' or 'Inactive'");
    }
    
    // Validate all IDs are numbers
    const invalidIds = ids.filter(id => !id || isNaN(parseInt(id)));
    if (invalidIds.length > 0) {
      return respond(res, 400, "All IDs must be valid numbers");
    }
    
    // Check if all branches exist and are not deleted
    const existingBranches = await Branch.findAll({ 
      where: { 
        id: ids, 
        isDeleted: 0 
      } 
    });
    
    if (existingBranches.length !== ids.length) {
      return respond(res, 404, "One or more branches not found or already deleted");
    }
    
    const updatePayload = {
      status,
      verifierRemarks: verifierRemarks ? verifierRemarks.trim() : null,
      modifiedOn: new Date(),
      modifiedBy: username,
    };
    
    const [count] = await Branch.update(updatePayload, { 
      where: { 
        id: ids, 
        isDeleted: 0 
      } 
    });
    
    respond(res, 200, `${count} branch(es) status updated successfully`, { updatedCount: count });
  } catch (err) {
    handleError(res, err, "Failed to update branch statuses");
  }
});

// Soft delete
router.delete("/:id", validateToken, logDeleteOperation("Branch"), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return respond(res, 400, "Invalid branch ID");
    }
    
    // Check if branch exists and is not already deleted
    const existingBranch = await Branch.findOne({ where: { id, isDeleted: 0 } });
    if (!existingBranch) {
      return respond(res, 404, "Branch not found or already deleted");
    }
    
    const [count] = await Branch.update({ isDeleted: 1 }, { where: { id } });
    if (!count) {
      return respond(res, 404, "Branch not found");
    }
    
    respond(res, 200, "Branch deleted successfully");
  } catch (err) {
    handleError(res, err, "Failed to delete branch");
  }
});

module.exports = router;
