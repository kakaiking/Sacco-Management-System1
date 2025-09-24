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

function InterestFrequencyMaintenance() {
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
      frontendLoggingService.logView("InterestFrequency", null, null, "Viewed Interest Frequency Maintenance page");
    }
  }, [authState, isLoading, history]);

  const [interestFrequencies, setInterestFrequencies] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedInterestFrequencies, setSelectedInterestFrequencies] = useState([]);
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState("");
  const [sortField] = useState("createdOn");
  const [sortDirection] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const controller = new AbortController();
    const fetchInterestFrequencies = async () => {
      try {
        const params = {};
        if (statusFilter) params.status = statusFilter;
        if (search) params.q = search;
        const res = await axios.get("http://localhost:3001/interest-frequency", {
          headers: { accessToken: localStorage.getItem("accessToken") },
          params,
          signal: controller.signal,
        });
        const payload = res?.data?.entity ?? res?.data;
        setInterestFrequencies(Array.isArray(payload) ? payload : []);
      } catch {}
    };
    fetchInterestFrequencies();
    return () => controller.abort();
  }, [statusFilter, search]);

  const counts = useMemo(() => {
    const list = Array.isArray(interestFrequencies) ? interestFrequencies : [];
    const c = { Active: 0, Inactive: 0, Pending: 0 };
    for (const interestFrequency of list) {
      if (interestFrequency.status && c[interestFrequency.status] !== undefined) c[interestFrequency.status] += 1;
    }
    return c;
  }, [interestFrequencies]);

  const sortedInterestFrequencies = useMemo(() => {
    const list = Array.isArray(interestFrequencies) ? interestFrequencies : [];
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
  }, [interestFrequencies, sortField, sortDirection]);

  // Pagination logic
  const paginatedInterestFrequencies = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedInterestFrequencies.slice(startIndex, endIndex);
  }, [sortedInterestFrequencies, currentPage, itemsPerPage]);

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSelectedInterestFrequencies([]); // Clear selection when changing pages
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
    setSelectedInterestFrequencies([]); // Clear selection
  };

  // Selection functions
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedInterestFrequencies(paginatedInterestFrequencies.map(interestFrequency => interestFrequency.id));
    } else {
      setSelectedInterestFrequencies([]);
    }
  };

  const handleSelectInterestFrequency = (interestFrequencyId, checked) => {
    if (checked) {
      setSelectedInterestFrequencies(prev => [...prev, interestFrequencyId]);
    } else {
      setSelectedInterestFrequencies(prev => prev.filter(id => id !== interestFrequencyId));
    }
  };

  const isAllSelected = selectedInterestFrequencies.length === paginatedInterestFrequencies.length && paginatedInterestFrequencies.length > 0;
  const isIndeterminate = selectedInterestFrequencies.length > 0 && selectedInterestFrequencies.length < paginatedInterestFrequencies.length;

  // Show/hide batch actions based on selection
  useEffect(() => {
    setShowBatchActions(selectedInterestFrequencies.length > 0);
  }, [selectedInterestFrequencies]);

  // Status change functions
  const handleStatusChange = (action) => {
    setStatusAction(action);
    setShowStatusModal(true);
  };

  const confirmStatusChange = async () => {
    try {
      // Get before data for logging
      const beforeData = selectedInterestFrequencies.map(interestFrequencyId => {
        const interestFrequency = interestFrequencies.find(interestFrequency => interestFrequency.id === interestFrequencyId);
        return {
          id: interestFrequencyId,
          interestFrequencyId: interestFrequency?.interestFrequencyId,
          interestFrequencyName: interestFrequency?.interestFrequencyName,
          status: interestFrequency?.status
        };
      });

      const promises = selectedInterestFrequencies.map(interestFrequencyId => 
        axios.put(`http://localhost:3001/interest-frequency/${interestFrequencyId}/status`, {
          status: statusAction
        }, {
          headers: { accessToken: localStorage.getItem("accessToken") }
        })
      );
      
      await Promise.all(promises);
      
      // Prepare after data for logging
      const afterData = beforeData.map(interestFrequency => ({
        ...interestFrequency,
        status: statusAction
      }));

      // Log the update action with before/after data
      frontendLoggingService.logUpdate(
        "InterestFrequency", 
        selectedInterestFrequencies.join(','), 
        `${selectedInterestFrequencies.length} interest frequencies`, 
        beforeData, 
        afterData, 
        `Updated status to ${statusAction} for ${selectedInterestFrequencies.length} interest frequencies`
      );
      
      // Update local state
      setInterestFrequencies(prev => prev.map(interestFrequency => 
        selectedInterestFrequencies.includes(interestFrequency.id) 
          ? { ...interestFrequency, status: statusAction }
          : interestFrequency
      ));
      
      showMessage(`${statusAction} ${selectedInterestFrequencies.length} interest frequency(ies) successfully`, "success");
      setSelectedInterestFrequencies([]);
      setShowStatusModal(false);
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to update interest frequency status";
      showMessage(msg, "error");
    }
  };

  return (
    <DashboardWrapper>
      <header className="header">
        <div className="header__left">
          <div className="greeting">Interest Frequency Maintenance</div>
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
              frontendLoggingService.logFilter("Status", e.target.value, "InterestFrequency", `Filtered interest frequencies by status: ${e.target.value || 'All'}`);
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
                  frontendLoggingService.logSearch(e.target.value, "InterestFrequency", null, `Searched for interest frequencies: "${e.target.value}"`);
                }
                setSearch(e.target.value);
              }} placeholder="Search interest frequencies..." />
              <span className="searchIcon">🔍</span>
            </div>

            {canAdd(PERMISSIONS.INTEREST_FREQUENCY_MAINTENANCE) ? (
              <button 
                className="pill" 
                onClick={() => {
                  frontendLoggingService.logButtonClick("Add Interest Frequency", "InterestFrequency", null, "Clicked Add Interest Frequency button");
                  history.push("/interest-frequency/new");
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
                title="Add Interest Frequency"
              >
                <FaPlus />
                Add Interest Frequency
              </button>
            ) : (
              <button 
                className="pill" 
                onClick={() => showMessage("Your role lacks permission to add interest frequencies", "error")}
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
                title="Add Interest Frequency - No Permission"
                disabled
              >
                <FaPlus />
                Add Interest Frequency
              </button>
            )}

            {/* Batch Action Buttons */}
            {showBatchActions && canApprove(PERMISSIONS.INTEREST_FREQUENCY_MAINTENANCE) && (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "14px", color: "var(--muted-text)", marginRight: "8px" }}>
                  {selectedInterestFrequencies.length} selected
                </span>
                <button 
                  className="pill" 
                  onClick={() => {
                    frontendLoggingService.logButtonClick("Activate Interest Frequencies", "InterestFrequency", null, `Clicked Activate button for ${selectedInterestFrequencies.length} selected interest frequencies`);
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
                    frontendLoggingService.logButtonClick("Deactivate Interest Frequencies", "InterestFrequency", null, `Clicked Deactivate button for ${selectedInterestFrequencies.length} selected interest frequencies`);
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
                    Frequency ID
                    {sortField === 'interestFrequencyId' && (
                      <span style={{ marginLeft: '8px', color: 'var(--primary-500)' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th>
                    Frequency Name
                    {sortField === 'interestFrequencyName' && (
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
                {paginatedInterestFrequencies.map(interestFrequency => (
                  <tr key={interestFrequency.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedInterestFrequencies.includes(interestFrequency.id)}
                        onChange={(e) => handleSelectInterestFrequency(interestFrequency.id, e.target.checked)}
                        style={{ cursor: "pointer" }}
                      />
                    </td>
                    <td>{interestFrequency.interestFrequencyId}</td>
                    <td>{interestFrequency.interestFrequencyName}</td>
                    <td>{interestFrequency.description || '-'}</td>
                    <td>{interestFrequency.createdOn ? new Date(interestFrequency.createdOn).toLocaleDateString() : '-'}</td>
                    <td>{interestFrequency.createdBy || '-'}</td>
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
                            interestFrequency.status === "Active" ? "rgba(16, 185, 129, 0.2)" :
                            interestFrequency.status === "Pending" ? "rgba(6, 182, 212, 0.2)" :
                            interestFrequency.status === "Inactive" ? "rgba(239, 68, 68, 0.2)" :
                            "rgba(107, 114, 128, 0.2)",
                          color: 
                            interestFrequency.status === "Active" ? "#059669" :
                            interestFrequency.status === "Pending" ? "#0891b2" :
                            interestFrequency.status === "Inactive" ? "#dc2626" :
                            "#6b7280",
                          border: `1px solid ${
                            interestFrequency.status === "Active" ? "rgba(16, 185, 129, 0.3)" :
                            interestFrequency.status === "Pending" ? "rgba(6, 182, 212, 0.3)" :
                            interestFrequency.status === "Inactive" ? "rgba(239, 68, 68, 0.3)" :
                            "rgba(107, 114, 128, 0.3)"
                          }`
                        }}
                      >
                        {interestFrequency.status}
                      </div>
                    </td>
                    <td className="actions">
                      <button className="action-btn action-btn--view" onClick={() => {
                        frontendLoggingService.logView("InterestFrequency", interestFrequency.id, interestFrequency.interestFrequencyName, "Viewed interest frequency details");
                        history.push(`/interest-frequency/${interestFrequency.id}`);
                      }} title="View">
                        <FiEye />
                      </button>
                      {canEdit(PERMISSIONS.INTEREST_FREQUENCY_MAINTENANCE) ? (
                        <button className="action-btn action-btn--edit" onClick={() => {
                          frontendLoggingService.logButtonClick("Edit Interest Frequency", "InterestFrequency", interestFrequency.id, `Clicked Edit button for interest frequency: ${interestFrequency.interestFrequencyName}`);
                          history.push(`/interest-frequency/${interestFrequency.id}?edit=1`);
                        }} title="Update">
                          <FiEdit3 />
                        </button>
                      ) : (
                        <button 
                          className="action-btn action-btn--edit" 
                          onClick={() => showMessage("Your role lacks permission to edit interest frequencies", "error")} 
                          title="Update - No Permission"
                          style={{ opacity: 0.5, cursor: "not-allowed" }}
                          disabled
                        >
                          <FiEdit3 />
                        </button>
                      )}
                      {canDelete(PERMISSIONS.INTEREST_FREQUENCY_MAINTENANCE) ? (
                        <button className="action-btn action-btn--delete" onClick={async () => {
                          try {
                            // Log the delete action with interest frequency data before deletion
                            frontendLoggingService.logDelete("InterestFrequency", interestFrequency.id, interestFrequency.interestFrequencyName, {
                              interestFrequencyId: interestFrequency.interestFrequencyId,
                              interestFrequencyName: interestFrequency.interestFrequencyName,
                              status: interestFrequency.status
                            }, `Deleted interest frequency: ${interestFrequency.interestFrequencyName}`);
                            
                            await axios.delete(`http://localhost:3001/interest-frequency/${interestFrequency.id}`, { headers: { accessToken: localStorage.getItem("accessToken") } });
                            setInterestFrequencies(curr => curr.filter(x => x.id !== interestFrequency.id));
                            showMessage("Interest frequency deleted successfully", "success");
                          } catch (err) {
                            const msg = err?.response?.data?.error || "Failed to delete interest frequency";
                            showMessage(msg, "error");
                          }
                        }} title="Delete">
                          <FiTrash2 />
                        </button>
                      ) : (
                        <button 
                          className="action-btn action-btn--delete" 
                          onClick={() => showMessage("Your role lacks permission to delete interest frequencies", "error")} 
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
            totalItems={sortedInterestFrequencies.length}
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
              You are about to {statusAction === "Inactive" ? "Deactivate" : statusAction} {selectedInterestFrequencies.length} {selectedInterestFrequencies.length === 1 ? 'record' : 'records'}.
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

export default InterestFrequencyMaintenance;











