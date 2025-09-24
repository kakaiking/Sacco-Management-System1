'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Collateral', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      collateralId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      memberId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Members',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      collateralType: {
        type: Sequelize.ENUM('Real Estate', 'Vehicle', 'Equipment', 'Inventory', 'Securities', 'Cash Deposit', 'Other'),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      value: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'USD'
      },
      ownershipType: {
        type: Sequelize.ENUM('Full Ownership', 'Partial Ownership', 'Joint Ownership', 'Lease'),
        allowNull: false,
        defaultValue: 'Full Ownership'
      },
      ownershipPercentage: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 100.00
      },
      location: {
        type: Sequelize.STRING,
        allowNull: true
      },
      condition: {
        type: Sequelize.ENUM('Excellent', 'Good', 'Fair', 'Poor'),
        allowNull: true
      },
      appraisalDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      appraisedBy: {
        type: Sequelize.STRING,
        allowNull: true
      },
      appraisalValue: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true
      },
      documentNumber: {
        type: Sequelize.STRING,
        allowNull: true
      },
      documentType: {
        type: Sequelize.ENUM('Title Deed', 'Registration Certificate', 'Invoice', 'Receipt', 'Certificate', 'Other'),
        allowNull: true
      },
      insurancePolicyNumber: {
        type: Sequelize.STRING,
        allowNull: true
      },
      insuranceCompany: {
        type: Sequelize.STRING,
        allowNull: true
      },
      insuranceExpiryDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      lienHolder: {
        type: Sequelize.STRING,
        allowNull: true
      },
      lienAmount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('Active', 'Inactive', 'Under Review', 'Rejected', 'Released'),
        allowNull: false,
        defaultValue: 'Active'
      },
      remarks: {
        type: Sequelize.TEXT,
        allowNull: true
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
    });

    // Create junction table for many-to-many relationship
    await queryInterface.createTable('LoanApplicationCollateral', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      loanApplicationId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'LoanApplications',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      collateralId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Collateral',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      assignedValue: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
        comment: 'The value of this collateral assigned to this specific loan application'
      },
      isPrimary: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether this is the primary collateral for the loan'
      },
      createdOn: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      createdBy: {
        type: Sequelize.STRING,
        allowNull: true
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('Collateral', ['memberId']);
    await queryInterface.addIndex('Collateral', ['collateralType']);
    await queryInterface.addIndex('Collateral', ['status']);
    await queryInterface.addIndex('Collateral', ['isDeleted']);
    await queryInterface.addIndex('Collateral', ['collateralId']);
    
    await queryInterface.addIndex('LoanApplicationCollateral', ['loanApplicationId']);
    await queryInterface.addIndex('LoanApplicationCollateral', ['collateralId']);
    
    // Add unique constraint for junction table
    await queryInterface.addIndex('LoanApplicationCollateral', ['loanApplicationId', 'collateralId'], {
      unique: true,
      name: 'unique_loan_collateral'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('LoanApplicationCollateral');
    await queryInterface.dropTable('Collateral');
  }
};