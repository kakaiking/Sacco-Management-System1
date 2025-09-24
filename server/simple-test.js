const axios = require('axios');

async function testEndpoint() {
  try {
    // Test without authentication first to see if route exists
    const response = await axios.post('http://localhost:3001/interest-frequency', {
      interestFrequencyName: 'Weekly',
      description: 'Interest is accrued on weekly basis'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

testEndpoint();











