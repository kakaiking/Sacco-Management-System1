import React, { useState, useEffect, useContext } from 'react';
import { FiSearch, FiX, FiCheck } from 'react-icons/fi';
import { AuthContext } from '../helpers/AuthContext';
import { useSnackbar } from '../helpers/SnackbarContext';
import '../helpers/MockAuth'; // Import mock auth for testing

function AccountTypeLookupModal({ isOpen, onClose, onSelect, productId = null, status = 'Active' }) {
  const { authState } = useContext(AuthContext);
  const { showMessage: showSnackbar } = useSnackbar();
  
  const [accountTypes, setAccountTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(status);
  const [selectedAccountType, setSelectedAccountType] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchAccountTypes();
    }
  }, [isOpen, searchTerm, statusFilter, productId]);

  const fetchAccountTypes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (searchTerm) params.append('q', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (productId) params.append('productId', productId);

      const response = await fetch(`http://localhost:3001/account-types?${params}`, {
        headers: {
          'accessToken': localStorage.getItem('accessToken')
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAccountTypes(data.entity || []);
      } else {
        showSnackbar('Failed to fetch account types', 'error');
      }
    } catch (error) {
      console.error('Error fetching account types:', error);
      showSnackbar('Error fetching account types', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAccountTypeSelect = (accountType) => {
    setSelectedAccountType(accountType);
  };

  const handleConfirmSelection = () => {
    if (selectedAccountType) {
      onSelect(selectedAccountType);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedAccountType(null);
    setSearchTerm('');
    onClose();
  };


  // Filter account types based on search term
  const filteredAccountTypes = accountTypes.filter(accountType =>
    accountType.accountTypeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    accountType.accountTypeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    accountType.product?.productName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Select Account Type</h2>
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
                placeholder="Search account types..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            {selectedAccountType && (
              <button
                className="role-select-tick"
                onClick={handleConfirmSelection}
                title="Select this account type"
              >
                <FiCheck />
              </button>
            )}
          </div>

          {/* Account Types Table */}
          <div className="modal-table-container">
            {loading ? (
              <div className="loading-message">Loading account types...</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Account Type ID</th>
                    <th>Name</th>
                    <th>Product</th>
                    <th>Type</th>
                    <th>BOSA/FOSA</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccountTypes.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="no-data">
                        {searchTerm ? 'No account types found matching your search' : 'No account types available'}
                      </td>
                    </tr>
                  ) : (
                    filteredAccountTypes.map((accountType) => (
                      <tr 
                        key={accountType.id} 
                        className={selectedAccountType?.id === accountType.id ? 'selected' : ''}
                        onClick={() => handleAccountTypeSelect(accountType)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>
                          <input
                            type="radio"
                            name="accountTypeSelection"
                            checked={selectedAccountType?.id === accountType.id}
                            onChange={() => handleAccountTypeSelect(accountType)}
                          />
                        </td>
                        <td>{accountType.accountTypeId}</td>
                        <td>{accountType.accountTypeName}</td>
                        <td>{accountType.product?.productName || 'Unknown'}</td>
                        <td>{accountType.accountType}</td>
                        <td>{accountType.bosaFosa}</td>
                        <td>
                          <span className={`status-badge status-${accountType.status.toLowerCase()}`}>
                            {accountType.status}
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

export default AccountTypeLookupModal;