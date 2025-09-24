'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Products', 'saccoId', {
      type: Sequelize.STRING,
      allowNull: true,
      references: {
        model: 'Saccos',
        key: 'saccoId'
      }
    });

    await queryInterface.addColumn('Products', 'chargeIds', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'JSON array of charge IDs'
    });

    await queryInterface.addColumn('Products', 'interestRate', {
      type: Sequelize.DECIMAL(10, 4),
      allowNull: true,
      comment: 'Interest rate as decimal (e.g., 0.12 for 12%)'
    });

    await queryInterface.addColumn('Products', 'needGuarantors', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    await queryInterface.addColumn('Products', 'maxGuarantors', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Maximum number of guarantors required'
    });

    await queryInterface.addColumn('Products', 'minGuarantors', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Minimum number of guarantors required'
    });

    await queryInterface.addColumn('Products', 'isSpecial', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    await queryInterface.addColumn('Products', 'maxSpecialUsers', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Maximum number of special users allowed'
    });

    await queryInterface.addColumn('Products', 'onMemberOnboarding', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether this product is available during member onboarding'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Products', 'saccoId');
    await queryInterface.removeColumn('Products', 'chargeIds');
    await queryInterface.removeColumn('Products', 'interestRate');
    await queryInterface.removeColumn('Products', 'needGuarantors');
    await queryInterface.removeColumn('Products', 'maxGuarantors');
    await queryInterface.removeColumn('Products', 'minGuarantors');
    await queryInterface.removeColumn('Products', 'isSpecial');
    await queryInterface.removeColumn('Products', 'maxSpecialUsers');
    await queryInterface.removeColumn('Products', 'onMemberOnboarding');
  }
};
