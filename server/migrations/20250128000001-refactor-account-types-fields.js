'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      console.log('Starting AccountTypes field refactoring migration...');
      
      // Remove fields from AccountTypes table
      const fieldsToRemove = [
        'isCreditInterest',
        'isDebitInterest', 
        'needGuarantors',
        'maxGuarantors',
        'minGuarantors',
        'isSpecial',
        'maxSpecialUsers'
      ];
      
      for (const field of fieldsToRemove) {
        try {
          await queryInterface.removeColumn('AccountTypes', field);
          console.log(`✅ Removed column ${field} from AccountTypes`);
        } catch (error) {
          if (error.message.includes('doesn\'t exist')) {
            console.log(`⚠️  Column ${field} doesn't exist in AccountTypes, skipping...`);
          } else {
            console.error(`❌ Error removing column ${field} from AccountTypes:`, error.message);
            throw error;
          }
        }
      }
      
      // Add new fields to Products table
      try {
        await queryInterface.addColumn('Products', 'isSpecial', {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        });
        console.log('✅ Added isSpecial column to Products');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('⚠️  isSpecial column already exists in Products, skipping...');
        } else {
          console.error('❌ Error adding isSpecial to Products:', error.message);
          throw error;
        }
      }
      
      try {
        await queryInterface.addColumn('Products', 'maxSpecialUsers', {
          type: Sequelize.INTEGER,
          allowNull: true
        });
        console.log('✅ Added maxSpecialUsers column to Products');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('⚠️  maxSpecialUsers column already exists in Products, skipping...');
        } else {
          console.error('❌ Error adding maxSpecialUsers to Products:', error.message);
          throw error;
        }
      }
      
      // Add new fields to LoanProducts table
      try {
        await queryInterface.addColumn('LoanProducts', 'needGuarantors', {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        });
        console.log('✅ Added needGuarantors column to LoanProducts');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('⚠️  needGuarantors column already exists in LoanProducts, skipping...');
        } else {
          console.error('❌ Error adding needGuarantors to LoanProducts:', error.message);
          throw error;
        }
      }
      
      try {
        await queryInterface.addColumn('LoanProducts', 'maxGuarantors', {
          type: Sequelize.INTEGER,
          allowNull: true
        });
        console.log('✅ Added maxGuarantors column to LoanProducts');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('⚠️  maxGuarantors column already exists in LoanProducts, skipping...');
        } else {
          console.error('❌ Error adding maxGuarantors to LoanProducts:', error.message);
          throw error;
        }
      }
      
      try {
        await queryInterface.addColumn('LoanProducts', 'minGuarantors', {
          type: Sequelize.INTEGER,
          allowNull: true
        });
        console.log('✅ Added minGuarantors column to LoanProducts');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('⚠️  minGuarantors column already exists in LoanProducts, skipping...');
        } else {
          console.error('❌ Error adding minGuarantors to LoanProducts:', error.message);
          throw error;
        }
      }
      
      console.log('✅ AccountTypes field refactoring migration completed successfully');
    } catch (error) {
      console.error('❌ AccountTypes field refactoring migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      console.log('Rolling back AccountTypes field refactoring migration...');
      
      // Add back fields to AccountTypes table
      await queryInterface.addColumn('AccountTypes', 'isCreditInterest', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
      
      await queryInterface.addColumn('AccountTypes', 'isDebitInterest', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
      
      await queryInterface.addColumn('AccountTypes', 'needGuarantors', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
      
      await queryInterface.addColumn('AccountTypes', 'maxGuarantors', {
        type: Sequelize.INTEGER,
        allowNull: true
      });
      
      await queryInterface.addColumn('AccountTypes', 'minGuarantors', {
        type: Sequelize.INTEGER,
        allowNull: true
      });
      
      await queryInterface.addColumn('AccountTypes', 'isSpecial', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
      
      await queryInterface.addColumn('AccountTypes', 'maxSpecialUsers', {
        type: Sequelize.INTEGER,
        allowNull: true
      });
      
      // Remove fields from Products table
      await queryInterface.removeColumn('Products', 'isSpecial');
      await queryInterface.removeColumn('Products', 'maxSpecialUsers');
      
      // Remove fields from LoanProducts table
      await queryInterface.removeColumn('LoanProducts', 'needGuarantors');
      await queryInterface.removeColumn('LoanProducts', 'maxGuarantors');
      await queryInterface.removeColumn('LoanProducts', 'minGuarantors');
      
      console.log('✅ Rollback completed successfully');
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
};
