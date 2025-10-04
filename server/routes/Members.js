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
    const { status, q, category } = req.query;
    const where = { isDeleted: 0 };
    if (status) where.status = status;
    if (category) where.category = category;
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
    
    // Parse JSON string fields back to objects
    const membersWithParsedData = members.map(member => {
      const memberData = member.toJSON();
      if (memberData.nextOfKin) {
        try {
          memberData.nextOfKin = JSON.parse(memberData.nextOfKin);
        } catch (e) {
          memberData.nextOfKin = null;
        }
      }
      if (memberData.jointMembers) {
        try {
          memberData.jointMembers = JSON.parse(memberData.jointMembers);
        } catch (e) {
          memberData.jointMembers = null;
        }
      }
      if (memberData.chamaMembers) {
        try {
          memberData.chamaMembers = JSON.parse(memberData.chamaMembers);
        } catch (e) {
          memberData.chamaMembers = null;
        }
      }
      if (memberData.authorizedSignatories) {
        try {
          memberData.authorizedSignatories = JSON.parse(memberData.authorizedSignatories);
        } catch (e) {
          memberData.authorizedSignatories = null;
        }
      }
      if (memberData.photos) {
        try {
          memberData.photos = JSON.parse(memberData.photos);
        } catch (e) {
          memberData.photos = null;
        }
      }
      if (memberData.signatures) {
        try {
          memberData.signatures = JSON.parse(memberData.signatures);
        } catch (e) {
          memberData.signatures = null;
        }
      }
      if (memberData.biometrics) {
        try {
          memberData.biometrics = JSON.parse(memberData.biometrics);
        } catch (e) {
          memberData.biometrics = null;
        }
      }
      if (memberData.guardianPhotos) {
        try {
          memberData.guardianPhotos = JSON.parse(memberData.guardianPhotos);
        } catch (e) {
          memberData.guardianPhotos = null;
        }
      }
      if (memberData.guardianSignatures) {
        try {
          memberData.guardianSignatures = JSON.parse(memberData.guardianSignatures);
        } catch (e) {
          memberData.guardianSignatures = null;
        }
      }
      if (memberData.guardianBiometrics) {
        try {
          memberData.guardianBiometrics = JSON.parse(memberData.guardianBiometrics);
        } catch (e) {
          memberData.guardianBiometrics = null;
        }
      }
      return memberData;
    });
    
    respond(res, 200, "Members fetched", membersWithParsedData);
  } catch (err) {
    respond(res, 500, err.message);
  }
});

// Get one
router.get("/:id", validateToken, logViewOperation("Member"), async (req, res) => {
  try {
    const member = await Members.findByPk(req.params.id);
    if (!member || member.isDeleted) return respond(res, 404, "Not found");
    
    // Parse JSON string fields back to objects
    const memberData = member.toJSON();
    if (memberData.nextOfKin) {
      try {
        memberData.nextOfKin = JSON.parse(memberData.nextOfKin);
      } catch (e) {
        memberData.nextOfKin = null;
      }
    }
    if (memberData.jointMembers) {
      try {
        memberData.jointMembers = JSON.parse(memberData.jointMembers);
      } catch (e) {
        memberData.jointMembers = null;
      }
    }
    if (memberData.chamaMembers) {
      try {
        memberData.chamaMembers = JSON.parse(memberData.chamaMembers);
      } catch (e) {
        memberData.chamaMembers = null;
      }
    }
    if (memberData.authorizedSignatories) {
      try {
        memberData.authorizedSignatories = JSON.parse(memberData.authorizedSignatories);
      } catch (e) {
        memberData.authorizedSignatories = null;
      }
    }
    if (memberData.photos) {
      try {
        memberData.photos = JSON.parse(memberData.photos);
      } catch (e) {
        memberData.photos = null;
      }
    }
    if (memberData.signatures) {
      try {
        memberData.signatures = JSON.parse(memberData.signatures);
      } catch (e) {
        memberData.signatures = null;
      }
    }
    if (memberData.biometrics) {
      try {
        memberData.biometrics = JSON.parse(memberData.biometrics);
      } catch (e) {
        memberData.biometrics = null;
      }
    }
    if (memberData.guardianPhotos) {
      try {
        memberData.guardianPhotos = JSON.parse(memberData.guardianPhotos);
      } catch (e) {
        memberData.guardianPhotos = null;
      }
    }
    if (memberData.guardianSignatures) {
      try {
        memberData.guardianSignatures = JSON.parse(memberData.guardianSignatures);
      } catch (e) {
        memberData.guardianSignatures = null;
      }
    }
    if (memberData.guardianBiometrics) {
      try {
        memberData.guardianBiometrics = JSON.parse(memberData.guardianBiometrics);
      } catch (e) {
        memberData.guardianBiometrics = null;
      }
    }
    
    respond(res, 200, "Member fetched", memberData);
  } catch (err) {
    respond(res, 500, err.message);
  }
});

// Generate unique sequential member number using configured format
const generateMemberNumber = async (saccoId, transaction = null) => {
  const sequelize = require('sequelize');
  const { Op } = sequelize;
  const { IdFormatConfigurations } = require('../models');
  
  // Use provided transaction or create a new one
  let shouldCommit = false;
  if (!transaction) {
    transaction = await require('../models').sequelize.transaction();
    shouldCommit = true;
  }
  
  try {
    // Get the ID format configuration for Members
    const config = await IdFormatConfigurations.findOne({
      where: { 
        modelName: 'Members',
        saccoId: saccoId,
        isActive: true,
        isDeleted: 0
      },
      lock: true,
      transaction
    });
    
    if (!config) {
      // Fallback to old format if no configuration found
      console.warn('No ID format configuration found for Members, using fallback format');
      const lastMember = await Members.findOne({
        where: { 
          saccoId: saccoId,
          isDeleted: 0,
          memberNo: {
            [Op.like]: 'M-%'
          }
        },
        order: [['memberNo', 'DESC']],
        lock: true,
        transaction
      });
      
      let nextNumber = 1;
      if (lastMember && lastMember.memberNo) {
        const lastNumber = parseInt(lastMember.memberNo.replace('M-', ''));
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
      
      const memberNo = `M-${nextNumber.toString().padStart(7, '0')}`;
      
      // Check if this member number already exists (double-check)
      const existingMember = await Members.findOne({
        where: { 
          memberNo: memberNo
        },
        transaction
      });
      
      if (existingMember) {
        throw new Error(`Generated member number ${memberNo} already exists`);
      }
      
      if (shouldCommit) {
        await transaction.commit();
      }
      return memberNo;
    }
    
    // Generate ID using configuration
    const nextNumber = config.currentNumber + 1;
    
    let numberPart;
    if (config.characterType === 'NUMERIC') {
      numberPart = nextNumber.toString().padStart(config.digitCount, '0');
    } else if (config.characterType === 'ALPHANUMERIC') {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      numberPart = '';
      let tempNumber = nextNumber;
      for (let i = 0; i < config.digitCount; i++) {
        numberPart = chars.charAt(tempNumber % chars.length) + numberPart;
        tempNumber = Math.floor(tempNumber / chars.length);
      }
    } else if (config.characterType === 'ALPHA') {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      numberPart = '';
      let tempNumber = nextNumber;
      for (let i = 0; i < config.digitCount; i++) {
        numberPart = chars.charAt(tempNumber % chars.length) + numberPart;
        tempNumber = Math.floor(tempNumber / chars.length);
      }
    }
    
    const generatedId = `${config.prefix || ''}${numberPart}${config.suffix || ''}`;
    
    // Check if this member number already exists
    const existingMember = await Members.findOne({
      where: { 
        memberNo: generatedId
      },
      transaction
    });
    
    if (existingMember) {
      throw new Error(`Generated member number ${generatedId} already exists`);
    }
    
    // Update the current number in configuration
    await config.update({
      currentNumber: nextNumber,
      modifiedOn: new Date(),
      modifiedBy: 'SYSTEM'
    }, { transaction });
    
    if (shouldCommit) {
      await transaction.commit();
    }
    return generatedId;
    
  } catch (error) {
    if (shouldCommit && transaction && !transaction.finished && !transaction.committed) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('Error during rollback in generateMemberNumber:', rollbackError.message);
      }
    }
    throw error;
  }
};

// Create
router.post("/", validateToken, logCreateOperation("Member"), async (req, res) => {
  try {
    const data = req.body || {};
    const username = req.user?.username || null;
    
    // Validate required fields for corporate members
    if (data.category === 'Corporate') {
      if (!data.companyName || !data.registrationNumber || !data.companyKraPin) {
        return respond(res, 400, "Company name, registration number, and company KRA PIN are required for corporate members", null);
      }
    }
    
    // Retry logic for member creation in case of unique constraint violations
    let created;
    let createdAccounts = [];
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        // Use provided member number or auto-generate if not provided
        let memberNo;
        if (data.memberNo && data.memberNo.trim() !== '') {
          // Use provided member number, but validate it doesn't already exist
          memberNo = data.memberNo.trim();
          
          // Check if this member number already exists
          const existingMember = await Members.findOne({
            where: { 
              memberNo: memberNo,
              isDeleted: 0
            }
          });
          
          if (existingMember) {
            throw new Error(`Member number ${memberNo} already exists`);
          }
        } else {
          // Auto-generate unique member number
          memberNo = await generateMemberNumber(data.saccoId, null);
        }
        
        // Validate and convert dateOfBirth
        let dateOfBirth = null;
        if (data.dateOfBirth) {
          const date = new Date(data.dateOfBirth);
          if (isNaN(date.getTime())) {
            return respond(res, 400, "Invalid date format for date of birth", null);
          }
          dateOfBirth = date.toISOString().split('T')[0]; // Convert to YYYY-MM-DD format
        } else if (data.category !== 'Corporate' && data.category !== 'Chama') {
          // For non-corporate and non-chama members (Individual, Minor), dateOfBirth is required
          return respond(res, 400, "Date of birth is required for individual and minor members", null);
        }
        // For corporate members, dateOfBirth can be null

        // Validate and convert identificationExpiryDate
        let identificationExpiryDate = null;
        if (data.identificationExpiryDate) {
          const date = new Date(data.identificationExpiryDate);
          if (isNaN(date.getTime())) {
            return respond(res, 400, "Invalid date format for identification expiry date", null);
          }
          identificationExpiryDate = date.toISOString().split('T')[0]; // Convert to YYYY-MM-DD format
        }
        
        const payload = {
          memberNo: memberNo,
          saccoId: data.saccoId ? data.saccoId.trim() : data.saccoId,
          title: data.title || null,
          firstName: data.firstName,
          lastName: data.lastName,
          category: data.category || null,
          gender: data.gender,
          dateOfBirth: dateOfBirth,
          nationality: data.nationality,
          identificationType: data.identificationType,
          identificationNumber: data.identificationNumber,
          identificationExpiryDate: identificationExpiryDate,
          kraPin: data.kraPin || null,
          maritalStatus: data.maritalStatus || null,
          country: data.country || null,
          county: data.county || null,
          subCounty: data.subCounty || null,
          email: data.email || null,
          personalPhone: data.personalPhone || null,
          alternativePhone: data.alternativePhone || null,
          nextOfKin: data.nextOfKin ? JSON.stringify(data.nextOfKin) : null,
          photo: data.photo || null,
          signature: data.signature || null,
          biometrics: data.biometrics ? JSON.stringify(data.biometrics) : null,
          photos: data.photos ? JSON.stringify(data.photos) : null,
          signatures: data.signatures ? JSON.stringify(data.signatures) : null,
          
          // Corporate-specific fields
          companyName: data.companyName || null,
          registrationNumber: data.registrationNumber || null,
          companyKraPin: data.companyKraPin || null,
          businessType: data.businessType || null,
          businessAddress: data.businessAddress || null,
          
          // Joint member fields
          jointMembers: data.jointMembers ? JSON.stringify(data.jointMembers) : null,
          jointMembershipName: data.jointMembershipName || null,
          
          // Minor-specific fields
          guardianName: data.guardianName || null,
          guardianIdNumber: data.guardianIdNumber || null,
          guardianKraPin: data.guardianKraPin || null,
          guardianPhone: data.guardianPhone || null,
          guardianEmail: data.guardianEmail || null,
          guardianAddress: data.guardianAddress || null,
          guardianRelationship: data.guardianRelationship || null,
          
          // Guardian photo, signature, and biometrics fields
          guardianPhotos: data.guardianPhotos ? JSON.stringify(data.guardianPhotos) : null,
          guardianSignatures: data.guardianSignatures ? JSON.stringify(data.guardianSignatures) : null,
          guardianBiometrics: data.guardianBiometrics ? JSON.stringify(data.guardianBiometrics) : null,
          
          // Chama-specific fields
          chamaName: data.chamaName || null,
          chamaRegistrationNumber: data.chamaRegistrationNumber || null,
          chamaMembers: data.chamaMembers ? JSON.stringify(data.chamaMembers) : null,
          chamaConstitution: data.chamaConstitution || null,
          
          // Authorized signatories for corporate and chama
          authorizedSignatories: data.authorizedSignatories ? JSON.stringify(data.authorizedSignatories) : null,
          
          // Special offers fields
          canSendAssociateSpecialOffer: data.canSendAssociateSpecialOffer || false,
          canSendOurSpecialOffers: data.canSendOurSpecialOffers || false,
          statementOnline: data.statementOnline || false,
          mobileAlert: data.mobileAlert || false,
          mobileBanking: data.mobileBanking || false,
          internetBanking: data.internetBanking || false,
          
          createdOn: new Date(),
          createdBy: username,
          status: "Pending",
        };
        
        // Start database transaction
        const sequelize = require('../models').sequelize;
        const transaction = await sequelize.transaction();
        
        try {
          created = await Members.create(payload, { transaction });
          
          // Get products that should be applied on member onboarding
          const { Accounts, Products } = require("../models");
          const onboardingProducts = await Products.findAll({
            where: { 
              appliedOnMemberOnboarding: true, 
              isDeleted: 0,
              status: 'Active'
            },
            transaction
          });
          
          // Create accounts for each onboarding product
          for (const product of onboardingProducts) {
            // Generate account ID
            const generateAccountId = (productId, memberId) => {
              const productDigits = productId.replace('PRD-', '');
              const memberDigits = memberId.replace('M-', '');
              return `A-${productDigits}${memberDigits}`;
            };
            
            const accountId = generateAccountId(product.productId, created.memberNo);
            
            // Generate account name using member's name and product name
            const memberName = `${created.firstName} ${created.lastName}`;
            const accountName = `${memberName}'s ${product.productName} Account`;
            
            // Check if account ID already exists
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
                accountType: product.accountType,
                memberId: created.id,
                productId: product.id,
                accountName,
                availableBalance: 0.00,
                clearBalance: 0.00,
                debitBalance: 0.00,
                creditBalance: 0.00,
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
          console.log('✅ Transaction committed successfully');
          
          // Get created member with accounts (after successful transaction)
          try {
            console.log('🔍 Fetching created member with ID:', created.id);
            const memberWithAccounts = await Members.findByPk(created.id, {
              include: [{
                model: Accounts,
                as: 'accounts',
                include: [
                  {
                    model: Products,
                    as: 'product'
                  }
                ]
              }]
            });
            
            respond(res, 201, "Member created with accounts", {
              member: memberWithAccounts,
              createdAccounts: createdAccounts
            });
            return; // Success, exit the retry loop
            
          } catch (fetchError) {
            console.error("Error fetching created member:", fetchError);
            // Still respond with success since the member was created successfully
            respond(res, 201, "Member created successfully", {
              member: created,
              createdAccounts: createdAccounts
            });
            return; // Success, exit the retry loop
          }
          
        } catch (error) {
          // Only rollback if transaction is still active
          if (transaction && !transaction.finished && !transaction.committed) {
            try {
              await transaction.rollback();
            } catch (rollbackError) {
              console.error('Error during rollback:', rollbackError.message);
              // Don't throw rollback errors as they might mask the original error
            }
          }
          
          // Check if it's a unique constraint error on memberNo
          if (error.name === 'SequelizeUniqueConstraintError' && 
              error.errors && 
              error.errors.some(err => err.path === 'UQ__Members__7FD7D7ACDEDFDBF5')) {
            retryCount++;
            console.log(`Member number collision detected, retrying... (attempt ${retryCount}/${maxRetries})`);
            
            if (retryCount >= maxRetries) {
              throw new Error('Unable to create member after multiple attempts due to member number conflicts');
            }
            
            // Wait a bit before retrying to reduce collision probability
            await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
            continue; // Retry the loop
          }
          
          // If it's not a member number collision, throw the error immediately
          throw error;
        }
      } catch (outerError) {
        // If we get here, it's not a retryable error
        throw outerError;
      }
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
    
    // Build update payload with only provided fields
    const updatePayload = {
      modifiedOn: new Date(),
      modifiedBy: username,
    };
    
    // Only include fields that are actually provided in the request
    if (data.saccoId !== undefined) updatePayload.saccoId = data.saccoId;
    if (data.title !== undefined) updatePayload.title = data.title;
    if (data.firstName !== undefined) updatePayload.firstName = data.firstName;
    if (data.lastName !== undefined) updatePayload.lastName = data.lastName;
    if (data.category !== undefined) updatePayload.category = data.category;
    if (data.gender !== undefined) updatePayload.gender = data.gender;
    if (data.dateOfBirth !== undefined) {
      if (data.dateOfBirth && data.dateOfBirth.trim() !== '') {
        const date = new Date(data.dateOfBirth);
        if (isNaN(date.getTime())) {
          return respond(res, 400, "Invalid date format for date of birth", null);
        }
        updatePayload.dateOfBirth = date.toISOString().split('T')[0]; // Convert to YYYY-MM-DD format
      } else {
        updatePayload.dateOfBirth = null; // Set to null for empty strings
      }
    }
    if (data.nationality !== undefined) updatePayload.nationality = data.nationality;
    if (data.identificationType !== undefined) updatePayload.identificationType = data.identificationType;
    if (data.identificationNumber !== undefined) updatePayload.identificationNumber = data.identificationNumber;
    if (data.identificationExpiryDate !== undefined) {
      if (data.identificationExpiryDate && data.identificationExpiryDate.trim() !== '') {
        const date = new Date(data.identificationExpiryDate);
        if (isNaN(date.getTime())) {
          return respond(res, 400, "Invalid date format for identification expiry date", null);
        }
        updatePayload.identificationExpiryDate = date.toISOString().split('T')[0]; // Convert to YYYY-MM-DD format
      } else {
        updatePayload.identificationExpiryDate = null; // Set to null for empty strings
      }
    }
    if (data.kraPin !== undefined) updatePayload.kraPin = data.kraPin;
    if (data.maritalStatus !== undefined) updatePayload.maritalStatus = data.maritalStatus;
    if (data.country !== undefined) updatePayload.country = data.country;
    if (data.county !== undefined) updatePayload.county = data.county;
    if (data.subCounty !== undefined) updatePayload.subCounty = data.subCounty;
    if (data.email !== undefined) updatePayload.email = data.email;
    if (data.personalPhone !== undefined) updatePayload.personalPhone = data.personalPhone;
    if (data.alternativePhone !== undefined) updatePayload.alternativePhone = data.alternativePhone;
    if (data.nextOfKin !== undefined) updatePayload.nextOfKin = data.nextOfKin ? JSON.stringify(data.nextOfKin) : null;
    if (data.photo !== undefined) updatePayload.photo = data.photo;
    if (data.signature !== undefined) updatePayload.signature = data.signature;
    
    // Corporate-specific fields
    if (data.companyName !== undefined) updatePayload.companyName = data.companyName;
    if (data.registrationNumber !== undefined) updatePayload.registrationNumber = data.registrationNumber;
    if (data.companyKraPin !== undefined) updatePayload.companyKraPin = data.companyKraPin;
    if (data.businessType !== undefined) updatePayload.businessType = data.businessType;
    if (data.businessAddress !== undefined) updatePayload.businessAddress = data.businessAddress;
    
    // Joint member fields
    if (data.jointMembers !== undefined) updatePayload.jointMembers = data.jointMembers ? JSON.stringify(data.jointMembers) : null;
    if (data.jointMembershipName !== undefined) updatePayload.jointMembershipName = data.jointMembershipName;
    
    // Minor-specific fields
    if (data.guardianName !== undefined) updatePayload.guardianName = data.guardianName;
    if (data.guardianIdNumber !== undefined) updatePayload.guardianIdNumber = data.guardianIdNumber;
    if (data.guardianKraPin !== undefined) updatePayload.guardianKraPin = data.guardianKraPin;
    if (data.guardianPhone !== undefined) updatePayload.guardianPhone = data.guardianPhone;
    if (data.guardianEmail !== undefined) updatePayload.guardianEmail = data.guardianEmail;
    if (data.guardianAddress !== undefined) updatePayload.guardianAddress = data.guardianAddress;
    if (data.guardianRelationship !== undefined) updatePayload.guardianRelationship = data.guardianRelationship;
    
    // Guardian photo, signature, and biometrics fields
    if (data.guardianPhotos !== undefined) updatePayload.guardianPhotos = data.guardianPhotos ? JSON.stringify(data.guardianPhotos) : null;
    if (data.guardianSignatures !== undefined) updatePayload.guardianSignatures = data.guardianSignatures ? JSON.stringify(data.guardianSignatures) : null;
    if (data.guardianBiometrics !== undefined) updatePayload.guardianBiometrics = data.guardianBiometrics ? JSON.stringify(data.guardianBiometrics) : null;
    
    // Chama-specific fields
    if (data.chamaName !== undefined) updatePayload.chamaName = data.chamaName;
    if (data.chamaRegistrationNumber !== undefined) updatePayload.chamaRegistrationNumber = data.chamaRegistrationNumber;
    if (data.chamaMembers !== undefined) updatePayload.chamaMembers = data.chamaMembers ? JSON.stringify(data.chamaMembers) : null;
    if (data.chamaConstitution !== undefined) updatePayload.chamaConstitution = data.chamaConstitution;
    
    // Authorized signatories for corporate and chama
    if (data.authorizedSignatories !== undefined) updatePayload.authorizedSignatories = data.authorizedSignatories ? JSON.stringify(data.authorizedSignatories) : null;
    
    // Photo, signature, and biometrics fields
    if (data.photo !== undefined) updatePayload.photo = data.photo;
    if (data.signature !== undefined) updatePayload.signature = data.signature;
    if (data.biometrics !== undefined) updatePayload.biometrics = data.biometrics ? JSON.stringify(data.biometrics) : null;
    if (data.photos !== undefined) updatePayload.photos = data.photos ? JSON.stringify(data.photos) : null;
    if (data.signatures !== undefined) updatePayload.signatures = data.signatures ? JSON.stringify(data.signatures) : null;
    
    // Special offers fields
    if (data.canSendAssociateSpecialOffer !== undefined) updatePayload.canSendAssociateSpecialOffer = data.canSendAssociateSpecialOffer;
    if (data.canSendOurSpecialOffers !== undefined) updatePayload.canSendOurSpecialOffers = data.canSendOurSpecialOffers;
    if (data.statementOnline !== undefined) updatePayload.statementOnline = data.statementOnline;
    if (data.mobileAlert !== undefined) updatePayload.mobileAlert = data.mobileAlert;
    if (data.mobileBanking !== undefined) updatePayload.mobileBanking = data.mobileBanking;
    if (data.internetBanking !== undefined) updatePayload.internetBanking = data.internetBanking;
    
    if (data.verifierRemarks !== undefined) updatePayload.verifierRemarks = data.verifierRemarks;
    if (data.status !== undefined) updatePayload.status = data.status;
    const [count] = await Members.update(updatePayload, { where: { id: req.params.id, isDeleted: 0 } });
    if (!count) return respond(res, 404, "Not found");
    const updated = await Members.findByPk(req.params.id);
    
    // Parse JSON string fields back to objects
    const updatedData = updated.toJSON();
    if (updatedData.nextOfKin) {
      try {
        updatedData.nextOfKin = JSON.parse(updatedData.nextOfKin);
      } catch (e) {
        updatedData.nextOfKin = null;
      }
    }
    if (updatedData.jointMembers) {
      try {
        updatedData.jointMembers = JSON.parse(updatedData.jointMembers);
      } catch (e) {
        updatedData.jointMembers = null;
      }
    }
    if (updatedData.chamaMembers) {
      try {
        updatedData.chamaMembers = JSON.parse(updatedData.chamaMembers);
      } catch (e) {
        updatedData.chamaMembers = null;
      }
    }
    if (updatedData.authorizedSignatories) {
      try {
        updatedData.authorizedSignatories = JSON.parse(updatedData.authorizedSignatories);
      } catch (e) {
        updatedData.authorizedSignatories = null;
      }
    }
    if (updatedData.photos) {
      try {
        updatedData.photos = JSON.parse(updatedData.photos);
      } catch (e) {
        updatedData.photos = null;
      }
    }
    if (updatedData.signatures) {
      try {
        updatedData.signatures = JSON.parse(updatedData.signatures);
      } catch (e) {
        updatedData.signatures = null;
      }
    }
    if (updatedData.biometrics) {
      try {
        updatedData.biometrics = JSON.parse(updatedData.biometrics);
      } catch (e) {
        updatedData.biometrics = null;
      }
    }
    
    respond(res, 200, "Member updated", updatedData);
  } catch (err) {
    respond(res, 500, err.message);
  }
});

// Approve member
router.put("/:id/approve", validateToken, logUpdateOperation("Member"), async (req, res) => {
  try {
    const data = req.body || {};
    const username = req.user?.username || null;
    
    // Check if member exists and is not deleted
    const member = await Members.findByPk(req.params.id);
    if (!member || member.isDeleted) {
      return respond(res, 404, "Member not found");
    }
    
    // Check if member is in pending status
    if (member.status !== "Pending") {
      return respond(res, 400, `Member is already ${member.status}. Cannot approve.`);
    }
    
    const updatePayload = {
      status: "Approved",
      verifierRemarks: data.verifierRemarks || null,
      approvedBy: username,
      approvedOn: new Date(),
      modifiedOn: new Date(),
      modifiedBy: username,
    };
    
    const [count] = await Members.update(updatePayload, { 
      where: { id: req.params.id, isDeleted: 0 } 
    });
    
    if (!count) {
      return respond(res, 404, "Member not found");
    }
    
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
    
    respond(res, 200, "Member approved successfully", updatedData);
  } catch (err) {
    console.error("Error approving member:", err);
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
module.exports.generateMemberNumber = generateMemberNumber;


