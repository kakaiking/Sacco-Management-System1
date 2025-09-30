module.exports = (sequelize, DataTypes) => {
  const Roles = sequelize.define("Roles", {
    roleId: { 
      type: DataTypes.STRING, 
      allowNull: false, 
      unique: true
    },
    saccoId: { 
      type: DataTypes.STRING, 
      allowNull: false 
    },
    roleName: { 
      type: DataTypes.STRING, 
      allowNull: false 
    },
    description: { 
      type: DataTypes.TEXT, 
      allowNull: true 
    },
    status: { 
      type: DataTypes.ENUM("Active", "Inactive"), 
      allowNull: false, 
      defaultValue: "Active" 
    },
    permissions: { 
      type: DataTypes.TEXT, 
      allowNull: true,
      defaultValue: '{}',
      get() {
        const value = this.getDataValue('permissions');
        return value ? JSON.parse(value) : {};
      },
      set(value) {
        this.setDataValue('permissions', JSON.stringify(value || {}));
      }
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
    createdByRole: { 
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
    modifiedByRole: { 
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
    },
  });


  Roles.associate = (models) => {
    // Role belongs to Sacco
    Roles.belongsTo(models.Sacco, {
      foreignKey: 'saccoId',
      targetKey: 'saccoId',
      as: 'sacco'
    });

    // Note: Users table uses 'role' string field, not 'roleId' foreign key
    // This association is commented out since Users.role is a string, not a foreign key
    // Roles.hasMany(models.Users, {
    //   foreignKey: 'roleId',
    //   sourceKey: 'roleId',
    //   onDelete: "SET NULL",
    // });
  };

  return Roles;
};
