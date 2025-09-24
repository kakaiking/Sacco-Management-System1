const axios = require('axios');

async function testInterestFrequency() {
  try {
    // First, let's try to login to get a token
    const loginResponse = await axios.post('http://localhost:3001/auth/login', {
      username: 'admin', // Assuming admin user exists
      password: 'admin123' // Assuming default password
    });
    
    const token = loginResponse.data.accessToken;
    console.log('Login successful, token received');
    
    // Now test the interest frequency endpoint
    const response = await axios.post('http://localhost:3001/interest-frequency', {
      interestFrequencyName: 'Weekly',
      description: 'Interest is accrued on weekly basis'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'accessToken': token
      }
    });
    
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    console.error('Full error:', error);
  }
}

testInterestFrequency();
