import React, { useState, useEffect, useMemo } from 'react';
import { FiX, FiCheck, FiSearch } from 'react-icons/fi';
import axios from 'axios';
import Pagination from './Pagination';

function ProductLookupModal({ isOpen, onClose, onSelectProduct }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch products when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3001/products', {
        headers: { accessToken: localStorage.getItem('accessToken') }
      });
      setProducts(response.data.entity || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter products based on search term
  const filteredProducts = useMemo(() => {
    return products.filter(product =>
      product.productId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.productType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [products, searchTerm]);

  // Pagination logic
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
  };

  const handleConfirmSelection = () => {
    if (selectedProduct) {
      onSelectProduct(selectedProduct);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedProduct(null);
    setSearchTerm('');
    setCurrentPage(1);
    onClose();
  };

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSelectedProduct(null); // Clear selection when changing pages
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
    setSelectedProduct(null); // Clear selection
  };

  // Reset pagination when search term changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedProduct(null);
  }, [searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Select Product</h2>
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
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            {selectedProduct && (
              <button
                className="role-select-tick"
                onClick={handleConfirmSelection}
                title="Select this product"
              >
                <FiCheck />
              </button>
            )}
          </div>

          {/* Products Table */}
          <div className="modal-table-container">
            {loading ? (
              <div className="loading-message">Loading products...</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Product ID</th>
                    <th>Product Name</th>
                    <th>Product Type</th>
                    <th>Description</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="no-data">
                        {searchTerm ? 'No products found matching your search' : 'No products available'}
                      </td>
                    </tr>
                  ) : (
                    paginatedProducts.map((product) => (
                      <tr 
                        key={product.id} 
                        className={selectedProduct?.id === product.id ? 'selected' : ''}
                        onClick={() => handleProductSelect(product)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>
                          <input
                            type="radio"
                            name="productSelection"
                            checked={selectedProduct?.id === product.id}
                            onChange={() => handleProductSelect(product)}
                          />
                        </td>
                        <td>{product.productId}</td>
                        <td>{product.productName}</td>
                        <td>{product.productType}</td>
                        <td>{product.description || '-'}</td>
                        <td>
                          <span className={`status-badge status-${product.status.toLowerCase()}`}>
                            {product.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {filteredProducts.length > 0 && (
            <div className="modal-pagination">
              <Pagination
                currentPage={currentPage}
                totalItems={filteredProducts.length}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductLookupModal;
