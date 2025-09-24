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
    console.log('🧪 Testing Transaction Creation with Your Payload');
    console.log('================================================');
    console.log('Payload:', JSON.stringify(payload, null, 2));
    
    const response = await axios.post(`${BASE_URL}/transactions`, payload, {
      headers: { 
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 201) {
      console.log('\n✅ Transaction created successfully!');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      
      const transactionEntries = response.data.entity;
      console.log(`\n📊 Created ${transactionEntries.length} transaction entries:`);
      
      transactionEntries.forEach((entry, index) => {
        console.log(`\n   Entry ${index + 1}:`);
        console.log(`   - Transaction ID: ${entry.transactionId}`);
        console.log(`   - Account ID: ${entry.accountId}`);
        console.log(`   - Entry Type: ${entry.entryType}`);
        console.log(`   - Amount: ${entry.amount}`);
        console.log(`   - Status: ${entry.status}`);
        console.log(`   - Debit Account ID: ${entry.debitAccountId}`);
        console.log(`   - Credit Account ID: ${entry.creditAccountId}`);
      });
      
    } else {
      console.log('❌ Failed to create transaction');
      console.log('Response:', response.data);
    }
    
  } catch (error) {
    if (error.response) {
      console.log('❌ API Error:', error.response.status);
      console.log('Error Message:', error.response.data.message);
      console.log('Full Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

if (require.main === module) {
  console.log('⚠️  Note: Make sure your server is running on port 3001');
  console.log('');
  testTransactionCreation();
}

module.exports = { testTransactionCreation };
