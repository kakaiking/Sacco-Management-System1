const { 
  Payouts, 
  Accounts, 
  Members, 
  Products, 
  LoanProducts, 
  LoanApplications, 
  Transactions, 
  GLAccounts,
  sequelize 
} = require('../models');
const { Op } = require('sequelize');

class AutomatedPayoutService {
  constructor() {
    this.log = (message, data = null) => {
      console.log(`[${new Date().toISOString()}] 🤖 AUTO-PAYOUT: ${message}`);
      if (data) {
        console.log(JSON.stringify(data, null, 2));
      }
    };
  }

  // Generate unique payout ID
  generatePayoutId() {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `PAY-${timestamp}${random}`;
  }

  // Generate unique reference number
  generateReferenceNumber() {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `REF-${timestamp}${random}`;
  }

  // Calculate interest based on period and rate
  calculateInterest(principal, rate, calculationPeriod) {
    const principalAmount = parseFloat(principal);
    const interestRate = parseFloat(rate);
    
    if (calculationPeriod === 'DAILY') {
      return principalAmount * interestRate / 365;
    } else if (calculationPeriod === 'MONTHLY') {
      return principalAmount * interestRate / 12;
    } else if (calculationPeriod === 'QUARTERLY') {
      return principalAmount * interestRate / 4;
    } else if (calculationPeriod === 'ANNUALLY') {
      return principalAmount * interestRate;
    }
    
    return 0;
  }

  // Get current date in YYYY-MM-DD format
  getCurrentDate() {
    return new Date().toISOString().split('T')[0];
  }

  // Get date range for interest calculation
  getDateRange(calculationPeriod) {
    const today = new Date();
    const startDate = new Date(today);
    
    switch (calculationPeriod) {
      case 'DAILY':
        startDate.setDate(today.getDate() - 1);
        break;
      case 'MONTHLY':
        startDate.setMonth(today.getMonth() - 1);
        break;
      case 'QUARTERLY':
        startDate.setMonth(today.getMonth() - 3);
        break;
      case 'ANNUALLY':
        startDate.setFullYear(today.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(today.getMonth() - 1);
    }
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    };
  }

  // Check if payout already exists for the period
  async checkExistingPayout(accountId, payoutType, periodStartDate, periodEndDate) {
    const existingPayout = await Payouts.findOne({
      where: {
        accountId: accountId,
        payoutType: payoutType,
        periodStartDate: periodStartDate,
        periodEndDate: periodEndDate,
        isDeleted: 0
      }
    });
    
    return existingPayout;
  }

  // Update account balance after transaction
  async updateAccountBalance(accountId, amount, entryType) {
    const account = await Accounts.findOne({
      where: { accountId: accountId }
    });

    if (!account) {
      throw new Error(`Account ${accountId} not found`);
    }

    const currentBalance = parseFloat(account.availableBalance || 0);
    const newBalance = entryType === 'CREDIT' 
      ? currentBalance + parseFloat(amount)
      : currentBalance - parseFloat(amount);

    await account.update({
      availableBalance: newBalance,
      clearBalance: newBalance,
      creditBalance: entryType === 'CREDIT' ? newBalance : account.creditBalance,
      debitBalance: entryType === 'DEBIT' ? newBalance : account.debitBalance,
      modifiedOn: new Date()
    });

    this.log(`Updated account ${accountId} balance: ${currentBalance} -> ${newBalance} (${entryType} ${amount})`);
    return newBalance;
  }

  // Create transaction and update balances
  async createTransactionAndUpdateBalances(payout, username = 'SYSTEM') {
    const dbTransaction = await sequelize.transaction();
    
    try {
      // Determine debit and credit accounts
      let debitAccountId, creditAccountId;
      
      if (payout.payoutType === 'INTEREST_PAYOUT') {
        // Paying interest TO member: Debit Interest Expense GL, Credit Member Account
        debitAccountId = 'GL-INTEREST-EXPENSE';
        creditAccountId = payout.accountId;
      } else if (payout.payoutType === 'INTEREST_COLLECTION') {
        // Collecting interest FROM member: Debit Member Account, Credit Interest Income GL
        debitAccountId = payout.accountId;
        creditAccountId = 'GL-INTEREST-INCOME';
      }

      const referenceNumber = this.generateReferenceNumber();
      const amount = payout.interestAmount;

      // Create debit transaction
      const debitTransaction = await Transactions.create({
        transactionId: this.generateReferenceNumber(),
        referenceNumber,
        saccoId: payout.saccoId,
        accountId: debitAccountId,
        accountType: debitAccountId.startsWith('GL-') ? 'GL' : 'MEMBER',
        entryType: 'DEBIT',
        amount: amount,
        type: 'TRANSFER',
        status: 'Approved',
        remarks: `Interest ${payout.payoutType === 'INTEREST_PAYOUT' ? 'payout' : 'collection'} - ${payout.payoutId}`,
        createdOn: new Date(),
        createdBy: username,
      }, { transaction: dbTransaction });

      // Create credit transaction
      const creditTransaction = await Transactions.create({
        transactionId: this.generateReferenceNumber(),
        referenceNumber,
        saccoId: payout.saccoId,
        accountId: creditAccountId,
        accountType: creditAccountId.startsWith('GL-') ? 'GL' : 'MEMBER',
        entryType: 'CREDIT',
        amount: amount,
        type: 'TRANSFER',
        status: 'Approved',
        remarks: `Interest ${payout.payoutType === 'INTEREST_PAYOUT' ? 'payout' : 'collection'} - ${payout.payoutId}`,
        createdOn: new Date(),
        createdBy: username,
      }, { transaction: dbTransaction });

      // Update account balances
      await this.updateAccountBalance(debitAccountId, amount, 'DEBIT');
      await this.updateAccountBalance(creditAccountId, amount, 'CREDIT');

      // Update payout status
      await payout.update({
        status: 'PROCESSED',
        transactionReference: referenceNumber,
        debitAccountId,
        creditAccountId,
        processedBy: username,
        processedOn: new Date(),
        modifiedOn: new Date(),
        modifiedBy: username
      }, { transaction: dbTransaction });

      await dbTransaction.commit();
      
      this.log(`Transaction created successfully: ${referenceNumber}`);
      return {
        success: true,
        referenceNumber,
        debitTransaction,
        creditTransaction
      };
    } catch (error) {
      await dbTransaction.rollback();
      this.log(`Transaction creation failed: ${error.message}`);
      throw error;
    }
  }

  // Generate savings interest payouts
  async generateSavingsInterestPayouts(saccoId = 'SYSTEM', calculationPeriod = 'MONTHLY') {
    this.log(`Generating savings interest payouts for SACCO: ${saccoId}`);
    
    const dateRange = this.getDateRange(calculationPeriod);
    const results = [];

    try {
      // Get all active savings accounts with products
      const savingsAccounts = await Accounts.findAll({
        where: {
          saccoId: saccoId,
          accountType: 'MEMBER',
          status: 'Active',
          isDeleted: 0
        },
        include: [
          {
            model: Members,
            as: 'member',
            required: true
          },
          {
            model: Products,
            as: 'product',
            required: true,
            where: {
              productType: 'BOSA',
              productStatus: 'Active',
              status: 'Active',
              isDeleted: 0
            }
          }
        ]
      });

      this.log(`Found ${savingsAccounts.length} active savings accounts`);

      for (const account of savingsAccounts) {
        try {
          // Check if payout already exists for this period
          const existingPayout = await this.checkExistingPayout(
            account.accountId,
            'INTEREST_PAYOUT',
            dateRange.startDate,
            dateRange.endDate
          );

          if (existingPayout) {
            this.log(`Payout already exists for account ${account.accountId} for period ${dateRange.startDate} to ${dateRange.endDate}`);
            continue;
          }

          // Get current balance
          const currentBalance = parseFloat(account.availableBalance || 0);
          
          // Skip if balance is zero or negative
          if (currentBalance <= 0) {
            this.log(`Skipping account ${account.accountId} - zero balance`);
            continue;
          }

          // Get interest rate from product (assuming 8% default if not set)
          const interestRate = parseFloat(account.product.interestRate || 0.08);
          
          // Calculate interest
          const interestAmount = this.calculateInterest(currentBalance, interestRate, calculationPeriod);
          
          // Skip if interest amount is too small
          if (interestAmount < 0.01) {
            this.log(`Skipping account ${account.accountId} - interest amount too small: ${interestAmount}`);
            continue;
          }

          // Create payout record
          const payoutData = {
            payoutId: this.generatePayoutId(),
            saccoId: saccoId,
            payoutType: 'INTEREST_PAYOUT',
            payoutCategory: 'PRODUCT_INTEREST',
            accountId: account.accountId,
            accountType: 'MEMBER',
            memberId: account.memberId,
            productId: account.productId,
            loanProductId: null,
            principalAmount: currentBalance,
            interestRate: interestRate,
            interestAmount: parseFloat(interestAmount.toFixed(2)),
            calculationPeriod: calculationPeriod,
            periodStartDate: dateRange.startDate,
            periodEndDate: dateRange.endDate,
            payoutDate: this.getCurrentDate(),
            status: 'PENDING',
            remarks: `Automatic ${calculationPeriod.toLowerCase()} savings interest payout`,
            createdOn: new Date(),
            createdBy: 'SYSTEM'
          };

          const payout = await Payouts.create(payoutData);
          
          this.log(`Created savings interest payout for account ${account.accountId}: ${interestAmount.toFixed(2)}`);
          
          results.push({
            accountId: account.accountId,
            memberName: `${account.member.firstName} ${account.member.lastName}`,
            balance: currentBalance,
            interestRate: interestRate,
            interestAmount: interestAmount,
            payoutId: payout.payoutId,
            status: 'CREATED'
          });

        } catch (error) {
          this.log(`Error processing account ${account.accountId}: ${error.message}`);
          results.push({
            accountId: account.accountId,
            status: 'ERROR',
            error: error.message
          });
        }
      }

      this.log(`Savings interest payout generation completed. Created: ${results.filter(r => r.status === 'CREATED').length}, Errors: ${results.filter(r => r.status === 'ERROR').length}`);
      return results;

    } catch (error) {
      this.log(`Error generating savings interest payouts: ${error.message}`);
      throw error;
    }
  }

  // Generate loan interest collection payouts
  async generateLoanInterestCollectionPayouts(saccoId = 'SYSTEM', calculationPeriod = 'MONTHLY') {
    this.log(`Generating loan interest collection payouts for SACCO: ${saccoId}`);
    
    const dateRange = this.getDateRange(calculationPeriod);
    const results = [];

    try {
      // Get all active loan accounts (accounts with loan products)
      const loanAccounts = await Accounts.findAll({
        where: {
          saccoId: saccoId,
          accountType: 'MEMBER',
          status: 'Active',
          isDeleted: 0
        },
        include: [
          {
            model: Members,
            as: 'member',
            required: true
          },
          {
            model: LoanProducts,
            as: 'loanProduct',
            required: true,
            where: {
              loanProductStatus: 'Active',
              status: 'Active',
              isDeleted: 0
            }
          }
        ]
      });

      this.log(`Found ${loanAccounts.length} active loan accounts`);

      for (const account of loanAccounts) {
        try {
          // Check if payout already exists for this period
          const existingPayout = await this.checkExistingPayout(
            account.accountId,
            'INTEREST_COLLECTION',
            dateRange.startDate,
            dateRange.endDate
          );

          if (existingPayout) {
            this.log(`Payout already exists for loan account ${account.accountId} for period ${dateRange.startDate} to ${dateRange.endDate}`);
            continue;
          }

          // Get current loan balance (outstanding principal)
          const currentBalance = parseFloat(account.availableBalance || 0);
          
          // Skip if balance is zero
          if (currentBalance <= 0) {
            this.log(`Skipping loan account ${account.accountId} - zero balance`);
            continue;
          }

          // Get interest rate from loan product
          const interestRate = parseFloat(account.loanProduct.interestRate || 0.12);
          
          // Calculate interest
          const interestAmount = this.calculateInterest(currentBalance, interestRate, calculationPeriod);
          
          // Skip if interest amount is too small
          if (interestAmount < 0.01) {
            this.log(`Skipping loan account ${account.accountId} - interest amount too small: ${interestAmount}`);
            continue;
          }

          // Create payout record
          const payoutData = {
            payoutId: this.generatePayoutId(),
            saccoId: saccoId,
            payoutType: 'INTEREST_COLLECTION',
            payoutCategory: 'LOAN_INTEREST',
            accountId: account.accountId,
            accountType: 'MEMBER',
            memberId: account.memberId,
            productId: null,
            loanProductId: account.loanProduct.id,
            principalAmount: currentBalance,
            interestRate: interestRate,
            interestAmount: parseFloat(interestAmount.toFixed(2)),
            calculationPeriod: calculationPeriod,
            periodStartDate: dateRange.startDate,
            periodEndDate: dateRange.endDate,
            payoutDate: this.getCurrentDate(),
            status: 'PENDING',
            remarks: `Automatic ${calculationPeriod.toLowerCase()} loan interest collection`,
            createdOn: new Date(),
            createdBy: 'SYSTEM'
          };

          const payout = await Payouts.create(payoutData);
          
          this.log(`Created loan interest collection payout for account ${account.accountId}: ${interestAmount.toFixed(2)}`);
          
          results.push({
            accountId: account.accountId,
            memberName: `${account.member.firstName} ${account.member.lastName}`,
            balance: currentBalance,
            interestRate: interestRate,
            interestAmount: interestAmount,
            payoutId: payout.payoutId,
            status: 'CREATED'
          });

        } catch (error) {
          this.log(`Error processing loan account ${account.accountId}: ${error.message}`);
          results.push({
            accountId: account.accountId,
            status: 'ERROR',
            error: error.message
          });
        }
      }

      this.log(`Loan interest collection payout generation completed. Created: ${results.filter(r => r.status === 'CREATED').length}, Errors: ${results.filter(r => r.status === 'ERROR').length}`);
      return results;

    } catch (error) {
      this.log(`Error generating loan interest collection payouts: ${error.message}`);
      throw error;
    }
  }

  // Process all pending payouts
  async processPendingPayouts(username = 'SYSTEM') {
    this.log(`Processing all pending payouts`);
    
    const results = [];

    try {
      // Get all pending payouts
      const pendingPayouts = await Payouts.findAll({
        where: {
          status: 'PENDING',
          isDeleted: 0
        },
        include: [
          {
            model: Members,
            as: 'member',
            required: false
          }
        ],
        order: [['createdOn', 'ASC']]
      });

      this.log(`Found ${pendingPayouts.length} pending payouts`);

      for (const payout of pendingPayouts) {
        try {
          const result = await this.createTransactionAndUpdateBalances(payout, username);
          
          results.push({
            payoutId: payout.payoutId,
            accountId: payout.accountId,
            memberName: payout.member ? `${payout.member.firstName} ${payout.member.lastName}` : 'Unknown',
            payoutType: payout.payoutType,
            interestAmount: payout.interestAmount,
            status: 'PROCESSED',
            referenceNumber: result.referenceNumber
          });

          this.log(`Processed payout ${payout.payoutId} for account ${payout.accountId}`);

        } catch (error) {
          this.log(`Error processing payout ${payout.payoutId}: ${error.message}`);
          
          // Mark payout as failed
          await payout.update({
            status: 'FAILED',
            modifiedOn: new Date(),
            modifiedBy: username,
            remarks: `${payout.remarks || ''} - Processing failed: ${error.message}`
          });

          results.push({
            payoutId: payout.payoutId,
            accountId: payout.accountId,
            status: 'FAILED',
            error: error.message
          });
        }
      }

      this.log(`Payout processing completed. Processed: ${results.filter(r => r.status === 'PROCESSED').length}, Failed: ${results.filter(r => r.status === 'FAILED').length}`);
      return results;

    } catch (error) {
      this.log(`Error processing pending payouts: ${error.message}`);
      throw error;
    }
  }

  // Run complete automated payout cycle
  async runAutomatedPayoutCycle(saccoId = 'SYSTEM', calculationPeriod = 'MONTHLY', username = 'SYSTEM') {
    this.log(`🚀 Starting automated payout cycle for SACCO: ${saccoId}`);
    
    const cycleResults = {
      saccoId: saccoId,
      calculationPeriod: calculationPeriod,
      startTime: new Date(),
      savingsPayouts: [],
      loanPayouts: [],
      processedPayouts: [],
      errors: []
    };

    try {
      // Step 1: Generate savings interest payouts
      this.log(`Step 1: Generating savings interest payouts`);
      cycleResults.savingsPayouts = await this.generateSavingsInterestPayouts(saccoId, calculationPeriod);

      // Step 2: Generate loan interest collection payouts
      this.log(`Step 2: Generating loan interest collection payouts`);
      cycleResults.loanPayouts = await this.generateLoanInterestCollectionPayouts(saccoId, calculationPeriod);

      // Step 3: Process all pending payouts
      this.log(`Step 3: Processing all pending payouts`);
      cycleResults.processedPayouts = await this.processPendingPayouts(username);

      cycleResults.endTime = new Date();
      cycleResults.duration = cycleResults.endTime - cycleResults.startTime;

      this.log(`✅ Automated payout cycle completed successfully in ${cycleResults.duration}ms`);
      this.log(`📊 Summary:`, {
        savingsPayoutsCreated: cycleResults.savingsPayouts.filter(p => p.status === 'CREATED').length,
        loanPayoutsCreated: cycleResults.loanPayouts.filter(p => p.status === 'CREATED').length,
        payoutsProcessed: cycleResults.processedPayouts.filter(p => p.status === 'PROCESSED').length,
        totalErrors: cycleResults.savingsPayouts.filter(p => p.status === 'ERROR').length + 
                    cycleResults.loanPayouts.filter(p => p.status === 'ERROR').length +
                    cycleResults.processedPayouts.filter(p => p.status === 'FAILED').length
      });

      return cycleResults;

    } catch (error) {
      cycleResults.endTime = new Date();
      cycleResults.duration = cycleResults.endTime - cycleResults.startTime;
      cycleResults.errors.push(error.message);
      
      this.log(`❌ Automated payout cycle failed: ${error.message}`);
      throw error;
    }
  }

  // Get payout statistics
  async getPayoutStatistics(saccoId = 'SYSTEM', startDate = null, endDate = null) {
    const whereClause = { 
      saccoId: saccoId,
      isDeleted: 0 
    };
    
    if (startDate && endDate) {
      whereClause.payoutDate = {
        [Op.between]: [startDate, endDate]
      };
    }

    const stats = await Payouts.findAll({
      where: whereClause,
      attributes: [
        'payoutType',
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('interestAmount')), 'totalAmount']
      ],
      group: ['payoutType', 'status'],
      raw: true
    });

    return stats;
  }

  // Validate account balances after payouts
  async validateAccountBalances(accountIds = []) {
    this.log(`Validating account balances for ${accountIds.length} accounts`);
    
    const validationResults = [];

    for (const accountId of accountIds) {
      try {
        const account = await Accounts.findOne({
          where: { accountId: accountId }
        });

        if (!account) {
          validationResults.push({
            accountId: accountId,
            status: 'ERROR',
            message: 'Account not found'
          });
          continue;
        }

        // Get all transactions for this account
        const transactions = await Transactions.findAll({
          where: {
            accountId: accountId,
            status: 'Approved'
          },
          order: [['createdOn', 'ASC']]
        });

        // Calculate expected balance
        let expectedBalance = 0;
        for (const transaction of transactions) {
          if (transaction.entryType === 'CREDIT') {
            expectedBalance += parseFloat(transaction.amount);
          } else if (transaction.entryType === 'DEBIT') {
            expectedBalance -= parseFloat(transaction.amount);
          }
        }

        const actualBalance = parseFloat(account.availableBalance || 0);
        const balanceDifference = Math.abs(expectedBalance - actualBalance);

        validationResults.push({
          accountId: accountId,
          actualBalance: actualBalance,
          expectedBalance: expectedBalance,
          balanceDifference: balanceDifference,
          status: balanceDifference < 0.01 ? 'VALID' : 'MISMATCH',
          transactionCount: transactions.length
        });

      } catch (error) {
        validationResults.push({
          accountId: accountId,
          status: 'ERROR',
          message: error.message
        });
      }
    }

    this.log(`Balance validation completed. Valid: ${validationResults.filter(r => r.status === 'VALID').length}, Mismatches: ${validationResults.filter(r => r.status === 'MISMATCH').length}, Errors: ${validationResults.filter(r => r.status === 'ERROR').length}`);
    return validationResults;
  }
}

module.exports = new AutomatedPayoutService();
