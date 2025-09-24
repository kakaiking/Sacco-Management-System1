'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove chargeType column
    await queryInterface.removeColumn('Charges', 'chargeType');
    
    // Add currency column
    await queryInterface.addColumn('Charges', 'currency', {
      type: Sequelize.STRING(3),
      allowNull: false,
      defaultValue: 'USD' // Default to USD for existing records
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove currency column
    await queryInterface.removeColumn('Charges', 'currency');
    
    // Add back chargeType column
    await queryInterface.addColumn('Charges', 'chargeType', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'Other' // Default value for rollback
    });
  }
};

