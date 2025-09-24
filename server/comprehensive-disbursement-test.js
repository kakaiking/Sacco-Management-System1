const axios = require('axios');

async function comprehensiveDisbursementTest() {
  try {
    console.log('🔍 Comprehensive Disbursement Test...\n');
    
    // Step 1: Login as Kamal
    console.log('1. Logging in as Kamal...');
    const loginResponse = await axios.post('http://localhost:3001/auth/login', {
      username: 'Kamal',
      password: '123456'
    });
    
    const token = loginResponse.data.token;
    const userId = loginResponse.data.id;
    console.log('✅ Login successful');
    console.log(`   User ID: ${userId}`);
    console.log(`   Role: ${loginResponse.data.role}\n`);
    
    // Step 2: Get sanctioned loan applications
    console.log('2. Getting sanctioned loan applications...');
    const loanAppsResponse = await axios.get('http://localhost:3001/loan-applications?status=Sanctioned', {
      headers: { accessToken: token }
    });
    
    const sanctionedApps = loanAppsResponse.data.entity || [];
    console.log(`✅ Found ${sanctionedApps.length} sanctioned loan applications\n`);
    
    if (sanctionedApps.length === 0) {
      console.log('❌ No sanctioned loan applications found');
      return;
    }
    
    const testApp = sanctionedApps[0];
    console.log(`Testing with loan application: ${testApp.loanApplicationId}`);
    console.log(`   Amount: $${testApp.loanAmount}`);
    console.log(`   Member: ${testApp.member?.firstName} ${testApp.member?.lastName}`);
    console.log(`   Product: ${testApp.product?.loanProductName}\n`);
    
    // Step 3: Check till
    console.log('3. Checking till...');
    const tillResponse = await axios.get(`http://localhost:3001/tills/cashier/${userId}`, {
      headers: { accessToken: token }
    });
    
    const till = tillResponse.data.entity;
    if (!till) {
      console.log('❌ No till found for cashier');
      return;
    }
    
    console.log('✅ Till found');
    console.log(`   Till ID: ${till.tillId}`);
    console.log(`   GL Account ID: ${till.glAccountId}\n`);
    
    // Step 4: Check GL account balance
    console.log('4. Checking GL account balance...');
    const glAccountResponse = await axios.get(`http://localhost:3001/gl-accounts/${till.glAccountId}`, {
      headers: { accessToken: token }
    });
    
    const glAccount = glAccountResponse.data.entity;
    console.log('✅ GL Account found');
    console.log(`   Account: ${glAccount.accountName}`);
    console.log(`   Available Balance: $${glAccount.availableBalance}`);
    console.log(`   Required Amount: $${testApp.loanAmount}\n`);
    
    if (parseFloat(glAccount.availableBalance) < parseFloat(testApp.loanAmount)) {
      console.log('❌ Insufficient balance in GL account');
      return;
    }
    
    // Step 5: Check account type
    console.log('5. Checking account type...');
    const expectedAccountTypeName = testApp.product.loanProductName + " Account Type";
    console.log(`   Looking for: "${expectedAccountTypeName}"`);
    
    const accountTypesResponse = await axios.get('http://localhost:3001/account-types', {
      headers: { accessToken: token }
    });
    
    const accountTypes = accountTypesResponse.data.entity || [];
    const matchingAccountType = accountTypes.find(at => at.accountTypeName === expectedAccountTypeName);
    
    if (!matchingAccountType) {
      console.log('❌ Account type not found');
      console.log('Available account types:');
      accountTypes.forEach(at => console.log(`   - ${at.accountTypeName}`));
      return;
    }
    
    console.log('✅ Account type found');
    console.log(`   Account Type ID: ${matchingAccountType.id}\n`);
    
    // Step 6: Test disbursement
    console.log('6. Testing disbursement...');
    try {
      const disbursementResponse = await axios.put(`http://localhost:3001/loan-applications/${testApp.id}/disburse`, {
        status: 'Disbursed'
      }, {
        headers: { accessToken: token }
      });
      
      console.log('🎉 DISBURSEMENT SUCCESSFUL!');
      console.log('Response:', JSON.stringify(disbursementResponse.data, null, 2));
      
      // Step 7: Verify results
      console.log('\n7. Verifying results...');
      
      // Check loan application status
      const updatedAppResponse = await axios.get(`http://localhost:3001/loan-applications/${testApp.id}`, {
        headers: { accessToken: token }
      });
      
      const updatedApp = updatedAppResponse.data.entity;
      console.log(`✅ Loan application status: ${updatedApp.status}`);
      
      // Check if loan account was created
      const accountsResponse = await axios.get('http://localhost:3001/accounts', {
        headers: { accessToken: token }
      });
      
      const accounts = accountsResponse.data.entity || [];
      const loanAccounts = accounts.filter(acc => acc.accountId.startsWith('LA-'));
      console.log(`✅ Found ${loanAccounts.length} loan accounts`);
      
      if (loanAccounts.length > 0) {
        const latestLoanAccount = loanAccounts[loanAccounts.length - 1];
        console.log(`   Latest loan account: ${latestLoanAccount.accountId}`);
        console.log(`   Account name: ${latestLoanAccount.accountName}`);
        console.log(`   Balance: $${latestLoanAccount.availableBalance}`);
      }
      
      // Check if transaction was created
      const transactionsResponse = await axios.get('http://localhost:3001/transactions', {
        headers: { accessToken: token }
      });
      
      const transactions = transactionsResponse.data.entity || [];
      const disbursementTransactions = transactions.filter(txn => txn.transactionType === 'Loan Disbursement');
      console.log(`✅ Found ${disbursementTransactions.length} disbursement transactions`);
      
      if (disbursementTransactions.length > 0) {
        const latestTransaction = disbursementTransactions[disbursementTransactions.length - 1];
        console.log(`   Latest transaction: ${latestTransaction.transactionId}`);
        console.log(`   Amount: $${latestTransaction.amount}`);
        console.log(`   Status: ${latestTransaction.status}`);
      }
      
    } catch (disbursementError) {
      console.log('❌ Disbursement failed:');
      console.log('Status:', disbursementError.response?.status);
      console.log('Data:', disbursementError.response?.data);
      console.log('Message:', disbursementError.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

comprehensiveDisbursementTest();

