import React, { useState, useEffect } from 'react';
import { FiX, FiCheck, FiSearch } from 'react-icons/fi';
import axios from 'axios';

function InterestTypesLookupModal({ isOpen, onClose, onSelectInterestType }) {
  const [interestTypes, setInterestTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInterestType, setSelectedInterestType] = useState(null);

  // Fetch interest types when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchInterestTypes();
    }
  }, [isOpen]);

  const fetchInterestTypes = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3001/interest-types', {
        headers: { accessToken: localStorage.getItem('accessToken') }
      });
      setInterestTypes(response.data.entity || []);
    } catch (error) {
      console.error('Error fetching interest types:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter interest types based on search term
  const filteredInterestTypes = interestTypes.filter(interestType =>
    interestType.interestTypeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    interestType.interestTypeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (interestType.description && interestType.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleInterestTypeSelect = (interestType) => {
    setSelectedInterestType(interestType);
  };

  const handleConfirmSelection = () => {
    if (selectedInterestType) {
      onSelectInterestType(selectedInterestType);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedInterestType(null);
    setSearchTerm('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Select Interest Type</h2>
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
                placeholder="Search interest types..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            {selectedInterestType && (
              <button
                className="role-select-tick"
                onClick={handleConfirmSelection}
                title="Select this interest type"
              >
                <FiCheck />
              </button>
            )}
          </div>

          {/* Interest Types Table */}
          <div className="modal-table-container">
            {loading ? (
              <div className="loading-message">Loading interest types...</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Interest Type ID</th>
                    <th>Interest Type Name</th>
                    <th>Description</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInterestTypes.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="no-data">
                        {searchTerm ? 'No interest types found matching your search' : 'No interest types available'}
                      </td>
                    </tr>
                  ) : (
                    filteredInterestTypes.map((interestType) => (
                      <tr 
                        key={interestType.id} 
                        className={selectedInterestType?.id === interestType.id ? 'selected' : ''}
                        onClick={() => handleInterestTypeSelect(interestType)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>
                          <input
                            type="radio"
                            name="interestTypeSelection"
                            checked={selectedInterestType?.id === interestType.id}
                            onChange={() => handleInterestTypeSelect(interestType)}
                          />
                        </td>
                        <td>{interestType.interestTypeId}</td>
                        <td>{interestType.interestTypeName}</td>
                        <td>{interestType.description || '-'}</td>
                        <td>
                          <span className={`status-badge status-${interestType.status.toLowerCase()}`}>
                            {interestType.status}
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

export default InterestTypesLookupModal;
