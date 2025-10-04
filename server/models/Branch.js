module.exports = (sequelize, DataTypes) => {
  const Branch = sequelize.define("Branch", {
    branchId: { type: DataTypes.STRING, allowNull: false, unique: true },
    saccoId: { type: DataTypes.STRING, allowNull: false },
    branchName: { type: DataTypes.STRING, allowNull: false },
    shortName: { type: DataTypes.STRING, allowNull: true },
    branchLocation: { type: DataTypes.STRING, allowNull: true },
    city: { type: DataTypes.STRING, allowNull: true },
    poBox: { type: DataTypes.STRING, allowNull: true },
    postalCode: { type: DataTypes.STRING, allowNull: true },
    phoneNumber: { type: DataTypes.STRING, allowNull: true },
    alternativePhone: { type: DataTypes.STRING, allowNull: true },
    branchCashLimit: { type: DataTypes.DECIMAL(15, 2), allowNull: true, defaultValue: 0.00 },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: "Active" },
    createdOn: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW },
    createdBy: { type: DataTypes.STRING, allowNull: true },
    modifiedOn: { type: DataTypes.DATE, allowNull: true },
    modifiedBy: { type: DataTypes.STRING, allowNull: true },
    approvedBy: { type: DataTypes.STRING, allowNull: true },
    approvedOn: { type: DataTypes.DATE, allowNull: true },
    verifierRemarks: { type: DataTypes.TEXT, allowNull: true },
    isDeleted: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  }, {
    tableName: 'branches', // Explicitly specify the table name
    timestamps: true // Enable createdAt and updatedAt
  });

  // Define associations
  Branch.associate = (models) => {
    // Branch belongs to Sacco
    Branch.belongsTo(models.Sacco, {
      foreignKey: 'saccoId',
      targetKey: 'saccoId',
      as: 'sacco'
    });
  };

  return Branch;
};
