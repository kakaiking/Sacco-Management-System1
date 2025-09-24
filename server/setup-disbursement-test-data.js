const axios = require('axios');

async function setupTestData() {
  try {
    console.log('🔧 Setting up test data for disbursement workflow...\n');
    
    // Step 1: Login
    console.log('1. Logging in...');
    const loginResponse = await axios.post('http://localhost:3001/auth/login', {
      username: 'Kamal',
      password: '123456'
    });
    
    const token = loginResponse.data.token;
    const userId = loginResponse.data.id;
    const saccoId = loginResponse.data.saccoId;
    console.log('✅ Login successful');
    console.log(`   User ID: ${userId}`);
    console.log(`   SACCO ID: ${saccoId}\n`);
    
    // Step 2: Check if we have GL accounts
    console.log('2. Checking GL accounts...');
    const glAccountsResponse = await axios.get('http://localhost:3001/gl-accounts', {
      headers: { accessToken: token }
    });
    
    const glAccounts = glAccountsResponse.data.entity || [];
    console.log(`✅ Found ${glAccounts.length} GL accounts`);
    
    if (glAccounts.length === 0) {
      console.log('❌ No GL accounts found. Please create GL accounts first.');
      return;
    }
    
    // Find a suitable GL account for till (preferably cash or bank account)
    const cashGLAccount = glAccounts.find(acc => 
      acc.accountName.toLowerCase().includes('cash') || 
      acc.accountName.toLowerCase().includes('bank') ||
      acc.accountCategory === 'Asset'
    ) || glAccounts[0];
    
    console.log(`   Using GL Account: ${cashGLAccount.accountName} (ID: ${cashGLAccount.id})`);
    
    // Step 3: Create a till for the user
    console.log('\n3. Creating till for user...');
    const tillData = {
      tillId: `T-${Date.now()}`,
      cashierId: userId,
      glAccountId: cashGLAccount.id,
      saccoId: saccoId,
      status: 'Active',
      isActive: 1,
      createdBy: 'admin'
    };
    
    try {
      const tillResponse = await axios.post('http://localhost:3001/tills', tillData, {
        headers: { accessToken: token }
      });
      
      console.log('✅ Till created successfully');
      console.log(`   Till ID: ${tillResponse.data.entity.tillId}`);
    } catch (tillError) {
      if (tillError.response?.data?.message?.includes('already exists')) {
        console.log('✅ Till already exists for this user');
      } else {
        console.log('❌ Failed to create till:', tillError.response?.data?.message);
        return;
      }
    }
    
    // Step 4: Check account types
    console.log('\n4. Checking account types...');
    const accountTypesResponse = await axios.get('http://localhost:3001/account-types', {
      headers: { accessToken: token }
    });
    
    const accountTypes = accountTypesResponse.data.entity || [];
    console.log(`✅ Found ${accountTypes.length} account types`);
    
    // Check if we have loan account types
    const loanAccountTypes = accountTypes.filter(at => 
      at.accountTypeName.toLowerCase().includes('loan')
    );
    
    if (loanAccountTypes.length === 0) {
      console.log('⚠️  No loan account types found. Creating one...');
      
      // Create a loan account type
      const loanAccountTypeData = {
        accountTypeId: `AT-${Date.now()}`,
        accountTypeName: 'Personal Loan Account',
        description: 'Account type for personal loans',
        createdBy: 'admin'
      };
      
      try {
        const accountTypeResponse = await axios.post('http://localhost:3001/account-types', loanAccountTypeData, {
          headers: { accessToken: token }
        });
        
        console.log('✅ Loan account type created');
      } catch (accountTypeError) {
        console.log('❌ Failed to create loan account type:', accountTypeError.response?.data?.message);
      }
    } else {
      console.log(`✅ Found ${loanAccountTypes.length} loan account types`);
    }
    
    // Step 5: Check if we have sanctioned loan applications
    console.log('\n5. Checking sanctioned loan applications...');
    const loanAppsResponse = await axios.get('http://localhost:3001/loan-applications?status=Sanctioned', {
      headers: { accessToken: token }
    });
    
    const sanctionedApps = loanAppsResponse.data.entity || [];
    console.log(`✅ Found ${sanctionedApps.length} sanctioned loan applications`);
    
    if (sanctionedApps.length === 0) {
      console.log('⚠️  No sanctioned loan applications found. You may need to create and sanction a loan application first.');
    }
    
    console.log('\n🎉 Test data setup completed!');
    console.log('\nYou can now run the disbursement workflow test.');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.response?.data || error.message);
  }
}

setupTestData();
