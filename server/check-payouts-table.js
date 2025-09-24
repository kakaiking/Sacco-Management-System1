const { sequelize } = require('./models');

async function checkPayoutsTable() {
  try {
    console.log('🔍 Checking Payouts table structure...');
    
    // Check if table exists
    const [results] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'Payouts'
    `);
    
    if (results.length === 0) {
      console.log('❌ Payouts table does not exist');
      return;
    }
    
    console.log('✅ Payouts table exists');
    
    // Check table structure
    const [columns] = await sequelize.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Payouts'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('\n📋 Table structure:');
    columns.forEach(col => {
      console.log(`   ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'YES' ? '(nullable)' : '(not null)'} ${col.COLUMN_DEFAULT ? `default: ${col.COLUMN_DEFAULT}` : ''}`);
    });
    
    // Check if memberId column exists
    const memberIdColumn = columns.find(col => col.COLUMN_NAME === 'memberId');
    if (memberIdColumn) {
      console.log('\n✅ memberId column exists');
    } else {
      console.log('\n❌ memberId column missing');
    }
    
  } catch (error) {
    console.error('❌ Error checking table:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkPayoutsTable();
