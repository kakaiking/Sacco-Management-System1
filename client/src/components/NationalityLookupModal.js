import React, { useState, useEffect } from 'react';
import { FiX, FiCheck, FiSearch } from 'react-icons/fi';
import axios from 'axios';

function NationalityLookupModal({ isOpen, onClose, onSelectNationality }) {
  const [nationalities, setNationalities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNationality, setSelectedNationality] = useState(null);

  // Fetch nationalities when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchNationalities();
    }
  }, [isOpen]);

  const fetchNationalities = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3001/nationality', {
        headers: { accessToken: localStorage.getItem('accessToken') }
      });
      setNationalities(response.data.entity || []);
    } catch (error) {
      console.error('Error fetching nationalities:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter nationalities based on search term
  const filteredNationalities = nationalities.filter(nationality =>
    nationality.nationalityId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    nationality.nationalityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (nationality.isoCode && nationality.isoCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (nationality.countryCode && nationality.countryCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (nationality.description && nationality.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleNationalitySelect = (nationality) => {
    setSelectedNationality(nationality);
  };

  const handleNationalityDoubleClick = (nationality) => {
    setSelectedNationality(nationality);
    onSelectNationality(nationality);
    onClose();
  };

  const handleConfirmSelection = () => {
    if (selectedNationality) {
      onSelectNationality(selectedNationality);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedNationality(null);
    setSearchTerm('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Select Nationality</h2>
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
                placeholder="Search nationalities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            {selectedNationality && (
              <button
                className="role-select-tick"
                onClick={handleConfirmSelection}
                title="Select this nationality"
              >
                <FiCheck />
              </button>
            )}
          </div>

          {/* Nationalities Table */}
          <div className="modal-table-container">
            {loading ? (
              <div className="loading-message">Loading nationalities...</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Nationality Name</th>
                    <th>ISO Code</th>
                    <th>Country Code</th>
                    <th>Description</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNationalities.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="no-data">
                        {searchTerm ? 'No nationalities found matching your search' : 'No nationalities available'}
                      </td>
                    </tr>
                  ) : (
                    filteredNationalities.map((nationality) => (
                      <tr 
                        key={nationality.id} 
                        className={selectedNationality?.id === nationality.id ? 'selected' : ''}
                        onClick={() => handleNationalitySelect(nationality)}
                        onDoubleClick={() => handleNationalityDoubleClick(nationality)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>
                          <input
                            type="radio"
                            name="nationalitySelection"
                            checked={selectedNationality?.id === nationality.id}
                            onChange={() => handleNationalitySelect(nationality)}
                          />
                        </td>
                        <td>{nationality.nationalityName}</td>
                        <td>{nationality.isoCode || '-'}</td>
                        <td>{nationality.countryCode || '-'}</td>
                        <td>{nationality.description || '-'}</td>
                        <td>
                          <span className={`status-badge status-${nationality.status.toLowerCase()}`}>
                            {nationality.status}
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

export default NationalityLookupModal;
