'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove old account-related fields from Products table (only if they exist)
    const table = await queryInterface.describeTable('Products');
    const columnsToDrop = [
      'chargeIds',
      'interestRate',
      'interestType',
      'interestCalculationRule',
      'interestFrequency',
      'isCreditInterest',
      'isDebitInterest',
      'needGuarantors',
      'maxGuarantors',
      'minGuarantors',
      'isSpecial',
      'maxSpecialUsers',
      'appliedOnMemberOnboarding',
      'isWithdrawable',
      'withdrawableFrom',
    ];
    for (const col of columnsToDrop) {
      if (table[col]) {
        // eslint-disable-next-line no-await-in-loop
        await queryInterface.removeColumn('Products', col);
      }
    }

    // Add description field if missing
    const tableAfterDrops = await queryInterface.describeTable('Products');
    if (!tableAfterDrops.description) {
      await queryInterface.addColumn('Products', 'description', {
        type: Sequelize.TEXT,
        allowNull: true
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Add back the removed fields only if missing
    const table = await queryInterface.describeTable('Products');

    const addIfMissing = async (name, definition) => {
      if (!table[name]) {
        await queryInterface.addColumn('Products', name, definition);
      }
    };

    await addIfMissing('chargeIds', { type: Sequelize.TEXT, allowNull: true });
    await addIfMissing('interestRate', { type: Sequelize.DECIMAL(10, 4), allowNull: true });
    await addIfMissing('interestType', { type: Sequelize.STRING, allowNull: true });
    await addIfMissing('interestCalculationRule', { type: Sequelize.STRING, allowNull: true });
    await addIfMissing('interestFrequency', { type: Sequelize.STRING, allowNull: true });
    await addIfMissing('isCreditInterest', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false });
    await addIfMissing('isDebitInterest', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false });
    await addIfMissing('needGuarantors', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false });
    await addIfMissing('maxGuarantors', { type: Sequelize.INTEGER, allowNull: true });
    await addIfMissing('minGuarantors', { type: Sequelize.INTEGER, allowNull: true });
    await addIfMissing('isSpecial', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false });
    await addIfMissing('maxSpecialUsers', { type: Sequelize.INTEGER, allowNull: true });
    await addIfMissing('appliedOnMemberOnboarding', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false });
    await addIfMissing('isWithdrawable', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true });
    await addIfMissing('withdrawableFrom', { type: Sequelize.DATEONLY, allowNull: true });

    // Remove description field if present
    const tableAfter = await queryInterface.describeTable('Products');
    if (tableAfter.description) {
      await queryInterface.removeColumn('Products', 'description');
    }
  }
};

