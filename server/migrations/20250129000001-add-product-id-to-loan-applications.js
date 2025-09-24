'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('LoanApplications', 'productId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'LoanProducts',
        key: 'id'
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('LoanApplications', 'productId');
  }
};

