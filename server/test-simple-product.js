const { Products, Sacco } = require('./models');

async function testSimpleProduct() {
  try {
    console.log('=== SIMPLE PRODUCT TEST ===\n');
    
    // Test 1: Check if we can connect to the database
    console.log('1. Testing database connection...');
    const saccoCount = await Sacco.count();
    console.log('✓ Database connected. Sacco count:', saccoCount);
    
    // Test 2: Check if we can find the SACCO
    console.log('\n2. Testing SACCO lookup...');
    const sacco = await Sacco.findOne({ where: { saccoId: 'SAC-9068' } });
    if (sacco) {
      console.log('✓ SACCO found:', sacco.saccoName, 'ID:', sacco.id);
    } else {
      console.log('✗ SACCO not found');
      return;
    }
    
    // Test 3: Try to create a product directly
    console.log('\n3. Testing direct product creation...');
    const testProduct = {
      productId: "P-SIMPLETEST",
      productName: "Simple Test Product",
      saccoId: sacco.id, // Use the database ID, not the saccoId string
      currency: "USD",
      productType: "BOSA",
      productStatus: "Pending",
      status: "Pending",
      interestRate: 10.0,
      isCreditInterest: true,
      isDebitInterest: false,
      needGuarantors: false,
      isSpecial: false,
      appliedOnMemberOnboarding: false,
      isWithdrawable: true,
      createdOn: new Date(),
      createdBy: "TestUser",
    };
    
    const createdProduct = await Products.create(testProduct);
    console.log('✓ Product created successfully:', createdProduct.id);
    console.log('Product details:', JSON.stringify(createdProduct.dataValues, null, 2));
    
    // Test 4: Try to read the product
    console.log('\n4. Testing product read...');
    const foundProduct = await Products.findByPk(createdProduct.id);
    if (foundProduct) {
      console.log('✓ Product read successfully');
    } else {
      console.log('✗ Product not found');
    }
    
    // Test 5: Try to update the product
    console.log('\n5. Testing product update...');
    const [updateCount] = await Products.update(
      { productName: "Updated Simple Test Product", interestRate: 15.0 },
      { where: { id: createdProduct.id } }
    );
    console.log('✓ Product updated. Rows affected:', updateCount);
    
    // Test 6: Try to delete the product
    console.log('\n6. Testing product delete...');
    const [deleteCount] = await Products.update(
      { isDeleted: 1, status: "Deleted" },
      { where: { id: createdProduct.id } }
    );
    console.log('✓ Product deleted. Rows affected:', deleteCount);
    
    console.log('\n=== ALL DIRECT DATABASE OPERATIONS SUCCESSFUL ===');
    
  } catch (error) {
    console.error('=== ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
  }
}

testSimpleProduct();