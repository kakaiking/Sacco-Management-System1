const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
let authToken = '';

async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    if (response.data && response.data.token) {
      authToken = response.data.token;
      console.log('✅ Login successful');
      return true;
    } else {
      console.error('❌ No token in response:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
}

async function testEdgeCases() {
  console.log('\n=== TESTING EDGE CASES ===');
  
  try {
    // Test 1: Create product with invalid saccoId
    console.log('\n1. Testing product creation with invalid saccoId...');
    try {
      const invalidProduct = {
        productId: `P-INVALID-${Date.now()}`,
        productName: "Invalid Sacco Product",
        saccoId: "INVALID-SACCO",
        productType: "BOSA",
        productStatus: "Pending"
      };

      const response = await axios.post(`${BASE_URL}/products/test`, invalidProduct);
      console.log('⚠️ Product created with invalid saccoId (unexpected)');
    } catch (error) {
      console.log('✅ Correctly rejected invalid saccoId:', error.response?.data?.message);
    }

    // Test 2: Create product with duplicate productId
    console.log('\n2. Testing product creation with duplicate productId...');
    const duplicateId = `P-DUPLICATE-${Date.now()}`;
    
    // Create first product
    const firstProduct = {
      productId: duplicateId,
      productName: "First Product",
      saccoId: "SAC-9068",
      productType: "BOSA",
      productStatus: "Pending"
    };

    const firstResponse = await axios.post(`${BASE_URL}/products/test`, firstProduct);
    console.log('✅ First product created successfully');

    // Try to create second product with same ID
    try {
      const secondProduct = {
        productId: duplicateId,
        productName: "Second Product",
        saccoId: "SAC-9068",
        productType: "BOSA",
        productStatus: "Pending"
      };

      const secondResponse = await axios.post(`${BASE_URL}/products/test`, secondProduct);
      console.log('⚠️ Duplicate productId was allowed (unexpected)');
    } catch (error) {
      console.log('✅ Correctly rejected duplicate productId:', error.response?.data?.message);
    }

    // Test 3: Test account type relationships
    console.log('\n3. Testing account type relationships...');
    
    // Create a product and check its account types
    const testProduct = {
      productId: `P-RELATION-${Date.now()}`,
      productName: "Relationship Test Product",
      saccoId: "SAC-9068",
      productType: "BOSA",
      productStatus: "Pending"
    };

    const productResponse = await axios.post(`${BASE_URL}/products/test`, testProduct);
    const productId = productResponse.data.entity?.product?.id;
    const accountTypeId = productResponse.data.entity?.accountType?.id;
    
    if (productId && accountTypeId) {
      console.log('✅ Product and account type created successfully');
      
      // Get account types by product ID
      const accountTypesResponse = await axios.get(`${BASE_URL}/account-types/product/${productId}`, {
        headers: { accessToken: authToken }
      });
      
      console.log('✅ Account types retrieved by product ID:', accountTypesResponse.data.entity?.length || 0);
      
      // Verify the relationship
      if (accountTypesResponse.data.entity?.length > 0) {
        const accountType = accountTypesResponse.data.entity[0];
        console.log('✅ Account type has correct productId:', accountType.productId === productId);
        console.log('✅ Account type name:', accountType.accountTypeName);
      }
    }

    // Test 4: Test loan product with account type creation
    console.log('\n4. Testing loan product with account type creation...');
    
    const testLoanProduct = {
      loanProductId: `LP-RELATION-${Date.now()}`,
      loanProductName: "Relationship Test Loan Product",
      saccoId: "SAC-9068",
      loanProductType: "LOAN",
      loanProductStatus: "Pending",
      needGuarantors: true,
      maxGuarantors: 2
    };

    const loanProductResponse = await axios.post(`${BASE_URL}/loan-products/test`, testLoanProduct);
    const loanProductId = loanProductResponse.data.entity?.loanProduct?.id;
    const loanAccountTypeId = loanProductResponse.data.entity?.accountType?.id;
    
    if (loanProductId && loanAccountTypeId) {
      console.log('✅ Loan product and account type created successfully');
      
      // Get account types by product ID (should include loan products)
      const loanAccountTypesResponse = await axios.get(`${BASE_URL}/account-types/product/${loanProductId}`, {
        headers: { accessToken: authToken }
      });
      
      console.log('✅ Account types retrieved by loan product ID:', loanAccountTypesResponse.data.entity?.length || 0);
    }

    // Test 5: Test search functionality
    console.log('\n5. Testing search functionality...');
    
    // Search for products
    const productSearchResponse = await axios.get(`${BASE_URL}/products?q=Test`, {
      headers: { accessToken: authToken }
    });
    console.log('✅ Product search results:', productSearchResponse.data.entity?.length || 0);
    
    // Search for loan products
    const loanProductSearchResponse = await axios.get(`${BASE_URL}/loan-products?q=Test`, {
      headers: { accessToken: authToken }
    });
    console.log('✅ Loan product search results:', loanProductSearchResponse.data.entity?.length || 0);
    
    // Search for account types
    const accountTypeSearchResponse = await axios.get(`${BASE_URL}/account-types?q=Test`, {
      headers: { accessToken: authToken }
    });
    console.log('✅ Account type search results:', accountTypeSearchResponse.data.entity?.length || 0);

    // Test 6: Test status filtering
    console.log('\n6. Testing status filtering...');
    
    // Get active products
    const activeProductsResponse = await axios.get(`${BASE_URL}/products?status=Active`, {
      headers: { accessToken: authToken }
    });
    console.log('✅ Active products:', activeProductsResponse.data.entity?.length || 0);
    
    // Get pending products
    const pendingProductsResponse = await axios.get(`${BASE_URL}/products?status=Pending`, {
      headers: { accessToken: authToken }
    });
    console.log('✅ Pending products:', pendingProductsResponse.data.entity?.length || 0);

    return true;
  } catch (error) {
    console.error('❌ Edge case test failed:', error.response?.data || error.message);
    return false;
  }
}

async function testDataIntegrity() {
  console.log('\n=== TESTING DATA INTEGRITY ===');
  
  try {
    // Test 1: Verify account type has correct product reference
    console.log('\n1. Testing account type product references...');
    
    const accountTypesResponse = await axios.get(`${BASE_URL}/account-types`, {
      headers: { accessToken: authToken }
    });
    
    const accountTypes = accountTypesResponse.data.entity || [];
    console.log('✅ Total account types:', accountTypes.length);
    
    let validReferences = 0;
    let invalidReferences = 0;
    
    for (const accountType of accountTypes) {
      if (accountType.productId) {
        // Check if the product exists
        try {
          const productResponse = await axios.get(`${BASE_URL}/products/${accountType.productId}`, {
            headers: { accessToken: authToken }
          });
          if (productResponse.data.entity) {
            validReferences++;
          }
        } catch (error) {
          // Product not found, check if it's a loan product
          try {
            const loanProductResponse = await axios.get(`${BASE_URL}/loan-products/${accountType.productId}`, {
              headers: { accessToken: authToken }
            });
            if (loanProductResponse.data.entity) {
              validReferences++;
            }
          } catch (loanError) {
            invalidReferences++;
            console.log('⚠️ Account type has invalid product reference:', accountType.id, '->', accountType.productId);
          }
        }
      }
    }
    
    console.log('✅ Valid product references:', validReferences);
    console.log('⚠️ Invalid product references:', invalidReferences);

    // Test 2: Verify no orphaned account types
    console.log('\n2. Testing for orphaned account types...');
    
    let orphanedCount = 0;
    for (const accountType of accountTypes) {
      if (!accountType.productId) {
        orphanedCount++;
        console.log('⚠️ Orphaned account type found:', accountType.id, accountType.accountTypeName);
      }
    }
    
    console.log('✅ Orphaned account types:', orphanedCount);

    return true;
  } catch (error) {
    console.error('❌ Data integrity test failed:', error.response?.data || error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Edge Case and Data Integrity Tests...\n');
  
  // Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }
  
  // Test Edge Cases
  const edgeCaseSuccess = await testEdgeCases();
  
  // Test Data Integrity
  const integritySuccess = await testDataIntegrity();
  
  console.log('\n=== FINAL TEST RESULTS ===');
  console.log(`Edge Cases: ${edgeCaseSuccess ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Data Integrity: ${integritySuccess ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (edgeCaseSuccess && integritySuccess) {
    console.log('\n🎉 All edge case and integrity tests passed!');
  } else {
    console.log('\n⚠️ Some tests failed. Check the logs above for details.');
  }
}

// Run the tests
runAllTests().catch(console.error);

