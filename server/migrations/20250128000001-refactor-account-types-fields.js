'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
    // Check if columns already exist before adding them
    const tableDescription = await queryInterface.describeTable('Products');
    
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
          allowNull: true
        });
    } else {
      console.log('Column maxSpecialUsers already exists in Products table - skipping');
    }
    
    if (!tableDescription.needGuarantors) {
      await queryInterface.addColumn('LoanProducts', 'needGuarantors', {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        });
    } else {
      console.log('Column needGuarantors already exists in LoanProducts table - skipping');
    }
    
    if (!tableDescription.maxGuarantors) {
      await queryInterface.addColumn('LoanProducts', 'maxGuarantors', {
          type: Sequelize.INTEGER,
          allowNull: true
        });
    } else {
      console.log('Column maxGuarantors already exists in LoanProducts table - skipping');
    }
    
    if (!tableDescription.minGuarantors) {
      await queryInterface.addColumn('LoanProducts', 'minGuarantors', {
          type: Sequelize.INTEGER,
          allowNull: true
        });
    } else {
      console.log('Column minGuarantors already exists in LoanProducts table - skipping');
    }
    
    if (!tableDescription.isCreditInterest) {
      await queryInterface.addColumn('AccountTypes', 'isCreditInterest', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    } else {
      console.log('Column isCreditInterest already exists in AccountTypes table - skipping');
    }
    
    if (!tableDescription.isDebitInterest) {
      await queryInterface.addColumn('AccountTypes', 'isDebitInterest', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    } else {
      console.log('Column isDebitInterest already exists in AccountTypes table - skipping');
    }
    
    if (!tableDescription.needGuarantors) {
      await queryInterface.addColumn('AccountTypes', 'needGuarantors', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    } else {
      console.log('Column needGuarantors already exists in AccountTypes table - skipping');
    }
    
    if (!tableDescription.maxGuarantors) {
      await queryInterface.addColumn('AccountTypes', 'maxGuarantors', {
        type: Sequelize.INTEGER,
        allowNull: true
      });
    } else {
      console.log('Column maxGuarantors already exists in AccountTypes table - skipping');
    }
    
    if (!tableDescription.minGuarantors) {
      await queryInterface.addColumn('AccountTypes', 'minGuarantors', {
        type: Sequelize.INTEGER,
        allowNull: true
      });
    } else {
      console.log('Column minGuarantors already exists in AccountTypes table - skipping');
    }
    
    if (!tableDescription.isSpecial) {
      await queryInterface.addColumn('AccountTypes', 'isSpecial', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    } else {
      console.log('Column isSpecial already exists in AccountTypes table - skipping');
    }
    
    if (!tableDescription.maxSpecialUsers) {
      await queryInterface.addColumn('AccountTypes', 'maxSpecialUsers', {
        type: Sequelize.INTEGER,
        allowNull: true
      });
    } else {
      console.log('Column maxSpecialUsers already exists in AccountTypes table - skipping');
    }
    
  },

    down: async (queryInterface, Sequelize) => {
    // Check if columns exist before removing them
    const tableDescription = await queryInterface.describeTable('Products');
    
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
    
    if (tableDescription.needGuarantors) {
      await queryInterface.removeColumn('LoanProducts', 'needGuarantors');
    } else {
      console.log('Column needGuarantors does not exist in LoanProducts table - skipping');
    }
    
    if (tableDescription.maxGuarantors) {
      await queryInterface.removeColumn('LoanProducts', 'maxGuarantors');
    } else {
      console.log('Column maxGuarantors does not exist in LoanProducts table - skipping');
    }
    
    if (tableDescription.minGuarantors) {
      await queryInterface.removeColumn('LoanProducts', 'minGuarantors');
    } else {
      console.log('Column minGuarantors does not exist in LoanProducts table - skipping');
    }
    
  });
      
      await queryInterface.addColumn('AccountTypes', 'isDebitInterest', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
      
      await queryInterface.addColumn('AccountTypes', 'needGuarantors', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
      
      await queryInterface.addColumn('AccountTypes', 'maxGuarantors', {
        type: Sequelize.INTEGER,
        allowNull: true
      });
      
      await queryInterface.addColumn('AccountTypes', 'minGuarantors', {
        type: Sequelize.INTEGER,
        allowNull: true
      });
      
      await queryInterface.addColumn('AccountTypes', 'isSpecial', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
      
      await queryInterface.addColumn('AccountTypes', 'maxSpecialUsers', {
        type: Sequelize.INTEGER,
        allowNull: true
      });
      
      // Remove fields from Products table
      await queryInterface.removeColumn('Products', 'isSpecial');
      await queryInterface.removeColumn('Products', 'maxSpecialUsers');
      
      // Remove fields from LoanProducts table
      await queryInterface.removeColumn('LoanProducts', 'needGuarantors');
      await queryInterface.removeColumn('LoanProducts', 'maxGuarantors');
      await queryInterface.removeColumn('LoanProducts', 'minGuarantors');
      
      console.log('✅ Rollback completed successfully');
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
};
