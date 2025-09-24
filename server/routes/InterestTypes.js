const express = require('express');
const router = express.Router();
const { InterestTypes, Sacco } = require('../models');
const { Op } = require('sequelize');
const { validateToken } = require('../middlewares/AuthMiddleware');
const { logViewOperation, logCreateOperation, logUpdateOperation, logDeleteOperation } = require('../middlewares/LoggingMiddleware');

// Generate Interest Type ID
const generateInterestTypeId = () => {
  const randomNum = Math.floor(1000000 + Math.random() * 9000000); // 7 digits
  return `IT-${randomNum}`;
};

// GET /api/interest-types - Get all interest types with pagination and filtering
router.get('/', validateToken, logViewOperation("InterestTypes"), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', saccoId } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {
      isDeleted: 0 // Only show non-deleted records
    };
    
    if (search) {
      whereClause[Op.or] = [
        { interestTypeName: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { interestTypeId: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (status) {
      whereClause.status = status;
    }
    
    if (saccoId) {
      whereClause.saccoId = saccoId;
    }

    const { count, rows: interestTypes } = await InterestTypes.findAndCountAll({
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
      message: "Interest types retrieved successfully",
      entity: interestTypes,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching interest types:', error);
    res.status(500).json({
      code: 500,
      message: 'Error fetching interest types',
      entity: null,
      error: error.message
    });
  }
});

// GET /api/interest-types/:id - Get single interest type by ID
router.get('/:id', validateToken, logViewOperation("InterestTypes"), async (req, res) => {
  try {
    const { id } = req.params;
    
    const interestType = await InterestTypes.findOne({
      where: { id, isDeleted: 0 },
      include: [
        {
          model: Sacco,
          as: 'sacco',
          attributes: ['saccoId', 'saccoName']
        }
      ]
    });

    if (!interestType) {
      return res.status(404).json({
        code: 404,
        message: 'Interest type not found',
        entity: null
      });
    }

    res.json({
      code: 200,
      message: "Interest type retrieved successfully",
      entity: interestType
    });
  } catch (error) {
    console.error('Error fetching interest type:', error);
    res.status(500).json({
      code: 500,
      message: 'Error fetching interest type',
      entity: null,
      error: error.message
    });
  }
});

// POST /api/interest-types - Create new interest type
router.post('/', validateToken, logCreateOperation("InterestTypes"), async (req, res) => {
  try {
    const { interestTypeName, description, saccoId = 'SYSTEM' } = req.body;
    const username = req.user?.username || null;

    // Check if interest type name already exists
    const existingInterestType = await InterestTypes.findOne({
      where: { interestTypeName, saccoId, isDeleted: 0 }
    });

    if (existingInterestType) {
      return res.status(400).json({
        code: 400,
        message: 'Interest type with this name already exists',
        entity: null
      });
    }

    const interestTypeId = generateInterestTypeId();
    
    const interestType = await InterestTypes.create({
      interestTypeId,
      interestTypeName,
      description,
      saccoId,
      status: 'Active',
      createdBy: username,
      createdOn: new Date(),
      isDeleted: 0
    });

    // Fetch the created interest type with associations
    const createdInterestType = await InterestTypes.findByPk(interestType.id, {
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
      message: 'Interest type created successfully',
      entity: createdInterestType
    });
  } catch (error) {
    console.error('Error creating interest type:', error);
    res.status(500).json({
      code: 500,
      message: 'Error creating interest type',
      entity: null,
      error: error.message
    });
  }
});

// PUT /api/interest-types/:id - Update interest type
router.put('/:id', validateToken, logUpdateOperation("InterestTypes"), async (req, res) => {
  try {
    const { id } = req.params;
    const { interestTypeName, description, status } = req.body;
    const userId = req.user.userId;

    const interestType = await InterestTypes.findOne({
      where: { id, isDeleted: 0 }
    });
    
    if (!interestType) {
      return res.status(404).json({
        code: 404,
        message: 'Interest type not found',
        entity: null
      });
    }

    // Check if interest type name already exists (excluding current record)
    if (interestTypeName && interestTypeName !== interestType.interestTypeName) {
      const existingInterestType = await InterestTypes.findOne({
        where: { 
          interestTypeName, 
          saccoId: interestType.saccoId,
          id: { [Op.ne]: id },
          isDeleted: 0
        }
      });

      if (existingInterestType) {
        return res.status(400).json({
          code: 400,
          message: 'Interest type with this name already exists',
          entity: null
        });
      }
    }

    await interestType.update({
      interestTypeName: interestTypeName || interestType.interestTypeName,
      description: description !== undefined ? description : interestType.description,
      status: status || interestType.status,
      modifiedBy: userId,
      modifiedOn: new Date()
    });

    // Fetch the updated interest type with associations
    const updatedInterestType = await InterestTypes.findByPk(id, {
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
      message: 'Interest type updated successfully',
      entity: updatedInterestType
    });
  } catch (error) {
    console.error('Error updating interest type:', error);
    res.status(500).json({
      code: 500,
      message: 'Error updating interest type',
      entity: null,
      error: error.message
    });
  }
});

// DELETE /api/interest-types/:id - Soft delete interest type
router.delete('/:id', validateToken, logDeleteOperation("InterestTypes"), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const interestType = await InterestTypes.findOne({
      where: { id, isDeleted: 0 }
    });
    
    if (!interestType) {
      return res.status(404).json({
        code: 404,
        message: 'Interest type not found',
        entity: null
      });
    }

    await interestType.update({
      isDeleted: 1,
      modifiedBy: userId,
      modifiedOn: new Date()
    });

    res.json({
      code: 200,
      message: 'Interest type deleted successfully',
      entity: null
    });
  } catch (error) {
    console.error('Error deleting interest type:', error);
    res.status(500).json({
      code: 500,
      message: 'Error deleting interest type',
      entity: null,
      error: error.message
    });
  }
});

// PUT /api/interest-types/:id/status - Update interest type status
router.put('/:id/status', validateToken, logUpdateOperation("InterestTypes"), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, verifierRemarks } = req.body;
    const userId = req.user.userId;

    const interestType = await InterestTypes.findOne({
      where: { id, isDeleted: 0 }
    });
    
    if (!interestType) {
      return res.status(404).json({
        code: 404,
        message: 'Interest type not found',
        entity: null
      });
    }

    const updateData = {
      status,
      modifiedBy: userId,
      modifiedOn: new Date()
    };

    if (status === 'Active' || status === 'Inactive') {
      updateData.approvedBy = userId;
      updateData.approvedOn = new Date();
    }

    await interestType.update(updateData);

    // Fetch the updated interest type with associations
    const updatedInterestType = await InterestTypes.findByPk(id, {
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
      message: `Interest type ${status.toLowerCase()} successfully`,
      entity: updatedInterestType
    });
  } catch (error) {
    console.error('Error updating interest type status:', error);
    res.status(500).json({
      code: 500,
      message: 'Error updating interest type status',
      entity: null,
      error: error.message
    });
  }
});

module.exports = router;

