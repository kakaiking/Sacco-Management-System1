const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// Test data
const testPayout = {
  saccoId: 'SACCO001',
  payoutType: 'INTEREST_PAYOUT',
  payoutCategory: 'PRODUCT_INTEREST',
  accountId: 'ACC001',
  principalAmount: 10000,
  interestRate: 0.05, // 5%
  calculationPeriod: 'MONTHLY',
  periodStartDate: '2025-01-01',
  periodEndDate: '2025-01-31',
  payoutDate: '2025-01-31',
  remarks: 'Test interest payout'
};

async function testPayoutsAPI() {
  console.log('🧪 Testing Payouts API...\n');

  try {
    // Test 1: Create a payout
    console.log('1. Testing CREATE payout...');
    const createResponse = await axios.post(`${BASE_URL}/payouts`, testPayout, {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });
    
    if (createResponse.data.success) {
      console.log('✅ Create payout successful');
      console.log('   Payout ID:', createResponse.data.data.payoutId);
      console.log('   Interest Amount:', createResponse.data.data.interestAmount);
      
      const payoutId = createResponse.data.data.id;
      
      // Test 2: Get all payouts
      console.log('\n2. Testing GET all payouts...');
      const getAllResponse = await axios.get(`${BASE_URL}/payouts`, {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });
      
      if (getAllResponse.data.success) {
        console.log('✅ Get all payouts successful');
        console.log('   Total payouts:', getAllResponse.data.data.pagination.totalItems);
      }
      
      // Test 3: Get single payout
      console.log('\n3. Testing GET single payout...');
      const getSingleResponse = await axios.get(`${BASE_URL}/payouts/${payoutId}`, {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });
      
      if (getSingleResponse.data.success) {
        console.log('✅ Get single payout successful');
        console.log('   Payout ID:', getSingleResponse.data.data.payoutId);
      }
      
      // Test 4: Update payout
      console.log('\n4. Testing UPDATE payout...');
      const updateResponse = await axios.put(`${BASE_URL}/payouts/${payoutId}`, {
        remarks: 'Updated test payout'
      }, {
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        }
      });
      
      if (updateResponse.data.success) {
        console.log('✅ Update payout successful');
      }
      
      // Test 5: Process payout
      console.log('\n5. Testing PROCESS payout...');
      const processResponse = await axios.post(`${BASE_URL}/payouts/${payoutId}/process`, {}, {
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        }
      });
      
      if (processResponse.data.success) {
        console.log('✅ Process payout successful');
        console.log('   Transaction Reference:', processResponse.data.data.transactionReference);
      }
      
      // Test 6: Get payout statistics
      console.log('\n6. Testing GET payout statistics...');
      const statsResponse = await axios.get(`${BASE_URL}/payouts/stats/summary`, {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });
      
      if (statsResponse.data.success) {
        console.log('✅ Get payout statistics successful');
        console.log('   Stats:', statsResponse.data.data.stats);
      }
      
    } else {
      console.log('❌ Create payout failed:', createResponse.data.message);
    }
    
  } catch (error) {
    console.error('❌ API Test failed:', error.response?.data?.message || error.message);
  }
  
  console.log('\n🏁 Payouts API testing completed!');
}

// Run the test
testPayoutsAPI();
