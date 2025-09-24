'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Members', 'country', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('Members', 'county', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('Members', 'email', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('Members', 'personalPhone', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('Members', 'alternativePhone', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Members', 'country');
    await queryInterface.removeColumn('Members', 'county');
    await queryInterface.removeColumn('Members', 'email');
    await queryInterface.removeColumn('Members', 'personalPhone');
    await queryInterface.removeColumn('Members', 'alternativePhone');
  }
};
