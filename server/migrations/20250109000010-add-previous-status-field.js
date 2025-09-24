'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'previousStatus', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Status before user was locked'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Users', 'previousStatus');
  }
};
