'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
    // Check if columns already exist before adding them
    const tableDescription = await queryInterface.describeTable('Members');
    
    if (!tableDescription.country) {
      await queryInterface.addColumn('Members', 'country', {
      type: Sequelize.STRING,
      allowNull: true
    });
    } else {
      console.log('Column country already exists in Members table - skipping');
    }
    
    if (!tableDescription.county) {
      await queryInterface.addColumn('Members', 'county', {
      type: Sequelize.STRING,
      allowNull: true
    });
    } else {
      console.log('Column county already exists in Members table - skipping');
    }
    
    if (!tableDescription.email) {
      await queryInterface.addColumn('Members', 'email', {
      type: Sequelize.STRING,
      allowNull: true
    });
    } else {
      console.log('Column email already exists in Members table - skipping');
    }
    
    if (!tableDescription.personalPhone) {
      await queryInterface.addColumn('Members', 'personalPhone', {
      type: Sequelize.STRING,
      allowNull: true
    });
    } else {
      console.log('Column personalPhone already exists in Members table - skipping');
    }
    
    if (!tableDescription.alternativePhone) {
      await queryInterface.addColumn('Members', 'alternativePhone', {
      type: Sequelize.STRING,
      allowNull: true
    });
    } else {
      console.log('Column alternativePhone already exists in Members table - skipping');
    }
    
  },

    down: async (queryInterface, Sequelize) => {
    // Check if columns exist before removing them
    const tableDescription = await queryInterface.describeTable('Members');
    
    if (tableDescription.country) {
      await queryInterface.removeColumn('Members', 'country');
    } else {
      console.log('Column country does not exist in Members table - skipping');
    }
    
    if (tableDescription.county) {
      await queryInterface.removeColumn('Members', 'county');
    } else {
      console.log('Column county does not exist in Members table - skipping');
    }
    
    if (tableDescription.email) {
      await queryInterface.removeColumn('Members', 'email');
    } else {
      console.log('Column email does not exist in Members table - skipping');
    }
    
    if (tableDescription.personalPhone) {
      await queryInterface.removeColumn('Members', 'personalPhone');
    } else {
      console.log('Column personalPhone does not exist in Members table - skipping');
    }
    
    if (tableDescription.alternativePhone) {
      await queryInterface.removeColumn('Members', 'alternativePhone');
    } else {
      console.log('Column alternativePhone does not exist in Members table - skipping');
    }
    
  }
};
