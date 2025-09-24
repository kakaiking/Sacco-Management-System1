'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('AccountTypes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      accountTypeId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      accountTypeName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      saccoId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      productId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      accountType: {
        type: Sequelize.ENUM('MEMBER', 'GL'),
        allowNull: false,
        defaultValue: 'MEMBER'
      },
      bosaFosa: {
        type: Sequelize.ENUM('BOSA', 'FOSA'),
        allowNull: false,
        defaultValue: 'BOSA'
      },
      debitCredit: {
        type: Sequelize.ENUM('DEBIT', 'CREDIT'),
        allowNull: false,
        defaultValue: 'DEBIT'
      },
      appliedOnMemberOnboarding: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      isWithdrawable: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      withdrawableFrom: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      interestRate: {
        type: Sequelize.DECIMAL(10, 4),
        allowNull: true
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
      needGuarantors: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      maxGuarantors: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      minGuarantors: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      isSpecial: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      maxSpecialUsers: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      chargeIds: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      currency: {
        type: Sequelize.STRING,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('Draft', 'Active', 'Inactive', 'Deleted'),
        allowNull: false,
        defaultValue: 'Draft'
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
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('AccountTypes');
  }
};
