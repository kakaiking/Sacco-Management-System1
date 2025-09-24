const express = require('express');
const router = express.Router();
const { InterestFrequency, Sacco } = require('../models');
const { Op } = require('sequelize');
const { validateToken } = require('../middlewares/AuthMiddleware');
const { logViewOperation, logCreateOperation, logUpdateOperation, logDeleteOperation } = require('../middlewares/LoggingMiddleware');

// Generate Interest Frequency ID
const generateInterestFrequencyId = () => {
  const randomNum = Math.floor(1000000 + Math.random() * 9000000); // 7 digits
  return `IF-${randomNum}`;
};

// GET /api/interest-frequency - Get all interest frequencies with pagination and filtering
router.get('/', validateToken, logViewOperation("InterestFrequency"), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', saccoId } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {
      isDeleted: 0 // Only show non-deleted records
    };
    
    if (search) {
      whereClause[Op.or] = [
        { interestFrequencyName: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { interestFrequencyId: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (status) {
      whereClause.status = status;
    }
    
    if (saccoId) {
      whereClause.saccoId = saccoId;
    }

    const { count, rows: interestFrequencies } = await InterestFrequency.findAndCountAll({
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
      message: "Interest frequencies retrieved successfully",
      entity: interestFrequencies,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching interest frequencies:', error);
    res.status(500).json({
      code: 500,
      message: 'Error fetching interest frequencies',
      entity: null,
      error: error.message
    });
  }
});

// GET /api/interest-frequency/:id - Get single interest frequency by ID
router.get('/:id', validateToken, logViewOperation("InterestFrequency"), async (req, res) => {
  try {
    const { id } = req.params;
    
    const interestFrequency = await InterestFrequency.findOne({
      where: { id, isDeleted: 0 },
      include: [
        {
          model: Sacco,
          as: 'sacco',
          attributes: ['saccoId', 'saccoName']
        }
      ]
    });

    if (!interestFrequency) {
      return res.status(404).json({
        code: 404,
        message: 'Interest frequency not found',
        entity: null
      });
    }

    res.json({
      code: 200,
      message: "Interest frequency retrieved successfully",
      entity: interestFrequency
    });
  } catch (error) {
    console.error('Error fetching interest frequency:', error);
    res.status(500).json({
      code: 500,
      message: 'Error fetching interest frequency',
      entity: null,
      error: error.message
    });
  }
});

// POST /api/interest-frequency - Create new interest frequency
router.post('/', validateToken, logCreateOperation("InterestFrequency"), async (req, res) => {
  try {
    const { interestFrequencyName, description, saccoId = 'SYSTEM' } = req.body;
    const username = req.user?.username || null;

    // Check if interest frequency name already exists
    const existingInterestFrequency = await InterestFrequency.findOne({
      where: { interestFrequencyName, saccoId, isDeleted: 0 }
    });

    if (existingInterestFrequency) {
      return res.status(400).json({
        code: 400,
        message: 'Interest frequency with this name already exists',
        entity: null
      });
    }

    const interestFrequencyId = generateInterestFrequencyId();
    
    const interestFrequency = await InterestFrequency.create({
      interestFrequencyId,
      interestFrequencyName,
      description,
      saccoId,
      status: 'Active',
      createdBy: username,
      createdOn: new Date(),
      isDeleted: 0
    });

    // Fetch the created interest frequency with associations
    const createdInterestFrequency = await InterestFrequency.findByPk(interestFrequency.id, {
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
      message: 'Interest frequency created successfully',
      entity: createdInterestFrequency
    });
  } catch (error) {
    console.error('Error creating interest frequency:', error);
    res.status(500).json({
      code: 500,
      message: 'Error creating interest frequency',
      entity: null,
      error: error.message
    });
  }
});

// PUT /api/interest-frequency/:id - Update interest frequency
router.put('/:id', validateToken, logUpdateOperation("InterestFrequency"), async (req, res) => {
  try {
    const { id } = req.params;
    const { interestFrequencyName, description, status } = req.body;
    const userId = req.user.userId;

    const interestFrequency = await InterestFrequency.findOne({
      where: { id, isDeleted: 0 }
    });
    
    if (!interestFrequency) {
      return res.status(404).json({
        code: 404,
        message: 'Interest frequency not found',
        entity: null
      });
    }

    // Check if interest frequency name already exists (excluding current record)
    if (interestFrequencyName && interestFrequencyName !== interestFrequency.interestFrequencyName) {
      const existingInterestFrequency = await InterestFrequency.findOne({
        where: { 
          interestFrequencyName, 
          saccoId: interestFrequency.saccoId,
          id: { [Op.ne]: id },
          isDeleted: 0
        }
      });

      if (existingInterestFrequency) {
        return res.status(400).json({
          code: 400,
          message: 'Interest frequency with this name already exists',
          entity: null
        });
      }
    }

    await interestFrequency.update({
      interestFrequencyName: interestFrequencyName || interestFrequency.interestFrequencyName,
      description: description !== undefined ? description : interestFrequency.description,
      status: status || interestFrequency.status,
      modifiedBy: userId,
      modifiedOn: new Date()
    });

    // Fetch the updated interest frequency with associations
    const updatedInterestFrequency = await InterestFrequency.findByPk(id, {
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
      message: 'Interest frequency updated successfully',
      entity: updatedInterestFrequency
    });
  } catch (error) {
    console.error('Error updating interest frequency:', error);
    res.status(500).json({
      code: 500,
      message: 'Error updating interest frequency',
      entity: null,
      error: error.message
    });
  }
});

// DELETE /api/interest-frequency/:id - Soft delete interest frequency
router.delete('/:id', validateToken, logDeleteOperation("InterestFrequency"), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const interestFrequency = await InterestFrequency.findOne({
      where: { id, isDeleted: 0 }
    });
    
    if (!interestFrequency) {
      return res.status(404).json({
        code: 404,
        message: 'Interest frequency not found',
        entity: null
      });
    }

    await interestFrequency.update({
      isDeleted: 1,
      modifiedBy: userId,
      modifiedOn: new Date()
    });

    res.json({
      code: 200,
      message: 'Interest frequency deleted successfully',
      entity: null
    });
  } catch (error) {
    console.error('Error deleting interest frequency:', error);
    res.status(500).json({
      code: 500,
      message: 'Error deleting interest frequency',
      entity: null,
      error: error.message
    });
  }
});

// PUT /api/interest-frequency/:id/status - Update interest frequency status
router.put('/:id/status', validateToken, logUpdateOperation("InterestFrequency"), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, verifierRemarks } = req.body;
    const userId = req.user.userId;

    const interestFrequency = await InterestFrequency.findOne({
      where: { id, isDeleted: 0 }
    });
    
    if (!interestFrequency) {
      return res.status(404).json({
        code: 404,
        message: 'Interest frequency not found',
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

    await interestFrequency.update(updateData);

    // Fetch the updated interest frequency with associations
    const updatedInterestFrequency = await InterestFrequency.findByPk(id, {
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
      message: `Interest frequency ${status.toLowerCase()} successfully`,
      entity: updatedInterestFrequency
    });
  } catch (error) {
    console.error('Error updating interest frequency status:', error);
    res.status(500).json({
      code: 500,
      message: 'Error updating interest frequency status',
      entity: null,
      error: error.message
    });
  }
});

module.exports = router;











