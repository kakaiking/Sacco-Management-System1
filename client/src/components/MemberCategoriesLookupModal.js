import React, { useState, useEffect } from 'react';
import { FiX, FiCheck, FiSearch } from 'react-icons/fi';
import axios from 'axios';

function MemberCategoriesLookupModal({ isOpen, onClose, onSelectMemberCategory }) {
  const [memberCategories, setMemberCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMemberCategory, setSelectedMemberCategory] = useState(null);

  // Fetch member categories when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchMemberCategories();
    }
  }, [isOpen]);

  // Cleanup function to prevent memory leaks
  useEffect(() => {
    return () => {
      // Cancel any pending requests when component unmounts
      setLoading(false);
    };
  }, []);

  const fetchMemberCategories = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3001/member-categories', {
        headers: { accessToken: localStorage.getItem('accessToken') }
      });
      // Only update state if component is still mounted
      if (response.data && response.data.entity) {
        setMemberCategories(response.data.entity);
      } else {
        setMemberCategories([]);
      }
    } catch (error) {
      console.error('Error fetching member categories:', error);
      setMemberCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter member categories based on search term
  const filteredMemberCategories = memberCategories.filter(memberCategory =>
    (memberCategory.memberCategoryId && memberCategory.memberCategoryId.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (memberCategory.memberCategoryName && memberCategory.memberCategoryName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (memberCategory.description && memberCategory.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleMemberCategorySelect = (memberCategory) => {
    setSelectedMemberCategory(memberCategory);
  };

  const handleConfirmSelection = () => {
    if (selectedMemberCategory) {
      onSelectMemberCategory(selectedMemberCategory);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedMemberCategory(null);
    setSearchTerm('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Select Member Category</h2>
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
                placeholder="Search member categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            {selectedMemberCategory && (
              <button
                className="role-select-tick"
                onClick={handleConfirmSelection}
                title="Select this member category"
              >
                <FiCheck />
              </button>
            )}
          </div>

          {/* Member Categories Table */}
          <div className="modal-table-container">
            {loading ? (
              <div className="loading-message">Loading member categories...</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Category ID</th>
                    <th>Category Name</th>
                    <th>Description</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMemberCategories.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="no-data">
                        {searchTerm ? 'No member categories found matching your search' : 'No member categories available'}
                      </td>
                    </tr>
                  ) : (
                    filteredMemberCategories.map((memberCategory) => (
                      <tr 
                        key={memberCategory.id} 
                        className={selectedMemberCategory?.id === memberCategory.id ? 'selected' : ''}
                        onClick={() => handleMemberCategorySelect(memberCategory)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>
                          <input
                            type="radio"
                            name="memberCategorySelection"
                            checked={selectedMemberCategory?.id === memberCategory.id}
                            onChange={() => handleMemberCategorySelect(memberCategory)}
                          />
                        </td>
                        <td>{memberCategory.memberCategoryId}</td>
                        <td>{memberCategory.memberCategoryName}</td>
                        <td>{memberCategory.description || '-'}</td>
                        <td>
                          <span className={`status-badge status-${memberCategory.status.toLowerCase()}`}>
                            {memberCategory.status}
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

export default MemberCategoriesLookupModal;
