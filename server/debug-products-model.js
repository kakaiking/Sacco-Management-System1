const { Products, Sacco } = require('./models');

async function testProductsModel() {
  try {
    console.log('Testing Products model...');
    
    // Check if Sacco exists
    const sacco = await Sacco.findOne({ where: { saccoId: 'SYSTEM' } });
    console.log('Sacco found:', sacco ? `ID: ${sacco.id}, saccoId: ${sacco.saccoId}` : 'Not found');
    
    if (!sacco) {
      console.error('❌ Sacco with saccoId SYSTEM not found');
      return;
    }
    
    // Test product creation
    const testData = {
      productId: `SAV-${Date.now()}`,
      productName: `Test Savings Product ${Date.now()}`,
      saccoId: sacco.id, // Use the database ID, not the saccoId string
      productType: 'BOSA',
      productStatus: 'Pending',
      status: 'Pending',
      description: 'Test savings product for debugging',
      isSpecial: false,
      createdOn: new Date(),
      createdBy: 'test-user'
    };
    
    console.log('Creating product with data:', JSON.stringify(testData, null, 2));
    
    const product = await Products.create(testData);
    console.log('✅ Product created successfully:', product.id);
    
    // Clean up
    await product.destroy();
    console.log('✅ Test product cleaned up');
    
  } catch (error) {
    console.error('❌ Error:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    if (error.name === 'SequelizeValidationError') {
      console.error('Validation errors:');
      error.errors.forEach((err, index) => {
        console.error(`  ${index + 1}. Field: ${err.path}, Message: ${err.message}, Value: ${err.value}`);
      });
    }
  }
}

testProductsModel();
