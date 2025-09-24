'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Currencies', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      currencyId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      currencyCode: {
        type: Sequelize.STRING(3),
        allowNull: false,
        unique: true
      },
      currencyName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      symbol: {
        type: Sequelize.STRING(10),
        allowNull: true
      },
      decimalPlaces: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 2
      },
      exchangeRate: {
        type: Sequelize.DECIMAL(15, 6),
        allowNull: true,
        defaultValue: 1.000000
      },
      isBaseCurrency: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      country: {
        type: Sequelize.STRING,
        allowNull: true
      },
      region: {
        type: Sequelize.STRING,
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('Active', 'Inactive'),
        allowNull: false,
        defaultValue: 'Active'
      },
      lastUpdated: {
        type: Sequelize.DATE,
        allowNull: true
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
      verifierRemarks: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      isDeleted: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('Currencies', ['currencyCode']);
    await queryInterface.addIndex('Currencies', ['status']);
    await queryInterface.addIndex('Currencies', ['isBaseCurrency']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Currencies');
  }
};


