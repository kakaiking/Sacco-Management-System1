'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Check if table already exists
      const tableExists = await queryInterface.showAllTables().then(tables => 
        tables.some(table => table.tableName === 'LoanProducts')
      );
      
      if (tableExists) {
        console.log('✅ LoanProducts table already exists - skipping migration');
        return;
      }

      await queryInterface.createTable('LoanProducts', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      loanProductId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      loanProductName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      saccoId: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'Saccos',
          key: 'saccoId'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      loanProductType: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'LOAN'
      },
      loanProductStatus: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'Pending'
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'Pending'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      interestRate: {
        type: Sequelize.DECIMAL(10, 4),
        allowNull: true
      },
      maxLoanAmount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true
      },
      minLoanAmount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true
      },
      loanTermMonths: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      gracePeriodDays: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      penaltyRate: {
        type: Sequelize.DECIMAL(10, 4),
        allowNull: true
      },
      processingFee: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true
      },
      insuranceRequired: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      guarantorsRequired: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      minGuarantors: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      maxGuarantors: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      createdOn: {
        type: Sequelize.DATE,
        allowNull: true,
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
    });

    // Add indexes for better performance
    await queryInterface.addIndex('LoanProducts', ['loanProductId']);
    await queryInterface.addIndex('LoanProducts', ['saccoId']);
    await queryInterface.addIndex('LoanProducts', ['status']);
    await queryInterface.addIndex('LoanProducts', ['isDeleted']);
    
    console.log('LoanProducts table created successfully');
    } catch (error) {
      console.log('Error creating LoanProducts table:', error.message || error);
      console.log('Full error object:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('LoanProducts');
  }
};
