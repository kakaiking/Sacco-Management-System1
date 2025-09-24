'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Check if table already exists
      const tableExists = await queryInterface.showAllTables().then(tables => 
        tables.some(table => table.tableName === 'Payouts')
      );
      
      if (tableExists) {
        console.log('✅ Payouts table already exists - skipping migration');
        return;
      }

      await queryInterface.createTable('Payouts', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        payoutId: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true
        },
        saccoId: {
          type: Sequelize.STRING,
          allowNull: false,
          references: {
            model: 'Saccos',
            key: 'saccoId'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        payoutType: {
          type: Sequelize.ENUM('INTEREST_PAYOUT', 'INTEREST_COLLECTION'),
          allowNull: false
        },
        payoutCategory: {
          type: Sequelize.ENUM('PRODUCT_INTEREST', 'LOAN_INTEREST', 'MANUAL'),
          allowNull: false,
          defaultValue: 'PRODUCT_INTEREST'
        },
        accountId: {
          type: Sequelize.STRING,
          allowNull: false,
          comment: 'Account ID for member account or GL account'
        },
        accountType: {
          type: Sequelize.ENUM('MEMBER', 'GL'),
          allowNull: false,
          defaultValue: 'MEMBER'
        },
        memberId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'Members',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        productId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'Products',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        loanProductId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'LoanProducts',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        principalAmount: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: false,
          defaultValue: 0.00,
          comment: 'Principal amount used for interest calculation'
        },
        interestRate: {
          type: Sequelize.DECIMAL(10, 4),
          allowNull: false,
          comment: 'Interest rate applied (as decimal, e.g., 0.05 for 5%)'
        },
        interestAmount: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: false,
          comment: 'Calculated interest amount'
        },
        calculationPeriod: {
          type: Sequelize.ENUM('DAILY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY'),
          allowNull: false,
          defaultValue: 'MONTHLY'
        },
        periodStartDate: {
          type: Sequelize.DATEONLY,
          allowNull: false,
          comment: 'Start date of interest calculation period'
        },
        periodEndDate: {
          type: Sequelize.DATEONLY,
          allowNull: false,
          comment: 'End date of interest calculation period'
        },
        payoutDate: {
          type: Sequelize.DATEONLY,
          allowNull: false,
          comment: 'Date when payout is processed'
        },
        status: {
          type: Sequelize.ENUM('PENDING', 'PROCESSED', 'FAILED', 'CANCELLED'),
          allowNull: false,
          defaultValue: 'PENDING'
        },
        transactionReference: {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Reference to the transaction created for this payout'
        },
        debitAccountId: {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Account to debit (for interest collection)'
        },
        creditAccountId: {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Account to credit (for interest payout)'
        },
        remarks: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        processedBy: {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'User who processed the payout'
        },
        processedOn: {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'When the payout was processed'
        },
        createdOn: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        },
        createdBy: {
          type: Sequelize.STRING,
          allowNull: true
        },
        modifiedOn: {
          type: Sequelize.DATE,
          allowNull: true
        },
        modifiedBy: {
          type: Sequelize.STRING,
          allowNull: true
        },
        approvedBy: {
          type: Sequelize.STRING,
          allowNull: true
        },
        approvedOn: {
          type: Sequelize.DATE,
          allowNull: true
        },
        verifierRemarks: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        isDeleted: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        }
      }, {
        indexes: [
          { fields: ['saccoId'] },
          { fields: ['payoutType'] },
          { fields: ['accountId'] },
          { fields: ['memberId'] },
          { fields: ['status'] },
          { fields: ['payoutDate'] },
          { fields: ['periodStartDate', 'periodEndDate'] },
          { fields: ['createdOn'] }
        ]
      });

      console.log('✅ Payouts table created successfully');
    } catch (error) {
      console.error('❌ Error creating Payouts table:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.dropTable('Payouts');
      console.log('✅ Payouts table dropped successfully');
    } catch (error) {
      console.error('❌ Error dropping Payouts table:', error);
      throw error;
    }
  }
};

