module.exports = (sequelize, DataTypes) => {
  const PendingCharges = sequelize.define("PendingCharges", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    chargeId: { type: DataTypes.STRING, allowNull: false },
    memberId: { type: DataTypes.INTEGER, allowNull: false },
    accountId: { type: DataTypes.INTEGER, allowNull: false },
    amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    currency: { type: DataTypes.STRING, allowNull: false, defaultValue: 'KES' },
    status: { 
      type: DataTypes.ENUM('PENDING', 'PROCESSED', 'FAILED', 'CANCELLED'), 
      allowNull: false, 
      defaultValue: 'PENDING' 
    },
    chargeType: { type: DataTypes.STRING, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    dueDate: { type: DataTypes.DATEONLY, allowNull: true },
    processedOn: { type: DataTypes.DATE, allowNull: true },
    processedBy: { type: DataTypes.STRING, allowNull: true },
    remarks: { type: DataTypes.TEXT, allowNull: true },
    createdOn: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW },
    createdBy: { type: DataTypes.STRING, allowNull: true },
    isDeleted: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  }, {
    timestamps: false,
    tableName: 'PendingCharges'
  });

  // Define associations
  PendingCharges.associate = (models) => {
    // PendingCharge belongs to Member
    PendingCharges.belongsTo(models.Members, {
      foreignKey: 'memberId',
      as: 'member',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // PendingCharge belongs to Account
    PendingCharges.belongsTo(models.Accounts, {
      foreignKey: 'accountId',
      as: 'account',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // PendingCharge belongs to Charge
    PendingCharges.belongsTo(models.Charges, {
      foreignKey: 'chargeId',
      targetKey: 'chargeId',
      as: 'charge',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  };

  return PendingCharges;
};
