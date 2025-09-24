import React, { useContext, useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import axios from "axios";
import { FiEye, FiEdit3, FiTrash2, FiCheckCircle, FiClock, FiRotateCcw } from "react-icons/fi";
import { FaPlus } from 'react-icons/fa';
import DashboardWrapper from '../components/DashboardWrapper';
import Pagination from '../components/Pagination';
import { useSnackbar } from "../helpers/SnackbarContext";
import { AuthContext } from "../helpers/AuthContext";
import { usePermissions } from "../hooks/usePermissions";
import { PERMISSIONS } from "../helpers/PermissionUtils";
import frontendLoggingService from "../services/frontendLoggingService";

function InterestCalculationRulesMaintenance() {
  const history = useHistory();
  const { showMessage } = useSnackbar();
  const { authState, isLoading } = useContext(AuthContext);
  const { canAdd, canEdit, canDelete, canApprove } = usePermissions();

  useEffect(() => {
    // Only redirect if authentication check is complete and user is not authenticated
    if (!isLoading && !authState.status) {
      history.push("/login");
    } else if (!isLoading && authState.status) {
      // Log page view when user is authenticated
      frontendLoggingService.logView("InterestCalculationRules", null, null, "Viewed Interest Calculation Rules Maintenance page");
    }
  }, [authState, isLoading, history]);

  const [interestCalculationRules, setInterestCalculationRules] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedInterestCalculationRules, setSelectedInterestCalculationRules] = useState([]);
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState("");
  const [sortField] = useState("createdOn");
  const [sortDirection] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const controller = new AbortController();
    const fetchInterestCalculationRules = async () => {
      try {
        const params = {};
        if (statusFilter) params.status = statusFilter;
        if (search) params.q = search;
        const res = await axios.get("http://localhost:3001/interest-calculation-rules", {
          headers: { accessToken: localStorage.getItem("accessToken") },
          params,
          signal: controller.signal,
        });
        const payload = res?.data?.entity ?? res?.data;
        setInterestCalculationRules(Array.isArray(payload) ? payload : []);
      } catch {}
    };
    fetchInterestCalculationRules();
    return () => controller.abort();
  }, [statusFilter, search]);

  const counts = useMemo(() => {
    const list = Array.isArray(interestCalculationRules) ? interestCalculationRules : [];
    const c = { Active: 0, Inactive: 0, Pending: 0 };
    for (const rule of list) {
      if (rule.status && c[rule.status] !== undefined) c[rule.status] += 1;
    }
    return c;
  }, [interestCalculationRules]);

  const sortedInterestCalculationRules = useMemo(() => {
    const list = Array.isArray(interestCalculationRules) ? interestCalculationRules : [];
    return [...list].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle date sorting
      if (sortField === 'createdOn') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      // Handle string sorting (case insensitive)
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortDirection === 'asc' ? 1 : -1;
      if (bValue == null) return sortDirection === 'asc' ? -1 : 1;

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [interestCalculationRules, sortField, sortDirection]);

  // Pagination logic
  const paginatedInterestCalculationRules = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedInterestCalculationRules.slice(startIndex, endIndex);
  }, [sortedInterestCalculationRules, currentPage, itemsPerPage]);

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSelectedInterestCalculationRules([]); // Clear selection when changing pages
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
    setSelectedInterestCalculationRules([]); // Clear selection
  };

  // Selection functions
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedInterestCalculationRules(paginatedInterestCalculationRules.map(rule => rule.id));
    } else {
      setSelectedInterestCalculationRules([]);
    }
  };

  const handleSelectInterestCalculationRule = (interestCalculationRuleId, checked) => {
    if (checked) {
      setSelectedInterestCalculationRules(prev => [...prev, interestCalculationRuleId]);
    } else {
      setSelectedInterestCalculationRules(prev => prev.filter(id => id !== interestCalculationRuleId));
    }
  };

  const isAllSelected = selectedInterestCalculationRules.length === paginatedInterestCalculationRules.length && paginatedInterestCalculationRules.length > 0;
  const isIndeterminate = selectedInterestCalculationRules.length > 0 && selectedInterestCalculationRules.length < paginatedInterestCalculationRules.length;

  // Show/hide batch actions based on selection
  useEffect(() => {
    setShowBatchActions(selectedInterestCalculationRules.length > 0);
  }, [selectedInterestCalculationRules]);

  // Status change functions
  const handleStatusChange = (action) => {
    setStatusAction(action);
    setShowStatusModal(true);
  };

  const confirmStatusChange = async () => {
    try {
      // Get before data for logging
      const beforeData = selectedInterestCalculationRules.map(interestCalculationRuleId => {
        const rule = interestCalculationRules.find(rule => rule.id === interestCalculationRuleId);
        return {
          id: interestCalculationRuleId,
          ruleId: rule?.ruleId,
          ruleName: rule?.ruleName,
          status: rule?.status
        };
      });

      const promises = selectedInterestCalculationRules.map(interestCalculationRuleId => 
        axios.put(`http://localhost:3001/interest-calculation-rules/${interestCalculationRuleId}/status`, {
          status: statusAction
        }, {
          headers: { accessToken: localStorage.getItem("accessToken") }
        })
      );
      
      await Promise.all(promises);
      
      // Prepare after data for logging
      const afterData = beforeData.map(rule => ({
        ...rule,
        status: statusAction
      }));

      // Log the update action with before/after data
      frontendLoggingService.logUpdate(
        "InterestCalculationRules", 
        selectedInterestCalculationRules.join(','), 
        `${selectedInterestCalculationRules.length} interest calculation rules`, 
        beforeData, 
        afterData, 
        `Updated status to ${statusAction} for ${selectedInterestCalculationRules.length} interest calculation rules`
      );
      
      // Update local state
      setInterestCalculationRules(prev => prev.map(rule => 
        selectedInterestCalculationRules.includes(rule.id) 
          ? { ...rule, status: statusAction }
          : rule
      ));
      
      showMessage(`${statusAction} ${selectedInterestCalculationRules.length} interest calculation rule(s) successfully`, "success");
      setSelectedInterestCalculationRules([]);
      setShowStatusModal(false);
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to update interest calculation rule status";
      showMessage(msg, "error");
    }
  };

  return (
    <DashboardWrapper>
      <header className="header">
        <div className="header__left">
          <div className="greeting">Interest Calculation Rules Maintenance</div>
        </div>
      </header>

      <main className="dashboard__content">
        <section className="cards cards--status">
          <div className="card card--approved">
            <div className="card__icon">
              <FiCheckCircle />
            </div>
            <div className="card__content">
              <h4>Active</h4>
              <div className="card__kpi">{counts.Active}</div>
            </div>
          </div>
          <div className="card card--pending">
            <div className="card__icon">
              <FiClock />
            </div>
            <div className="card__content">
              <h4>Pending</h4>
              <div className="card__kpi">{counts.Pending}</div>
            </div>
          </div>
          <div className="card card--returned">
            <div className="card__icon">
              <FiRotateCcw />
            </div>
            <div className="card__content">
              <h4>Inactive</h4>
              <div className="card__kpi">{counts.Inactive}</div>
            </div>
          </div>
        </section>

        <section className="card" style={{ padding: 12 }}>
          <div className="tableToolbar">
            <select className="statusSelect" value={statusFilter} onChange={e => {
              frontendLoggingService.logFilter("Status", e.target.value, "InterestCalculationRules", `Filtered interest calculation rules by status: ${e.target.value || 'All'}`);
              setStatusFilter(e.target.value);
            }}>
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Inactive">Inactive</option>
            </select>

            <div className="searchWrapper">
              <input className="searchInput" value={search} onChange={e => {
                if (e.target.value.length > 2 || e.target.value.length === 0) {
                  frontendLoggingService.logSearch(e.target.value, "InterestCalculationRules", null, `Searched for interest calculation rules: "${e.target.value}"`);
                }
                setSearch(e.target.value);
              }} placeholder="Search interest calculation rules..." />
              <span className="searchIcon">🔍</span>
            </div>

            {canAdd(PERMISSIONS.INTEREST_CALCULATION_RULES_MAINTENANCE) ? (
              <button 
                className="pill" 
                onClick={() => {
                  frontendLoggingService.logButtonClick("Add Interest Calculation Rule", "InterestCalculationRules", null, "Clicked Add Interest Calculation Rule button");
                  history.push("/interest-calculation-rules/new");
                }}
                style={{
                  backgroundColor: "var(--primary-500)",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "12px",
                  fontSize: "16px",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: "0 2px 8px rgba(63, 115, 179, 0.2)"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "var(--primary-600)";
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 4px 12px rgba(63, 115, 179, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "var(--primary-500)";
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 2px 8px rgba(63, 115, 179, 0.2)";
                }}
                title="Add Interest Calculation Rule"
              >
                <FaPlus />
                Add Interest Calculation Rule
              </button>
            ) : (
              <button 
                className="pill" 
                onClick={() => showMessage("Your role lacks permission to add interest calculation rules", "error")}
                style={{
                  backgroundColor: "var(--muted-text)",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "12px",
                  fontSize: "16px",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "not-allowed",
                  opacity: 0.6
                }}
                title="Add Interest Calculation Rule - No Permission"
                disabled
              >
                <FaPlus />
                Add Interest Calculation Rule
              </button>
            )}

            {/* Batch Action Buttons */}
            {showBatchActions && canApprove(PERMISSIONS.INTEREST_CALCULATION_RULES_MAINTENANCE) && (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "14px", color: "var(--muted-text)", marginRight: "8px" }}>
                  {selectedInterestCalculationRules.length} selected
                </span>
                <button 
                  className="pill" 
                  onClick={() => {
                    frontendLoggingService.logButtonClick("Activate Interest Calculation Rules", "InterestCalculationRules", null, `Clicked Activate button for ${selectedInterestCalculationRules.length} selected interest calculation rules`);
                    handleStatusChange("Active");
                  }}
                  style={{
                    backgroundColor: "#10b981",
                    color: "white",
                    border: "none",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  Activate
                </button>
                <button 
                  className="pill" 
                  onClick={() => {
                    frontendLoggingService.logButtonClick("Deactivate Interest Calculation Rules", "InterestCalculationRules", null, `Clicked Deactivate button for ${selectedInterestCalculationRules.length} selected interest calculation rules`);
                    handleStatusChange("Inactive");
                  }}
                  style={{
                    backgroundColor: "#ef4444",
                    color: "white",
                    border: "none",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  Deactivate
                </button>
              </div>
            )}

          </div>

          <div className="tableContainer">
            <table className="table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={input => {
                        if (input) input.indeterminate = isIndeterminate;
                      }}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      style={{ cursor: "pointer" }}
                    />
                  </th>
                  <th>
                    Rule ID
                    {sortField === 'ruleId' && (
                      <span style={{ marginLeft: '8px', color: 'var(--primary-500)' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th>
                    Rule Name
                    {sortField === 'ruleName' && (
                      <span style={{ marginLeft: '8px', color: 'var(--primary-500)' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th>Description</th>
                  <th>
                    Created On
                    {sortField === 'createdOn' && (
                      <span style={{ marginLeft: '8px', color: 'var(--primary-500)' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th>Created By</th>
                  <th>
                    Status
                    {sortField === 'status' && (
                      <span style={{ marginLeft: '8px', color: 'var(--primary-500)' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedInterestCalculationRules.map(rule => (
                  <tr key={rule.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedInterestCalculationRules.includes(rule.id)}
                        onChange={(e) => handleSelectInterestCalculationRule(rule.id, e.target.checked)}
                        style={{ cursor: "pointer" }}
                      />
                    </td>
                    <td>{rule.ruleId}</td>
                    <td>{rule.ruleName}</td>
                    <td>{rule.description || '-'}</td>
                    <td>{rule.createdOn ? new Date(rule.createdOn).toLocaleDateString() : '-'}</td>
                    <td>{rule.createdBy || '-'}</td>
                    <td>
                      <div 
                        style={{
                          display: "inline-block",
                          padding: "6px 12px",
                          borderRadius: "16px",
                          fontSize: "12px",
                          fontWeight: "600",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          backgroundColor: 
                            rule.status === "Active" ? "rgba(16, 185, 129, 0.2)" :
                            rule.status === "Pending" ? "rgba(6, 182, 212, 0.2)" :
                            rule.status === "Inactive" ? "rgba(239, 68, 68, 0.2)" :
                            "rgba(107, 114, 128, 0.2)",
                          color: 
                            rule.status === "Active" ? "#059669" :
                            rule.status === "Pending" ? "#0891b2" :
                            rule.status === "Inactive" ? "#dc2626" :
                            "#6b7280",
                          border: `1px solid ${
                            rule.status === "Active" ? "rgba(16, 185, 129, 0.3)" :
                            rule.status === "Pending" ? "rgba(6, 182, 212, 0.3)" :
                            rule.status === "Inactive" ? "rgba(239, 68, 68, 0.3)" :
                            "rgba(107, 114, 128, 0.3)"
                          }`
                        }}
                      >
                        {rule.status}
                      </div>
                    </td>
                    <td className="actions">
                      <button className="action-btn action-btn--view" onClick={() => {
                        frontendLoggingService.logView("InterestCalculationRules", rule.id, rule.ruleName, "Viewed interest calculation rule details");
                        history.push(`/interest-calculation-rules/${rule.id}`);
                      }} title="View">
                        <FiEye />
                      </button>
                      {canEdit(PERMISSIONS.INTEREST_CALCULATION_RULES_MAINTENANCE) ? (
                        <button className="action-btn action-btn--edit" onClick={() => {
                          frontendLoggingService.logButtonClick("Edit Interest Calculation Rule", "InterestCalculationRules", rule.id, `Clicked Edit button for interest calculation rule: ${rule.ruleName}`);
                          history.push(`/interest-calculation-rules/${rule.id}?edit=1`);
                        }} title="Update">
                          <FiEdit3 />
                        </button>
                      ) : (
                        <button 
                          className="action-btn action-btn--edit" 
                          onClick={() => showMessage("Your role lacks permission to edit interest calculation rules", "error")} 
                          title="Update - No Permission"
                          style={{ opacity: 0.5, cursor: "not-allowed" }}
                          disabled
                        >
                          <FiEdit3 />
                        </button>
                      )}
                      {canDelete(PERMISSIONS.INTEREST_CALCULATION_RULES_MAINTENANCE) ? (
                        <button className="action-btn action-btn--delete" onClick={async () => {
                          try {
                            // Log the delete action with interest calculation rule data before deletion
                            frontendLoggingService.logDelete("InterestCalculationRules", rule.id, rule.ruleName, {
                              ruleId: rule.ruleId,
                              ruleName: rule.ruleName,
                              status: rule.status
                            }, `Deleted interest calculation rule: ${rule.ruleName}`);
                            
                            await axios.delete(`http://localhost:3001/interest-calculation-rules/${rule.id}`, { headers: { accessToken: localStorage.getItem("accessToken") } });
                            setInterestCalculationRules(curr => curr.filter(x => x.id !== rule.id));
                            showMessage("Interest calculation rule deleted successfully", "success");
                          } catch (err) {
                            const msg = err?.response?.data?.error || "Failed to delete interest calculation rule";
                            showMessage(msg, "error");
                          }
                        }} title="Delete">
                          <FiTrash2 />
                        </button>
                      ) : (
                        <button 
                          className="action-btn action-btn--delete" 
                          onClick={() => showMessage("Your role lacks permission to delete interest calculation rules", "error")} 
                          title="Delete - No Permission"
                          style={{ opacity: 0.5, cursor: "not-allowed" }}
                          disabled
                        >
                          <FiTrash2 />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={sortedInterestCalculationRules.length}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </section>
      </main>

      {/* Status Change Modal */}
      {showStatusModal && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000
          }}
          onClick={() => setShowStatusModal(false)}
        >
          <div 
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "24px",
              width: "90%",
              maxWidth: "500px",
              maxHeight: "80vh",
              overflow: "auto"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 20px 0", color: "var(--primary-700)" }}>
              Confirm Status Change
            </h3>
            
            <p style={{ marginBottom: "20px", color: "var(--muted-text)", textAlign: "center" }}>
              You are about to {statusAction === "Inactive" ? "Deactivate" : statusAction} {selectedInterestCalculationRules.length} {selectedInterestCalculationRules.length === 1 ? 'record' : 'records'}.
            </p>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowStatusModal(false)}
                style={{
                  padding: "8px 16px",
                  border: "1px solid var(--muted-text)",
                  borderRadius: "6px",
                  backgroundColor: "white",
                  color: "var(--muted-text)",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                style={{
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: "6px",
                  backgroundColor: statusAction === "Inactive" ? "#ef4444" : "#10b981",
                  color: "white",
                  cursor: "pointer"
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardWrapper>
  );
}

export default InterestCalculationRulesMaintenance;

