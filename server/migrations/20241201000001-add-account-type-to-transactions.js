'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if the column already exists
    const tableDescription = await queryInterface.describeTable('Transactions');
    
    if (!tableDescription.accountType) {
      await queryInterface.addColumn('Transactions', 'accountType', {
        type: Sequelize.ENUM('MEMBER', 'GL'),
        allowNull: false,
        defaultValue: 'MEMBER'
      });
    } else {
      console.log('Column accountType already exists in Transactions table - skipping');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Check if the column exists before trying to remove it
    const tableDescription = await queryInterface.describeTable('Transactions');
    
    if (tableDescription.accountType) {
      await queryInterface.removeColumn('Transactions', 'accountType');
    } else {
      console.log('Column accountType does not exist in Transactions table - skipping');
    }
  }
};
