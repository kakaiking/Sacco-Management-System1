const { sequelize } = require('./models');
const { GLAccounts } = require('./models');

// Configuration
const TEST_SACCO_ID = 'SYSTEM';

// Helper function
const log = (message, data = null) => {
  console.log(`\n[${new Date().toISOString()}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
};

const createRequiredGLAccounts = async () => {
  log('🏦 Creating required GL accounts directly...');
  
  const requiredAccounts = [
    {
      glAccountId: 'GL-INTEREST-INCOME',
      accountName: 'Interest Income',
      accountCategory: 'INCOME',
      accountSubCategory: 'Interest',
      normalBalance: 'CREDIT',
      remarks: 'GL account for interest income from loans'
    },
    {
      glAccountId: 'GL-INTEREST-EXPENSE',
      accountName: 'Interest Expense',
      accountCategory: 'EXPENSE',
      accountSubCategory: 'Interest',
      normalBalance: 'DEBIT',
      remarks: 'GL account for interest expense on savings'
    }
  ];
  
  const results = [];
  
  for (const accountData of requiredAccounts) {
    log(`📋 Creating GL account: ${accountData.glAccountId}`);
    
    try {
      // Check if account already exists
      const existingAccount = await GLAccounts.findOne({
        where: { glAccountId: accountData.glAccountId }
      });
      
      if (existingAccount) {
        log(`⚠️ GL account ${accountData.glAccountId} already exists`);
        results.push({ account: accountData.glAccountId, status: 'EXISTS' });
        continue;
      }
      
      // Create the account
      const glAccount = await GLAccounts.create({
        glAccountId: accountData.glAccountId,
        saccoId: TEST_SACCO_ID,
        accountName: accountData.accountName,
        accountNumber: accountData.glAccountId, // Use glAccountId as accountNumber
        accountCategory: accountData.accountCategory,
        accountSubCategory: accountData.accountSubCategory,
        normalBalance: accountData.normalBalance,
        availableBalance: 0.00,
        status: 'Active',
        remarks: accountData.remarks,
        createdOn: new Date(),
        createdBy: 'System',
        isDeleted: 0
      });
      
      log(`✅ GL account ${accountData.glAccountId} created successfully:`, {
        id: glAccount.id,
        glAccountId: glAccount.glAccountId,
        accountName: glAccount.accountName
      });
      
      results.push({ account: accountData.glAccountId, status: 'CREATED', id: glAccount.id });
      
    } catch (error) {
      log(`❌ Failed to create GL account ${accountData.glAccountId}:`, {
        message: error.message,
        name: error.name
      });
      results.push({ account: accountData.glAccountId, status: 'ERROR', error: error.message });
    }
  }
  
  return results;
};

// Main execution
const main = async () => {
  log('🔧 Starting GL Accounts Creation...');
  
  try {
    // Test database connection
    log('🔌 Testing database connection...');
    await sequelize.authenticate();
    log('✅ Database connection established');
    
    // Create required GL accounts
    log('🚀 Creating required GL accounts...');
    const results = await createRequiredGLAccounts();
    
    log('🎉 GL ACCOUNTS CREATION COMPLETED!');
    log('📊 Results Summary:', {
      total: results.length,
      created: results.filter(r => r.status === 'CREATED').length,
      exists: results.filter(r => r.status === 'EXISTS').length,
      errors: results.filter(r => r.status === 'ERROR').length,
      results: results
    });
    
    if (results.filter(r => r.status === 'ERROR').length === 0) {
      log('✅ All required GL accounts are ready!');
      process.exit(0);
    } else {
      log('⚠️ Some GL accounts had errors, but continuing...');
      process.exit(0);
    }
    
  } catch (error) {
    log('💥 CRITICAL ERROR in GL accounts creation:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  log('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the creation
if (require.main === module) {
  main();
}

module.exports = {
  createRequiredGLAccounts
};
