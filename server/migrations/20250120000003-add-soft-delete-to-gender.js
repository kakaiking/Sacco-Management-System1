'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if the isDeleted column already exists
    const tableDescription = await queryInterface.describeTable('Gender');
    
    if (tableDescription.isDeleted) {
      console.log('✅ isDeleted column already exists in Gender table - skipping migration');
      return;
    }
    
    await queryInterface.addColumn('Gender', 'isDeleted', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Gender', 'isDeleted');
  }
};


