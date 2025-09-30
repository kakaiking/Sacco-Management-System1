'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if columns already exist before adding them
    const tableDescription = await queryInterface.describeTable('Accounts');
    
    if (!tableDescription.statusChangedBy) {
      await queryInterface.addColumn('Accounts', 'statusChangedBy', {
        type: Sequelize.STRING,
        allowNull: true
      });
    } else {
      console.log('Column statusChangedBy already exists in Accounts table - skipping');
    }
    
    if (!tableDescription.statusChangedOn) {
      await queryInterface.addColumn('Accounts', 'statusChangedOn', {
        type: Sequelize.DATE,
        allowNull: true
      });
    } else {
      console.log('Column statusChangedOn already exists in Accounts table - skipping');
    }
    
    // Copy data from old columns to new columns
    try {
      await queryInterface.sequelize.query(`
        UPDATE Accounts 
        SET statusChangedBy = approvedBy, 
            statusChangedOn = approvedOn 
        WHERE approvedBy IS NOT NULL OR approvedOn IS NOT NULL
      `);
    } catch (err) {
      console.log('No data to migrate');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Check if columns exist before removing them
    const tableDescription = await queryInterface.describeTable('Accounts');
    
    if (tableDescription.statusChangedBy) {
      await queryInterface.removeColumn('Accounts', 'statusChangedBy');
    } else {
      console.log('Column statusChangedBy does not exist in Accounts table - skipping');
    }
    
    if (tableDescription.statusChangedOn) {
      await queryInterface.removeColumn('Accounts', 'statusChangedOn');
    } else {
      console.log('Column statusChangedOn does not exist in Accounts table - skipping');
    }
  }
};
