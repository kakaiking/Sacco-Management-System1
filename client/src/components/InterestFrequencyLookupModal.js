import React, { useState, useEffect } from 'react';
import { FiX, FiCheck, FiSearch } from 'react-icons/fi';
import axios from 'axios';

function InterestFrequencyLookupModal({ isOpen, onClose, onSelectInterestFrequency }) {
  const [interestFrequencies, setInterestFrequencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInterestFrequency, setSelectedInterestFrequency] = useState(null);

  // Fetch interest frequencies when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchInterestFrequencies();
    }
  }, [isOpen]);

  const fetchInterestFrequencies = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3001/interest-frequency', {
        headers: { accessToken: localStorage.getItem('accessToken') }
      });
      setInterestFrequencies(response.data.entity || []);
    } catch (error) {
      console.error('Error fetching interest frequencies:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter interest frequencies based on search term
  const filteredInterestFrequencies = interestFrequencies.filter(interestFrequency =>
    (interestFrequency.interestFrequencyId && interestFrequency.interestFrequencyId.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (interestFrequency.interestFrequencyName && interestFrequency.interestFrequencyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (interestFrequency.description && interestFrequency.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleInterestFrequencySelect = (interestFrequency) => {
    setSelectedInterestFrequency(interestFrequency);
  };

  const handleConfirmSelection = () => {
    if (selectedInterestFrequency) {
      onSelectInterestFrequency(selectedInterestFrequency);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedInterestFrequency(null);
    setSearchTerm('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Select Interest Frequency</h2>
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
                placeholder="Search interest frequencies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            {selectedInterestFrequency && (
              <button
                className="role-select-tick"
                onClick={handleConfirmSelection}
                title="Select this interest frequency"
              >
                <FiCheck />
              </button>
            )}
          </div>

          {/* Interest Frequencies Table */}
          <div className="modal-table-container">
            {loading ? (
              <div className="loading-message">Loading interest frequencies...</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Frequency ID</th>
                    <th>Frequency Name</th>
                    <th>Description</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInterestFrequencies.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="no-data">
                        {searchTerm ? 'No interest frequencies found matching your search' : 'No interest frequencies available'}
                      </td>
                    </tr>
                  ) : (
                    filteredInterestFrequencies.map((interestFrequency) => (
                      <tr 
                        key={interestFrequency.id} 
                        className={selectedInterestFrequency?.id === interestFrequency.id ? 'selected' : ''}
                        onClick={() => handleInterestFrequencySelect(interestFrequency)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>
                          <input
                            type="radio"
                            name="interestFrequencySelection"
                            checked={selectedInterestFrequency?.id === interestFrequency.id}
                            onChange={() => handleInterestFrequencySelect(interestFrequency)}
                          />
                        </td>
                        <td>{interestFrequency.interestFrequencyId}</td>
                        <td>{interestFrequency.interestFrequencyName}</td>
                        <td>{interestFrequency.description || '-'}</td>
                        <td>
                          <span className={`status-badge status-${interestFrequency.status.toLowerCase()}`}>
                            {interestFrequency.status}
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

export default InterestFrequencyLookupModal;
