const express = require("express");
const router = express.Router();
const { Members } = require("../models");
const { validateToken } = require("../middlewares/AuthMiddleware");
const { logViewOperation, logCreateOperation, logUpdateOperation, logDeleteOperation } = require("../middlewares/LoggingMiddleware");

const respond = (res, code, message, entity) => {
  res.status(code).json({ code, message, entity });
};

// List with optional status filter and search
router.get("/", validateToken, logViewOperation("Member"), async (req, res) => {
  try {
    const { status, q } = req.query;
    const where = { isDeleted: 0 };
    if (status) where.status = status;
    if (q) {
      const { Op } = require("sequelize");
      where[Op.or] = [
        { memberNo: { [Op.like]: `%${q}%` } },
        { firstName: { [Op.like]: `%${q}%` } },
        { lastName: { [Op.like]: `%${q}%` } },
        { identificationNumber: { [Op.like]: `%${q}%` } },
      ];
    }
    const members = await Members.findAll({ where, order: [["createdOn", "DESC"]] });
    
    // Parse nextOfKin JSON strings back to objects
    const membersWithParsedNextOfKin = members.map(member => {
      const memberData = member.toJSON();
      if (memberData.nextOfKin) {
        try {
          memberData.nextOfKin = JSON.parse(memberData.nextOfKin);
        } catch (e) {
          memberData.nextOfKin = null;
        }
      }
      return memberData;
    });
    
    respond(res, 200, "Members fetched", membersWithParsedNextOfKin);
  } catch (err) {
    respond(res, 500, err.message);
  }
});

// Get one
router.get("/:id", validateToken, logViewOperation("Member"), async (req, res) => {
  try {
    const member = await Members.findByPk(req.params.id);
    if (!member || member.isDeleted) return respond(res, 404, "Not found");
    
    // Parse nextOfKin JSON string back to object
    const memberData = member.toJSON();
    if (memberData.nextOfKin) {
      try {
        memberData.nextOfKin = JSON.parse(memberData.nextOfKin);
      } catch (e) {
        memberData.nextOfKin = null;
      }
    }
    
    respond(res, 200, "Member fetched", memberData);
  } catch (err) {
    respond(res, 500, err.message);
  }
});

// Generate unique sequential member number
const generateMemberNumber = async (saccoId) => {
  // Find the highest existing member number for this sacco
  const lastMember = await Members.findOne({
    where: { 
      saccoId: saccoId,
      isDeleted: 0,
      memberNo: {
        [require('sequelize').Op.like]: 'M-%'
      }
    },
    order: [['memberNo', 'DESC']]
  });
  
  let nextNumber = 1;
  
  if (lastMember && lastMember.memberNo) {
    // Extract the number part from the last member number
    const lastNumber = parseInt(lastMember.memberNo.replace('M-', ''));
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }
  
  // Keep trying until we find a unique number
  let memberNo;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 1000; // Increased for sequential generation
  
  while (!isUnique && attempts < maxAttempts) {
    memberNo = `M-${nextNumber.toString().padStart(7, '0')}`;
    
    // Check if this member number already exists
    const existingMember = await Members.findOne({
      where: { memberNo: memberNo, isDeleted: 0 }
    });
    
    if (!existingMember) {
      isUnique = true;
    } else {
      nextNumber++;
    }
    attempts++;
  }
  
  if (!isUnique) {
    throw new Error('Unable to generate unique member number after multiple attempts');
  }
  
  return memberNo;
};

// Test endpoint without authentication
router.post("/test", async (req, res) => {
  try {
    const data = req.body || {};
    const username = "test-user";
    
    // Always auto-generate unique member number
    const memberNo = await generateMemberNumber(data.saccoId);
    
    const payload = {
      memberNo: memberNo,
      saccoId: data.saccoId,
      title: data.title || null,
      firstName: data.firstName,
      lastName: data.lastName,
      category: data.category || null,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth,
      nationality: data.nationality,
      identificationType: data.identificationType,
      identificationNumber: data.identificationNumber,
      identificationExpiryDate: data.identificationExpiryDate || null,
      kraPin: data.kraPin || null,
      maritalStatus: data.maritalStatus || null,
      country: data.country || null,
      county: data.county || null,
      email: data.email || null,
      personalPhone: data.personalPhone || null,
      alternativePhone: data.alternativePhone || null,
      nextOfKin: data.nextOfKin ? JSON.stringify(data.nextOfKin) : null,
      photo: data.photo || null,
      signature: data.signature || null,
      createdOn: new Date(),
      createdBy: username,
      status: data.status || "Active",
    };
    
    const created = await Members.create(payload);
    respond(res, 201, "Member created successfully (TEST MODE)", created);
  } catch (err) {
    console.error("Error creating member (TEST):", err);
    respond(res, 500, `Server error: ${err.message}`, null);
  }
});

// Create
router.post("/", validateToken, logCreateOperation("Member"), async (req, res) => {
  try {
    const data = req.body || {};
    const username = req.user?.username || null;
    
    // Always auto-generate unique member number
    const memberNo = await generateMemberNumber(data.saccoId);
    
    const payload = {
      memberNo: memberNo,
      saccoId: data.saccoId,
      title: data.title || null,
      firstName: data.firstName,
      lastName: data.lastName,
      category: data.category || null,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth,
      nationality: data.nationality,
      identificationType: data.identificationType,
      identificationNumber: data.identificationNumber,
      identificationExpiryDate: data.identificationExpiryDate || null,
      kraPin: data.kraPin || null,
      maritalStatus: data.maritalStatus || null,
      country: data.country || null,
      county: data.county || null,
      email: data.email || null,
      personalPhone: data.personalPhone || null,
      alternativePhone: data.alternativePhone || null,
      nextOfKin: data.nextOfKin ? JSON.stringify(data.nextOfKin) : null,
      photo: data.photo || null,
      signature: data.signature || null,
      createdOn: new Date(),
      createdBy: username,
      status: "Pending",
    };
    
    // Start database transaction
    const sequelize = require('../models').sequelize;
    const transaction = await sequelize.transaction();
    
    let created;
    let createdAccounts = [];
    
    try {
      created = await Members.create(payload, { transaction });
      
      // Get account types that should be applied on member onboarding
      const { AccountTypes, Accounts, Products } = require("../models");
      const onboardingAccountTypes = await AccountTypes.findAll({
        where: { 
          appliedOnMemberOnboarding: true, 
          isDeleted: 0,
          status: 'Active'
        },
        include: [
          {
            model: Products,
            as: 'product',
            required: false
          }
        ],
        transaction
      });
      
      // Create accounts for each onboarding account type
      for (const accountType of onboardingAccountTypes) {
        // Generate account ID and account number
        const generateAccountId = (accountTypeId, memberId) => {
          const accountTypeDigits = accountTypeId.replace('AT-', '');
          const memberDigits = memberId.replace('M-', '');
          return `A-${accountTypeDigits}${memberDigits}`;
        };
        
        const generateAccountNumber = () => {
          const randomNum = Math.floor(1000000000 + Math.random() * 9000000000);
          return randomNum.toString();
        };
        
        const accountId = generateAccountId(accountType.accountTypeId, created.memberNo);
        
        // Generate account name using member's name and product name
        let accountName;
        if (accountType.appliedOnMemberOnboarding && accountType.product) {
          const memberName = `${created.firstName} ${created.lastName}`;
          const productName = accountType.product.productName;
          accountName = `${memberName}'s ${productName} Account`;
        } else {
          accountName = accountType.accountTypeName;
        }
        
        // Check if account ID or number already exists
        const existingAccount = await Accounts.findOne({
          where: {
            accountId: accountId
          },
          transaction
        });
        
        if (!existingAccount) {
          const accountPayload = {
            accountId,
            saccoId: created.saccoId,
            accountType: accountType.accountType,
            accountTypeId: accountType.id,
            memberId: created.id,
            productId: accountType.productId,
            accountName,
            availableBalance: 0.00,
            status: "Active",
            remarks: "Auto-created on member onboarding",
            createdBy: username,
            createdOn: new Date(),
            isDeleted: 0
          };
          
          const account = await Accounts.create(accountPayload, { transaction });
          createdAccounts.push(account);
        }
      }
      
      await transaction.commit();
      
      // Get created member with accounts (after successful transaction)
      try {
        const memberWithAccounts = await Members.findByPk(created.id, {
          include: [{
            model: Accounts,
            as: 'accounts',
            include: [
              {
                model: Products,
                as: 'product'
              },
              {
                model: AccountTypes,
                as: 'accountTypeDefinition'
              }
            ]
          }]
        });
        
        respond(res, 201, "Member created with accounts", {
          member: memberWithAccounts,
          createdAccounts: createdAccounts
        });
      } catch (fetchError) {
        console.error("Error fetching created member:", fetchError);
        // Still respond with success since the member was created successfully
        respond(res, 201, "Member created successfully", {
          member: created,
          createdAccounts: createdAccounts
        });
      }
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
    
  } catch (err) {
    console.error("Error creating member:", err);
    respond(res, 500, `Server error: ${err.message}`, null);
  }
});

// Update
router.put("/:id", validateToken, logUpdateOperation("Member"), async (req, res) => {
  try {
    const data = req.body || {};
    const username = req.user?.username || null;
    const updatePayload = {
      // memberNo should not be updated - it's auto-generated and immutable
      saccoId: data.saccoId,
      title: data.title || null,
      firstName: data.firstName,
      lastName: data.lastName,
      category: data.category || null,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth,
      nationality: data.nationality,
      identificationType: data.identificationType,
      identificationNumber: data.identificationNumber,
      identificationExpiryDate: data.identificationExpiryDate || null,
      kraPin: data.kraPin || null,
      maritalStatus: data.maritalStatus || null,
      country: data.country || null,
      county: data.county || null,
      email: data.email || null,
      personalPhone: data.personalPhone || null,
      alternativePhone: data.alternativePhone || null,
      nextOfKin: data.nextOfKin ? JSON.stringify(data.nextOfKin) : null,
      photo: data.photo || null,
      signature: data.signature || null,
      verifierRemarks: data.verifierRemarks || null,
      status: data.status || undefined,
      modifiedOn: new Date(),
      modifiedBy: username,
    };
    const [count] = await Members.update(updatePayload, { where: { id: req.params.id, isDeleted: 0 } });
    if (!count) return respond(res, 404, "Not found");
    const updated = await Members.findByPk(req.params.id);
    
    // Parse nextOfKin JSON string back to object
    const updatedData = updated.toJSON();
    if (updatedData.nextOfKin) {
      try {
        updatedData.nextOfKin = JSON.parse(updatedData.nextOfKin);
      } catch (e) {
        updatedData.nextOfKin = null;
      }
    }
    
    respond(res, 200, "Member updated", updatedData);
  } catch (err) {
    respond(res, 500, err.message);
  }
});

// Soft delete
router.delete("/:id", validateToken, logDeleteOperation("Member"), async (req, res) => {
  try {
    const [count] = await Members.update({ isDeleted: 1 }, { where: { id: req.params.id } });
    if (!count) return respond(res, 404, "Not found");
    respond(res, 200, "Member deleted");
  } catch (err) {
    respond(res, 500, err.message);
  }
});

module.exports = router;


