import React, { useState, useEffect } from 'react';
import { FiX, FiCheck, FiSearch } from 'react-icons/fi';
import axios from 'axios';

function CollateralLookupModal({ isOpen, onClose, onSelectCollateral, memberId }) {
  const [collaterals, setCollaterals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCollateral, setSelectedCollateral] = useState(null);

  // Fetch collaterals when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCollaterals();
    }
  }, [isOpen, memberId]);

  const fetchCollaterals = async () => {
    setLoading(true);
    try {
      let url = 'http://localhost:3001/collateral';
      if (memberId) {
        url = `http://localhost:3001/collateral/member/${memberId}/available`;
      }
      
      const response = await axios.get(url, {
        headers: { accessToken: localStorage.getItem('accessToken') }
      });
      
      const collateralsData = response.data.entity || response.data.collaterals || [];
      setCollaterals(collateralsData);
    } catch (error) {
      console.error('Error fetching collaterals:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter collaterals based on search term
  const filteredCollaterals = collaterals.filter(collateral =>
    collateral.collateralId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    collateral.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    collateral.collateralType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    collateral.documentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    collateral.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCollateralSelect = (collateral) => {
    setSelectedCollateral(collateral);
  };

  const handleConfirmSelection = () => {
    if (selectedCollateral) {
      onSelectCollateral(selectedCollateral);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ width: '800px', maxWidth: '90vw' }}>
        <div className="modal-header">
          <h2>Select Collateral</h2>
          <button className="modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="modal-body">
          {/* Search Input */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search by ID, description, type, document number, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 40px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <FiSearch style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#666'
              }} />
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div>Loading collaterals...</div>
            </div>
          )}

          {/* Collaterals List */}
          {!loading && (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {filteredCollaterals.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                  {searchTerm ? 'No collaterals found matching your search.' : 'No collaterals available.'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredCollaterals.map((collateral) => (
                    <div
                      key={collateral.id}
                      onClick={() => handleCollateralSelect(collateral)}
                      style={{
                        padding: '12px',
                        border: selectedCollateral?.id === collateral.id 
                          ? '2px solid #007bff' 
                          : '1px solid #e0e0e0',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        backgroundColor: selectedCollateral?.id === collateral.id 
                          ? '#f0f8ff' 
                          : '#fff',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            fontWeight: '600', 
                            color: '#333',
                            marginBottom: '4px'
                          }}>
                            {collateral.collateralId} - {collateral.description}
                          </div>
                          <div style={{ 
                            fontSize: '12px', 
                            color: '#666',
                            marginBottom: '4px'
                          }}>
                            <strong>Type:</strong> {collateral.collateralType} | 
                            <strong> Value:</strong> {collateral.currency} {parseFloat(collateral.value || 0).toLocaleString()} |
                            <strong> Status:</strong> {collateral.status}
                          </div>
                          {collateral.location && (
                            <div style={{ 
                              fontSize: '12px', 
                              color: '#666',
                              marginBottom: '4px'
                            }}>
                              <strong>Location:</strong> {collateral.location}
                            </div>
                          )}
                          {collateral.documentNumber && (
                            <div style={{ 
                              fontSize: '12px', 
                              color: '#666'
                            }}>
                              <strong>Document:</strong> {collateral.documentNumber} ({collateral.documentType})
                            </div>
                          )}
                        </div>
                        {selectedCollateral?.id === collateral.id && (
                          <FiCheck style={{ color: '#007bff', marginLeft: '8px' }} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button 
            className="pill" 
            onClick={onClose}
            style={{ backgroundColor: '#6b7280', color: 'white' }}
          >
            Cancel
          </button>
          <button 
            className="pill" 
            onClick={handleConfirmSelection}
            disabled={!selectedCollateral}
            style={{ 
              backgroundColor: selectedCollateral ? '#007bff' : '#ccc',
              color: 'white'
            }}
          >
            Select Collateral
          </button>
        </div>
      </div>
    </div>
  );
}

export default CollateralLookupModal;


