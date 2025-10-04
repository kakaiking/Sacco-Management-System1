import React, { useState, useEffect } from 'react';
import { FiX, FiCheck, FiSearch } from 'react-icons/fi';
import axios from 'axios';

function ChargeLookupModal({ isOpen, onClose, onSelectCharge }) {
  const [charges, setCharges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCharge, setSelectedCharge] = useState(null);

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
      setCharges(response.data.entity || response.data || []);
    } catch (error) {
      console.error('Error fetching charges:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter charges based on search term
  const filteredCharges = charges.filter(charge => {
    const searchLower = searchTerm.toLowerCase();
    
    // Helper function to safely check if a field contains the search term
    const fieldContains = (field) => {
      return field && field.toString().toLowerCase().includes(searchLower);
    };
    
    // Search across charge fields
    return (
      fieldContains(charge.chargeId) ||
      fieldContains(charge.name) ||
      fieldContains(charge.currency) ||
      fieldContains(charge.amount) ||
      fieldContains(charge.status)
    );
  });

  const handleSelect = () => {
    if (selectedCharge) {
      onSelectCharge(selectedCharge);
      setSelectedCharge(null);
      setSearchTerm('');
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedCharge(null);
    setSearchTerm('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '800px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'var(--primary-700)' }}>
            Select Charge
          </h3>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--text-secondary)'
            }}
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ position: 'relative' }}>
            <FiSearch style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-secondary)'
            }} />
            <input
              type="text"
              placeholder="Search by Charge ID, name, currency..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 40px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              autoFocus
            />
          </div>
        </div>

        {/* Charges List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              Loading charges...
            </div>
          ) : filteredCharges.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              No charges found
            </div>
          ) : (
            filteredCharges.map((charge) => (
              <div
                key={charge.chargeId}
                onClick={() => setSelectedCharge(charge)}
                style={{
                  padding: '12px',
                  margin: '8px 0',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: selectedCharge?.chargeId === charge.chargeId ? 'var(--primary-50)' : 'transparent',
                  borderColor: selectedCharge?.chargeId === charge.chargeId ? 'var(--primary-300)' : 'var(--border)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (selectedCharge?.chargeId !== charge.chargeId) {
                    e.currentTarget.style.backgroundColor = 'var(--surface-2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedCharge?.chargeId !== charge.chargeId) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontWeight: '600', color: 'var(--primary-700)' }}>
                        {charge.chargeId}
                      </span>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        backgroundColor: 
                          charge.status === 'Active' ? 'rgba(16, 185, 129, 0.2)' :
                          charge.status === 'Inactive' ? 'rgba(239, 68, 68, 0.2)' :
                          'rgba(107, 114, 128, 0.2)',
                        color: 
                          charge.status === 'Active' ? '#059669' :
                          charge.status === 'Inactive' ? '#dc2626' :
                          '#6b7280'
                      }}>
                        {charge.status}
                      </span>
                    </div>
                    <div style={{ color: 'var(--text-primary)', marginTop: '4px' }}>
                      {charge.name}
                    </div>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '4px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <span>Currency: {charge.currency}</span>
                      <span>Amount: {charge.currency} {parseFloat(charge.amount).toFixed(2)}</span>
                    </div>
                  </div>
                  {selectedCharge?.chargeId === charge.chargeId && (
                    <FiCheck size={20} style={{ color: 'var(--primary-600)' }} />
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <button
            onClick={handleClose}
            style={{
              padding: '10px 20px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              backgroundColor: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSelect}
            disabled={!selectedCharge}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: selectedCharge ? 'var(--primary-500)' : 'var(--surface-3)',
              color: selectedCharge ? 'white' : 'var(--text-disabled)',
              cursor: selectedCharge ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Select Charge
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChargeLookupModal;






