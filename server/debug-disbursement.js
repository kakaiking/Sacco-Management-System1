const axios = require('axios');

async function debugDisbursement() {
  try {
    console.log('Debugging disbursement process...');
    
    // Login as Kamal
    const loginResponse = await axios.post('http://localhost:3001/auth/login', {
      username: 'Kamal',
      password: '123456'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Get the loan application details
    console.log('\n1. Getting loan application details...');
    const loanAppResponse = await axios.get('http://localhost:3001/loan-applications/21', {
      headers: { accessToken: token }
    });
    
    const loanApp = loanAppResponse.data.entity;
    console.log('Loan Application:', {
      id: loanApp.id,
      loanName: loanApp.loanName,
      member: loanApp.member ? `${loanApp.member.firstName} ${loanApp.member.lastName}` : 'No member',
      product: loanApp.product ? loanApp.product.loanProductName : 'No product',
      status: loanApp.status
    });
    
    // Check account types
    console.log('\n2. Checking account types...');
    const accountTypesResponse = await axios.get('http://localhost:3001/account-types', {
      headers: { accessToken: token }
    });
    
    const accountTypes = accountTypesResponse.data.entity || [];
    console.log(`Found ${accountTypes.length} account types`);
    
    // Look for loan account types
    const loanAccountTypes = accountTypes.filter(at => 
      at.accountTypeName.toLowerCase().includes('loan')
    );
    console.log(`Found ${loanAccountTypes.length} loan account types:`, loanAccountTypes.map(at => at.accountTypeName));
    
    // Check what account type name we're looking for
    const expectedAccountTypeName = loanApp.product.loanProductName + " Account";
    console.log(`\n3. Looking for account type: "${expectedAccountTypeName}"`);
    
    const matchingAccountType = accountTypes.find(at => at.accountTypeName === expectedAccountTypeName);
    console.log('Matching account type found:', matchingAccountType ? 'Yes' : 'No');
    
    if (!matchingAccountType) {
      console.log('Available account types:');
      accountTypes.forEach(at => console.log(`  - ${at.accountTypeName}`));
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.response?.data || error.message);
  }
}

debugDisbursement();

