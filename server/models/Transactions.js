module.exports = (sequelize, DataTypes) => {
  const Transactions = sequelize.define("Transactions", {
    // Primary key
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    
    // Transaction identification
    referenceNumber: { type: DataTypes.STRING, allowNull: false }, // Same for both debit and credit entries
    transactionId: { type: DataTypes.STRING, allowNull: false }, // Unique for each entry
    
    // SACCO and account information
    saccoId: { type: DataTypes.STRING, allowNull: false },
    accountId: { type: DataTypes.STRING, allowNull: false }, // Account ID string
    
    // Double-entry fields
    entryType: { type: DataTypes.ENUM('DEBIT', 'CREDIT'), allowNull: false },
    amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    
    // Transaction details
    type: { type: DataTypes.ENUM('TRANSFER', 'DEPOSIT', 'WITHDRAWAL', 'LOAN_DISBURSEMENT', 'LOAN_REPAYMENT', 'INTEREST_PAYMENT', 'FEE_COLLECTION', 'REFUND', 'ADJUSTMENT', 'OTHER'), allowNull: true },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: "Pending" },
    remarks: { type: DataTypes.TEXT, allowNull: true },
    
    // Audit fields
    createdOn: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    createdBy: { type: DataTypes.STRING, allowNull: true },
    modifiedOn: { type: DataTypes.DATE, allowNull: true },
    modifiedBy: { type: DataTypes.STRING, allowNull: true },
    approvedBy: { type: DataTypes.STRING, allowNull: true },
    approvedOn: { type: DataTypes.DATE, allowNull: true },
    verifierRemarks: { type: DataTypes.TEXT, allowNull: true },
    
    // Soft delete
    isDeleted: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  }, {
    timestamps: false, // We use our own createdOn/modifiedOn fields
    indexes: [
      { fields: ['referenceNumber'] },
      { fields: ['transactionId'] },
      { fields: ['accountId'] },
      { fields: ['saccoId'] },
      { fields: ['entryType'] },
      { fields: ['status'] },
      { fields: ['type'] }
    ]
  });

  // Define associations
  Transactions.associate = (models) => {
    // Transaction belongs to Sacco
    Transactions.belongsTo(models.Sacco, {
      foreignKey: 'saccoId',
      targetKey: 'saccoId',
      as: 'sacco'
    });

    // Transaction belongs to Account (Member or GL)
    Transactions.belongsTo(models.Accounts, {
      foreignKey: 'accountId',
      targetKey: 'accountId',
      as: 'memberAccount',
      constraints: false
    });

    Transactions.belongsTo(models.GLAccounts, {
      foreignKey: 'accountId',
      targetKey: 'glAccountId',
      as: 'glAccount',
      constraints: false
    });
  };

  return Transactions;
};