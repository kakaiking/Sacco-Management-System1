module.exports = (sequelize, DataTypes) => {
  const Collateral = sequelize.define("Collateral", {
    collateralId: { 
      type: DataTypes.STRING, 
      allowNull: false, 
      unique: true 
    },
    memberId: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      references: {
        model: 'Members',
        key: 'id'
      }
    },
    collateralType: { 
      type: DataTypes.ENUM('Real Estate', 'Vehicle', 'Equipment', 'Inventory', 'Securities', 'Cash Deposit', 'Other'), 
      allowNull: false 
    },
    description: { 
      type: DataTypes.TEXT, 
      allowNull: false 
    },
    value: { 
      type: DataTypes.DECIMAL(15, 2), 
      allowNull: false 
    },
    currency: { 
      type: DataTypes.STRING(3), 
      allowNull: false,
      defaultValue: 'USD'
    },
    ownershipType: { 
      type: DataTypes.ENUM('Full Ownership', 'Partial Ownership', 'Joint Ownership', 'Lease'), 
      allowNull: false,
      defaultValue: 'Full Ownership'
    },
    ownershipPercentage: { 
      type: DataTypes.DECIMAL(5, 2), 
      allowNull: true,
      defaultValue: 100.00,
      validate: {
        min: 0,
        max: 100
      }
    },
    location: { 
      type: DataTypes.STRING, 
      allowNull: true 
    },
    condition: { 
      type: DataTypes.ENUM('Excellent', 'Good', 'Fair', 'Poor'), 
      allowNull: true 
    },
    appraisalDate: { 
      type: DataTypes.DATE, 
      allowNull: true 
    },
    appraisedBy: { 
      type: DataTypes.STRING, 
      allowNull: true 
    },
    appraisalValue: { 
      type: DataTypes.DECIMAL(15, 2), 
      allowNull: true 
    },
    documentNumber: { 
      type: DataTypes.STRING, 
      allowNull: true 
    },
    documentType: { 
      type: DataTypes.ENUM('Title Deed', 'Registration Certificate', 'Invoice', 'Receipt', 'Certificate', 'Other'), 
      allowNull: true 
    },
    insurancePolicyNumber: { 
      type: DataTypes.STRING, 
      allowNull: true 
    },
    insuranceCompany: { 
      type: DataTypes.STRING, 
      allowNull: true 
    },
    insuranceExpiryDate: { 
      type: DataTypes.DATE, 
      allowNull: true 
    },
    lienHolder: { 
      type: DataTypes.STRING, 
      allowNull: true 
    },
    lienAmount: { 
      type: DataTypes.DECIMAL(15, 2), 
      allowNull: true 
    },
    status: { 
      type: DataTypes.ENUM('Active', 'Inactive', 'Under Review', 'Rejected', 'Released'), 
      allowNull: false,
      defaultValue: 'Active'
    },
    remarks: { 
      type: DataTypes.TEXT, 
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
    }
  }, {
    timestamps: false, // Disable automatic createdAt/updatedAt since we use our own createdOn/modifiedOn fields
    tableName: 'Collateral' // Explicitly specify table name
  });

  // Define associations
  Collateral.associate = (models) => {
    // Collateral belongs to Member
    Collateral.belongsTo(models.Members, {
      foreignKey: 'memberId',
      as: 'member'
    });
    
    // Collateral can be used in multiple loan applications (many-to-many relationship)
    Collateral.belongsToMany(models.LoanApplications, {
      through: 'LoanApplicationCollateral',
      foreignKey: 'collateralId',
      otherKey: 'loanApplicationId',
      as: 'loanApplications'
    });
  };

  return Collateral;
};
