'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
    // Check if columns already exist before adding them
    const tableDescription = await queryInterface.describeTable('LoanApplications');
    
    if (!tableDescription.collateralId) {
      await queryInterface.addColumn('LoanApplications', 'collateralId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Collateral',
        key: 'id'
      });
    } else {
      console.log('Column collateralId already exists in LoanApplications table - skipping');
    }
    
  },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

    down: async (queryInterface, Sequelize) => {
    // Check if columns exist before removing them
    const tableDescription = await queryInterface.describeTable('LoanApplications');
    
    if (tableDescription.collateralId) {
      await queryInterface.removeColumn('LoanApplications', 'collateralId');
    } else {
      console.log('Column collateralId does not exist in LoanApplications table - skipping');
    }
    
  }
};


