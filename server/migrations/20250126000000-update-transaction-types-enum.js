'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // For MySQL, we need to drop the existing CHECK constraint and create a new one
    // First, drop the existing constraint if it exists
    try {
      const [constraints] = await queryInterface.sequelize.query(`
        SELECT CONSTRAINT_NAME 
        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
        WHERE TABLE_NAME = 'Transactions' 
        AND CONSTRAINT_TYPE = 'CHECK'
        AND CONSTRAINT_NAME LIKE '%type%'
      `);
      
      if (constraints.length > 0) {
        for (const constraint of constraints) {
          await queryInterface.sequelize.query(`
            ALTER TABLE Transactions DROP CONSTRAINT ${constraint.CONSTRAINT_NAME}
          `);
        }
      }
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
