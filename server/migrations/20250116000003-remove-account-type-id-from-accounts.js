'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
    // Check if columns already exist before adding them
    const tableDescription = await queryInterface.describeTable('Accounts');
    
    if (!tableDescription.accountTypeId) {
      await queryInterface.addColumn('Accounts', 'accountTypeId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'AccountTypes',
        key: 'id'
      });
    } else {
      console.log('Column accountTypeId already exists in Accounts table - skipping');
    }
    
  },

    down: async (queryInterface, Sequelize) => {
    // Check if columns exist before removing them
    const tableDescription = await queryInterface.describeTable('Accounts');
    
    if (tableDescription.accountTypeId) {
      await queryInterface.removeColumn('Accounts', 'accountTypeId');
    } else {
      console.log('Column accountTypeId does not exist in Accounts table - skipping');
    }
    
  },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  }
};
