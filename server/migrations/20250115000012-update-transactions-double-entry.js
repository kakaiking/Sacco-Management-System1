'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, let's check if the table exists and what columns it has
    const tableDescription = await queryInterface.describeTable('Transactions');
    
    // If the new columns already exist, skip the migration
    if (tableDescription.accountId && tableDescription.entryType) {
      console.log('Migration already applied - skipping');
      return;
    }
    
    // Add new columns first (without foreign key constraints initially)
    await queryInterface.addColumn('Transactions', 'accountId', {
      type: Sequelize.INTEGER,
      allowNull: true // Allow null initially to avoid issues with existing data
    });
    
    await queryInterface.addColumn('Transactions', 'entryType', {
      type: Sequelize.ENUM('DEBIT', 'CREDIT'),
      allowNull: true // Allow null initially
    });
    
    // Remove the unique constraint on transactionId to allow multiple entries
    try {
      await queryInterface.removeConstraint('Transactions', 'Transactions_transactionId_key');
    } catch (error) {
      console.log('Unique constraint may not exist or already removed');
    }
    
    // Add indexes for better performance
    await queryInterface.addIndex('Transactions', ['transactionId']);
    await queryInterface.addIndex('Transactions', ['accountId']);
    await queryInterface.addIndex('Transactions', ['entryType']);
    
    // Add foreign key constraint for accountId
    await queryInterface.addConstraint('Transactions', {
      fields: ['accountId'],
      type: 'foreign key',
      name: 'Transactions_accountId_fkey',
      references: {
        table: 'Accounts',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    
    // Note: We're not dropping the old columns (debitAccountId, creditAccountId) 
    // to preserve existing data. You can manually clean them up later if needed.
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes
    try {
      await queryInterface.removeIndex('Transactions', ['transactionId']);
    } catch (error) {
      console.log('Index may not exist');
    }
    
    try {
      await queryInterface.removeIndex('Transactions', ['accountId']);
    } catch (error) {
      console.log('Index may not exist');
    }
    
    try {
      await queryInterface.removeIndex('Transactions', ['entryType']);
    } catch (error) {
      console.log('Index may not exist');
    }
    
    // Remove foreign key constraint
    try {
      await queryInterface.removeConstraint('Transactions', 'Transactions_accountId_fkey');
    } catch (error) {
      console.log('Foreign key constraint may not exist');
    }
    
    // Remove new columns
    try {
      await queryInterface.removeColumn('Transactions', 'accountId');
    } catch (error) {
      console.log('Column may not exist');
    }
    
    try {
      await queryInterface.removeColumn('Transactions', 'entryType');
    } catch (error) {
      console.log('Column may not exist');
    }
    
    // Add back unique constraint on transactionId
    try {
      await queryInterface.addConstraint('Transactions', {
        fields: ['transactionId'],
        type: 'unique',
        name: 'Transactions_transactionId_key'
      });
    } catch (error) {
      console.log('Could not add back unique constraint');
    }
  }
};
