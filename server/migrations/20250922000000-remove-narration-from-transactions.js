'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Remove the narration column from Transactions table
      await queryInterface.removeColumn('Transactions', 'narration');
      console.log('✅ Successfully removed narration column from Transactions table');
    } catch (error) {
      console.error('❌ Error removing narration column:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Add the narration column back if rollback is needed
      await queryInterface.addColumn('Transactions', 'narration', {
        type: Sequelize.TEXT,
        allowNull: true
      });
      console.log('✅ Successfully added narration column back to Transactions table');
    } catch (error) {
      console.error('❌ Error adding narration column back:', error);
      throw error;
    }
  }
};

