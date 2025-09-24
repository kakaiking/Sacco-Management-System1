'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if columns already exist before adding them
    const tableDescription = await queryInterface.describeTable('Users');
    
    // Add userId if it doesn't exist
    if (!tableDescription.userId) {
      await queryInterface.addColumn('Users', 'userId', {
        type: Sequelize.STRING,
        allowNull: true,
      });

      // Generate userId for existing users
      const existingUsers = await queryInterface.sequelize.query(
        'SELECT id FROM Users WHERE userId IS NULL',
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );

      for (const user of existingUsers) {
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const userId = `USR-${randomNum}`;
        await queryInterface.sequelize.query(
          `UPDATE Users SET userId = '${userId}' WHERE id = ${user.id}`
        );
      }

      // Now make userId non-nullable
      await queryInterface.changeColumn('Users', 'userId', {
        type: Sequelize.STRING,
        allowNull: false,
      });

      // Add unique constraint
      await queryInterface.addIndex('Users', ['userId'], {
        unique: true,
        name: 'Users_userId_unique'
      });
    }

    // Add email if it doesn't exist
    if (!tableDescription.email) {
      await queryInterface.addColumn('Users', 'email', {
        type: Sequelize.STRING,
        allowNull: true,
      });

      // Populate default values for existing users
      await queryInterface.sequelize.query(
        `UPDATE Users SET email = 'user' + CAST(id AS VARCHAR) + '@example.com' WHERE email IS NULL`
      );

      // Make email non-nullable
      await queryInterface.changeColumn('Users', 'email', {
        type: Sequelize.STRING,
        allowNull: false,
      });

      // Add unique constraint
      await queryInterface.addIndex('Users', ['email'], {
        unique: true,
        name: 'Users_email_unique'
      });
    }

    // Add firstName if it doesn't exist
    if (!tableDescription.firstName) {
      await queryInterface.addColumn('Users', 'firstName', {
        type: Sequelize.STRING,
        allowNull: true,
      });

      // Populate default values
      await queryInterface.sequelize.query(
        `UPDATE Users SET firstName = 'User' WHERE firstName IS NULL`
      );

      // Make firstName non-nullable
      await queryInterface.changeColumn('Users', 'firstName', {
        type: Sequelize.STRING,
        allowNull: false,
      });
    }

    // Add lastName if it doesn't exist
    if (!tableDescription.lastName) {
      await queryInterface.addColumn('Users', 'lastName', {
        type: Sequelize.STRING,
        allowNull: true,
      });

      // Populate default values
      await queryInterface.sequelize.query(
        `UPDATE Users SET lastName = 'Name' WHERE lastName IS NULL`
      );

      // Make lastName non-nullable
      await queryInterface.changeColumn('Users', 'lastName', {
        type: Sequelize.STRING,
        allowNull: false,
      });
    }

    // Add other columns if they don't exist
    if (!tableDescription.phoneNumber) {
      await queryInterface.addColumn('Users', 'phoneNumber', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!tableDescription.role) {
      await queryInterface.addColumn('Users', 'role', {
        type: Sequelize.STRING,
        allowNull: true,
      });

      // Populate with default value
      await queryInterface.sequelize.query(
        `UPDATE Users SET role = 'User' WHERE role IS NULL`
      );

      // Make it non-nullable
      await queryInterface.changeColumn('Users', 'role', {
        type: Sequelize.STRING,
        allowNull: false,
      });
    }

    if (!tableDescription.status) {
      await queryInterface.addColumn('Users', 'status', {
        type: Sequelize.STRING,
        allowNull: true,
      });

      // Populate with default value
      await queryInterface.sequelize.query(
        `UPDATE Users SET status = 'Pending Password' WHERE status IS NULL`
      );

      // Make it non-nullable
      await queryInterface.changeColumn('Users', 'status', {
        type: Sequelize.STRING,
        allowNull: false,
      });
    }

    if (!tableDescription.passwordResetToken) {
      await queryInterface.addColumn('Users', 'passwordResetToken', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!tableDescription.passwordResetExpires) {
      await queryInterface.addColumn('Users', 'passwordResetExpires', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    if (!tableDescription.createdBy) {
      await queryInterface.addColumn('Users', 'createdBy', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!tableDescription.createdOn) {
      await queryInterface.addColumn('Users', 'createdOn', {
        type: Sequelize.DATE,
        allowNull: true,
      });

      // Populate with current date for existing users
      await queryInterface.sequelize.query(
        `UPDATE Users SET createdOn = GETDATE() WHERE createdOn IS NULL`
      );

      // Now make it non-nullable
      await queryInterface.changeColumn('Users', 'createdOn', {
        type: Sequelize.DATE,
        allowNull: false,
      });
    }

    if (!tableDescription.modifiedBy) {
      await queryInterface.addColumn('Users', 'modifiedBy', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!tableDescription.modifiedOn) {
      await queryInterface.addColumn('Users', 'modifiedOn', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    if (!tableDescription.approvedBy) {
      await queryInterface.addColumn('Users', 'approvedBy', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!tableDescription.approvedOn) {
      await queryInterface.addColumn('Users', 'approvedOn', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    if (!tableDescription.lockedBy) {
      await queryInterface.addColumn('Users', 'lockedBy', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!tableDescription.lockedOn) {
      await queryInterface.addColumn('Users', 'lockedOn', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    if (!tableDescription.lockRemarks) {
      await queryInterface.addColumn('Users', 'lockRemarks', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    // Make password nullable for pending password users
    if (tableDescription.password && !tableDescription.password.allowNull) {
      await queryInterface.changeColumn('Users', 'password', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes first
    try {
      await queryInterface.removeIndex('Users', 'Users_userId_unique');
    } catch (e) {
      // Index might not exist
    }
    
    try {
      await queryInterface.removeIndex('Users', 'Users_email_unique');
    } catch (e) {
      // Index might not exist
    }
    
    // Remove columns
    const tableDescription = await queryInterface.describeTable('Users');
    
    if (tableDescription.userId) {
      await queryInterface.removeColumn('Users', 'userId');
    }
    if (tableDescription.email) {
      await queryInterface.removeColumn('Users', 'email');
    }
    if (tableDescription.firstName) {
      await queryInterface.removeColumn('Users', 'firstName');
    }
    if (tableDescription.lastName) {
      await queryInterface.removeColumn('Users', 'lastName');
    }
    if (tableDescription.phoneNumber) {
      await queryInterface.removeColumn('Users', 'phoneNumber');
    }
    if (tableDescription.role) {
      await queryInterface.removeColumn('Users', 'role');
    }
    if (tableDescription.status) {
      await queryInterface.removeColumn('Users', 'status');
    }
    if (tableDescription.passwordResetToken) {
      await queryInterface.removeColumn('Users', 'passwordResetToken');
    }
    if (tableDescription.passwordResetExpires) {
      await queryInterface.removeColumn('Users', 'passwordResetExpires');
    }
    if (tableDescription.createdBy) {
      await queryInterface.removeColumn('Users', 'createdBy');
    }
    if (tableDescription.createdOn) {
      await queryInterface.removeColumn('Users', 'createdOn');
    }
    if (tableDescription.modifiedBy) {
      await queryInterface.removeColumn('Users', 'modifiedBy');
    }
    if (tableDescription.modifiedOn) {
      await queryInterface.removeColumn('Users', 'modifiedOn');
    }
    if (tableDescription.approvedBy) {
      await queryInterface.removeColumn('Users', 'approvedBy');
    }
    if (tableDescription.approvedOn) {
      await queryInterface.removeColumn('Users', 'approvedOn');
    }
    if (tableDescription.lockedBy) {
      await queryInterface.removeColumn('Users', 'lockedBy');
    }
    if (tableDescription.lockedOn) {
      await queryInterface.removeColumn('Users', 'lockedOn');
    }
    if (tableDescription.lockRemarks) {
      await queryInterface.removeColumn('Users', 'lockRemarks');
    }

    // Revert password to not null
    if (tableDescription.password) {
      await queryInterface.changeColumn('Users', 'password', {
        type: Sequelize.STRING,
        allowNull: false,
      });
    }
  }
};