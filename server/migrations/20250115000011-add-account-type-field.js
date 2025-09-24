'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add accountType field to Accounts table
    await queryInterface.addColumn('Accounts', 'accountType', {
      type: Sequelize.ENUM('MEMBER', 'GL'),
      allowNull: false,
      defaultValue: 'MEMBER'
    });

    // Make memberId and productId nullable for GL accounts
    await queryInterface.changeColumn('Accounts', 'memberId', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    await queryInterface.changeColumn('Accounts', 'productId', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the added column
    await queryInterface.removeColumn('Accounts', 'accountType');
    
    // Revert memberId and productId to not null
    await queryInterface.changeColumn('Accounts', 'memberId', {
      type: Sequelize.INTEGER,
      allowNull: false
    });

    await queryInterface.changeColumn('Accounts', 'productId', {
      type: Sequelize.INTEGER,
      allowNull: false
    });
  }
};
