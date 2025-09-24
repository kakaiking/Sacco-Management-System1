module.exports = (sequelize, DataTypes) => {
  const Members = sequelize.define("Members", {
    memberNo: { type: DataTypes.STRING, allowNull: false, unique: true },
    saccoId: { type: DataTypes.STRING, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: true },
    firstName: { type: DataTypes.STRING, allowNull: false },
    lastName: { type: DataTypes.STRING, allowNull: false },
    category: { type: DataTypes.STRING, allowNull: true },
    gender: { type: DataTypes.STRING, allowNull: false },
    dateOfBirth: { type: DataTypes.DATEONLY, allowNull: false },
    nationality: { type: DataTypes.STRING, allowNull: true },
    identificationType: { type: DataTypes.STRING, allowNull: true },
    identificationNumber: { type: DataTypes.STRING, allowNull: true },
    identificationExpiryDate: { type: DataTypes.DATEONLY, allowNull: true },
    kraPin: { type: DataTypes.STRING, allowNull: true },
    maritalStatus: { type: DataTypes.STRING, allowNull: true },
    country: { type: DataTypes.STRING, allowNull: true },
    county: { type: DataTypes.STRING, allowNull: true },
    email: { type: DataTypes.STRING, allowNull: true },
    personalPhone: { type: DataTypes.STRING, allowNull: true },
    alternativePhone: { type: DataTypes.STRING, allowNull: true },
    createdOn: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW },
    createdBy: { type: DataTypes.STRING, allowNull: true },
    modifiedOn: { type: DataTypes.DATE, allowNull: true },
    modifiedBy: { type: DataTypes.STRING, allowNull: true },
    approvedBy: { type: DataTypes.STRING, allowNull: true },
    approvedOn: { type: DataTypes.DATE, allowNull: true },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: "Pending" },
    nextOfKin: { type: DataTypes.TEXT, allowNull: true },
    photo: { type: DataTypes.TEXT, allowNull: true },
    signature: { type: DataTypes.TEXT, allowNull: true },
    verifierRemarks: { type: DataTypes.TEXT, allowNull: true },
    isDeleted: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  });

  // Define associations
  Members.associate = (models) => {
    // Member belongs to Sacco
    Members.belongsTo(models.Sacco, {
      foreignKey: 'saccoId',
      targetKey: 'saccoId',
      as: 'sacco'
    });

    // Member has many Accounts
    Members.hasMany(models.Accounts, {
      foreignKey: 'memberId',
      as: 'accounts'
    });
  };

  return Members;
};


