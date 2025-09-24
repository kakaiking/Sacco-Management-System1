import React, { useState, useEffect } from 'react';
import { FiX, FiCheck, FiSearch } from 'react-icons/fi';
import axios from 'axios';

function RoleLookupModal({ isOpen, onClose, onSelectRole }) {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);

  // Fetch roles when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchRoles();
    }
  }, [isOpen]);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3001/roles', {
        headers: { accessToken: localStorage.getItem('accessToken') }
      });
      setRoles(response.data.entity || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter roles based on search term
  const filteredRoles = roles.filter(role =>
    role.roleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
  };

  const handleConfirmSelection = () => {
    if (selectedRole) {
      onSelectRole(selectedRole);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedRole(null);
    setSearchTerm('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Select Role</h2>
          <button className="modal-close" onClick={handleClose}>
            <FiX />
          </button>
        </div>

        <div className="modal-body">
          {/* Search Input */}
          <div className="search-section">
            <div className="search-wrapper">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            {selectedRole && (
              <button
                className="role-select-tick"
                onClick={handleConfirmSelection}
                title="Select this role"
              >
                <FiCheck />
              </button>
            )}
          </div>

          {/* Roles Table */}
          <div className="modal-table-container">
            {loading ? (
              <div className="loading-message">Loading roles...</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Role Name</th>
                    <th>Description</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoles.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="no-data">
                        {searchTerm ? 'No roles found matching your search' : 'No roles available'}
                      </td>
                    </tr>
                  ) : (
                    filteredRoles.map((role) => (
                      <tr 
                        key={role.id} 
                        className={selectedRole?.id === role.id ? 'selected' : ''}
                        onClick={() => handleRoleSelect(role)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>
                          <input
                            type="radio"
                            name="roleSelection"
                            checked={selectedRole?.id === role.id}
                            onChange={() => handleRoleSelect(role)}
                          />
                        </td>
                        <td>{role.roleName}</td>
                        <td>{role.description || '-'}</td>
                        <td>
                          <span className={`status-badge status-${role.status.toLowerCase()}`}>
                            {role.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoleLookupModal;
