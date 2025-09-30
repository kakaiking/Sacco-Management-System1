const { PendingCharges, Members, Accounts, Charges, Transactions } = require('../models');
const { generateTransactionId } = require('../helpers/transactionHelpers');

class PendingChargesService {
  constructor() {
    this.log = (message) => console.log(`[PendingChargesService] ${message}`);
  }

  // Create a pending charge for a member
  async createPendingCharge(data, username = 'SYSTEM') {
    try {
      this.log(`Creating pending charge for member ${data.memberId}`);
      
      const pendingCharge = await PendingCharges.create({
        chargeId: data.chargeId,
        memberId: data.memberId,
        accountId: data.accountId,
        amount: data.amount,
        currency: data.currency || 'KES',
        chargeType: data.chargeType,
        description: data.description,
        dueDate: data.dueDate,
        createdBy: username,
        createdOn: new Date()
      });

      this.log(`Created pending charge ${pendingCharge.id}`);
      return pendingCharge;
    } catch (error) {
      this.log(`Error creating pending charge: ${error.message}`);
      throw error;
    }
  }

  // Process a single pending charge
  async processPendingCharge(pendingChargeId, username = 'SYSTEM') {
    const sequelize = require('../models').sequelize;
    const transaction = await sequelize.transaction();

    try {
      this.log(`Processing pending charge ${pendingChargeId}`);

      // Get the pending charge with related data
      const pendingCharge = await PendingCharges.findByPk(pendingChargeId, {
        include: [
          { model: Members, as: 'member' },
          { model: Accounts, as: 'account' },
          { model: Charges, as: 'charge' }
        ],
        transaction
      });

      if (!pendingCharge) {
        throw new Error('Pending charge not found');
      }

      if (pendingCharge.status !== 'PENDING') {
        throw new Error(`Cannot process charge with status: ${pendingCharge.status}`);
      }

      // Check if account has sufficient balance
      if (pendingCharge.account.availableBalance < pendingCharge.amount) {
        throw new Error(`Insufficient balance. Required: ${pendingCharge.amount}, Available: ${pendingCharge.account.availableBalance}`);
      }

      // Create transaction record
      const transactionId = generateTransactionId();
      const transactionRecord = await Transactions.create({
        transactionId,
        accountId: pendingCharge.accountId,
        memberId: pendingCharge.memberId,
        type: 'CHARGE',
        amount: pendingCharge.amount,
        balance: pendingCharge.account.availableBalance - pendingCharge.amount,
        narration: `Charge: ${pendingCharge.description || pendingCharge.charge?.name || 'Unknown'}`,
        referenceNumber: `CHG-${pendingChargeId}`,
        createdBy: username,
        createdOn: new Date()
      }, { transaction });

      // Update account balance
      await pendingCharge.account.update({
        availableBalance: pendingCharge.account.availableBalance - pendingCharge.amount,
        clearBalance: pendingCharge.account.clearBalance - pendingCharge.amount,
        debitBalance: pendingCharge.account.debitBalance + pendingCharge.amount,
        modifiedOn: new Date(),
        modifiedBy: username
      }, { transaction });

      // Update pending charge status
      await pendingCharge.update({
        status: 'PROCESSED',
        processedOn: new Date(),
        processedBy: username,
        remarks: `Processed successfully. Transaction ID: ${transactionId}`
      }, { transaction });

      await transaction.commit();

      this.log(`Successfully processed pending charge ${pendingChargeId}`);
      return {
        success: true,
        pendingCharge,
        transaction: transactionRecord,
        message: 'Charge processed successfully'
      };

    } catch (error) {
      await transaction.rollback();
      this.log(`Error processing pending charge ${pendingChargeId}: ${error.message}`);
      
      // Update pending charge status to failed
      try {
        await PendingCharges.update({
          status: 'FAILED',
          processedOn: new Date(),
          processedBy: username,
          remarks: `Processing failed: ${error.message}`
        }, {
          where: { id: pendingChargeId },
          transaction
        });
      } catch (updateError) {
        this.log(`Error updating pending charge status: ${updateError.message}`);
      }

      throw error;
    }
  }

  // Process all pending charges for a member
  async processMemberPendingCharges(memberId, username = 'SYSTEM') {
    try {
      this.log(`Processing all pending charges for member ${memberId}`);

      const pendingCharges = await PendingCharges.findAll({
        where: {
          memberId,
          status: 'PENDING',
          isDeleted: 0
        },
        include: [
          { model: Members, as: 'member' },
          { model: Accounts, as: 'account' },
          { model: Charges, as: 'charge' }
        ],
        order: [['createdOn', 'ASC']]
      });

      this.log(`Found ${pendingCharges.length} pending charges for member ${memberId}`);

      const results = [];
      let successCount = 0;
      let failureCount = 0;

      for (const pendingCharge of pendingCharges) {
        try {
          const result = await this.processPendingCharge(pendingCharge.id, username);
          results.push({
            pendingChargeId: pendingCharge.id,
            status: 'SUCCESS',
            message: result.message,
            transactionId: result.transaction.transactionId
          });
          successCount++;
        } catch (error) {
          results.push({
            pendingChargeId: pendingCharge.id,
            status: 'FAILED',
            message: error.message
          });
          failureCount++;
        }
      }

      this.log(`Processed ${successCount} charges successfully, ${failureCount} failed`);
      return {
        totalCharges: pendingCharges.length,
        successCount,
        failureCount,
        results
      };

    } catch (error) {
      this.log(`Error processing member pending charges: ${error.message}`);
      throw error;
    }
  }

  // Get pending charges for a member
  async getMemberPendingCharges(memberId) {
    try {
      const pendingCharges = await PendingCharges.findAll({
        where: {
          memberId,
          isDeleted: 0
        },
        include: [
          { model: Members, as: 'member' },
          { model: Accounts, as: 'account' },
          { model: Charges, as: 'charge' }
        ],
        order: [['createdOn', 'DESC']]
      });

      return pendingCharges;
    } catch (error) {
      this.log(`Error getting member pending charges: ${error.message}`);
      throw error;
    }
  }

  // Cancel a pending charge
  async cancelPendingCharge(pendingChargeId, username = 'SYSTEM', reason = 'Cancelled by user') {
    try {
      this.log(`Cancelling pending charge ${pendingChargeId}`);

      const pendingCharge = await PendingCharges.findByPk(pendingChargeId);
      if (!pendingCharge) {
        throw new Error('Pending charge not found');
      }

      if (pendingCharge.status !== 'PENDING') {
        throw new Error(`Cannot cancel charge with status: ${pendingCharge.status}`);
      }

      await pendingCharge.update({
        status: 'CANCELLED',
        processedOn: new Date(),
        processedBy: username,
        remarks: reason
      });

      this.log(`Successfully cancelled pending charge ${pendingChargeId}`);
      return pendingCharge;
    } catch (error) {
      this.log(`Error cancelling pending charge: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new PendingChargesService();
