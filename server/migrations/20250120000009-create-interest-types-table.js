'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if table already exists
    const tableExists = await queryInterface.showAllTables().then(tables => 
      tables.some(table => table.tableName === 'InterestTypes')
    );
    
    if (tableExists) {
      console.log('✅ InterestTypes table already exists - skipping migration');
      return;
    }
    
    // Create the table without foreign key constraints
    await queryInterface.createTable('InterestTypes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      interestTypeId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      interestTypeName: {
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
    await queryInterface.addIndex('InterestTypes', ['saccoId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('InterestTypes');
  }
};

