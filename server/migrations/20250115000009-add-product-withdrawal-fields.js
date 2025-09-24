'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add new fields to Products table
    await queryInterface.addColumn('Products', 'isWithdrawable', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });

    await queryInterface.addColumn('Products', 'withdrawableFrom', {
      type: Sequelize.DATEONLY,
      allowNull: true
    });

    await queryInterface.addColumn('Products', 'productType', {
      type: Sequelize.ENUM('BOSA', 'FOSA'),
      allowNull: false,
      defaultValue: 'BOSA'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the added columns
    await queryInterface.removeColumn('Products', 'isWithdrawable');
    await queryInterface.removeColumn('Products', 'withdrawableFrom');
    await queryInterface.removeColumn('Products', 'productType');
  }
};
