'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if columns already exist before adding them
    const tableDescription = await queryInterface.describeTable('Members');
    
    if (!tableDescription.title) {
      await queryInterface.addColumn('Members', 'title', {
        type: Sequelize.STRING,
        allowNull: true
      });
    } else {
      console.log('Column title already exists in Members table - skipping');
    }
    
    if (!tableDescription.category) {
      await queryInterface.addColumn('Members', 'category', {
        type: Sequelize.STRING,
        allowNull: true
      });
    } else {
      console.log('Column category already exists in Members table - skipping');
    }
    
    if (!tableDescription.kraPin) {
      await queryInterface.addColumn('Members', 'kraPin', {
        type: Sequelize.STRING,
        allowNull: true
      });
    } else {
      console.log('Column kraPin already exists in Members table - skipping');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Check if columns exist before removing them
    const tableDescription = await queryInterface.describeTable('Members');
    
    if (tableDescription.title) {
      await queryInterface.removeColumn('Members', 'title');
    } else {
      console.log('Column title does not exist in Members table - skipping');
    }
    
    if (tableDescription.category) {
      await queryInterface.removeColumn('Members', 'category');
    } else {
      console.log('Column category does not exist in Members table - skipping');
    }
    
    if (tableDescription.kraPin) {
      await queryInterface.removeColumn('Members', 'kraPin');
    } else {
      console.log('Column kraPin does not exist in Members table - skipping');
    }
  }
};
