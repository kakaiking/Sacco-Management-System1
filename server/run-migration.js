const { sequelize } = require('./models');

async function runMigration() {
  try {
    console.log('Running migration to add balance fields...');
    
    // Add the new columns
    await sequelize.query(`
      ALTER TABLE Accounts 
      ADD clearBalance DECIMAL(15,2) NOT NULL DEFAULT 0.00
    `);
    console.log('✅ Added clearBalance column');
    
    await sequelize.query(`
      ALTER TABLE Accounts 
      ADD debitBalance DECIMAL(15,2) NOT NULL DEFAULT 0.00
    `);
    console.log('✅ Added debitBalance column');
    
    await sequelize.query(`
      ALTER TABLE Accounts 
      ADD creditBalance DECIMAL(15,2) NOT NULL DEFAULT 0.00
    `);
    console.log('✅ Added creditBalance column');
    
    // Update existing records to set clearBalance = availableBalance
    await sequelize.query(`
      UPDATE Accounts 
      SET clearBalance = availableBalance 
      WHERE clearBalance = 0.00
    `);
    console.log('✅ Updated existing records with clearBalance values');
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await sequelize.close();
  }
}

runMigration();
