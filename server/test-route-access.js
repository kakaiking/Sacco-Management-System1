const axios = require('axios');

async function testRouteAccess() {
  try {
    console.log('Testing route access...');
    
    // Login as Kamal
    const loginResponse = await axios.post('http://localhost:3001/auth/login', {
      username: 'Kamal',
      password: '123456'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Test a simple GET request to loan applications
    console.log('\nTesting GET /loan-applications...');
    const getResponse = await axios.get('http://localhost:3001/loan-applications', {
      headers: { accessToken: token }
    });
    console.log('✅ GET request successful');
    
    // Test a simple PUT request to loan applications (status update)
    console.log('\nTesting PUT /loan-applications/21/status...');
    const putResponse = await axios.put('http://localhost:3001/loan-applications/21/status', {
      status: 'Sanctioned'
    }, {
      headers: { accessToken: token }
    });
    console.log('✅ PUT status request successful');
    
    // Now test the disbursement endpoint
    console.log('\nTesting PUT /loan-applications/21/disburse...');
    const disburseResponse = await axios.put('http://localhost:3001/loan-applications/21/disburse', {
      status: 'Disbursed'
    }, {
      headers: { accessToken: token }
    });
    console.log('✅ Disbursement request successful');
    
  } catch (error) {
    console.error('❌ Route test failed:');
    console.error('URL:', error.config?.url);
    console.error('Method:', error.config?.method);
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
}

testRouteAccess();

