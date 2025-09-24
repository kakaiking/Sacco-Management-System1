const express = require('express');
const router = express.Router();
const { InterestCalculationRules, Sacco } = require('../models');
const { Op } = require('sequelize');
const { validateToken } = require('../middlewares/AuthMiddleware');
const { logViewOperation, logCreateOperation, logUpdateOperation, logDeleteOperation } = require('../middlewares/LoggingMiddleware');

// Generate Interest Calculation Rule ID
const generateRuleId = () => {
  const randomNum = Math.floor(1000000 + Math.random() * 9000000); // 7 digits
  return `ICR-${randomNum}`;
};

// GET /api/interest-calculation-rules - Get all interest calculation rules with pagination and filtering
router.get('/', validateToken, logViewOperation("InterestCalculationRules"), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', saccoId } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {
      isDeleted: 0 // Only show non-deleted records
    };
    
    if (search) {
      whereClause[Op.or] = [
        { ruleName: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { ruleId: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (status) {
      whereClause.status = status;
    }
    
    if (saccoId) {
      whereClause.saccoId = saccoId;
    }

    const { count, rows: interestCalculationRules } = await InterestCalculationRules.findAndCountAll({
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
      message: "Interest calculation rules retrieved successfully",
      entity: interestCalculationRules,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching interest calculation rules:', error);
    res.status(500).json({
      code: 500,
      message: 'Error fetching interest calculation rules',
      entity: null,
      error: error.message
    });
  }
});

// GET /api/interest-calculation-rules/:id - Get single interest calculation rule by ID
router.get('/:id', validateToken, logViewOperation("InterestCalculationRules"), async (req, res) => {
  try {
    const { id } = req.params;
    
    const interestCalculationRule = await InterestCalculationRules.findOne({
      where: { id, isDeleted: 0 },
      include: [
        {
          model: Sacco,
          as: 'sacco',
          attributes: ['saccoId', 'saccoName']
        }
      ]
    });

    if (!interestCalculationRule) {
      return res.status(404).json({
        code: 404,
        message: 'Interest calculation rule not found',
        entity: null
      });
    }

    res.json({
      code: 200,
      message: "Interest calculation rule retrieved successfully",
      entity: interestCalculationRule
    });
  } catch (error) {
    console.error('Error fetching interest calculation rule:', error);
    res.status(500).json({
      code: 500,
      message: 'Error fetching interest calculation rule',
      entity: null,
      error: error.message
    });
  }
});

// POST /api/interest-calculation-rules - Create new interest calculation rule
router.post('/', validateToken, logCreateOperation("InterestCalculationRules"), async (req, res) => {
  try {
    const { ruleName, description, saccoId = 'SYSTEM' } = req.body;
    const username = req.user?.username || null;

    // Check if rule name already exists
    const existingRule = await InterestCalculationRules.findOne({
      where: { ruleName, saccoId, isDeleted: 0 }
    });

    if (existingRule) {
      return res.status(400).json({
        code: 400,
        message: 'Interest calculation rule with this name already exists',
        entity: null
      });
    }

    const ruleId = generateRuleId();
    
    const interestCalculationRule = await InterestCalculationRules.create({
      ruleId,
      ruleName,
      description,
      saccoId,
      status: 'Active',
      createdBy: username,
      createdOn: new Date(),
      isDeleted: 0
    });

    // Fetch the created interest calculation rule with associations
    const createdRule = await InterestCalculationRules.findByPk(interestCalculationRule.id, {
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
      message: 'Interest calculation rule created successfully',
      entity: createdRule
    });
  } catch (error) {
    console.error('Error creating interest calculation rule:', error);
    res.status(500).json({
      code: 500,
      message: 'Error creating interest calculation rule',
      entity: null,
      error: error.message
    });
  }
});

// PUT /api/interest-calculation-rules/:id - Update interest calculation rule
router.put('/:id', validateToken, logUpdateOperation("InterestCalculationRules"), async (req, res) => {
  try {
    const { id } = req.params;
    const { ruleName, description, status } = req.body;
    const userId = req.user.userId;

    const interestCalculationRule = await InterestCalculationRules.findOne({
      where: { id, isDeleted: 0 }
    });
    
    if (!interestCalculationRule) {
      return res.status(404).json({
        code: 404,
        message: 'Interest calculation rule not found',
        entity: null
      });
    }

    // Check if rule name already exists (excluding current record)
    if (ruleName && ruleName !== interestCalculationRule.ruleName) {
      const existingRule = await InterestCalculationRules.findOne({
        where: { 
          ruleName, 
          saccoId: interestCalculationRule.saccoId,
          id: { [Op.ne]: id },
          isDeleted: 0
        }
      });

      if (existingRule) {
        return res.status(400).json({
          code: 400,
          message: 'Interest calculation rule with this name already exists',
          entity: null
        });
      }
    }

    await interestCalculationRule.update({
      ruleName: ruleName || interestCalculationRule.ruleName,
      description: description !== undefined ? description : interestCalculationRule.description,
      status: status || interestCalculationRule.status,
      modifiedBy: userId,
      modifiedOn: new Date()
    });

    // Fetch the updated interest calculation rule with associations
    const updatedRule = await InterestCalculationRules.findByPk(id, {
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
      message: 'Interest calculation rule updated successfully',
      entity: updatedRule
    });
  } catch (error) {
    console.error('Error updating interest calculation rule:', error);
    res.status(500).json({
      code: 500,
      message: 'Error updating interest calculation rule',
      entity: null,
      error: error.message
    });
  }
});

// DELETE /api/interest-calculation-rules/:id - Soft delete interest calculation rule
router.delete('/:id', validateToken, logDeleteOperation("InterestCalculationRules"), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const interestCalculationRule = await InterestCalculationRules.findOne({
      where: { id, isDeleted: 0 }
    });
    
    if (!interestCalculationRule) {
      return res.status(404).json({
        code: 404,
        message: 'Interest calculation rule not found',
        entity: null
      });
    }

    await interestCalculationRule.update({
      isDeleted: 1,
      modifiedBy: userId,
      modifiedOn: new Date()
    });

    res.json({
      code: 200,
      message: 'Interest calculation rule deleted successfully',
      entity: null
    });
  } catch (error) {
    console.error('Error deleting interest calculation rule:', error);
    res.status(500).json({
      code: 500,
      message: 'Error deleting interest calculation rule',
      entity: null,
      error: error.message
    });
  }
});

// PUT /api/interest-calculation-rules/:id/status - Update interest calculation rule status
router.put('/:id/status', validateToken, logUpdateOperation("InterestCalculationRules"), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, verifierRemarks } = req.body;
    const userId = req.user.userId;

    const interestCalculationRule = await InterestCalculationRules.findOne({
      where: { id, isDeleted: 0 }
    });
    
    if (!interestCalculationRule) {
      return res.status(404).json({
        code: 404,
        message: 'Interest calculation rule not found',
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

    await interestCalculationRule.update(updateData);

    // Fetch the updated interest calculation rule with associations
    const updatedRule = await InterestCalculationRules.findByPk(id, {
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
      message: `Interest calculation rule ${status.toLowerCase()} successfully`,
      entity: updatedRule
    });
  } catch (error) {
    console.error('Error updating interest calculation rule status:', error);
    res.status(500).json({
      code: 500,
      message: 'Error updating interest calculation rule status',
      entity: null,
      error: error.message
    });
  }
});

module.exports = router;

