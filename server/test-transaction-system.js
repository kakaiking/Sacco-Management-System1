const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test data
const testData = {
  saccoId: '1',
  memberAccountId: '1',
  tillGlAccountId: '2',
  debitAccountId: '1',
  creditAccountId: '3',
  amount: 1000.00
};

// Helper function to make authenticated requests
async function makeRequest(method, url, data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // You may need to get a real token
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Error ${method} ${url}:`, error.response?.data || error.message);
    throw error;
  }
}

// Test 1: Create a pending transfer transaction
async function testPendingTransferTransaction() {
  console.log('\n=== Testing Pending Transfer Transaction ===');
  
  const transferData = {
    saccoId: testData.saccoId,
    debitAccountId: testData.debitAccountId,
    creditAccountId: testData.creditAccountId,
    amount: testData.amount,
    status: 'Pending',
    remarks: 'Test pending transfer transaction'
  };
  
  try {
    const result = await makeRequest('POST', '/transactions', transferData);
    console.log('✅ Pending transfer transaction created:', result.message);
    console.log('Reference Number:', result.entity[0]?.referenceNumber);
    return result.entity[0]?.referenceNumber;
  } catch (error) {
    console.log('❌ Failed to create pending transfer transaction');
    return null;
  }
}

// Test 2: Create a pending cash transaction
async function testPendingCashTransaction() {
  console.log('\n=== Testing Pending Cash Transaction ===');
  
  const cashData = {
    saccoId: testData.saccoId,
    memberAccountId: testData.memberAccountId,
    tillGlAccountId: testData.tillGlAccountId,
    amount: testData.amount,
    transactionType: 'credit', // Deposit
    status: 'Pending',
    remarks: 'Test pending cash deposit'
  };
  
  try {
    const result = await makeRequest('POST', '/transactions/cash', cashData);
    console.log('✅ Pending cash transaction created:', result.message);
    console.log('Reference Number:', result.entity[0]?.referenceNumber);
    return result.entity[0]?.referenceNumber;
  } catch (error) {
    console.log('❌ Failed to create pending cash transaction');
    return null;
  }
}

// Test 3: Create a pending Smart Teller transaction
async function testPendingSmartTellerTransaction() {
  console.log('\n=== Testing Pending Smart Teller Transaction ===');
  
  const smartTellerData = {
    saccoId: testData.saccoId,
    entries: [
      {
        accountId: testData.memberAccountId,
        accountType: 'MEMBER',
        type: 'debit',
        amount: testData.amount,
        remarks: 'Test debit entry'
      },
      {
        accountId: testData.tillGlAccountId,
        accountType: 'GL',
        type: 'credit',
        amount: testData.amount,
        remarks: 'Test credit entry'
      }
    ],
    status: 'Pending',
    remarks: 'Test pending smart teller transaction'
  };
  
  try {
    const result = await makeRequest('POST', '/smart-teller', smartTellerData);
    console.log('✅ Pending smart teller transaction created:', result.message);
    console.log('Reference Number:', result.entity[0]?.referenceNumber);
    return result.entity[0]?.referenceNumber;
  } catch (error) {
    console.log('❌ Failed to create pending smart teller transaction');
    return null;
  }
}

// Test 4: Approve a transaction
async function testApproveTransaction(referenceNumber) {
  console.log('\n=== Testing Transaction Approval ===');
  
  try {
    const result = await makeRequest('PUT', `/transactions/reference/${referenceNumber}/approve`);
    console.log('✅ Transaction approved:', result.message);
    return true;
  } catch (error) {
    console.log('❌ Failed to approve transaction');
    return false;
  }
}

// Test 5: Create an approved transfer transaction
async function testApprovedTransferTransaction() {
  console.log('\n=== Testing Approved Transfer Transaction ===');
  
  const transferData = {
    saccoId: testData.saccoId,
    debitAccountId: testData.debitAccountId,
    creditAccountId: testData.creditAccountId,
    amount: testData.amount,
    status: 'Approved',
    remarks: 'Test approved transfer transaction'
  };
  
  try {
    const result = await makeRequest('POST', '/transactions', transferData);
    console.log('✅ Approved transfer transaction created:', result.message);
    console.log('Reference Number:', result.entity[0]?.referenceNumber);
    return result.entity[0]?.referenceNumber;
  } catch (error) {
    console.log('❌ Failed to create approved transfer transaction');
    return null;
  }
}

// Test 6: Get all transactions
async function testGetTransactions() {
  console.log('\n=== Testing Get All Transactions ===');
  
  try {
    const result = await makeRequest('GET', '/transactions');
    console.log('✅ Transactions fetched:', result.message);
    console.log('Total transactions:', result.entity?.length || 0);
    
    // Display recent transactions
    if (result.entity && result.entity.length > 0) {
      console.log('\nRecent transactions:');
      result.entity.slice(0, 5).forEach((txn, index) => {
        console.log(`${index + 1}. Ref: ${txn.referenceNumber}, Status: ${txn.status}, Amount: ${txn.amount}`);
      });
    }
    
    return result.entity;
  } catch (error) {
    console.log('❌ Failed to fetch transactions');
    return null;
  }
}

// Test 7: Get account details to check balances
async function testGetAccountBalances() {
  console.log('\n=== Testing Account Balances ===');
  
  try {
    const result = await makeRequest('GET', '/accounts');
    console.log('✅ Accounts fetched:', result.message);
    
    if (result.entity && result.entity.length > 0) {
      console.log('\nAccount balances:');
      result.entity.slice(0, 3).forEach((account, index) => {
        console.log(`${index + 1}. ${account.accountName} (${account.accountNumber}):`);
        console.log(`   Clear Balance: ${account.clearBalance || 0}`);
        console.log(`   Debit Balance: ${account.debitBalance || 0}`);
        console.log(`   Credit Balance: ${account.creditBalance || 0}`);
        console.log(`   Available Balance: ${account.availableBalance || 0}`);
      });
    }
    
    return result.entity;
  } catch (error) {
    console.log('❌ Failed to fetch account balances');
    return null;
  }
}

// Main test function
async function runAllTests() {
  console.log('🚀 Starting Transaction System Tests...\n');
  
  try {
    // Test 1: Create pending transactions
    const pendingTransferRef = await testPendingTransferTransaction();
    const pendingCashRef = await testPendingCashTransaction();
    const pendingSmartTellerRef = await testPendingSmartTellerTransaction();
    
    // Test 2: Check balances after pending transactions
    await testGetAccountBalances();
    
    // Test 3: Approve pending transactions
    if (pendingTransferRef) {
      await testApproveTransaction(pendingTransferRef);
    }
    if (pendingCashRef) {
      await testApproveTransaction(pendingCashRef);
    }
    if (pendingSmartTellerRef) {
      await testApproveTransaction(pendingSmartTellerRef);
    }
    
    // Test 4: Create approved transaction directly
    await testApprovedTransferTransaction();
    
    // Test 5: Check balances after approvals
    await testGetAccountBalances();
    
    // Test 6: Get all transactions
    await testGetTransactions();
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  testPendingTransferTransaction,
  testPendingCashTransaction,
  testPendingSmartTellerTransaction,
  testApproveTransaction,
  testApprovedTransferTransaction,
  testGetTransactions,
  testGetAccountBalances
};
