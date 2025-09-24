import React, { useState, useEffect } from 'react';
import { FiX, FiCheck, FiSearch, FiMinus } from 'react-icons/fi';
import axios from 'axios';

function ChargesLookupModal({ isOpen, onClose, onSelectCharges, selectedChargeIds = [] }) {
  const [charges, setCharges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCharges, setSelectedCharges] = useState([]);

  // Initialize selected charges from props
  useEffect(() => {
    if (isOpen && selectedChargeIds.length > 0) {
      // Find charges that match the selected IDs
      const matchingCharges = charges.filter(charge => 
        selectedChargeIds.includes(charge.chargeId)
      );
      setSelectedCharges(matchingCharges);
    } else if (isOpen) {
      setSelectedCharges([]);
    }
  }, [isOpen, selectedChargeIds, charges]);

  // Fetch charges when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCharges();
    }
  }, [isOpen]);

  const fetchCharges = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3001/charges', {
        headers: { accessToken: localStorage.getItem('accessToken') }
      });
      setCharges(response.data || []);
    } catch (error) {
      console.error('Error fetching charges:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter charges based on search term
  const filteredCharges = charges.filter(charge =>
    charge.chargeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    charge.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    charge.currency.toLowerCase().includes(searchTerm.toLowerCase()) ||
    charge.saccoId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleChargeToggle = (charge) => {
    setSelectedCharges(prev => {
      const isSelected = prev.some(selected => selected.chargeId === charge.chargeId);
      if (isSelected) {
        return prev.filter(selected => selected.chargeId !== charge.chargeId);
      } else {
        return [...prev, charge];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedCharges.length === filteredCharges.length) {
      // Deselect all filtered charges
      setSelectedCharges(prev => 
        prev.filter(selected => 
          !filteredCharges.some(filtered => filtered.chargeId === selected.chargeId)
        )
      );
    } else {
      // Select all filtered charges
      const newSelections = filteredCharges.filter(charge => 
        !selectedCharges.some(selected => selected.chargeId === charge.chargeId)
      );
      setSelectedCharges(prev => [...prev, ...newSelections]);
    }
  };

  const handleConfirmSelection = () => {
    onSelectCharges(selectedCharges);
    onClose();
  };

  const handleClose = () => {
    setSelectedCharges([]);
    setSearchTerm('');
    onClose();
  };

  const removeSelectedCharge = (chargeId) => {
    setSelectedCharges(prev => prev.filter(charge => charge.chargeId !== chargeId));
  };

  const isAllSelected = filteredCharges.length > 0 && 
    filteredCharges.every(charge => 
      selectedCharges.some(selected => selected.chargeId === charge.chargeId)
    );

  const isIndeterminate = selectedCharges.some(charge => 
    filteredCharges.some(filtered => filtered.chargeId === charge.chargeId)
  ) && !isAllSelected;

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Select Charges</h2>
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
                placeholder="Search charges..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            {selectedCharges.length > 0 && (
              <button
                className="role-select-tick"
                onClick={handleConfirmSelection}
                title={`Select ${selectedCharges.length} charge(s)`}
              >
                <FiCheck />
              </button>
            )}
          </div>

          {/* Selected Charges Summary */}
          {selectedCharges.length > 0 && (
            <div className="selected-summary" style={{
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: '#f0f9ff',
              borderRadius: '8px',
              border: '1px solid #0ea5e9'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: '600', color: '#0369a1' }}>
                  Selected Charges ({selectedCharges.length})
                </span>
                <button
                  onClick={() => setSelectedCharges([])}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#dc2626',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Clear All
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {selectedCharges.map(charge => (
                  <span
                    key={charge.chargeId}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 8px',
                      backgroundColor: '#0ea5e9',
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    {charge.chargeId}
                    <button
                      onClick={() => removeSelectedCharge(charge.chargeId)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        padding: '0',
                        marginLeft: '4px'
                      }}
                    >
                      <FiMinus size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Charges Table */}
          <div className="modal-table-container">
            {loading ? (
              <div className="loading-message">Loading charges...</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        ref={input => {
                          if (input) input.indeterminate = isIndeterminate;
                        }}
                        onChange={handleSelectAll}
                        style={{ cursor: 'pointer' }}
                      />
                    </th>
                    <th>Charge ID</th>
                    <th>Name</th>
                    <th>Currency</th>
                    <th>Amount</th>
                    <th>Sacco ID</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCharges.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="no-data">
                        {searchTerm ? 'No charges found matching your search' : 'No charges available'}
                      </td>
                    </tr>
                  ) : (
                    filteredCharges.map((charge) => {
                      const isSelected = selectedCharges.some(selected => selected.chargeId === charge.chargeId);
                      return (
                        <tr 
                          key={charge.id} 
                          className={isSelected ? 'selected' : ''}
                          onClick={() => handleChargeToggle(charge)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleChargeToggle(charge)}
                            />
                          </td>
                          <td>{charge.chargeId}</td>
                          <td>{charge.name}</td>
                          <td>{charge.currency}</td>
                          <td>{charge.amount}</td>
                          <td>{charge.saccoId}</td>
                          <td>
                            <span className={`status-badge status-${charge.status.toLowerCase()}`}>
                              {charge.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid #e5e7eb'
          }}>
            <span style={{ fontSize: '14px', color: '#6b7280' }}>
              {selectedCharges.length} charge(s) selected
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="pill"
                onClick={handleClose}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="pill"
                onClick={handleConfirmSelection}
                disabled={selectedCharges.length === 0}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  backgroundColor: selectedCharges.length > 0 ? '#10b981' : '#d1d5db',
                  color: 'white',
                  border: 'none',
                  cursor: selectedCharges.length > 0 ? 'pointer' : 'not-allowed'
                }}
              >
                Select {selectedCharges.length > 0 ? `(${selectedCharges.length})` : ''}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChargesLookupModal;
