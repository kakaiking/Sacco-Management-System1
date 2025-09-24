'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove account-related columns from Products table
    const columnsToRemove = [
      'currency',
      'isCreditInterest',
      'isDebitInterest',
      'interestType',
      'interestCalculationRule',
      'interestFrequency',
      'appliedOnMemberOnboarding',
      'interestRate',
      'chargeIds',
      'needGuarantors',
      'maxGuarantors',
      'minGuarantors',
      'isSpecial',
      'maxSpecialUsers',
      'isWithdrawable',
      'withdrawableFrom'
    ];

    for (const column of columnsToRemove) {
      try {
        await queryInterface.removeColumn('Products', column);
        console.log(`Removed column ${column} from Products table`);
      } catch (error) {
        console.log(`Column ${column} may not exist or already removed:`, error.message);
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Add back the removed columns (for rollback)
    await queryInterface.addColumn('Products', 'currency', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'KES'
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

