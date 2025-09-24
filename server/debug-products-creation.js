const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testProductsCreation() {
  try {
    console.log('Testing products creation...');
    
    const testData = {
      productId: `SAV-${Date.now()}`,
      productName: `Test Savings Product ${Date.now()}`,
      saccoId: 'SYSTEM',
      productType: 'BOSA',
      productStatus: 'Pending',
      status: 'Pending',
      description: 'Test savings product for debugging',
      isSpecial: false
    };
    
    console.log('Sending request with data:', JSON.stringify(testData, null, 2));
    
    const response = await axios.post(`${BASE_URL}/products/test`, testData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Success:', response.status, response.data);
    
  } catch (error) {
    console.error('❌ Error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        method: error.config?.method,
        url: error.config?.url,
        data: error.config?.data
      }
    });
  }
}

testProductsCreation();
