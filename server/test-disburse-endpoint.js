const axios = require('axios');

async function testDisburseEndpoint() {
  try {
    console.log('Testing disbursement endpoint...');
    
    // Login as Kamal
    const loginResponse = await axios.post('http://localhost:3001/auth/login', {
      username: 'Kamal',
      password: '123456'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Test the disbursement endpoint
    const testResponse = await axios.put('http://localhost:3001/loan-applications/21/disburse', {
      status: 'Disbursed'
    }, {
      headers: { accessToken: token }
    });
    
    console.log('✅ Disbursement endpoint works!');
    console.log('Response:', JSON.stringify(testResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Endpoint test failed:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
}

testDisburseEndpoint();

