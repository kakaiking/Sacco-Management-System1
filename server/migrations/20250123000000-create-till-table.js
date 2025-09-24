'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Tills', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      tillId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      tillName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      cashierId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      glAccountId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      maximumAmountCapacity: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true
      },
      minimumAmountCapacity: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true
      },
      saccoId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'Active'
      },
      remarks: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdOn: {
        type: Sequelize.DATE,
        allowNull: true,
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

    // Note: Foreign key constraints will be added later if needed
    // This avoids potential issues with table references
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Tills');
  }
};
