'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove onMemberOnboarding column from Products table
    await queryInterface.removeColumn('Products', 'onMemberOnboarding');
  },

  down: async (queryInterface, Sequelize) => {
    // Add back onMemberOnboarding column
    await queryInterface.addColumn('Products', 'onMemberOnboarding', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
  }
};

