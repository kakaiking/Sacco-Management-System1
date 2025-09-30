'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
    // Check if columns already exist before adding them
    const tableDescription = await queryInterface.describeTable('Products');
    
    if (!tableDescription.onMemberOnboarding) {
      await queryInterface.addColumn('Products', 'onMemberOnboarding', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    } else {
      console.log('Column onMemberOnboarding already exists in Products table - skipping');
    }
    
  },

    down: async (queryInterface, Sequelize) => {
    // Check if columns exist before removing them
    const tableDescription = await queryInterface.describeTable('Products');
    
    if (tableDescription.onMemberOnboarding) {
      await queryInterface.removeColumn('Products', 'onMemberOnboarding');
    } else {
      console.log('Column onMemberOnboarding does not exist in Products table - skipping');
    }
    
  }
};

