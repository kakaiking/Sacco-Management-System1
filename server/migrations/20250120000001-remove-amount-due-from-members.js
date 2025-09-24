'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Members', 'amountDue');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Members', 'amountDue', {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: 'Total amount due from member based on product charges'
    });
  }
};





