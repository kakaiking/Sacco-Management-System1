'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // For MySQL, we need to drop the existing constraint and recreate it
    try {
      // Drop the existing check constraint
      const [constraints] = await queryInterface.sequelize.query(`
        SELECT CONSTRAINT_NAME 
        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
        WHERE TABLE_NAME = 'Logs' 
        AND CONSTRAINT_TYPE = 'CHECK'
        AND CONSTRAINT_NAME LIKE '%action%'
      `);
      
      if (constraints.length > 0) {
        for (const constraint of constraints) {
          await queryInterface.sequelize.query(`
            ALTER TABLE Logs DROP CONSTRAINT ${constraint.CONSTRAINT_NAME}
          `);
        }
      }

      // Add the new check constraint with expanded values
      await queryInterface.sequelize.query(`
        ALTER TABLE Logs 
        ADD CONSTRAINT CK_Logs_action 
        CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT', 'APPROVE', 'REJECT', 'LOCK', 'UNLOCK', 'NAVIGATE', 'CLICK', 'SEARCH', 'FILTER', 'FORM_SUBMIT'))
      `);

      console.log('Successfully updated Logs action constraint');
    } catch (error) {
      console.log('Error updating Logs action constraint:', error.message);
      // Continue even if constraint update fails
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Drop the new constraint
      await queryInterface.sequelize.query(`
        ALTER TABLE Logs DROP CONSTRAINT CK_Logs_action
      `);

      // Restore the original constraint
      await queryInterface.sequelize.query(`
        ALTER TABLE Logs 
        ADD CONSTRAINT CK_Logs_action 
        CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT', 'APPROVE', 'REJECT', 'LOCK', 'UNLOCK'))
      `);

      console.log('Successfully reverted Logs action constraint');
    } catch (error) {
      console.log('Error reverting Logs action constraint:', error.message);
    }
  }
};
