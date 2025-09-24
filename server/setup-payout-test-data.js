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

// Setup functions
const setupRequiredGLAccounts = async () => {
  log('🏦 Setting up required GL accounts...');
  
  const requiredAccounts = [
    {
      glAccountId: 'GL-INTEREST-INCOME',
      accountName: 'Interest Income',
      accountCategory: 'INCOME',
      accountSubCategory: 'Interest',
      normalBalance: 'CREDIT',
      remarks: 'GL account for interest income from loans'
    },
    {
      glAccountId: 'GL-INTEREST-EXPENSE',
      accountName: 'Interest Expense',
      accountCategory: 'EXPENSE',
      accountSubCategory: 'Interest',
      normalBalance: 'DEBIT',
      remarks: 'GL account for interest expense on savings'
    }
  ];
  
  const results = [];
  
  for (const accountData of requiredAccounts) {
    log(`📋 Creating GL account: ${accountData.glAccountId}`);
    
    const payload = {
      glAccountId: accountData.glAccountId,
      saccoId: TEST_SACCO_ID,
      accountName: accountData.accountName,
      accountNumber: accountData.glAccountId,
      accountCategory: accountData.accountCategory,
      accountSubCategory: accountData.accountSubCategory,
      normalBalance: accountData.normalBalance,
      availableBalance: 0.00,
      status: 'Active',
      createdOn: new Date(),
      createdBy: 'System'
    };
    
    const result = await makeRequest('POST', '/gl-accounts', payload);
    
    if (result.success) {
      log(`✅ GL account ${accountData.glAccountId} created successfully`);
      results.push({ account: accountData.glAccountId, status: 'CREATED' });
    } else {
      // Check if account already exists
      const errorMessage = typeof result.error === 'string' ? result.error : JSON.stringify(result.error);
      if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
        log(`⚠️ GL account ${accountData.glAccountId} already exists`);
        results.push({ account: accountData.glAccountId, status: 'EXISTS' });
      } else {
        log(`❌ Failed to create GL account ${accountData.glAccountId}:`, result.error);
        results.push({ account: accountData.glAccountId, status: 'ERROR', error: result.error });
      }
    }
  }
  
  return results;
};

const setupTestMember = async () => {
  log('👤 Setting up test member...');
  
  const memberData = {
    saccoId: TEST_SACCO_ID,
    firstName: 'Payout',
    lastName: 'Test',
    gender: 'Male',
    dateOfBirth: '1990-01-01',
    email: 'payout.test@test.com',
    personalPhone: '254700000002',
    status: 'Active',
    identificationType: 'National ID',
    identificationNumber: `PAYOUT${Date.now()}`,
    nationality: 'Kenyan',
    country: 'Kenya',
    county: 'Nairobi'
  };
  
  const result = await makeRequest('POST', '/members/test', memberData);
  
  if (result.success) {
    log('✅ Test member created successfully:', result.data.entity);
    return result.data.entity;
  } else {
    log('❌ Failed to create test member:', result.error);
    return null;
  }
};

const setupSavingsProduct = async () => {
  log('💰 Setting up savings product...');
  
  const productData = {
    productId: `PAYOUT-SAV-${Date.now()}`,
    productName: `Payout Test Savings Product ${Date.now()}`,
    saccoId: TEST_SACCO_ID,
    productType: 'BOSA',
    productStatus: 'Pending',
    status: 'Pending',
    description: 'Savings product for automated payout testing',
    isSpecial: false,
    interestRate: 8.0, // 8% annual
    interestCalculationRule: 'Daily',
    interestFrequency: 'Monthly'
  };
  
  const result = await makeRequest('POST', '/products/test', productData);
  
  if (result.success) {
    log('✅ Savings product created successfully:', result.data.entity);
    return result.data.entity;
  } else {
    log('❌ Failed to create savings product:', result.error);
    return null;
  }
};

const setupLoanProduct = async () => {
  log('🏦 Setting up loan product...');
  
  const productData = {
    loanProductName: `Payout Test Loan Product ${Date.now()}`,
    saccoId: TEST_SACCO_ID,
    loanProductType: 'LOAN',
    description: 'Loan product for automated payout testing',
    needGuarantors: false,
    interestRate: 12.0, // 12% annual
    interestType: 'Reducing Balance',
    interestCalculationRule: 'Daily',
    interestFrequency: 'Monthly',
    maxLoanAmount: 100000,
    minLoanAmount: 1000,
    maxLoanPeriod: 12,
    minLoanPeriod: 1
  };
  
  const result = await makeRequest('POST', '/loan-products/test', productData);
  
  if (result.success) {
    log('✅ Loan product created successfully:', result.data.entity);
    return result.data.entity;
  } else {
    log('❌ Failed to create loan product:', result.error);
    return null;
  }
};

const approveProducts = async (savingsProduct, loanProduct) => {
  log('✅ Approving products...');
  
  // Approve savings product
  const savingsApprovalData = {
    status: 'Active',
    productStatus: 'Active',
    verifierRemarks: 'Approved for automated payout testing'
  };
  
  const savingsResult = await makeRequest('PUT', `/products/${savingsProduct.product.id}`, savingsApprovalData);
  if (!savingsResult.success) {
    log('❌ Failed to approve savings product:', savingsResult.error);
    return false;
  }
  
  // Approve loan product
  const loanApprovalData = {
    status: 'Active',
    verifierRemarks: 'Approved for automated payout testing'
  };
  
  const loanResult = await makeRequest('PUT', `/loan-products/${loanProduct.loanProduct.id}/test`, loanApprovalData);
  if (!loanResult.success) {
    log('❌ Failed to approve loan product:', loanResult.error);
    return false;
  }
  
  log('✅ Both products approved successfully');
  return true;
};

const setupSavingsAccount = async (memberId, productId) => {
  log('💳 Setting up savings account...');
  
  const accountData = {
    accountId: `PAYOUT-SAV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    accountName: `Payout Test Savings Account ${Date.now()}`,
    memberId: memberId,
    productId: productId,
    accountTypeId: 1,
    availableBalance: 50000, // Start with 50,000 for testing
    clearBalance: 50000,
    debitBalance: 0,
    creditBalance: 50000,
    status: 'Active',
    saccoId: TEST_SACCO_ID
  };
  
  const result = await makeRequest('POST', '/accounts/test', accountData);
  
  if (result.success) {
    log('✅ Savings account created successfully:', result.data.entity);
    return result.data.entity;
  } else {
    log('❌ Failed to create savings account:', result.error);
    return null;
  }
};

const setupLoanApplicationAndDisbursement = async (memberId, loanProductId) => {
  log('🏦 Setting up loan application and disbursement...');
  
  // Create loan application
  const applicationData = {
    loanName: `Payout Test Loan ${Date.now()}`,
    loanAmount: 30000,
    loanPeriod: 6,
    memberId: memberId,
    productId: loanProductId,
    remarks: 'Loan for automated payout testing'
  };
  
  const applicationResult = await makeRequest('POST', '/loan-applications/test', applicationData);
  if (!applicationResult.success) {
    log('❌ Failed to create loan application:', applicationResult.error);
    return null;
  }
  
  const application = applicationResult.data.entity;
  log('✅ Loan application created:', application);
  
  // Appraise and sanction
  const appraisalData = {
    status: 'Sanctioned',
    verifierRemarks: 'Sanctioned for automated payout testing'
  };
  
  const appraisalResult = await makeRequest('PUT', `/loan-applications/${application.id}/status/test`, appraisalData);
  if (!appraisalResult.success) {
    log('❌ Failed to appraise loan application:', appraisalResult.error);
    return null;
  }
  
  // Disburse loan
  const disbursementData = {
    status: 'Disbursed'
  };
  
  const disbursementResult = await makeRequest('PUT', `/loan-applications/${application.id}/disburse/test`, disbursementData);
  if (!disbursementResult.success) {
    log('❌ Failed to disburse loan:', disbursementResult.error);
    return null;
  }
  
  log('✅ Loan disbursed successfully:', disbursementResult.data.entity);
  return disbursementResult.data.entity;
};

const setupCompleteTestData = async () => {
  log('🚀 Starting complete test data setup...');
  
  const results = {
    glAccounts: null,
    member: null,
    savingsProduct: null,
    loanProduct: null,
    savingsAccount: null,
    disbursedLoan: null
  };
  
  try {
    // Login
    const loginSuccess = await login();
    if (!loginSuccess) {
      throw new Error('Login failed');
    }
    
    // Step 1: Setup GL accounts
    log('📋 Step 1: Setting up GL accounts');
    results.glAccounts = await setupRequiredGLAccounts();
    
    // Step 2: Setup test member
    log('📋 Step 2: Setting up test member');
    results.member = await setupTestMember();
    if (!results.member) {
      throw new Error('Member creation failed');
    }
    
    // Step 3: Setup savings product
    log('📋 Step 3: Setting up savings product');
    results.savingsProduct = await setupSavingsProduct();
    if (!results.savingsProduct) {
      throw new Error('Savings product creation failed');
    }
    
    // Step 4: Setup loan product
    log('📋 Step 4: Setting up loan product');
    results.loanProduct = await setupLoanProduct();
    if (!results.loanProduct) {
      throw new Error('Loan product creation failed');
    }
    
    // Step 5: Approve products
    log('📋 Step 5: Approving products');
    const productsApproved = await approveProducts(results.savingsProduct, results.loanProduct);
    if (!productsApproved) {
      throw new Error('Product approval failed');
    }
    
    // Step 6: Setup savings account
    log('📋 Step 6: Setting up savings account');
    results.savingsAccount = await setupSavingsAccount(results.member.id, results.savingsProduct.product.id);
    if (!results.savingsAccount) {
      throw new Error('Savings account creation failed');
    }
    
    // Step 7: Setup loan application and disbursement
    log('📋 Step 7: Setting up loan application and disbursement');
    results.disbursedLoan = await setupLoanApplicationAndDisbursement(results.member.id, results.loanProduct.loanProduct.id);
    if (!results.disbursedLoan) {
      throw new Error('Loan application and disbursement failed');
    }
    
    log('🎉 COMPLETE TEST DATA SETUP SUCCESSFUL!');
    log('📊 Setup Results Summary:', {
      glAccountsCreated: results.glAccounts.filter(r => r.status === 'CREATED' || r.status === 'EXISTS').length,
      memberId: results.member.id,
      memberNo: results.member.memberNo,
      savingsProductId: results.savingsProduct.id,
      loanProductId: results.loanProduct.loanProduct.id,
      savingsAccountId: results.savingsAccount.accountId,
      savingsAccountBalance: results.savingsAccount.availableBalance,
      disbursedLoanId: results.disbursedLoan.id,
      disbursedLoanAmount: results.disbursedLoan.loanAmount
    });
    
    return {
      success: true,
      results: results
    };
    
  } catch (error) {
    log(`💥 TEST DATA SETUP FAILED:`, {
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
  log('🔧 Starting Payout Test Data Setup...');
  
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
      log('⚠️ Server health check failed, but continuing with setup:', serverError.message);
    }
    
    // Run the complete test data setup
    log('🚀 Starting test data setup execution...');
    const result = await setupCompleteTestData();
    
    if (result.success) {
      log('🎯 Test data setup completed successfully!');
      log('📈 Setup Summary:', {
        totalSteps: 7,
        completedSteps: 7,
        successRate: '100%',
        duration: 'See individual step logs above'
      });
      process.exit(0);
    } else {
      log('💥 Test data setup failed! Check the errors above.');
      log('📊 Setup Summary:', {
        totalSteps: 7,
        completedSteps: 'Partial',
        successRate: '0%',
        error: result.error
      });
      process.exit(1);
    }
    
  } catch (error) {
    log('💥 CRITICAL ERROR in test data setup:', {
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

// Run the setup
if (require.main === module) {
  main();
}

module.exports = {
  setupCompleteTestData,
  setupRequiredGLAccounts,
  setupTestMember,
  setupSavingsProduct,
  setupLoanProduct,
  approveProducts,
  setupSavingsAccount,
  setupLoanApplicationAndDisbursement
};
