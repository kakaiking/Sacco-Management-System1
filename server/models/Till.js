module.exports = (sequelize, DataTypes) => {
  const Till = sequelize.define("Till", {
    tillId: { 
      type: DataTypes.STRING, 
      allowNull: false, 
      unique: true 
    },
    tillName: { 
      type: DataTypes.STRING, 
      allowNull: false 
    },
    cashierId: { 
      type: DataTypes.STRING, 
      allowNull: true 
    },
    glAccountId: { 
      type: DataTypes.STRING, 
      allowNull: true 
    },
    maximumAmountCapacity: { 
      type: DataTypes.DECIMAL(15, 2), 
      allowNull: true 
    },
    minimumAmountCapacity: { 
      type: DataTypes.DECIMAL(15, 2), 
      allowNull: true 
    },
    saccoId: { 
      type: DataTypes.STRING, 
      allowNull: false 
    },
    status: { 
      type: DataTypes.STRING, 
      allowNull: false, 
      defaultValue: "Active" 
    },
    remarks: { 
      type: DataTypes.TEXT, 
      allowNull: true 
    },
    createdOn: { 
      type: DataTypes.DATE, 
      allowNull: true, 
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
    isDeleted: { 
      type: DataTypes.INTEGER, 
      allowNull: false, 
      defaultValue: 0 
    },
  }, {
    timestamps: false // Disable automatic createdAt/updatedAt since we use createdOn/modifiedOn
  });

  // Define associations
  Till.associate = (models) => {
    // Till belongs to Sacco
    Till.belongsTo(models.Sacco, {
      foreignKey: 'saccoId',
      targetKey: 'saccoId',
      as: 'sacco'
    });

    // Till belongs to User (Cashier)
    Till.belongsTo(models.Users, {
      foreignKey: 'cashierId',
      targetKey: 'userId',
      as: 'cashier'
    });

    // Till belongs to GL Account
    Till.belongsTo(models.GLAccounts, {
      foreignKey: 'glAccountId',
      targetKey: 'glAccountId',
      as: 'glAccount'
    });
  };

  return Till;
};
