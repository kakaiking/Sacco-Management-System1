module.exports = (sequelize, DataTypes) => {
  const Accounts = sequelize.define("Accounts", {
    // Head section fields
    saccoId: { type: DataTypes.STRING, allowNull: false },
    branchId: { type: DataTypes.STRING, allowNull: false },
    memberNo: { type: DataTypes.STRING, allowNull: false },
    productId: { type: DataTypes.INTEGER, allowNull: false },
    accountId: { type: DataTypes.STRING, allowNull: false, unique: true },
    
    // Overview Account Details
    shortName: { type: DataTypes.STRING, allowNull: false },
    accountType: { type: DataTypes.STRING, allowNull: false, defaultValue: 'Savings' },
    currencyId: { type: DataTypes.INTEGER, allowNull: false },
    address: { type: DataTypes.TEXT, allowNull: true },
    city: { type: DataTypes.STRING, allowNull: true },
    phone: { type: DataTypes.STRING, allowNull: true },
    alternativePhone: { type: DataTypes.STRING, allowNull: true },
    kraPin: { type: DataTypes.STRING, allowNull: true },
    emailId: { type: DataTypes.STRING, allowNull: true },
    operatingMode: { 
      type: DataTypes.ENUM('Self', 'Either to sign', 'All to sign', 'Two to sign', 'Three to sign', 'Four to sign'), 
      allowNull: false, 
      defaultValue: 'Self' 
    },
    operatingInstructions: { type: DataTypes.TEXT, allowNull: true },
    accountOfficerId: { type: DataTypes.INTEGER, allowNull: true },
    
    // In-depth Account Details
    clearBalance: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0.00 },
    unclearBalance: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0.00 },
    unsupervisedCredits: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0.00 },
    unsupervisedDebits: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0.00 },
    frozenAmount: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0.00 },
    creditRate: { type: DataTypes.DECIMAL(8, 4), allowNull: false, defaultValue: 0.0000 },
    debitRate: { type: DataTypes.DECIMAL(8, 4), allowNull: false, defaultValue: 0.0000 },
    penaltyRate: { type: DataTypes.DECIMAL(8, 4), allowNull: false, defaultValue: 0.0000 },
    pendingCharges: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0.00 },
    availableBalance: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0.00 },
    totalBalance: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0.00 },
    creditInterest: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0.00 },
    debitInterest: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0.00 },
    minimumBalance: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0.00 },
    fixedBalance: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0.00 },
    signatories: { type: DataTypes.TEXT, allowNull: true },
    
    // Standard fields
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: "Active" },
    remarks: { type: DataTypes.TEXT, allowNull: true },
    createdOn: { type: DataTypes.DATE, allowNull: true },
    createdBy: { type: DataTypes.STRING, allowNull: true },
    modifiedOn: { type: DataTypes.DATE, allowNull: true },
    modifiedBy: { type: DataTypes.STRING, allowNull: true },
    statusChangedBy: { type: DataTypes.STRING, allowNull: true },
    statusChangedOn: { type: DataTypes.DATE, allowNull: true },
    isDeleted: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  }, {
    timestamps: false // Disable automatic createdAt/updatedAt
  });

  // Instance method to manually recalculate balances
  Accounts.prototype.recalculateBalances = function() {
    const clearBalance = parseFloat(this.clearBalance || 0);
    const unsupervisedCredits = parseFloat(this.unsupervisedCredits || 0);
    const unsupervisedDebits = parseFloat(this.unsupervisedDebits || 0);
    const frozenAmount = parseFloat(this.frozenAmount || 0);
    const pendingCharges = parseFloat(this.pendingCharges || 0);
    const unclearBalance = parseFloat(this.unclearBalance || 0);
    const creditInterest = parseFloat(this.creditInterest || 0);
    
    this.availableBalance = clearBalance + unsupervisedCredits - unsupervisedDebits - frozenAmount - pendingCharges;
    this.totalBalance = clearBalance + unclearBalance + creditInterest;
    
    return this;
  };

  // Define associations
  Accounts.associate = (models) => {
    // Account belongs to Sacco
    Accounts.belongsTo(models.Sacco, {
      foreignKey: 'saccoId',
      targetKey: 'saccoId',
      as: 'sacco'
    });

    // Account belongs to Branch
    Accounts.belongsTo(models.Branch, {
      foreignKey: 'branchId',
      targetKey: 'branchId',
      as: 'branch'
    });

    // Account belongs to one Member (by memberNo)
    Accounts.belongsTo(models.Members, {
      foreignKey: 'memberNo',
      targetKey: 'memberNo',
      as: 'member',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // Account belongs to one Product
    Accounts.belongsTo(models.Products, {
      foreignKey: 'productId',
      as: 'product',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // Account belongs to Currency
    Accounts.belongsTo(models.Currency, {
      foreignKey: 'currencyId',
      as: 'currency'
    });

    // Account belongs to Account Officer
    Accounts.belongsTo(models.AccountOfficers, {
      foreignKey: 'accountOfficerId',
      as: 'accountOfficer'
    });
  };

  return Accounts;
};
