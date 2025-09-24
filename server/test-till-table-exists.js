const { Sequelize } = require('sequelize');

// Database configuration
const config = {
  username: "Realm",
  password: "friend",
  database: "dream_nest",
  host: "CSK-BRNET-00052",
  port: 1433,
  dialect: "mssql",
  dialectOptions: {
    options: {
      encrypt: false,
      trustServerCertificate: true
    }
  }
};

async function testTillTableExists() {
  console.log('🧪 Testing if Till table exists...\n');

  const sequelize = new Sequelize(config.database, config.username, config.password, config);

  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');

    // Check if Till table exists
    const [results] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'Tills'
    `);

    if (results.length > 0) {
      console.log('✅ Till table exists in the database');
      
      // Check table structure
      const [columns] = await sequelize.query(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Tills'
        ORDER BY ORDINAL_POSITION
      `);
      
      console.log('\n📋 Till table structure:');
      columns.forEach(col => {
        console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'nullable' : 'not null'})`);
      });

      // Check if there are any records
      const [count] = await sequelize.query(`
        SELECT COUNT(*) as count FROM Tills
      `);
      
      console.log(`\n📊 Records in Till table: ${count[0].count}`);

    } else {
      console.log('❌ Till table does not exist in the database');
    }

  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await sequelize.close();
  }
}

// Run the test
testTillTableExists();
