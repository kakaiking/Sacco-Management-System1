'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'saccoId', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'SYSTEM'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Users', 'saccoId');
  }
};



