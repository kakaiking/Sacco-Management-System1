const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
let authToken = '';

async function login() {
  try {
    console.log('🔐 Attempting to login...');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    if (response.data && response.data.token) {
      authToken = response.data.token;
      console.log('✅ Login successful');
      console.log('Token received:', authToken.substring(0, 20) + '...');
      return true;
    } else {
      console.error('❌ No token in response:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Login failed:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
    return false;
  }
}

async function testProductCRUD() {
  console.log('\n=== TESTING PRODUCT CRUD OPERATIONS ===');
  
  try {
    // CREATE Product
    console.log('\n1. Creating Product...');
    const testProduct = {
      productId: `P-TEST-${Date.now()}`,
      productName: "Test Savings Product",
      saccoId: "SAC-9068",
      productType: "BOSA",
      productStatus: "Pending",
      description: "Test product for CRUD operations"
    };

    const createResponse = await axios.post(`${BASE_URL}/products/test`, testProduct);
    console.log('✅ Product created successfully');
    console.log('Product ID:', createResponse.data.entity?.product?.id);
    const productId = createResponse.data.entity?.product?.id;
    
    if (!productId) {
      console.error('❌ No product ID returned');
      return false;
    }

    // READ Product
    console.log('\n2. Reading Product...');
    const readResponse = await axios.get(`${BASE_URL}/products/${productId}`, {
      headers: { accessToken: authToken }
    });
    console.log('✅ Product read successfully');
    console.log('Product Name:', readResponse.data.entity?.productName);

    // UPDATE Product
    console.log('\n3. Updating Product...');
    const updateData = {
      productName: "Updated Test Savings Product",
      status: "Active"
    };

    const updateResponse = await axios.put(`${BASE_URL}/products/${productId}`, updateData, {
      headers: { accessToken: authToken }
    });
    console.log('✅ Product updated successfully');

    // DELETE Product
    console.log('\n4. Deleting Product...');
    const deleteResponse = await axios.delete(`${BASE_URL}/products/${productId}`, {
      headers: { accessToken: authToken }
    });
    console.log('✅ Product deleted successfully');

    return true;
  } catch (error) {
    console.error('❌ Product CRUD test failed:', error.response?.data || error.message);
    return false;
  }
}

async function testLoanProductCRUD() {
  console.log('\n=== TESTING LOAN PRODUCT CRUD OPERATIONS ===');
  
  try {
    // CREATE Loan Product
    console.log('\n1. Creating Loan Product...');
    const testLoanProduct = {
      loanProductId: `LP-TEST-${Date.now()}`,
      loanProductName: "Test Loan Product",
      saccoId: "SAC-9068",
      loanProductType: "LOAN",
      loanProductStatus: "Pending",
      description: "Test loan product for CRUD operations",
      needGuarantors: true,
      maxGuarantors: 2,
      minGuarantors: 1
    };

    const createResponse = await axios.post(`${BASE_URL}/loan-products/test`, testLoanProduct);
    console.log('✅ Loan Product created successfully');
    console.log('Loan Product ID:', createResponse.data.entity?.loanProduct?.id);
    const loanProductId = createResponse.data.entity?.loanProduct?.id;
    
    if (!loanProductId) {
      console.error('❌ No loan product ID returned');
      return false;
    }

    // READ Loan Product
    console.log('\n2. Reading Loan Product...');
    const readResponse = await axios.get(`${BASE_URL}/loan-products/${loanProductId}`, {
      headers: { accessToken: authToken }
    });
    console.log('✅ Loan Product read successfully');
    console.log('Loan Product Name:', readResponse.data.entity?.loanProductName);

    // UPDATE Loan Product
    console.log('\n3. Updating Loan Product...');
    const updateData = {
      loanProductName: "Updated Test Loan Product",
      status: "Active"
    };

    const updateResponse = await axios.put(`${BASE_URL}/loan-products/${loanProductId}`, updateData, {
      headers: { accessToken: authToken }
    });
    console.log('✅ Loan Product updated successfully');

    // DELETE Loan Product
    console.log('\n4. Deleting Loan Product...');
    const deleteResponse = await axios.delete(`${BASE_URL}/loan-products/${loanProductId}`, {
      headers: { accessToken: authToken }
    });
    console.log('✅ Loan Product deleted successfully');

    return true;
  } catch (error) {
    console.error('❌ Loan Product CRUD test failed:', error.response?.data || error.message);
    return false;
  }
}

async function testAccountTypeReflection() {
  console.log('\n=== TESTING ACCOUNT TYPE REFLECTION ===');
  
  try {
    // CREATE Product and check if Account Type is created
    console.log('\n1. Creating Product and checking Account Type creation...');
    const testProduct = {
      productId: `P-REFLECT-${Date.now()}`,
      productName: "Reflection Test Product",
      saccoId: "SAC-9068",
      productType: "BOSA",
      productStatus: "Pending",
      description: "Test product for account type reflection"
    };

    const createResponse = await axios.post(`${BASE_URL}/products/test`, testProduct);
    console.log('✅ Product created successfully');
    
    const productId = createResponse.data.entity?.product?.id;
    const accountType = createResponse.data.entity?.accountType;
    
    if (accountType) {
      console.log('✅ Account Type automatically created');
      console.log('Account Type ID:', accountType.id);
      console.log('Account Type Name:', accountType.accountTypeName);
    } else {
      console.log('⚠️ No Account Type was automatically created');
    }

    // CREATE Loan Product and check if Account Type is created
    console.log('\n2. Creating Loan Product and checking Account Type creation...');
    const testLoanProduct = {
      loanProductId: `LP-REFLECT-${Date.now()}`,
      loanProductName: "Reflection Test Loan Product",
      saccoId: "SAC-9068",
      loanProductType: "LOAN",
      loanProductStatus: "Pending",
      description: "Test loan product for account type reflection"
    };

    const createLoanResponse = await axios.post(`${BASE_URL}/loan-products/test`, testLoanProduct);
    console.log('✅ Loan Product created successfully');
    
    const loanProductId = createLoanResponse.data.entity?.loanProduct?.id;
    const loanAccountType = createLoanResponse.data.entity?.accountType;
    
    if (loanAccountType) {
      console.log('✅ Account Type automatically created for Loan Product');
      console.log('Account Type ID:', loanAccountType.id);
      console.log('Account Type Name:', loanAccountType.accountTypeName);
    } else {
      console.log('⚠️ No Account Type was automatically created for Loan Product');
    }

    // Test Account Type CRUD operations
    if (accountType) {
      console.log('\n3. Testing Account Type CRUD operations...');
      
      // READ Account Type
      const readResponse = await axios.get(`${BASE_URL}/account-types/${accountType.id}`, {
        headers: { accessToken: authToken }
      });
      console.log('✅ Account Type read successfully');

      // UPDATE Account Type
      const updateData = {
        accountTypeName: "Updated Reflection Test Account Type",
        status: "Active"
      };

      const updateResponse = await axios.put(`${BASE_URL}/account-types/${accountType.id}`, updateData, {
        headers: { accessToken: authToken }
      });
      console.log('✅ Account Type updated successfully');

      // DELETE Account Type
      const deleteResponse = await axios.delete(`${BASE_URL}/account-types/${accountType.id}`, {
        headers: { accessToken: authToken }
      });
      console.log('✅ Account Type deleted successfully');
    }

    return true;
  } catch (error) {
    console.error('❌ Account Type reflection test failed:', error.response?.data || error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Comprehensive CRUD Tests...\n');
  
  // Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }
  
  // Test Product CRUD
  const productSuccess = await testProductCRUD();
  
  // Test Loan Product CRUD
  const loanProductSuccess = await testLoanProductCRUD();
  
  // Test Account Type Reflection
  const reflectionSuccess = await testAccountTypeReflection();
  
  console.log('\n=== TEST RESULTS ===');
  console.log(`Product CRUD: ${productSuccess ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Loan Product CRUD: ${loanProductSuccess ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Account Type Reflection: ${reflectionSuccess ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (productSuccess && loanProductSuccess && reflectionSuccess) {
    console.log('\n🎉 All tests passed successfully!');
  } else {
    console.log('\n⚠️ Some tests failed. Check the logs above for details.');
  }
}

// Run the tests
runAllTests().catch(console.error);
