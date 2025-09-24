'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add new columns
    await queryInterface.addColumn('Accounts', 'statusChangedBy', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('Accounts', 'statusChangedOn', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // Copy data from old columns to new columns if they exist
    try {
      await queryInterface.sequelize.query(`
        UPDATE Accounts 
        SET statusChangedBy = approvedBy, 
            statusChangedOn = approvedOn 
        WHERE approvedBy IS NOT NULL OR approvedOn IS NOT NULL
      `);
    } catch (err) {
      console.log('No data to migrate from approvedBy/approvedOn fields');
    }

    // Drop old columns if they exist
    try {
      await queryInterface.removeColumn('Accounts', 'approvedBy');
    } catch (err) {
      console.log('approvedBy column does not exist');
    }
    
    try {
      await queryInterface.removeColumn('Accounts', 'approvedOn');
    } catch (err) {
      console.log('approvedOn column does not exist');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Add back old columns
    await queryInterface.addColumn('Accounts', 'approvedBy', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('Accounts', 'approvedOn', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // Copy data back
    try {
      await queryInterface.sequelize.query(`
        UPDATE Accounts 
        SET approvedBy = statusChangedBy, 
            approvedOn = statusChangedOn 
        WHERE statusChangedBy IS NOT NULL OR statusChangedOn IS NOT NULL
      `);
    } catch (err) {
      console.log('No data to migrate back');
    }

    // Remove new columns
    await queryInterface.removeColumn('Accounts', 'statusChangedBy');
    await queryInterface.removeColumn('Accounts', 'statusChangedOn');
  }
};
