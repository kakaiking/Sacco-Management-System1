'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove accountTypeId column if it exists
    const tableDescription = await queryInterface.describeTable('Accounts');
    
    if (tableDescription.accountTypeId) {
      await queryInterface.removeColumn('Accounts', 'accountTypeId');
      console.log('Column accountTypeId removed from Accounts table');
    } else {
      console.log('Column accountTypeId does not exist in Accounts table - skipping removal');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Re-add accountTypeId column if it doesn't exist
    const tableDescription = await queryInterface.describeTable('Accounts');
    
    if (!tableDescription.accountTypeId) {
      await queryInterface.addColumn('Accounts', 'accountTypeId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'AccountTypes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
      console.log('Column accountTypeId re-added to Accounts table');
    } else {
      console.log('Column accountTypeId already exists in Accounts table - skipping');
    }
  }
};
