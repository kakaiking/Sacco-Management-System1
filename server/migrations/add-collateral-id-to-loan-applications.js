'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Check if the column already exists
      const tableDescription = await queryInterface.describeTable('LoanApplications');
      
      if (!tableDescription.collateralId) {
        await queryInterface.addColumn('LoanApplications', 'collateralId', {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'Collaterals',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        });
        console.log('✅ Added collateralId column to LoanApplications table');
      } else {
        console.log('ℹ️ collateralId column already exists in LoanApplications table');
      }
    } catch (error) {
      console.error('❌ Error adding collateralId column:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('LoanApplications', 'collateralId');
      console.log('✅ Removed collateralId column from LoanApplications table');
    } catch (error) {
      console.error('❌ Error removing collateralId column:', error);
      throw error;
    }
  }
};
