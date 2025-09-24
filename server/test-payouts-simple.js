const { Payouts, Members, Products, LoanProducts, Sacco } = require('./models');

async function testPayoutsSimple() {
  try {
    console.log('🧪 Testing Payouts model...');
    
    // Test 1: Simple find without includes
    console.log('\n1. Testing simple find...');
    const simpleResult = await Payouts.findAll({
      limit: 5
    });
    console.log(`✅ Simple find successful: ${simpleResult.length} records`);
    
    // Test 2: Test with Sacco include
    console.log('\n2. Testing with Sacco include...');
    const saccoResult = await Payouts.findAll({
      include: [
        { model: Sacco, as: 'sacco', attributes: ['saccoId', 'saccoName'] }
      ],
      limit: 5
    });
    console.log(`✅ Sacco include successful: ${saccoResult.length} records`);
    
    // Test 3: Test with Members include
    console.log('\n3. Testing with Members include...');
    try {
      const membersResult = await Payouts.findAll({
        include: [
          { model: Members, as: 'member', attributes: ['id', 'memberNo', 'firstName', 'lastName'] }
        ],
        limit: 5
      });
      console.log(`✅ Members include successful: ${membersResult.length} records`);
    } catch (error) {
      console.log(`❌ Members include failed: ${error.message}`);
    }
    
    // Test 4: Test with Products include
    console.log('\n4. Testing with Products include...');
    try {
      const productsResult = await Payouts.findAll({
        include: [
          { model: Products, as: 'product', attributes: ['id', 'productId', 'productName'] }
        ],
        limit: 5
      });
      console.log(`✅ Products include successful: ${productsResult.length} records`);
    } catch (error) {
      console.log(`❌ Products include failed: ${error.message}`);
    }
    
    // Test 5: Test with LoanProducts include
    console.log('\n5. Testing with LoanProducts include...');
    try {
      const loanProductsResult = await Payouts.findAll({
        include: [
          { model: LoanProducts, as: 'loanProduct', attributes: ['id', 'loanProductId', 'loanProductName'] }
        ],
        limit: 5
      });
      console.log(`✅ LoanProducts include successful: ${loanProductsResult.length} records`);
    } catch (error) {
      console.log(`❌ LoanProducts include failed: ${error.message}`);
    }
    
    // Test 6: Test all includes together
    console.log('\n6. Testing all includes together...');
    try {
      const allIncludesResult = await Payouts.findAll({
        include: [
          { model: Sacco, as: 'sacco', attributes: ['saccoId', 'saccoName'] },
          { model: Members, as: 'member', attributes: ['id', 'memberNo', 'firstName', 'lastName'] },
          { model: Products, as: 'product', attributes: ['id', 'productId', 'productName'] },
          { model: LoanProducts, as: 'loanProduct', attributes: ['id', 'loanProductId', 'loanProductName'] }
        ],
        limit: 5
      });
      console.log(`✅ All includes successful: ${allIncludesResult.length} records`);
    } catch (error) {
      console.log(`❌ All includes failed: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Critical error:', error.message);
  }
}

testPayoutsSimple();
