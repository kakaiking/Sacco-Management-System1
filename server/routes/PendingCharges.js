const express = require("express");
const router = express.Router();
const pendingChargesService = require("../services/pendingChargesService");
const { validateToken } = require("../middlewares/AuthMiddleware");
const { logViewOperation, logCreateOperation, logUpdateOperation } = require("../middlewares/LoggingMiddleware");

// Helper function to respond
const respond = (res, code, message, entity) => {
  res.status(code).json({ code, message, entity });
};

// Get pending charges for a member
router.get("/member/:memberId", validateToken, logViewOperation("PendingCharge"), async (req, res) => {
  try {
    const { memberId } = req.params;
    
    const pendingCharges = await pendingChargesService.getMemberPendingCharges(memberId);
    
    respond(res, 200, "Pending charges fetched successfully", pendingCharges);
  } catch (error) {
    console.error("Error fetching pending charges:", error);
    respond(res, 500, `Internal server error: ${error.message}`, null);
  }
});

// Create a pending charge
router.post("/", validateToken, logCreateOperation("PendingCharge"), async (req, res) => {
  try {
    const data = req.body;
    const username = req.user?.username || 'SYSTEM';
    
    // Validate required fields
    if (!data.memberId || !data.accountId || !data.chargeId || !data.amount) {
      return respond(res, 400, "Missing required fields: memberId, accountId, chargeId, amount", null);
    }
    
    const pendingCharge = await pendingChargesService.createPendingCharge(data, username);
    
    respond(res, 201, "Pending charge created successfully", pendingCharge);
  } catch (error) {
    console.error("Error creating pending charge:", error);
    respond(res, 500, `Internal server error: ${error.message}`, null);
  }
});

// Process a single pending charge
router.post("/:id/process", validateToken, logUpdateOperation("PendingCharge"), async (req, res) => {
  try {
    const { id } = req.params;
    const username = req.user?.username || 'SYSTEM';
    
    const result = await pendingChargesService.processPendingCharge(id, username);
    
    respond(res, 200, "Pending charge processed successfully", result);
  } catch (error) {
    console.error("Error processing pending charge:", error);
    respond(res, 500, `Internal server error: ${error.message}`, null);
  }
});

// Process all pending charges for a member
router.post("/member/:memberId/process-all", validateToken, logUpdateOperation("PendingCharge"), async (req, res) => {
  try {
    const { memberId } = req.params;
    const username = req.user?.username || 'SYSTEM';
    
    const result = await pendingChargesService.processMemberPendingCharges(memberId, username);
    
    respond(res, 200, "Member pending charges processed", result);
  } catch (error) {
    console.error("Error processing member pending charges:", error);
    respond(res, 500, `Internal server error: ${error.message}`, null);
  }
});

// Cancel a pending charge
router.post("/:id/cancel", validateToken, logUpdateOperation("PendingCharge"), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const username = req.user?.username || 'SYSTEM';
    
    const pendingCharge = await pendingChargesService.cancelPendingCharge(id, username, reason);
    
    respond(res, 200, "Pending charge cancelled successfully", pendingCharge);
  } catch (error) {
    console.error("Error cancelling pending charge:", error);
    respond(res, 500, `Internal server error: ${error.message}`, null);
  }
});

// Get all pending charges (admin view)
router.get("/", validateToken, logViewOperation("PendingCharge"), async (req, res) => {
  try {
    const { status, memberId } = req.query;
    
    const whereClause = { isDeleted: 0 };
    if (status) whereClause.status = status;
    if (memberId) whereClause.memberId = memberId;
    
    const { PendingCharges, Members, Accounts, Charges } = require("../models");
    
    const pendingCharges = await PendingCharges.findAll({
      where: whereClause,
      include: [
        { model: Members, as: 'member' },
        { model: Accounts, as: 'account' },
        { model: Charges, as: 'charge' }
      ],
      order: [['createdOn', 'DESC']]
    });
    
    respond(res, 200, "Pending charges fetched successfully", pendingCharges);
  } catch (error) {
    console.error("Error fetching pending charges:", error);
    respond(res, 500, `Internal server error: ${error.message}`, null);
  }
});

module.exports = router;
