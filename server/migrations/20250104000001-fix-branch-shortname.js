'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Try to get the table description
      // This will work for both 'Branches' and 'branches' table names
      let tableName = 'Branches';
      let tableDescription;
      
      try {
        tableDescription = await queryInterface.describeTable('Branches');
      } catch (error) {
        // If Branches doesn't exist, try lowercase
        try {
          tableDescription = await queryInterface.describeTable('branches');
          tableName = 'branches';
        } catch (error2) {
          console.error('Could not find Branches or branches table');
          throw error2;
        }
      }
      
      console.log(`Using table name: ${tableName}`);
      console.log('Existing columns:', Object.keys(tableDescription));
      
      // Add shortName if it doesn't exist
      if (!tableDescription.shortName) {
        console.log('Adding shortName column...');
        await queryInterface.addColumn(tableName, 'shortName', {
          type: Sequelize.STRING,
          allowNull: true
        });
        console.log('shortName column added successfully');
      } else {
        console.log('shortName column already exists');
      }
      
      // Add city if it doesn't exist
      if (!tableDescription.city) {
        console.log('Adding city column...');
        await queryInterface.addColumn(tableName, 'city', {
          type: Sequelize.STRING,
          allowNull: true
        });
        console.log('city column added successfully');
      } else {
        console.log('city column already exists');
      }
      
      // Add poBox if it doesn't exist
      if (!tableDescription.poBox) {
        console.log('Adding poBox column...');
        await queryInterface.addColumn(tableName, 'poBox', {
          type: Sequelize.STRING,
          allowNull: true
        });
        console.log('poBox column added successfully');
      } else {
        console.log('poBox column already exists');
      }
      
      // Add postalCode if it doesn't exist
      if (!tableDescription.postalCode) {
        console.log('Adding postalCode column...');
        await queryInterface.addColumn(tableName, 'postalCode', {
          type: Sequelize.STRING,
          allowNull: true
        });
        console.log('postalCode column added successfully');
      } else {
        console.log('postalCode column already exists');
      }
      
      // Add phoneNumber if it doesn't exist
      if (!tableDescription.phoneNumber) {
        console.log('Adding phoneNumber column...');
        await queryInterface.addColumn(tableName, 'phoneNumber', {
          type: Sequelize.STRING,
          allowNull: true
        });
        console.log('phoneNumber column added successfully');
      } else {
        console.log('phoneNumber column already exists');
      }
      
      // Add alternativePhone if it doesn't exist
      if (!tableDescription.alternativePhone) {
        console.log('Adding alternativePhone column...');
        await queryInterface.addColumn(tableName, 'alternativePhone', {
          type: Sequelize.STRING,
          allowNull: true
        });
        console.log('alternativePhone column added successfully');
      } else {
        console.log('alternativePhone column already exists');
      }
      
      // Add branchCashLimit if it doesn't exist
      if (!tableDescription.branchCashLimit) {
        console.log('Adding branchCashLimit column...');
        await queryInterface.addColumn(tableName, 'branchCashLimit', {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: true,
          defaultValue: 0.00
        });
        console.log('branchCashLimit column added successfully');
      } else {
        console.log('branchCashLimit column already exists');
      }
      
      console.log('Migration completed successfully');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Determine correct table name
      let tableName = 'Branches';
      try {
        await queryInterface.describeTable('Branches');
      } catch (error) {
        tableName = 'branches';
      }
      
      const tableDescription = await queryInterface.describeTable(tableName);
      
      if (tableDescription.shortName) {
        await queryInterface.removeColumn(tableName, 'shortName');
      }
      if (tableDescription.city) {
        await queryInterface.removeColumn(tableName, 'city');
      }
      if (tableDescription.poBox) {
        await queryInterface.removeColumn(tableName, 'poBox');
      }
      if (tableDescription.postalCode) {
        await queryInterface.removeColumn(tableName, 'postalCode');
      }
      if (tableDescription.phoneNumber) {
        await queryInterface.removeColumn(tableName, 'phoneNumber');
      }
      if (tableDescription.alternativePhone) {
        await queryInterface.removeColumn(tableName, 'alternativePhone');
      }
      if (tableDescription.branchCashLimit) {
        await queryInterface.removeColumn(tableName, 'branchCashLimit');
      }
      
      console.log('Rollback completed successfully');
    } catch (error) {
      console.error('Rollback failed:', error);
      throw error;
    }
  }
};

