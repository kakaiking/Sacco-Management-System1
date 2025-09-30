'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
    // Check if columns already exist before adding them
    const tableDescription = await queryInterface.describeTable('Accounts');
    
    if (!tableDescription.remarks) {
      await queryInterface.addColumn('Accounts', 'remarks', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    } else {
      console.log('Column remarks already exists in Accounts table - skipping');
    }
    
  },

    down: async (queryInterface, Sequelize) => {
    // Check if columns exist before removing them
    const tableDescription = await queryInterface.describeTable('Accounts');
    
    if (tableDescription.remarks) {
      await queryInterface.removeColumn('Accounts', 'remarks');
    } else {
      console.log('Column remarks does not exist in Accounts table - skipping');
    }
    
  }
};
