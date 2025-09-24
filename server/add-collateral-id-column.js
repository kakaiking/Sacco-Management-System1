const { sequelize } = require('./models');

async function addCollateralIdColumn() {
  try {
    console.log('Adding collateralId column to LoanApplications table...');
    
    await sequelize.query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('LoanApplications') AND name = 'collateralId')
      BEGIN
        ALTER TABLE LoanApplications ADD collateralId INT NULL;
        PRINT 'Added collateralId column to LoanApplications table';
      END
      ELSE
      BEGIN
        PRINT 'collateralId column already exists in LoanApplications table';
      END
    `);
    
    console.log('✅ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

addCollateralIdColumn();
