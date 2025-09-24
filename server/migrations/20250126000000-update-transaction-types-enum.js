'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // For SQL Server, we need to drop the existing CHECK constraint and create a new one
    // First, drop the existing constraint if it exists
    try {
      await queryInterface.sequelize.query(`
        DECLARE @constraint_name NVARCHAR(128)
        SELECT @constraint_name = name 
        FROM sys.check_constraints 
        WHERE parent_object_id = OBJECT_ID('Transactions') 
        AND definition LIKE '%type%'
        
        IF @constraint_name IS NOT NULL
        BEGIN
          EXEC('ALTER TABLE Transactions DROP CONSTRAINT ' + @constraint_name)
        END
      `);
    } catch (error) {
      console.log('No existing constraint found or error dropping it:', error.message);
    }

    // Add the new CHECK constraint with expanded transaction types
    await queryInterface.sequelize.query(`
      ALTER TABLE Transactions 
      ADD CONSTRAINT CK_Transactions_type 
      CHECK (type IN (
        'TRANSFER', 
        'DEPOSIT', 
        'WITHDRAWAL', 
        'LOAN_DISBURSEMENT', 
        'LOAN_REPAYMENT', 
        'INTEREST_PAYMENT', 
        'FEE_COLLECTION', 
        'REFUND', 
        'ADJUSTMENT', 
        'OTHER'
      ) OR type IS NULL)
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop the new constraint
    try {
      await queryInterface.sequelize.query(`
        ALTER TABLE Transactions DROP CONSTRAINT CK_Transactions_type
      `);
    } catch (error) {
      console.log('Error dropping constraint:', error.message);
    }

    // Restore the original constraint
    await queryInterface.sequelize.query(`
      ALTER TABLE Transactions 
      ADD CONSTRAINT CK_Transactions_type 
      CHECK (type IN ('DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'OTHER') OR type IS NULL)
    `);
  }
};
