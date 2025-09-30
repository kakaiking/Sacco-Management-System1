'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if column already exists before adding it
    const tableDescription = await queryInterface.describeTable('Members');
    
    if (!tableDescription.nextOfKin) {
      await queryInterface.addColumn('Members', 'nextOfKin', {
        type: Sequelize.TEXT,
        allowNull: true
      });
    } else {
      console.log('Column nextOfKin already exists in Members table - skipping');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Check if column exists before removing it
    const tableDescription = await queryInterface.describeTable('Members');
    
    if (tableDescription.nextOfKin) {
      await queryInterface.removeColumn('Members', 'nextOfKin');
    } else {
      console.log('Column nextOfKin does not exist in Members table - skipping');
    }
  }
};
