import React from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

function Pagination({ 
  currentPage, 
  totalItems, 
  itemsPerPage, 
  onPageChange, 
  onItemsPerPageChange 
}) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handleItemsPerPageChange = (e) => {
    onItemsPerPageChange(parseInt(e.target.value));
  };

  return (
    <div className="pagination">
      <div className="pagination__right">
        <label className="pagination__label">
          Items per page:
          <select 
            className="pagination__select" 
            value={itemsPerPage} 
            onChange={handleItemsPerPageChange}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={30}>30</option>
            <option value={40}>40</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </label>
        
        <span className="pagination__info">
          Showing {startItem}-{endItem} of {totalItems}
        </span>
        
        <button 
          className="pagination__button" 
          onClick={handlePrevious}
          disabled={currentPage === 1}
          title="Previous page"
        >
          <FiChevronLeft />
        </button>
        <button 
          className="pagination__button" 
          onClick={handleNext}
          disabled={currentPage === totalPages}
          title="Next page"
        >
          <FiChevronRight />
        </button>
      </div>
    </div>
  );
}

export default Pagination;
