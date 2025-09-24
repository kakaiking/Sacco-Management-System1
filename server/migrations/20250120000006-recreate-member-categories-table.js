'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Drop the table if it exists (in case it was created with foreign key constraints)
    await queryInterface.dropTable('MemberCategories').catch(() => {
      // Ignore error if table doesn't exist
    });

    // Create the table without foreign key constraints
    await queryInterface.createTable('MemberCategories', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      memberCategoryId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      memberCategoryName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      saccoId: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'SYSTEM'
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'Active'
      },
      createdOn: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      createdBy: {
        type: Sequelize.STRING,
        allowNull: true
      },
      modifiedOn: {
        type: Sequelize.DATE,
        allowNull: true
      },
      modifiedBy: {
        type: Sequelize.STRING,
        allowNull: true
      },
      approvedBy: {
        type: Sequelize.STRING,
        allowNull: true
      },
      approvedOn: {
        type: Sequelize.DATE,
        allowNull: true
      },
      isDeleted: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      }
    }, {
      // Explicitly disable foreign key constraints
      foreignKeyConstraints: false
    });

    // Add index on saccoId
    await queryInterface.addIndex('MemberCategories', ['saccoId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('MemberCategories');
  }
};
