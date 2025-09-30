import React, { useState, useEffect } from 'react';
import { FiX, FiCheck, FiSearch } from 'react-icons/fi';
import axios from 'axios';

function NextOfKinRelationTypesLookupModal({ isOpen, onClose, onSelectRelationType }) {
  const [relationTypes, setRelationTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRelationType, setSelectedRelationType] = useState(null);

  // Fetch relation types when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchRelationTypes();
    }
  }, [isOpen]);

  const fetchRelationTypes = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3001/next-of-kin-relation-types', {
        headers: { accessToken: localStorage.getItem('accessToken') }
      });
      setRelationTypes(response.data.entity || []);
    } catch (error) {
      console.error('Error fetching relation types:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter relation types based on search term
  const filteredRelationTypes = relationTypes.filter(relationType =>
    relationType.relationTypeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    relationType.relationTypeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (relationType.description && relationType.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleRelationTypeSelect = (relationType) => {
    setSelectedRelationType(relationType);
  };

  const handleRelationTypeDoubleClick = (relationType) => {
    setSelectedRelationType(relationType);
    onSelectRelationType(relationType);
    onClose();
  };

  const handleConfirmSelection = () => {
    if (selectedRelationType) {
      onSelectRelationType(selectedRelationType);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedRelationType(null);
    setSearchTerm('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Select Next of Kin Relation Type</h2>
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
                placeholder="Search relation types..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            {selectedRelationType && (
              <button
                className="role-select-tick"
                onClick={handleConfirmSelection}
                title="Select this relation type"
              >
                <FiCheck />
              </button>
            )}
          </div>

          {/* Relation Types Table */}
          <div className="modal-table-container">
            {loading ? (
              <div className="loading-message">Loading relation types...</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Relation Type Name</th>
                    <th>Description</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRelationTypes.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="no-data">
                        {searchTerm ? 'No relation types found matching your search' : 'No relation types available'}
                      </td>
                    </tr>
                  ) : (
                    filteredRelationTypes.map((relationType) => (
                      <tr 
                        key={relationType.id} 
                        className={selectedRelationType?.id === relationType.id ? 'selected' : ''}
                        onClick={() => handleRelationTypeSelect(relationType)}
                        onDoubleClick={() => handleRelationTypeDoubleClick(relationType)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>
                          <input
                            type="radio"
                            name="relationTypeSelection"
                            checked={selectedRelationType?.id === relationType.id}
                            onChange={() => handleRelationTypeSelect(relationType)}
                          />
                        </td>
                        <td>{relationType.relationTypeName}</td>
                        <td>{relationType.description || '-'}</td>
                        <td>
                          <span className={`status-badge status-${relationType.status.toLowerCase()}`}>
                            {relationType.status}
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

export default NextOfKinRelationTypesLookupModal;
