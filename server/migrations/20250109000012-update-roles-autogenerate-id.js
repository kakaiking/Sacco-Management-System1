'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Update existing roles to have auto-generated IDs if they don't have them
    const existingRoles = await queryInterface.sequelize.query(
      'SELECT id, roleId FROM Roles WHERE isDeleted = 0 ORDER BY id',
      { type: Sequelize.QueryTypes.SELECT }
    );

    let counter = 1;
    for (const role of existingRoles) {
      // Check if roleId is already in the correct format (ROLE001, ROLE002, etc.)
      if (!role.roleId || !role.roleId.match(/^ROLE\d{3}$/)) {
        let newRoleId;
        let isUnique = false;
        
        // Find a unique roleId
        while (!isUnique && counter < 1000) {
          newRoleId = `ROLE${counter.toString().padStart(3, '0')}`;
          
          // Check if this ID already exists
          const existing = await queryInterface.sequelize.query(
            'SELECT id FROM Roles WHERE roleId = :roleId AND isDeleted = 0',
            {
              replacements: { roleId: newRoleId },
              type: Sequelize.QueryTypes.SELECT
            }
          );
          
          if (existing.length === 0) {
            isUnique = true;
          } else {
            counter++;
          }
        }
        
        if (isUnique) {
          await queryInterface.sequelize.query(
            'UPDATE Roles SET roleId = :newRoleId WHERE id = :id',
            {
              replacements: { newRoleId, id: role.id }
            }
          );
        }
        
        counter++;
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    // This migration is not easily reversible
    // The roleId values would need to be manually restored
    console.log('Migration down: Auto-generated role IDs cannot be automatically reverted');
  }
};
