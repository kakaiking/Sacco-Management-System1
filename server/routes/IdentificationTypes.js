const express = require('express');
const router = express.Router();
const { IdentificationTypes, Sacco } = require('../models');
const { Op } = require('sequelize');
const { validateToken } = require('../middlewares/AuthMiddleware');
const { logViewOperation, logCreateOperation, logUpdateOperation, logDeleteOperation } = require('../middlewares/LoggingMiddleware');

// Generate Identification Type ID
const generateIdentificationTypeId = () => {
  const randomNum = Math.floor(1000000 + Math.random() * 9000000); // 7 digits
  return `ID-${randomNum}`;
};

// GET /api/identification-types - Get all identification types with pagination and filtering
router.get('/', validateToken, logViewOperation("IdentificationTypes"), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', saccoId } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {
      isDeleted: 0 // Only show non-deleted records
    };
    
    if (search) {
      whereClause[Op.or] = [
        { identificationTypeName: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { identificationTypeId: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (status) {
      whereClause.status = status;
    }
    
    if (saccoId) {
      whereClause.saccoId = saccoId;
    }

    const { count, rows: identificationTypes } = await IdentificationTypes.findAndCountAll({
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
      message: "Identification types retrieved successfully",
      entity: identificationTypes,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching identification types:', error);
    res.status(500).json({
      code: 500,
      message: 'Error fetching identification types',
      entity: null,
      error: error.message
    });
  }
});

// GET /api/identification-types/:id - Get single identification type by ID
router.get('/:id', validateToken, logViewOperation("IdentificationTypes"), async (req, res) => {
  try {
    const { id } = req.params;
    
    const identificationType = await IdentificationTypes.findOne({
      where: { id, isDeleted: 0 },
      include: [
        {
          model: Sacco,
          as: 'sacco',
          attributes: ['saccoId', 'saccoName']
        }
      ]
    });

    if (!identificationType) {
      return res.status(404).json({
        code: 404,
        message: 'Identification type not found',
        entity: null
      });
    }

    res.json({
      code: 200,
      message: "Identification type retrieved successfully",
      entity: identificationType
    });
  } catch (error) {
    console.error('Error fetching identification type:', error);
    res.status(500).json({
      code: 500,
      message: 'Error fetching identification type',
      entity: null,
      error: error.message
    });
  }
});

// POST /api/identification-types - Create new identification type
router.post('/', validateToken, logCreateOperation("IdentificationTypes"), async (req, res) => {
  try {
    const { identificationTypeName, description, saccoId = 'SYSTEM' } = req.body;
    // const userId = req.user.userId;
    const username = req.user?.username || null;

    // Check if identification type name already exists
    const existingIdentificationType = await IdentificationTypes.findOne({
      where: { identificationTypeName, saccoId, isDeleted: 0 }
    });

    if (existingIdentificationType) {
      return res.status(400).json({
        code: 400,
        message: 'Identification type with this name already exists',
        entity: null
      });
    }

    const identificationTypeId = generateIdentificationTypeId();
    
    const identificationType = await IdentificationTypes.create({
      identificationTypeId,
      identificationTypeName,
      description,
      saccoId,
      status: 'Active',
      createdBy: username,
      createdOn: new Date(),
      isDeleted: 0
    });

    // Fetch the created identification type with associations
    const createdIdentificationType = await IdentificationTypes.findByPk(identificationType.id, {
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
      message: 'Identification type created successfully',
      entity: createdIdentificationType
    });
  } catch (error) {
    console.error('Error creating identification type:', error);
    res.status(500).json({
      code: 500,
      message: 'Error creating identification type',
      entity: null,
      error: error.message
    });
  }
});

// PUT /api/identification-types/:id - Update identification type
router.put('/:id', validateToken, logUpdateOperation("IdentificationTypes"), async (req, res) => {
  try {
    const { id } = req.params;
    const { identificationTypeName, description, status } = req.body;
    const userId = req.user.userId;

    const identificationType = await IdentificationTypes.findOne({
      where: { id, isDeleted: 0 }
    });
    
    if (!identificationType) {
      return res.status(404).json({
        code: 404,
        message: 'Identification type not found',
        entity: null
      });
    }

    // Check if identification type name already exists (excluding current record)
    if (identificationTypeName && identificationTypeName !== identificationType.identificationTypeName) {
      const existingIdentificationType = await IdentificationTypes.findOne({
        where: { 
          identificationTypeName, 
          saccoId: identificationType.saccoId,
          id: { [Op.ne]: id },
          isDeleted: 0
        }
      });

      if (existingIdentificationType) {
        return res.status(400).json({
          code: 400,
          message: 'Identification type with this name already exists',
          entity: null
        });
      }
    }

    await identificationType.update({
      identificationTypeName: identificationTypeName || identificationType.identificationTypeName,
      description: description !== undefined ? description : identificationType.description,
      status: status || identificationType.status,
      modifiedBy: userId,
      modifiedOn: new Date()
    });

    // Fetch the updated identification type with associations
    const updatedIdentificationType = await IdentificationTypes.findByPk(id, {
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
      message: 'Identification type updated successfully',
      entity: updatedIdentificationType
    });
  } catch (error) {
    console.error('Error updating identification type:', error);
    res.status(500).json({
      code: 500,
      message: 'Error updating identification type',
      entity: null,
      error: error.message
    });
  }
});

// DELETE /api/identification-types/:id - Soft delete identification type
router.delete('/:id', validateToken, logDeleteOperation("IdentificationTypes"), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const identificationType = await IdentificationTypes.findOne({
      where: { id, isDeleted: 0 }
    });
    
    if (!identificationType) {
      return res.status(404).json({
        code: 404,
        message: 'Identification type not found',
        entity: null
      });
    }

    // Soft delete by setting isDeleted to 1
    await identificationType.update({
      isDeleted: 1,
      modifiedBy: userId,
      modifiedOn: new Date()
    });

    res.json({
      code: 200,
      message: 'Identification type deleted successfully',
      entity: null
    });
  } catch (error) {
    console.error('Error deleting identification type:', error);
    res.status(500).json({
      code: 500,
      message: 'Error deleting identification type',
      entity: null,
      error: error.message
    });
  }
});

// PUT /api/identification-types/:id/status - Update identification type status
router.put('/:id/status', validateToken, logUpdateOperation("IdentificationTypes"), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.userId;

    const identificationType = await IdentificationTypes.findOne({
      where: { id, isDeleted: 0 }
    });
    
    if (!identificationType) {
      return res.status(404).json({
        code: 404,
        message: 'Identification type not found',
        entity: null
      });
    }

    await identificationType.update({
      status,
      modifiedBy: userId,
      modifiedOn: new Date()
    });

    res.json({
      code: 200,
      message: 'Identification type status updated successfully',
      entity: identificationType
    });
  } catch (error) {
    console.error('Error updating identification type status:', error);
    res.status(500).json({
      code: 500,
      message: 'Error updating identification type status',
      entity: null,
      error: error.message
    });
  }
});

module.exports = router;




