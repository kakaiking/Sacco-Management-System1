const express = require('express');
const router = express.Router();
const { MemberCategories, Sacco } = require('../models');
const { Op } = require('sequelize');
const { validateToken } = require('../middlewares/AuthMiddleware');
const { logViewOperation, logCreateOperation, logUpdateOperation, logDeleteOperation } = require('../middlewares/LoggingMiddleware');

// Generate Member Category ID
const generateMemberCategoryId = () => {
  const randomNum = Math.floor(1000000 + Math.random() * 9000000); // 7 digits
  return `MC-${randomNum}`;
};

// GET /api/member-categories - Get all member categories with pagination and filtering
router.get('/', validateToken, logViewOperation("MemberCategories"), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', saccoId } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {
      isDeleted: 0 // Only show non-deleted records
    };
    
    if (search) {
      whereClause[Op.or] = [
        { memberCategoryName: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { memberCategoryId: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (status) {
      whereClause.status = status;
    }
    
    if (saccoId) {
      whereClause.saccoId = saccoId;
    }

    const { count, rows: memberCategories } = await MemberCategories.findAndCountAll({
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
      message: "Member categories retrieved successfully",
      entity: memberCategories,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching member categories:', error);
    res.status(500).json({
      code: 500,
      message: 'Error fetching member categories',
      entity: null,
      error: error.message
    });
  }
});

// GET /api/member-categories/:id - Get single member category by ID
router.get('/:id', validateToken, logViewOperation("MemberCategories"), async (req, res) => {
  try {
    const { id } = req.params;
    
    const memberCategory = await MemberCategories.findOne({
      where: { id, isDeleted: 0 },
      include: [
        {
          model: Sacco,
          as: 'sacco',
          attributes: ['saccoId', 'saccoName']
        }
      ]
    });

    if (!memberCategory) {
      return res.status(404).json({
        code: 404,
        message: 'Member category not found',
        entity: null
      });
    }

    res.json({
      code: 200,
      message: "Member category retrieved successfully",
      entity: memberCategory
    });
  } catch (error) {
    console.error('Error fetching member category:', error);
    res.status(500).json({
      code: 500,
      message: 'Error fetching member category',
      entity: null,
      error: error.message
    });
  }
});

// POST /api/member-categories - Create new member category
router.post('/', validateToken, logCreateOperation("MemberCategories"), async (req, res) => {
  try {
    const { memberCategoryName, description, saccoId = 'SYSTEM' } = req.body;
    const username = req.user?.username || null;

    // Check if member category name already exists
    const existingMemberCategory = await MemberCategories.findOne({
      where: { memberCategoryName, saccoId, isDeleted: 0 }
    });

    if (existingMemberCategory) {
      return res.status(400).json({
        code: 400,
        message: 'Member category with this name already exists',
        entity: null
      });
    }

    const memberCategoryId = generateMemberCategoryId();
    
    const memberCategory = await MemberCategories.create({
      memberCategoryId,
      memberCategoryName,
      description,
      saccoId,
      status: 'Active',
      createdBy: username,
      createdOn: new Date(),
      isDeleted: 0
    });

    // Fetch the created member category with associations
    const createdMemberCategory = await MemberCategories.findByPk(memberCategory.id, {
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
      message: 'Member category created successfully',
      entity: createdMemberCategory
    });
  } catch (error) {
    console.error('Error creating member category:', error);
    res.status(500).json({
      code: 500,
      message: 'Error creating member category',
      entity: null,
      error: error.message
    });
  }
});

// PUT /api/member-categories/:id - Update member category
router.put('/:id', validateToken, logUpdateOperation("MemberCategories"), async (req, res) => {
  try {
    const { id } = req.params;
    const { memberCategoryName, description, status } = req.body;
    const userId = req.user.userId;

    const memberCategory = await MemberCategories.findOne({
      where: { id, isDeleted: 0 }
    });
    
    if (!memberCategory) {
      return res.status(404).json({
        code: 404,
        message: 'Member category not found',
        entity: null
      });
    }

    // Check if member category name already exists (excluding current record)
    if (memberCategoryName && memberCategoryName !== memberCategory.memberCategoryName) {
      const existingMemberCategory = await MemberCategories.findOne({
        where: { 
          memberCategoryName, 
          saccoId: memberCategory.saccoId,
          id: { [Op.ne]: id },
          isDeleted: 0
        }
      });

      if (existingMemberCategory) {
        return res.status(400).json({
          code: 400,
          message: 'Member category with this name already exists',
          entity: null
        });
      }
    }

    await memberCategory.update({
      memberCategoryName: memberCategoryName || memberCategory.memberCategoryName,
      description: description !== undefined ? description : memberCategory.description,
      status: status || memberCategory.status,
      modifiedBy: userId,
      modifiedOn: new Date()
    });

    // Fetch the updated member category with associations
    const updatedMemberCategory = await MemberCategories.findByPk(id, {
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
      message: 'Member category updated successfully',
      entity: updatedMemberCategory
    });
  } catch (error) {
    console.error('Error updating member category:', error);
    res.status(500).json({
      code: 500,
      message: 'Error updating member category',
      entity: null,
      error: error.message
    });
  }
});

// DELETE /api/member-categories/:id - Soft delete member category
router.delete('/:id', validateToken, logDeleteOperation("MemberCategories"), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const memberCategory = await MemberCategories.findOne({
      where: { id, isDeleted: 0 }
    });
    
    if (!memberCategory) {
      return res.status(404).json({
        code: 404,
        message: 'Member category not found',
        entity: null
      });
    }

    await memberCategory.update({
      isDeleted: 1,
      modifiedBy: userId,
      modifiedOn: new Date()
    });

    res.json({
      code: 200,
      message: 'Member category deleted successfully',
      entity: null
    });
  } catch (error) {
    console.error('Error deleting member category:', error);
    res.status(500).json({
      code: 500,
      message: 'Error deleting member category',
      entity: null,
      error: error.message
    });
  }
});

// PUT /api/member-categories/:id/status - Update member category status
router.put('/:id/status', validateToken, logUpdateOperation("MemberCategories"), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, verifierRemarks } = req.body;
    const userId = req.user.userId;

    const memberCategory = await MemberCategories.findOne({
      where: { id, isDeleted: 0 }
    });
    
    if (!memberCategory) {
      return res.status(404).json({
        code: 404,
        message: 'Member category not found',
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

    await memberCategory.update(updateData);

    // Fetch the updated member category with associations
    const updatedMemberCategory = await MemberCategories.findByPk(id, {
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
      message: `Member category ${status.toLowerCase()} successfully`,
      entity: updatedMemberCategory
    });
  } catch (error) {
    console.error('Error updating member category status:', error);
    res.status(500).json({
      code: 500,
      message: 'Error updating member category status',
      entity: null,
      error: error.message
    });
  }
});

module.exports = router;


