import React, { useContext, useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import axios from "axios";
import { FiEye, FiEdit3, FiTrash2, FiCheckCircle, FiClock, FiXCircle, FiRefreshCw } from "react-icons/fi";
import { FaPlus } from 'react-icons/fa';
import DashboardWrapper from '../components/DashboardWrapper';
import Pagination from '../components/Pagination';
import { useSnackbar } from "../helpers/SnackbarContext";
import { AuthContext } from "../helpers/AuthContext";
import { usePermissions } from "../hooks/usePermissions";
import { PERMISSIONS } from "../helpers/PermissionUtils";
import frontendLoggingService from "../services/frontendLoggingService";

function ChargesManagement({ isWindowMode = false, onRefresh }) {
  const history = useHistory();
  const { showMessage } = useSnackbar();
  const { authState, isLoading } = useContext(AuthContext);
  const { canAdd, canEdit, canDelete, canApprove } = usePermissions();

  useEffect(() => {
    // Only redirect if authentication check is complete and user is not authenticated
    if (!isLoading && !authState.status) {
      if (!isWindowMode) {
        history.push("/login");
      }
    } else if (!isLoading && authState.status) {
      // Log page view when user is authenticated
      frontendLoggingService.logView("Charges", null, null, "Viewed Charges Maintenance page");
    }
  }, [authState, isLoading, history, isWindowMode]);

  const [charges, setCharges] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCharges, setSelectedCharges] = useState([]);
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState("");
  const [verifierRemarks, setVerifierRemarks] = useState("");
  const [sortField] = useState("chargeId");
  const [sortDirection] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Extract fetch function so it can be called on demand
  const fetchCharges = async (signal) => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (search) params.q = search;
      const res = await axios.get("http://localhost:3001/charges", {
        headers: { accessToken: localStorage.getItem("accessToken") },
        params,
        signal,
      });
      const payload = res?.data?.entity ?? res?.data;
      setCharges(Array.isArray(payload) ? payload : []);
    } catch {}
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchCharges(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, search]);

  // Handle refresh from window header button
  useEffect(() => {
    if (onRefresh) {
      onRefresh(async () => {
        await fetchCharges();
        showMessage("Charges refreshed successfully", "success");
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRefresh]);

  // Manual refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchCharges();
    setTimeout(() => setIsRefreshing(false), 500); // Show spinner for at least 500ms
    showMessage("Charges refreshed successfully", "success");
  };

  const counts = useMemo(() => {
    const list = Array.isArray(charges) ? charges : [];
    const c = { Active: 0, Inactive: 0, Pending: 0 };
    for (const charge of list) {
      if (charge.status && c[charge.status] !== undefined) c[charge.status] += 1;
    }
    return c;
  }, [charges]);

  const sortedCharges = useMemo(() => {
    const list = Array.isArray(charges) ? charges : [];
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
  }, [charges, sortField, sortDirection]);

  // Pagination logic
  const paginatedCharges = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedCharges.slice(startIndex, endIndex);
  }, [sortedCharges, currentPage, itemsPerPage]);

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSelectedCharges([]); // Clear selection when changing pages
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
    setSelectedCharges([]); // Clear selection
  };

  // Selection functions
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedCharges(paginatedCharges.map(c => c.chargeId));
    } else {
      setSelectedCharges([]);
    }
  };

  const handleSelectCharge = (chargeId, checked) => {
    if (checked) {
      setSelectedCharges(prev => [...prev, chargeId]);
    } else {
      setSelectedCharges(prev => prev.filter(id => id !== chargeId));
    }
  };

  const isAllSelected = selectedCharges.length === paginatedCharges.length && paginatedCharges.length > 0;
  const isIndeterminate = selectedCharges.length > 0 && selectedCharges.length < paginatedCharges.length;

  // Show/hide batch actions based on selection
  useEffect(() => {
    setShowBatchActions(selectedCharges.length > 0);
  }, [selectedCharges]);

  // Status change functions
  const handleStatusChange = (action) => {
    setStatusAction(action);
    setShowStatusModal(true);
  };

  const confirmStatusChange = async () => {
    try {
      const promises = selectedCharges.map(chargeId => 
        axios.patch(`http://localhost:3001/charges/${chargeId}/status`, {
          status: statusAction,
          verifierRemarks: verifierRemarks
        }, { 
          headers: { accessToken: localStorage.getItem("accessToken") } 
        })
      );
      
      await Promise.all(promises);
      
      // Update local state
      setCharges(prev => prev.map(charge => 
        selectedCharges.includes(charge.chargeId) 
          ? { ...charge, status: statusAction, verifierRemarks: verifierRemarks }
          : charge
      ));
      
      showMessage(`${statusAction} ${selectedCharges.length} charge(s) successfully`, "success");
      setSelectedCharges([]);
      setShowStatusModal(false);
      setVerifierRemarks("");
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to update charge status";
      showMessage(msg, "error");
    }
  };


  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Loading...
      </div>
    );
  }

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
          <div className="card card--rejected" style={{ borderRadius: '12px' }}>
            <div className="card__icon">
              <FiXCircle />
            </div>
            <div className="card__content">
              <h4>Inactive</h4>
              <div className="card__kpi">{counts.Inactive}</div>
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
        </section>

        <section className="card" style={{ padding: 12 }}>
          <div className="tableToolbar">
            <select className="statusSelect" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Pending">Pending</option>
            </select>

            <div className="searchWrapper">
              <input className="searchInput" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search charges..." />
              <span className="searchIcon">🔍</span>
            </div>

            <button
              className="pill"
              onClick={handleRefresh}
              disabled={isRefreshing}
              style={{
                backgroundColor: "var(--primary-100)",
                color: "var(--primary-700)",
                border: "1px solid var(--primary-300)",
                padding: "8px 12px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                cursor: isRefreshing ? "not-allowed" : "pointer",
                transition: "all 0.3s ease",
                opacity: isRefreshing ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!isRefreshing) {
                  e.target.style.backgroundColor = "var(--primary-200)";
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "var(--primary-100)";
              }}
              title="Refresh table"
            >
              <FiRefreshCw 
                style={{ 
                  animation: isRefreshing ? "spin 1s linear infinite" : "none"
                }} 
              />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>

            <button 
              className="pill" 
              onClick={() => history.push("/charges-form/new")}
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
              title="Add Charge"
            >
              <FaPlus />
              Add Charge
            </button>

            {/* Batch Action Buttons */}
            {showBatchActions && canApprove(PERMISSIONS.CHARGES_MANAGEMENT) && (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "14px", color: "var(--muted-text)", marginRight: "8px" }}>
                  {selectedCharges.length} selected
                </span>
                <button 
                  className="pill" 
                  onClick={() => handleStatusChange("Active")}
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
                  onClick={() => handleStatusChange("Inactive")}
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
                    Charge ID
                    {sortField === 'chargeId' && (
                      <span style={{ marginLeft: '8px', color: 'var(--primary-500)' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th>
                    Name
                    {sortField === 'name' && (
                      <span style={{ marginLeft: '8px', color: 'var(--primary-500)' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th>Currency</th>
                  <th>Amount</th>
                  <th>
                    Status
                    {sortField === 'status' && (
                      <span style={{ marginLeft: '8px', color: 'var(--primary-500)' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCharges.map(charge => (
                  <tr key={charge.chargeId}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedCharges.includes(charge.chargeId)}
                        onChange={(e) => handleSelectCharge(charge.chargeId, e.target.checked)}
                        style={{ cursor: "pointer" }}
                      />
                    </td>
                    <td>{charge.chargeId}</td>
                    <td>{charge.name}</td>
                    <td>{charge.currency}</td>
                    <td>{charge.currency}{parseFloat(charge.amount).toFixed(2)}</td>
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
                            charge.status === "Active" ? "rgba(16, 185, 129, 0.2)" :
                            charge.status === "Inactive" ? "rgba(239, 68, 68, 0.2)" :
                            charge.status === "Pending" ? "rgba(6, 182, 212, 0.2)" :
                            "rgba(107, 114, 128, 0.2)",
                          color: 
                            charge.status === "Active" ? "#059669" :
                            charge.status === "Inactive" ? "#dc2626" :
                            charge.status === "Pending" ? "#0891b2" :
                            "#6b7280",
                          border: `1px solid ${
                            charge.status === "Active" ? "rgba(16, 185, 129, 0.3)" :
                            charge.status === "Inactive" ? "rgba(239, 68, 68, 0.3)" :
                            charge.status === "Pending" ? "rgba(6, 182, 212, 0.3)" :
                            "rgba(107, 114, 128, 0.3)"
                          }`
                        }}
                      >
                        {charge.status}
                      </div>
                    </td>
                    <td>{new Date(charge.createdOn).toLocaleDateString()}</td>
                    <td className="actions">
                      <button className="action-btn action-btn--view" onClick={() => history.push(`/charges-form/${charge.chargeId}`)} title="View">
                        <FiEye />
                      </button>
                      {canEdit(PERMISSIONS.CHARGES_MANAGEMENT) ? (
                        <button className="action-btn action-btn--edit" onClick={() => history.push(`/charges-form/${charge.chargeId}?edit=1`)} title="Update">
                          <FiEdit3 />
                        </button>
                      ) : (
                        <button 
                          className="action-btn action-btn--edit" 
                          onClick={() => showMessage("Your role lacks permission to edit charges", "error")} 
                          title="Update - No Permission"
                          style={{ opacity: 0.5, cursor: "not-allowed" }}
                          disabled
                        >
                          <FiEdit3 />
                        </button>
                      )}
                      {canDelete(PERMISSIONS.CHARGES_MANAGEMENT) ? (
                        <button className="action-btn action-btn--delete" onClick={async () => {
                          try {
                            await axios.delete(`http://localhost:3001/charges/${charge.chargeId}`, { headers: { accessToken: localStorage.getItem("accessToken") } });
                            setCharges(curr => curr.filter(x => x.chargeId !== charge.chargeId));
                            showMessage("Charge deleted successfully", "success");
                          } catch (err) {
                            const msg = err?.response?.data?.error || "Failed to delete charge";
                            showMessage(msg, "error");
                          }
                        }} title="Delete">
                          <FiTrash2 />
                        </button>
                      ) : (
                        <button 
                          className="action-btn action-btn--delete" 
                          onClick={() => showMessage("Your role lacks permission to delete charges", "error")} 
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
            totalItems={sortedCharges.length}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </section>

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
                You are about to {statusAction === "Inactive" ? "Deactivate" : statusAction} {selectedCharges.length} {selectedCharges.length === 1 ? 'charge' : 'charges'}.
              </p>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "var(--primary-700)" }}>
                  Verifier Remarks:
                </label>
                <textarea
                  value={verifierRemarks}
                  onChange={(e) => setVerifierRemarks(e.target.value)}
                  placeholder="Enter remarks for this status change..."
                  style={{
                    width: "100%",
                    height: "100px",
                    padding: "12px",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    fontSize: "14px",
                    resize: "vertical",
                    fontFamily: "inherit"
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  type="button"
                  className="pill"
                  onClick={() => setShowStatusModal(false)}
                  style={{
                    padding: "8px 16px",
                    fontSize: "14px"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="pill"
                  onClick={confirmStatusChange}
                  style={{
                    padding: "8px 16px",
                    fontSize: "14px",
                    backgroundColor: 
                      statusAction === "Active" ? "#10b981" :
                      statusAction === "Inactive" ? "#ef4444" :
                      "var(--primary-500)",
                    color: "white"
                  }}
                >
                  {statusAction === "Inactive" ? "Deactivate" : statusAction}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  ) : (
    <DashboardWrapper>
      <header className="header">
        <div className="header__left">
          <div className="greeting">Charges Management</div>
        </div>
      </header>

      <main className="dashboard__content">
        {/* Status Cards */}
        <section className="cards cards--status">
          <div className="card card--approved">
            <div className="card__icon">
              <FiCheckCircle />
            </div>
            <div className="card__content">
              <h4>Active</h4>
              <div className="card__kpi">{counts.Active || 0}</div>
            </div>
          </div>
          <div className="card card--rejected">
            <div className="card__icon">
              <FiXCircle />
            </div>
            <div className="card__content">
              <h4>Inactive</h4>
              <div className="card__kpi">{counts.Inactive || 0}</div>
            </div>
          </div>
          <div className="card card--pending">
            <div className="card__icon">
              <FiClock />
            </div>
            <div className="card__content">
              <h4>Pending</h4>
              <div className="card__kpi">{counts.Pending || 0}</div>
            </div>
          </div>
        </section>

        <section className="card" style={{ padding: 12 }}>
          <div className="tableToolbar">
            <select className="statusSelect" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Pending">Pending</option>
            </select>

            <div className="searchWrapper">
              <input className="searchInput" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search charges..." />
              <span className="searchIcon">🔍</span>
            </div>

            <button
              className="pill"
              onClick={handleRefresh}
              disabled={isRefreshing}
              style={{
                backgroundColor: "var(--primary-100)",
                color: "var(--primary-700)",
                border: "1px solid var(--primary-300)",
                padding: "8px 12px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                cursor: isRefreshing ? "not-allowed" : "pointer",
                transition: "all 0.3s ease",
                opacity: isRefreshing ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!isRefreshing) {
                  e.target.style.backgroundColor = "var(--primary-200)";
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "var(--primary-100)";
              }}
              title="Refresh table"
            >
              <FiRefreshCw 
                style={{ 
                  animation: isRefreshing ? "spin 1s linear infinite" : "none"
                }} 
              />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>

            <button 
              className="pill" 
              onClick={() => history.push("/charges-form/new")}
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
              title="Add Charge"
            >
              <FaPlus />
              Add Charge
            </button>

            {/* Batch Action Buttons */}
            {showBatchActions && canApprove(PERMISSIONS.CHARGES_MANAGEMENT) && (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "14px", color: "var(--muted-text)", marginRight: "8px" }}>
                  {selectedCharges.length} selected
                </span>
                <button 
                  className="pill" 
                  onClick={() => handleStatusChange("Active")}
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
                  onClick={() => handleStatusChange("Inactive")}
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
                    Charge ID
                    {sortField === 'chargeId' && (
                      <span style={{ marginLeft: '8px', color: 'var(--primary-500)' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th>
                    Name
                    {sortField === 'name' && (
                      <span style={{ marginLeft: '8px', color: 'var(--primary-500)' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th>Currency</th>
                  <th>Amount</th>
                  <th>
                    Status
                    {sortField === 'status' && (
                      <span style={{ marginLeft: '8px', color: 'var(--primary-500)' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCharges.map(charge => (
                  <tr key={charge.chargeId}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedCharges.includes(charge.chargeId)}
                        onChange={(e) => handleSelectCharge(charge.chargeId, e.target.checked)}
                        style={{ cursor: "pointer" }}
                      />
                    </td>
                    <td>{charge.chargeId}</td>
                    <td>{charge.name}</td>
                    <td>{charge.currency}</td>
                    <td>{charge.currency}{parseFloat(charge.amount).toFixed(2)}</td>
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
                            charge.status === "Active" ? "rgba(16, 185, 129, 0.2)" :
                            charge.status === "Inactive" ? "rgba(239, 68, 68, 0.2)" :
                            charge.status === "Pending" ? "rgba(6, 182, 212, 0.2)" :
                            "rgba(107, 114, 128, 0.2)",
                          color: 
                            charge.status === "Active" ? "#059669" :
                            charge.status === "Inactive" ? "#dc2626" :
                            charge.status === "Pending" ? "#0891b2" :
                            "#6b7280",
                          border: `1px solid ${
                            charge.status === "Active" ? "rgba(16, 185, 129, 0.3)" :
                            charge.status === "Inactive" ? "rgba(239, 68, 68, 0.3)" :
                            charge.status === "Pending" ? "rgba(6, 182, 212, 0.3)" :
                            "rgba(107, 114, 128, 0.3)"
                          }`
                        }}
                      >
                        {charge.status}
                      </div>
                    </td>
                    <td>{new Date(charge.createdOn).toLocaleDateString()}</td>
                    <td className="actions">
                      <button className="action-btn action-btn--view" onClick={() => history.push(`/charges-form/${charge.chargeId}`)} title="View">
                        <FiEye />
                      </button>
                      {canEdit(PERMISSIONS.CHARGES_MANAGEMENT) ? (
                        <button className="action-btn action-btn--edit" onClick={() => history.push(`/charges-form/${charge.chargeId}?edit=1`)} title="Update">
                          <FiEdit3 />
                        </button>
                      ) : (
                        <button 
                          className="action-btn action-btn--edit" 
                          onClick={() => showMessage("Your role lacks permission to edit charges", "error")} 
                          title="Update - No Permission"
                          style={{ opacity: 0.5, cursor: "not-allowed" }}
                          disabled
                        >
                          <FiEdit3 />
                        </button>
                      )}
                      {canDelete(PERMISSIONS.CHARGES_MANAGEMENT) ? (
                        <button className="action-btn action-btn--delete" onClick={async () => {
                          try {
                            await axios.delete(`http://localhost:3001/charges/${charge.chargeId}`, { headers: { accessToken: localStorage.getItem("accessToken") } });
                            setCharges(curr => curr.filter(x => x.chargeId !== charge.chargeId));
                            showMessage("Charge deleted successfully", "success");
                          } catch (err) {
                            const msg = err?.response?.data?.error || "Failed to delete charge";
                            showMessage(msg, "error");
                          }
                        }} title="Delete">
                          <FiTrash2 />
                        </button>
                      ) : (
                        <button 
                          className="action-btn action-btn--delete" 
                          onClick={() => showMessage("Your role lacks permission to delete charges", "error")} 
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
            totalItems={sortedCharges.length}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </section>

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
                You are about to {statusAction === "Inactive" ? "Deactivate" : statusAction} {selectedCharges.length} {selectedCharges.length === 1 ? 'charge' : 'charges'}.
              </p>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "var(--primary-700)" }}>
                  Verifier Remarks:
                </label>
                <textarea
                  value={verifierRemarks}
                  onChange={(e) => setVerifierRemarks(e.target.value)}
                  placeholder="Enter remarks for this status change..."
                  style={{
                    width: "100%",
                    height: "100px",
                    padding: "12px",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    fontSize: "14px",
                    resize: "vertical",
                    fontFamily: "inherit"
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  type="button"
                  className="pill"
                  onClick={() => setShowStatusModal(false)}
                  style={{
                    padding: "8px 16px",
                    fontSize: "14px"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="pill"
                  onClick={confirmStatusChange}
                  style={{
                    padding: "8px 16px",
                    fontSize: "14px",
                    backgroundColor: 
                      statusAction === "Active" ? "#10b981" :
                      statusAction === "Inactive" ? "#ef4444" :
                      "var(--primary-500)",
                    color: "white"
                  }}
                >
                  {statusAction === "Inactive" ? "Deactivate" : statusAction}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </DashboardWrapper>
  );
}

export default ChargesManagement;
