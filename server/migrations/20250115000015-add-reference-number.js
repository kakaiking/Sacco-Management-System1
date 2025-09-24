'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, check if the column already exists
    const tableDescription = await queryInterface.describeTable('Transactions');
    
    // If the column already exists, skip the migration
    if (tableDescription.referenceNumber) {
      console.log('✅ referenceNumber column already exists - skipping migration');
      return;
    }
    
    // Add referenceNumber column first
    await queryInterface.addColumn('Transactions', 'referenceNumber', {
      type: Sequelize.STRING,
      allowNull: true // Allow null initially
    });
    
    // Add index for referenceNumber for better performance
    await queryInterface.addIndex('Transactions', ['referenceNumber']);
    
    console.log('✅ Added referenceNumber column');
  },

  down: async (queryInterface, Sequelize) => {
    // Remove index
    try {
      await queryInterface.removeIndex('Transactions', ['referenceNumber']);
    } catch (error) {
      console.log('Index may not exist');
    }
    
    // Remove referenceNumber column
    await queryInterface.removeColumn('Transactions', 'referenceNumber');
  }
};
