import axios from 'axios';

class FrontendLoggingService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    this.logQueue = [];
    this.isProcessing = false;
  }

  /**
   * Log user interface interactions
   * @param {Object} params - Logging parameters
   * @param {string} params.action - Action type (NAVIGATE, CLICK, VIEW, CREATE, UPDATE, DELETE, etc.)
   * @param {string} params.entityType - Type of entity (Member, Product, User, etc.)
   * @param {string} params.entityId - ID of the entity (optional)
   * @param {string} params.entityName - Name of the entity (optional)
   * @param {string} params.details - Additional details about the action
   * @param {Object} params.beforeData - Data before the action (for updates)
   * @param {Object} params.afterData - Data after the action
   * @param {string} params.page - Current page/route
   * @param {string} params.component - Component where action occurred
   */
  async logUserAction({
    action,
    entityType = null,
    entityId = null,
    entityName = null,
    details = null,
    beforeData = null,
    afterData = null,
    page = null,
    component = null
  }) {
    try {
      // Get user info from localStorage or context
      const userInfo = this.getUserInfo();
      
      if (!userInfo || !userInfo.status) {
        console.log('No authenticated user - skipping log');
        return;
      }

      const logData = {
        action,
        entityType,
        entityId,
        entityName,
        details,
        beforeData,
        afterData,
        page: page || window.location.pathname,
        component,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      // Add to queue for batch processing
      this.logQueue.push(logData);
      
      // Process queue if not already processing
      if (!this.isProcessing) {
        this.processQueue();
      }

      console.log('📝 Frontend log queued:', logData);
    } catch (error) {
      console.error('Error logging user action:', error);
    }
  }

  /**
   * Process the log queue
   */
  async processQueue() {
    if (this.isProcessing || this.logQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.logQueue.length > 0) {
      const logData = this.logQueue.shift();
      
      try {
        await this.sendLogToServer(logData);
      } catch (error) {
        console.error('Error sending log to server:', error);
        // Re-queue the log for retry (with limit to prevent infinite loops)
        if (logData.retryCount < 3) {
          logData.retryCount = (logData.retryCount || 0) + 1;
          this.logQueue.unshift(logData);
        }
      }
    }

    this.isProcessing = false;
  }

  /**
   * Send log to server
   */
  async sendLogToServer(logData) {
    const userInfo = this.getUserInfo();
    
    const serverLogData = {
      saccoId: userInfo.saccoId || 'SYSTEM',
      action: logData.action,
      entityType: logData.entityType || 'UI_Interaction',
      entityId: logData.entityId,
      entityName: logData.entityName,
      user: {
        userId: userInfo.id,
        username: userInfo.username,
        role: userInfo.role
      },
      ipAddress: null, // Will be set by server
      userAgent: logData.userAgent,
      details: this.formatDetails(logData),
      beforeData: logData.beforeData,
      afterData: logData.afterData
    };

    await axios.post(`${this.baseURL}/api/logs/frontend`, serverLogData, {
      headers: {
        'accessToken': localStorage.getItem('accessToken')
      }
    });
  }

  /**
   * Format details for the log
   */
  formatDetails(logData) {
    let details = `${logData.action} action`;
    
    if (logData.entityType) {
      details += ` on ${logData.entityType}`;
    }
    
    if (logData.entityName) {
      details += `: ${logData.entityName}`;
    }
    
    if (logData.page) {
      details += ` (Page: ${logData.page})`;
    }
    
    if (logData.component) {
      details += ` (Component: ${logData.component})`;
    }
    
    if (logData.details) {
      details += ` - ${logData.details}`;
    }

    return details;
  }

  /**
   * Get user info from localStorage
   */
  getUserInfo() {
    try {
      const authState = localStorage.getItem('authState');
      return authState ? JSON.parse(authState) : null;
    } catch (error) {
      console.error('Error getting user info:', error);
      return null;
    }
  }

  // Convenience methods for common actions

  /**
   * Log navigation to a page
   */
  logNavigation(page, details = null) {
    return this.logUserAction({
      action: 'NAVIGATE',
      details: details || `Navigated to ${page}`,
      page,
      component: 'Router'
    });
  }

  /**
   * Log menu click
   */
  logMenuClick(menuItem, submenu = null) {
    return this.logUserAction({
      action: 'CLICK',
      entityType: 'Menu',
      entityName: submenu ? `${menuItem} > ${submenu}` : menuItem,
      details: `Clicked menu item: ${submenu ? `${menuItem} > ${submenu}` : menuItem}`,
      component: 'Sidebar'
    });
  }

  /**
   * Log button click
   */
  logButtonClick(buttonName, entityType = null, entityId = null, details = null) {
    return this.logUserAction({
      action: 'CLICK',
      entityType: entityType || 'Button',
      entityId,
      entityName: buttonName,
      details: details || `Clicked button: ${buttonName}`,
      component: 'Button'
    });
  }

  /**
   * Log view action
   */
  logView(entityType, entityId = null, entityName = null, details = null) {
    return this.logUserAction({
      action: 'VIEW',
      entityType,
      entityId,
      entityName,
      details: details || `Viewed ${entityType}${entityName ? `: ${entityName}` : ''}`,
      component: 'View'
    });
  }

  /**
   * Log create action
   */
  logCreate(entityType, entityId = null, entityName = null, afterData = null, details = null) {
    return this.logUserAction({
      action: 'CREATE',
      entityType,
      entityId,
      entityName,
      afterData,
      details: details || `Created ${entityType}${entityName ? `: ${entityName}` : ''}`,
      component: 'Form'
    });
  }

  /**
   * Log update action with before/after data
   */
  logUpdate(entityType, entityId, entityName, beforeData, afterData, details = null) {
    return this.logUserAction({
      action: 'UPDATE',
      entityType,
      entityId,
      entityName,
      beforeData,
      afterData,
      details: details || `Updated ${entityType}: ${entityName}`,
      component: 'Form'
    });
  }

  /**
   * Log delete action
   */
  logDelete(entityType, entityId, entityName, beforeData = null, details = null) {
    return this.logUserAction({
      action: 'DELETE',
      entityType,
      entityId,
      entityName,
      beforeData,
      details: details || `Deleted ${entityType}: ${entityName}`,
      component: 'Delete'
    });
  }

  /**
   * Log form submission
   */
  logFormSubmit(formName, entityType = null, entityId = null, details = null) {
    return this.logUserAction({
      action: 'FORM_SUBMIT',
      entityType: entityType || 'Form',
      entityId,
      entityName: formName,
      details: details || `Submitted form: ${formName}`,
      component: 'Form'
    });
  }

  /**
   * Log search action
   */
  logSearch(searchTerm, entityType = null, resultsCount = null, details = null) {
    return this.logUserAction({
      action: 'SEARCH',
      entityType: entityType || 'Search',
      details: details || `Searched for "${searchTerm}"${resultsCount ? ` (${resultsCount} results)` : ''}`,
      component: 'Search'
    });
  }

  /**
   * Log filter action
   */
  logFilter(filterType, filterValue, entityType = null, details = null) {
    return this.logUserAction({
      action: 'FILTER',
      entityType: entityType || 'Filter',
      details: details || `Applied filter: ${filterType} = ${filterValue}`,
      component: 'Filter'
    });
  }
}

// Create and export a singleton instance
const frontendLoggingService = new FrontendLoggingService();
export default frontendLoggingService;
