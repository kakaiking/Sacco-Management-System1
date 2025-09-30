'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
    // Check if columns already exist before adding them
    const tableDescription = await queryInterface.describeTable('Members');
    
    if (!tableDescription.amountDue) {
      await queryInterface.addColumn('Members', 'amountDue', {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: 'Total amount due from member based on product charges'
    });
    } else {
      console.log('Column amountDue already exists in Members table - skipping');
    }
    
  },

    down: async (queryInterface, Sequelize) => {
    // Check if columns exist before removing them
    const tableDescription = await queryInterface.describeTable('Members');
    
    if (tableDescription.amountDue) {
      await queryInterface.removeColumn('Members', 'amountDue');
    } else {
      console.log('Column amountDue does not exist in Members table - skipping');
    }
    
  });
  }
};





