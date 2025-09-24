'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Products', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      productId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      productName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      productStatus: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'Pending'
      },
      currency: {
        type: Sequelize.STRING,
        allowNull: false
      },
      isCreditInterest: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      isDebitInterest: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      interestType: {
        type: Sequelize.STRING,
        allowNull: true
      },
      interestCalculationRule: {
        type: Sequelize.STRING,
        allowNull: true
      },
      interestFrequency: {
        type: Sequelize.STRING,
        allowNull: true
      },
      appliedOnMemberOnboarding: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
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
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'Pending'
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
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Products');
  }
};
