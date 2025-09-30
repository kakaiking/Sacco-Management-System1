'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
    // Check if columns already exist before adding them
    const tableDescription = await queryInterface.describeTable('Products');
    
    if (!tableDescription.accountType) {
      await queryInterface.addColumn('Products', 'accountType', {
      type: Sequelize.ENUM('MEMBER', 'GL'),
      allowNull: false,
      defaultValue: 'MEMBER'
    });
    } else {
      console.log('Column accountType already exists in Products table - skipping');
    }
    
    if (!tableDescription.bosaFosa) {
      await queryInterface.addColumn('Products', 'bosaFosa', {
      type: Sequelize.ENUM('BOSA', 'FOSA'),
      allowNull: false,
      defaultValue: 'BOSA'
    });
    } else {
      console.log('Column bosaFosa already exists in Products table - skipping');
    }
    
    if (!tableDescription.debitCredit) {
      await queryInterface.addColumn('Products', 'debitCredit', {
      type: Sequelize.ENUM('DEBIT', 'CREDIT'),
      allowNull: false,
      defaultValue: 'DEBIT'
    });
    } else {
      console.log('Column debitCredit already exists in Products table - skipping');
    }
    
    if (!tableDescription.appliedOnMemberOnboarding) {
      await queryInterface.addColumn('Products', 'appliedOnMemberOnboarding', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    } else {
      console.log('Column appliedOnMemberOnboarding already exists in Products table - skipping');
    }
    
    if (!tableDescription.isWithdrawable) {
      await queryInterface.addColumn('Products', 'isWithdrawable', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });
    } else {
      console.log('Column isWithdrawable already exists in Products table - skipping');
    }
    
    if (!tableDescription.withdrawableFrom) {
      await queryInterface.addColumn('Products', 'withdrawableFrom', {
      type: Sequelize.DATEONLY,
      allowNull: true
    });
    } else {
      console.log('Column withdrawableFrom already exists in Products table - skipping');
    }
    
    if (!tableDescription.interestRate) {
      await queryInterface.addColumn('Products', 'interestRate', {
      type: Sequelize.DECIMAL(10, 4),
      allowNull: true
    });
    } else {
      console.log('Column interestRate already exists in Products table - skipping');
    }
    
    if (!tableDescription.interestType) {
      await queryInterface.addColumn('Products', 'interestType', {
      type: Sequelize.STRING,
      allowNull: true
    });
    } else {
      console.log('Column interestType already exists in Products table - skipping');
    }
    
    if (!tableDescription.interestCalculationRule) {
      await queryInterface.addColumn('Products', 'interestCalculationRule', {
      type: Sequelize.STRING,
      allowNull: true
    });
    } else {
      console.log('Column interestCalculationRule already exists in Products table - skipping');
    }
    
    if (!tableDescription.interestFrequency) {
      await queryInterface.addColumn('Products', 'interestFrequency', {
      type: Sequelize.STRING,
      allowNull: true
    });
    } else {
      console.log('Column interestFrequency already exists in Products table - skipping');
    }
    
    if (!tableDescription.isCreditInterest) {
      await queryInterface.addColumn('Products', 'isCreditInterest', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    } else {
      console.log('Column isCreditInterest already exists in Products table - skipping');
    }
    
    if (!tableDescription.isDebitInterest) {
      await queryInterface.addColumn('Products', 'isDebitInterest', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    } else {
      console.log('Column isDebitInterest already exists in Products table - skipping');
    }
    
    if (!tableDescription.needGuarantors) {
      await queryInterface.addColumn('Products', 'needGuarantors', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    } else {
      console.log('Column needGuarantors already exists in Products table - skipping');
    }
    
    if (!tableDescription.maxGuarantors) {
      await queryInterface.addColumn('Products', 'maxGuarantors', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
    } else {
      console.log('Column maxGuarantors already exists in Products table - skipping');
    }
    
    if (!tableDescription.minGuarantors) {
      await queryInterface.addColumn('Products', 'minGuarantors', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
    } else {
      console.log('Column minGuarantors already exists in Products table - skipping');
    }
    
    if (!tableDescription.chargeIds) {
      await queryInterface.addColumn('Products', 'chargeIds', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    } else {
      console.log('Column chargeIds already exists in Products table - skipping');
    }
    
    if (!tableDescription.currency) {
      await queryInterface.addColumn('Products', 'currency', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'KES'
    });
    } else {
      console.log('Column currency already exists in Products table - skipping');
    }
    
  },

    down: async (queryInterface, Sequelize) => {
    // Check if columns exist before removing them
    const tableDescription = await queryInterface.describeTable('Products');
    
    if (tableDescription.accountType) {
      await queryInterface.removeColumn('Products', 'accountType');
    } else {
      console.log('Column accountType does not exist in Products table - skipping');
    }
    
    if (tableDescription.bosaFosa) {
      await queryInterface.removeColumn('Products', 'bosaFosa');
    } else {
      console.log('Column bosaFosa does not exist in Products table - skipping');
    }
    
    if (tableDescription.debitCredit) {
      await queryInterface.removeColumn('Products', 'debitCredit');
    } else {
      console.log('Column debitCredit does not exist in Products table - skipping');
    }
    
    if (tableDescription.appliedOnMemberOnboarding) {
      await queryInterface.removeColumn('Products', 'appliedOnMemberOnboarding');
    } else {
      console.log('Column appliedOnMemberOnboarding does not exist in Products table - skipping');
    }
    
    if (tableDescription.isWithdrawable) {
      await queryInterface.removeColumn('Products', 'isWithdrawable');
    } else {
      console.log('Column isWithdrawable does not exist in Products table - skipping');
    }
    
    if (tableDescription.withdrawableFrom) {
      await queryInterface.removeColumn('Products', 'withdrawableFrom');
    } else {
      console.log('Column withdrawableFrom does not exist in Products table - skipping');
    }
    
    if (tableDescription.interestRate) {
      await queryInterface.removeColumn('Products', 'interestRate');
    } else {
      console.log('Column interestRate does not exist in Products table - skipping');
    }
    
    if (tableDescription.interestType) {
      await queryInterface.removeColumn('Products', 'interestType');
    } else {
      console.log('Column interestType does not exist in Products table - skipping');
    }
    
    if (tableDescription.interestCalculationRule) {
      await queryInterface.removeColumn('Products', 'interestCalculationRule');
    } else {
      console.log('Column interestCalculationRule does not exist in Products table - skipping');
    }
    
    if (tableDescription.interestFrequency) {
      await queryInterface.removeColumn('Products', 'interestFrequency');
    } else {
      console.log('Column interestFrequency does not exist in Products table - skipping');
    }
    
    if (tableDescription.isCreditInterest) {
      await queryInterface.removeColumn('Products', 'isCreditInterest');
    } else {
      console.log('Column isCreditInterest does not exist in Products table - skipping');
    }
    
    if (tableDescription.isDebitInterest) {
      await queryInterface.removeColumn('Products', 'isDebitInterest');
    } else {
      console.log('Column isDebitInterest does not exist in Products table - skipping');
    }
    
    if (tableDescription.needGuarantors) {
      await queryInterface.removeColumn('Products', 'needGuarantors');
    } else {
      console.log('Column needGuarantors does not exist in Products table - skipping');
    }
    
    if (tableDescription.maxGuarantors) {
      await queryInterface.removeColumn('Products', 'maxGuarantors');
    } else {
      console.log('Column maxGuarantors does not exist in Products table - skipping');
    }
    
    if (tableDescription.minGuarantors) {
      await queryInterface.removeColumn('Products', 'minGuarantors');
    } else {
      console.log('Column minGuarantors does not exist in Products table - skipping');
    }
    
    if (tableDescription.chargeIds) {
      await queryInterface.removeColumn('Products', 'chargeIds');
    } else {
      console.log('Column chargeIds does not exist in Products table - skipping');
    }
    
    if (tableDescription.currency) {
      await queryInterface.removeColumn('Products', 'currency');
    } else {
      console.log('Column currency does not exist in Products table - skipping');
    }
    
  }
};
