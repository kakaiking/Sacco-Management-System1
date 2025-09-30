'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('IdFormatConfigurations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      modelName: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: 'Name of the model (e.g., Members, Users, Products, etc.)'
      },
      displayName: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Display name for the model (e.g., Member ID, User ID, etc.)'
      },
      prefix: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: '',
        comment: 'Prefix for the ID (e.g., "M-", "U-", etc.)'
      },
      suffix: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: '',
        comment: 'Suffix for the ID'
      },
      digitCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 7,
        comment: 'Number of digits in the numeric part'
      },
      characterType: {
        type: Sequelize.ENUM('NUMERIC', 'ALPHANUMERIC', 'ALPHA'),
        allowNull: false,
        defaultValue: 'NUMERIC',
        comment: 'Type of characters used in the ID'
      },
      startNumber: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Starting number for sequential generation'
      },
      currentNumber: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Current number for sequential generation'
      },
      format: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '{prefix}{number}{suffix}',
        comment: 'Format template for ID generation'
      },
      example: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Example of generated ID'
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether this configuration is active'
      },
      saccoId: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "SYSTEM",
        comment: 'SACCO ID this configuration belongs to'
      },
      createdOn: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      createdBy: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      modifiedOn: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      modifiedBy: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      isDeleted: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    });

    // Add indexes
    await queryInterface.addIndex('IdFormatConfigurations', ['modelName']);
    await queryInterface.addIndex('IdFormatConfigurations', ['saccoId']);
    await queryInterface.addIndex('IdFormatConfigurations', ['isActive']);

    // Insert default configurations for existing models
    await queryInterface.bulkInsert('IdFormatConfigurations', [
      {
        modelName: 'Members',
        displayName: 'Member ID',
        prefix: 'M-',
        suffix: '',
        digitCount: 7,
        characterType: 'NUMERIC',
        startNumber: 1,
        currentNumber: 0,
        format: '{prefix}{number}{suffix}',
        example: 'M-0000001',
        isActive: true,
        saccoId: 'SYSTEM',
        createdOn: new Date(),
        createdBy: 'SYSTEM',
        isDeleted: 0
      },
      {
        modelName: 'Users',
        displayName: 'User ID',
        prefix: 'U-',
        suffix: '',
        digitCount: 6,
        characterType: 'NUMERIC',
        startNumber: 1,
        currentNumber: 0,
        format: '{prefix}{number}{suffix}',
        example: 'U-000001',
        isActive: true,
        saccoId: 'SYSTEM',
        createdOn: new Date(),
        createdBy: 'SYSTEM',
        isDeleted: 0
      },
      {
        modelName: 'Products',
        displayName: 'Product ID',
        prefix: 'PRD-',
        suffix: '',
        digitCount: 6,
        characterType: 'NUMERIC',
        startNumber: 1,
        currentNumber: 0,
        format: '{prefix}{number}{suffix}',
        example: 'PRD-000001',
        isActive: true,
        saccoId: 'SYSTEM',
        createdOn: new Date(),
        createdBy: 'SYSTEM',
        isDeleted: 0
      },
      {
        modelName: 'Accounts',
        displayName: 'Account ID',
        prefix: 'A-',
        suffix: '',
        digitCount: 8,
        characterType: 'ALPHANUMERIC',
        startNumber: 1,
        currentNumber: 0,
        format: '{prefix}{number}{suffix}',
        example: 'A-00000001',
        isActive: true,
        saccoId: 'SYSTEM',
        createdOn: new Date(),
        createdBy: 'SYSTEM',
        isDeleted: 0
      },
      {
        modelName: 'Transactions',
        displayName: 'Transaction ID',
        prefix: 'TXN-',
        suffix: '',
        digitCount: 8,
        characterType: 'NUMERIC',
        startNumber: 1,
        currentNumber: 0,
        format: '{prefix}{number}{suffix}',
        example: 'TXN-00000001',
        isActive: true,
        saccoId: 'SYSTEM',
        createdOn: new Date(),
        createdBy: 'SYSTEM',
        isDeleted: 0
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('IdFormatConfigurations');
  }
};
