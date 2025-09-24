const LoggingService = require('../services/loggingService');

/**
 * Middleware to log API requests
 * @param {string} action - Action type (CREATE, UPDATE, DELETE, VIEW, etc.)
 * @param {string} entityType - Type of entity being operated on
 * @param {Function} getEntityInfo - Function to extract entity info from request/response
 */
const createLoggingMiddleware = (action, entityType, getEntityInfo = null) => {
  return async (req, res, next) => {
    console.log(`🔍 LOGGING MIDDLEWARE: ${action} ${entityType} - ${req.method} ${req.path}`);
    
    const originalSend = res.send;
    let responseData = null;

    // Capture response data
    res.send = function(data) {
      responseData = data;
      return originalSend.call(this, data);
    };

    // Execute the original route handler
    await next();

    // Log the action after the response is sent
    try {
      console.log(`🔍 Processing ${action} log for ${entityType}`);
      console.log(`🔍 Response status: ${res.statusCode}`);
      console.log(`🔍 Response data:`, responseData);
      
      const user = req.user || req.authUser; // Handle different auth patterns
      console.log(`🔍 User info:`, user);
      
      if (!user) {
        console.log(`❌ No user info - skipping log`);
        return; // Skip logging if no user info
      }

      let entityId = null;
      let entityName = null;
      let beforeData = null;
      let afterData = null;

      // Extract entity information if getEntityInfo function is provided
      if (getEntityInfo) {
        const entityInfo = getEntityInfo(req, responseData);
        entityId = entityInfo?.entityId;
        entityName = entityInfo?.entityName;
        beforeData = entityInfo?.beforeData;
        afterData = entityInfo?.afterData;
      }

      // Get saccoId from user or request
      const saccoId = user.saccoId || req.body?.saccoId || req.params?.saccoId || 'SYSTEM';

      // Get client information
      const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
      const userAgent = req.headers['user-agent'];

      // Create details based on action and response
      let details = `${action} operation on ${entityType}`;
      if (entityName) {
        details += `: ${entityName}`;
      }

      // Add response status to details
      if (res.statusCode >= 200 && res.statusCode < 300) {
        details += ' - Success';
      } else {
        details += ` - Failed (${res.statusCode})`;
      }

      console.log(`🔍 About to log action:`, {
        saccoId,
        action,
        entityType,
        entityId,
        entityName,
        user: user.username
      });
      
      await LoggingService.logAction({
        saccoId,
        action,
        entityType,
        entityId,
        entityName,
        user: {
          userId: user.userId || user.id,
          username: user.username,
          role: user.role
        },
        ipAddress,
        userAgent,
        details,
        beforeData,
        afterData
      });
      
      console.log(`✅ Successfully logged ${action} for ${entityType}`);
    } catch (error) {
      console.error('Error in logging middleware:', error);
      // Don't throw error to prevent breaking the main operation
    }
  };
};

/**
 * Middleware to log authentication events
 */
const logAuthEvent = async (req, res, next) => {
  console.log(`🔍 AUTH LOGGING MIDDLEWARE: ${req.method} ${req.path}`);
  
  const originalSend = res.send;
  let responseData = null;

  res.send = function(data) {
    responseData = data;
    return originalSend.call(this, data);
  };

  await next();

  try {
    console.log(`🔍 Processing auth event logging...`);
    console.log(`🔍 Response status: ${res.statusCode}`);
    console.log(`🔍 Response data:`, responseData);
    
    const action = req.path.includes('login') ? 'LOGIN' : 'LOGOUT';
    const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    const userAgent = req.headers['user-agent'];

    let details = `${action} attempt`;
    let user = null;
    let saccoId = 'SYSTEM';

    if (res.statusCode >= 200 && res.statusCode < 300) {
      details += ' - Success';
      
      // For successful login, extract user info from response
      if (action === 'LOGIN' && responseData) {
        try {
          const data = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
          if (data.username && data.id) {
            user = {
              userId: data.id,
              username: data.username,
              role: data.role || 'User'
            };
            saccoId = data.saccoId || 'SYSTEM';
          }
        } catch (e) {
          console.error('Error parsing login response:', e);
        }
      }
    } else {
      details += ' - Failed';
      // For failed login, try to get username from request body
      if (req.body && req.body.username) {
        user = {
          userId: 'UNKNOWN',
          username: req.body.username,
          role: 'Unknown'
        };
      }
    }

    // Only log if we have user information
    if (user) {
      console.log(`🔍 Logging auth event:`, { action, user, saccoId });
      await LoggingService.logAction({
        saccoId,
        action,
        entityType: 'User',
        entityId: user.userId,
        entityName: user.username,
        user: {
          userId: user.userId,
          username: user.username,
          role: user.role
        },
        ipAddress,
        userAgent,
        details
      });
      console.log(`✅ Auth event logged successfully`);
    } else {
      console.log(`❌ No user information available for auth logging`);
    }
  } catch (error) {
    console.error('Error logging auth event:', error);
  }
};

/**
 * Middleware to log view operations
 */
const logViewOperation = (entityType) => {
  return createLoggingMiddleware('VIEW', entityType, (req, responseData) => {
    const entityId = req.params.id || req.params.userId || req.params.saccoId;
    let entityName = null;

    // Try to extract entity name from response data
    if (responseData) {
      try {
        const data = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
        if (data.entity && data.entity.name) {
          entityName = data.entity.name;
        } else if (data.name) {
          entityName = data.name;
        } else if (data.username) {
          entityName = data.username;
        }
      } catch (e) {
        // Ignore JSON parsing errors
      }
    }

    return { entityId, entityName };
  });
};

/**
 * Middleware to log create operations
 */
const logCreateOperation = (entityType) => {
  return createLoggingMiddleware('CREATE', entityType, (req, responseData) => {
    const entityId = req.body.id || req.body.userId || req.body.saccoId || req.body.memberId || req.body.productId || req.body.currencyId || req.body.branchId || req.body.chargeId || req.body.roleId;
    
    // Try to extract entity name from various possible fields
    const entityName = req.body.name || req.body.username || req.body.productName || 
                      req.body.saccoName || req.body.branchName || req.body.roleName ||
                      req.body.firstName + ' ' + req.body.lastName || req.body.currencyName ||
                      req.body.memberName || req.body.accountName;
    
    let afterData = null;
    if (responseData) {
      try {
        const data = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
        afterData = data.entity || data;
      } catch (e) {
        // Ignore JSON parsing errors
      }
    }

    return { entityId, entityName, afterData };
  });
};

/**
 * Middleware to log update operations
 */
const logUpdateOperation = (entityType) => {
  return createLoggingMiddleware('UPDATE', entityType, (req, responseData) => {
    const entityId = req.params.id || req.params.userId || req.params.saccoId || req.params.memberId || req.params.productId || req.params.currencyId || req.params.branchId || req.params.chargeId || req.params.roleId;
    
    // Try to extract entity name from various possible fields
    const entityName = req.body.name || req.body.username || req.body.productName || 
                      req.body.saccoName || req.body.branchName || req.body.roleName ||
                      req.body.firstName + ' ' + req.body.lastName || req.body.currencyName ||
                      req.body.memberName || req.body.accountName;
    
    let afterData = null;
    if (responseData) {
      try {
        const data = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
        afterData = data.entity || data;
      } catch (e) {
        // Ignore JSON parsing errors
      }
    }

    return { entityId, entityName, afterData };
  });
};

/**
 * Middleware to log delete operations
 */
const logDeleteOperation = (entityType) => {
  return createLoggingMiddleware('DELETE', entityType, (req, responseData) => {
    const entityId = req.params.id || req.params.userId || req.params.saccoId;
    
    let beforeData = null;
    if (responseData) {
      try {
        const data = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
        beforeData = data.entity || data;
      } catch (e) {
        // Ignore JSON parsing errors
      }
    }

    return { entityId, beforeData };
  });
};

module.exports = {
  createLoggingMiddleware,
  logAuthEvent,
  logViewOperation,
  logCreateOperation,
  logUpdateOperation,
  logDeleteOperation
};
