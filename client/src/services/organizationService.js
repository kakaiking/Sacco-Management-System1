import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001';
const CACHE_KEY = 'organizationInfo';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

class OrganizationService {
  /**
   * Get cached organization info
   * @param {string} saccoId - The sacco ID
   * @param {string} branchId - The branch ID
   * @returns {Object|null} Cached organization info or null
   */
  static getCachedOrganizationInfo(saccoId, branchId) {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const { data, timestamp, saccoId: cachedSaccoId, branchId: cachedBranchId } = JSON.parse(cached);
      
      // Check if cache is still valid and matches current IDs
      const isExpired = Date.now() - timestamp > CACHE_DURATION;
      const isMatching = cachedSaccoId === saccoId && cachedBranchId === branchId;
      
      if (isExpired || !isMatching) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error reading cached organization info:', error);
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
  }

  /**
   * Cache organization info
   * @param {string} saccoId - The sacco ID
   * @param {string} branchId - The branch ID
   * @param {Object} data - Organization data to cache
   */
  static cacheOrganizationInfo(saccoId, branchId, data) {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        saccoId,
        branchId
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error caching organization info:', error);
    }
  }

  /**
   * Get organization info from token payload (fastest option)
   * @param {Object} tokenPayload - Decoded JWT token payload
   * @returns {Object} Organization info from token
   */
  static getOrganizationInfoFromToken(tokenPayload) {
    return {
      sacco: { 
        saccoId: tokenPayload.saccoId || 'SYSTEM', 
        saccoName: tokenPayload.saccoName || tokenPayload.saccoId || 'System' 
      },
      branch: { 
        branchId: tokenPayload.branchId || '', 
        branchName: tokenPayload.branchName || tokenPayload.branchId || 'No Branch' 
      }
    };
  }
  /**
   * Fetch sacco name by saccoId
   * @param {string} saccoId - The sacco ID
   * @returns {Promise<{saccoId: string, saccoName: string}>}
   */
  static async getSaccoName(saccoId) {
    try {
      if (!saccoId || saccoId === 'SYSTEM') {
        return { saccoId: 'SYSTEM', saccoName: 'System' };
      }

      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/sacco/name/${saccoId}`, {
        headers: {
          accessToken: token,
        },
      });

      if (response.data.error) {
        console.error('Error fetching sacco name:', response.data.error);
        return { saccoId, saccoName: saccoId }; // Fallback to ID
      }

      return response.data.entity;
    } catch (error) {
      console.error('Error fetching sacco name:', error);
      return { saccoId, saccoName: saccoId }; // Fallback to ID
    }
  }

  /**
   * Fetch branch name by branchId
   * @param {string} branchId - The branch ID
   * @returns {Promise<{branchId: string, branchName: string}>}
   */
  static async getBranchName(branchId) {
    try {
      if (!branchId) {
        return { branchId: '', branchName: 'No Branch' };
      }

      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/branch/name/${branchId}`, {
        headers: {
          accessToken: token,
        },
      });

      if (response.data.error) {
        console.error('Error fetching branch name:', response.data.error);
        return { branchId, branchName: branchId }; // Fallback to ID
      }

      return response.data.entity;
    } catch (error) {
      console.error('Error fetching branch name:', error);
      return { branchId, branchName: branchId }; // Fallback to ID
    }
  }

  /**
   * Fetch both sacco and branch names with caching
   * @param {string} saccoId - The sacco ID
   * @param {string} branchId - The branch ID
   * @param {Object} tokenPayload - Optional token payload for immediate fallback
   * @returns {Promise<{sacco: {saccoId: string, saccoName: string}, branch: {branchId: string, branchName: string}}>}
   */
  static async getOrganizationInfo(saccoId, branchId, tokenPayload = null) {
    try {
      // First, try to get from cache
      const cached = this.getCachedOrganizationInfo(saccoId, branchId);
      if (cached) {
        console.log('Using cached organization info');
        return cached;
      }

      // If token payload is available, use it as immediate fallback
      if (tokenPayload) {
        const tokenInfo = this.getOrganizationInfoFromToken(tokenPayload);
        console.log('Using organization info from token');
        
        // Cache the token info and fetch fresh data in background
        this.cacheOrganizationInfo(saccoId, branchId, tokenInfo);
        this.fetchAndUpdateOrganizationInfo(saccoId, branchId);
        
        return tokenInfo;
      }

      // Fetch fresh data
      const [sacco, branch] = await Promise.all([
        this.getSaccoName(saccoId),
        this.getBranchName(branchId)
      ]);

      const orgInfo = { sacco, branch };
      
      // Cache the fresh data
      this.cacheOrganizationInfo(saccoId, branchId, orgInfo);
      
      return orgInfo;
    } catch (error) {
      console.error('Error fetching organization info:', error);
      
      // Return fallback data
      const fallback = {
        sacco: { saccoId, saccoName: saccoId || 'Unknown' },
        branch: { branchId, branchName: branchId || 'Unknown' }
      };
      
      // Cache fallback to avoid repeated failed requests
      this.cacheOrganizationInfo(saccoId, branchId, fallback);
      
      return fallback;
    }
  }

  /**
   * Fetch and update organization info in background (non-blocking)
   * @param {string} saccoId - The sacco ID
   * @param {string} branchId - The branch ID
   */
  static async fetchAndUpdateOrganizationInfo(saccoId, branchId) {
    try {
      const [sacco, branch] = await Promise.all([
        this.getSaccoName(saccoId),
        this.getBranchName(branchId)
      ]);

      const orgInfo = { sacco, branch };
      this.cacheOrganizationInfo(saccoId, branchId, orgInfo);
      console.log('Background organization info update completed');
    } catch (error) {
      console.error('Background organization info update failed:', error);
    }
  }
}

export default OrganizationService;

