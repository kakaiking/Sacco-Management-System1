'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if table already exists
    const tableExists = await queryInterface.showAllTables().then(tables => 
      tables.some(table => table.tableName === 'InterestFrequency')
    );
    
    if (tableExists) {
      console.log('✅ InterestFrequency table already exists - skipping migration');
      return;
    }
    
    await queryInterface.createTable('InterestFrequency', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      interestFrequencyId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      interestFrequencyName: {
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

    // Add index on saccoId
    await queryInterface.addIndex('InterestFrequency', ['saccoId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('InterestFrequency');
  }
};

