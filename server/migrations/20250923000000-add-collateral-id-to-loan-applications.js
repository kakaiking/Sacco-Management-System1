'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('LoanApplications', 'collateralId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Collateral',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('LoanApplications', 'collateralId');
  }
};


