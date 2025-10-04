'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if table already exists
    const tables = await queryInterface.showAllTables();
    const tableExists = tables.includes('Nationality') || tables.includes('nationality');
    
    if (!tableExists) {
      await queryInterface.createTable('Nationality', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        nationalityId: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true
        },
        nationalityName: {
          type: Sequelize.STRING,
          allowNull: false
        },
        isoCode: {
          type: Sequelize.STRING(2),
          allowNull: true
        },
        countryCode: {
          type: Sequelize.STRING(3),
          allowNull: true
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        saccoId: {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'SYSTEM'
        },
        status: {
          type: Sequelize.ENUM('Active', 'Inactive'),
          allowNull: false,
          defaultValue: 'Active'
        },
        createdOn: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        },
        createdBy: {
          type: Sequelize.STRING,
          allowNull: true
        },
        modifiedOn: {
          type: Sequelize.DATE,
          allowNull: true
        },
        modifiedBy: {
          type: Sequelize.STRING,
          allowNull: true
        },
        approvedBy: {
          type: Sequelize.STRING,
          allowNull: true
        },
        approvedOn: {
          type: Sequelize.DATE,
          allowNull: true
        },
        isDeleted: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        }
      });

      // Add indexes only if table was just created
      try {
        await queryInterface.addIndex('Nationality', ['saccoId'], {
          name: 'nationality_sacco_id'
        });
      } catch (err) {
        console.log('Index nationality_sacco_id already exists or could not be created');
      }
      
      try {
        await queryInterface.addIndex('Nationality', ['isoCode'], {
          name: 'nationality_iso_code'
        });
      } catch (err) {
        console.log('Index nationality_iso_code already exists or could not be created');
      }
      
      try {
        await queryInterface.addIndex('Nationality', ['countryCode'], {
          name: 'nationality_country_code'
        });
      } catch (err) {
        console.log('Index nationality_country_code already exists or could not be created');
      }
    } else {
      console.log('Nationality table already exists, skipping creation');
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tables = await queryInterface.showAllTables();
    const tableExists = tables.includes('Nationality') || tables.includes('nationality');
    
    if (tableExists) {
      await queryInterface.dropTable('Nationality');
    }
  }
};
