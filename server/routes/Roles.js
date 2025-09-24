const express = require("express");
const router = express.Router();
const { Roles } = require("../models");
const { validateToken } = require("../middlewares/AuthMiddleware");
const { logViewOperation, logCreateOperation, logUpdateOperation, logDeleteOperation } = require("../middlewares/LoggingMiddleware");

// Helper function to generate unique role ID
const generateUniqueRoleId = async () => {
  let counter = 1;
  let newRoleId;
  
  do {
    newRoleId = `ROLE${counter.toString().padStart(3, '0')}`;
    const existingRole = await Roles.findOne({ where: { roleId: newRoleId, isDeleted: 0 } });
    if (!existingRole) {
      return newRoleId;
    }
    counter++;
  } while (counter < 1000); // Prevent infinite loop
  
  throw new Error('Unable to generate unique role ID');
};

const respond = (res, code, message, entity = null) => {
  res.status(code).json({ code, message, entity });
};

const handleError = (res, err, defaultMessage = "An error occurred") => {
  console.error("Roles Route Error:", err);
  
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
router.get("/", validateToken, logViewOperation("Role"), async (req, res) => {
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
        { roleId: { [Op.like]: `%${q}%` } },
        { roleName: { [Op.like]: `%${q}%` } },
        { description: { [Op.like]: `%${q}%` } },
      ];
    }
    
    const roles = await Roles.findAll({ where, order: [["createdOn", "DESC"]] });
    respond(res, 200, "Roles fetched successfully", roles);
  } catch (err) {
    handleError(res, err, "Failed to fetch roles");
  }
});

// Get one
router.get("/:id", validateToken, logViewOperation("Role"), async (req, res) => {
  try {
    const { id } = req.params;
    console.log('GET role request - ID:', id);
    
    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      console.log('Invalid role ID:', id);
      return respond(res, 400, "Invalid role ID");
    }
    
    const role = await Roles.findByPk(id);
    console.log('Found role:', role ? 'Yes' : 'No', role?.isDeleted ? 'Deleted' : 'Active');
    
    if (!role || role.isDeleted) {
      return respond(res, 404, "Role not found");
    }
    
    respond(res, 200, "Role fetched successfully", role);
  } catch (err) {
    console.error('GET role error:', err);
    handleError(res, err, "Failed to fetch role");
  }
});

// Create
router.post("/", validateToken, logCreateOperation("Role"), async (req, res) => {
  try {
    const data = req.body || {};
    const username = req.user?.username || null;
    
    // Validate required fields
    if (!data.roleName) {
      return respond(res, 400, "Missing required field: roleName is required");
    }
    
    // Generate unique role ID
    const roleId = await generateUniqueRoleId();
    console.log('Generated roleId:', roleId);
    
    // Prepare role data
    const roleData = {
      roleId: roleId,
      roleName: data.roleName.trim(),
      description: data.description?.trim() || null,
      status: data.status || "Active",
      permissions: data.permissions || {},
      createdBy: username,
      createdOn: new Date(),
    };
    
    console.log('Role data to create:', roleData);
    const role = await Roles.create(roleData);
    respond(res, 201, "Role created successfully", role);
  } catch (err) {
    handleError(res, err, "Failed to create role");
  }
});

// Update
router.put("/:id", validateToken, logUpdateOperation("Role"), async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body || {};
    const username = req.user?.username || null;
    
    console.log('PUT role request - ID:', id, 'Data:', data);
    
    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      console.log('Invalid role ID for update:', id);
      return respond(res, 400, "Invalid role ID");
    }
    
    // Validate required fields
    if (!data.roleName) {
      console.log('Missing roleName in update request');
      return respond(res, 400, "Missing required field: roleName is required");
    }
    
    const role = await Roles.findByPk(id);
    console.log('Found role for update:', role ? 'Yes' : 'No', role?.isDeleted ? 'Deleted' : 'Active');
    
    if (!role || role.isDeleted) {
      return respond(res, 404, "Role not found");
    }
    
    // Prepare update data (roleId cannot be changed after creation)
    const updateData = {
      roleName: data.roleName.trim(),
      description: data.description?.trim() || null,
      status: data.status || "Active",
      permissions: data.permissions || {},
      modifiedBy: username,
      modifiedOn: new Date(),
    };
    
    await role.update(updateData);
    respond(res, 200, "Role updated successfully", role);
  } catch (err) {
    handleError(res, err, "Failed to update role");
  }
});

// Delete (soft delete)
router.delete("/:id", validateToken, logDeleteOperation("Role"), async (req, res) => {
  try {
    const { id } = req.params;
    const username = req.user?.username || null;
    
    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return respond(res, 400, "Invalid role ID");
    }
    
    const role = await Roles.findByPk(id);
    if (!role || role.isDeleted) {
      return respond(res, 404, "Role not found");
    }
    
    // Check if role is being used by any users
    const { Users } = require("../models");
    const usersWithRole = await Users.count({ 
      where: { role: role.roleId } 
    });
    
    if (usersWithRole > 0) {
      return respond(res, 400, `Cannot delete role. It is currently assigned to ${usersWithRole} user(s)`);
    }
    
    // Soft delete
    await role.update({
      isDeleted: 1,
      modifiedBy: username,
      modifiedOn: new Date(),
    });
    
    respond(res, 200, "Role deleted successfully");
  } catch (err) {
    handleError(res, err, "Failed to delete role");
  }
});

// Batch delete
router.delete("/", validateToken, logDeleteOperation("Role"), async (req, res) => {
  try {
    const { ids } = req.body;
    const username = req.user?.username || null;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return respond(res, 400, "Invalid or empty IDs array");
    }
    
    // Validate all IDs
    const invalidIds = ids.filter(id => !id || isNaN(parseInt(id)));
    if (invalidIds.length > 0) {
      return respond(res, 400, "Invalid role IDs provided");
    }
    
    const roles = await Roles.findAll({ 
      where: { id: ids, isDeleted: 0 } 
    });
    
    if (roles.length === 0) {
      return respond(res, 404, "No valid roles found to delete");
    }
    
    // Check if any roles are being used by users
    const { Users } = require("../models");
    const roleIds = roles.map(role => role.roleId);
    const usersWithRoles = await Users.count({ 
      where: { role: roleIds } 
    });
    
    if (usersWithRoles > 0) {
      return respond(res, 400, `Cannot delete roles. Some roles are currently assigned to users`);
    }
    
    // Soft delete all roles
    await Roles.update({
      isDeleted: 1,
      modifiedBy: username,
      modifiedOn: new Date(),
    }, {
      where: { id: ids }
    });
    
    respond(res, 200, `${roles.length} role(s) deleted successfully`);
  } catch (err) {
    handleError(res, err, "Failed to delete roles");
  }
});

module.exports = router;
