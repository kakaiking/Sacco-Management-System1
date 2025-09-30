'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
    // Check if columns already exist before adding them
    const tableDescription = await queryInterface.describeTable('Users');
    
    if (!tableDescription.saccoId) {
      await queryInterface.addColumn('Users', 'saccoId', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'SYSTEM'
    });
    } else {
      console.log('Column saccoId already exists in Users table - skipping');
    }
    
  },

    down: async (queryInterface, Sequelize) => {
    // Check if columns exist before removing them
    const tableDescription = await queryInterface.describeTable('Users');
    
    if (tableDescription.saccoId) {
      await queryInterface.removeColumn('Users', 'saccoId');
    } else {
      console.log('Column saccoId does not exist in Users table - skipping');
    }
    
  }
};



