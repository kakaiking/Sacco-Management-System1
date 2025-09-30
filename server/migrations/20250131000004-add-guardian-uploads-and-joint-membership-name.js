'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
    // Check if columns already exist before adding them
    const tableDescription = await queryInterface.describeTable('Members');
    
    if (!tableDescription.jointMembershipName) {
      await queryInterface.addColumn('Members', 'jointMembershipName', {
      type: Sequelize.STRING,
      allowNull: true
    });
    } else {
      console.log('Column jointMembershipName already exists in Members table - skipping');
    }
    
    if (!tableDescription.guardianPhotos) {
      await queryInterface.addColumn('Members', 'guardianPhotos', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    } else {
      console.log('Column guardianPhotos already exists in Members table - skipping');
    }
    
    if (!tableDescription.guardianSignatures) {
      await queryInterface.addColumn('Members', 'guardianSignatures', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    } else {
      console.log('Column guardianSignatures already exists in Members table - skipping');
    }
    
    if (!tableDescription.guardianBiometrics) {
      await queryInterface.addColumn('Members', 'guardianBiometrics', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    } else {
      console.log('Column guardianBiometrics already exists in Members table - skipping');
    }
    
  },

    down: async (queryInterface, Sequelize) => {
    // Check if columns exist before removing them
    const tableDescription = await queryInterface.describeTable('Members');
    
    if (tableDescription.jointMembershipName) {
      await queryInterface.removeColumn('Members', 'jointMembershipName');
    } else {
      console.log('Column jointMembershipName does not exist in Members table - skipping');
    }
    
    if (tableDescription.guardianPhotos) {
      await queryInterface.removeColumn('Members', 'guardianPhotos');
    } else {
      console.log('Column guardianPhotos does not exist in Members table - skipping');
    }
    
    if (tableDescription.guardianSignatures) {
      await queryInterface.removeColumn('Members', 'guardianSignatures');
    } else {
      console.log('Column guardianSignatures does not exist in Members table - skipping');
    }
    
    if (tableDescription.guardianBiometrics) {
      await queryInterface.removeColumn('Members', 'guardianBiometrics');
    } else {
      console.log('Column guardianBiometrics does not exist in Members table - skipping');
    }
    
  }
};
