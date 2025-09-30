module.exports = (sequelize, DataTypes) => {
  const Products = sequelize.define("Products", {
    productId: { type: DataTypes.STRING, allowNull: false, unique: true },
    productName: { type: DataTypes.STRING, allowNull: false },
    saccoId: { type: DataTypes.STRING, allowNull: true },
    productType: { type: DataTypes.STRING, allowNull: true },
    productStatus: { type: DataTypes.STRING, allowNull: false, defaultValue: "Pending" },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: "Pending" },
    description: { type: DataTypes.TEXT, allowNull: true },
    
    // Account type fields moved from AccountTypes
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
    isCreditInterest: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    isDebitInterest: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    needGuarantors: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    maxGuarantors: { type: DataTypes.INTEGER, allowNull: true },
    minGuarantors: { type: DataTypes.INTEGER, allowNull: true },
    chargeIds: { type: DataTypes.TEXT, allowNull: true },
    currency: { type: DataTypes.STRING, allowNull: false, defaultValue: 'KES' },
    
    createdOn: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW },
    createdBy: { type: DataTypes.STRING, allowNull: true },
    modifiedOn: { type: DataTypes.DATE, allowNull: true },
    modifiedBy: { type: DataTypes.STRING, allowNull: true },
    approvedBy: { type: DataTypes.STRING, allowNull: true },
    approvedOn: { type: DataTypes.DATE, allowNull: true },
    verifierRemarks: { type: DataTypes.TEXT, allowNull: true },
    isSpecial: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    maxSpecialUsers: { type: DataTypes.INTEGER, allowNull: true },
    isDeleted: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  }, {
    timestamps: false, // Disable automatic createdAt/updatedAt since we use our own createdOn/modifiedOn fields
    tableName: 'Products' // Explicitly specify table name
  });

  // Define associations
  Products.associate = (models) => {
    // Product belongs to Sacco
    Products.belongsTo(models.Sacco, {
      foreignKey: 'saccoId',
      targetKey: 'saccoId',
      as: 'sacco'
    });
    
    // Product has many Accounts
    Products.hasMany(models.Accounts, {
      foreignKey: 'productId',
      as: 'accounts'
    });
  };

  return Products;
};
