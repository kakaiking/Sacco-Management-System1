const express = require("express");
const router = express.Router();
const { Till, Users, GLAccounts, Sacco } = require("../models");
const { validateToken } = require("../middlewares/AuthMiddleware");
const { logViewOperation, logCreateOperation, logUpdateOperation, logDeleteOperation } = require("../middlewares/LoggingMiddleware");

const respond = (res, code, message, entity) => {
  res.status(code).json({ code, message, entity });
};

// Generate unique sequential till ID
const generateTillId = async (saccoId) => {
  console.log('Generating till ID for saccoId:', saccoId);
  
  try {
    // Find the highest existing till ID for this sacco
    const lastTill = await Till.findOne({
      where: { 
        saccoId: saccoId,
        isDeleted: 0,
        tillId: {
          [require('sequelize').Op.like]: 'T-%'
        }
      },
      order: [['tillId', 'DESC']]
    });
    
    console.log('Last till found:', lastTill);
    
    let nextNumber = 1;
    
    if (lastTill && lastTill.tillId) {
      // Extract the number part from the last till ID
      const lastNumber = parseInt(lastTill.tillId.replace('T-', ''));
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }
    
    // Keep trying until we find a unique number
    let tillId;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 1000;
    
    while (!isUnique && attempts < maxAttempts) {
      tillId = `T-${nextNumber.toString().padStart(4, '0')}`;
      
      // Check if this till ID already exists
      const existingTill = await Till.findOne({
        where: { tillId: tillId, isDeleted: 0 }
      });
      
      if (!existingTill) {
        isUnique = true;
      } else {
        nextNumber++;
      }
      attempts++;
    }
    
    if (!isUnique) {
      throw new Error('Unable to generate unique till ID after multiple attempts');
    }
    
    console.log('Generated till ID:', tillId);
    return tillId;
  } catch (error) {
    console.error('Error in generateTillId:', error);
    throw error;
  }
};

// List with optional status filter and search
router.get("/", validateToken, logViewOperation("Till"), async (req, res) => {
  try {
    const { status, q } = req.query;
    const where = { isDeleted: 0 };
    if (status) where.status = status;
    if (q) {
      const { Op } = require("sequelize");
      where[Op.or] = [
        { tillId: { [Op.like]: `%${q}%` } },
        { tillName: { [Op.like]: `%${q}%` } },
      ];
    }
    
    const tills = await Till.findAll({ 
      where, 
      include: [
        {
          model: Users,
          as: 'cashier',
          attributes: ['id', 'userId', 'username', 'firstName', 'lastName', 'email']
        },
        {
          model: GLAccounts,
          as: 'glAccount',
          attributes: ['id', 'glAccountId', 'accountName']
        },
        {
          model: Sacco,
          as: 'sacco',
          attributes: ['id', 'saccoId', 'saccoName']
        }
      ],
      order: [["createdOn", "DESC"]] 
    });
    
    respond(res, 200, "Tills fetched", tills);
  } catch (err) {
    respond(res, 500, err.message);
  }
});

// Get one
router.get("/:id", validateToken, logViewOperation("Till"), async (req, res) => {
  try {
    const till = await Till.findByPk(req.params.id, {
      include: [
        {
          model: Users,
          as: 'cashier',
          attributes: ['id', 'userId', 'username', 'firstName', 'lastName', 'email']
        },
        {
          model: GLAccounts,
          as: 'glAccount',
          attributes: ['id', 'glAccountId', 'accountName']
        },
        {
          model: Sacco,
          as: 'sacco',
          attributes: ['id', 'saccoId', 'saccoName']
        }
      ]
    });
    
    if (!till || till.isDeleted) return respond(res, 404, "Not found");
    
    respond(res, 200, "Till fetched", till);
  } catch (err) {
    respond(res, 500, err.message);
  }
});

// Create
router.post("/", validateToken, logCreateOperation("Till"), async (req, res) => {
  try {
    const data = req.body || {};
    const username = req.user?.username || null;
    
    // Always auto-generate unique till ID
    const tillId = await generateTillId(data.saccoId);
    
    const payload = {
      tillId: tillId,
      tillName: data.tillName,
      cashierId: data.cashierId || null,
      glAccountId: data.glAccountId || null,
      maximumAmountCapacity: data.maximumAmountCapacity || null,
      minimumAmountCapacity: data.minimumAmountCapacity || null,
      saccoId: data.saccoId,
      status: data.status || "Active",
      remarks: data.remarks || null,
      createdOn: new Date(),
      createdBy: username,
    };
    
    const created = await Till.create(payload);
    
    // Fetch the created till with associations
    const tillWithAssociations = await Till.findByPk(created.id, {
      include: [
        {
          model: Users,
          as: 'cashier',
          attributes: ['id', 'userId', 'username', 'firstName', 'lastName', 'email']
        },
        {
          model: GLAccounts,
          as: 'glAccount',
          attributes: ['id', 'glAccountId', 'accountName']
        },
        {
          model: Sacco,
          as: 'sacco',
          attributes: ['id', 'saccoId', 'saccoName']
        }
      ]
    });
    
    respond(res, 201, "Till created", tillWithAssociations);
  } catch (err) {
    console.error("Error creating till:", err);
    console.error("Error stack:", err.stack);
    console.error("Error details:", JSON.stringify(err, null, 2));
    respond(res, 500, `Server error: ${err.message}`, null);
  }
});

// Update
router.put("/:id", validateToken, logUpdateOperation("Till"), async (req, res) => {
  try {
    const data = req.body || {};
    const username = req.user?.username || null;
    
    const updatePayload = {
      tillName: data.tillName,
      cashierId: data.cashierId || null,
      glAccountId: data.glAccountId || null,
      maximumAmountCapacity: data.maximumAmountCapacity || null,
      minimumAmountCapacity: data.minimumAmountCapacity || null,
      status: data.status || undefined,
      remarks: data.remarks || null,
      modifiedOn: new Date(),
      modifiedBy: username,
    };
    
    const [count] = await Till.update(updatePayload, { where: { id: req.params.id, isDeleted: 0 } });
    if (!count) return respond(res, 404, "Not found");
    
    const updated = await Till.findByPk(req.params.id, {
      include: [
        {
          model: Users,
          as: 'cashier',
          attributes: ['id', 'userId', 'username', 'firstName', 'lastName', 'email']
        },
        {
          model: GLAccounts,
          as: 'glAccount',
          attributes: ['id', 'glAccountId', 'accountName']
        },
        {
          model: Sacco,
          as: 'sacco',
          attributes: ['id', 'saccoId', 'saccoName']
        }
      ]
    });
    
    respond(res, 200, "Till updated", updated);
  } catch (err) {
    respond(res, 500, err.message);
  }
});

// Soft delete
router.delete("/:id", validateToken, logDeleteOperation("Till"), async (req, res) => {
  try {
    const [count] = await Till.update({ isDeleted: 1 }, { where: { id: req.params.id } });
    if (!count) return respond(res, 404, "Not found");
    respond(res, 200, "Till deleted");
  } catch (err) {
    respond(res, 500, err.message);
  }
});

// Get cashiers (users with Cashier role)
router.get("/cashiers/list", validateToken, async (req, res) => {
  try {
    const cashiers = await Users.findAll({
      where: { 
        role: 'Cashier',
        status: 'Active'
      },
      attributes: ['id', 'userId', 'username', 'firstName', 'lastName', 'email'],
      order: [['firstName', 'ASC']]
    });
    
    respond(res, 200, "Cashiers fetched", cashiers);
  } catch (err) {
    respond(res, 500, err.message);
  }
});

// Get till by cashier ID
router.get("/cashier/:cashierId", validateToken, async (req, res) => {
  try {
    const till = await Till.findOne({
      where: { 
        cashierId: req.params.cashierId,
        isDeleted: 0,
        status: 'Active'
      },
      include: [
        {
          model: Users,
          as: 'cashier',
          attributes: ['id', 'userId', 'username', 'firstName', 'lastName', 'email']
        },
        {
          model: GLAccounts,
          as: 'glAccount',
          attributes: ['id', 'glAccountId', 'accountName']
        },
        {
          model: Sacco,
          as: 'sacco',
          attributes: ['id', 'saccoId', 'saccoName']
        }
      ]
    });
    
    if (!till) {
      return respond(res, 404, "No active till found for this cashier", null);
    }
    
    respond(res, 200, "Till fetched", till);
  } catch (err) {
    respond(res, 500, err.message);
  }
});

module.exports = router;
