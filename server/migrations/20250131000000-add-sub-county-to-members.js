'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
    // Check if columns already exist before adding them
    const tableDescription = await queryInterface.describeTable('Members');
    
    if (!tableDescription.subCounty) {
      await queryInterface.addColumn('Members', 'subCounty', {
      type: Sequelize.STRING,
      allowNull: true
    });
    } else {
      console.log('Column subCounty already exists in Members table - skipping');
    }
    
  },

    down: async (queryInterface, Sequelize) => {
    // Check if columns exist before removing them
    const tableDescription = await queryInterface.describeTable('Members');
    
    if (tableDescription.subCounty) {
      await queryInterface.removeColumn('Members', 'subCounty');
    } else {
      console.log('Column subCounty does not exist in Members table - skipping');
    }
    
  }
};

