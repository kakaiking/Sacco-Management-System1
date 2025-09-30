'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('AccountOfficers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      accountOfficerId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      userId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'userId'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      employeeId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      phoneNumber: {
        type: Sequelize.STRING,
        allowNull: true
      },
      branchId: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'Branch',
          key: 'branchId'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      department: {
        type: Sequelize.STRING,
        allowNull: true
      },
      position: {
        type: Sequelize.STRING,
        allowNull: true
      },
      effectiveDate: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      expiryDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      isDefault: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      maxClients: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      currentClients: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      status: {
        type: Sequelize.ENUM("Active", "Inactive", "Suspended", "Terminated"),
        allowNull: false,
        defaultValue: "Active"
      },
      saccoId: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "SYSTEM"
      },
      createdBy: {
        type: Sequelize.STRING,
        allowNull: true
      },
      createdOn: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      modifiedBy: {
        type: Sequelize.STRING,
        allowNull: true
      },
      modifiedOn: {
        type: Sequelize.DATE,
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
      remarks: {
        type: Sequelize.TEXT,
        allowNull: true
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
    await queryInterface.addIndex('AccountOfficers', ['userId']);
    await queryInterface.addIndex('AccountOfficers', ['branchId']);
    await queryInterface.addIndex('AccountOfficers', ['saccoId']);
    await queryInterface.addIndex('AccountOfficers', ['status']);
    await queryInterface.addIndex('AccountOfficers', ['effectiveDate']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('AccountOfficers');
  }
};
