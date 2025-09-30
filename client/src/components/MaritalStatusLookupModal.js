import React, { useState, useEffect } from 'react';
import { FiX, FiSearch } from 'react-icons/fi';
import axios from 'axios';

function MaritalStatusLookupModal({ isOpen, onClose, onSelectMaritalStatus }) {
  const [maritalStatuses, setMaritalStatuses] = useState([]);
  const [filteredMaritalStatuses, setFilteredMaritalStatuses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMaritalStatus, setSelectedMaritalStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchMaritalStatuses();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = maritalStatuses.filter(maritalStatus =>
        maritalStatus.maritalStatusName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        maritalStatus.maritalStatusCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        maritalStatus.maritalStatusId.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMaritalStatuses(filtered);
    } else {
      setFilteredMaritalStatuses(maritalStatuses);
    }
  }, [searchTerm, maritalStatuses]);

  const fetchMaritalStatuses = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3001/marital-status', {
        headers: { accessToken: localStorage.getItem('accessToken') },
        params: { status: 'Active' } // Only fetch active marital statuses
      });
      const data = response.data?.entity || response.data || [];
      setMaritalStatuses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching marital statuses:', error);
      setMaritalStatuses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMaritalStatusSelect = (maritalStatus) => {
    setSelectedMaritalStatus(maritalStatus);
  };

  const handleMaritalStatusDoubleClick = (maritalStatus) => {
    setSelectedMaritalStatus(maritalStatus);
    onSelectMaritalStatus(maritalStatus);
    onClose();
  };

  const handleConfirm = () => {
    if (selectedMaritalStatus) {
      onSelectMaritalStatus(selectedMaritalStatus);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedMaritalStatus(null);
    setSearchTerm('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ width: '800px', maxWidth: '90vw' }}>
        <div className="modal-header">
          <h2>Select Marital Status</h2>
          <button className="iconBtn" onClick={handleClose}>
            <FiX size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ marginBottom: '16px' }}>
            <div style={{ position: 'relative' }}>
              <FiSearch 
                style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: 'var(--text-secondary)' 
                }} 
              />
              <input
                type="text"
                placeholder="Search by name, code, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  border: '1px solid var(--gray-300)',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div>Loading marital statuses...</div>
            </div>
          ) : (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {filteredMaritalStatuses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  {searchTerm ? 'No marital statuses found matching your search.' : 'No marital statuses available.'}
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Select</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Name</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Code</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Description</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMaritalStatuses.map((maritalStatus) => (
                      <tr 
                        key={maritalStatus.id} 
                        className={selectedMaritalStatus?.id === maritalStatus.id ? 'selected' : ''}
                        onClick={() => handleMaritalStatusSelect(maritalStatus)}
                        onDoubleClick={() => handleMaritalStatusDoubleClick(maritalStatus)}
                        style={{ 
                          cursor: 'pointer',
                          backgroundColor: selectedMaritalStatus?.id === maritalStatus.id ? 'var(--primary-50)' : 'transparent'
                        }}
                      >
                        <td style={{ padding: '12px' }}>
                          <input
                            type="radio"
                            name="maritalStatusSelection"
                            checked={selectedMaritalStatus?.id === maritalStatus.id}
                            onChange={() => handleMaritalStatusSelect(maritalStatus)}
                          />
                        </td>
                        <td style={{ padding: '12px', fontWeight: '500' }}>{maritalStatus.maritalStatusName}</td>
                        <td style={{ padding: '12px' }}>{maritalStatus.maritalStatusCode || '-'}</td>
                        <td style={{ padding: '12px' }}>{maritalStatus.description || '-'}</td>
                        <td style={{ padding: '12px' }}>
                          <span className={`status-badge status-${maritalStatus.status.toLowerCase()}`}>
                            {maritalStatus.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            className="pill"
            onClick={handleClose}
            style={{
              backgroundColor: 'var(--gray-100)',
              color: 'var(--text-primary)',
              border: '1px solid var(--gray-300)'
            }}
          >
            Cancel
          </button>
          <button
            className="pill"
            onClick={handleConfirm}
            disabled={!selectedMaritalStatus}
            style={{
              backgroundColor: selectedMaritalStatus ? 'var(--primary-500)' : 'var(--gray-300)',
              color: 'white',
              border: 'none'
            }}
          >
            Select
          </button>
        </div>
      </div>
    </div>
  );
}

export default MaritalStatusLookupModal;

