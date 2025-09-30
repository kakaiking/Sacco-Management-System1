'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('MaritalStatus', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      maritalStatusId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      maritalStatusName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      maritalStatusCode: {
        type: Sequelize.STRING(2),
        allowNull: true
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
        type: Sequelize.ENUM('Active', 'Inactive'),
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

    // Add indexes
    await queryInterface.addIndex('MaritalStatus', ['saccoId']);
    await queryInterface.addIndex('MaritalStatus', ['maritalStatusCode']);
    await queryInterface.addIndex('MaritalStatus', ['maritalStatusName']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('MaritalStatus');
  }
};
