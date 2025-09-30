'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
    // Check if columns already exist before adding them
    const tableDescription = await queryInterface.describeTable('Products');
    
    if (!tableDescription.currency) {
      await queryInterface.addColumn('Products', 'currency', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'KES'
    });
    } else {
      console.log('Column currency already exists in Products table - skipping');
    }
    
    if (!tableDescription.isCreditInterest) {
      await queryInterface.addColumn('Products', 'isCreditInterest', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    } else {
      console.log('Column isCreditInterest already exists in Products table - skipping');
    }
    
    if (!tableDescription.isDebitInterest) {
      await queryInterface.addColumn('Products', 'isDebitInterest', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    } else {
      console.log('Column isDebitInterest already exists in Products table - skipping');
    }
    
    if (!tableDescription.interestType) {
      await queryInterface.addColumn('Products', 'interestType', {
      type: Sequelize.STRING,
      allowNull: true
    });
    } else {
      console.log('Column interestType already exists in Products table - skipping');
    }
    
    if (!tableDescription.interestCalculationRule) {
      await queryInterface.addColumn('Products', 'interestCalculationRule', {
      type: Sequelize.STRING,
      allowNull: true
    });
    } else {
      console.log('Column interestCalculationRule already exists in Products table - skipping');
    }
    
    if (!tableDescription.interestFrequency) {
      await queryInterface.addColumn('Products', 'interestFrequency', {
      type: Sequelize.STRING,
      allowNull: true
    });
    } else {
      console.log('Column interestFrequency already exists in Products table - skipping');
    }
    
    if (!tableDescription.appliedOnMemberOnboarding) {
      await queryInterface.addColumn('Products', 'appliedOnMemberOnboarding', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    } else {
      console.log('Column appliedOnMemberOnboarding already exists in Products table - skipping');
    }
    
    if (!tableDescription.interestRate) {
      await queryInterface.addColumn('Products', 'interestRate', {
      type: Sequelize.DECIMAL(10, 4),
      allowNull: true
    });
    } else {
      console.log('Column interestRate already exists in Products table - skipping');
    }
    
    if (!tableDescription.chargeIds) {
      await queryInterface.addColumn('Products', 'chargeIds', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    } else {
      console.log('Column chargeIds already exists in Products table - skipping');
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
      allowNull: true
    });
    } else {
      console.log('Column maxGuarantors already exists in Products table - skipping');
    }
    
    if (!tableDescription.minGuarantors) {
      await queryInterface.addColumn('Products', 'minGuarantors', {
      type: Sequelize.INTEGER,
      allowNull: true
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
      allowNull: true
    });
    } else {
      console.log('Column maxSpecialUsers already exists in Products table - skipping');
    }
    
    if (!tableDescription.isWithdrawable) {
      await queryInterface.addColumn('Products', 'isWithdrawable', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });
    } else {
      console.log('Column isWithdrawable already exists in Products table - skipping');
    }
    
    if (!tableDescription.withdrawableFrom) {
      await queryInterface.addColumn('Products', 'withdrawableFrom', {
      type: Sequelize.DATEONLY,
      allowNull: true
    });
    } else {
      console.log('Column withdrawableFrom already exists in Products table - skipping');
    }
    
  },

    down: async (queryInterface, Sequelize) => {
    // Check if columns exist before removing them
    const tableDescription = await queryInterface.describeTable('Products');
    
  });
    
    await queryInterface.addColumn('Products', 'isCreditInterest', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    
    await queryInterface.addColumn('Products', 'isDebitInterest', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    
    await queryInterface.addColumn('Products', 'interestType', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('Products', 'interestCalculationRule', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('Products', 'interestFrequency', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('Products', 'appliedOnMemberOnboarding', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    
    await queryInterface.addColumn('Products', 'interestRate', {
      type: Sequelize.DECIMAL(10, 4),
      allowNull: true
    });
    
    await queryInterface.addColumn('Products', 'chargeIds', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    
    await queryInterface.addColumn('Products', 'needGuarantors', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    
    await queryInterface.addColumn('Products', 'maxGuarantors', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
    
    await queryInterface.addColumn('Products', 'minGuarantors', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
    
    await queryInterface.addColumn('Products', 'isSpecial', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    
    await queryInterface.addColumn('Products', 'maxSpecialUsers', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
    
    await queryInterface.addColumn('Products', 'isWithdrawable', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });
    
    await queryInterface.addColumn('Products', 'withdrawableFrom', {
      type: Sequelize.DATEONLY,
      allowNull: true
    });
  }
};

