'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
    // Check if columns already exist before adding them
    const tableDescription = await queryInterface.describeTable('Accounts');
    
    if (!tableDescription.clearBalance) {
      await queryInterface.addColumn('Accounts', 'clearBalance', {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00
    });
    } else {
      console.log('Column clearBalance already exists in Accounts table - skipping');
    }
    
    if (!tableDescription.debitBalance) {
      await queryInterface.addColumn('Accounts', 'debitBalance', {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00
    });
    } else {
      console.log('Column debitBalance already exists in Accounts table - skipping');
    }
    
    if (!tableDescription.creditBalance) {
      await queryInterface.addColumn('Accounts', 'creditBalance', {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00
    });
    } else {
      console.log('Column creditBalance already exists in Accounts table - skipping');
    }
    
  },

    down: async (queryInterface, Sequelize) => {
    // Check if columns exist before removing them
    const tableDescription = await queryInterface.describeTable('Accounts');
    
    if (tableDescription.clearBalance) {
      await queryInterface.removeColumn('Accounts', 'clearBalance');
    } else {
      console.log('Column clearBalance does not exist in Accounts table - skipping');
    }
    
    if (tableDescription.debitBalance) {
      await queryInterface.removeColumn('Accounts', 'debitBalance');
    } else {
      console.log('Column debitBalance does not exist in Accounts table - skipping');
    }
    
    if (tableDescription.creditBalance) {
      await queryInterface.removeColumn('Accounts', 'creditBalance');
    } else {
      console.log('Column creditBalance does not exist in Accounts table - skipping');
    }
    
  }
};
