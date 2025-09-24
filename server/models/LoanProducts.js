module.exports = (sequelize, DataTypes) => {
  const LoanProducts = sequelize.define("LoanProducts", {
    loanProductId: { type: DataTypes.STRING, allowNull: false, unique: true },
    loanProductName: { type: DataTypes.STRING, allowNull: false },
    saccoId: { type: DataTypes.STRING, allowNull: true },
    loanProductType: { type: DataTypes.STRING, allowNull: true, defaultValue: "LOAN" },
    loanProductStatus: { type: DataTypes.STRING, allowNull: false, defaultValue: "Pending" },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: "Pending" },
    description: { type: DataTypes.TEXT, allowNull: true },
    createdOn: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW },
    createdBy: { type: DataTypes.STRING, allowNull: true },
    modifiedOn: { type: DataTypes.DATE, allowNull: true },
    modifiedBy: { type: DataTypes.STRING, allowNull: true },
    approvedBy: { type: DataTypes.STRING, allowNull: true },
    approvedOn: { type: DataTypes.DATE, allowNull: true },
    verifierRemarks: { type: DataTypes.TEXT, allowNull: true },
    needGuarantors: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    maxGuarantors: { type: DataTypes.INTEGER, allowNull: true },
    minGuarantors: { type: DataTypes.INTEGER, allowNull: true },
    isDeleted: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  }, {
    timestamps: false, // Disable automatic createdAt/updatedAt since we use our own createdOn/modifiedOn fields
    tableName: 'LoanProducts' // Explicitly specify table name
  });

  // Define associations
  LoanProducts.associate = (models) => {
    // LoanProduct belongs to Sacco
    LoanProducts.belongsTo(models.Sacco, {
      foreignKey: 'saccoId',
      targetKey: 'saccoId',
      as: 'sacco'
    });
    
    // LoanProduct has many AccountTypes (for loan account types)
    LoanProducts.hasMany(models.AccountTypes, {
      foreignKey: 'productId',
      as: 'accountTypes'
    });
  };

  return LoanProducts;
};

