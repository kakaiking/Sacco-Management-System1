'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
    // Check if columns already exist before adding them
    const tableDescription = await queryInterface.describeTable('MaritalStatus');
    
    if (!tableDescription.effectiveDate) {
      await queryInterface.addColumn('MaritalStatus', 'effectiveDate', {
      type: Sequelize.DATE,
      allowNull: true
    });
    } else {
      console.log('Column effectiveDate already exists in MaritalStatus table - skipping');
    }
    
    if (!tableDescription.endDate) {
      await queryInterface.addColumn('MaritalStatus', 'endDate', {
      type: Sequelize.DATE,
      allowNull: true
    });
    } else {
      console.log('Column endDate already exists in MaritalStatus table - skipping');
    }
    
  },

    down: async (queryInterface, Sequelize) => {
    // Check if columns exist before removing them
    const tableDescription = await queryInterface.describeTable('MaritalStatus');
    
    if (tableDescription.effectiveDate) {
      await queryInterface.removeColumn('MaritalStatus', 'effectiveDate');
    } else {
      console.log('Column effectiveDate does not exist in MaritalStatus table - skipping');
    }
    
    if (tableDescription.endDate) {
      await queryInterface.removeColumn('MaritalStatus', 'endDate');
    } else {
      console.log('Column endDate does not exist in MaritalStatus table - skipping');
    }
    
  });
    await queryInterface.addColumn('MaritalStatus', 'endDate', {
      type: Sequelize.DATE,
      allowNull: true
    });
  }
};

