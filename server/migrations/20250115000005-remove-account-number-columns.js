'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Check if accountNumber column exists in Accounts table before removing
      const accountsTableDescription = await queryInterface.describeTable('Accounts');
      if (accountsTableDescription.accountNumber) {
        await queryInterface.removeColumn('Accounts', 'accountNumber');
        console.log('Removed accountNumber column from Accounts table');
      } else {
        console.log('accountNumber column does not exist in Accounts table');
      }
    } catch (error) {
      console.log('Error removing accountNumber from Accounts:', error.message);
    }
    
    try {
      // Check if accountNumber column exists in GLAccounts table before removing
      const glAccountsTableDescription = await queryInterface.describeTable('GLAccounts');
      if (glAccountsTableDescription.accountNumber) {
        await queryInterface.removeColumn('GLAccounts', 'accountNumber');
        console.log('Removed accountNumber column from GLAccounts table');
      } else {
        console.log('accountNumber column does not exist in GLAccounts table');
      }
    } catch (error) {
      console.log('Error removing accountNumber from GLAccounts:', error.message);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Add back accountNumber column to Accounts table
      await queryInterface.addColumn('Accounts', 'accountNumber', {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      });
      console.log('Added accountNumber column back to Accounts table');
    } catch (error) {
      console.log('Error adding accountNumber to Accounts:', error.message);
    }
    
    try {
      // Add back accountNumber column to GLAccounts table
      await queryInterface.addColumn('GLAccounts', 'accountNumber', {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      });
      console.log('Added accountNumber column back to GLAccounts table');
    } catch (error) {
      console.log('Error adding accountNumber to GLAccounts:', error.message);
    }
  }
};
