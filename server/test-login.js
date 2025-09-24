const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login...');
    
    // Try to login with common test credentials
    const loginResponse = await axios.post('http://localhost:3001/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    console.log('Login successful!');
    console.log('Token:', loginResponse.data.token);
    console.log('User:', loginResponse.data.username);
    
    return loginResponse.data.token;
  } catch (error) {
    console.error('Login failed:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    
    // Try with different credentials
    try {
      console.log('\nTrying with testuser...');
      const loginResponse2 = await axios.post('http://localhost:3001/auth/login', {
        username: 'testuser',
        password: 'testuser123'
      });
      
      console.log('Login successful with testuser!');
      console.log('Token:', loginResponse2.data.token);
      return loginResponse2.data.token;
    } catch (error2) {
      console.error('Second login attempt failed:');
      console.error('Status:', error2.response?.status);
      console.error('Data:', error2.response?.data);
      return null;
    }
  }
}

testLogin();

