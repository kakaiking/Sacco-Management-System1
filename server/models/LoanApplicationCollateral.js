module.exports = (sequelize, DataTypes) => {
  const LoanApplicationCollateral = sequelize.define("LoanApplicationCollateral", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    loanApplicationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'LoanApplications',
        key: 'id'
      }
    },
    collateralId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Collateral',
        key: 'id'
      }
    },
    assignedValue: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      comment: 'The value of this collateral assigned to this specific loan application'
    },
    isPrimary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether this is the primary collateral for the loan'
    },
    createdOn: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    createdBy: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    timestamps: false,
    tableName: 'LoanApplicationCollateral',
    indexes: [
      {
        unique: true,
        fields: ['loanApplicationId', 'collateralId']
      }
    ]
  });

  // Define associations
  LoanApplicationCollateral.associate = (models) => {
    // Junction table belongs to LoanApplication
    LoanApplicationCollateral.belongsTo(models.LoanApplications, {
      foreignKey: 'loanApplicationId',
      as: 'loanApplication'
    });
    
    // Junction table belongs to Collateral
    LoanApplicationCollateral.belongsTo(models.Collateral, {
      foreignKey: 'collateralId',
      as: 'collateral'
    });
  };

  return LoanApplicationCollateral;
};
