const { sequelize } = require('./models');
const migration = require('./migrations/20250128000000-create-payouts-table');

async function runPayoutsMigration() {
  try {
    console.log('Running payouts migration...');
    await migration.up(sequelize.getQueryInterface(), sequelize.constructor);
    console.log('🎉 Payouts migration completed successfully!');
  } catch (error) {
    console.error('❌ Payouts migration failed:', error.message);
  } finally {
    await sequelize.close();
  }
}

runPayoutsMigration();
