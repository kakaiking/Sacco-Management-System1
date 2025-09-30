module.exports = (sequelize, DataTypes) => {
  const Users = sequelize.define("Users", {
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "User",
    },
    saccoId: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "SYSTEM",
    },
    status: {
      type: DataTypes.ENUM("Pending Password", "Pending", "Active", "Inactive", "Locked"),
      allowNull: false,
      defaultValue: "Pending Password",
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true, // Allow null for pending password users
    },
    passwordResetToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    passwordResetExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    createdOn: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    modifiedBy: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    modifiedOn: {
      type: DataTypes.DATE,
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
    lockedBy: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lockedOn: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lockRemarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    previousStatus: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    branchId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  });

  Users.associate = (models) => {
    // Association with Sacco
    Users.belongsTo(models.Sacco, {
      foreignKey: 'saccoId',
      targetKey: 'saccoId',
      as: 'sacco'
    });

    // Association with Branch
    Users.belongsTo(models.Branch, {
      foreignKey: 'branchId',
      targetKey: 'branchId',
      as: 'branch'
    });
  };

  return Users;
};
