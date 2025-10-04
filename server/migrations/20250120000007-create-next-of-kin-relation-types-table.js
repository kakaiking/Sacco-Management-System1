'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if table already exists
    const tables = await queryInterface.showAllTables();
    const tableExists = tables.includes('NextOfKinRelationTypes') || tables.includes('nextofkinrelationtypes');
    
    if (tableExists) {
      console.log('✅ NextOfKinRelationTypes table already exists - skipping migration');
      return;
    }
    
    // Create the table without foreign key constraints
    await queryInterface.createTable('NextOfKinRelationTypes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      relationTypeId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      relationTypeName: {
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

    // Add index on saccoId with explicit name and error handling
    try {
      await queryInterface.addIndex('NextOfKinRelationTypes', ['saccoId'], {
        name: 'next_of_kin_relation_types_sacco_id'
      });
    } catch (err) {
      console.log('Index next_of_kin_relation_types_sacco_id already exists or could not be created');
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('NextOfKinRelationTypes');
  }
};

