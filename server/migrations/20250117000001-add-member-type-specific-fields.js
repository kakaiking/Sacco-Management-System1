'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
    // Check if columns already exist before adding them
    const tableDescription = await queryInterface.describeTable('Members');
    
    if (!tableDescription.companyName) {
      await queryInterface.addColumn('Members', 'companyName', {
      type: Sequelize.STRING,
      allowNull: true
    });
    } else {
      console.log('Column companyName already exists in Members table - skipping');
    }
    
    if (!tableDescription.registrationNumber) {
      await queryInterface.addColumn('Members', 'registrationNumber', {
      type: Sequelize.STRING,
      allowNull: true
    });
    } else {
      console.log('Column registrationNumber already exists in Members table - skipping');
    }
    
    if (!tableDescription.companyKraPin) {
      await queryInterface.addColumn('Members', 'companyKraPin', {
      type: Sequelize.STRING,
      allowNull: true
    });
    } else {
      console.log('Column companyKraPin already exists in Members table - skipping');
    }
    
    if (!tableDescription.businessType) {
      await queryInterface.addColumn('Members', 'businessType', {
      type: Sequelize.STRING,
      allowNull: true
    });
    } else {
      console.log('Column businessType already exists in Members table - skipping');
    }
    
    if (!tableDescription.businessAddress) {
      await queryInterface.addColumn('Members', 'businessAddress', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    } else {
      console.log('Column businessAddress already exists in Members table - skipping');
    }
    
    if (!tableDescription.jointMembers) {
      await queryInterface.addColumn('Members', 'jointMembers', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    } else {
      console.log('Column jointMembers already exists in Members table - skipping');
    }
    
    if (!tableDescription.guardianName) {
      await queryInterface.addColumn('Members', 'guardianName', {
      type: Sequelize.STRING,
      allowNull: true
    });
    } else {
      console.log('Column guardianName already exists in Members table - skipping');
    }
    
    if (!tableDescription.guardianIdNumber) {
      await queryInterface.addColumn('Members', 'guardianIdNumber', {
      type: Sequelize.STRING,
      allowNull: true
    });
    } else {
      console.log('Column guardianIdNumber already exists in Members table - skipping');
    }
    
    if (!tableDescription.guardianKraPin) {
      await queryInterface.addColumn('Members', 'guardianKraPin', {
      type: Sequelize.STRING,
      allowNull: true
    });
    } else {
      console.log('Column guardianKraPin already exists in Members table - skipping');
    }
    
    if (!tableDescription.guardianPhone) {
      await queryInterface.addColumn('Members', 'guardianPhone', {
      type: Sequelize.STRING,
      allowNull: true
    });
    } else {
      console.log('Column guardianPhone already exists in Members table - skipping');
    }
    
    if (!tableDescription.guardianEmail) {
      await queryInterface.addColumn('Members', 'guardianEmail', {
      type: Sequelize.STRING,
      allowNull: true
    });
    } else {
      console.log('Column guardianEmail already exists in Members table - skipping');
    }
    
    if (!tableDescription.guardianAddress) {
      await queryInterface.addColumn('Members', 'guardianAddress', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    } else {
      console.log('Column guardianAddress already exists in Members table - skipping');
    }
    
    if (!tableDescription.guardianRelationship) {
      await queryInterface.addColumn('Members', 'guardianRelationship', {
      type: Sequelize.STRING,
      allowNull: true
    });
    } else {
      console.log('Column guardianRelationship already exists in Members table - skipping');
    }
    
    if (!tableDescription.chamaName) {
      await queryInterface.addColumn('Members', 'chamaName', {
      type: Sequelize.STRING,
      allowNull: true
    });
    } else {
      console.log('Column chamaName already exists in Members table - skipping');
    }
    
    if (!tableDescription.chamaRegistrationNumber) {
      await queryInterface.addColumn('Members', 'chamaRegistrationNumber', {
      type: Sequelize.STRING,
      allowNull: true
    });
    } else {
      console.log('Column chamaRegistrationNumber already exists in Members table - skipping');
    }
    
    if (!tableDescription.chamaMembers) {
      await queryInterface.addColumn('Members', 'chamaMembers', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    } else {
      console.log('Column chamaMembers already exists in Members table - skipping');
    }
    
    if (!tableDescription.chamaConstitution) {
      await queryInterface.addColumn('Members', 'chamaConstitution', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    } else {
      console.log('Column chamaConstitution already exists in Members table - skipping');
    }
    
    if (!tableDescription.authorizedSignatories) {
      await queryInterface.addColumn('Members', 'authorizedSignatories', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    } else {
      console.log('Column authorizedSignatories already exists in Members table - skipping');
    }
    
  },

    down: async (queryInterface, Sequelize) => {
    // Check if columns exist before removing them
    const tableDescription = await queryInterface.describeTable('Members');
    
    if (tableDescription.companyName) {
      await queryInterface.removeColumn('Members', 'companyName');
    } else {
      console.log('Column companyName does not exist in Members table - skipping');
    }
    
    if (tableDescription.registrationNumber) {
      await queryInterface.removeColumn('Members', 'registrationNumber');
    } else {
      console.log('Column registrationNumber does not exist in Members table - skipping');
    }
    
    if (tableDescription.companyKraPin) {
      await queryInterface.removeColumn('Members', 'companyKraPin');
    } else {
      console.log('Column companyKraPin does not exist in Members table - skipping');
    }
    
    if (tableDescription.businessType) {
      await queryInterface.removeColumn('Members', 'businessType');
    } else {
      console.log('Column businessType does not exist in Members table - skipping');
    }
    
    if (tableDescription.businessAddress) {
      await queryInterface.removeColumn('Members', 'businessAddress');
    } else {
      console.log('Column businessAddress does not exist in Members table - skipping');
    }
    
    if (tableDescription.jointMembers) {
      await queryInterface.removeColumn('Members', 'jointMembers');
    } else {
      console.log('Column jointMembers does not exist in Members table - skipping');
    }
    
    if (tableDescription.guardianName) {
      await queryInterface.removeColumn('Members', 'guardianName');
    } else {
      console.log('Column guardianName does not exist in Members table - skipping');
    }
    
    if (tableDescription.guardianIdNumber) {
      await queryInterface.removeColumn('Members', 'guardianIdNumber');
    } else {
      console.log('Column guardianIdNumber does not exist in Members table - skipping');
    }
    
    if (tableDescription.guardianKraPin) {
      await queryInterface.removeColumn('Members', 'guardianKraPin');
    } else {
      console.log('Column guardianKraPin does not exist in Members table - skipping');
    }
    
    if (tableDescription.guardianPhone) {
      await queryInterface.removeColumn('Members', 'guardianPhone');
    } else {
      console.log('Column guardianPhone does not exist in Members table - skipping');
    }
    
    if (tableDescription.guardianEmail) {
      await queryInterface.removeColumn('Members', 'guardianEmail');
    } else {
      console.log('Column guardianEmail does not exist in Members table - skipping');
    }
    
    if (tableDescription.guardianAddress) {
      await queryInterface.removeColumn('Members', 'guardianAddress');
    } else {
      console.log('Column guardianAddress does not exist in Members table - skipping');
    }
    
    if (tableDescription.guardianRelationship) {
      await queryInterface.removeColumn('Members', 'guardianRelationship');
    } else {
      console.log('Column guardianRelationship does not exist in Members table - skipping');
    }
    
    if (tableDescription.chamaName) {
      await queryInterface.removeColumn('Members', 'chamaName');
    } else {
      console.log('Column chamaName does not exist in Members table - skipping');
    }
    
    if (tableDescription.chamaRegistrationNumber) {
      await queryInterface.removeColumn('Members', 'chamaRegistrationNumber');
    } else {
      console.log('Column chamaRegistrationNumber does not exist in Members table - skipping');
    }
    
    if (tableDescription.chamaMembers) {
      await queryInterface.removeColumn('Members', 'chamaMembers');
    } else {
      console.log('Column chamaMembers does not exist in Members table - skipping');
    }
    
    if (tableDescription.chamaConstitution) {
      await queryInterface.removeColumn('Members', 'chamaConstitution');
    } else {
      console.log('Column chamaConstitution does not exist in Members table - skipping');
    }
    
    if (tableDescription.authorizedSignatories) {
      await queryInterface.removeColumn('Members', 'authorizedSignatories');
    } else {
      console.log('Column authorizedSignatories does not exist in Members table - skipping');
    }
    
  }
};


