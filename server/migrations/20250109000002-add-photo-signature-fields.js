'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Members', 'photo', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Members', 'signature', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Members', 'photo');
    await queryInterface.removeColumn('Members', 'signature');
  }
};
