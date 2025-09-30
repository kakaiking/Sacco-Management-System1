import React, { useState, useEffect } from 'react';
import { FiX, FiCheck, FiSearch } from 'react-icons/fi';
import axios from 'axios';

function BranchLookupModal({ isOpen, onClose, onSelectBranch }) {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState(null);

  // Fetch branches when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchBranches();
    }
  }, [isOpen]);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3001/branch', {
        headers: { accessToken: localStorage.getItem('accessToken') }
      });
      setBranches(response.data.entity || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refetch when search term changes
  useEffect(() => {
    if (isOpen && searchTerm !== '') {
      const timeoutId = setTimeout(() => {
        fetchBranches();
      }, 300);
      return () => clearTimeout(timeoutId);
    } else if (isOpen && searchTerm === '') {
      fetchBranches();
    }
  }, [searchTerm, isOpen]);

  // Filter branches based on search term
  const filteredBranches = branches.filter(branch =>
    branch.branchName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.branchLocation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.branchId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBranchSelect = (branch) => {
    setSelectedBranch(branch);
  };

  const handleConfirmSelection = () => {
    if (selectedBranch) {
      onSelectBranch(selectedBranch);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedBranch(null);
    setSearchTerm('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Select Branch</h2>
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
                placeholder="Search branches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            {selectedBranch && (
              <button
                className="role-select-tick"
                onClick={handleConfirmSelection}
                title="Select this branch"
              >
                <FiCheck />
              </button>
            )}
          </div>

          {/* Branches Table */}
          <div className="modal-table-container">
            {loading ? (
              <div className="loading-message">Loading branches...</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Branch Name</th>
                    <th>Branch ID</th>
                    <th>Location</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBranches.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="no-data">
                        {searchTerm ? 'No branches found matching your search' : 'No branches available'}
                      </td>
                    </tr>
                  ) : (
                    filteredBranches.map((branch) => (
                      <tr 
                        key={branch.id} 
                        className={selectedBranch?.id === branch.id ? 'selected' : ''}
                        onClick={() => handleBranchSelect(branch)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>
                          <input
                            type="radio"
                            name="branchSelection"
                            checked={selectedBranch?.id === branch.id}
                            onChange={() => handleBranchSelect(branch)}
                          />
                        </td>
                        <td>{branch.branchName}</td>
                        <td>{branch.branchId}</td>
                        <td>{branch.branchLocation || '-'}</td>
                        <td>
                          <span className={`status-badge status-${branch.status.toLowerCase()}`}>
                            {branch.status}
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

export default BranchLookupModal;

