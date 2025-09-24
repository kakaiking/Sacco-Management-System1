'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Drop the existing Transactions table and recreate it
    await queryInterface.dropTable('Transactions');
    
    // Create the new Transactions table with proper double-entry structure
    await queryInterface.createTable('Transactions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      referenceNumber: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Same for both debit and credit entries'
      },
      transactionId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: 'Unique for each entry'
      },
      saccoId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      accountId: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Account ID string'
      },
      entryType: {
        type: Sequelize.ENUM('DEBIT', 'CREDIT'),
        allowNull: false
      },
      amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'Pending'
      },
      remarks: {
        type: Sequelize.TEXT,
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
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('Transactions', ['referenceNumber']);
    await queryInterface.addIndex('Transactions', ['transactionId']);
    await queryInterface.addIndex('Transactions', ['accountId']);
    await queryInterface.addIndex('Transactions', ['saccoId']);
    await queryInterface.addIndex('Transactions', ['entryType']);
    await queryInterface.addIndex('Transactions', ['status']);

    // Add foreign key constraints
    await queryInterface.addConstraint('Transactions', {
      fields: ['saccoId'],
      type: 'foreign key',
      name: 'Transactions_saccoId_fkey',
      references: {
        table: 'Saccos',
        field: 'saccoId'
      },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('Transactions', {
      fields: ['accountId'],
      type: 'foreign key',
      name: 'Transactions_accountId_fkey',
      references: {
        table: 'Accounts',
        field: 'accountId'
      },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Drop the new table
    await queryInterface.dropTable('Transactions');
    
    // Recreate the old table structure (if needed for rollback)
    await queryInterface.createTable('Transactions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      transactionId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      referenceNumber: {
        type: Sequelize.STRING,
        allowNull: false
      },
      saccoId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      accountId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      entryType: {
        type: Sequelize.ENUM('DEBIT', 'CREDIT'),
        allowNull: false
      },
      debitAccountId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      creditAccountId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'Pending'
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
      verifierRemarks: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      isDeleted: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      }
    });
  }
};

