const axios = require('axios');

async function testSimpleAPI() {
  try {
    console.log('=== SIMPLE API TEST ===\n');
    
    // Test 1: Check if server is running
    console.log('1. Testing server connection...');
    try {
      const healthResponse = await axios.get('http://localhost:3001/');
      console.log('✓ Server is running');
    } catch (error) {
      console.log('✗ Server is not running or not accessible');
      console.log('Error:', error.message);
      return;
    }
    
    // Test 2: Get authentication token
    console.log('\n2. Getting authentication token...');
    const loginResponse = await axios.post('http://localhost:3001/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    const validToken = loginResponse.data.token;
    console.log('✓ Got valid token');
    
    // Test 3: Test GET products endpoint
    console.log('\n3. Testing GET products endpoint...');
    const getResponse = await axios.get('http://localhost:3001/products', {
      headers: { 
        accessToken: validToken
      }
    });
    
    console.log('✓ GET products successful');
    console.log('Response code:', getResponse.data.code);
    console.log('Products count:', getResponse.data.entity?.length || 0);
    
    // Test 4: Test POST products endpoint with minimal data
    console.log('\n4. Testing POST products endpoint...');
    const testProduct = {
      productId: `P-SIMPLE${Date.now()}`,
      productName: "Simple Test Product",
      saccoId: "SAC-9068",
      currency: "USD"
    };
    
    console.log('Sending product data:', JSON.stringify(testProduct, null, 2));
    
    const postResponse = await axios.post('http://localhost:3001/products', testProduct, {
      headers: { 
        accessToken: validToken
      }
    });
    
    console.log('✓ POST products successful');
    console.log('Response:', JSON.stringify(postResponse.data, null, 2));
    
  } catch (error) {
    console.error('=== ERROR ===');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('Full error:', error.message);
  }
}

testSimpleAPI();



