module.exports = (sequelize, DataTypes) => {
  const Members = sequelize.define("Members", {
    memberNo: { type: DataTypes.STRING, allowNull: false, unique: true },
    saccoId: { type: DataTypes.STRING, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: true },
    firstName: { type: DataTypes.STRING, allowNull: false },
    lastName: { type: DataTypes.STRING, allowNull: false },
    category: { type: DataTypes.STRING, allowNull: true },
    gender: { type: DataTypes.STRING, allowNull: false },
    dateOfBirth: { type: DataTypes.DATEONLY, allowNull: true },
    nationality: { type: DataTypes.STRING, allowNull: true },
    identificationType: { type: DataTypes.STRING, allowNull: true },
    identificationNumber: { type: DataTypes.STRING, allowNull: true },
    identificationExpiryDate: { type: DataTypes.DATEONLY, allowNull: true },
    kraPin: { type: DataTypes.STRING, allowNull: true },
    maritalStatus: { type: DataTypes.STRING, allowNull: true },
    country: { type: DataTypes.STRING, allowNull: true },
    county: { type: DataTypes.STRING, allowNull: true },
    subCounty: { type: DataTypes.STRING, allowNull: true },
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
    biometrics: { type: DataTypes.TEXT, allowNull: true },
    photos: { type: DataTypes.TEXT, allowNull: true },
    signatures: { type: DataTypes.TEXT, allowNull: true },
    verifierRemarks: { type: DataTypes.TEXT, allowNull: true },
    isDeleted: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    
    // Corporate-specific fields
    companyName: { type: DataTypes.STRING, allowNull: true },
    registrationNumber: { type: DataTypes.STRING, allowNull: true },
    companyKraPin: { type: DataTypes.STRING, allowNull: true },
    businessType: { type: DataTypes.STRING, allowNull: true },
    businessAddress: { type: DataTypes.TEXT, allowNull: true },
    
    // Joint member fields
    jointMembers: { type: DataTypes.TEXT, allowNull: true },
    jointMembershipName: { type: DataTypes.STRING, allowNull: true },
    
    // Minor-specific fields
    guardianName: { type: DataTypes.STRING, allowNull: true },
    guardianIdNumber: { type: DataTypes.STRING, allowNull: true },
    guardianKraPin: { type: DataTypes.STRING, allowNull: true },
    guardianPhone: { type: DataTypes.STRING, allowNull: true },
    guardianEmail: { type: DataTypes.STRING, allowNull: true },
    guardianAddress: { type: DataTypes.TEXT, allowNull: true },
    guardianRelationship: { type: DataTypes.STRING, allowNull: true },
    
    // Guardian photo, signature, and biometrics fields
    guardianPhotos: { type: DataTypes.TEXT, allowNull: true },
    guardianSignatures: { type: DataTypes.TEXT, allowNull: true },
    guardianBiometrics: { type: DataTypes.TEXT, allowNull: true },
    
    // Chama-specific fields
    chamaName: { type: DataTypes.STRING, allowNull: true },
    chamaRegistrationNumber: { type: DataTypes.STRING, allowNull: true },
    chamaMembers: { type: DataTypes.TEXT, allowNull: true },
    chamaConstitution: { type: DataTypes.TEXT, allowNull: true },
    
    // Authorized signatories for corporate and chama
    authorizedSignatories: { type: DataTypes.TEXT, allowNull: true },
    
    // Special offers fields - removed as they don't exist in the database
    // canSendAssociateSpecialOffer: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    // canSendOurSpecialOffers: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    // statementOnline: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    // mobileAlert: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    // mobileBanking: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    // internetBanking: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
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
      foreignKey: 'memberNo',
      sourceKey: 'memberNo',
      as: 'accounts'
    });
  };

  return Members;
};


