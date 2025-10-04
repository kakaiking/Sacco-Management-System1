'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove the foreign key constraint on accountId
    // This is needed because accountId can reference either Accounts or GLAccounts
    // (polymorphic relationship) which MySQL doesn't support with foreign keys
    await queryInterface.removeConstraint('Transactions', 'Transactions_accountId_fkey');
    
    console.log('Successfully removed accountId foreign key constraint from Transactions table');
  },

  down: async (queryInterface, Sequelize) => {
    // Re-add the foreign key constraint if rolling back
    // Note: This will only work if all accountId values reference valid Accounts
    await queryInterface.addConstraint('Transactions', {
      fields: ['accountId'],
      type: 'foreign key',
      name: 'Transactions_accountId_fkey',
      references: {
        table: 'Accounts',
        field: 'accountId'
      },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE'
    });
  }
};

