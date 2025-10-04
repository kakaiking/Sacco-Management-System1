/**
 * Balance Calculation Helper
 * Provides functions to calculate account balances based on the correct formulas
 */

/**
 * Calculate available balance
 * Formula: clearBalance + unsupervisedCredits - unsupervisedDebits - frozenAmount - pendingCharges
 * 
 * @param {Object} account - Account object with balance fields
 * @returns {Number} - Calculated available balance
 */
function calculateAvailableBalance(account) {
  const clearBalance = parseFloat(account.clearBalance || 0);
  const unsupervisedCredits = parseFloat(account.unsupervisedCredits || 0);
  const unsupervisedDebits = parseFloat(account.unsupervisedDebits || 0);
  const frozenAmount = parseFloat(account.frozenAmount || 0);
  const pendingCharges = parseFloat(account.pendingCharges || 0);
  
  return clearBalance + unsupervisedCredits - unsupervisedDebits - frozenAmount - pendingCharges;
}

/**
 * Calculate total balance
 * Formula: clearBalance + unclearBalance + creditInterest
 * 
 * @param {Object} account - Account object with balance fields
 * @returns {Number} - Calculated total balance
 */
function calculateTotalBalance(account) {
  const clearBalance = parseFloat(account.clearBalance || 0);
  const unclearBalance = parseFloat(account.unclearBalance || 0);
  const creditInterest = parseFloat(account.creditInterest || 0);
  
  return clearBalance + unclearBalance + creditInterest;
}

/**
 * Recalculate and update all balances for an account
 * 
 * @param {Object} Accounts - Sequelize Accounts model
 * @param {String} accountId - Account ID
 * @param {Object} transaction - Sequelize transaction (optional)
 * @returns {Object} - Updated account with recalculated balances
 */
async function recalculateAccountBalances(Accounts, accountId, transaction = null) {
  // Fetch current account
  const account = await Accounts.findOne({
    where: { accountId },
    transaction
  });
  
  if (!account) {
    throw new Error(`Account ${accountId} not found`);
  }
  
  // Calculate new balances
  const availableBalance = calculateAvailableBalance(account);
  const totalBalance = calculateTotalBalance(account);
  
  // Update account
  await account.update(
    {
      availableBalance,
      totalBalance
    },
    { transaction }
  );
  
  return account;
}

/**
 * Recalculate balances for multiple accounts
 * 
 * @param {Object} Accounts - Sequelize Accounts model
 * @param {Array} accountIds - Array of account IDs
 * @param {Object} transaction - Sequelize transaction (optional)
 * @returns {Array} - Updated accounts
 */
async function recalculateMultipleAccountBalances(Accounts, accountIds, transaction = null) {
  const updatedAccounts = [];
  
  for (const accountId of accountIds) {
    const account = await recalculateAccountBalances(Accounts, accountId, transaction);
    updatedAccounts.push(account);
  }
  
  return updatedAccounts;
}

/**
 * Recalculate balances for all accounts in the system
 * Useful for migrations or data fixes
 * 
 * @param {Object} Accounts - Sequelize Accounts model
 * @returns {Number} - Number of accounts updated
 */
async function recalculateAllAccountBalances(Accounts) {
  const accounts = await Accounts.findAll({
    where: { isDeleted: 0 }
  });
  
  let updateCount = 0;
  
  for (const account of accounts) {
    const availableBalance = calculateAvailableBalance(account);
    const totalBalance = calculateTotalBalance(account);
    
    await account.update({
      availableBalance,
      totalBalance
    });
    
    updateCount++;
  }
  
  return updateCount;
}

module.exports = {
  calculateAvailableBalance,
  calculateTotalBalance,
  recalculateAccountBalances,
  recalculateMultipleAccountBalances,
  recalculateAllAccountBalances
};

