'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // For SQL Server, we need to drop the constraint and recreate it
    try {
      // First, drop the existing check constraint
      await queryInterface.sequelize.query(`
        DECLARE @constraint_name NVARCHAR(128)
        SELECT @constraint_name = name 
        FROM sys.check_constraints 
        WHERE parent_object_id = OBJECT_ID('AccountTypes') 
        AND definition LIKE '%status%'
        
        IF @constraint_name IS NOT NULL
        BEGIN
          EXEC('ALTER TABLE AccountTypes DROP CONSTRAINT ' + @constraint_name)
        END
      `);

      // Add the new check constraint with 'Pending' included
      await queryInterface.sequelize.query(`
        ALTER TABLE AccountTypes 
        ADD CONSTRAINT CK_AccountTypes_status 
        CHECK (status IN ('Draft', 'Pending', 'Active', 'Inactive', 'Deleted'))
      `);

      console.log('Successfully updated AccountTypes status constraint to include Pending');
    } catch (error) {
      console.log('Error updating AccountTypes status constraint:', error.message);
      // If the constraint doesn't exist, create it
      try {
        await queryInterface.sequelize.query(`
          ALTER TABLE AccountTypes 
          ADD CONSTRAINT CK_AccountTypes_status 
          CHECK (status IN ('Draft', 'Pending', 'Active', 'Inactive', 'Deleted'))
        `);
        console.log('Successfully created AccountTypes status constraint with Pending');
      } catch (createError) {
        console.log('Error creating AccountTypes status constraint:', createError.message);
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Drop the constraint
      await queryInterface.sequelize.query(`
        DECLARE @constraint_name NVARCHAR(128)
        SELECT @constraint_name = name 
        FROM sys.check_constraints 
        WHERE parent_object_id = OBJECT_ID('AccountTypes') 
        AND definition LIKE '%status%'
        
        IF @constraint_name IS NOT NULL
        BEGIN
          EXEC('ALTER TABLE AccountTypes DROP CONSTRAINT ' + @constraint_name)
        END
      `);

      // Recreate without 'Pending'
      await queryInterface.sequelize.query(`
        ALTER TABLE AccountTypes 
        ADD CONSTRAINT CK_AccountTypes_status 
        CHECK (status IN ('Draft', 'Active', 'Inactive', 'Deleted'))
      `);

      console.log('Successfully reverted AccountTypes status constraint');
    } catch (error) {
      console.log('Error reverting AccountTypes status constraint:', error.message);
    }
  }
};

