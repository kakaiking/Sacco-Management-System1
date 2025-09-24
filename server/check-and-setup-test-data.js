const { sequelize, Accounts, GLAccounts, Sacco, Members, Products } = require('./models');

async function checkAndSetupTestData() {
  try {
    console.log('🔍 Checking existing data...\n');
    
    // Check existing Saccos
    const saccos = await Sacco.findAll();
    console.log(`Found ${saccos.length} Saccos`);
    if (saccos.length === 0) {
      console.log('❌ No Saccos found. Please create a SACCO first.');
      return;
    }
    
    // Check existing Members
    const members = await Members.findAll();
    console.log(`Found ${members.length} Members`);
    
    // Check existing Products
    const products = await Products.findAll();
    console.log(`Found ${products.length} Products`);
    
    // Check existing Accounts
    const accounts = await Accounts.findAll({
      include: [
        { model: Members, as: 'member' },
        { model: Products, as: 'product' }
      ]
    });
    console.log(`Found ${accounts.length} Member Accounts`);
    
    // Check existing GL Accounts
    const glAccounts = await GLAccounts.findAll();
    console.log(`Found ${glAccounts.length} GL Accounts`);
    
    // Display existing accounts
    if (accounts.length > 0) {
      console.log('\n📋 Existing Member Accounts:');
      accounts.slice(0, 5).forEach((account, index) => {
        console.log(`${index + 1}. ${account.accountName} (${account.accountNumber})`);
        console.log(`   Clear Balance: ${account.clearBalance || 0}`);
        console.log(`   Debit Balance: ${account.debitBalance || 0}`);
        console.log(`   Credit Balance: ${account.creditBalance || 0}`);
        console.log(`   Available Balance: ${account.availableBalance || 0}`);
      });
    }
    
    if (glAccounts.length > 0) {
      console.log('\n📋 Existing GL Accounts:');
      glAccounts.slice(0, 3).forEach((account, index) => {
        console.log(`${index + 1}. ${account.accountName} (${account.glAccountNumber})`);
        console.log(`   Available Balance: ${account.availableBalance || 0}`);
      });
    }
    
    // Check if we have enough accounts for testing
    if (accounts.length < 2) {
      console.log('\n⚠️  Not enough member accounts for testing. Need at least 2 accounts.');
    }
    
    if (glAccounts.length < 1) {
      console.log('\n⚠️  No GL accounts found. Need at least 1 GL account for testing.');
    }
    
    // If we have enough data, show test scenarios
    if (accounts.length >= 2 && glAccounts.length >= 1) {
      console.log('\n✅ Ready for testing! Here are the test scenarios:');
      console.log('\n1. Transfer Transaction:');
      console.log(`   Debit Account: ${accounts[0].accountName} (${accounts[0].accountId})`);
      console.log(`   Credit Account: ${accounts[1].accountName} (${accounts[1].accountId})`);
      
      console.log('\n2. Cash Transaction:');
      console.log(`   Member Account: ${accounts[0].accountName} (${accounts[0].accountId})`);
      console.log(`   Till GL Account: ${glAccounts[0].accountName} (${glAccounts[0].glAccountId})`);
      
      console.log('\n3. Smart Teller Transaction:');
      console.log(`   Account 1: ${accounts[0].accountName} (${accounts[0].accountId})`);
      console.log(`   Account 2: ${accounts[1].accountName} (${accounts[1].accountId})`);
      console.log(`   GL Account: ${glAccounts[0].accountName} (${glAccounts[0].glAccountId})`);
      
      console.log('\n📝 Test Data Summary:');
      console.log(`SACCO ID: ${saccos[0].saccoId}`);
      console.log(`Member Account 1: ${accounts[0].accountId}`);
      console.log(`Member Account 2: ${accounts[1].accountId}`);
      console.log(`GL Account 1: ${glAccounts[0].glAccountId}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking data:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkAndSetupTestData();
