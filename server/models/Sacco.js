module.exports = (sequelize, DataTypes) => {
  const Sacco = sequelize.define("Sacco", {
    saccoId: { type: DataTypes.STRING, allowNull: false, unique: true },
    licenseId: { type: DataTypes.STRING, allowNull: false, unique: true },
    saccoName: { type: DataTypes.STRING, allowNull: false },
    address: { type: DataTypes.TEXT, allowNull: true },
    contactPhone: { type: DataTypes.STRING, allowNull: true },
    contactEmail: { type: DataTypes.STRING, allowNull: true },
    logs: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: "Active" },
    createdOn: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW },
    createdBy: { type: DataTypes.STRING, allowNull: true },
    modifiedOn: { type: DataTypes.DATE, allowNull: true },
    modifiedBy: { type: DataTypes.STRING, allowNull: true },
    approvedBy: { type: DataTypes.STRING, allowNull: true },
    approvedOn: { type: DataTypes.DATE, allowNull: true },
    verifierRemarks: { type: DataTypes.TEXT, allowNull: true },
    isDeleted: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  });

  // Define associations
  Sacco.associate = (models) => {
    // Sacco has many Members
    Sacco.hasMany(models.Members, {
      foreignKey: 'saccoId',
      as: 'members'
    });

    // Sacco has many Accounts
    Sacco.hasMany(models.Accounts, {
      foreignKey: 'saccoId',
      as: 'accounts'
    });

    // Sacco has many Products
    Sacco.hasMany(models.Products, {
      foreignKey: 'saccoId',
      as: 'products'
    });

    // Sacco has many Charges
    Sacco.hasMany(models.Charges, {
      foreignKey: 'saccoId',
      as: 'charges'
    });

    // Sacco has many Users
    Sacco.hasMany(models.Users, {
      foreignKey: 'saccoId',
      as: 'users'
    });

    // Sacco has many Branches
    Sacco.hasMany(models.Branch, {
      foreignKey: 'saccoId',
      as: 'branches'
    });

    // Sacco has many Currencies
    Sacco.hasMany(models.Currency, {
      foreignKey: 'saccoId',
      as: 'currencies'
    });

    // Sacco has many Roles
    Sacco.hasMany(models.Roles, {
      foreignKey: 'saccoId',
      as: 'roles'
    });

    // Sacco has many Logs
    Sacco.hasMany(models.Logs, {
      foreignKey: 'saccoId',
      as: 'logEntries'
    });

    // Gender relationship removed to avoid foreign key constraint issues

    // Lookup table relationships removed to avoid foreign key constraint issues
    // These models use saccoId for logical grouping only

    // Sacco has many GLAccounts
    Sacco.hasMany(models.GLAccounts, {
      foreignKey: 'saccoId',
      sourceKey: 'saccoId',
      as: 'glAccounts'
    });

    // Sacco has many AccountTypes
    Sacco.hasMany(models.AccountTypes, {
      foreignKey: 'saccoId',
      sourceKey: 'saccoId',
      as: 'accountTypes'
    });

    // Sacco has many LoanProducts
    Sacco.hasMany(models.LoanProducts, {
      foreignKey: 'saccoId',
      sourceKey: 'saccoId',
      as: 'loanProducts'
    });
  };

  return Sacco;
};
