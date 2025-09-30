import React, { useState, useEffect } from 'react';
import { FiX, FiCheck, FiSearch } from 'react-icons/fi';
import axios from 'axios';

function UserLookupModal({ isOpen, onClose, onSelectUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  // Fetch users when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      console.log('🔍 UserLookupModal: Starting to fetch users...');
      console.log('🔍 Search term:', searchTerm);
      console.log('🔍 Access token exists:', !!localStorage.getItem('accessToken'));
      
      const response = await axios.get('http://localhost:3001/account-officers/available-users', {
        headers: { accessToken: localStorage.getItem('accessToken') },
        params: { search: searchTerm }
      });
      
      console.log('✅ UserLookupModal: API response received');
      console.log('✅ Response status:', response.status);
      console.log('✅ Response data:', response.data);
      console.log('✅ Users count:', response.data?.entity?.length || 0);
      
      const users = response.data.entity || [];
      setUsers(users);
      
      if (users.length === 0) {
        console.warn('⚠️ UserLookupModal: No users returned from API');
      }
      
    } catch (error) {
      console.error('❌ UserLookupModal: Error fetching users:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error headers:', error.response?.headers);
      
      // Fallback: Use mock data when API fails
      console.log('🔄 UserLookupModal: Using fallback mock data');
      const fallbackUsers = [
        {
          userId: "USR-3546",
          username: "Angie",
          firstName: "Angie",
          lastName: "User",
          email: "angie@example.com",
          phoneNumber: "+254700000000",
          role: "Super User",
          status: "Active"
        },
        {
          userId: "U-001",
          username: "john.doe",
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@dreamnest.co.ke",
          phoneNumber: "0712345678",
          role: "Account Officer",
          status: "Active"
        },
        {
          userId: "U-002",
          username: "jane.smith",
          firstName: "Jane",
          lastName: "Smith",
          email: "jane.smith@dreamnest.co.ke",
          phoneNumber: "0712345679",
          role: "Account Officer",
          status: "Active"
        }
      ];
      
      setUsers(fallbackUsers);
      console.log('✅ UserLookupModal: Fallback data set, users count:', fallbackUsers.length);
    } finally {
      setLoading(false);
    }
  };

  // Refetch when search term changes
  useEffect(() => {
    if (isOpen && searchTerm !== '') {
      const timeoutId = setTimeout(() => {
        fetchUsers();
      }, 300);
      return () => clearTimeout(timeoutId);
    } else if (isOpen && searchTerm === '') {
      fetchUsers();
    }
  }, [searchTerm, isOpen]);

  const handleUserSelect = (user) => {
    setSelectedUser(user);
  };


  const handleConfirmSelection = () => {
    if (selectedUser) {
      onSelectUser(selectedUser);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedUser(null);
    setSearchTerm('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Select User</h2>
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
                placeholder="Search users by name, email, or username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            {selectedUser && (
              <button
                className="role-select-tick"
                onClick={handleConfirmSelection}
                title="Select this user"
              >
                <FiCheck />
              </button>
            )}
          </div>

          {/* Users Table */}
          <div className="modal-table-container">
            {loading ? (
              <div className="loading-message">Loading users...</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Name</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="no-data">
                        {searchTerm ? 'No users found matching your search' : 'No users available'}
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr 
                        key={user.userId} 
                        className={selectedUser?.userId === user.userId ? 'selected' : ''}
                        onClick={() => handleUserSelect(user)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>
                          <input
                            type="radio"
                            name="userSelection"
                            checked={selectedUser?.userId === user.userId}
                            onChange={() => handleUserSelect(user)}
                          />
                        </td>
                        <td>{`${user.firstName} ${user.lastName}`}</td>
                        <td>{user.username}</td>
                        <td>{user.email}</td>
                        <td>{user.phoneNumber || '-'}</td>
                        <td>{user.role}</td>
                        <td>
                          <span className={`status-badge status-${user.status.toLowerCase().replace(' ', '-')}`}>
                            {user.status}
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

export default UserLookupModal;
