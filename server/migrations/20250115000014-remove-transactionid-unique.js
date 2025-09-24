'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove the unique constraint on transactionId to allow multiple entries per transaction
    try {
      await queryInterface.removeConstraint('Transactions', 'UQ__Transact__9B57CF73BFDC2601');
      console.log('✅ Removed unique constraint on transactionId');
    } catch (error) {
      console.log('⚠️  Could not remove unique constraint:', error.message);
      // Try alternative constraint names
      try {
        await queryInterface.removeConstraint('Transactions', 'Transactions_transactionId_key');
        console.log('✅ Removed alternative unique constraint on transactionId');
      } catch (error2) {
        console.log('⚠️  Could not remove alternative constraint:', error2.message);
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Add back the unique constraint
    try {
      await queryInterface.addConstraint('Transactions', {
        fields: ['transactionId'],
        type: 'unique',
        name: 'Transactions_transactionId_key'
      });
    } catch (error) {
      console.log('Could not add back unique constraint:', error.message);
    }
  }
};
