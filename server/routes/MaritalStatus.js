const express = require('express');
const router = express.Router();
const { MaritalStatus, Sacco } = require('../models');
const { validateToken } = require('../middlewares/AuthMiddleware');
const { logViewOperation, logCreateOperation, logUpdateOperation, logDeleteOperation } = require('../middlewares/LoggingMiddleware');
const { Op } = require('sequelize');

// Generate marital status ID
const generateMaritalStatusId = () => {
  const randomNum = Math.floor(100000 + Math.random() * 900000); // 6 digits
  return `MS-${randomNum}`;
};

// GET /api/marital-status - Get all marital statuses with pagination and filtering
router.get('/', validateToken, logViewOperation("MaritalStatus"), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', saccoId } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {
      isDeleted: 0 // Only show non-deleted records
    };
    
    if (search) {
      whereClause[Op.or] = [
        { maritalStatusName: { [Op.like]: `%${search}%` } },
        { maritalStatusCode: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { maritalStatusId: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (status) {
      whereClause.status = status;
    }
    
    if (saccoId) {
      whereClause.saccoId = saccoId;
    }

    const { count, rows: maritalStatuses } = await MaritalStatus.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Sacco,
          as: 'sacco',
          attributes: ['saccoId', 'saccoName']
        }
      ],
      order: [['createdOn', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      code: 200,
      message: "Marital statuses retrieved successfully",
      entity: maritalStatuses,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching marital statuses:', error);
    res.status(500).json({
      code: 500,
      message: 'Error fetching marital statuses',
      entity: null,
      error: error.message
    });
  }
});

// GET /api/marital-status/:id - Get single marital status by ID
router.get('/:id', validateToken, logViewOperation("MaritalStatus"), async (req, res) => {
  try {
    const { id } = req.params;
    
    const maritalStatus = await MaritalStatus.findOne({
      where: { id, isDeleted: 0 },
      include: [
        {
          model: Sacco,
          as: 'sacco',
          attributes: ['saccoId', 'saccoName']
        }
      ]
    });

    if (!maritalStatus) {
      return res.status(404).json({
        code: 404,
        message: 'Marital status not found',
        entity: null
      });
    }

    res.json({
      code: 200,
      message: 'Marital status retrieved successfully',
      entity: maritalStatus
    });
  } catch (error) {
    console.error('Error fetching marital status:', error);
    res.status(500).json({
      code: 500,
      message: 'Error fetching marital status',
      entity: null,
      error: error.message
    });
  }
});

// POST /api/marital-status - Create new marital status
router.post('/', validateToken, logCreateOperation("MaritalStatus"), async (req, res) => {
  try {
    const { maritalStatusName, maritalStatusCode, description, saccoId = 'SYSTEM' } = req.body;
    const username = req.user?.username || null;

    // Check if marital status name already exists
    const existingMaritalStatus = await MaritalStatus.findOne({
      where: { maritalStatusName, saccoId, isDeleted: 0 }
    });

    if (existingMaritalStatus) {
      return res.status(400).json({
        code: 400,
        message: 'Marital status with this name already exists',
        entity: null
      });
    }

    // Check if marital status code already exists (if provided)
    if (maritalStatusCode) {
      const existingCode = await MaritalStatus.findOne({
        where: { maritalStatusCode: maritalStatusCode.toUpperCase(), isDeleted: 0 }
      });

      if (existingCode) {
        return res.status(400).json({
          code: 400,
          message: 'Marital status code already exists',
          entity: null
        });
      }
    }

    const maritalStatusId = generateMaritalStatusId();
    
    const maritalStatus = await MaritalStatus.create({
      maritalStatusId,
      maritalStatusName,
      maritalStatusCode: maritalStatusCode ? maritalStatusCode.toUpperCase() : null,
      description,
      saccoId,
      status: 'Active',
      createdBy: username,
      createdOn: new Date(),
      isDeleted: 0
    });

    // Fetch the created marital status with associations
    const createdMaritalStatus = await MaritalStatus.findByPk(maritalStatus.id, {
      include: [
        {
          model: Sacco,
          as: 'sacco',
          attributes: ['saccoId', 'saccoName']
        }
      ]
    });

    res.status(201).json({
      code: 201,
      message: 'Marital status created successfully',
      entity: createdMaritalStatus
    });
  } catch (error) {
    console.error('Error creating marital status:', error);
    res.status(500).json({
      code: 500,
      message: 'Error creating marital status',
      entity: null,
      error: error.message
    });
  }
});

// PUT /api/marital-status/:id - Update marital status
router.put('/:id', validateToken, logUpdateOperation("MaritalStatus"), async (req, res) => {
  try {
    const { id } = req.params;
    const { maritalStatusName, maritalStatusCode, description, status } = req.body;
    const userId = req.user.userId;

    const maritalStatus = await MaritalStatus.findOne({
      where: { id, isDeleted: 0 }
    });
    
    if (!maritalStatus) {
      return res.status(404).json({
        success: false,
        message: 'Marital status not found'
      });
    }

    // Check if marital status name already exists (excluding current record)
    if (maritalStatusName && maritalStatusName !== maritalStatus.maritalStatusName) {
      const existingMaritalStatus = await MaritalStatus.findOne({
        where: { 
          maritalStatusName, 
          saccoId: maritalStatus.saccoId,
          id: { [Op.ne]: id },
          isDeleted: 0
        }
      });

      if (existingMaritalStatus) {
        return res.status(400).json({
          code: 400,
          message: 'Marital status with this name already exists',
          entity: null
        });
      }
    }

    // Check if marital status code already exists (excluding current record)
    if (maritalStatusCode && maritalStatusCode.toUpperCase() !== maritalStatus.maritalStatusCode) {
      const existingCode = await MaritalStatus.findOne({
        where: { 
          maritalStatusCode: maritalStatusCode.toUpperCase(),
          id: { [Op.ne]: id },
          isDeleted: 0
        }
      });

      if (existingCode) {
        return res.status(400).json({
          code: 400,
          message: 'Marital status code already exists',
          entity: null
        });
      }
    }

    // Update marital status
    await maritalStatus.update({
      maritalStatusName: maritalStatusName || maritalStatus.maritalStatusName,
      maritalStatusCode: maritalStatusCode ? maritalStatusCode.toUpperCase() : maritalStatus.maritalStatusCode,
      description: description !== undefined ? description : maritalStatus.description,
      status: status || maritalStatus.status,
      modifiedBy: userId,
      modifiedOn: new Date()
    });

    // Fetch the updated marital status with associations
    const updatedMaritalStatus = await MaritalStatus.findByPk(id, {
      include: [
        {
          model: Sacco,
          as: 'sacco',
          attributes: ['saccoId', 'saccoName']
        }
      ]
    });

    res.json({
      code: 200,
      message: 'Marital status updated successfully',
      entity: updatedMaritalStatus
    });
  } catch (error) {
    console.error('Error updating marital status:', error);
    res.status(500).json({
      code: 500,
      message: 'Error updating marital status',
      entity: null,
      error: error.message
    });
  }
});

// DELETE /api/marital-status/:id - Soft delete marital status
router.delete('/:id', validateToken, logDeleteOperation("MaritalStatus"), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const maritalStatus = await MaritalStatus.findOne({
      where: { id, isDeleted: 0 }
    });

    if (!maritalStatus) {
      return res.status(404).json({
        code: 404,
        message: 'Marital status not found',
        entity: null
      });
    }

    // Soft delete
    await maritalStatus.update({
      isDeleted: 1,
      modifiedBy: userId,
      modifiedOn: new Date()
    });

    res.json({
      code: 200,
      message: 'Marital status deleted successfully',
      entity: null
    });
  } catch (error) {
    console.error('Error deleting marital status:', error);
    res.status(500).json({
      code: 500,
      message: 'Error deleting marital status',
      entity: null,
      error: error.message
    });
  }
});

module.exports = router;
