module.exports = (sequelize, DataTypes) => {
  const AccountTypes = sequelize.define("AccountTypes", {
    accountTypeId: { type: DataTypes.STRING, allowNull: false, unique: true },
    accountTypeName: { type: DataTypes.STRING, allowNull: false },
    saccoId: { type: DataTypes.STRING, allowNull: true },
    productId: { type: DataTypes.INTEGER, allowNull: true },
    accountType: { type: DataTypes.ENUM('MEMBER', 'GL'), allowNull: false, defaultValue: 'MEMBER' },
    bosaFosa: { type: DataTypes.ENUM('BOSA', 'FOSA'), allowNull: false, defaultValue: 'BOSA' },
    debitCredit: { type: DataTypes.ENUM('DEBIT', 'CREDIT'), allowNull: false, defaultValue: 'DEBIT' },
    appliedOnMemberOnboarding: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    isWithdrawable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    withdrawableFrom: { type: DataTypes.DATEONLY, allowNull: true },
    interestRate: { type: DataTypes.DECIMAL(10, 4), allowNull: true },
    interestType: { type: DataTypes.STRING, allowNull: true },
    interestCalculationRule: { type: DataTypes.STRING, allowNull: true },
    interestFrequency: { type: DataTypes.STRING, allowNull: true },
    chargeIds: { type: DataTypes.TEXT, allowNull: true },
    currency: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.ENUM('Draft', 'Pending', 'Active', 'Inactive', 'Deleted'), allowNull: false, defaultValue: 'Draft' },
    remarks: { type: DataTypes.TEXT, allowNull: true },
    createdOn: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW },
    createdBy: { type: DataTypes.STRING, allowNull: true },
    modifiedOn: { type: DataTypes.DATE, allowNull: true },
    modifiedBy: { type: DataTypes.STRING, allowNull: true },
    approvedBy: { type: DataTypes.STRING, allowNull: true },
    approvedOn: { type: DataTypes.DATE, allowNull: true },
    verifierRemarks: { type: DataTypes.TEXT, allowNull: true },
    isDeleted: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  }, {
    timestamps: false // Disable automatic createdAt and updatedAt
  });

  // Define associations
  AccountTypes.associate = (models) => {
    // AccountType belongs to Sacco
    AccountTypes.belongsTo(models.Sacco, {
      foreignKey: 'saccoId',
      targetKey: 'saccoId',
      as: 'sacco'
    });
    
    // AccountType belongs to Product (regular products)
    AccountTypes.belongsTo(models.Products, {
      foreignKey: 'productId',
      as: 'product'
    });
    
    // AccountType belongs to LoanProduct (loan products)
    AccountTypes.belongsTo(models.LoanProducts, {
      foreignKey: 'productId',
      as: 'loanProduct'
    });
    
    // AccountType has many Accounts
    AccountTypes.hasMany(models.Accounts, {
      foreignKey: 'accountTypeId',
      as: 'accounts'
    });
    
    // AccountType belongs to Currency
    AccountTypes.belongsTo(models.Currency, {
      foreignKey: 'currency',
      targetKey: 'currencyCode',
      as: 'currencyInfo'
    });
  };

  return AccountTypes;
};
