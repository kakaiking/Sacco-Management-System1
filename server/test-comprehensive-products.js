const axios = require('axios');

async function testComprehensiveProducts() {
  try {
    console.log('=== COMPREHENSIVE PRODUCT CRUD TEST ===\n');
    
    // First get a valid token
    console.log('1. Getting authentication token...');
    const loginResponse = await axios.post('http://localhost:3001/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    const validToken = loginResponse.data.token;
    console.log('✓ Got valid token\n');

    // Test 1: CREATE - Create a new product
    console.log('2. Testing CREATE operation...');
    const testProduct = {
      productId: `P-TEST${Date.now()}`,
      productName: "Test Savings Product",
      saccoId: "SAC-9068",
      currency: "USD",
      productType: "BOSA",
      productStatus: "Pending",
      status: "Pending",
      interestRate: 12.5,
      interestType: "Simple",
      interestCalculationRule: "Daily",
      interestFrequency: "Monthly",
      isCreditInterest: true,
      isDebitInterest: false,
      needGuarantors: false,
      maxGuarantors: null,
      minGuarantors: null,
      isSpecial: false,
      maxSpecialUsers: null,
      appliedOnMemberOnboarding: false,
      isWithdrawable: true,
      withdrawableFrom: null,
      chargeIds: null,
      createdBy: "TestUser",
      createdOn: new Date().toISOString(),
      modifiedBy: "TestUser",
      modifiedOn: new Date().toISOString()
    };

    const createResponse = await axios.post('http://localhost:3001/products', testProduct, {
      headers: { 
        accessToken: validToken
      }
    });
    
    console.log('✓ Product created successfully');
    console.log('Response:', JSON.stringify(createResponse.data, null, 2));
    const createdProductId = createResponse.data.entity?.product?.id;
    console.log('Created Product ID:', createdProductId);
    console.log('');

    // Test 2: READ - Get all products
    console.log('3. Testing READ operation (GET all products)...');
    const getAllResponse = await axios.get('http://localhost:3001/products', {
      headers: { 
        accessToken: validToken
      }
    });
    
    console.log('✓ Products fetched successfully');
    console.log('Total products:', getAllResponse.data.entity?.length || 0);
    console.log('');

    // Test 3: READ - Get specific product
    if (createdProductId) {
      console.log('4. Testing READ operation (GET specific product)...');
      const getOneResponse = await axios.get(`http://localhost:3001/products/${createdProductId}`, {
        headers: { 
          accessToken: validToken
        }
      });
      
      console.log('✓ Product fetched successfully');
      console.log('Product details:', JSON.stringify(getOneResponse.data.entity, null, 2));
      console.log('');
    }

    // Test 4: UPDATE - Update the product
    if (createdProductId) {
      console.log('5. Testing UPDATE operation...');
      const updateData = {
        productName: "Updated Test Savings Product",
        interestRate: 15.0,
        status: "Approved",
        modifiedBy: "TestUser",
        modifiedOn: new Date().toISOString()
      };

      const updateResponse = await axios.put(`http://localhost:3001/products/${createdProductId}`, updateData, {
        headers: { 
          accessToken: validToken
        }
      });
      
      console.log('✓ Product updated successfully');
      console.log('Update response:', JSON.stringify(updateResponse.data, null, 2));
      console.log('');
    }

    // Test 5: DELETE - Delete the product (soft delete)
    if (createdProductId) {
      console.log('6. Testing DELETE operation...');
      const deleteResponse = await axios.delete(`http://localhost:3001/products/${createdProductId}`, {
        headers: { 
          accessToken: validToken
        }
      });
      
      console.log('✓ Product deleted successfully');
      console.log('Delete response:', JSON.stringify(deleteResponse.data, null, 2));
      console.log('');
    }

    console.log('=== ALL CRUD OPERATIONS COMPLETED SUCCESSFULLY ===');

  } catch (error) {
    console.error('=== ERROR OCCURRED ===');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('Full error:', error.message);
    
    if (error.response?.data?.message?.includes('Sacco with ID')) {
      console.error('\n=== SUGGESTION ===');
      console.error('The SACCO ID might not exist. Available SACCOs:');
      console.error('- SAC-9068 (Great Sacco)');
      console.error('- SYSTEM (System Default Sacco)');
    }
  }
}

testComprehensiveProducts();
