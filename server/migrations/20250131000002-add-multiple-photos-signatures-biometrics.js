'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
    // Check if columns already exist before adding them
    const tableDescription = await queryInterface.describeTable('Members');
    
    if (!tableDescription.biometrics) {
      await queryInterface.addColumn('Members', 'biometrics', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    } else {
      console.log('Column biometrics already exists in Members table - skipping');
    }
    
    if (!tableDescription.photos) {
      await queryInterface.addColumn('Members', 'photos', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    } else {
      console.log('Column photos already exists in Members table - skipping');
    }
    
    if (!tableDescription.signatures) {
      await queryInterface.addColumn('Members', 'signatures', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    } else {
      console.log('Column signatures already exists in Members table - skipping');
    }
    
  },

    down: async (queryInterface, Sequelize) => {
    // Check if columns exist before removing them
    const tableDescription = await queryInterface.describeTable('Members');
    
    if (tableDescription.biometrics) {
      await queryInterface.removeColumn('Members', 'biometrics');
    } else {
      console.log('Column biometrics does not exist in Members table - skipping');
    }
    
    if (tableDescription.photos) {
      await queryInterface.removeColumn('Members', 'photos');
    } else {
      console.log('Column photos does not exist in Members table - skipping');
    }
    
    if (tableDescription.signatures) {
      await queryInterface.removeColumn('Members', 'signatures');
    } else {
      console.log('Column signatures does not exist in Members table - skipping');
    }
    
  }
};
