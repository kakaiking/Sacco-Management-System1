'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if createdByRole column already exists
    const tableDescription = await queryInterface.describeTable('Roles');
    
    if (!tableDescription.createdByRole) {
      await queryInterface.addColumn('Roles', 'createdByRole', {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Role of the user who created this role record'
      });
    } else {
      console.log('createdByRole column already exists in Roles table');
    }

    if (!tableDescription.modifiedByRole) {
      await queryInterface.addColumn('Roles', 'modifiedByRole', {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Role of the user who last modified this role record'
      });
    } else {
      console.log('modifiedByRole column already exists in Roles table');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the columns
    await queryInterface.removeColumn('Roles', 'createdByRole');
    await queryInterface.removeColumn('Roles', 'modifiedByRole');
  }
};
