'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, drop the existing foreign key constraint
    try {
      await queryInterface.removeConstraint('Products', 'FK__Products__saccoI__4B7734FF');
      console.log('Removed existing foreign key constraint');
    } catch (error) {
      console.log('Foreign key constraint may not exist or could not be removed:', error.message);
    }

    // Add a new foreign key constraint that references the correct field
    // The Products.saccoId should reference Saccos.id (the primary key), not Saccos.saccoId
    try {
      await queryInterface.addConstraint('Products', {
        fields: ['saccoId'],
        type: 'foreign key',
        name: 'FK_Products_Saccos',
        references: {
          table: 'Saccos',
          field: 'id'  // Reference the primary key, not saccoId
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });
      console.log('Added new foreign key constraint');
    } catch (error) {
      console.log('Could not add foreign key constraint:', error.message);
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the new foreign key constraint
    try {
      await queryInterface.removeConstraint('Products', 'FK_Products_Saccos');
      console.log('Removed foreign key constraint');
    } catch (error) {
      console.log('Could not remove foreign key constraint:', error.message);
    }

    // Add back the old constraint (if needed)
    try {
      await queryInterface.addConstraint('Products', {
        fields: ['saccoId'],
        type: 'foreign key',
        name: 'FK__Products__saccoI__4B7734FF',
        references: {
          table: 'Saccos',
          field: 'saccoId'
        }
      });
      console.log('Restored old foreign key constraint');
    } catch (error) {
      console.log('Could not restore old foreign key constraint:', error.message);
    }
  }
};



