const axios = require('axios');

async function testWithAuth() {
  try {
    // First, let's try to login to get a token
    console.log('Attempting to login...');
    const loginResponse = await axios.post('http://localhost:3001/auth/login', {
      username: 'admin', // You may need to adjust these credentials
      password: 'admin123'
    });
    
    const token = loginResponse.data.accessToken;
    console.log('Login successful, token received');
    
    // Now test the interest frequency endpoint
    console.log('Testing interest frequency endpoint...');
    const response = await axios.post('http://localhost:3001/interest-frequency', {
      interestFrequencyName: 'Weekly',
      description: 'Interest is accrued on weekly basis'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'accessToken': token
      }
    });
    
    console.log('✅ SUCCESS! Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ ERROR:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Wait a moment for server to start, then test
setTimeout(testWithAuth, 3000);