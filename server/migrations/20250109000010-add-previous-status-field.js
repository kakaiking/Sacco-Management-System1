'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
    // Check if columns already exist before adding them
    const tableDescription = await queryInterface.describeTable('Users');
    
    if (!tableDescription.previousStatus) {
      await queryInterface.addColumn('Users', 'previousStatus', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Status before user was locked'
    });
    } else {
      console.log('Column previousStatus already exists in Users table - skipping');
    }
    
  },

    down: async (queryInterface, Sequelize) => {
    // Check if columns exist before removing them
    const tableDescription = await queryInterface.describeTable('Users');
    
    if (tableDescription.previousStatus) {
      await queryInterface.removeColumn('Users', 'previousStatus');
    } else {
      console.log('Column previousStatus does not exist in Users table - skipping');
    }
    
  }
};
