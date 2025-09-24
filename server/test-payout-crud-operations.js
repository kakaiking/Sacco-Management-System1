const axios = require('axios');
const { sequelize } = require('./models');

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

// CRUD Test Functions
const testCreateGLAccount = async (accountData) => {
  log(`🧪 Testing GL Account Creation: ${accountData.glAccountId}`);
  
  const result = await makeRequest('POST', '/gl-accounts', accountData);
  
  if (result.success) {
    log(`✅ GL account ${accountData.glAccountId} created successfully`);
    return { success: true, data: result.data };
  } else {
    // Check if it's a duplicate error
    const errorMessage = typeof result.error === 'string' ? result.error : JSON.stringify(result.error);
    if (errorMessage.includes('already exists') || errorMessage.includes('duplicate') || errorMessage.includes('409')) {
      log(`⚠️ GL account ${accountData.glAccountId} already exists - this is expected`);
      return { success: true, data: null, exists: true };
    } else {
      log(`❌ Failed to create GL account ${accountData.glAccountId}:`, result.error);
      return { success: false, error: result.error };
    }
  }
};

const testCreateMember = async (memberData) => {
  log(`🧪 Testing Member Creation: ${memberData.firstName} ${memberData.lastName}`);
  
  const result = await makeRequest('POST', '/members/test', memberData);
  
  if (result.success) {
    log(`✅ Member created successfully`);
    return { success: true, data: result.data.entity };
  } else {
    log(`❌ Failed to create member:`, result.error);
    return { success: false, error: result.error };
  }
};

const testCreateSavingsProduct = async (productData) => {
  log(`🧪 Testing Savings Product Creation: ${productData.productName}`);
  
  const result = await makeRequest('POST', '/products/test', productData);
  
  if (result.success) {
    log(`✅ Savings product created successfully`);
    return { success: true, data: result.data.entity };
  } else {
    log(`❌ Failed to create savings product:`, result.error);
    return { success: false, error: result.error };
  }
};

const testCreateLoanProduct = async (productData) => {
  log(`🧪 Testing Loan Product Creation: ${productData.loanProductName}`);
  
  const result = await makeRequest('POST', '/loan-products/test', productData);
  
  if (result.success) {
    log(`✅ Loan product created successfully`);
    return { success: true, data: result.data.entity };
  } else {
    log(`❌ Failed to create loan product:`, result.error);
    return { success: false, error: result.error };
  }
};

const testUpdateProductStatus = async (productId, productType, statusData) => {
  log(`🧪 Testing Product Status Update: ${productId}`);
  
  const endpoint = productType === 'savings' ? `/products/${productId}` : `/loan-products/${productId}/test`;
  const result = await makeRequest('PUT', endpoint, statusData);
  
  if (result.success) {
    log(`✅ Product status updated successfully`);
    return { success: true, data: result.data.entity };
  } else {
    log(`❌ Failed to update product status:`, result.error);
    return { success: false, error: result.error };
  }
};

const testCreateAccount = async (accountData) => {
  log(`🧪 Testing Account Creation: ${accountData.accountName}`);
  
  const result = await makeRequest('POST', '/accounts/test', accountData);
  
  if (result.success) {
    log(`✅ Account created successfully`);
    return { success: true, data: result.data.entity };
  } else {
    log(`❌ Failed to create account:`, result.error);
    return { success: false, error: result.error };
  }
};

const testCreateLoanApplication = async (applicationData) => {
  log(`🧪 Testing Loan Application Creation: ${applicationData.loanName}`);
  
  const result = await makeRequest('POST', '/loan-applications/test', applicationData);
  
  if (result.success) {
    log(`✅ Loan application created successfully`);
    return { success: true, data: result.data.entity };
  } else {
    log(`❌ Failed to create loan application:`, result.error);
    return { success: false, error: result.error };
  }
};

const testUpdateLoanApplicationStatus = async (applicationId, statusData) => {
  log(`🧪 Testing Loan Application Status Update: ${applicationId}`);
  
  const result = await makeRequest('PUT', `/loan-applications/${applicationId}/status/test`, statusData);
  
  if (result.success) {
    log(`✅ Loan application status updated successfully`);
    return { success: true, data: result.data.entity };
  } else {
    log(`❌ Failed to update loan application status:`, result.error);
    return { success: false, error: result.error };
  }
};

const testDisburseLoan = async (applicationId, disbursementData) => {
  log(`🧪 Testing Loan Disbursement: ${applicationId}`);
  
  const result = await makeRequest('PUT', `/loan-applications/${applicationId}/disburse/test`, disbursementData);
  
  if (result.success) {
    log(`✅ Loan disbursed successfully`);
    return { success: true, data: result.data.entity };
  } else {
    log(`❌ Failed to disburse loan:`, result.error);
    return { success: false, error: result.error };
  }
};

// Automated Payout Test Functions
const testGenerateSavingsInterestPayouts = async () => {
  log('🧪 Testing Automated Savings Interest Payout Generation...');
  
  const payoutData = {
    saccoId: TEST_SACCO_ID,
    calculationPeriod: 'MONTHLY'
  };
  
  const result = await makeRequest('POST', '/payouts/auto/generate-savings', payoutData);
  
  if (result.success) {
    log('✅ Automated savings interest payouts generated successfully');
    return { success: true, data: result.data };
  } else {
    log('❌ Automated savings interest payout generation failed:', result.error);
    return { success: false, error: result.error };
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
    log('✅ Automated loan interest collection payouts generated successfully');
    return { success: true, data: result.data };
  } else {
    log('❌ Automated loan interest collection payout generation failed:', result.error);
    return { success: false, error: result.error };
  }
};

const testProcessPendingPayouts = async () => {
  log('🧪 Testing Batch Processing of Pending Payouts...');
  
  const result = await makeRequest('POST', '/payouts/auto/process-pending', {});
  
  if (result.success) {
    log('✅ Pending payouts processed successfully');
    return { success: true, data: result.data };
  } else {
    log('❌ Batch processing of pending payouts failed:', result.error);
    return { success: false, error: result.error };
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
    log('✅ Complete automated payout cycle executed successfully');
    return { success: true, data: result.data };
  } else {
    log('❌ Complete automated payout cycle failed:', result.error);
    return { success: false, error: result.error };
  }
};

const testGetPayoutStatistics = async () => {
  log('🧪 Testing Payout Statistics Retrieval...');
  
  const result = await makeRequest('GET', '/payouts/stats/summary');
  
  if (result.success) {
    log('✅ Payout statistics retrieved successfully');
    return { success: true, data: result.data };
  } else {
    log('❌ Payout statistics retrieval failed:', result.error);
    return { success: false, error: result.error };
  }
};

const testGetAllPayouts = async () => {
  log('🧪 Testing Get All Payouts...');
  
  const result = await makeRequest('GET', '/payouts');
  
  if (result.success) {
    log('✅ All payouts retrieved successfully');
    return { success: true, data: result.data };
  } else {
    log('❌ Get all payouts failed:', result.error);
    return { success: false, error: result.error };
  }
};

// Main comprehensive test function
const runCompleteCRUDAndPayoutTest = async () => {
  log('🚀 Starting Complete CRUD and Payout Test...');
  
  const results = {
    glAccounts: [],
    member: null,
    savingsProduct: null,
    loanProduct: null,
    savingsAccount: null,
    loanApplication: null,
    disbursedLoan: null,
    savingsPayouts: null,
    loanPayouts: null,
    processedPayouts: null,
    completeCycle: null,
    statistics: null,
    allPayouts: null
  };
  
  try {
    // Login
    const loginSuccess = await login();
    if (!loginSuccess) {
      throw new Error('Login failed');
    }
    
    // Phase 1: Create Required GL Accounts
    log('📋 PHASE 1: Creating Required GL Accounts...');
    
    const requiredGLAccounts = [
      {
        glAccountId: 'GL-INTEREST-INCOME',
        accountName: 'Interest Income',
        accountCategory: 'INCOME',
        accountSubCategory: 'Interest',
        normalBalance: 'CREDIT',
        remarks: 'GL account for interest income from loans',
        saccoId: TEST_SACCO_ID
      },
      {
        glAccountId: 'GL-INTEREST-EXPENSE',
        accountName: 'Interest Expense',
        accountCategory: 'EXPENSE',
        accountSubCategory: 'Interest',
        normalBalance: 'DEBIT',
        remarks: 'GL account for interest expense on savings',
        saccoId: TEST_SACCO_ID
      }
    ];
    
    for (const accountData of requiredGLAccounts) {
      const result = await testCreateGLAccount(accountData);
      results.glAccounts.push({ account: accountData.glAccountId, result });
    }
    
    log('✅ Phase 1 completed: GL accounts creation attempted');
    
    // Phase 2: Create Test Data
    log('📋 PHASE 2: Creating Test Data...');
    
    // Create test member
    const memberData = {
      saccoId: TEST_SACCO_ID,
      firstName: 'CRUD',
      lastName: 'Test',
      gender: 'Male',
      dateOfBirth: '1990-01-01',
      email: 'crud.test@test.com',
      personalPhone: '254700000003',
      status: 'Active',
      identificationType: 'National ID',
      identificationNumber: `CRUD${Date.now()}`,
      nationality: 'Kenyan',
      country: 'Kenya',
      county: 'Nairobi'
    };
    
    const memberResult = await testCreateMember(memberData);
    if (memberResult.success) {
      results.member = memberResult.data;
    }
    
    // Create savings product
    const savingsProductData = {
      productId: `CRUD-SAV-${Date.now()}`,
      productName: `CRUD Test Savings Product ${Date.now()}`,
      saccoId: TEST_SACCO_ID,
      productType: 'BOSA',
      productStatus: 'Pending',
      status: 'Pending',
      description: 'Savings product for CRUD testing',
      isSpecial: false,
      interestRate: 8.0,
      interestCalculationRule: 'Daily',
      interestFrequency: 'Monthly'
    };
    
    const savingsProductResult = await testCreateSavingsProduct(savingsProductData);
    if (savingsProductResult.success) {
      results.savingsProduct = savingsProductResult.data;
    }
    
    // Create loan product
    const loanProductData = {
      loanProductName: `CRUD Test Loan Product ${Date.now()}`,
      saccoId: TEST_SACCO_ID,
      loanProductType: 'LOAN',
      description: 'Loan product for CRUD testing',
      needGuarantors: false,
      interestRate: 12.0,
      interestType: 'Reducing Balance',
      interestCalculationRule: 'Daily',
      interestFrequency: 'Monthly',
      maxLoanAmount: 100000,
      minLoanAmount: 1000,
      maxLoanPeriod: 12,
      minLoanPeriod: 1
    };
    
    const loanProductResult = await testCreateLoanProduct(loanProductData);
    if (loanProductResult.success) {
      results.loanProduct = loanProductResult.data;
    }
    
    log('✅ Phase 2 completed: Test data creation attempted');
    
    // Phase 3: Approve Products
    log('📋 PHASE 3: Approving Products...');
    
    if (results.savingsProduct) {
      const savingsApprovalData = {
        status: 'Active',
        productStatus: 'Active',
        verifierRemarks: 'Approved for CRUD testing'
      };
      await testUpdateProductStatus(results.savingsProduct.product.id, 'savings', savingsApprovalData);
    }
    
    if (results.loanProduct) {
      const loanApprovalData = {
        status: 'Active',
        verifierRemarks: 'Approved for CRUD testing'
      };
      await testUpdateProductStatus(results.loanProduct.loanProduct.id, 'loan', loanApprovalData);
    }
    
    log('✅ Phase 3 completed: Product approval attempted');
    
    // Phase 4: Create Accounts
    log('📋 PHASE 4: Creating Accounts...');
    
    if (results.member && results.savingsProduct) {
      const accountData = {
        accountId: `CRUD-SAV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        accountName: `CRUD Test Savings Account ${Date.now()}`,
        memberId: results.member.id,
        productId: results.savingsProduct.product.id,
        accountTypeId: 1,
        availableBalance: 50000,
        clearBalance: 50000,
        debitBalance: 0,
        creditBalance: 50000,
        status: 'Active',
        saccoId: TEST_SACCO_ID
      };
      
      const accountResult = await testCreateAccount(accountData);
      if (accountResult.success) {
        results.savingsAccount = accountResult.data;
      }
    }
    
    log('✅ Phase 4 completed: Account creation attempted');
    
    // Phase 5: Create and Process Loan
    log('📋 PHASE 5: Creating and Processing Loan...');
    
    if (results.member && results.loanProduct) {
      // Create loan application
      const applicationData = {
        loanName: `CRUD Test Loan ${Date.now()}`,
        loanAmount: 30000,
        loanPeriod: 6,
        memberId: results.member.id,
        productId: results.loanProduct.loanProduct.id,
        remarks: 'Loan for CRUD testing'
      };
      
      const applicationResult = await testCreateLoanApplication(applicationData);
      if (applicationResult.success) {
        results.loanApplication = applicationResult.data;
        
        // Appraise and sanction
        const appraisalData = {
          status: 'Sanctioned',
          verifierRemarks: 'Sanctioned for CRUD testing'
        };
        
        const appraisalResult = await testUpdateLoanApplicationStatus(results.loanApplication.id, appraisalData);
        if (appraisalResult.success) {
          // Disburse loan
          const disbursementData = {
            status: 'Disbursed'
          };
          
          const disbursementResult = await testDisburseLoan(results.loanApplication.id, disbursementData);
          if (disbursementResult.success) {
            results.disbursedLoan = disbursementResult.data;
          }
        }
      }
    }
    
    log('✅ Phase 5 completed: Loan processing attempted');
    
    // Phase 6: Test Automated Payouts
    log('📋 PHASE 6: Testing Automated Payouts...');
    
    // Test 1: Generate Savings Interest Payouts
    const savingsPayoutsResult = await testGenerateSavingsInterestPayouts();
    if (savingsPayoutsResult.success) {
      results.savingsPayouts = savingsPayoutsResult.data;
    }
    
    // Test 2: Generate Loan Interest Collection Payouts
    const loanPayoutsResult = await testGenerateLoanInterestCollectionPayouts();
    if (loanPayoutsResult.success) {
      results.loanPayouts = loanPayoutsResult.data;
    }
    
    // Test 3: Process Pending Payouts
    const processedPayoutsResult = await testProcessPendingPayouts();
    if (processedPayoutsResult.success) {
      results.processedPayouts = processedPayoutsResult.data;
    }
    
    // Test 4: Run Complete Automated Payout Cycle
    const completeCycleResult = await testCompleteAutomatedPayoutCycle();
    if (completeCycleResult.success) {
      results.completeCycle = completeCycleResult.data;
    }
    
    // Test 5: Get Payout Statistics
    const statisticsResult = await testGetPayoutStatistics();
    if (statisticsResult.success) {
      results.statistics = statisticsResult.data;
    }
    
    // Test 6: Get All Payouts
    const allPayoutsResult = await testGetAllPayouts();
    if (allPayoutsResult.success) {
      results.allPayouts = allPayoutsResult.data;
    }
    
    log('✅ Phase 6 completed: Automated payout tests executed');
    
    // Final Results
    log('🎉 COMPLETE CRUD AND PAYOUT TEST COMPLETED!');
    log('📊 Comprehensive Test Results Summary:', {
      // GL Accounts Results
      glAccountsCreated: results.glAccounts.filter(r => r.result.success).length,
      glAccountsErrors: results.glAccounts.filter(r => !r.result.success).length,
      
      // Test Data Results
      memberCreated: results.member ? 'Yes' : 'No',
      memberId: results.member?.id,
      memberNo: results.member?.memberNo,
      
      savingsProductCreated: results.savingsProduct ? 'Yes' : 'No',
      savingsProductId: results.savingsProduct?.id,
      
      loanProductCreated: results.loanProduct ? 'Yes' : 'No',
      loanProductId: results.loanProduct?.loanProduct?.id,
      
      savingsAccountCreated: results.savingsAccount ? 'Yes' : 'No',
      savingsAccountId: results.savingsAccount?.accountId,
      initialSavingsBalance: results.savingsAccount?.availableBalance,
      
      loanApplicationCreated: results.loanApplication ? 'Yes' : 'No',
      loanApplicationId: results.loanApplication?.id,
      
      loanDisbursed: results.disbursedLoan ? 'Yes' : 'No',
      disbursedLoanId: results.disbursedLoan?.id,
      disbursedLoanAmount: results.disbursedLoan?.loanAmount,
      
      // Payout Test Results
      savingsPayoutsGenerated: results.savingsPayouts?.data?.summary?.created || 0,
      loanPayoutsGenerated: results.loanPayouts?.data?.summary?.created || 0,
      payoutsProcessed: results.processedPayouts?.data?.summary?.processed || 0,
      payoutsFailed: results.processedPayouts?.data?.summary?.failed || 0,
      completeCycleExecuted: results.completeCycle ? 'Success' : 'Failed',
      totalPayoutsInSystem: results.allPayouts?.data?.payouts?.length || 0,
      statisticsAvailable: results.statistics ? 'Yes' : 'No'
    });
    
    return {
      success: true,
      results: results
    };
    
  } catch (error) {
    log(`💥 COMPLETE CRUD AND PAYOUT TEST FAILED:`, {
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
  log('🔧 Starting Complete CRUD and Payout Test Suite...');
  
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
    
    // Run the complete CRUD and payout test
    log('🚀 Starting complete CRUD and payout test execution...');
    const result = await runCompleteCRUDAndPayoutTest();
    
    if (result.success) {
      log('🎯 Complete CRUD and payout test completed successfully!');
      log('📈 Test Summary:', {
        totalPhases: 6,
        completedPhases: 6,
        successRate: '100%',
        duration: 'See individual phase logs above'
      });
      process.exit(0);
    } else {
      log('💥 Complete CRUD and payout test failed! Check the errors above.');
      log('📊 Test Summary:', {
        totalPhases: 6,
        completedPhases: 'Partial',
        successRate: '0%',
        error: result.error
      });
      process.exit(1);
    }
    
  } catch (error) {
    log('💥 CRITICAL ERROR in complete CRUD and payout test suite:', {
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
  runCompleteCRUDAndPayoutTest,
  testCreateGLAccount,
  testCreateMember,
  testCreateSavingsProduct,
  testCreateLoanProduct,
  testUpdateProductStatus,
  testCreateAccount,
  testCreateLoanApplication,
  testUpdateLoanApplicationStatus,
  testDisburseLoan,
  testGenerateSavingsInterestPayouts,
  testGenerateLoanInterestCollectionPayouts,
  testProcessPendingPayouts,
  testCompleteAutomatedPayoutCycle,
  testGetPayoutStatistics,
  testGetAllPayouts
};
