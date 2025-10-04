import React, { useState, useEffect, useContext } from 'react';
import { FiX, FiSearch } from 'react-icons/fi';
import axios from 'axios';
import { AuthContext } from "../helpers/AuthContext";

const TransactionLookupModal = ({ isOpen, onClose, onSelectTransaction }) => {
  const { authState } = useContext(AuthContext);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('TRANSFER');

  useEffect(() => {
    if (isOpen) {
      fetchTransactions();
    }
  }, [isOpen, filterType]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3001/transactions', {
        headers: { accessToken: localStorage.getItem("accessToken") },
        params: {
          type: filterType,
          saccoId: authState?.saccoId
        }
      });
      setTransactions(response.data?.entity || response.data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      transaction.transactionId?.toLowerCase().includes(searchLower) ||
      transaction.referenceNumber?.toLowerCase().includes(searchLower) ||
      transaction.status?.toLowerCase().includes(searchLower)
    );
  });

  const handleSelect = (transaction) => {
    onSelectTransaction(transaction);
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
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        width: '100%',
        maxWidth: '900px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '2px solid #e0e0e0'
        }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#1a1a1a' }}>
            Transaction Lookup
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.color = '#000'}
            onMouseLeave={(e) => e.target.style.color = '#666'}
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Search and Filter */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr auto',
          gap: '12px',
          marginBottom: '16px' 
        }}>
          <div style={{ position: 'relative' }}>
            <FiSearch style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#999',
              fontSize: '18px'
            }} />
            <input
              type="text"
              placeholder="Search by Transaction ID, Reference Number, or Status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 40px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#007bff'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              padding: '10px 12px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              cursor: 'pointer',
              minWidth: '150px'
            }}
          >
            <option value="">All Types</option>
            <option value="TRANSFER">Transfer</option>
            <option value="DEPOSIT">Deposit</option>
            <option value="WITHDRAWAL">Withdrawal</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        {/* Table */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto',
          border: '1px solid #e0e0e0',
          borderRadius: '8px'
        }}>
          {loading ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px',
              color: '#666'
            }}>
              Loading transactions...
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px',
              color: '#666'
            }}>
              No transactions found
            </div>
          ) : (
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#495057',
                    borderBottom: '2px solid #dee2e6',
                    position: 'sticky',
                    top: 0,
                    backgroundColor: '#f8f9fa',
                    zIndex: 1
                  }}>
                    Transaction ID
                  </th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#495057',
                    borderBottom: '2px solid #dee2e6',
                    position: 'sticky',
                    top: 0,
                    backgroundColor: '#f8f9fa',
                    zIndex: 1
                  }}>
                    Reference
                  </th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#495057',
                    borderBottom: '2px solid #dee2e6',
                    position: 'sticky',
                    top: 0,
                    backgroundColor: '#f8f9fa',
                    zIndex: 1
                  }}>
                    Type
                  </th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#495057',
                    borderBottom: '2px solid #dee2e6',
                    position: 'sticky',
                    top: 0,
                    backgroundColor: '#f8f9fa',
                    zIndex: 1
                  }}>
                    Amount
                  </th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#495057',
                    borderBottom: '2px solid #dee2e6',
                    position: 'sticky',
                    top: 0,
                    backgroundColor: '#f8f9fa',
                    zIndex: 1
                  }}>
                    Status
                  </th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'center',
                    fontWeight: '600',
                    color: '#495057',
                    borderBottom: '2px solid #dee2e6',
                    position: 'sticky',
                    top: 0,
                    backgroundColor: '#f8f9fa',
                    zIndex: 1
                  }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction, index) => (
                  <tr
                    key={transaction.id || index}
                    style={{
                      borderBottom: '1px solid #e9ecef',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '12px' }}>
                      {transaction.transactionId || 'N/A'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {transaction.referenceNumber || 'N/A'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {transaction.type || 'N/A'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {transaction.amount ? parseFloat(transaction.amount).toFixed(2) : '0.00'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: 
                          transaction.status === 'Approved' ? 'rgba(16, 185, 129, 0.2)' :
                          transaction.status === 'Pending' ? 'rgba(6, 182, 212, 0.2)' :
                          transaction.status === 'Returned' ? 'rgba(249, 115, 22, 0.2)' :
                          transaction.status === 'Rejected' ? 'rgba(239, 68, 68, 0.2)' :
                          'rgba(107, 114, 128, 0.2)',
                        color: 
                          transaction.status === 'Approved' ? '#059669' :
                          transaction.status === 'Pending' ? '#0891b2' :
                          transaction.status === 'Returned' ? '#ea580c' :
                          transaction.status === 'Rejected' ? '#dc2626' :
                          '#6b7280'
                      }}>
                        {transaction.status || 'Pending'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleSelect(transaction)}
                        style={{
                          padding: '6px 16px',
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '500',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#0056b3'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#007bff'}
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionLookupModal;



