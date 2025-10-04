'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('Branches');
    
    // Add shortName if it doesn't exist
    if (!tableDescription.shortName) {
      await queryInterface.addColumn('Branches', 'shortName', {
        type: Sequelize.STRING,
        allowNull: true,
        after: 'branchName'
      });
    }
    
    // Add city if it doesn't exist
    if (!tableDescription.city) {
      await queryInterface.addColumn('Branches', 'city', {
        type: Sequelize.STRING,
        allowNull: true,
        after: 'branchLocation'
      });
    }
    
    // Add poBox if it doesn't exist
    if (!tableDescription.poBox) {
      await queryInterface.addColumn('Branches', 'poBox', {
        type: Sequelize.STRING,
        allowNull: true,
        after: 'city'
      });
    }
    
    // Add postalCode if it doesn't exist
    if (!tableDescription.postalCode) {
      await queryInterface.addColumn('Branches', 'postalCode', {
        type: Sequelize.STRING,
        allowNull: true,
        after: 'poBox'
      });
    }
    
    // Add phoneNumber if it doesn't exist
    if (!tableDescription.phoneNumber) {
      await queryInterface.addColumn('Branches', 'phoneNumber', {
        type: Sequelize.STRING,
        allowNull: true,
        after: 'postalCode'
      });
    }
    
    // Add alternativePhone if it doesn't exist
    if (!tableDescription.alternativePhone) {
      await queryInterface.addColumn('Branches', 'alternativePhone', {
        type: Sequelize.STRING,
        allowNull: true,
        after: 'phoneNumber'
      });
    }
    
    // Add branchCashLimit if it doesn't exist
    if (!tableDescription.branchCashLimit) {
      await queryInterface.addColumn('Branches', 'branchCashLimit', {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
        defaultValue: 0.00,
        after: 'alternativePhone'
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('Branches');
    
    if (tableDescription.shortName) {
      await queryInterface.removeColumn('Branches', 'shortName');
    }
    if (tableDescription.city) {
      await queryInterface.removeColumn('Branches', 'city');
    }
    if (tableDescription.poBox) {
      await queryInterface.removeColumn('Branches', 'poBox');
    }
    if (tableDescription.postalCode) {
      await queryInterface.removeColumn('Branches', 'postalCode');
    }
    if (tableDescription.phoneNumber) {
      await queryInterface.removeColumn('Branches', 'phoneNumber');
    }
    if (tableDescription.alternativePhone) {
      await queryInterface.removeColumn('Branches', 'alternativePhone');
    }
    if (tableDescription.branchCashLimit) {
      await queryInterface.removeColumn('Branches', 'branchCashLimit');
    }
  }
};


