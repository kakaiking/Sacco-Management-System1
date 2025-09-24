const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
let authToken = '';

async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    authToken = response.data.token;
    console.log('✅ Login successful');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
}

async function testCreateProduct() {
  try {
    const testProduct = {
      productId: `P-TEST-${Date.now()}`,
      productName: "Test Savings Product",
      saccoId: "SAC-9068",
      currency: "KES",
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
      isSpecial: false,
      appliedOnMemberOnboarding: false,
      isWithdrawable: true,
      chargeIds: null
    };

    const response = await axios.post(`${BASE_URL}/products`, testProduct, {
      headers: { accessToken: authToken }
    });
    
    console.log('✅ Product created successfully:', response.data.entity.product.id);
    return response.data.entity.product;
  } catch (error) {
    console.error('❌ Product creation failed:', error.response?.data || error.message);
    return null;
  }
}

async function testGetProducts() {
  try {
    const response = await axios.get(`${BASE_URL}/products`, {
      headers: { accessToken: authToken }
    });
    
    console.log('✅ Products retrieved successfully. Count:', response.data.entity.length);
    return response.data.entity;
  } catch (error) {
    console.error('❌ Get products failed:', error.response?.data || error.message);
    return null;
  }
}

async function testGetProductById(productId) {
  try {
    const response = await axios.get(`${BASE_URL}/products/${productId}`, {
      headers: { accessToken: authToken }
    });
    
    console.log('✅ Product retrieved by ID successfully:', response.data.entity.productName);
    return response.data.entity;
  } catch (error) {
    console.error('❌ Get product by ID failed:', error.response?.data || error.message);
    return null;
  }
}

async function testUpdateProduct(productId) {
  try {
    const updateData = {
      productName: "Updated Test Savings Product",
      interestRate: 15.0,
      status: "Active"
    };

    const response = await axios.put(`${BASE_URL}/products/${productId}`, updateData, {
      headers: { accessToken: authToken }
    });
    
    console.log('✅ Product updated successfully:', response.data.entity.productName);
    return response.data.entity;
  } catch (error) {
    console.error('❌ Product update failed:', error.response?.data || error.message);
    return null;
  }
}

async function testDeleteProduct(productId) {
  try {
    const response = await axios.delete(`${BASE_URL}/products/${productId}`, {
      headers: { accessToken: authToken }
    });
    
    console.log('✅ Product deleted successfully');
    return true;
  } catch (error) {
    console.error('❌ Product deletion failed:', error.response?.data || error.message);
    return false;
  }
}

async function testSearchProducts() {
  try {
    const response = await axios.get(`${BASE_URL}/products?q=Test`, {
      headers: { accessToken: authToken }
    });
    
    console.log('✅ Product search successful. Results:', response.data.entity.length);
    return response.data.entity;
  } catch (error) {
    console.error('❌ Product search failed:', error.response?.data || error.message);
    return null;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Products CRUD Tests...\n');
  
  // Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }
  
  // Test 1: Create Product
  console.log('\n1. Testing Product Creation...');
  const createdProduct = await testCreateProduct();
  if (!createdProduct) return;
  
  // Test 2: Get All Products
  console.log('\n2. Testing Get All Products...');
  await testGetProducts();
  
  // Test 3: Get Product by ID
  console.log('\n3. Testing Get Product by ID...');
  await testGetProductById(createdProduct.id);
  
  // Test 4: Update Product
  console.log('\n4. Testing Product Update...');
  await testUpdateProduct(createdProduct.id);
  
  // Test 5: Search Products
  console.log('\n5. Testing Product Search...');
  await testSearchProducts();
  
  // Test 6: Delete Product
  console.log('\n6. Testing Product Deletion...');
  await testDeleteProduct(createdProduct.id);
  
  console.log('\n🎉 All Products CRUD tests completed!');
}

// Run the tests
runAllTests().catch(console.error);



