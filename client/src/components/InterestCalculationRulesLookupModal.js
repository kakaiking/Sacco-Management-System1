import React, { useState, useEffect } from 'react';
import { FiX, FiCheck, FiSearch } from 'react-icons/fi';
import axios from 'axios';

function InterestCalculationRulesLookupModal({ isOpen, onClose, onSelectCalculationRule }) {
  const [calculationRules, setCalculationRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCalculationRule, setSelectedCalculationRule] = useState(null);

  // Fetch calculation rules when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCalculationRules();
    }
  }, [isOpen]);

  const fetchCalculationRules = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3001/interest-calculation-rules', {
        headers: { accessToken: localStorage.getItem('accessToken') }
      });
      setCalculationRules(response.data.entity || []);
    } catch (error) {
      console.error('Error fetching calculation rules:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter calculation rules based on search term
  const filteredCalculationRules = calculationRules.filter(calculationRule =>
    calculationRule.ruleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    calculationRule.ruleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (calculationRule.description && calculationRule.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCalculationRuleSelect = (calculationRule) => {
    setSelectedCalculationRule(calculationRule);
  };

  const handleConfirmSelection = () => {
    if (selectedCalculationRule) {
      onSelectCalculationRule(selectedCalculationRule);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedCalculationRule(null);
    setSearchTerm('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Select Interest Calculation Rule</h2>
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
                placeholder="Search calculation rules..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            {selectedCalculationRule && (
              <button
                className="role-select-tick"
                onClick={handleConfirmSelection}
                title="Select this calculation rule"
              >
                <FiCheck />
              </button>
            )}
          </div>

          {/* Calculation Rules Table */}
          <div className="modal-table-container">
            {loading ? (
              <div className="loading-message">Loading calculation rules...</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Rule ID</th>
                    <th>Rule Name</th>
                    <th>Description</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCalculationRules.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="no-data">
                        {searchTerm ? 'No calculation rules found matching your search' : 'No calculation rules available'}
                      </td>
                    </tr>
                  ) : (
                    filteredCalculationRules.map((calculationRule) => (
                      <tr 
                        key={calculationRule.id} 
                        className={selectedCalculationRule?.id === calculationRule.id ? 'selected' : ''}
                        onClick={() => handleCalculationRuleSelect(calculationRule)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>
                          <input
                            type="radio"
                            name="calculationRuleSelection"
                            checked={selectedCalculationRule?.id === calculationRule.id}
                            onChange={() => handleCalculationRuleSelect(calculationRule)}
                          />
                        </td>
                        <td>{calculationRule.ruleId}</td>
                        <td>{calculationRule.ruleName}</td>
                        <td>{calculationRule.description || '-'}</td>
                        <td>
                          <span className={`status-badge status-${calculationRule.status.toLowerCase()}`}>
                            {calculationRule.status}
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

export default InterestCalculationRulesLookupModal;
