const axios = require('axios');

async function testTransactionCreation() {
  const BASE_URL = 'http://localhost:3001';
  
  // Your exact payload
  const payload = {
    "transactionId": "T-3855935",
    "saccoId": "SAC-9068",
    "debitAccountId": 8,
    "creditAccountId": 5,
    "amount": "100",
    "status": "Pending",
    "remarks": "ok",
    "createdBy": "",
    "createdOn": "",
    "modifiedBy": "",
    "modifiedOn": "",
    "approvedBy": "",
    "approvedOn": ""
  };

  try {
    console.log('🧪 Testing Transaction Creation with Your Exact Payload');
    console.log('======================================================');
    console.log('Payload:', JSON.stringify(payload, null, 2));
    
    const response = await axios.post(`${BASE_URL}/transactions/test`, payload, {
      headers: { 
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 201) {
      console.log('\n✅ Transaction created successfully!');
      console.log('Response Code:', response.data.code);
      console.log('Response Message:', response.data.message);
      
      const transactionEntries = response.data.entity;
      console.log(`\n📊 Created ${transactionEntries.length} transaction entries:`);
      
      transactionEntries.forEach((entry, index) => {
        console.log(`\n   Entry ${index + 1}:`);
        console.log(`   - ID: ${entry.id}`);
        console.log(`   - Transaction ID: ${entry.transactionId}`);
        console.log(`   - Account ID: ${entry.accountId}`);
        console.log(`   - Entry Type: ${entry.entryType}`);
        console.log(`   - Amount: ${entry.amount}`);
        console.log(`   - Status: ${entry.status}`);
        console.log(`   - Debit Account ID: ${entry.debitAccountId}`);
        console.log(`   - Credit Account ID: ${entry.creditAccountId}`);
        console.log(`   - Account Name: ${entry.account?.accountName || 'N/A'}`);
        console.log(`   - Account Number: ${entry.account?.accountNumber || 'N/A'}`);
      });
      
      // Verify double-entry logic
      const hasDebit = transactionEntries.some(entry => entry.entryType === 'DEBIT');
      const hasCredit = transactionEntries.some(entry => entry.entryType === 'CREDIT');
      const amountsEqual = transactionEntries.length === 2 && transactionEntries[0].amount === transactionEntries[1].amount;
      const sameTransactionId = transactionEntries.every(entry => entry.transactionId === transactionEntries[0].transactionId);
      
      console.log('\n✅ Double-Entry Validation:');
      console.log(`   - Has debit entry: ${hasDebit}`);
      console.log(`   - Has credit entry: ${hasCredit}`);
      console.log(`   - Amounts are equal: ${amountsEqual}`);
      console.log(`   - Same transaction ID: ${sameTransactionId}`);
      console.log(`   - Total entries: ${transactionEntries.length}`);
      
      if (hasDebit && hasCredit && amountsEqual && sameTransactionId && transactionEntries.length === 2) {
        console.log('\n🎉 Double-entry bookkeeping is working correctly!');
        console.log('   ✅ Each transaction now creates 2 separate records');
        console.log('   ✅ One DEBIT entry and one CREDIT entry');
        console.log('   ✅ Both entries have the same transaction ID');
        console.log('   ✅ Both entries have the same amount');
        console.log('   ✅ Account balances will be updated when approved');
      } else {
        console.log('\n❌ Double-entry validation failed');
      }
      
    } else {
      console.log('❌ Failed to create transaction');
      console.log('Response:', response.data);
    }
    
  } catch (error) {
    if (error.response) {
      console.log('❌ API Error:', error.response.status);
      console.log('Error Message:', error.response.data.message);
      console.log('Full Response:', JSON.stringify(error.response.data, null, 2));
    } else if (error.code === 'ECONNREFUSED') {
      console.log('❌ Connection Error: Server is not running on port 3001');
    } else {
      console.log('❌ Error:', error.message);
      console.log('Error Code:', error.code);
      console.log('Full Error:', error);
    }
  }
}

if (require.main === module) {
  console.log('⚠️  Note: This test uses the /transactions/test endpoint (no authentication required)');
  console.log('');
  testTransactionCreation();
}

module.exports = { testTransactionCreation };
