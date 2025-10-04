import React, { useState, useEffect, useCallback } from 'react';
import { FiX, FiCheck, FiSearch } from 'react-icons/fi';
import axios from 'axios';

function AccountLookupModal({ isOpen, onClose, onSelectAccount, memberId, includeGLAccounts = true }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(null);

  // Define fetchAccounts function first
  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      let memberAccounts = [];
      let glAccounts = [];
      
      if (memberId) {
        // If memberId is provided, fetch only accounts for that specific member
        // For loan applications, we don't want GL accounts as repayment options
        try {
          const memberAccountsResponse = await axios.get(
            searchTerm 
              ? `http://localhost:3001/accounts/member/${memberId}?q=${encodeURIComponent(searchTerm)}`
              : `http://localhost:3001/accounts/member/${memberId}`, {
            headers: { accessToken: localStorage.getItem('accessToken') }
          });
          memberAccounts = memberAccountsResponse.data.entity || [];
        } catch (error) {
          console.error('Error fetching member accounts:', error);
          memberAccounts = [];
        }
        
        // Don't fetch GL accounts when memberId is provided (for loan applications)
        glAccounts = [];
      } else {
        // If no memberId, fetch all accounts (original behavior)
        // Fetch member accounts
        const memberAccountsPromise = axios.get(searchTerm 
          ? `http://localhost:3001/accounts?q=${encodeURIComponent(searchTerm)}`
          : 'http://localhost:3001/accounts', {
          headers: { accessToken: localStorage.getItem('accessToken') }
        }).catch(error => {
          console.error('Error fetching member accounts:', error);
          return { data: { entity: [] } };
        });

        // Only fetch GL accounts if includeGLAccounts is true
        const promises = [memberAccountsPromise];
        
        if (includeGLAccounts) {
          const glAccountsPromise = axios.get(searchTerm 
            ? `http://localhost:3001/gl-accounts?q=${encodeURIComponent(searchTerm)}`
            : 'http://localhost:3001/gl-accounts', {
            headers: { accessToken: localStorage.getItem('accessToken') }
          }).catch(error => {
            console.error('Error fetching GL accounts:', error);
            return { data: { entity: [] } };
          });
          promises.push(glAccountsPromise);
        }

        const responses = await Promise.all(promises);
        
        memberAccounts = responses[0].data.entity || [];
        glAccounts = includeGLAccounts && responses[1] ? (responses[1].data.entity || []) : [];
      }
      
      // Transform GL accounts to match the expected format
      const transformedGLAccounts = glAccounts.map(account => ({
        id: account.id,
        accountId: account.glAccountId, // Use glAccountId as the accountId
        accountName: account.accountName,
        accountType: 'GL_ACCOUNT',
        accountCategory: account.accountCategory,
        availableBalance: account.availableBalance,
        status: account.status,
        saccoId: account.saccoId, // Include SACCO ID
        sacco: account.sacco, // Include SACCO object
        // Add GL-specific fields
        glAccountId: account.glAccountId,
        normalBalance: account.normalBalance,
        isParentAccount: account.isParentAccount
      }));
      
      // Combine both account types
      const allAccounts = [...memberAccounts, ...transformedGLAccounts];
      setAccounts(allAccounts);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, memberId, includeGLAccounts]);

  // Fetch accounts when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAccounts();
    }
  }, [isOpen, fetchAccounts]);

  // Fetch accounts when search term changes
  useEffect(() => {
    if (isOpen) {
      const timeoutId = setTimeout(() => {
        fetchAccounts();
      }, 300); // Debounce search
      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, isOpen, fetchAccounts]);

  const handleAccountSelect = (account) => {
    setSelectedAccount(account);
  };

  const handleConfirmSelection = () => {
    if (selectedAccount) {
      onSelectAccount(selectedAccount);
      onClose();
    }
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
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '80vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '16px'
        }}>
          <h2 style={{
            margin: 0,
            color: 'var(--primary-700)',
            fontSize: '20px',
            fontWeight: '600'
          }}>
            {memberId ? 'Select Member Account for Repayment' : (includeGLAccounts ? 'Select Account (Member & GL Accounts)' : 'Select Account')}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: 'var(--muted-text)',
              padding: '4px'
            }}
          >
            <FiX />
          </button>
        </div>

        {/* Search Bar */}
        <div style={{
          position: 'relative',
          marginBottom: '20px'
        }}>
          <FiSearch style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--muted-text)',
            fontSize: '16px'
          }} />
          <input
            type="text"
            placeholder={memberId ? "Search member accounts by name or ID..." : "Search by account name, account ID, or member name..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 12px 12px 40px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--primary-500)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
          />
        </div>

        {/* Accounts List */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          border: '1px solid var(--border)',
          borderRadius: '8px'
        }}>
          {loading ? (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              color: 'var(--muted-text)'
            }}>
              Loading accounts...
            </div>
          ) : accounts.length === 0 ? (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              color: 'var(--muted-text)'
            }}>
              {searchTerm ? 'No accounts found matching your search.' : 'No accounts available.'}
            </div>
          ) : (
            <div style={{ maxHeight: '400px', overflow: 'auto' }}>
              {accounts.map((account) => (
                <div
                  key={account.id}
                  onClick={() => handleAccountSelect(account)}
                  style={{
                    padding: '16px',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    backgroundColor: selectedAccount?.id === account.id ? 'var(--primary-50)' : 'white',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedAccount?.id !== account.id) {
                      e.target.style.backgroundColor = 'var(--gray-50)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedAccount?.id !== account.id) {
                      e.target.style.backgroundColor = 'white';
                    }
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '4px'
                      }}>
                        <span style={{
                          fontWeight: '600',
                          color: 'var(--primary-700)',
                          fontSize: '14px'
                        }}>
                          {account.accountId}
                        </span>
                      </div>
                      
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: 'var(--text-primary)',
                        marginBottom: '4px'
                      }}>
                        {account.shortName || account.accountName || 'Unnamed Account'}
                      </div>
                      
                      {account.accountType === 'GL_ACCOUNT' ? (
                        <>
                          <div style={{
                            fontSize: '13px',
                            color: 'var(--muted-text)',
                            marginBottom: '2px'
                          }}>
                            Type: <span style={{ color: 'var(--primary-500)', fontWeight: '500' }}>GL Account</span>
                          </div>
                          
                          <div style={{
                            fontSize: '13px',
                            color: 'var(--muted-text)'
                          }}>
                            Category: {account.accountCategory} ({account.normalBalance})
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{
                            fontSize: '13px',
                            color: 'var(--muted-text)',
                            marginBottom: '2px'
                          }}>
                            Member: {account.member ? `${account.member.firstName} ${account.member.lastName}` : 'N/A'}
                            {account.member && (
                              <span style={{ marginLeft: '8px', color: 'var(--primary-500)' }}>
                                ({account.member.memberNo})
                              </span>
                            )}
                          </div>
                          
                          <div style={{
                            fontSize: '13px',
                            color: 'var(--muted-text)'
                          }}>
                            Product: {account.product ? account.product.productName : 'N/A'}
                          </div>
                        </>
                      )}
                      
                      <div style={{
                        fontSize: '13px',
                        color: 'var(--muted-text)',
                        marginTop: '4px'
                      }}>
                        Balance: {account.availableBalance ? `$${parseFloat(account.availableBalance).toFixed(2)}` : '$0.00'}
                      </div>
                    </div>
                    
                    {selectedAccount?.id === account.id && (
                      <div style={{
                        color: 'var(--primary-500)',
                        fontSize: '20px'
                      }}>
                        <FiCheck />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border)'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              backgroundColor: 'white',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmSelection}
            disabled={!selectedAccount}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: selectedAccount ? 'var(--primary-500)' : 'var(--gray-300)',
              color: 'white',
              cursor: selectedAccount ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Select Account
          </button>
        </div>
      </div>
    </div>
  );
}

export default AccountLookupModal;
