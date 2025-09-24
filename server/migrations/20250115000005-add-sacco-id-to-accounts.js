'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if saccoId column already exists
    const tableDescription = await queryInterface.describeTable('Accounts');
    
    if (!tableDescription.saccoId) {
      await queryInterface.addColumn('Accounts', 'saccoId', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'SYSTEM' // Default value for existing records
      });

      // Add foreign key constraint (with error handling)
      try {
        await queryInterface.addConstraint('Accounts', {
          fields: ['saccoId'],
          type: 'foreign key',
          name: 'fk_accounts_sacco',
          references: {
            table: 'Sacco',
            field: 'saccoId'
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        });
      } catch (error) {
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log('Foreign key constraint fk_accounts_sacco already exists');
        } else {
          throw error;
        }
      }
    } else {
      console.log('saccoId column already exists in Accounts table');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove foreign key constraint first
    await queryInterface.removeConstraint('Accounts', 'fk_accounts_sacco');
    
    // Remove the column
    await queryInterface.removeColumn('Accounts', 'saccoId');
  }
};
