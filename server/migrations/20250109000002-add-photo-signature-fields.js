'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if columns already exist before adding them
    const tableDescription = await queryInterface.describeTable('Members');
    
    if (!tableDescription.photo) {
      await queryInterface.addColumn('Members', 'photo', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    } else {
      console.log('Column photo already exists in Members table - skipping');
    }
    
    if (!tableDescription.signature) {
      await queryInterface.addColumn('Members', 'signature', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    } else {
      console.log('Column signature already exists in Members table - skipping');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Check if columns exist before removing them
    const tableDescription = await queryInterface.describeTable('Members');
    
    if (tableDescription.photo) {
      await queryInterface.removeColumn('Members', 'photo');
    } else {
      console.log('Column photo does not exist in Members table - skipping');
    }
    
    if (tableDescription.signature) {
      await queryInterface.removeColumn('Members', 'signature');
    } else {
      console.log('Column signature does not exist in Members table - skipping');
    }
  }
};
