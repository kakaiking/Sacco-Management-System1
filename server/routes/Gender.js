const express = require('express');
const router = express.Router();
const { Gender, Sacco } = require('../models');
const { Op } = require('sequelize');
const { validateToken } = require('../middlewares/AuthMiddleware');
const { logViewOperation, logCreateOperation, logUpdateOperation, logDeleteOperation } = require('../middlewares/LoggingMiddleware');

// Generate Gender ID
const generateGenderId = () => {
  const randomNum = Math.floor(1000000 + Math.random() * 9000000); // 7 digits
  return `G-${randomNum}`;
};

// GET /api/gender - Get all genders with pagination and filtering
router.get('/', validateToken, logViewOperation("Gender"), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', saccoId } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {
      isDeleted: 0 // Only show non-deleted records
    };
    
    if (search) {
      whereClause[Op.or] = [
        { genderName: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { genderId: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (status) {
      whereClause.status = status;
    }
    
    if (saccoId) {
      whereClause.saccoId = saccoId;
    }

    const { count, rows: genders } = await Gender.findAndCountAll({
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
      message: "Genders retrieved successfully",
      entity: genders,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching genders:', error);
    res.status(500).json({
      code: 500,
      message: 'Error fetching genders',
      entity: null,
      error: error.message
    });
  }
});

// GET /api/gender/:id - Get single gender by ID
router.get('/:id', validateToken, logViewOperation("Gender"), async (req, res) => {
  try {
    const { id } = req.params;
    
    const gender = await Gender.findOne({
      where: { id, isDeleted: 0 },
      include: [
        {
          model: Sacco,
          as: 'sacco',
          attributes: ['saccoId', 'saccoName']
        }
      ]
    });

    if (!gender) {
      return res.status(404).json({
        success: false,
        message: 'Gender not found'
      });
    }

    res.json({
      code: 200,
      message: "Gender retrieved successfully",
      entity: gender
    });
  } catch (error) {
    console.error('Error fetching gender:', error);
    res.status(500).json({
      code: 500,
      message: 'Error fetching gender',
      entity: null,
      error: error.message
    });
  }
});

// POST /api/gender - Create new gender
router.post('/', validateToken, logCreateOperation("Gender"), async (req, res) => {
  try {
    const { genderName, description, saccoId = 'SYSTEM' } = req.body;
    // const userId = req.user.userId;
    const username = req.user?.username || null;


    // Check if gender name already exists
    const existingGender = await Gender.findOne({
      where: { genderName, saccoId, isDeleted: 0 }
    });

    if (existingGender) {
      return res.status(400).json({
        code: 400,
        message: 'Gender with this name already exists',
        entity: null
      });
    }

    const genderId = generateGenderId();
    
    const gender = await Gender.create({
      genderId,
      genderName,
      description,
      saccoId,
      status: 'Active',
      createdBy: username,
      createdOn: new Date(),
      isDeleted: 0
    });

    // Fetch the created gender with associations
    const createdGender = await Gender.findByPk(gender.id, {
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
      message: 'Gender created successfully',
      entity: createdGender
    });
  } catch (error) {
    console.error('Error creating gender:', error);
    res.status(500).json({
      code: 500,
      message: 'Error creating gender',
      entity: null,
      error: error.message
    });
  }
});

// PUT /api/gender/:id - Update gender
router.put('/:id', validateToken, logUpdateOperation("Gender"), async (req, res) => {
  try {
    const { id } = req.params;
    const { genderName, description, status } = req.body;
    const userId = req.user.userId;

    const gender = await Gender.findOne({
      where: { id, isDeleted: 0 }
    });
    
    if (!gender) {
      return res.status(404).json({
        success: false,
        message: 'Gender not found'
      });
    }

    // Check if gender name already exists (excluding current record)
    if (genderName && genderName !== gender.genderName) {
      const existingGender = await Gender.findOne({
        where: { 
          genderName, 
          saccoId: gender.saccoId,
          id: { [Op.ne]: id },
          isDeleted: 0
        }
      });

      if (existingGender) {
        return res.status(400).json({
          code: 400,
          message: 'Gender with this name already exists',
          entity: null
        });
      }
    }

    // Update gender
    await gender.update({
      genderName: genderName || gender.genderName,
      description: description !== undefined ? description : gender.description,
      status: status || gender.status,
      modifiedBy: userId,
      modifiedOn: new Date()
    });

    // Fetch the updated gender with associations
    const updatedGender = await Gender.findByPk(id, {
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
      message: 'Gender updated successfully',
      entity: updatedGender
    });
  } catch (error) {
    console.error('Error updating gender:', error);
    res.status(500).json({
      code: 500,
      message: 'Error updating gender',
      entity: null,
      error: error.message
    });
  }
});

// DELETE /api/gender/:id - Soft delete gender
router.delete('/:id', validateToken, logDeleteOperation("Gender"), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const gender = await Gender.findOne({
      where: { id, isDeleted: 0 }
    });
    
    if (!gender) {
      return res.status(404).json({
        code: 404,
        message: 'Gender not found',
        entity: null
      });
    }

    // Soft delete by setting isDeleted to 1
    await gender.update({
      isDeleted: 1,
      modifiedBy: userId,
      modifiedOn: new Date()
    });

    res.json({
      code: 200,
      message: 'Gender deleted successfully',
      entity: null
    });
  } catch (error) {
    console.error('Error deleting gender:', error);
    res.status(500).json({
      code: 500,
      message: 'Error deleting gender',
      entity: null,
      error: error.message
    });
  }
});

// PUT /api/gender/:id/status - Update gender status
router.put('/:id/status', validateToken, logUpdateOperation("Gender"), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.userId;

    const gender = await Gender.findOne({
      where: { id, isDeleted: 0 }
    });
    
    if (!gender) {
      return res.status(404).json({
        code: 404,
        message: 'Gender not found',
        entity: null
      });
    }

    await gender.update({
      status,
      modifiedBy: userId,
      modifiedOn: new Date()
    });

    res.json({
      code: 200,
      message: 'Gender status updated successfully',
      entity: gender
    });
  } catch (error) {
    console.error('Error updating gender status:', error);
    res.status(500).json({
      code: 500,
      message: 'Error updating gender status',
      entity: null,
      error: error.message
    });
  }
});

module.exports = router;
