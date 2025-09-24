const express = require("express");
const router = express.Router();
const { validateToken } = require("../middlewares/AuthMiddleware");
const LoggingService = require("../services/loggingService");

// Get all logs for the current sacco
router.get("/", validateToken, async (req, res) => {
  try {
    const { action, q, page = 1, limit = 50 } = req.query;
    const saccoId = req.user?.saccoId || 'SYSTEM';
    
    const filters = {
      action,
      search: q,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    };

    const logs = await LoggingService.getLogs(saccoId, filters);
    
    // Convert logs to the format expected by the frontend
    const formattedLogs = logs.map(log => ({
      id: log.id,
      logId: log.logId,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      entityName: log.entityName,
      userId: log.userId,
      username: log.username,
      userRole: log.userRole,
      timestamp: log.timestamp,
      details: log.details,
      ipAddress: log.ipAddress,
      beforeData: log.beforeData,
      afterData: log.afterData,
      changes: log.changes
    }));

    res.json({ entity: formattedLogs });
  } catch (error) {
    console.error("Error fetching logs:", error);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

// Get log statistics
router.get("/statistics", validateToken, async (req, res) => {
  try {
    const saccoId = req.user?.saccoId || 'SYSTEM';
    const statistics = await LoggingService.getLogStatistics(saccoId);
    res.json({ statistics });
  } catch (error) {
    console.error("Error fetching log statistics:", error);
    res.status(500).json({ error: "Failed to fetch log statistics" });
  }
});

// Frontend logging endpoint
router.post("/frontend", validateToken, async (req, res) => {
  try {
    const {
      saccoId,
      action,
      entityType,
      entityId,
      entityName,
      user,
      ipAddress,
      userAgent,
      details,
      beforeData,
      afterData
    } = req.body;

    // Get IP address from request if not provided
    const clientIP = ipAddress || req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];

    await LoggingService.logAction({
      saccoId: saccoId || req.user?.saccoId || 'SYSTEM',
      action,
      entityType,
      entityId,
      entityName,
      user: user || {
        userId: req.user?.id || req.user?.userId,
        username: req.user?.username,
        role: req.user?.role
      },
      ipAddress: clientIP,
      userAgent,
      details,
      beforeData,
      afterData
    });

    res.json({ success: true, message: 'Frontend log recorded successfully' });
  } catch (error) {
    console.error("Error recording frontend log:", error);
    res.status(500).json({ error: "Failed to record frontend log" });
  }
});

module.exports = router;
