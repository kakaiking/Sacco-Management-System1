'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('Accounts');

    if (!tableDescription.signatories) {
      await queryInterface.addColumn('Accounts', 'signatories', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const tableDescription = await queryInterface.describeTable('Accounts');

    if (tableDescription.signatories) {
      await queryInterface.removeColumn('Accounts', 'signatories');
    }
  },
};



