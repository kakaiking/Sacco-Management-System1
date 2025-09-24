module.exports = (sequelize, DataTypes) => {
  const LoanApplications = sequelize.define("LoanApplications", {
    loanApplicationId: { type: DataTypes.STRING, allowNull: false, unique: true },
    loanName: { type: DataTypes.STRING, allowNull: false },
    memberId: { type: DataTypes.INTEGER, allowNull: false },
    productId: { type: DataTypes.INTEGER, allowNull: true },
    loanAmount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    mainRepaymentAccountId: { type: DataTypes.INTEGER, allowNull: true },
    collateralId: { type: DataTypes.INTEGER, allowNull: true },
    // collateralAmount: { type: DataTypes.DECIMAL(15, 2), allowNull: true }, // Using collateralId instead
    guarantors: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: "Pending Appraisal" },
    remarks: { type: DataTypes.TEXT, allowNull: true },
    createdOn: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW },
    createdBy: { type: DataTypes.STRING, allowNull: true },
    modifiedOn: { type: DataTypes.DATE, allowNull: true },
    modifiedBy: { type: DataTypes.STRING, allowNull: true },
    approvedBy: { type: DataTypes.STRING, allowNull: true },
    approvedOn: { type: DataTypes.DATE, allowNull: true },
    disbursedBy: { type: DataTypes.STRING, allowNull: true },
    disbursedOn: { type: DataTypes.DATE, allowNull: true },
    verifierRemarks: { type: DataTypes.TEXT, allowNull: true },
    isDeleted: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  }, {
    timestamps: false, // Disable automatic createdAt/updatedAt since we use our own createdOn/modifiedOn fields
    tableName: 'LoanApplications' // Explicitly specify table name
  });

  // Define associations
  LoanApplications.associate = (models) => {
    // LoanApplication belongs to Member
    LoanApplications.belongsTo(models.Members, {
      foreignKey: 'memberId',
      as: 'member'
    });
    
    // LoanApplication belongs to LoanProduct
    LoanApplications.belongsTo(models.LoanProducts, {
      foreignKey: 'productId',
      as: 'product'
    });
    
    // LoanApplication has many Collaterals (many-to-many relationship)
    LoanApplications.belongsToMany(models.Collateral, {
      through: 'LoanApplicationCollateral',
      foreignKey: 'loanApplicationId',
      otherKey: 'collateralId',
      as: 'collaterals'
    });
  };

  return LoanApplications;
};
