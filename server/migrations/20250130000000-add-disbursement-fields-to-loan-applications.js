'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
    // Check if columns already exist before adding them
    const tableDescription = await queryInterface.describeTable('LoanApplications');
    
    if (!tableDescription.disbursedBy) {
      await queryInterface.addColumn('LoanApplications', 'disbursedBy', {
      type: Sequelize.STRING,
      allowNull: true
    });
    } else {
      console.log('Column disbursedBy already exists in LoanApplications table - skipping');
    }
    
    if (!tableDescription.disbursedOn) {
      await queryInterface.addColumn('LoanApplications', 'disbursedOn', {
      type: Sequelize.DATE,
      allowNull: true
    });
    } else {
      console.log('Column disbursedOn already exists in LoanApplications table - skipping');
    }
    
  },

    down: async (queryInterface, Sequelize) => {
    // Check if columns exist before removing them
    const tableDescription = await queryInterface.describeTable('LoanApplications');
    
    if (tableDescription.disbursedBy) {
      await queryInterface.removeColumn('LoanApplications', 'disbursedBy');
    } else {
      console.log('Column disbursedBy does not exist in LoanApplications table - skipping');
    }
    
    if (tableDescription.disbursedOn) {
      await queryInterface.removeColumn('LoanApplications', 'disbursedOn');
    } else {
      console.log('Column disbursedOn does not exist in LoanApplications table - skipping');
    }
    
  }
};
