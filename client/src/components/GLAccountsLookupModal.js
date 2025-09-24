import React, { useState, useEffect } from 'react';
import { FiX, FiCheck, FiSearch } from 'react-icons/fi';
import axios from 'axios';

function GLAccountsLookupModal({ isOpen, onClose, onSelectGLAccount }) {
  const [glAccounts, setGLAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGLAccount, setSelectedGLAccount] = useState(null);

  // Fetch GL accounts when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchGLAccounts();
    }
  }, [isOpen]);

  const fetchGLAccounts = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3001/gl-accounts', {
        headers: { accessToken: localStorage.getItem('accessToken') }
      });
      setGLAccounts(response.data.entity || []);
    } catch (error) {
      console.error('Error fetching GL accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter GL accounts based on search term
  const filteredGLAccounts = glAccounts.filter(account =>
    account.glAccountId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.accountCategory.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGLAccountSelect = (account) => {
    setSelectedGLAccount(account);
  };

  const handleConfirmSelection = () => {
    if (selectedGLAccount) {
      onSelectGLAccount(selectedGLAccount);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedGLAccount(null);
    setSearchTerm('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Select GL Account</h2>
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
                placeholder="Search GL accounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            {selectedGLAccount && (
              <button
                className="role-select-tick"
                onClick={handleConfirmSelection}
                title="Select this GL account"
              >
                <FiCheck />
              </button>
            )}
          </div>

          {/* GL Accounts Table */}
          <div className="modal-table-container">
            {loading ? (
              <div className="loading-message">Loading GL accounts...</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Account ID</th>
                    <th>Account Name</th>
                    <th>Category</th>
                    <th>Balance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGLAccounts.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="no-data">
                        {searchTerm ? 'No GL accounts found matching your search' : 'No GL accounts available'}
                      </td>
                    </tr>
                  ) : (
                    filteredGLAccounts.map((account) => (
                      <tr 
                        key={account.id} 
                        className={selectedGLAccount?.id === account.id ? 'selected' : ''}
                        onClick={() => handleGLAccountSelect(account)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>
                          <input
                            type="radio"
                            name="glAccountSelection"
                            checked={selectedGLAccount?.id === account.id}
                            onChange={() => handleGLAccountSelect(account)}
                          />
                        </td>
                        <td>{account.glAccountId}</td>
                        <td>{account.accountName}</td>
                        <td>{account.accountCategory}</td>
                        <td>${parseFloat(account.availableBalance || 0).toLocaleString()}</td>
                        <td>
                          <span className={`status-badge status-${account.status.toLowerCase()}`}>
                            {account.status}
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

export default GLAccountsLookupModal;
