'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
    // Check if columns already exist before adding them
    const tableDescription = await queryInterface.describeTable('Transactions');
    
    if (!tableDescription.type) {
      await queryInterface.addColumn('Transactions', 'type', {
      type: Sequelize.ENUM('DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'OTHER'),
      allowNull: true,
      comment: 'Transaction type: DEPOSIT, WITHDRAWAL, TRANSFER, or OTHER'
    });
    } else {
      console.log('Column type already exists in Transactions table - skipping');
    }
    
    if (!tableDescription.narration) {
      await queryInterface.addColumn('Transactions', 'narration', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Transaction narration/description'
    });
    } else {
      console.log('Column narration already exists in Transactions table - skipping');
    }
    
  },

    down: async (queryInterface, Sequelize) => {
    // Check if columns exist before removing them
    const tableDescription = await queryInterface.describeTable('Transactions');
    
    if (tableDescription.type) {
      await queryInterface.removeColumn('Transactions', 'type');
    } else {
      console.log('Column type does not exist in Transactions table - skipping');
    }
    
    if (tableDescription.narration) {
      await queryInterface.removeColumn('Transactions', 'narration');
    } else {
      console.log('Column narration does not exist in Transactions table - skipping');
    }
    
  }
};
