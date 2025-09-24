'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Make the old columns nullable to avoid NOT NULL constraint errors
    try {
      await queryInterface.changeColumn('Transactions', 'debitAccountId', {
        type: Sequelize.INTEGER,
        allowNull: true
      });
      console.log('✅ Made debitAccountId nullable');
    } catch (error) {
      console.log('⚠️  Could not modify debitAccountId:', error.message);
    }
    
    try {
      await queryInterface.changeColumn('Transactions', 'creditAccountId', {
        type: Sequelize.INTEGER,
        allowNull: true
      });
      console.log('✅ Made creditAccountId nullable');
    } catch (error) {
      console.log('⚠️  Could not modify creditAccountId:', error.message);
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Revert the changes
    try {
      await queryInterface.changeColumn('Transactions', 'debitAccountId', {
        type: Sequelize.INTEGER,
        allowNull: false
      });
    } catch (error) {
      console.log('Could not revert debitAccountId:', error.message);
    }
    
    try {
      await queryInterface.changeColumn('Transactions', 'creditAccountId', {
        type: Sequelize.INTEGER,
        allowNull: false
      });
    } catch (error) {
      console.log('Could not revert creditAccountId:', error.message);
    }
  }
};
