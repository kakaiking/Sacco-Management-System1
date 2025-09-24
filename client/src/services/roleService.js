import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001';

/**
 * Fetch role permissions by role name
 * @param {string} roleName - The role name to fetch permissions for
 * @returns {Promise<object>} Role permissions object
 */
export const fetchRolePermissions = async (roleName) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/roles`, {
      headers: {
        accessToken: localStorage.getItem("accessToken")
      }
    });
    
    const roles = response.data.entity || response.data;
    const role = roles.find(r => r.roleName === roleName || r.roleId === roleName);
    
    if (role) {
      return role.permissions || {};
    }
    
    return {};
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    return {};
  }
};

/**
 * Fetch all roles
 * @returns {Promise<array>} Array of roles
 */
export const fetchAllRoles = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/roles`, {
      headers: {
        accessToken: localStorage.getItem("accessToken")
      }
    });
    
    return response.data.entity || response.data;
  } catch (error) {
    console.error('Error fetching roles:', error);
    return [];
  }
};
