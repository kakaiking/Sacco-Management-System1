/**
 * Script to fix and recalculate account balances
 * This script will recalculate availableBalance and totalBalance for all accounts
 * based on the correct formulas
 */

const { Accounts, sequelize } = require("../models");
const { recalculateAllAccountBalances } = require("../helpers/balanceCalculation");

async function fixAccountBalances() {
  console.log("Starting account balance recalculation...");
  console.log("===========================================\n");
  
  try {
    // Get all accounts before fix
    const accountsBefore = await Accounts.findAll({
      where: { isDeleted: 0 },
      attributes: [
        'accountId',
        'clearBalance',
        'unsupervisedCredits',
        'unsupervisedDebits',
        'frozenAmount',
        'pendingCharges',
        'availableBalance',
        'totalBalance'
      ]
    });
    
    console.log(`Found ${accountsBefore.length} accounts to process\n`);
    
    // Show sample before
    if (accountsBefore.length > 0) {
      console.log("Sample account BEFORE fix:");
      const sample = accountsBefore[0];
      console.log(`  Account ID: ${sample.accountId}`);
      console.log(`  Clear Balance: ${sample.clearBalance}`);
      console.log(`  Unsupervised Credits: ${sample.unsupervisedCredits}`);
      console.log(`  Unsupervised Debits: ${sample.unsupervisedDebits}`);
      console.log(`  Frozen Amount: ${sample.frozenAmount}`);
      console.log(`  Pending Charges: ${sample.pendingCharges}`);
      console.log(`  Available Balance (OLD): ${sample.availableBalance}`);
      console.log(`  Total Balance (OLD): ${sample.totalBalance}`);
      
      // Calculate what it should be
      const expectedAvailable = parseFloat(sample.clearBalance) 
        + parseFloat(sample.unsupervisedCredits) 
        - parseFloat(sample.unsupervisedDebits)
        - parseFloat(sample.frozenAmount)
        - parseFloat(sample.pendingCharges);
      console.log(`  Available Balance (EXPECTED): ${expectedAvailable.toFixed(2)}`);
      console.log();
    }
    
    // Recalculate all balances
    const updateCount = await recalculateAllAccountBalances(Accounts);
    
    console.log(`\n✓ Successfully recalculated balances for ${updateCount} accounts\n`);
    
    // Show sample after
    if (accountsBefore.length > 0) {
      const accountAfter = await Accounts.findOne({
        where: { accountId: accountsBefore[0].accountId }
      });
      
      console.log("Sample account AFTER fix:");
      console.log(`  Account ID: ${accountAfter.accountId}`);
      console.log(`  Clear Balance: ${accountAfter.clearBalance}`);
      console.log(`  Unsupervised Credits: ${accountAfter.unsupervisedCredits}`);
      console.log(`  Unsupervised Debits: ${accountAfter.unsupervisedDebits}`);
      console.log(`  Frozen Amount: ${accountAfter.frozenAmount}`);
      console.log(`  Pending Charges: ${accountAfter.pendingCharges}`);
      console.log(`  Available Balance (NEW): ${accountAfter.availableBalance}`);
      console.log(`  Total Balance (NEW): ${accountAfter.totalBalance}`);
      console.log();
    }
    
    console.log("===========================================");
    console.log("✓ Balance recalculation complete!");
    
    process.exit(0);
  } catch (error) {
    console.error("\n✗ Error recalculating balances:", error);
    process.exit(1);
  }
}

// Run the script
fixAccountBalances();

