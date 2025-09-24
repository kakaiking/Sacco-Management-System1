module.exports = (sequelize, DataTypes) => {
  const Logs = sequelize.define("Logs", {
    logId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    saccoId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    action: {
      type: DataTypes.ENUM('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT', 'APPROVE', 'REJECT', 'LOCK', 'UNLOCK', 'NAVIGATE', 'CLICK', 'SEARCH', 'FILTER', 'FORM_SUBMIT'),
      allowNull: false
    },
    entityType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    entityId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    entityName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false
    },
    userRole: {
      type: DataTypes.STRING,
      allowNull: true
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    beforeData: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    afterData: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    changes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });

  Logs.associate = (models) => {
    // Associations can be added here if needed
  };

  return Logs;
};
