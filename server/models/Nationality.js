module.exports = (sequelize, DataTypes) => {
  const Nationality = sequelize.define("Nationality", {
    nationalityId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    nationalityName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isoCode: {
      type: DataTypes.STRING(2),
      allowNull: true,
      validate: {
        len: [2, 2],
        isUppercase: true
      }
    },
    countryCode: {
      type: DataTypes.STRING(3),
      allowNull: true,
      validate: {
        len: [3, 3],
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
    tableName: 'Nationality', // Specify the table name explicitly
    timestamps: false, // Disable automatic createdAt/updatedAt
    indexes: [
      {
        fields: ['saccoId']
      },
      {
        fields: ['isoCode']
      },
      {
        fields: ['countryCode']
      }
    ]
  });

  // Define associations
  Nationality.associate = (models) => {
    // Define association with Sacco without foreign key constraint
    Nationality.belongsTo(models.Sacco, {
      foreignKey: 'saccoId',
      targetKey: 'saccoId',
      as: 'sacco',
      constraints: false // Disable foreign key constraint
    });
  };

  return Nationality;
};
