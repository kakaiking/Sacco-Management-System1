module.exports = (sequelize, DataTypes) => {
  const AccountOfficers = sequelize.define("AccountOfficers", {
    accountOfficerId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'userId'
      }
    },
    employeeId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    branchId: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'branches',
        key: 'branchId'
      }
    },
    department: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    position: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    effectiveDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    maxClients: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    currentClients: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM("Active", "Inactive", "Suspended", "Terminated"),
      allowNull: false,
      defaultValue: "Active",
    },
    saccoId: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "SYSTEM",
    },
    createdBy: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    createdOn: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    modifiedBy: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    modifiedOn: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    approvedBy: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    approvedOn: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  });

  AccountOfficers.associate = (models) => {
    // Association with Users
    AccountOfficers.belongsTo(models.Users, {
      foreignKey: 'userId',
      targetKey: 'userId',
      as: 'user'
    });

    // Association with Branch
    AccountOfficers.belongsTo(models.Branch, {
      foreignKey: 'branchId',
      targetKey: 'branchId',
      as: 'branch'
    });

    // Association with Sacco
    AccountOfficers.belongsTo(models.Sacco, {
      foreignKey: 'saccoId',
      targetKey: 'saccoId',
      as: 'sacco'
    });
  };

  return AccountOfficers;
};
