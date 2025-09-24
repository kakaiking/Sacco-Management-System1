'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('GLAccounts', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      glAccountId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      saccoId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'Saccos',
          key: 'saccoId'
        }
      },
      accountName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      accountNumber: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      accountCategory: {
        type: Sequelize.ENUM('ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'),
        allowNull: false
      },
      accountSubCategory: {
        type: Sequelize.STRING,
        allowNull: true
      },
      parentAccountId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'GLAccounts',
          key: 'id'
        }
      },
      accountLevel: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      isParentAccount: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      normalBalance: {
        type: Sequelize.ENUM('DEBIT', 'CREDIT'),
        allowNull: false
      },
      availableBalance: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "Active"
      },
      remarks: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdOn: {
        type: Sequelize.DATE,
        allowNull: true
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
      statusChangedBy: {
        type: Sequelize.STRING,
        allowNull: true
      },
      statusChangedOn: {
        type: Sequelize.DATE,
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
    await queryInterface.dropTable('GLAccounts');
  }
};
