'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
    // Check if columns already exist before adding them
    const tableDescription = await queryInterface.describeTable('LoanApplications');
    
    if (!tableDescription.productId) {
      await queryInterface.addColumn('LoanApplications', 'productId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'LoanProducts',
        key: 'id'
      });
    } else {
      console.log('Column productId already exists in LoanApplications table - skipping');
    }
    
  },

    down: async (queryInterface, Sequelize) => {
    // Check if columns exist before removing them
    const tableDescription = await queryInterface.describeTable('LoanApplications');
    
    if (tableDescription.productId) {
      await queryInterface.removeColumn('LoanApplications', 'productId');
    } else {
      console.log('Column productId does not exist in LoanApplications table - skipping');
    }
    
  }
};

