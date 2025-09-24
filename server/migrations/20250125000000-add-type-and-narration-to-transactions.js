'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add transaction type field for deposit/withdrawal classification
    await queryInterface.addColumn('Transactions', 'type', {
      type: Sequelize.ENUM('DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'OTHER'),
      allowNull: true,
      comment: 'Transaction type: DEPOSIT, WITHDRAWAL, TRANSFER, or OTHER'
    });

    // Add narration field for transaction description
    await queryInterface.addColumn('Transactions', 'narration', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Transaction narration/description'
    });

    // Add index for transaction type for better query performance
    await queryInterface.addIndex('Transactions', ['type']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the added columns
    await queryInterface.removeColumn('Transactions', 'type');
    await queryInterface.removeColumn('Transactions', 'narration');
  }
};
