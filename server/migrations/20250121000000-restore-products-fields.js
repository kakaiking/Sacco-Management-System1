'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add back all the missing product fields that were removed by the cleanup migration
    const table = await queryInterface.describeTable('Products');
    
    const addIfMissing = async (name, definition) => {
      if (!table[name]) {
        console.log(`Adding missing column: ${name}`);
        await queryInterface.addColumn('Products', name, definition);
      } else {
        console.log(`Column ${name} already exists`);
      }
    };

    // Add back all the missing fields
    await addIfMissing('saccoId', {
      type: Sequelize.STRING,
      allowNull: true,
      references: {
        model: 'Saccos',
        key: 'saccoId'
      }
    });

    await addIfMissing('productType', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'BOSA'
    });

    await addIfMissing('chargeIds', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'JSON array of charge IDs'
    });

    await addIfMissing('interestRate', {
      type: Sequelize.DECIMAL(10, 4),
      allowNull: true,
      comment: 'Interest rate as decimal (e.g., 0.12 for 12%)'
    });

    await addIfMissing('interestType', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await addIfMissing('interestCalculationRule', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await addIfMissing('interestFrequency', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await addIfMissing('isCreditInterest', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    await addIfMissing('isDebitInterest', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    await addIfMissing('appliedOnMemberOnboarding', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether this product is available during member onboarding'
    });

    await addIfMissing('needGuarantors', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    await addIfMissing('maxGuarantors', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Maximum number of guarantors required'
    });

    await addIfMissing('minGuarantors', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Minimum number of guarantors required'
    });

    await addIfMissing('isSpecial', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    await addIfMissing('maxSpecialUsers', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Maximum number of special users allowed'
    });

    await addIfMissing('isWithdrawable', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });

    await addIfMissing('withdrawableFrom', {
      type: Sequelize.DATEONLY,
      allowNull: true
    });

    console.log('All missing product fields have been restored');
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the added columns
    const columnsToRemove = [
      'saccoId',
      'productType',
      'chargeIds',
      'interestRate',
      'interestType',
      'interestCalculationRule',
      'interestFrequency',
      'isCreditInterest',
      'isDebitInterest',
      'appliedOnMemberOnboarding',
      'needGuarantors',
      'maxGuarantors',
      'minGuarantors',
      'isSpecial',
      'maxSpecialUsers',
      'isWithdrawable',
      'withdrawableFrom'
    ];

    for (const column of columnsToRemove) {
      try {
        await queryInterface.removeColumn('Products', column);
        console.log(`Removed column: ${column}`);
      } catch (error) {
        console.log(`Column ${column} may not exist or could not be removed:`, error.message);
      }
    }
  }
};



