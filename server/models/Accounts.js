module.exports = (sequelize, DataTypes) => {
  const Accounts = sequelize.define("Accounts", {
    accountId: { type: DataTypes.STRING, allowNull: false, unique: true },
    saccoId: { type: DataTypes.STRING, allowNull: false },
    accountType: { type: DataTypes.ENUM('MEMBER', 'GL'), allowNull: false, defaultValue: 'MEMBER' },
    accountTypeId: { type: DataTypes.INTEGER, allowNull: true },
    memberId: { type: DataTypes.INTEGER, allowNull: true },
    productId: { type: DataTypes.INTEGER, allowNull: true },
    accountName: { type: DataTypes.STRING, allowNull: false },
    availableBalance: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0.00 },
    clearBalance: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0.00 },
    debitBalance: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0.00 },
    creditBalance: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0.00 },
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
  Accounts.associate = (models) => {
    // Account belongs to Sacco
    Accounts.belongsTo(models.Sacco, {
      foreignKey: 'saccoId',
      targetKey: 'saccoId',
      as: 'sacco'
    });

    // Account belongs to one Member
    Accounts.belongsTo(models.Members, {
      foreignKey: 'memberId',
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

    // Account belongs to one AccountType
    Accounts.belongsTo(models.AccountTypes, {
      foreignKey: 'accountTypeId',
      as: 'accountTypeDefinition',
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  };

  return Accounts;
};
