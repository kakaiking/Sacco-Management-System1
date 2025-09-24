'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Transactions', 'accountType', {
      type: Sequelize.ENUM('MEMBER', 'GL'),
      allowNull: false,
      defaultValue: 'MEMBER'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Transactions', 'accountType');
  }
};
