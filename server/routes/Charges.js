const express = require("express");
const router = express.Router();
const { Charges } = require("../models");
const { validateToken } = require("../middlewares/AuthMiddleware");
const { logViewOperation, logCreateOperation, logUpdateOperation, logDeleteOperation } = require("../middlewares/LoggingMiddleware");

// Get all charges
router.get("/", validateToken, logViewOperation("Charge"), async (req, res) => {
  try {
    const charges = await Charges.findAll({
      where: { isDeleted: 0 },
      order: [['createdOn', 'DESC']]
    });
    res.json(charges);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get charge by ID
router.get("/:id", validateToken, logViewOperation("Charge"), async (req, res) => {
  try {
    const charge = await Charges.findOne({
      where: { 
        chargeId: req.params.id,
        isDeleted: 0 
      }
    });
    
    if (!charge) {
      return res.status(404).json({ error: "Charge not found" });
    }
    
    res.json(charge);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new charge
router.post("/", validateToken, logCreateOperation("Charge"), async (req, res) => {
  try {
    const data = req.body || {};
    
    // Generate charge ID
    const generateChargeId = () => {
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `CHG-${timestamp}${random}`;
    };
    
    const payload = {
      chargeId: generateChargeId(),
      saccoId: data.saccoId || 'SACCO-001',
      name: data.name,
      currency: data.currency,
      amount: data.amount,
      status: data.status || 'Active',
      createdBy: req.user.username,
      createdOn: new Date()
    };
    
    const created = await Charges.create(payload);
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update charge
router.put("/:id", validateToken, logUpdateOperation("Charge"), async (req, res) => {
  try {
    const data = req.body || {};
    
    const updateData = {
      name: data.name,
      currency: data.currency,
      amount: data.amount,
      status: data.status,
      modifiedBy: req.user.username,
      modifiedOn: new Date()
    };
    
    const [updatedRowsCount] = await Charges.update(updateData, {
      where: { 
        chargeId: req.params.id,
        isDeleted: 0 
      }
    });
    
    if (updatedRowsCount === 0) {
      return res.status(404).json({ error: "Charge not found" });
    }
    
    const updatedCharge = await Charges.findOne({
      where: { chargeId: req.params.id }
    });
    
    res.json(updatedCharge);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete charge (soft delete)
router.delete("/:id", validateToken, logDeleteOperation("Charge"), async (req, res) => {
  try {
    const [updatedRowsCount] = await Charges.update(
      { 
        isDeleted: 1,
        modifiedBy: req.user.username,
        modifiedOn: new Date()
      },
      {
        where: { 
          chargeId: req.params.id,
          isDeleted: 0 
        }
      }
    );
    
    if (updatedRowsCount === 0) {
      return res.status(404).json({ error: "Charge not found" });
    }
    
    res.json({ message: "Charge deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update charge status
router.patch("/:id/status", validateToken, async (req, res) => {
  try {
    const { status, verifierRemarks } = req.body;
    
    const updateData = {
      status: status,
      modifiedBy: req.user.username,
      modifiedOn: new Date()
    };
    
    if (status === 'Approved' || status === 'Rejected') {
      updateData.approvedBy = req.user.username;
      updateData.approvedOn = new Date();
      if (verifierRemarks) {
        updateData.verifierRemarks = verifierRemarks;
      }
    }
    
    const [updatedRowsCount] = await Charges.update(updateData, {
      where: { 
        chargeId: req.params.id,
        isDeleted: 0 
      }
    });
    
    if (updatedRowsCount === 0) {
      return res.status(404).json({ error: "Charge not found" });
    }
    
    const updatedCharge = await Charges.findOne({
      where: { chargeId: req.params.id }
    });
    
    res.json(updatedCharge);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
