module.exports = (sequelize, DataTypes) => {
  const MaritalStatus = sequelize.define("MaritalStatus", {
    maritalStatusId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    maritalStatusName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    maritalStatusCode: {
      type: DataTypes.STRING(2),
      allowNull: true,
      validate: {
        len: [1, 2],
        isUppercase: true
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    saccoId: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "SYSTEM",
    },
    status: {
      type: DataTypes.ENUM("Active", "Inactive"),
      allowNull: false,
      defaultValue: "Active",
    },
    createdOn: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    createdBy: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    modifiedOn: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    modifiedBy: {
      type: DataTypes.STRING,
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
    isDeleted: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  }, {
    tableName: 'MaritalStatus', // Specify the table name explicitly
    timestamps: false, // Disable automatic createdAt/updatedAt
    indexes: [
      {
        fields: ['saccoId']
      },
      {
        fields: ['maritalStatusCode']
      },
      {
        fields: ['maritalStatusName']
      }
    ]
  });

  // Define associations
  MaritalStatus.associate = (models) => {
    // Define association with Sacco without foreign key constraint
    MaritalStatus.belongsTo(models.Sacco, {
      foreignKey: 'saccoId',
      targetKey: 'saccoId',
      as: 'sacco',
      constraints: false // Disable foreign key constraint
    });
  };

  return MaritalStatus;
};
