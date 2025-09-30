const express = require("express");
const router = express.Router();
const { AccountOfficers, Users, Branch, Sacco } = require("../models");
const { validateToken } = require("../middlewares/AuthMiddleware");
const { logViewOperation, logCreateOperation, logUpdateOperation, logDeleteOperation } = require("../middlewares/LoggingMiddleware");
const { Op } = require("sequelize");

// Generate Account Officer ID
const generateAccountOfficerId = () => {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `AO-${randomNum}`;
};

// GET all account officers with pagination and search
router.get("/", validateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", status = "", branchId = "" } = req.query;
    const offset = (page - 1) * limit;

    console.log("🔍 Account officers request - params:", { page, limit, search, status, branchId });
    console.log("🔍 User making request:", req.user);

    // Build where clause
    const whereClause = {};
    
    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { employeeId: { [Op.like]: `%${search}%` } },
        { accountOfficerId: { [Op.like]: `%${search}%` } }
      ];
    }

    if (status) {
      whereClause.status = status;
    }

    if (branchId) {
      whereClause.branchId = branchId;
    }

    console.log("🔍 Where clause:", JSON.stringify(whereClause, null, 2));

    const { count, rows } = await AccountOfficers.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Users,
          as: 'user',
          attributes: ['userId', 'username', 'firstName', 'lastName', 'email', 'phoneNumber', 'role', 'status']
        },
        {
          model: Branch,
          as: 'branch',
          attributes: ['branchId', 'branchName', 'branchLocation']
        },
        {
          model: Sacco,
          as: 'sacco',
          attributes: ['saccoId', 'saccoName']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdOn', 'DESC']]
    });

    console.log("✅ Found account officers:", count);
    console.log("✅ Account officers data:", rows.map(row => ({
      accountOfficerId: row.accountOfficerId,
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email
    })));

    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      entity: rows,
      totalCount: count,
      totalPages: totalPages,
      currentPage: parseInt(page),
      hasNextPage: hasNextPage,
      hasPrevPage: hasPrevPage
    });
  } catch (error) {
    console.error("❌ Error fetching account officers:", error);
    console.error("❌ Error stack:", error.stack);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET account officer by ID
router.get("/:id", validateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const accountOfficer = await AccountOfficers.findOne({
      where: { accountOfficerId: id },
      include: [
        {
          model: Users,
          as: 'user',
          attributes: ['userId', 'username', 'firstName', 'lastName', 'email', 'phoneNumber', 'role', 'status']
        },
        {
          model: Branch,
          as: 'branch',
          attributes: ['branchId', 'branchName', 'branchLocation']
        },
        {
          model: Sacco,
          as: 'sacco',
          attributes: ['saccoId', 'saccoName']
        }
      ]
    });

    if (!accountOfficer) {
      return res.status(404).json({ error: "Account officer not found" });
    }

    logViewOperation(req.user.userId, 'AccountOfficers', 'View', `Viewed account officer: ${accountOfficer.accountOfficerId}`);

    res.json({ entity: accountOfficer });
  } catch (error) {
    console.error("Error fetching account officer:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST create new account officer
router.post("/", validateToken, async (req, res) => {
  try {
    const {
      userId,
      employeeId,
      firstName,
      lastName,
      email,
      phoneNumber,
      branchId,
      department,
      position,
      effectiveDate,
      expiryDate,
      isDefault,
      maxClients,
      remarks
    } = req.body;

    // Validate required fields
    if (!userId || !firstName || !lastName || !email) {
      return res.status(400).json({ error: "Required fields missing" });
    }

    // Check if user exists
    console.log("🔍 Looking for user with userId:", userId);
    console.log("🔍 Users model:", Users);
    console.log("🔍 Database connection:", Users.sequelize.connectionManager.pool);
    
    try {
      const user = await Users.findOne({
        where: { userId: userId }
      });
      console.log("🔍 User found:", user ? "Yes" : "No");
      if (user) {
        console.log("🔍 User details:", {
          id: user.id,
          userId: user.userId,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName
        });
      } else {
        // Let's also try to find all users to see what's in the database
        const allUsers = await Users.findAll({
          attributes: ['id', 'userId', 'username', 'firstName', 'lastName']
        });
        console.log("🔍 All users in database:", allUsers.map(u => ({
          id: u.id,
          userId: u.userId,
          username: u.username,
          firstName: u.firstName,
          lastName: u.lastName
        })));
      }
      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }
    } catch (error) {
      console.error("🔍 Error finding user:", error);
      return res.status(500).json({ error: "Database error: " + error.message });
    }

    // Check if user is already an account officer
    const existingAccountOfficer = await AccountOfficers.findOne({
      where: { userId: userId }
    });

    if (existingAccountOfficer) {
      return res.status(400).json({ error: "User is already an account officer" });
    }

    // Generate account officer ID
    const accountOfficerId = generateAccountOfficerId();

    // Create account officer
    const accountOfficer = await AccountOfficers.create({
      accountOfficerId,
      userId,
      employeeId,
      firstName,
      lastName,
      email,
      phoneNumber,
      branchId,
      department,
      position,
      effectiveDate: effectiveDate || new Date(),
      expiryDate,
      isDefault: isDefault || false,
      maxClients,
      currentClients: 0,
      status: "Active",
      saccoId: req.user.saccoId || "SYSTEM",
      createdBy: req.user.userId,
      createdOn: new Date(),
      remarks
    });

    logCreateOperation(req.user.userId, 'AccountOfficers', accountOfficerId, 'Created new account officer');

    res.status(201).json({ 
      entity: accountOfficer,
      message: "Account officer created successfully" 
    });
  } catch (error) {
    console.error("Error creating account officer:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT update account officer
router.put("/:id", validateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const accountOfficer = await AccountOfficers.findOne({
      where: { accountOfficerId: id }
    });
    if (!accountOfficer) {
      return res.status(404).json({ error: "Account officer not found" });
    }

    // Remove fields that shouldn't be updated directly
    delete updateData.accountOfficerId;
    delete updateData.createdBy;
    delete updateData.createdOn;
    delete updateData.currentClients;

    // Add modification tracking
    updateData.modifiedBy = req.user.userId;
    updateData.modifiedOn = new Date();

    await accountOfficer.update(updateData);

    logUpdateOperation(req.user.userId, 'AccountOfficers', id, 'Updated account officer details');

    res.json({ 
      entity: accountOfficer,
      message: "Account officer updated successfully" 
    });
  } catch (error) {
    console.error("Error updating account officer:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE account officer
router.delete("/:id", validateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const accountOfficer = await AccountOfficers.findOne({
      where: { accountOfficerId: id }
    });
    if (!accountOfficer) {
      return res.status(404).json({ error: "Account officer not found" });
    }

    // Check if account officer has active clients
    if (accountOfficer.currentClients > 0) {
      return res.status(400).json({ 
        error: "Cannot delete account officer with active clients. Please reassign clients first." 
      });
    }

    await accountOfficer.destroy();

    logDeleteOperation(req.user.userId, 'AccountOfficers', id, 'Deleted account officer');

    res.json({ message: "Account officer deleted successfully" });
  } catch (error) {
    console.error("Error deleting account officer:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH update account officer status
router.patch("/:id/status", validateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    const validStatuses = ["Active", "Inactive", "Suspended", "Terminated"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const accountOfficer = await AccountOfficers.findOne({
      where: { accountOfficerId: id }
    });
    if (!accountOfficer) {
      return res.status(404).json({ error: "Account officer not found" });
    }

    await accountOfficer.update({
      status,
      remarks: remarks || accountOfficer.remarks,
      modifiedBy: req.user.userId,
      modifiedOn: new Date()
    });

    logUpdateOperation(req.user.userId, 'AccountOfficers', id, `Status changed to ${status}`);

    res.json({ 
      entity: accountOfficer,
      message: "Account officer status updated successfully" 
    });
  } catch (error) {
    console.error("Error updating account officer status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET all users for account officer assignment
router.get("/available-users", validateToken, async (req, res) => {
  try {
    console.log("🔍 Available users request started");
    console.log("🔍 User making request:", req.user);
    
    // Return mock data for now to test if the endpoint works
    const mockUsers = [
      {
        userId: "USR-3546",
        username: "Angie",
        firstName: "Angie",
        lastName: "User",
        email: "angie@example.com",
        phoneNumber: "+254700000000",
        role: "Super User",
        status: "Active"
      },
      {
        userId: "U-001",
        username: "john.doe",
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@dreamnest.co.ke",
        phoneNumber: "0712345678",
        role: "Account Officer",
        status: "Active"
      },
      {
        userId: "U-002",
        username: "jane.smith",
        firstName: "Jane",
        lastName: "Smith",
        email: "jane.smith@dreamnest.co.ke",
        phoneNumber: "0712345679",
        role: "Account Officer",
        status: "Active"
      }
    ];
    
    console.log("✅ Returning mock users data");
    res.json({ entity: mockUsers });
    
  } catch (error) {
    console.error("❌ Error fetching available users:", error);
    console.error("❌ Error stack:", error.stack);
    console.error("❌ Error name:", error.name);
    console.error("❌ Error message:", error.message);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
});

// Simple test endpoint (unprotected)
router.get("/test", (req, res) => {
  res.json({ message: "Account Officers API is working", timestamp: new Date() });
});

// Simple test endpoint with auth
router.get("/test-auth", validateToken, (req, res) => {
  res.json({ message: "Account Officers API with auth is working", user: req.user, timestamp: new Date() });
});

module.exports = router;
