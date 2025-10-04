'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if table already exists
    const tables = await queryInterface.showAllTables();
    const tableExists = tables.includes('MaritalStatus') || tables.includes('maritalstatus');
    
    if (!tableExists) {
      await queryInterface.createTable('MaritalStatus', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        maritalStatusId: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true
        },
        maritalStatusName: {
          type: Sequelize.STRING,
          allowNull: false
        },
        maritalStatusCode: {
          type: Sequelize.STRING(2),
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
        await queryInterface.addIndex('MaritalStatus', ['saccoId'], {
          name: 'marital_status_sacco_id'
        });
      } catch (err) {
        console.log('Index marital_status_sacco_id already exists or could not be created');
      }
      
      try {
        await queryInterface.addIndex('MaritalStatus', ['maritalStatusCode'], {
          name: 'marital_status_code'
        });
      } catch (err) {
        console.log('Index marital_status_code already exists or could not be created');
      }
      
      try {
        await queryInterface.addIndex('MaritalStatus', ['maritalStatusName'], {
          name: 'marital_status_name'
        });
      } catch (err) {
        console.log('Index marital_status_name already exists or could not be created');
      }
    } else {
      console.log('MaritalStatus table already exists, skipping creation');
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tables = await queryInterface.showAllTables();
    const tableExists = tables.includes('MaritalStatus') || tables.includes('maritalstatus');
    
    if (tableExists) {
      await queryInterface.dropTable('MaritalStatus');
    }
  }
};
