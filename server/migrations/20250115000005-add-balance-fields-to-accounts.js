'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Accounts', 'clearBalance', {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00
    });

    await queryInterface.addColumn('Accounts', 'debitBalance', {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00
    });

    await queryInterface.addColumn('Accounts', 'creditBalance', {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00
    });

    // Update existing records to set clearBalance = availableBalance
    await queryInterface.sequelize.query(`
      UPDATE Accounts 
      SET clearBalance = availableBalance 
      WHERE clearBalance = 0.00
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Accounts', 'clearBalance');
    await queryInterface.removeColumn('Accounts', 'debitBalance');
    await queryInterface.removeColumn('Accounts', 'creditBalance');
  }
};
