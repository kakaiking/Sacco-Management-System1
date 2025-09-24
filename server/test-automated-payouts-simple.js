const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testAutomatedPayouts() {
  console.log('🤖 Testing Automated Payout System...');
  
  try {
    // Test the automated payout cycle
    const response = await axios.post(`${BASE_URL}/payouts/auto/test/run-cycle`, {
      saccoId: 'SYSTEM',
      calculationPeriod: 'MONTHLY'
    });
    
    console.log('✅ Automated payout cycle completed successfully!');
    console.log('📊 Results:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ Error testing automated payouts:', error.response?.data || error.message);
  }
}

testAutomatedPayouts();
