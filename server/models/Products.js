module.exports = (sequelize, DataTypes) => {
  const Products = sequelize.define("Products", {
    productId: { type: DataTypes.STRING, allowNull: false, unique: true },
    productName: { type: DataTypes.STRING, allowNull: false },
    saccoId: { type: DataTypes.STRING, allowNull: true },
    productType: { type: DataTypes.STRING, allowNull: true },
    productStatus: { type: DataTypes.STRING, allowNull: false, defaultValue: "Pending" },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: "Pending" },
    description: { type: DataTypes.TEXT, allowNull: true },
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
    
    // Product has many AccountTypes
    Products.hasMany(models.AccountTypes, {
      foreignKey: 'productId',
      as: 'accountTypes'
    });
  };

  return Products;
};
