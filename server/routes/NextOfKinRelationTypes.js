const express = require('express');
const router = express.Router();
const { NextOfKinRelationTypes, Sacco } = require('../models');
const { Op } = require('sequelize');
const { validateToken } = require('../middlewares/AuthMiddleware');
const { logViewOperation, logCreateOperation, logUpdateOperation, logDeleteOperation } = require('../middlewares/LoggingMiddleware');

// Generate Next of Kin Relation Type ID
const generateRelationTypeId = () => {
  const randomNum = Math.floor(1000000 + Math.random() * 9000000); // 7 digits
  return `RT-${randomNum}`;
};

// GET /api/next-of-kin-relation-types - Get all next of kin relation types with pagination and filtering
router.get('/', validateToken, logViewOperation("NextOfKinRelationTypes"), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', saccoId } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {
      isDeleted: 0 // Only show non-deleted records
    };
    
    if (search) {
      whereClause[Op.or] = [
        { relationTypeName: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { relationTypeId: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (status) {
      whereClause.status = status;
    }
    
    if (saccoId) {
      whereClause.saccoId = saccoId;
    }

    const { count, rows: nextOfKinRelationTypes } = await NextOfKinRelationTypes.findAndCountAll({
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
      message: "Next of kin relation types retrieved successfully",
      entity: nextOfKinRelationTypes,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching next of kin relation types:', error);
    res.status(500).json({
      code: 500,
      message: 'Error fetching next of kin relation types',
      entity: null,
      error: error.message
    });
  }
});

// GET /api/next-of-kin-relation-types/:id - Get single next of kin relation type by ID
router.get('/:id', validateToken, logViewOperation("NextOfKinRelationTypes"), async (req, res) => {
  try {
    const { id } = req.params;
    
    const nextOfKinRelationType = await NextOfKinRelationTypes.findOne({
      where: { id, isDeleted: 0 },
      include: [
        {
          model: Sacco,
          as: 'sacco',
          attributes: ['saccoId', 'saccoName']
        }
      ]
    });

    if (!nextOfKinRelationType) {
      return res.status(404).json({
        code: 404,
        message: 'Next of kin relation type not found',
        entity: null
      });
    }

    res.json({
      code: 200,
      message: "Next of kin relation type retrieved successfully",
      entity: nextOfKinRelationType
    });
  } catch (error) {
    console.error('Error fetching next of kin relation type:', error);
    res.status(500).json({
      code: 500,
      message: 'Error fetching next of kin relation type',
      entity: null,
      error: error.message
    });
  }
});

// POST /api/next-of-kin-relation-types - Create new next of kin relation type
router.post('/', validateToken, logCreateOperation("NextOfKinRelationTypes"), async (req, res) => {
  try {
    const { relationTypeName, description, saccoId = 'SYSTEM' } = req.body;
    const username = req.user?.username || null;

    // Check if relation type name already exists
    const existingRelationType = await NextOfKinRelationTypes.findOne({
      where: { relationTypeName, saccoId, isDeleted: 0 }
    });

    if (existingRelationType) {
      return res.status(400).json({
        code: 400,
        message: 'Next of kin relation type with this name already exists',
        entity: null
      });
    }

    const relationTypeId = generateRelationTypeId();
    
    const nextOfKinRelationType = await NextOfKinRelationTypes.create({
      relationTypeId,
      relationTypeName,
      description,
      saccoId,
      status: 'Active',
      createdBy: username,
      createdOn: new Date(),
      isDeleted: 0
    });

    // Fetch the created next of kin relation type with associations
    const createdRelationType = await NextOfKinRelationTypes.findByPk(nextOfKinRelationType.id, {
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
      message: 'Next of kin relation type created successfully',
      entity: createdRelationType
    });
  } catch (error) {
    console.error('Error creating next of kin relation type:', error);
    res.status(500).json({
      code: 500,
      message: 'Error creating next of kin relation type',
      entity: null,
      error: error.message
    });
  }
});

// PUT /api/next-of-kin-relation-types/:id - Update next of kin relation type
router.put('/:id', validateToken, logUpdateOperation("NextOfKinRelationTypes"), async (req, res) => {
  try {
    const { id } = req.params;
    const { relationTypeName, description, status } = req.body;
    const userId = req.user.userId;

    const nextOfKinRelationType = await NextOfKinRelationTypes.findOne({
      where: { id, isDeleted: 0 }
    });
    
    if (!nextOfKinRelationType) {
      return res.status(404).json({
        code: 404,
        message: 'Next of kin relation type not found',
        entity: null
      });
    }

    // Check if relation type name already exists (excluding current record)
    if (relationTypeName && relationTypeName !== nextOfKinRelationType.relationTypeName) {
      const existingRelationType = await NextOfKinRelationTypes.findOne({
        where: { 
          relationTypeName, 
          saccoId: nextOfKinRelationType.saccoId,
          id: { [Op.ne]: id },
          isDeleted: 0
        }
      });

      if (existingRelationType) {
        return res.status(400).json({
          code: 400,
          message: 'Next of kin relation type with this name already exists',
          entity: null
        });
      }
    }

    await nextOfKinRelationType.update({
      relationTypeName: relationTypeName || nextOfKinRelationType.relationTypeName,
      description: description !== undefined ? description : nextOfKinRelationType.description,
      status: status || nextOfKinRelationType.status,
      modifiedBy: userId,
      modifiedOn: new Date()
    });

    // Fetch the updated next of kin relation type with associations
    const updatedRelationType = await NextOfKinRelationTypes.findByPk(id, {
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
      message: 'Next of kin relation type updated successfully',
      entity: updatedRelationType
    });
  } catch (error) {
    console.error('Error updating next of kin relation type:', error);
    res.status(500).json({
      code: 500,
      message: 'Error updating next of kin relation type',
      entity: null,
      error: error.message
    });
  }
});

// DELETE /api/next-of-kin-relation-types/:id - Soft delete next of kin relation type
router.delete('/:id', validateToken, logDeleteOperation("NextOfKinRelationTypes"), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const nextOfKinRelationType = await NextOfKinRelationTypes.findOne({
      where: { id, isDeleted: 0 }
    });
    
    if (!nextOfKinRelationType) {
      return res.status(404).json({
        code: 404,
        message: 'Next of kin relation type not found',
        entity: null
      });
    }

    await nextOfKinRelationType.update({
      isDeleted: 1,
      modifiedBy: userId,
      modifiedOn: new Date()
    });

    res.json({
      code: 200,
      message: 'Next of kin relation type deleted successfully',
      entity: null
    });
  } catch (error) {
    console.error('Error deleting next of kin relation type:', error);
    res.status(500).json({
      code: 500,
      message: 'Error deleting next of kin relation type',
      entity: null,
      error: error.message
    });
  }
});

// PUT /api/next-of-kin-relation-types/:id/status - Update next of kin relation type status
router.put('/:id/status', validateToken, logUpdateOperation("NextOfKinRelationTypes"), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, verifierRemarks } = req.body;
    const userId = req.user.userId;

    const nextOfKinRelationType = await NextOfKinRelationTypes.findOne({
      where: { id, isDeleted: 0 }
    });
    
    if (!nextOfKinRelationType) {
      return res.status(404).json({
        code: 404,
        message: 'Next of kin relation type not found',
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

    await nextOfKinRelationType.update(updateData);

    // Fetch the updated next of kin relation type with associations
    const updatedRelationType = await NextOfKinRelationTypes.findByPk(id, {
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
      message: `Next of kin relation type ${status.toLowerCase()} successfully`,
      entity: updatedRelationType
    });
  } catch (error) {
    console.error('Error updating next of kin relation type status:', error);
    res.status(500).json({
      code: 500,
      message: 'Error updating next of kin relation type status',
      entity: null,
      error: error.message
    });
  }
});

module.exports = router;

