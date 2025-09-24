const axios = require('axios');

async function testDisbursementWorkflow() {
  try {
    console.log('🧪 Testing Loan Disbursement Workflow...\n');
    
    // Step 1: Login as cashier
    console.log('1. Logging in as cashier...');
    const loginResponse = await axios.post('http://localhost:3001/auth/login', {
      username: 'Kamal',
      password: '123456'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful\n');
    
    // Step 2: Check if we have sanctioned loan applications
    console.log('2. Checking for sanctioned loan applications...');
    const loanAppsResponse = await axios.get('http://localhost:3001/loan-applications?status=Sanctioned', {
      headers: { accessToken: token }
    });
    
    const sanctionedApps = loanAppsResponse.data.entity || [];
    console.log(`✅ Found ${sanctionedApps.length} sanctioned loan applications`);
    
    if (sanctionedApps.length === 0) {
      console.log('❌ No sanctioned loan applications found. Please create and sanction a loan application first.');
      return;
    }
    
    // Step 3: Check cashier's till
    console.log('\n3. Checking cashier till...');
    const userId = loginResponse.data.id;
    const tillResponse = await axios.get(`http://localhost:3001/tills/cashier/${userId}`, {
      headers: { accessToken: token }
    });
    
    const till = tillResponse.data.entity;
    console.log(`✅ Till found:`, till ? 'Yes' : 'No');
    
    if (!till) {
      console.log('❌ No active till found for cashier. Please create a till first.');
      return;
    }
    
    console.log(`   Till ID: ${till.tillId}`);
    console.log(`   GL Account: ${till.glAccount?.accountName}`);
    console.log(`   Status: ${till.status}`);
    
    // Step 4: Check account types
    console.log('\n4. Checking account types...');
    const accountTypesResponse = await axios.get('http://localhost:3001/account-types', {
      headers: { accessToken: token }
    });
    
    const accountTypes = accountTypesResponse.data.entity || [];
    console.log(`✅ Found ${accountTypes.length} account types`);
    
    // Step 5: Test disbursement on first sanctioned application
    const testApp = sanctionedApps[0];
    console.log(`\n5. Testing disbursement for loan application: ${testApp.loanApplicationId}`);
    console.log(`   Loan Amount: $${testApp.loanAmount}`);
    console.log(`   Member: ${testApp.member?.firstName} ${testApp.member?.lastName}`);
    console.log(`   Product: ${testApp.product?.loanProductName}`);
    
    try {
      const disbursementResponse = await axios.put(`http://localhost:3001/loan-applications/${testApp.id}/disburse`, {
        status: 'Disbursed'
      }, {
        headers: { accessToken: token }
      });
      
      console.log('✅ Disbursement successful!');
      console.log('Response:', JSON.stringify(disbursementResponse.data, null, 2));
      
      // Step 6: Verify the loan application status changed
      console.log('\n6. Verifying loan application status...');
      const updatedAppResponse = await axios.get(`http://localhost:3001/loan-applications/${testApp.id}`, {
        headers: { accessToken: token }
      });
      
      const updatedApp = updatedAppResponse.data.entity;
      console.log(`✅ Loan application status: ${updatedApp.status}`);
      
      // Step 7: Check if loan account was created
      console.log('\n7. Checking if loan account was created...');
      const accountsResponse = await axios.get('http://localhost:3001/accounts', {
        headers: { accessToken: token }
      });
      
      const accounts = accountsResponse.data.entity || [];
      const loanAccounts = accounts.filter(acc => acc.accountId.startsWith('LA-'));
      console.log(`✅ Found ${loanAccounts.length} loan accounts`);
      
      if (loanAccounts.length > 0) {
        console.log('Latest loan account:', loanAccounts[loanAccounts.length - 1]);
      }
      
      // Step 8: Check if transaction was created
      console.log('\n8. Checking if transaction was created...');
      const transactionsResponse = await axios.get('http://localhost:3001/transactions', {
        headers: { accessToken: token }
      });
      
      const transactions = transactionsResponse.data.entity || [];
      const disbursementTransactions = transactions.filter(txn => txn.transactionType === 'Loan Disbursement');
      console.log(`✅ Found ${disbursementTransactions.length} disbursement transactions`);
      
      if (disbursementTransactions.length > 0) {
        console.log('Latest disbursement transaction:', disbursementTransactions[disbursementTransactions.length - 1]);
      }
      
      console.log('\n🎉 DISBURSEMENT WORKFLOW TEST COMPLETED SUCCESSFULLY!');
      
    } catch (disbursementError) {
      console.log('❌ Disbursement failed:', disbursementError.response?.data || disbursementError.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testDisbursementWorkflow();
