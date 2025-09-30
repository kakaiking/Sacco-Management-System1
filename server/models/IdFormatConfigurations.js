module.exports = (sequelize, DataTypes) => {
  const IdFormatConfigurations = sequelize.define("IdFormatConfigurations", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    modelName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Name of the model (e.g., Members, Users, Products, etc.)'
    },
    displayName: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Display name for the model (e.g., Member ID, User ID, etc.)'
    },
    prefix: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '',
      comment: 'Prefix for the ID (e.g., "M-", "U-", etc.)'
    },
    suffix: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '',
      comment: 'Suffix for the ID'
    },
    digitCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 7,
      comment: 'Number of digits in the numeric part'
    },
    characterType: {
      type: DataTypes.ENUM('NUMERIC', 'ALPHANUMERIC', 'ALPHA'),
      allowNull: false,
      defaultValue: 'NUMERIC',
      comment: 'Type of characters used in the ID'
    },
    startNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: 'Starting number for sequential generation'
    },
    currentNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Current number for sequential generation'
    },
    format: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '{prefix}{number}{suffix}',
      comment: 'Format template for ID generation'
    },
    example: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Example of generated ID'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether this configuration is active'
    },
    saccoId: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "SYSTEM",
      comment: 'SACCO ID this configuration belongs to'
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
    isDeleted: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  }, {
    tableName: 'IdFormatConfigurations',
    timestamps: false,
    indexes: [
      {
        fields: ['modelName']
      },
      {
        fields: ['saccoId']
      },
      {
        fields: ['isActive']
      }
    ]
  });

  // Define associations
  IdFormatConfigurations.associate = (models) => {
    // Define association with Sacco without foreign key constraint
    IdFormatConfigurations.belongsTo(models.Sacco, {
      foreignKey: 'saccoId',
      targetKey: 'saccoId',
      as: 'sacco',
      constraints: false // Disable foreign key constraint
    });
  };

  return IdFormatConfigurations;
};
