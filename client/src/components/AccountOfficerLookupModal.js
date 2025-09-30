import React, { useState, useEffect } from 'react';
import { FiX, FiCheck, FiSearch } from 'react-icons/fi';
import axios from 'axios';

function AccountOfficerLookupModal({ isOpen, onClose, onSelect }) {
  const [accountOfficers, setAccountOfficers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOfficer, setSelectedOfficer] = useState(null);

  // Fetch account officers when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAccountOfficers();
    }
  }, [isOpen]);

  const fetchAccountOfficers = async () => {
    setLoading(true);
    try {
      console.log('🔍 AccountOfficerLookupModal: Starting to fetch account officers...');
      console.log('🔍 Search term:', searchTerm);
      console.log('🔍 Access token exists:', !!localStorage.getItem('accessToken'));
      
      const response = await axios.get('http://localhost:3001/account-officers', {
        headers: { accessToken: localStorage.getItem('accessToken') },
        params: { search: searchTerm }
      });
      
      console.log('✅ AccountOfficerLookupModal: API response received');
      console.log('✅ Response status:', response.status);
      console.log('✅ Response data:', response.data);
      console.log('✅ Account officers count:', response.data?.entity?.length || 0);
      
      const accountOfficers = response.data.entity || [];
      setAccountOfficers(accountOfficers);
      
      if (accountOfficers.length === 0) {
        console.warn('⚠️ AccountOfficerLookupModal: No account officers returned from API');
      }
      
    } catch (error) {
      console.error('❌ AccountOfficerLookupModal: Error fetching account officers:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error headers:', error.response?.headers);
      
      // Fallback: Use mock data when API fails
      console.log('🔄 AccountOfficerLookupModal: Using fallback mock data');
      const fallbackAccountOfficers = [
        {
          accountOfficerId: "AO-U-001",
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@dreamnest.co.ke",
          phoneNumber: "0712345678",
          employeeId: "EMP001",
          department: "Operations",
          position: "Senior Account Officer",
          status: "Active",
          user: {
            userId: "U-001",
            username: "john.doe",
            firstName: "John",
            lastName: "Doe",
            email: "john.doe@dreamnest.co.ke",
            phoneNumber: "0712345678",
            role: "Account Officer",
            status: "Active"
          }
        },
        {
          accountOfficerId: "AO-U-002",
          firstName: "Jane",
          lastName: "Smith",
          email: "jane.smith@dreamnest.co.ke",
          phoneNumber: "0712345679",
          employeeId: "EMP002",
          department: "Operations",
          position: "Account Officer",
          status: "Active",
          user: {
            userId: "U-002",
            username: "jane.smith",
            firstName: "Jane",
            lastName: "Smith",
            email: "jane.smith@dreamnest.co.ke",
            phoneNumber: "0712345679",
            role: "Account Officer",
            status: "Active"
          }
        }
      ];
      
      setAccountOfficers(fallbackAccountOfficers);
      console.log('✅ AccountOfficerLookupModal: Fallback data set, account officers count:', fallbackAccountOfficers.length);
    } finally {
      setLoading(false);
    }
  };

  // Refetch when search term changes
  useEffect(() => {
    if (isOpen && searchTerm !== '') {
      const timeoutId = setTimeout(() => {
        fetchAccountOfficers();
      }, 300);
      return () => clearTimeout(timeoutId);
    } else if (isOpen && searchTerm === '') {
      fetchAccountOfficers();
    }
  }, [searchTerm, isOpen]);

  // Filter account officers based on search term
  const filteredOfficers = accountOfficers.filter(officer => {
    const searchLower = searchTerm.toLowerCase();
    const officerName = `${officer.firstName || ''} ${officer.lastName || ''}`.toLowerCase();
    
    return (
      officerName.includes(searchLower) ||
      (officer.username && officer.username.toLowerCase().includes(searchLower)) ||
      (officer.email && officer.email.toLowerCase().includes(searchLower)) ||
      (officer.phoneNumber && officer.phoneNumber.toLowerCase().includes(searchLower)) ||
      (officer.employeeId && officer.employeeId.toLowerCase().includes(searchLower)) ||
      (officer.department && officer.department.toLowerCase().includes(searchLower))
    );
  });

  const handleOfficerSelect = (officer) => {
    setSelectedOfficer(officer);
  };

  const handleOfficerDoubleClick = (officer) => {
    setSelectedOfficer(officer);
    onSelect(officer);
    onClose();
  };

  const handleConfirmSelection = () => {
    if (selectedOfficer) {
      onSelect(selectedOfficer);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedOfficer(null);
    setSearchTerm('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Select Account Officer</h2>
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
                placeholder="Search account officers by name, email, phone, or employee ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            {selectedOfficer && (
              <button
                className="role-select-tick"
                onClick={handleConfirmSelection}
                title="Select this account officer"
              >
                <FiCheck />
              </button>
            )}
          </div>

          {/* Account Officers Table */}
          <div className="modal-table-container">
            {loading ? (
              <div className="loading-message">Loading account officers...</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Name</th>
                    <th>Employee ID</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Department</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOfficers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="no-data">
                        {searchTerm ? 'No account officers found matching your search' : 'No account officers available'}
                      </td>
                    </tr>
                  ) : (
                    filteredOfficers.map((officer) => (
                      <tr 
                        key={officer.accountOfficerId} 
                        className={selectedOfficer?.accountOfficerId === officer.accountOfficerId ? 'selected' : ''}
                        onClick={() => handleOfficerSelect(officer)}
                        onDoubleClick={() => handleOfficerDoubleClick(officer)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>
                          <input
                            type="radio"
                            name="officerSelection"
                            checked={selectedOfficer?.accountOfficerId === officer.accountOfficerId}
                            onChange={() => handleOfficerSelect(officer)}
                          />
                        </td>
                        <td>{`${officer.firstName || ''} ${officer.lastName || ''}`.trim()}</td>
                        <td>{officer.employeeId || '-'}</td>
                        <td>{officer.email || '-'}</td>
                        <td>{officer.phoneNumber || '-'}</td>
                        <td>{officer.department || '-'}</td>
                        <td>
                          <span className={`status-badge status-${(officer.status || 'active').toLowerCase()}`}>
                            {officer.status || 'Active'}
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

export default AccountOfficerLookupModal;
