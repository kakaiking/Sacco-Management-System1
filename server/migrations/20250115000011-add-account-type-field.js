'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
    // Check if columns already exist before adding them
    const tableDescription = await queryInterface.describeTable('Accounts');
    
    if (!tableDescription.accountType) {
      await queryInterface.addColumn('Accounts', 'accountType', {
      type: Sequelize.ENUM('MEMBER', 'GL'),
      allowNull: false,
      defaultValue: 'MEMBER'
    });
    } else {
      console.log('Column accountType already exists in Accounts table - skipping');
    }
    
  },

    down: async (queryInterface, Sequelize) => {
    // Check if columns exist before removing them
    const tableDescription = await queryInterface.describeTable('Accounts');
    
    if (tableDescription.accountType) {
      await queryInterface.removeColumn('Accounts', 'accountType');
    } else {
      console.log('Column accountType does not exist in Accounts table - skipping');
    }
    
  }
};
