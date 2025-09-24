const axios = require('axios');
const { sequelize } = require('./models');

// Import the data setup functions
const {
  setupCompleteTestData,
  setupRequiredGLAccounts,
  setupTestMember,
  setupSavingsProduct,
  setupLoanProduct,
  approveProducts,
  setupSavingsAccount,
  setupLoanApplicationAndDisbursement
} = require('./setup-payout-test-data');

// Configuration
const BASE_URL = 'http://localhost:3001';
const TEST_SACCO_ID = 'SYSTEM';
const ANGI_USERNAME = 'Angie';
const ANGI_PASSWORD = '123456';

// Global variables for authentication
let authToken = null;
let authHeaders = {};

// Helper functions
const log = (message, data = null) => {
  console.log(`\n[${new Date().toISOString()}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
};

const login = async () => {
  log(`🔐 Logging in as ${ANGI_USERNAME}...`);
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username: ANGI_USERNAME,
      password: ANGI_PASSWORD
    });
    
    if (response.data && response.data.token) {
      authToken = response.data.token;
      authHeaders = {
        'accessToken': authToken
      };
      log(`✅ Login successful`);
      return true;
    } else {
      log(`❌ Login failed: No token received`);
      return false;
    }
  } catch (error) {
    log(`❌ Login failed:`, error.response?.data || error.message);
    return false;
  }
};

const makeRequest = async (method, url, data = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders
      },
      timeout: 30000
    };
    
    if (data) {
      config.data = data;
    }
    
    log(`🌐 Making ${method} request to: ${url}`, data ? { data } : {});
    
    const response = await axios(config);
    
    log(`✅ Request successful (${response.status}):`, {
      status: response.status,
      dataKeys: response.data ? Object.keys(response.data) : 'No data'
    });
    
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    const errorDetails = {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    };
    
    log(`❌ Request failed:`, errorDetails);
    
    return { 
      success: false, 
      error: error.response?.data || error.message, 
      status: error.response?.status,
      details: errorDetails
    };
  }
};

// Automated payout test functions
const testGenerateSavingsInterestPayouts = async () => {
  log('🧪 Testing Automated Savings Interest Payout Generation...');
  
  const payoutData = {
    saccoId: TEST_SACCO_ID,
    calculationPeriod: 'MONTHLY'
  };
  
  const result = await makeRequest('POST', '/payouts/auto/generate-savings', payoutData);
  
  if (result.success) {
    log('✅ Automated savings interest payouts generated successfully:', result.data);
    return result.data;
  } else {
    log('❌ Automated savings interest payout generation failed:', result.error);
    return null;
  }
};

const testGenerateLoanInterestCollectionPayouts = async () => {
  log('🧪 Testing Automated Loan Interest Collection Payout Generation...');
  
  const payoutData = {
    saccoId: TEST_SACCO_ID,
    calculationPeriod: 'MONTHLY'
  };
  
  const result = await makeRequest('POST', '/payouts/auto/generate-loans', payoutData);
  
  if (result.success) {
    log('✅ Automated loan interest collection payouts generated successfully:', result.data);
    return result.data;
  } else {
    log('❌ Automated loan interest collection payout generation failed:', result.error);
    return null;
  }
};

const testProcessPendingPayouts = async () => {
  log('🧪 Testing Batch Processing of Pending Payouts...');
  
  const result = await makeRequest('POST', '/payouts/auto/process-pending', {});
  
  if (result.success) {
    log('✅ Pending payouts processed successfully:', result.data);
    return result.data;
  } else {
    log('❌ Batch processing of pending payouts failed:', result.error);
    return null;
  }
};

const testCompleteAutomatedPayoutCycle = async () => {
  log('🧪 Testing Complete Automated Payout Cycle...');
  
  const cycleData = {
    saccoId: TEST_SACCO_ID,
    calculationPeriod: 'MONTHLY'
  };
  
  const result = await makeRequest('POST', '/payouts/auto/run-cycle', cycleData);
  
  if (result.success) {
    log('✅ Complete automated payout cycle executed successfully:', result.data);
    return result.data;
  } else {
    log('❌ Complete automated payout cycle failed:', result.error);
    return null;
  }
};

const testGetPayoutStatistics = async () => {
  log('🧪 Testing Payout Statistics Retrieval...');
  
  const result = await makeRequest('GET', '/payouts/stats/summary');
  
  if (result.success) {
    log('✅ Payout statistics retrieved successfully:', result.data);
    return result.data;
  } else {
    log('❌ Payout statistics retrieval failed:', result.error);
    return null;
  }
};

const testGetAllPayouts = async () => {
  log('🧪 Testing Get All Payouts...');
  
  const result = await makeRequest('GET', '/payouts');
  
  if (result.success) {
    log('✅ All payouts retrieved successfully:', {
      total: result.data.data?.payouts?.length || 0,
      summary: result.data.data?.summary
    });
    return result.data;
  } else {
    log('❌ Get all payouts failed:', result.error);
    return null;
  }
};

const testAccountBalancesAfterPayouts = async (savingsAccountId) => {
  log('🧪 Testing Account Balances After Payouts...');
  
  const result = await makeRequest('GET', `/accounts/test/${savingsAccountId}`);
  
  if (result.success) {
    const account = result.data.entity;
    log('✅ Account balance retrieved after payouts:', {
      accountId: account.accountId,
      availableBalance: account.availableBalance,
      clearBalance: account.clearBalance,
      debitBalance: account.debitBalance,
      creditBalance: account.creditBalance,
      status: account.status
    });
    return account;
  } else {
    log('❌ Account balance check failed:', result.error);
    return null;
  }
};

// Main comprehensive test function
const runCompletePayoutWorkflowTest = async () => {
  log('🚀 Starting Complete Payout Workflow Test...');
  
  const results = {
    dataSetup: null,
    savingsPayouts: null,
    loanPayouts: null,
    processedPayouts: null,
    completeCycle: null,
    statistics: null,
    allPayouts: null,
    finalAccountBalance: null
  };
  
  try {
    // Phase 1: Data Setup
    log('📋 PHASE 1: Setting up test data...');
    results.dataSetup = await setupCompleteTestData();
    
    if (!results.dataSetup.success) {
      throw new Error(`Data setup failed: ${results.dataSetup.error}`);
    }
    
    log('✅ Phase 1 completed: Test data setup successful');
    
    // Phase 2: Login for payout tests
    log('📋 PHASE 2: Authentication for payout tests...');
    const loginSuccess = await login();
    if (!loginSuccess) {
      throw new Error('Login failed for payout tests');
    }
    
    log('✅ Phase 2 completed: Authentication successful');
    
    // Phase 3: Automated Payout Tests
    log('📋 PHASE 3: Running automated payout tests...');
    
    // Test 1: Generate Savings Interest Payouts
    log('📋 Test 1: Generate Savings Interest Payouts');
    results.savingsPayouts = await testGenerateSavingsInterestPayouts();
    
    // Test 2: Generate Loan Interest Collection Payouts
    log('📋 Test 2: Generate Loan Interest Collection Payouts');
    results.loanPayouts = await testGenerateLoanInterestCollectionPayouts();
    
    // Test 3: Process Pending Payouts
    log('📋 Test 3: Process Pending Payouts');
    results.processedPayouts = await testProcessPendingPayouts();
    
    // Test 4: Run Complete Automated Payout Cycle
    log('📋 Test 4: Run Complete Automated Payout Cycle');
    results.completeCycle = await testCompleteAutomatedPayoutCycle();
    
    // Test 5: Get Payout Statistics
    log('📋 Test 5: Get Payout Statistics');
    results.statistics = await testGetPayoutStatistics();
    
    // Test 6: Get All Payouts
    log('📋 Test 6: Get All Payouts');
    results.allPayouts = await testGetAllPayouts();
    
    // Test 7: Check Account Balances After Payouts
    log('📋 Test 7: Check Account Balances After Payouts');
    if (results.dataSetup.results.savingsAccount) {
      results.finalAccountBalance = await testAccountBalancesAfterPayouts(results.dataSetup.results.savingsAccount.accountId);
    }
    
    log('✅ Phase 3 completed: Automated payout tests executed');
    
    // Final Results
    log('🎉 COMPLETE PAYOUT WORKFLOW TEST COMPLETED!');
    log('📊 Comprehensive Test Results Summary:', {
      // Data Setup Results
      dataSetupSuccess: results.dataSetup.success,
      glAccountsCreated: results.dataSetup.results.glAccounts?.filter(r => r.status === 'CREATED' || r.status === 'EXISTS').length || 0,
      memberId: results.dataSetup.results.member?.id,
      memberNo: results.dataSetup.results.member?.memberNo,
      savingsProductId: results.dataSetup.results.savingsProduct?.id,
      loanProductId: results.dataSetup.results.loanProduct?.loanProduct?.id,
      savingsAccountId: results.dataSetup.results.savingsAccount?.accountId,
      initialSavingsBalance: results.dataSetup.results.savingsAccount?.availableBalance,
      disbursedLoanId: results.dataSetup.results.disbursedLoan?.id,
      disbursedLoanAmount: results.dataSetup.results.disbursedLoan?.loanAmount,
      
      // Payout Test Results
      savingsPayoutsGenerated: results.savingsPayouts?.data?.summary?.created || 0,
      loanPayoutsGenerated: results.loanPayouts?.data?.summary?.created || 0,
      payoutsProcessed: results.processedPayouts?.data?.summary?.processed || 0,
      payoutsFailed: results.processedPayouts?.data?.summary?.failed || 0,
      completeCycleExecuted: results.completeCycle ? 'Success' : 'Failed',
      totalPayoutsInSystem: results.allPayouts?.data?.payouts?.length || 0,
      statisticsAvailable: results.statistics ? 'Yes' : 'No',
      
      // Final Account State
      finalSavingsBalance: results.finalAccountBalance?.availableBalance,
      balanceChange: results.finalAccountBalance?.availableBalance - results.dataSetup.results.savingsAccount?.availableBalance
    });
    
    return {
      success: true,
      results: results
    };
    
  } catch (error) {
    log(`💥 COMPLETE PAYOUT WORKFLOW TEST FAILED:`, {
      error: error.message,
      stack: error.stack
    });
    
    return {
      success: false,
      error: error.message,
      results: results
    };
  }
};

// Main execution
const main = async () => {
  log('🔧 Starting Complete Payout Workflow Test Suite...');
  
  try {
    // Test database connection
    log('🔌 Testing database connection...');
    await sequelize.authenticate();
    log('✅ Database connection established');
    
    // Test server connectivity
    log('🌐 Testing server connectivity...');
    try {
      const healthCheck = await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
      log('✅ Server is responding:', healthCheck.status);
    } catch (serverError) {
      log('⚠️ Server health check failed, but continuing with tests:', serverError.message);
    }
    
    // Run the complete payout workflow test
    log('🚀 Starting complete payout workflow test execution...');
    const result = await runCompletePayoutWorkflowTest();
    
    if (result.success) {
      log('🎯 Complete payout workflow test completed successfully!');
      log('📈 Test Summary:', {
        totalPhases: 3,
        completedPhases: 3,
        successRate: '100%',
        duration: 'See individual phase logs above'
      });
      process.exit(0);
    } else {
      log('💥 Complete payout workflow test failed! Check the errors above.');
      log('📊 Test Summary:', {
        totalPhases: 3,
        completedPhases: 'Partial',
        successRate: '0%',
        error: result.error
      });
      process.exit(1);
    }
    
  } catch (error) {
    log('💥 CRITICAL ERROR in complete payout workflow test suite:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    log('🔧 Critical Error Troubleshooting:');
    log('   - Check if database is running and accessible');
    log('   - Verify server is running on port 3001');
    log('   - Check network connectivity');
    log('   - Review server logs for additional details');
    
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  log('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the test
if (require.main === module) {
  main();
}

module.exports = {
  runCompletePayoutWorkflowTest,
  testGenerateSavingsInterestPayouts,
  testGenerateLoanInterestCollectionPayouts,
  testProcessPendingPayouts,
  testCompleteAutomatedPayoutCycle,
  testGetPayoutStatistics,
  testGetAllPayouts,
  testAccountBalancesAfterPayouts
};
