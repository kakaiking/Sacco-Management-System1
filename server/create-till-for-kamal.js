const axios = require('axios');

async function createTillForKamal() {
  try {
    console.log('Creating till for Kamal...');
    
    // Login as Kamal
    const loginResponse = await axios.post('http://localhost:3001/auth/login', {
      username: 'Kamal',
      password: '123456'
    });
    
    const token = loginResponse.data.token;
    const userId = loginResponse.data.id;
    const saccoId = loginResponse.data.saccoId;
    
    console.log('✅ Login successful');
    console.log(`   User ID: ${userId}`);
    console.log(`   SACCO ID: ${saccoId}`);
    
    // Get GL accounts
    console.log('\nGetting GL accounts...');
    const glAccountsResponse = await axios.get('http://localhost:3001/gl-accounts', {
      headers: { accessToken: token }
    });
    
    const glAccounts = glAccountsResponse.data.entity || [];
    console.log(`✅ Found ${glAccounts.length} GL accounts`);
    
    // Find a suitable GL account (preferably cash or bank)
    const cashGLAccount = glAccounts.find(acc => 
      acc.accountName.toLowerCase().includes('cash') || 
      acc.accountName.toLowerCase().includes('bank')
    ) || glAccounts[0];
    
    console.log(`   Using GL Account: ${cashGLAccount.accountName} (ID: ${cashGLAccount.id})`);
    
    // Create till
    console.log('\nCreating till...');
    const tillData = {
      tillId: `T-${Date.now()}`,
      tillName: `Kamal's Till`,
      cashierId: userId,
      glAccountId: cashGLAccount.id,
      saccoId: saccoId,
      status: 'Active',
      isActive: 1,
      createdBy: 'Kamal'
    };
    
    const tillResponse = await axios.post('http://localhost:3001/tills', tillData, {
      headers: { accessToken: token }
    });
    
    console.log('✅ Till created successfully!');
    console.log('Response:', JSON.stringify(tillResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
  }
}

createTillForKamal();
