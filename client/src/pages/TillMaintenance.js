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

function TillMaintenance({ isWindowMode = false, onRefresh }) {
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
      frontendLoggingService.logView("Till", null, null, "Viewed Till Maintenance page");
    }
  }, [authState, isLoading, history]);

  const [tills, setTills] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedTills, setSelectedTills] = useState([]);
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState("");
  const [sortField] = useState("createdOn");
  const [sortDirection] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const controller = new AbortController();
    const fetchTills = async () => {
      try {
        const params = {};
        if (statusFilter) params.status = statusFilter;
        if (search) params.q = search;
        const res = await axios.get("http://localhost:3001/tills", {
          headers: { accessToken: localStorage.getItem("accessToken") },
          params,
          signal: controller.signal,
        });
        const payload = res?.data?.entity ?? res?.data;
        setTills(Array.isArray(payload) ? payload : []);
      } catch {}
    };
    fetchTills();
    return () => controller.abort();
  }, [statusFilter, search]);

  const counts = useMemo(() => {
    const list = Array.isArray(tills) ? tills : [];
    const c = { Active: 0, Inactive: 0, Pending: 0 };
    for (const till of list) {
      if (till.status && c[till.status] !== undefined) c[till.status] += 1;
    }
    return c;
  }, [tills]);

  const sortedTills = useMemo(() => {
    const list = Array.isArray(tills) ? tills : [];
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
  }, [tills, sortField, sortDirection]);

  // Pagination logic
  const paginatedTills = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedTills.slice(startIndex, endIndex);
  }, [sortedTills, currentPage, itemsPerPage]);

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSelectedTills([]); // Clear selection when changing pages
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
    setSelectedTills([]); // Clear selection
  };

  // Selection functions
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedTills(paginatedTills.map(till => till.id));
    } else {
      setSelectedTills([]);
    }
  };

  const handleSelectTill = (tillId, checked) => {
    if (checked) {
      setSelectedTills(prev => [...prev, tillId]);
    } else {
      setSelectedTills(prev => prev.filter(id => id !== tillId));
    }
  };

  const isAllSelected = selectedTills.length === paginatedTills.length && paginatedTills.length > 0;
  const isIndeterminate = selectedTills.length > 0 && selectedTills.length < paginatedTills.length;

  useEffect(() => {
    setShowBatchActions(selectedTills.length > 0);
  }, [selectedTills]);

  // Status change functions
  const handleStatusChange = (action) => {
    setStatusAction(action);
    setShowStatusModal(true);
  };

  const confirmStatusChange = async () => {
    try {
      // Get before data for logging
      const beforeData = selectedTills.map(tillId => {
        const till = tills.find(till => till.id === tillId);
        return {
          id: tillId,
          tillId: till?.tillId,
          tillName: till?.tillName,
          status: till?.status
        };
      });

      const promises = selectedTills.map(tillId => 
        axios.put(`http://localhost:3001/tills/${tillId}`, {
          status: statusAction
        }, {
          headers: { accessToken: localStorage.getItem("accessToken") }
        })
      );
      
      await Promise.all(promises);
      
      // Prepare after data for logging
      const afterData = beforeData.map(till => ({
        ...till,
        status: statusAction
      }));

      // Log the update action with before/after data
      frontendLoggingService.logUpdate(
        "Till", 
        selectedTills.join(','), 
        `${selectedTills.length} tills`, 
        beforeData, 
        afterData, 
        `Updated status to ${statusAction} for ${selectedTills.length} tills`
      );
      
      // Update local state
      setTills(prev => prev.map(till => 
        selectedTills.includes(till.id) 
          ? { ...till, status: statusAction }
          : till
      ));
      
      showMessage(`${statusAction} ${selectedTills.length} till(s) successfully`, "success");
      setSelectedTills([]);
      setShowStatusModal(false);
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to update till status";
      showMessage(msg, "error");
    }
  };


  return isWindowMode ? (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      overflow: 'auto', 
      padding: '20px',
      boxSizing: 'border-box',
      backgroundColor: 'white'
    }}>
      <main style={{ width: '100%' }}>
        <section className="cards cards--status" style={{ marginBottom: '20px' }}>
          <div className="card card--approved" style={{ borderRadius: '12px' }}>
            <div className="card__icon">
              <FiCheckCircle />
            </div>
            <div className="card__content">
              <h4>Active</h4>
              <div className="card__kpi">{counts.Active}</div>
            </div>
          </div>
          <div className="card card--pending" style={{ borderRadius: '12px' }}>
            <div className="card__icon">
              <FiClock />
            </div>
            <div className="card__content">
              <h4>Pending</h4>
              <div className="card__kpi">{counts.Pending}</div>
            </div>
          </div>
          <div className="card card--returned" style={{ borderRadius: '12px' }}>
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
              frontendLoggingService.logFilter("Status", e.target.value, "Till", `Filtered tills by status: ${e.target.value || 'All'}`);
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
                  frontendLoggingService.logSearch(e.target.value, "Till", null, `Searched for tills: "${e.target.value}"`);
                }
                setSearch(e.target.value);
              }} placeholder="Search tills..." />
              <span className="searchIcon">🔍</span>
            </div>

            {canAdd(PERMISSIONS.TILL_MAINTENANCE) ? (
              <button 
                className="pill" 
                onClick={() => {
                  frontendLoggingService.logButtonClick("Add Till", "Till", null, "Clicked Add Till button");
                  history.push("/till-form/new");
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
                title="Add Till"
              >
                <FaPlus />
                Add Till
              </button>
            ) : (
              <button 
                className="pill" 
                onClick={() => showMessage("Your role lacks permission to add tills", "error")}
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
                title="Add Till - No Permission"
                disabled
              >
                <FaPlus />
                Add Till
              </button>
            )}

            {/* Batch Action Buttons */}
            {showBatchActions && canApprove(PERMISSIONS.TILL_MAINTENANCE) && (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "14px", color: "var(--muted-text)", marginRight: "8px" }}>
                  {selectedTills.length} selected
                </span>
                <button 
                  className="pill" 
                  onClick={() => {
                    frontendLoggingService.logButtonClick("Activate Tills", "Till", null, `Clicked Activate button for ${selectedTills.length} selected tills`);
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
                    frontendLoggingService.logButtonClick("Deactivate Tills", "Till", null, `Clicked Deactivate button for ${selectedTills.length} selected tills`);
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
                    Till ID
                    {sortField === 'tillId' && (
                      <span style={{ marginLeft: '8px', color: 'var(--primary-500)' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th>
                    Till Name
                    {sortField === 'tillName' && (
                      <span style={{ marginLeft: '8px', color: 'var(--primary-500)' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th>Cashier</th>
                  <th>GL Account</th>
                  <th>Max Capacity</th>
                  <th>Min Capacity</th>
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
                {paginatedTills.map(till => (
                  <tr key={till.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedTills.includes(till.id)}
                        onChange={(e) => handleSelectTill(till.id, e.target.checked)}
                        style={{ cursor: "pointer" }}
                      />
                    </td>
                    <td>{till.tillId}</td>
                    <td>{till.tillName}</td>
                    <td>
                      {till.cashier ? 
                        `${till.cashier.firstName} ${till.cashier.lastName}` : 
                        'Not Assigned'
                      }
                    </td>
                    <td>
                      {till.glAccount ? 
                        `${till.glAccount.accountName}` : 
                        'Not Linked'
                      }
                    </td>
                    <td>
                      {till.maximumAmountCapacity ? 
                        `$${parseFloat(till.maximumAmountCapacity).toLocaleString()}` : 
                        'Not Set'
                      }
                    </td>
                    <td>
                      {till.minimumAmountCapacity ? 
                        `$${parseFloat(till.minimumAmountCapacity).toLocaleString()}` : 
                        'Not Set'
                      }
                    </td>
                    <td>{till.createdOn ? new Date(till.createdOn).toLocaleDateString() : '-'}</td>
                    <td>{till.createdBy || '-'}</td>
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
                            till.status === "Active" ? "rgba(16, 185, 129, 0.2)" :
                            till.status === "Pending" ? "rgba(6, 182, 212, 0.2)" :
                            till.status === "Inactive" ? "rgba(239, 68, 68, 0.2)" :
                            "rgba(107, 114, 128, 0.2)",
                          color: 
                            till.status === "Active" ? "#059669" :
                            till.status === "Pending" ? "#0891b2" :
                            till.status === "Inactive" ? "#dc2626" :
                            "#6b7280",
                          border: `1px solid ${
                            till.status === "Active" ? "rgba(16, 185, 129, 0.3)" :
                            till.status === "Pending" ? "rgba(6, 182, 212, 0.3)" :
                            till.status === "Inactive" ? "rgba(239, 68, 68, 0.3)" :
                            "rgba(107, 114, 128, 0.3)"
                          }`
                        }}
                      >
                        {till.status}
                      </div>
                    </td>
                    <td className="actions">
                      <button className="action-btn action-btn--view" onClick={() => {
                        frontendLoggingService.logView("Till", till.id, till.tillName, "Viewed till details");
                        history.push(`/till-form/${till.id}`);
                      }} title="View">
                        <FiEye />
                      </button>
                      {canEdit(PERMISSIONS.TILL_MAINTENANCE) ? (
                        <button className="action-btn action-btn--edit" onClick={() => {
                          frontendLoggingService.logButtonClick("Edit Till", "Till", till.id, `Clicked Edit button for till: ${till.tillName}`);
                          history.push(`/till-form/${till.id}?edit=1`);
                        }} title="Update">
                          <FiEdit3 />
                        </button>
                      ) : (
                        <button 
                          className="action-btn action-btn--edit" 
                          onClick={() => showMessage("Your role lacks permission to edit tills", "error")} 
                          title="Update - No Permission"
                          style={{ opacity: 0.5, cursor: "not-allowed" }}
                          disabled
                        >
                          <FiEdit3 />
                        </button>
                      )}
                      {canDelete(PERMISSIONS.TILL_MAINTENANCE) ? (
                        <button className="action-btn action-btn--delete" onClick={async () => {
                          try {
                            // Log the delete action with till data before deletion
                            frontendLoggingService.logDelete("Till", till.id, till.tillName, {
                              tillId: till.tillId,
                              tillName: till.tillName,
                              status: till.status
                            }, `Deleted till: ${till.tillName}`);
                            
                            await axios.delete(`http://localhost:3001/tills/${till.id}`, { headers: { accessToken: localStorage.getItem("accessToken") } });
                            setTills(curr => curr.filter(x => x.id !== till.id));
                            showMessage("Till deleted successfully", "success");
                          } catch (err) {
                            const msg = err?.response?.data?.error || "Failed to delete till";
                            showMessage(msg, "error");
                          }
                        }} title="Delete">
                          <FiTrash2 />
                        </button>
                      ) : (
                        <button 
                          className="action-btn action-btn--delete" 
                          onClick={() => showMessage("Your role lacks permission to delete tills", "error")} 
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
            totalItems={sortedTills.length}
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
              You are about to {statusAction === "Inactive" ? "Deactivate" : statusAction} {selectedTills.length} {selectedTills.length === 1 ? 'record' : 'records'}.
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
    </div>
  ) : (
    <DashboardWrapper>
      <header className="header">
        <div className="header__left">
          <div className="greeting">Till Maintenance</div>
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
              frontendLoggingService.logFilter("Status", e.target.value, "Till", `Filtered tills by status: ${e.target.value || 'All'}`);
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
                  frontendLoggingService.logSearch(e.target.value, "Till", null, `Searched for tills: "${e.target.value}"`);
                }
                setSearch(e.target.value);
              }} placeholder="Search tills..." />
              <span className="searchIcon">🔍</span>
            </div>

            {canAdd(PERMISSIONS.TILL_MAINTENANCE) ? (
              <button 
                className="pill" 
                onClick={() => {
                  frontendLoggingService.logButtonClick("Add Till", "Till", null, "Clicked Add Till button");
                  history.push("/till-form/new");
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
                title="Add Till"
              >
                <FaPlus />
                Add Till
              </button>
            ) : (
              <button 
                className="pill" 
                onClick={() => showMessage("Your role lacks permission to add tills", "error")}
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
                title="Add Till - No Permission"
                disabled
              >
                <FaPlus />
                Add Till
              </button>
            )}

            {/* Batch Action Buttons */}
            {showBatchActions && canApprove(PERMISSIONS.TILL_MAINTENANCE) && (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "14px", color: "var(--muted-text)", marginRight: "8px" }}>
                  {selectedTills.length} selected
                </span>
                <button 
                  className="pill" 
                  onClick={() => {
                    frontendLoggingService.logButtonClick("Activate Tills", "Till", null, `Clicked Activate button for ${selectedTills.length} selected tills`);
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
                    frontendLoggingService.logButtonClick("Deactivate Tills", "Till", null, `Clicked Deactivate button for ${selectedTills.length} selected tills`);
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
                    Till ID
                    {sortField === 'tillId' && (
                      <span style={{ marginLeft: '8px', color: 'var(--primary-500)' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th>
                    Till Name
                    {sortField === 'tillName' && (
                      <span style={{ marginLeft: '8px', color: 'var(--primary-500)' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th>Cashier</th>
                  <th>GL Account</th>
                  <th>Max Capacity</th>
                  <th>Min Capacity</th>
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
                {paginatedTills.map(till => (
                  <tr key={till.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedTills.includes(till.id)}
                        onChange={(e) => handleSelectTill(till.id, e.target.checked)}
                        style={{ cursor: "pointer" }}
                      />
                    </td>
                    <td>{till.tillId}</td>
                    <td>{till.tillName}</td>
                    <td>
                      {till.cashier ? 
                        `${till.cashier.firstName} ${till.cashier.lastName}` : 
                        'Not Assigned'
                      }
                    </td>
                    <td>
                      {till.glAccount ? 
                        `${till.glAccount.accountName}` : 
                        'Not Linked'
                      }
                    </td>
                    <td>
                      {till.maximumAmountCapacity ? 
                        `$${parseFloat(till.maximumAmountCapacity).toLocaleString()}` : 
                        'Not Set'
                      }
                    </td>
                    <td>
                      {till.minimumAmountCapacity ? 
                        `$${parseFloat(till.minimumAmountCapacity).toLocaleString()}` : 
                        'Not Set'
                      }
                    </td>
                    <td>{till.createdOn ? new Date(till.createdOn).toLocaleDateString() : '-'}</td>
                    <td>{till.createdBy || '-'}</td>
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
                            till.status === "Active" ? "rgba(16, 185, 129, 0.2)" :
                            till.status === "Pending" ? "rgba(6, 182, 212, 0.2)" :
                            till.status === "Inactive" ? "rgba(239, 68, 68, 0.2)" :
                            "rgba(107, 114, 128, 0.2)",
                          color: 
                            till.status === "Active" ? "#059669" :
                            till.status === "Pending" ? "#0891b2" :
                            till.status === "Inactive" ? "#dc2626" :
                            "#6b7280",
                          border: `1px solid ${
                            till.status === "Active" ? "rgba(16, 185, 129, 0.3)" :
                            till.status === "Pending" ? "rgba(6, 182, 212, 0.3)" :
                            till.status === "Inactive" ? "rgba(239, 68, 68, 0.3)" :
                            "rgba(107, 114, 128, 0.3)"
                          }`
                        }}
                      >
                        {till.status}
                      </div>
                    </td>
                    <td className="actions">
                      <button className="action-btn action-btn--view" onClick={() => {
                        frontendLoggingService.logView("Till", till.id, till.tillName, "Viewed till details");
                        history.push(`/till-form/${till.id}`);
                      }} title="View">
                        <FiEye />
                      </button>
                      {canEdit(PERMISSIONS.TILL_MAINTENANCE) ? (
                        <button className="action-btn action-btn--edit" onClick={() => {
                          frontendLoggingService.logButtonClick("Edit Till", "Till", till.id, `Clicked Edit button for till: ${till.tillName}`);
                          history.push(`/till-form/${till.id}?edit=1`);
                        }} title="Update">
                          <FiEdit3 />
                        </button>
                      ) : (
                        <button 
                          className="action-btn action-btn--edit" 
                          onClick={() => showMessage("Your role lacks permission to edit tills", "error")} 
                          title="Update - No Permission"
                          style={{ opacity: 0.5, cursor: "not-allowed" }}
                          disabled
                        >
                          <FiEdit3 />
                        </button>
                      )}
                      {canDelete(PERMISSIONS.TILL_MAINTENANCE) ? (
                        <button className="action-btn action-btn--delete" onClick={async () => {
                          try {
                            // Log the delete action with till data before deletion
                            frontendLoggingService.logDelete("Till", till.id, till.tillName, {
                              tillId: till.tillId,
                              tillName: till.tillName,
                              status: till.status
                            }, `Deleted till: ${till.tillName}`);
                            
                            await axios.delete(`http://localhost:3001/tills/${till.id}`, { headers: { accessToken: localStorage.getItem("accessToken") } });
                            setTills(curr => curr.filter(x => x.id !== till.id));
                            showMessage("Till deleted successfully", "success");
                          } catch (err) {
                            const msg = err?.response?.data?.error || "Failed to delete till";
                            showMessage(msg, "error");
                          }
                        }} title="Delete">
                          <FiTrash2 />
                        </button>
                      ) : (
                        <button 
                          className="action-btn action-btn--delete" 
                          onClick={() => showMessage("Your role lacks permission to delete tills", "error")} 
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
            totalItems={sortedTills.length}
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
              You are about to {statusAction === "Inactive" ? "Deactivate" : statusAction} {selectedTills.length} {selectedTills.length === 1 ? 'record' : 'records'}.
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

export default TillMaintenance;
