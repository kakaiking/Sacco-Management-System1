'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
    // Check if columns already exist before adding them
    const tableDescription = await queryInterface.describeTable('Members');
    
    if (!tableDescription.canSendAssociateSpecialOffer) {
      await queryInterface.addColumn('Members', 'canSendAssociateSpecialOffer', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    } else {
      console.log('Column canSendAssociateSpecialOffer already exists in Members table - skipping');
    }
    
    if (!tableDescription.canSendOurSpecialOffers) {
      await queryInterface.addColumn('Members', 'canSendOurSpecialOffers', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    } else {
      console.log('Column canSendOurSpecialOffers already exists in Members table - skipping');
    }
    
    if (!tableDescription.statementOnline) {
      await queryInterface.addColumn('Members', 'statementOnline', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    } else {
      console.log('Column statementOnline already exists in Members table - skipping');
    }
    
    if (!tableDescription.mobileAlert) {
      await queryInterface.addColumn('Members', 'mobileAlert', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    } else {
      console.log('Column mobileAlert already exists in Members table - skipping');
    }
    
    if (!tableDescription.mobileBanking) {
      await queryInterface.addColumn('Members', 'mobileBanking', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    } else {
      console.log('Column mobileBanking already exists in Members table - skipping');
    }
    
    if (!tableDescription.internetBanking) {
      await queryInterface.addColumn('Members', 'internetBanking', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    } else {
      console.log('Column internetBanking already exists in Members table - skipping');
    }
    
  },

    down: async (queryInterface, Sequelize) => {
    // Check if columns exist before removing them
    const tableDescription = await queryInterface.describeTable('Members');
    
    if (tableDescription.canSendAssociateSpecialOffer) {
      await queryInterface.removeColumn('Members', 'canSendAssociateSpecialOffer');
    } else {
      console.log('Column canSendAssociateSpecialOffer does not exist in Members table - skipping');
    }
    
    if (tableDescription.canSendOurSpecialOffers) {
      await queryInterface.removeColumn('Members', 'canSendOurSpecialOffers');
    } else {
      console.log('Column canSendOurSpecialOffers does not exist in Members table - skipping');
    }
    
    if (tableDescription.statementOnline) {
      await queryInterface.removeColumn('Members', 'statementOnline');
    } else {
      console.log('Column statementOnline does not exist in Members table - skipping');
    }
    
    if (tableDescription.mobileAlert) {
      await queryInterface.removeColumn('Members', 'mobileAlert');
    } else {
      console.log('Column mobileAlert does not exist in Members table - skipping');
    }
    
    if (tableDescription.mobileBanking) {
      await queryInterface.removeColumn('Members', 'mobileBanking');
    } else {
      console.log('Column mobileBanking does not exist in Members table - skipping');
    }
    
    if (tableDescription.internetBanking) {
      await queryInterface.removeColumn('Members', 'internetBanking');
    } else {
      console.log('Column internetBanking does not exist in Members table - skipping');
    }
    
  }
};

