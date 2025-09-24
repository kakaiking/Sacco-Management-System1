'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // For SQL Server, we need to drop the existing constraint and recreate it
    try {
      // Drop the existing check constraint
      await queryInterface.sequelize.query(`
        DECLARE @constraint_name NVARCHAR(128)
        SELECT @constraint_name = name 
        FROM sys.check_constraints 
        WHERE parent_object_id = OBJECT_ID('Logs') 
        AND definition LIKE '%action%'
        
        IF @constraint_name IS NOT NULL
        BEGIN
          EXEC('ALTER TABLE Logs DROP CONSTRAINT ' + @constraint_name)
        END
      `);

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
