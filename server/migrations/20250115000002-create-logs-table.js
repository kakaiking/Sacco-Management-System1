'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Logs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      logId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      saccoId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      action: {
        type: Sequelize.ENUM('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT', 'APPROVE', 'REJECT', 'LOCK', 'UNLOCK'),
        allowNull: false
      },
      entityType: {
        type: Sequelize.STRING,
        allowNull: false
      },
      entityId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      entityName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      userId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false
      },
      userRole: {
        type: Sequelize.STRING,
        allowNull: true
      },
      ipAddress: {
        type: Sequelize.STRING,
        allowNull: true
      },
      userAgent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      details: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      beforeData: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      afterData: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      changes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
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
    await queryInterface.addIndex('Logs', ['saccoId']);
    await queryInterface.addIndex('Logs', ['action']);
    await queryInterface.addIndex('Logs', ['entityType']);
    await queryInterface.addIndex('Logs', ['userId']);
    await queryInterface.addIndex('Logs', ['timestamp']);
    await queryInterface.addIndex('Logs', ['entityId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Logs');
  }
};
