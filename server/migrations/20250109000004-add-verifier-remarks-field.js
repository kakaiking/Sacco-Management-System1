'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if column already exists before adding it
    const tableDescription = await queryInterface.describeTable('Members');
    
    if (!tableDescription.verifierRemarks) {
      await queryInterface.addColumn('Members', 'verifierRemarks', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    } else {
      console.log('Column verifierRemarks already exists in Members table - skipping');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Check if column exists before removing it
    const tableDescription = await queryInterface.describeTable('Members');
    
    if (tableDescription.verifierRemarks) {
      await queryInterface.removeColumn('Members', 'verifierRemarks');
    } else {
      console.log('Column verifierRemarks does not exist in Members table - skipping');
    }
  }
};
