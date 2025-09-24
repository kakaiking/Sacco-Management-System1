import React, { useState, useEffect } from 'react';
import { FiX, FiCheck, FiSearch } from 'react-icons/fi';
import axios from 'axios';

function SaccoLookupModal({ isOpen, onClose, onSelectSacco }) {
  const [saccos, setSaccos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSacco, setSelectedSacco] = useState(null);

  // Fetch saccos when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchSaccos();
    }
  }, [isOpen]);

  const fetchSaccos = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3001/sacco', {
        headers: { accessToken: localStorage.getItem('accessToken') }
      });
      setSaccos(response.data.entity || []);
    } catch (error) {
      console.error('Error fetching saccos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter saccos based on search term
  const filteredSaccos = saccos.filter(sacco =>
    sacco.saccoId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sacco.saccoName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sacco.licenseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sacco.contactEmail && sacco.contactEmail.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSaccoSelect = (sacco) => {
    setSelectedSacco(sacco);
  };

  const handleConfirmSelection = () => {
    if (selectedSacco) {
      onSelectSacco(selectedSacco);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedSacco(null);
    setSearchTerm('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Select Sacco</h2>
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
                placeholder="Search saccos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            {selectedSacco && (
              <button
                className="role-select-tick"
                onClick={handleConfirmSelection}
                title="Select this sacco"
              >
                <FiCheck />
              </button>
            )}
          </div>

          {/* Saccos Table */}
          <div className="modal-table-container">
            {loading ? (
              <div className="loading-message">Loading saccos...</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Sacco ID</th>
                    <th>Sacco Name</th>
                    <th>License ID</th>
                    <th>Contact Email</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSaccos.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="no-data">
                        {searchTerm ? 'No saccos found matching your search' : 'No saccos available'}
                      </td>
                    </tr>
                  ) : (
                    filteredSaccos.map((sacco) => (
                      <tr 
                        key={sacco.id} 
                        className={selectedSacco?.id === sacco.id ? 'selected' : ''}
                        onClick={() => handleSaccoSelect(sacco)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>
                          <input
                            type="radio"
                            name="saccoSelection"
                            checked={selectedSacco?.id === sacco.id}
                            onChange={() => handleSaccoSelect(sacco)}
                          />
                        </td>
                        <td>{sacco.saccoId}</td>
                        <td>{sacco.saccoName}</td>
                        <td>{sacco.licenseId}</td>
                        <td>{sacco.contactEmail || '-'}</td>
                        <td>
                          <span className={`status-badge status-${sacco.status.toLowerCase()}`}>
                            {sacco.status}
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

export default SaccoLookupModal;
