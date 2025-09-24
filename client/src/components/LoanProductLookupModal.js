import React, { useState, useEffect } from 'react';
import { FiX, FiCheck, FiSearch } from 'react-icons/fi';
import axios from 'axios';

function LoanProductLookupModal({ isOpen, onClose, onSelectLoanProduct }) {
  const [loanProducts, setLoanProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLoanProduct, setSelectedLoanProduct] = useState(null);

  // Fetch loan products when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchLoanProducts();
    }
  }, [isOpen]);

  const fetchLoanProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3001/loan-products', {
        headers: { accessToken: localStorage.getItem('accessToken') }
      });
      setLoanProducts(response.data.entity || []);
    } catch (error) {
      console.error('Error fetching loan products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter loan products based on search term
  const filteredLoanProducts = loanProducts.filter(loanProduct =>
    (loanProduct.loanProductId && loanProduct.loanProductId.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (loanProduct.loanProductName && loanProduct.loanProductName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (loanProduct.description && loanProduct.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleLoanProductSelect = (loanProduct) => {
    setSelectedLoanProduct(loanProduct);
  };

  const handleConfirmSelection = () => {
    if (selectedLoanProduct) {
      onSelectLoanProduct(selectedLoanProduct);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedLoanProduct(null);
    setSearchTerm('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Select Loan Product</h2>
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
                placeholder="Search loan products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            {selectedLoanProduct && (
              <button
                className="role-select-tick"
                onClick={handleConfirmSelection}
                title="Select this loan product"
              >
                <FiCheck />
              </button>
            )}
          </div>

          {/* Loan Products Table */}
          <div className="modal-table-container">
            {loading ? (
              <div className="loading-message">Loading loan products...</div>
            ) : (
              <table className="modal-table">
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Product ID</th>
                    <th>Product Name</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLoanProducts.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="no-data">
                        {searchTerm ? 'No loan products found matching your search.' : 'No loan products available.'}
                      </td>
                    </tr>
                  ) : (
                    filteredLoanProducts.map((loanProduct) => (
                      <tr 
                        key={loanProduct.id} 
                        className={selectedLoanProduct?.id === loanProduct.id ? 'selected' : ''}
                        onClick={() => handleLoanProductSelect(loanProduct)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>
                          <input
                            type="radio"
                            name="loanProductSelection"
                            checked={selectedLoanProduct?.id === loanProduct.id}
                            onChange={() => handleLoanProductSelect(loanProduct)}
                          />
                        </td>
                        <td>{loanProduct.loanProductId}</td>
                        <td>{loanProduct.loanProductName}</td>
                        <td>{loanProduct.loanProductType || '-'}</td>
                        <td>
                          <span className={`status-badge status-${loanProduct.status.toLowerCase()}`}>
                            {loanProduct.status}
                          </span>
                        </td>
                        <td>{loanProduct.description || '-'}</td>
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

export default LoanProductLookupModal;

