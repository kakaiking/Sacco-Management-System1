'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Members', 'title', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('Members', 'category', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('Members', 'kraPin', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Members', 'title');
    await queryInterface.removeColumn('Members', 'category');
    await queryInterface.removeColumn('Members', 'kraPin');
  }
};
