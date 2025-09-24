const axios = require('axios');

async function testRouteExists() {
  try {
    console.log('Testing if route exists (should get auth error, not 404)...');
    
    const response = await axios.post('http://localhost:3001/interest-frequency', {
      interestFrequencyName: 'Weekly',
      description: 'Interest is accrued on weekly basis'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Unexpected success:', response.data);
    
  } catch (error) {
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 401 || error.response.status === 403) {
        console.log('✅ Route exists! Getting authentication error as expected.');
      } else if (error.response.status === 404) {
        console.log('❌ Route not found - this indicates a problem with route registration.');
      }
    } else {
      console.error('Connection error:', error.message);
    }
  }
}

testRouteExists();











