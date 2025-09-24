const axios = require('axios');

async function testKamalLogin() {
  try {
    console.log('Testing Kamal login...');
    
    const response = await axios.post('http://localhost:3001/auth/login', {
      username: 'Kamal',
      password: '123456'
    });
    
    console.log('Login successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
  }
}

testKamalLogin();

