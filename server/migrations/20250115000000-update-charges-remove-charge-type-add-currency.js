'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
    // Check if columns already exist before adding them
    const tableDescription = await queryInterface.describeTable('Charges');
    
    if (!tableDescription.currency) {
      await queryInterface.addColumn('Charges', 'currency', {
      type: Sequelize.STRING(3),
      allowNull: false,
      defaultValue: 'USD' // Default to USD for existing records
    });
    } else {
      console.log('Column currency already exists in Charges table - skipping');
    }
    
    if (!tableDescription.chargeType) {
      await queryInterface.addColumn('Charges', 'chargeType', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'Other' // Default value for rollback
    });
    } else {
      console.log('Column chargeType already exists in Charges table - skipping');
    }
    
  },

    down: async (queryInterface, Sequelize) => {
    // Check if columns exist before removing them
    const tableDescription = await queryInterface.describeTable('Charges');
    
    if (tableDescription.chargeType) {
      await queryInterface.removeColumn('Charges', 'chargeType');
    } else {
      console.log('Column chargeType does not exist in Charges table - skipping');
    }
    
    if (tableDescription.currency) {
      await queryInterface.removeColumn('Charges', 'currency');
    } else {
      console.log('Column currency does not exist in Charges table - skipping');
    }
    
  }
};

