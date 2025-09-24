import { useContext } from 'react';
import { AuthContext } from '../helpers/AuthContext';
import { canView, canAdd, canEdit, canDelete, canApprove } from '../helpers/PermissionUtils';

/**
 * Custom hook for checking user permissions
 * @returns {object} Permission checking functions
 */
export const usePermissions = () => {
  const { authState } = useContext(AuthContext);
  
  return {
    // Check if user can view a module
    canView: (module) => canView(authState.permissions, module),
    
    // Check if user can add to a module
    canAdd: (module) => canAdd(authState.permissions, module),
    
    // Check if user can edit in a module
    canEdit: (module) => canEdit(authState.permissions, module),
    
    // Check if user can delete in a module
    canDelete: (module) => canDelete(authState.permissions, module),
    
    // Check if user can approve in a module
    canApprove: (module) => canApprove(authState.permissions, module),
    
    // Get all user permissions
    permissions: authState.permissions,
    
    // Get user role
    role: authState.role,
  };
};
