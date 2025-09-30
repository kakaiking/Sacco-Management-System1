'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
    // Check if columns already exist before adding them
    const tableDescription = await queryInterface.describeTable('Users');
    
    if (!tableDescription.branchId) {
      await queryInterface.addColumn('Users', 'branchId', {
      type: Sequelize.STRING,
      allowNull: true,
      references: {
        model: 'Branches',
        key: 'branchId'
      });
    } else {
      console.log('Column branchId already exists in Users table - skipping');
    }
    
  },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

    down: async (queryInterface, Sequelize) => {
    // Check if columns exist before removing them
    const tableDescription = await queryInterface.describeTable('Users');
    
    if (tableDescription.branchId) {
      await queryInterface.removeColumn('Users', 'branchId');
    } else {
      console.log('Column branchId does not exist in Users table - skipping');
    }
    
  }
};

