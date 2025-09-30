'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if columns already exist before adding them
    const tableDescription = await queryInterface.describeTable('Products');
    
    if (!tableDescription.saccoId) {
      await queryInterface.addColumn('Products', 'saccoId', {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'Saccos',
          key: 'saccoId'
        }
      });
    } else {
      console.log('Column saccoId already exists in Products table - skipping');
    }
    
    if (!tableDescription.chargeIds) {
      await queryInterface.addColumn('Products', 'chargeIds', {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON array of charge IDs'
      });
    } else {
      console.log('Column chargeIds already exists in Products table - skipping');
    }
    
    if (!tableDescription.interestRate) {
      await queryInterface.addColumn('Products', 'interestRate', {
        type: Sequelize.DECIMAL(10, 4),
        allowNull: true,
        comment: 'Interest rate as decimal (e.g., 0.12 for 12%)'
      });
    } else {
      console.log('Column interestRate already exists in Products table - skipping');
    }
    
    if (!tableDescription.needGuarantors) {
      await queryInterface.addColumn('Products', 'needGuarantors', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    } else {
      console.log('Column needGuarantors already exists in Products table - skipping');
    }
    
    if (!tableDescription.maxGuarantors) {
      await queryInterface.addColumn('Products', 'maxGuarantors', {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Maximum number of guarantors required'
      });
    } else {
      console.log('Column maxGuarantors already exists in Products table - skipping');
    }
    
    if (!tableDescription.minGuarantors) {
      await queryInterface.addColumn('Products', 'minGuarantors', {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Minimum number of guarantors required'
      });
    } else {
      console.log('Column minGuarantors already exists in Products table - skipping');
    }
    
    if (!tableDescription.isSpecial) {
      await queryInterface.addColumn('Products', 'isSpecial', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    } else {
      console.log('Column isSpecial already exists in Products table - skipping');
    }
    
    if (!tableDescription.maxSpecialUsers) {
      await queryInterface.addColumn('Products', 'maxSpecialUsers', {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Maximum number of special users allowed'
      });
    } else {
      console.log('Column maxSpecialUsers already exists in Products table - skipping');
    }
    
    if (!tableDescription.onMemberOnboarding) {
      await queryInterface.addColumn('Products', 'onMemberOnboarding', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether this product is available during member onboarding'
      });
    } else {
      console.log('Column onMemberOnboarding already exists in Products table - skipping');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Check if columns exist before removing them
    const tableDescription = await queryInterface.describeTable('Products');
    
    if (tableDescription.saccoId) {
      await queryInterface.removeColumn('Products', 'saccoId');
    } else {
      console.log('Column saccoId does not exist in Products table - skipping');
    }
    
    if (tableDescription.chargeIds) {
      await queryInterface.removeColumn('Products', 'chargeIds');
    } else {
      console.log('Column chargeIds does not exist in Products table - skipping');
    }
    
    if (tableDescription.interestRate) {
      await queryInterface.removeColumn('Products', 'interestRate');
    } else {
      console.log('Column interestRate does not exist in Products table - skipping');
    }
    
    if (tableDescription.needGuarantors) {
      await queryInterface.removeColumn('Products', 'needGuarantors');
    } else {
      console.log('Column needGuarantors does not exist in Products table - skipping');
    }
    
    if (tableDescription.maxGuarantors) {
      await queryInterface.removeColumn('Products', 'maxGuarantors');
    } else {
      console.log('Column maxGuarantors does not exist in Products table - skipping');
    }
    
    if (tableDescription.minGuarantors) {
      await queryInterface.removeColumn('Products', 'minGuarantors');
    } else {
      console.log('Column minGuarantors does not exist in Products table - skipping');
    }
    
    if (tableDescription.isSpecial) {
      await queryInterface.removeColumn('Products', 'isSpecial');
    } else {
      console.log('Column isSpecial does not exist in Products table - skipping');
    }
    
    if (tableDescription.maxSpecialUsers) {
      await queryInterface.removeColumn('Products', 'maxSpecialUsers');
    } else {
      console.log('Column maxSpecialUsers does not exist in Products table - skipping');
    }
    
    if (tableDescription.onMemberOnboarding) {
      await queryInterface.removeColumn('Products', 'onMemberOnboarding');
    } else {
      console.log('Column onMemberOnboarding does not exist in Products table - skipping');
    }
  }
};
