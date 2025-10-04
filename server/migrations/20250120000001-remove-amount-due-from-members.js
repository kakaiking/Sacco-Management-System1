'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove amountDue column if it exists
    const tableDescription = await queryInterface.describeTable('Members');
    
    if (tableDescription.amountDue) {
      await queryInterface.removeColumn('Members', 'amountDue');
      console.log('Column amountDue removed from Members table');
    } else {
      console.log('Column amountDue does not exist in Members table - skipping removal');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Re-add amountDue column if it doesn't exist
    const tableDescription = await queryInterface.describeTable('Members');
    
    if (!tableDescription.amountDue) {
      await queryInterface.addColumn('Members', 'amountDue', {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.00,
        comment: 'Total amount due from member based on product charges'
      });
      console.log('Column amountDue re-added to Members table');
    } else {
      console.log('Column amountDue already exists in Members table - skipping');
    }
  }
};





