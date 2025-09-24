module.exports = (sequelize, DataTypes) => {
  const Currency = sequelize.define("Currency", {
    currencyId: { 
      type: DataTypes.STRING, 
      allowNull: false, 
      unique: true 
    },
    saccoId: { 
      type: DataTypes.STRING, 
      allowNull: false 
    },
    currencyCode: { 
      type: DataTypes.STRING(3), 
      allowNull: false, 
      unique: true,
      validate: {
        len: [3, 3],
        isUppercase: true
      }
    },
    currencyName: { 
      type: DataTypes.STRING, 
      allowNull: false 
    },
    symbol: { 
      type: DataTypes.STRING(10), 
      allowNull: true 
    },
    decimalPlaces: { 
      type: DataTypes.INTEGER, 
      allowNull: false, 
      defaultValue: 2,
      validate: {
        min: 0,
        max: 4
      }
    },
    exchangeRate: { 
      type: DataTypes.DECIMAL(15, 6), 
      allowNull: true,
      defaultValue: 1.000000
    },
    isBaseCurrency: { 
      type: DataTypes.BOOLEAN, 
      allowNull: false, 
      defaultValue: false 
    },
    country: { 
      type: DataTypes.STRING, 
      allowNull: true 
    },
    region: { 
      type: DataTypes.STRING, 
      allowNull: true 
    },
    description: { 
      type: DataTypes.TEXT, 
      allowNull: true 
    },
    status: { 
      type: DataTypes.ENUM("Active", "Inactive"), 
      allowNull: false, 
      defaultValue: "Active" 
    },
    lastUpdated: { 
      type: DataTypes.DATE, 
      allowNull: true 
    },
    createdOn: { 
      type: DataTypes.DATE, 
      allowNull: false, 
      defaultValue: DataTypes.NOW 
    },
    createdBy: { 
      type: DataTypes.STRING, 
      allowNull: true 
    },
    modifiedOn: { 
      type: DataTypes.DATE, 
      allowNull: true 
    },
    modifiedBy: { 
      type: DataTypes.STRING, 
      allowNull: true 
    },
    approvedBy: { 
      type: DataTypes.STRING, 
      allowNull: true 
    },
    approvedOn: { 
      type: DataTypes.DATE, 
      allowNull: true 
    },
    verifierRemarks: { 
      type: DataTypes.TEXT, 
      allowNull: true 
    },
    isDeleted: { 
      type: DataTypes.INTEGER, 
      allowNull: false, 
      defaultValue: 0 
    },
  });

  // Define associations
  Currency.associate = (models) => {
    // Currency belongs to Sacco
    Currency.belongsTo(models.Sacco, {
      foreignKey: 'saccoId',
      targetKey: 'saccoId',
      as: 'sacco'
    });

    // Note: Currency-Products association removed as currency column was removed from Products table
  };

  return Currency;
};

