module.exports = (sequelize, DataTypes) => {
  const GLAccounts = sequelize.define("GLAccounts", {
    glAccountId: { type: DataTypes.STRING, allowNull: false, unique: true },
    saccoId: { type: DataTypes.STRING, allowNull: false },
    accountName: { type: DataTypes.STRING, allowNull: false },
    accountCategory: { 
      type: DataTypes.ENUM('ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'), 
      allowNull: false 
    },
    accountSubCategory: { type: DataTypes.STRING, allowNull: true },
    parentAccountId: { type: DataTypes.INTEGER, allowNull: true },
    accountLevel: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    isParentAccount: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    normalBalance: { 
      type: DataTypes.ENUM('DEBIT', 'CREDIT'), 
      allowNull: false 
    },
    availableBalance: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0.00 },
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

  // Define associations
  GLAccounts.associate = (models) => {
    // GL Account belongs to Sacco
    GLAccounts.belongsTo(models.Sacco, {
      foreignKey: 'saccoId',
      targetKey: 'saccoId',
      as: 'sacco'
    });

    // Self-referencing association for parent-child relationships
    GLAccounts.belongsTo(models.GLAccounts, {
      foreignKey: 'parentAccountId',
      as: 'parentAccount'
    });

    GLAccounts.hasMany(models.GLAccounts, {
      foreignKey: 'parentAccountId',
      as: 'childAccounts'
    });
  };

  return GLAccounts;
};
