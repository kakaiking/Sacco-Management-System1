'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
    // Check if columns already exist before adding them
    const tableDescription = await queryInterface.describeTable('Transactions');
    
    if (!tableDescription.narration) {
      await queryInterface.addColumn('Transactions', 'narration', {
        type: Sequelize.TEXT,
        allowNull: true
      });
    } else {
      console.log('Column narration already exists in Transactions table - skipping');
    }
    
  },

    down: async (queryInterface, Sequelize) => {
    // Check if columns exist before removing them
    const tableDescription = await queryInterface.describeTable('Transactions');
    
    if (tableDescription.narration) {
      await queryInterface.removeColumn('Transactions', 'narration');
    } else {
      console.log('Column narration does not exist in Transactions table - skipping');
    }
    
  });
      console.log('✅ Successfully added narration column back to Transactions table');
    } catch (error) {
      console.error('❌ Error adding narration column back:', error);
      throw error;
    }
  }
};

