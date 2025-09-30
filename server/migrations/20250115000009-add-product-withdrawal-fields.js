'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
    // Check if columns already exist before adding them
    const tableDescription = await queryInterface.describeTable('Products');
    
    if (!tableDescription.isWithdrawable) {
      await queryInterface.addColumn('Products', 'isWithdrawable', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });
    } else {
      console.log('Column isWithdrawable already exists in Products table - skipping');
    }
    
    if (!tableDescription.withdrawableFrom) {
      await queryInterface.addColumn('Products', 'withdrawableFrom', {
      type: Sequelize.DATEONLY,
      allowNull: true
    });
    } else {
      console.log('Column withdrawableFrom already exists in Products table - skipping');
    }
    
    if (!tableDescription.productType) {
      await queryInterface.addColumn('Products', 'productType', {
      type: Sequelize.ENUM('BOSA', 'FOSA'),
      allowNull: false,
      defaultValue: 'BOSA'
    });
    } else {
      console.log('Column productType already exists in Products table - skipping');
    }
    
  },

    down: async (queryInterface, Sequelize) => {
    // Check if columns exist before removing them
    const tableDescription = await queryInterface.describeTable('Products');
    
    if (tableDescription.isWithdrawable) {
      await queryInterface.removeColumn('Products', 'isWithdrawable');
    } else {
      console.log('Column isWithdrawable does not exist in Products table - skipping');
    }
    
    if (tableDescription.withdrawableFrom) {
      await queryInterface.removeColumn('Products', 'withdrawableFrom');
    } else {
      console.log('Column withdrawableFrom does not exist in Products table - skipping');
    }
    
    if (tableDescription.productType) {
      await queryInterface.removeColumn('Products', 'productType');
    } else {
      console.log('Column productType does not exist in Products table - skipping');
    }
    
  }
};
