'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Alter the dateOfBirth column to allow NULL values
      await queryInterface.changeColumn('Members', 'dateOfBirth', {
        type: Sequelize.DATEONLY,
        allowNull: true
      });
      
      console.log('✅ Successfully updated dateOfBirth column to allow NULL values');
    } catch (error) {
      console.error('❌ Error updating dateOfBirth column:', error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Revert the dateOfBirth column to NOT NULL
      await queryInterface.changeColumn('Members', 'dateOfBirth', {
        type: Sequelize.DATEONLY,
        allowNull: false
      });
      
      console.log('✅ Successfully reverted dateOfBirth column to NOT NULL');
    } catch (error) {
      console.error('❌ Error reverting dateOfBirth column:', error.message);
      throw error;
    }
  }
};
