const axios = require('axios');

async function testProductCreation() {
  try {
    console.log('Testing product creation...');
    
    const testProduct = {
      productId: "P-123456",
      productName: "Test Savings Product",
      saccoId: "SAC-9068",
      currency: "USD",
      productType: "BOSA",
      productStatus: "Pending",
      status: "Pending",
      interestRate: 12.5,
      interestType: "Simple",
      interestCalculationRule: "Daily",
      interestFrequency: "Monthly",
      isCreditInterest: true,
      isDebitInterest: false,
      needGuarantors: false,
      maxGuarantors: null,
      minGuarantors: null,
      isSpecial: false,
      maxSpecialUsers: null,
      appliedOnMemberOnboarding: false,
      isWithdrawable: true,
      withdrawableFrom: null,
      chargeIds: null,
      createdBy: "TestUser",
      createdOn: new Date().toISOString(),
      modifiedBy: "TestUser",
      modifiedOn: new Date().toISOString()
    };

    // First get a valid token
    const loginResponse = await axios.post('http://localhost:3001/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    const validToken = loginResponse.data.token;
    console.log('Got valid token:', validToken.substring(0, 50) + '...');

    const response = await axios.post('http://localhost:3001/products', testProduct, {
      headers: { 
        accessToken: validToken
      }
    });
    
    console.log('Success:', response.data);
  } catch (error) {
    console.error('Error details:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Data:', error.response?.data);
    console.error('Full error:', error.message);
  }
}

testProductCreation();
