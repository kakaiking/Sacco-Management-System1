const { Logs } = require('../models');

class LoggingService {
  /**
   * Log an action with before/after data tracking
   * @param {Object} params - Logging parameters
   * @param {string} params.saccoId - Sacco ID
   * @param {string} params.action - Action type (CREATE, UPDATE, DELETE, VIEW, LOGIN, LOGOUT, APPROVE, REJECT, LOCK, UNLOCK)
   * @param {string} params.entityType - Type of entity (Sacco, Member, Product, etc.)
   * @param {string} params.entityId - ID of the entity
   * @param {string} params.entityName - Name of the entity
   * @param {Object} params.user - User information
   * @param {string} params.user.userId - User ID
   * @param {string} params.user.username - Username
   * @param {string} params.user.role - User role
   * @param {string} params.ipAddress - IP address
   * @param {string} params.userAgent - User agent string
   * @param {string} params.details - Additional details
   * @param {Object} params.beforeData - Data before the action (for updates)
   * @param {Object} params.afterData - Data after the action
   */
  static async logAction({
    saccoId,
    action,
    entityType,
    entityId = null,
    entityName = null,
    user,
    ipAddress = null,
    userAgent = null,
    details = null,
    beforeData = null,
    afterData = null
  }) {
    try {
      const logId = `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      // Calculate changes for UPDATE actions
      let changes = null;
      if (action === 'UPDATE' && beforeData && afterData) {
        changes = this.calculateChanges(beforeData, afterData);
      }

      const logEntry = {
        logId,
        saccoId,
        action,
        entityType,
        entityId,
        entityName,
        userId: user.userId,
        username: user.username,
        userRole: user.role,
        ipAddress,
        userAgent,
        details,
        beforeData: beforeData ? JSON.stringify(beforeData) : null,
        afterData: afterData ? JSON.stringify(afterData) : null,
        changes: changes ? JSON.stringify(changes) : null,
        timestamp: new Date()
      };

      await Logs.create(logEntry);
      return logEntry;
    } catch (error) {
      console.error('Error logging action:', error);
      // Don't throw error to prevent breaking the main operation
    }
  }

  /**
   * Calculate changes between before and after data
   * @param {Object} beforeData - Data before the change
   * @param {Object} afterData - Data after the change
   * @returns {Object} Object containing the changes
   */
  static calculateChanges(beforeData, afterData) {
    const changes = {};
    
    // Get all unique keys from both objects
    const allKeys = new Set([...Object.keys(beforeData || {}), ...Object.keys(afterData || {})]);
    
    for (const key of allKeys) {
      const beforeValue = beforeData?.[key];
      const afterValue = afterData?.[key];
      
      // Skip if values are the same
      if (JSON.stringify(beforeValue) === JSON.stringify(afterValue)) {
        continue;
      }
      
      changes[key] = {
        before: beforeValue,
        after: afterValue
      };
    }
    
    return Object.keys(changes).length > 0 ? changes : null;
  }

  /**
   * Get logs for a specific sacco with filtering
   * @param {string} saccoId - Sacco ID
   * @param {Object} filters - Filter options
   * @returns {Array} Array of log entries
   */
  static async getLogs(saccoId, filters = {}) {
    try {
      const whereClause = { saccoId };
      
      // Apply filters
      if (filters.action) {
        whereClause.action = filters.action;
      }
      
      if (filters.entityType) {
        whereClause.entityType = filters.entityType;
      }
      
      if (filters.userId) {
        whereClause.userId = filters.userId;
      }
      
      if (filters.startDate && filters.endDate) {
        whereClause.timestamp = {
          [require('sequelize').Op.between]: [filters.startDate, filters.endDate]
        };
      }

      const logs = await Logs.findAll({
        where: whereClause,
        order: [['timestamp', 'DESC']],
        limit: filters.limit || 1000,
        offset: filters.offset || 0
      });

      // Parse JSON strings back to objects
      const parsedLogs = logs.map(log => ({
        ...log.toJSON(),
        beforeData: log.beforeData ? JSON.parse(log.beforeData) : null,
        afterData: log.afterData ? JSON.parse(log.afterData) : null,
        changes: log.changes ? JSON.parse(log.changes) : null
      }));

      // Apply search filter if provided
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        return parsedLogs.filter(log => 
          log.entityType.toLowerCase().includes(searchTerm) ||
          log.entityName?.toLowerCase().includes(searchTerm) ||
          log.username.toLowerCase().includes(searchTerm) ||
          log.details?.toLowerCase().includes(searchTerm)
        );
      }

      return parsedLogs;
    } catch (error) {
      console.error('Error fetching logs:', error);
      throw error;
    }
  }

  /**
   * Get log statistics for a sacco
   * @param {string} saccoId - Sacco ID
   * @returns {Object} Statistics object
   */
  static async getLogStatistics(saccoId) {
    try {
      const { Sequelize } = require('sequelize');
      
      const stats = await Logs.findAll({
        where: { saccoId },
        attributes: [
          'action',
          [Sequelize.fn('COUNT', Sequelize.col('action')), 'count']
        ],
        group: ['action'],
        raw: true
      });

      const statistics = {
        total: 0,
        byAction: {}
      };

      stats.forEach(stat => {
        statistics.byAction[stat.action] = parseInt(stat.count);
        statistics.total += parseInt(stat.count);
      });

      return statistics;
    } catch (error) {
      console.error('Error fetching log statistics:', error);
      throw error;
    }
  }

  /**
   * Clean up old logs (older than specified days)
   * @param {number} daysToKeep - Number of days to keep logs
   */
  static async cleanupOldLogs(daysToKeep = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const deletedCount = await Logs.destroy({
        where: {
          timestamp: {
            [require('sequelize').Op.lt]: cutoffDate
          }
        }
      });

      console.log(`Cleaned up ${deletedCount} old log entries`);
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up old logs:', error);
      throw error;
    }
  }
}

module.exports = LoggingService;
