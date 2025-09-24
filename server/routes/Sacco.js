const express = require("express");
const router = express.Router();
const { Sacco } = require("../models");
const { validateToken } = require("../middlewares/AuthMiddleware");
const { logViewOperation, logCreateOperation, logUpdateOperation, logDeleteOperation } = require("../middlewares/LoggingMiddleware");

const respond = (res, code, message, entity = null) => {
  res.status(code).json({ code, message, entity });
};

const handleError = (res, err, defaultMessage = "An error occurred") => {
  console.error("Sacco Route Error:", err);
  
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
router.get("/", validateToken, logViewOperation("Sacco"), async (req, res) => {
  try {
    const { status, q } = req.query;
    const where = { isDeleted: 0 };
    
    // Validate status filter if provided
    if (status && !['Active', 'Inactive'].includes(status)) {
      return respond(res, 400, "Invalid status filter. Must be 'Active' or 'Inactive'");
    }
    
    if (status) where.status = status;
    if (q) {
      const { Op } = require("sequelize");
      where[Op.or] = [
        { saccoId: { [Op.like]: `%${q}%` } },
        { licenseId: { [Op.like]: `%${q}%` } },
        { saccoName: { [Op.like]: `%${q}%` } },
        { contactEmail: { [Op.like]: `%${q}%` } },
      ];
    }
    
    const saccos = await Sacco.findAll({ where, order: [["createdOn", "DESC"]] });
    respond(res, 200, "Saccos fetched successfully", saccos);
  } catch (err) {
    handleError(res, err, "Failed to fetch saccos");
  }
});

// Get one
router.get("/:id", validateToken, logViewOperation("Sacco"), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return respond(res, 400, "Invalid sacco ID");
    }
    
    const sacco = await Sacco.findByPk(id);
    if (!sacco || sacco.isDeleted) {
      return respond(res, 404, "Sacco not found");
    }
    
    respond(res, 200, "Sacco fetched successfully", sacco);
  } catch (err) {
    handleError(res, err, "Failed to fetch sacco");
  }
});

// Create
router.post("/", validateToken, logCreateOperation("Sacco"), async (req, res) => {
  try {
    const data = req.body || {};
    const username = req.user?.username || null;
    
    // Validate required fields
    if (!data.saccoId || !data.licenseId || !data.saccoName) {
      return respond(res, 400, "Missing required fields: saccoId, licenseId, and saccoName are required");
    }
    
    // Validate email format if provided
    if (data.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail)) {
      return respond(res, 400, "Invalid email format");
    }
    
    // Validate phone format if provided (basic validation)
    if (data.contactPhone && !/^[\+]?[0-9\s\-\(\)]{10,}$/.test(data.contactPhone)) {
      return respond(res, 400, "Invalid phone number format");
    }
    
    const payload = {
      saccoId: data.saccoId.trim(),
      licenseId: data.licenseId.trim(),
      saccoName: data.saccoName.trim(),
      address: data.address ? data.address.trim() : null,
      contactPhone: data.contactPhone ? data.contactPhone.trim() : null,
      contactEmail: data.contactEmail ? data.contactEmail.trim().toLowerCase() : null,
      logs: data.logs ? data.logs.trim() : null,
      status: "Active",
      createdOn: new Date(),
      createdBy: username,
    };
    
    const created = await Sacco.create(payload);
    respond(res, 201, "Sacco created successfully", created);
  } catch (err) {
    handleError(res, err, "Failed to create sacco");
  }
});

// Update
router.put("/:id", validateToken, logUpdateOperation("Sacco"), async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body || {};
    const username = req.user?.username || null;
    
    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return respond(res, 400, "Invalid sacco ID");
    }
    
    // Check if sacco exists and is not deleted
    const existingSacco = await Sacco.findOne({ where: { id, isDeleted: 0 } });
    if (!existingSacco) {
      return respond(res, 404, "Sacco not found");
    }
    
    // Validate required fields if provided
    if (data.saccoId !== undefined && !data.saccoId) {
      return respond(res, 400, "saccoId cannot be empty");
    }
    if (data.licenseId !== undefined && !data.licenseId) {
      return respond(res, 400, "licenseId cannot be empty");
    }
    if (data.saccoName !== undefined && !data.saccoName) {
      return respond(res, 400, "saccoName cannot be empty");
    }
    
    // Validate email format if provided
    if (data.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail)) {
      return respond(res, 400, "Invalid email format");
    }
    
    // Validate phone format if provided
    if (data.contactPhone && !/^[\+]?[0-9\s\-\(\)]{10,}$/.test(data.contactPhone)) {
      return respond(res, 400, "Invalid phone number format");
    }
    
    // Validate status if provided
    if (data.status && !['Active', 'Inactive'].includes(data.status)) {
      return respond(res, 400, "Invalid status. Must be 'Active' or 'Inactive'");
    }
    
    const updatePayload = {
      saccoId: data.saccoId ? data.saccoId.trim() : undefined,
      licenseId: data.licenseId ? data.licenseId.trim() : undefined,
      saccoName: data.saccoName ? data.saccoName.trim() : undefined,
      address: data.address !== undefined ? (data.address ? data.address.trim() : null) : undefined,
      contactPhone: data.contactPhone !== undefined ? (data.contactPhone ? data.contactPhone.trim() : null) : undefined,
      contactEmail: data.contactEmail !== undefined ? (data.contactEmail ? data.contactEmail.trim().toLowerCase() : null) : undefined,
      logs: data.logs !== undefined ? (data.logs ? data.logs.trim() : null) : undefined,
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
    
    const [count] = await Sacco.update(updatePayload, { where: { id, isDeleted: 0 } });
    if (!count) {
      return respond(res, 404, "Sacco not found or no changes made");
    }
    
    const updated = await Sacco.findByPk(id);
    respond(res, 200, "Sacco updated successfully", updated);
  } catch (err) {
    handleError(res, err, "Failed to update sacco");
  }
});

// Bulk status update
router.put("/bulk/status", validateToken, logUpdateOperation("Sacco"), async (req, res) => {
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
    
    // Check if all saccos exist and are not deleted
    const existingSaccos = await Sacco.findAll({ 
      where: { 
        id: ids, 
        isDeleted: 0 
      } 
    });
    
    if (existingSaccos.length !== ids.length) {
      return respond(res, 404, "One or more saccos not found or already deleted");
    }
    
    const updatePayload = {
      status,
      verifierRemarks: verifierRemarks ? verifierRemarks.trim() : null,
      modifiedOn: new Date(),
      modifiedBy: username,
    };
    
    const [count] = await Sacco.update(updatePayload, { 
      where: { 
        id: ids, 
        isDeleted: 0 
      } 
    });
    
    respond(res, 200, `${count} sacco(s) status updated successfully`, { updatedCount: count });
  } catch (err) {
    handleError(res, err, "Failed to update sacco statuses");
  }
});

// Soft delete
router.delete("/:id", validateToken, logDeleteOperation("Sacco"), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return respond(res, 400, "Invalid sacco ID");
    }
    
    // Check if sacco exists and is not already deleted
    const existingSacco = await Sacco.findOne({ where: { id, isDeleted: 0 } });
    if (!existingSacco) {
      return respond(res, 404, "Sacco not found or already deleted");
    }
    
    const [count] = await Sacco.update({ isDeleted: 1 }, { where: { id } });
    if (!count) {
      return respond(res, 404, "Sacco not found");
    }
    
    respond(res, 200, "Sacco deleted successfully");
  } catch (err) {
    handleError(res, err, "Failed to delete sacco");
  }
});

module.exports = router;
