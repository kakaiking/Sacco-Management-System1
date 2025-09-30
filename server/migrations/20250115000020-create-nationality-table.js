'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Nationality', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      nationalityId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      nationalityName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      isoCode: {
        type: Sequelize.STRING(2),
        allowNull: true
      },
      countryCode: {
        type: Sequelize.STRING(3),
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
    await queryInterface.addIndex('Nationality', ['saccoId']);
    await queryInterface.addIndex('Nationality', ['isoCode']);
    await queryInterface.addIndex('Nationality', ['countryCode']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Nationality');
  }
};
