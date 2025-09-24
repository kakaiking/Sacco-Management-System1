'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('LoanApplications', 'disbursedBy', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('LoanApplications', 'disbursedOn', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('LoanApplications', 'disbursedBy');
    await queryInterface.removeColumn('LoanApplications', 'disbursedOn');
  }
};
