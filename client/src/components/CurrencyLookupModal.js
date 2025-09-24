import React, { useState, useEffect } from 'react';
import { FiX, FiCheck, FiSearch } from 'react-icons/fi';
import axios from 'axios';

function CurrencyLookupModal({ isOpen, onClose, onSelectCurrency }) {
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState(null);

  // Fetch currencies when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCurrencies();
    }
  }, [isOpen]);

  const fetchCurrencies = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3001/currencies', {
        headers: { accessToken: localStorage.getItem('accessToken') }
      });
      setCurrencies(response.data.entity || []);
    } catch (error) {
      console.error('Error fetching currencies:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter currencies based on search term
  const filteredCurrencies = currencies.filter(currency =>
    currency.currencyCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    currency.currencyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (currency.symbol && currency.symbol.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (currency.country && currency.country.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCurrencySelect = (currency) => {
    setSelectedCurrency(currency);
  };

  const handleConfirmSelection = () => {
    if (selectedCurrency) {
      onSelectCurrency(selectedCurrency);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedCurrency(null);
    setSearchTerm('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Select Currency</h2>
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
                placeholder="Search currencies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            {selectedCurrency && (
              <button
                className="role-select-tick"
                onClick={handleConfirmSelection}
                title="Select this currency"
              >
                <FiCheck />
              </button>
            )}
          </div>

          {/* Currencies Table */}
          <div className="modal-table-container">
            {loading ? (
              <div className="loading-message">Loading currencies...</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Currency Code</th>
                    <th>Currency Name</th>
                    <th>Symbol</th>
                    <th>Country</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCurrencies.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="no-data">
                        {searchTerm ? 'No currencies found matching your search' : 'No currencies available'}
                      </td>
                    </tr>
                  ) : (
                    filteredCurrencies.map((currency) => (
                      <tr 
                        key={currency.id} 
                        className={selectedCurrency?.id === currency.id ? 'selected' : ''}
                        onClick={() => handleCurrencySelect(currency)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>
                          <input
                            type="radio"
                            name="currencySelection"
                            checked={selectedCurrency?.id === currency.id}
                            onChange={() => handleCurrencySelect(currency)}
                          />
                        </td>
                        <td>{currency.currencyCode}</td>
                        <td>{currency.currencyName}</td>
                        <td>{currency.symbol || '-'}</td>
                        <td>{currency.country || '-'}</td>
                        <td>
                          <span className={`status-badge status-${currency.status.toLowerCase()}`}>
                            {currency.status}
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

export default CurrencyLookupModal;