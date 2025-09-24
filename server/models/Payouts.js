module.exports = (sequelize, DataTypes) => {
  const Payouts = sequelize.define("Payouts", {
    payoutId: { 
      type: DataTypes.STRING, 
      allowNull: false, 
      unique: true 
    },
    saccoId: { 
      type: DataTypes.STRING, 
      allowNull: false 
    },
    payoutType: { 
      type: DataTypes.ENUM('INTEREST_PAYOUT', 'INTEREST_COLLECTION'), 
      allowNull: false 
    },
    payoutCategory: { 
      type: DataTypes.ENUM('PRODUCT_INTEREST', 'LOAN_INTEREST', 'MANUAL'), 
      allowNull: false, 
      defaultValue: 'PRODUCT_INTEREST' 
    },
    accountId: { 
      type: DataTypes.STRING, 
      allowNull: false 
    },
    accountType: { 
      type: DataTypes.ENUM('MEMBER', 'GL'), 
      allowNull: false, 
      defaultValue: 'MEMBER' 
    },
    memberId: { 
      type: DataTypes.INTEGER, 
      allowNull: true 
    },
    productId: { 
      type: DataTypes.INTEGER, 
      allowNull: true 
    },
    loanProductId: { 
      type: DataTypes.INTEGER, 
      allowNull: true 
    },
    principalAmount: { 
      type: DataTypes.DECIMAL(15, 2), 
      allowNull: false, 
      defaultValue: 0.00 
    },
    interestRate: { 
      type: DataTypes.DECIMAL(10, 4), 
      allowNull: false 
    },
    interestAmount: { 
      type: DataTypes.DECIMAL(15, 2), 
      allowNull: false 
    },
    calculationPeriod: { 
      type: DataTypes.ENUM('DAILY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY'), 
      allowNull: false, 
      defaultValue: 'MONTHLY' 
    },
    periodStartDate: { 
      type: DataTypes.DATEONLY, 
      allowNull: false 
    },
    periodEndDate: { 
      type: DataTypes.DATEONLY, 
      allowNull: false 
    },
    payoutDate: { 
      type: DataTypes.DATEONLY, 
      allowNull: false 
    },
    status: { 
      type: DataTypes.ENUM('PENDING', 'PROCESSED', 'FAILED', 'CANCELLED'), 
      allowNull: false, 
      defaultValue: 'PENDING' 
    },
    transactionReference: { 
      type: DataTypes.STRING, 
      allowNull: true 
    },
    debitAccountId: { 
      type: DataTypes.STRING, 
      allowNull: true 
    },
    creditAccountId: { 
      type: DataTypes.STRING, 
      allowNull: true 
    },
    remarks: { 
      type: DataTypes.TEXT, 
      allowNull: true 
    },
    processedBy: { 
      type: DataTypes.STRING, 
      allowNull: true 
    },
    processedOn: { 
      type: DataTypes.DATE, 
      allowNull: true 
    },
    createdOn: { 
      type: DataTypes.DATE, 
      allowNull: false, 
      defaultValue: DataTypes.NOW 
    },
    createdBy: { 
      type: DataTypes.STRING, 
      allowNull: true 
    },
    modifiedOn: { 
      type: DataTypes.DATE, 
      allowNull: true 
    },
    modifiedBy: { 
      type: DataTypes.STRING, 
      allowNull: true 
    },
    approvedBy: { 
      type: DataTypes.STRING, 
      allowNull: true 
    },
    approvedOn: { 
      type: DataTypes.DATE, 
      allowNull: true 
    },
    verifierRemarks: { 
      type: DataTypes.TEXT, 
      allowNull: true 
    },
    isDeleted: { 
      type: DataTypes.INTEGER, 
      allowNull: false, 
      defaultValue: 0 
    }
  }, {
    timestamps: false, // Disable automatic createdAt/updatedAt since we use our own createdOn/modifiedOn fields
    tableName: 'Payouts' // Explicitly specify table name
  });

  // Define associations
  Payouts.associate = (models) => {
    // Payout belongs to Sacco
    Payouts.belongsTo(models.Sacco, {
      foreignKey: 'saccoId',
      targetKey: 'saccoId',
      as: 'sacco'
    });

    // Payout belongs to Member (optional)
    Payouts.belongsTo(models.Members, {
      foreignKey: 'memberId',
      as: 'member'
    });

    // Payout belongs to Product (optional)
    Payouts.belongsTo(models.Products, {
      foreignKey: 'productId',
      as: 'product'
    });

    // Payout belongs to LoanProduct (optional)
    Payouts.belongsTo(models.LoanProducts, {
      foreignKey: 'loanProductId',
      as: 'loanProduct'
    });

    // Payout belongs to Account (Member or GL)
    Payouts.belongsTo(models.Accounts, {
      foreignKey: 'accountId',
      targetKey: 'accountId',
      as: 'account',
      constraints: false
    });

    Payouts.belongsTo(models.GLAccounts, {
      foreignKey: 'accountId',
      targetKey: 'glAccountId',
      as: 'glAccount',
      constraints: false
    });
  };

  return Payouts;
};

