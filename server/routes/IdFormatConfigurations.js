const express = require("express");
const router = express.Router();
const { IdFormatConfigurations } = require("../models");
const { validateToken } = require("../middlewares/AuthMiddleware");
const { logViewOperation, logCreateOperation, logUpdateOperation, logDeleteOperation } = require("../middlewares/LoggingMiddleware");

// Helper function to generate example ID based on configuration
const generateExampleId = (config) => {
  const { prefix, suffix, digitCount, characterType, startNumber } = config;
  
  let numberPart;
  if (characterType === 'NUMERIC') {
    numberPart = startNumber.toString().padStart(digitCount, '0');
  } else if (characterType === 'ALPHANUMERIC') {
    // For alphanumeric, use a mix of letters and numbers
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    numberPart = '';
    for (let i = 0; i < digitCount; i++) {
      numberPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } else if (characterType === 'ALPHA') {
    // For alpha only
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    numberPart = '';
    for (let i = 0; i < digitCount; i++) {
      numberPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  
  return `${prefix || ''}${numberPart}${suffix || ''}`;
};

// Helper function to generate next ID based on configuration
const generateNextId = async (modelName, saccoId) => {
  const sequelize = require('sequelize');
  const { Op } = sequelize;
  
  const transaction = await require('../models').sequelize.transaction();
  
  try {
    // Get the configuration for this model
    const config = await IdFormatConfigurations.findOne({
      where: { 
        modelName: modelName,
        saccoId: saccoId,
        isActive: true,
        isDeleted: 0
      },
      lock: true,
      transaction
    });
    
    if (!config) {
      throw new Error(`No active configuration found for model: ${modelName}`);
    }
    
    // Increment current number
    const nextNumber = config.currentNumber + 1;
    
    // Generate the ID based on configuration
    let numberPart;
    if (config.characterType === 'NUMERIC') {
      numberPart = nextNumber.toString().padStart(config.digitCount, '0');
    } else if (config.characterType === 'ALPHANUMERIC') {
      // For alphanumeric, we'll use a combination of letters and numbers
      // This is a simplified approach - you might want to implement a more sophisticated algorithm
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      numberPart = '';
      let tempNumber = nextNumber;
      for (let i = 0; i < config.digitCount; i++) {
        numberPart = chars.charAt(tempNumber % chars.length) + numberPart;
        tempNumber = Math.floor(tempNumber / chars.length);
      }
    } else if (config.characterType === 'ALPHA') {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      numberPart = '';
      let tempNumber = nextNumber;
      for (let i = 0; i < config.digitCount; i++) {
        numberPart = chars.charAt(tempNumber % chars.length) + numberPart;
        tempNumber = Math.floor(tempNumber / chars.length);
      }
    }
    
    const generatedId = `${config.prefix || ''}${numberPart}${config.suffix || ''}`;
    
    // Update the current number
    await config.update({
      currentNumber: nextNumber,
      modifiedOn: new Date(),
      modifiedBy: 'SYSTEM'
    }, { transaction });
    
    await transaction.commit();
    return generatedId;
    
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// Get all ID format configurations
router.get("/", validateToken, logViewOperation("IdFormatConfiguration"), async (req, res) => {
  try {
    const saccoId = req.user?.saccoId || "SYSTEM";
    
    const configurations = await IdFormatConfigurations.findAll({
      where: { 
        saccoId: saccoId,
        isDeleted: 0
      },
      order: [['modelName', 'ASC']]
    });
    
    res.json({
      success: true,
      data: configurations,
      message: "ID format configurations retrieved successfully"
    });
  } catch (err) {
    console.error("Error fetching ID format configurations:", err);
    res.status(500).json({
      success: false,
      message: "Server error: " + err.message,
      data: null
    });
  }
});

// Get single ID format configuration
router.get("/:id", validateToken, logViewOperation("IdFormatConfiguration"), async (req, res) => {
  try {
    const { id } = req.params;
    const saccoId = req.user?.saccoId || "SYSTEM";
    
    const configuration = await IdFormatConfigurations.findOne({
      where: { 
        id: id,
        saccoId: saccoId,
        isDeleted: 0
      }
    });
    
    if (!configuration) {
      return res.status(404).json({
        success: false,
        message: "ID format configuration not found",
        data: null
      });
    }
    
    res.json({
      success: true,
      data: configuration,
      message: "ID format configuration retrieved successfully"
    });
  } catch (err) {
    console.error("Error fetching ID format configuration:", err);
    res.status(500).json({
      success: false,
      message: "Server error: " + err.message,
      data: null
    });
  }
});

// Create new ID format configuration
router.post("/", validateToken, logCreateOperation("IdFormatConfiguration"), async (req, res) => {
  try {
    const data = req.body || {};
    const username = req.user?.username || null;
    const saccoId = req.user?.saccoId || "SYSTEM";
    
    // Check if configuration already exists for this model
    const existingConfig = await IdFormatConfigurations.findOne({
      where: { 
        modelName: data.modelName,
        saccoId: saccoId,
        isDeleted: 0
      }
    });
    
    if (existingConfig) {
      return res.status(409).json({
        success: false,
        message: "Configuration already exists for this model",
        data: null
      });
    }
    
    // Generate example ID
    const example = generateExampleId(data);
    
    const payload = {
      modelName: data.modelName,
      displayName: data.displayName,
      prefix: data.prefix || '',
      suffix: data.suffix || '',
      digitCount: data.digitCount || 7,
      characterType: data.characterType || 'NUMERIC',
      startNumber: data.startNumber || 1,
      currentNumber: data.currentNumber || 0,
      format: data.format || '{prefix}{number}{suffix}',
      example: example,
      isActive: data.isActive !== undefined ? data.isActive : true,
      saccoId: saccoId,
      createdOn: new Date(),
      createdBy: username,
      isDeleted: 0
    };
    
    const created = await IdFormatConfigurations.create(payload);
    
    res.status(201).json({
      success: true,
      data: created,
      message: "ID format configuration created successfully"
    });
  } catch (err) {
    console.error("Error creating ID format configuration:", err);
    res.status(500).json({
      success: false,
      message: "Server error: " + err.message,
      data: null
    });
  }
});

// Update ID format configuration
router.put("/:id", validateToken, logUpdateOperation("IdFormatConfiguration"), async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body || {};
    const username = req.user?.username || null;
    const saccoId = req.user?.saccoId || "SYSTEM";
    
    const configuration = await IdFormatConfigurations.findOne({
      where: { 
        id: id,
        saccoId: saccoId,
        isDeleted: 0
      }
    });
    
    if (!configuration) {
      return res.status(404).json({
        success: false,
        message: "ID format configuration not found",
        data: null
      });
    }
    
    // Generate new example ID
    const updatedData = {
      ...data,
      prefix: data.prefix !== undefined ? data.prefix : configuration.prefix,
      suffix: data.suffix !== undefined ? data.suffix : configuration.suffix,
      digitCount: data.digitCount !== undefined ? data.digitCount : configuration.digitCount,
      characterType: data.characterType !== undefined ? data.characterType : configuration.characterType,
      startNumber: data.startNumber !== undefined ? data.startNumber : configuration.startNumber
    };
    
    const example = generateExampleId(updatedData);
    
    const updatePayload = {
      ...data,
      example: example,
      modifiedOn: new Date(),
      modifiedBy: username
    };
    
    await configuration.update(updatePayload);
    
    res.json({
      success: true,
      data: configuration,
      message: "ID format configuration updated successfully"
    });
  } catch (err) {
    console.error("Error updating ID format configuration:", err);
    res.status(500).json({
      success: false,
      message: "Server error: " + err.message,
      data: null
    });
  }
});

// Delete ID format configuration (soft delete)
router.delete("/:id", validateToken, logDeleteOperation("IdFormatConfiguration"), async (req, res) => {
  try {
    const { id } = req.params;
    const username = req.user?.username || null;
    const saccoId = req.user?.saccoId || "SYSTEM";
    
    const configuration = await IdFormatConfigurations.findOne({
      where: { 
        id: id,
        saccoId: saccoId,
        isDeleted: 0
      }
    });
    
    if (!configuration) {
      return res.status(404).json({
        success: false,
        message: "ID format configuration not found",
        data: null
      });
    }
    
    await configuration.update({
      isDeleted: 1,
      modifiedOn: new Date(),
      modifiedBy: username
    });
    
    res.json({
      success: true,
      message: "ID format configuration deleted successfully",
      data: null
    });
  } catch (err) {
    console.error("Error deleting ID format configuration:", err);
    res.status(500).json({
      success: false,
      message: "Server error: " + err.message,
      data: null
    });
  }
});

// Generate preview ID based on configuration
router.post("/preview", validateToken, async (req, res) => {
  try {
    const data = req.body || {};
    
    const example = generateExampleId(data);
    
    res.json({
      success: true,
      data: { example },
      message: "Preview generated successfully"
    });
  } catch (err) {
    console.error("Error generating preview:", err);
    res.status(500).json({
      success: false,
      message: "Server error: " + err.message,
      data: null
    });
  }
});

// Export the router and helper function for use in other modules
module.exports = router;
module.exports.generateNextId = generateNextId;
