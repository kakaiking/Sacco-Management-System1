import React, { useState, useEffect } from 'react';
import { FiX, FiCheck, FiSearch } from 'react-icons/fi';
import axios from 'axios';

function TillLookupModal({ isOpen, onClose, onSelectTill }) {
  const [tills, setTills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTill, setSelectedTill] = useState(null);

  // Fetch tills when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchTills();
    }
  }, [isOpen]);

  const fetchTills = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3001/tills', {
        headers: { accessToken: localStorage.getItem('accessToken') }
      });
      setTills(response.data.entity || []);
    } catch (error) {
      console.error('Error fetching tills:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter tills based on search term
  const filteredTills = tills.filter(till =>
    till.tillId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    till.tillName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    till.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTillSelect = (till) => {
    setSelectedTill(till);
  };

  const handleConfirmSelection = () => {
    if (selectedTill) {
      onSelectTill(selectedTill);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedTill(null);
    setSearchTerm('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Select Till</h2>
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
                placeholder="Search tills by ID, name, or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            {selectedTill && (
              <button
                className="role-select-tick"
                onClick={handleConfirmSelection}
                title="Select this till"
              >
                <FiCheck />
              </button>
            )}
          </div>

          {/* Tills Table */}
          <div className="modal-table-container">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>Loading tills...</div>
            ) : filteredTills.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                No tills found
              </div>
            ) : (
              <table className="modal-table">
                <thead>
                  <tr>
                    <th>Till ID</th>
                    <th>Till Name</th>
                    <th>Status</th>
                    <th>Sacco</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTills.map((till) => (
                    <tr
                      key={till.id}
                      onClick={() => handleTillSelect(till)}
                      className={selectedTill?.id === till.id ? 'selected' : ''}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>{till.tillId}</td>
                      <td>{till.tillName}</td>
                      <td>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: till.status === 'Active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                          color: till.status === 'Active' ? '#059669' : '#dc2626'
                        }}>
                          {till.status}
                        </span>
                      </td>
                      <td>{till.sacco?.saccoName || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TillLookupModal;

