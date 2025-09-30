import React, { useState, useEffect } from 'react';
import { FiX, FiCheck, FiSearch } from 'react-icons/fi';
import axios from 'axios';

function GenderLookupModal({ isOpen, onClose, onSelectGender }) {
  const [genders, setGenders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGender, setSelectedGender] = useState(null);

  // Fetch genders when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchGenders();
    }
  }, [isOpen]);

  const fetchGenders = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3001/gender', {
        headers: { accessToken: localStorage.getItem('accessToken') }
      });
      setGenders(response.data.entity || []);
    } catch (error) {
      console.error('Error fetching genders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter genders based on search term
  const filteredGenders = genders.filter(gender =>
    gender.genderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gender.genderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (gender.description && gender.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleGenderSelect = (gender) => {
    setSelectedGender(gender);
  };

  const handleGenderDoubleClick = (gender) => {
    setSelectedGender(gender);
    onSelectGender(gender);
    onClose();
  };

  const handleConfirmSelection = () => {
    if (selectedGender) {
      onSelectGender(selectedGender);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedGender(null);
    setSearchTerm('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Select Gender</h2>
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
                placeholder="Search genders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            {selectedGender && (
              <button
                className="role-select-tick"
                onClick={handleConfirmSelection}
                title="Select this gender"
              >
                <FiCheck />
              </button>
            )}
          </div>

          {/* Genders Table */}
          <div className="modal-table-container">
            {loading ? (
              <div className="loading-message">Loading genders...</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Gender Name</th>
                    <th>Description</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGenders.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="no-data">
                        {searchTerm ? 'No genders found matching your search' : 'No genders available'}
                      </td>
                    </tr>
                  ) : (
                    filteredGenders.map((gender) => (
                      <tr 
                        key={gender.id} 
                        className={selectedGender?.id === gender.id ? 'selected' : ''}
                        onClick={() => handleGenderSelect(gender)}
                        onDoubleClick={() => handleGenderDoubleClick(gender)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>
                          <input
                            type="radio"
                            name="genderSelection"
                            checked={selectedGender?.id === gender.id}
                            onChange={() => handleGenderSelect(gender)}
                          />
                        </td>
                        <td>{gender.genderName}</td>
                        <td>{gender.description || '-'}</td>
                        <td>
                          <span className={`status-badge status-${gender.status.toLowerCase()}`}>
                            {gender.status}
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

export default GenderLookupModal;

