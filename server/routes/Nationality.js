const express = require('express');
const router = express.Router();
const { Nationality, Sacco } = require('../models');
const { Op } = require('sequelize');
const { validateToken } = require('../middlewares/AuthMiddleware');
const { logViewOperation, logCreateOperation, logUpdateOperation, logDeleteOperation } = require('../middlewares/LoggingMiddleware');

// Generate Nationality ID
const generateNationalityId = () => {
  const randomNum = Math.floor(1000000 + Math.random() * 9000000); // 7 digits
  return `NAT-${randomNum}`;
};

// GET /api/nationality - Get all nationalities with pagination and filtering
router.get('/', validateToken, logViewOperation("Nationality"), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', saccoId } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {
      isDeleted: 0 // Only show non-deleted records
    };
    
    if (search) {
      whereClause[Op.or] = [
        { nationalityName: { [Op.like]: `%${search}%` } },
        { isoCode: { [Op.like]: `%${search}%` } },
        { countryCode: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { nationalityId: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (status) {
      whereClause.status = status;
    }
    
    if (saccoId) {
      whereClause.saccoId = saccoId;
    }

    const { count, rows: nationalities } = await Nationality.findAndCountAll({
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
      message: "Nationalities retrieved successfully",
      entity: nationalities,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching nationalities:', error);
    res.status(500).json({
      code: 500,
      message: 'Error fetching nationalities',
      entity: null,
      error: error.message
    });
  }
});

// GET /api/nationality/:id - Get single nationality by ID
router.get('/:id', validateToken, logViewOperation("Nationality"), async (req, res) => {
  try {
    const { id } = req.params;
    
    const nationality = await Nationality.findOne({
      where: { id, isDeleted: 0 },
      include: [
        {
          model: Sacco,
          as: 'sacco',
          attributes: ['saccoId', 'saccoName']
        }
      ]
    });

    if (!nationality) {
      return res.status(404).json({
        success: false,
        message: 'Nationality not found'
      });
    }

    res.json({
      code: 200,
      message: "Nationality retrieved successfully",
      entity: nationality
    });
  } catch (error) {
    console.error('Error fetching nationality:', error);
    res.status(500).json({
      code: 500,
      message: 'Error fetching nationality',
      entity: null,
      error: error.message
    });
  }
});

// POST /api/nationality - Create new nationality
router.post('/', validateToken, logCreateOperation("Nationality"), async (req, res) => {
  try {
    const { nationalityName, isoCode, countryCode, description, saccoId = 'SYSTEM' } = req.body;
    const username = req.user?.username || null;

    // Check if nationality name already exists
    const existingNationality = await Nationality.findOne({
      where: { nationalityName, saccoId, isDeleted: 0 }
    });

    if (existingNationality) {
      return res.status(400).json({
        code: 400,
        message: 'Nationality with this name already exists',
        entity: null
      });
    }

    // Check if ISO code already exists (if provided)
    if (isoCode) {
      const existingIsoCode = await Nationality.findOne({
        where: { isoCode: isoCode.toUpperCase(), isDeleted: 0 }
      });

      if (existingIsoCode) {
        return res.status(400).json({
          code: 400,
          message: 'ISO code already exists',
          entity: null
        });
      }
    }

    const nationalityId = generateNationalityId();
    
    const nationality = await Nationality.create({
      nationalityId,
      nationalityName,
      isoCode: isoCode ? isoCode.toUpperCase() : null,
      countryCode: countryCode ? countryCode.toUpperCase() : null,
      description,
      saccoId,
      status: 'Active',
      createdBy: username,
      createdOn: new Date(),
      isDeleted: 0
    });

    // Fetch the created nationality with associations
    const createdNationality = await Nationality.findByPk(nationality.id, {
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
      message: 'Nationality created successfully',
      entity: createdNationality
    });
  } catch (error) {
    console.error('Error creating nationality:', error);
    res.status(500).json({
      code: 500,
      message: 'Error creating nationality',
      entity: null,
      error: error.message
    });
  }
});

// PUT /api/nationality/:id - Update nationality
router.put('/:id', validateToken, logUpdateOperation("Nationality"), async (req, res) => {
  try {
    const { id } = req.params;
    const { nationalityName, isoCode, countryCode, description, status } = req.body;
    const userId = req.user.userId;

    const nationality = await Nationality.findOne({
      where: { id, isDeleted: 0 }
    });
    
    if (!nationality) {
      return res.status(404).json({
        success: false,
        message: 'Nationality not found'
      });
    }

    // Check if nationality name already exists (excluding current record)
    if (nationalityName && nationalityName !== nationality.nationalityName) {
      const existingNationality = await Nationality.findOne({
        where: { 
          nationalityName, 
          saccoId: nationality.saccoId,
          id: { [Op.ne]: id },
          isDeleted: 0
        }
      });

      if (existingNationality) {
        return res.status(400).json({
          code: 400,
          message: 'Nationality with this name already exists',
          entity: null
        });
      }
    }

    // Check if ISO code already exists (excluding current record)
    if (isoCode && isoCode.toUpperCase() !== nationality.isoCode) {
      const existingIsoCode = await Nationality.findOne({
        where: { 
          isoCode: isoCode.toUpperCase(),
          id: { [Op.ne]: id },
          isDeleted: 0
        }
      });

      if (existingIsoCode) {
        return res.status(400).json({
          code: 400,
          message: 'ISO code already exists',
          entity: null
        });
      }
    }

    // Update nationality
    await nationality.update({
      nationalityName: nationalityName || nationality.nationalityName,
      isoCode: isoCode ? isoCode.toUpperCase() : nationality.isoCode,
      countryCode: countryCode ? countryCode.toUpperCase() : nationality.countryCode,
      description: description !== undefined ? description : nationality.description,
      status: status || nationality.status,
      modifiedBy: userId,
      modifiedOn: new Date()
    });

    // Fetch the updated nationality with associations
    const updatedNationality = await Nationality.findByPk(id, {
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
      message: 'Nationality updated successfully',
      entity: updatedNationality
    });
  } catch (error) {
    console.error('Error updating nationality:', error);
    res.status(500).json({
      code: 500,
      message: 'Error updating nationality',
      entity: null,
      error: error.message
    });
  }
});

// DELETE /api/nationality/:id - Soft delete nationality
router.delete('/:id', validateToken, logDeleteOperation("Nationality"), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const nationality = await Nationality.findOne({
      where: { id, isDeleted: 0 }
    });
    
    if (!nationality) {
      return res.status(404).json({
        code: 404,
        message: 'Nationality not found',
        entity: null
      });
    }

    // Soft delete by setting isDeleted to 1
    await nationality.update({
      isDeleted: 1,
      modifiedBy: userId,
      modifiedOn: new Date()
    });

    res.json({
      code: 200,
      message: 'Nationality deleted successfully',
      entity: null
    });
  } catch (error) {
    console.error('Error deleting nationality:', error);
    res.status(500).json({
      code: 500,
      message: 'Error deleting nationality',
      entity: null,
      error: error.message
    });
  }
});

// PUT /api/nationality/:id/status - Update nationality status
router.put('/:id/status', validateToken, logUpdateOperation("Nationality"), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.userId;

    const nationality = await Nationality.findOne({
      where: { id, isDeleted: 0 }
    });
    
    if (!nationality) {
      return res.status(404).json({
        code: 404,
        message: 'Nationality not found',
        entity: null
      });
    }

    await nationality.update({
      status,
      modifiedBy: userId,
      modifiedOn: new Date()
    });

    res.json({
      code: 200,
      message: 'Nationality status updated successfully',
      entity: nationality
    });
  } catch (error) {
    console.error('Error updating nationality status:', error);
    res.status(500).json({
      code: 500,
      message: 'Error updating nationality status',
      entity: null,
      error: error.message
    });
  }
});

module.exports = router;
