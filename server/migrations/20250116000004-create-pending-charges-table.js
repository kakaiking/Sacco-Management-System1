'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('PendingCharges', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      chargeId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      memberId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      accountId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      currency: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'KES'
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'PROCESSED', 'FAILED', 'CANCELLED'),
        allowNull: false,
        defaultValue: 'PENDING'
      },
      chargeType: {
        type: Sequelize.STRING,
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      dueDate: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      processedOn: {
        type: Sequelize.DATE,
        allowNull: true
      },
      processedBy: {
        type: Sequelize.STRING,
        allowNull: true
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
      isDeleted: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('PendingCharges');
  }
};
