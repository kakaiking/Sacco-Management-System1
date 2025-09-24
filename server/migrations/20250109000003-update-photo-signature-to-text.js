'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Update photo column to TEXT
    await queryInterface.changeColumn('Members', 'photo', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    
    // Update signature column to TEXT
    await queryInterface.changeColumn('Members', 'signature', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert photo column to STRING
    await queryInterface.changeColumn('Members', 'photo', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    
    // Revert signature column to STRING
    await queryInterface.changeColumn('Members', 'signature', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  }
};
