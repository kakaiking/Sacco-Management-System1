'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Accounts', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      // Head section fields
      saccoId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      branchId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      memberNo: {
        type: Sequelize.STRING,
        allowNull: false
      },
      productId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      accountId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      
      // Overview Account Details
      shortName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      accountType: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'Savings'
      },
      currencyId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      city: {
        type: Sequelize.STRING,
        allowNull: true
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true
      },
      alternativePhone: {
        type: Sequelize.STRING,
        allowNull: true
      },
      kraPin: {
        type: Sequelize.STRING,
        allowNull: true
      },
      emailId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      operatingMode: {
        type: Sequelize.ENUM('Self', 'Either to sign', 'All to sign', 'Two to sign', 'Three to sign', 'Four to sign'),
        allowNull: false,
        defaultValue: 'Self'
      },
      operatingInstructions: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      accountOfficerId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      
      // In-depth Account Details
      clearBalance: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      unclearBalance: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      unsupervisedCredits: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      unsupervisedDebits: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      frozenAmount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      creditRate: {
        type: Sequelize.DECIMAL(8, 4),
        allowNull: false,
        defaultValue: 0.0000
      },
      debitRate: {
        type: Sequelize.DECIMAL(8, 4),
        allowNull: false,
        defaultValue: 0.0000
      },
      penaltyRate: {
        type: Sequelize.DECIMAL(8, 4),
        allowNull: false,
        defaultValue: 0.0000
      },
      pendingCharges: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      availableBalance: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      totalBalance: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      creditInterest: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      debitInterest: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      minimumBalance: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      fixedBalance: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      
      // Standard fields
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

    // Add foreign key constraints
    await queryInterface.addConstraint('Accounts', {
      fields: ['saccoId'],
      type: 'foreign key',
      name: 'fk_accounts_sacco',
      references: {
        table: 'Sacco',
        field: 'saccoId'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('Accounts', {
      fields: ['branchId'],
      type: 'foreign key',
      name: 'fk_accounts_branch',
      references: {
        table: 'Branch',
        field: 'branchId'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('Accounts', {
      fields: ['memberNo'],
      type: 'foreign key',
      name: 'fk_accounts_member',
      references: {
        table: 'Members',
        field: 'memberNo'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('Accounts', {
      fields: ['productId'],
      type: 'foreign key',
      name: 'fk_accounts_product',
      references: {
        table: 'Products',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('Accounts', {
      fields: ['currencyId'],
      type: 'foreign key',
      name: 'fk_accounts_currency',
      references: {
        table: 'Currency',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('Accounts', {
      fields: ['accountOfficerId'],
      type: 'foreign key',
      name: 'fk_accounts_account_officer',
      references: {
        table: 'AccountOfficers',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Accounts');
  }
};
