module.exports = (sequelize, DataTypes) => {
  const IdentificationTypes = sequelize.define("IdentificationTypes", {
    identificationTypeId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    identificationTypeName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    saccoId: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "SYSTEM",
      references: undefined, // Explicitly disable foreign key
    },
    status: {
      type: DataTypes.STRING,
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
    tableName: 'IdentificationTypes', // Specify the table name explicitly
    timestamps: false, // Disable automatic createdAt/updatedAt
    indexes: [
      {
        fields: ['saccoId']
      }
    ]
  });

  // Define associations
  IdentificationTypes.associate = (models) => {
    // Define association with Sacco without foreign key constraint
    IdentificationTypes.belongsTo(models.Sacco, {
      foreignKey: 'saccoId',
      targetKey: 'saccoId',
      as: 'sacco',
      constraints: false // Disable foreign key constraint
    });
  };

  return IdentificationTypes;
};

