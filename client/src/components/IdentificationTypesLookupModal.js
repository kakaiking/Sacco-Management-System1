import React, { useState, useEffect } from 'react';
import { FiX, FiCheck, FiSearch } from 'react-icons/fi';
import axios from 'axios';

function IdentificationTypesLookupModal({ isOpen, onClose, onSelectIdentificationType }) {
  const [identificationTypes, setIdentificationTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIdentificationType, setSelectedIdentificationType] = useState(null);

  // Fetch identification types when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchIdentificationTypes();
    }
  }, [isOpen]);

  const fetchIdentificationTypes = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3001/identification-types', {
        headers: { accessToken: localStorage.getItem('accessToken') }
      });
      setIdentificationTypes(response.data.entity || []);
    } catch (error) {
      console.error('Error fetching identification types:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter identification types based on search term
  const filteredIdentificationTypes = identificationTypes.filter(identificationType =>
    identificationType.identificationTypeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    identificationType.identificationTypeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (identificationType.description && identificationType.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleIdentificationTypeSelect = (identificationType) => {
    setSelectedIdentificationType(identificationType);
  };

  const handleIdentificationTypeDoubleClick = (identificationType) => {
    setSelectedIdentificationType(identificationType);
    onSelectIdentificationType(identificationType);
    onClose();
  };

  const handleConfirmSelection = () => {
    if (selectedIdentificationType) {
      onSelectIdentificationType(selectedIdentificationType);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedIdentificationType(null);
    setSearchTerm('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Select Identification Type</h2>
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
                placeholder="Search identification types..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            {selectedIdentificationType && (
              <button
                className="role-select-tick"
                onClick={handleConfirmSelection}
                title="Select this identification type"
              >
                <FiCheck />
              </button>
            )}
          </div>

          {/* Identification Types Table */}
          <div className="modal-table-container">
            {loading ? (
              <div className="loading-message">Loading identification types...</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>ID Type Name</th>
                    <th>Description</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIdentificationTypes.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="no-data">
                        {searchTerm ? 'No identification types found matching your search' : 'No identification types available'}
                      </td>
                    </tr>
                  ) : (
                    filteredIdentificationTypes.map((identificationType) => (
                      <tr 
                        key={identificationType.id} 
                        className={selectedIdentificationType?.id === identificationType.id ? 'selected' : ''}
                        onClick={() => handleIdentificationTypeSelect(identificationType)}
                        onDoubleClick={() => handleIdentificationTypeDoubleClick(identificationType)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>
                          <input
                            type="radio"
                            name="identificationTypeSelection"
                            checked={selectedIdentificationType?.id === identificationType.id}
                            onChange={() => handleIdentificationTypeSelect(identificationType)}
                          />
                        </td>
                        <td>{identificationType.identificationTypeName}</td>
                        <td>{identificationType.description || '-'}</td>
                        <td>
                          <span className={`status-badge status-${identificationType.status.toLowerCase()}`}>
                            {identificationType.status}
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

export default IdentificationTypesLookupModal;

