'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if table already exists
    const tables = await queryInterface.showAllTables();
    const tableExists = tables.includes('MemberCategories') || tables.includes('membercategories');
    
    if (tableExists) {
      console.log('✅ MemberCategories table already exists - skipping migration');
      return;
    }
    
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
    });

    // Add index on saccoId with explicit name
    try {
      await queryInterface.addIndex('MemberCategories', ['saccoId'], {
        name: 'member_categories_sacco_id'
      });
    } catch (err) {
      console.log('Index member_categories_sacco_id already exists or could not be created');
    }
    
    // Note: Foreign key constraint is disabled in the model definition
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('MemberCategories');
  }
};


