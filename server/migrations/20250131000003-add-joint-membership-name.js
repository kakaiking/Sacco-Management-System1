'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
    // Check if columns already exist before adding them
    const tableDescription = await queryInterface.describeTable('Members');
    
    if (!tableDescription.jointMembershipName) {
      await queryInterface.addColumn('Members', 'jointMembershipName', {
      type: Sequelize.STRING,
      allowNull: true
    });
    } else {
      console.log('Column jointMembershipName already exists in Members table - skipping');
    }
    
  },

    down: async (queryInterface, Sequelize) => {
    // Check if columns exist before removing them
    const tableDescription = await queryInterface.describeTable('Members');
    
    if (tableDescription.jointMembershipName) {
      await queryInterface.removeColumn('Members', 'jointMembershipName');
    } else {
      console.log('Column jointMembershipName does not exist in Members table - skipping');
    }
    
  }
};
