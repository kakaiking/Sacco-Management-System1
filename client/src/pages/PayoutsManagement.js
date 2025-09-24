import React, { useContext, useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import axios from "axios";
import { FiEye, FiEdit3, FiTrash2, FiCheckCircle, FiClock, FiRotateCcw, FiPlay } from "react-icons/fi";
import { FaPlus } from 'react-icons/fa';
import DashboardWrapper from '../components/DashboardWrapper';
import Pagination from '../components/Pagination';
import { useSnackbar } from "../helpers/SnackbarContext";
import { AuthContext } from "../helpers/AuthContext";
import { usePermissions } from "../hooks/usePermissions";
import { PERMISSIONS } from "../helpers/PermissionUtils";
import frontendLoggingService from "../services/frontendLoggingService";

function PayoutsManagement() {
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
      frontendLoggingService.logView("PayoutsManagement", null, null, "Viewed Payouts Management page");
    }
  }, [authState, isLoading, history]);

  const [payouts, setPayouts] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedPayouts, setSelectedPayouts] = useState([]);
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState("");
  const [sortField] = useState("createdOn");
  const [sortDirection] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const controller = new AbortController();
    const fetchPayouts = async () => {
      try {
        const params = {};
        if (statusFilter) params.status = statusFilter;
        if (search) params.q = search;
        const res = await axios.get("http://localhost:3001/payouts", {
          headers: { 
            'accessToken': localStorage.getItem('accessToken'),
            'Content-Type': 'application/json'
          },
          params,
          signal: controller.signal,
        });
        const payload = res?.data?.data?.payouts ?? res?.data?.data ?? res?.data;
        setPayouts(Array.isArray(payload) ? payload : []);
      } catch {}
    };
    fetchPayouts();
    return () => controller.abort();
  }, [statusFilter, search]);

  const counts = useMemo(() => {
    const list = Array.isArray(payouts) ? payouts : [];
    const c = { PENDING: 0, PROCESSED: 0, FAILED: 0, CANCELLED: 0 };
    for (const payout of list) {
      if (payout.status && c[payout.status] !== undefined) c[payout.status] += 1;
    }
    return c;
  }, [payouts]);

  const sortedPayouts = useMemo(() => {
    const list = Array.isArray(payouts) ? payouts : [];
    return [...list].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle date sorting
      if (sortField === 'createdOn' || sortField === 'payoutDate') {
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
  }, [payouts, sortField, sortDirection]);

  // Pagination logic
  const paginatedPayouts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedPayouts.slice(startIndex, endIndex);
  }, [sortedPayouts, currentPage, itemsPerPage]);

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSelectedPayouts([]); // Clear selection when changing pages
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
    setSelectedPayouts([]); // Clear selection
  };

  // Selection functions
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedPayouts(paginatedPayouts.map(payout => payout.id));
    } else {
      setSelectedPayouts([]);
    }
  };

  const handleSelectPayout = (payoutId, checked) => {
    if (checked) {
      setSelectedPayouts(prev => [...prev, payoutId]);
    } else {
      setSelectedPayouts(prev => prev.filter(id => id !== payoutId));
    }
  };

  const isAllSelected = selectedPayouts.length === paginatedPayouts.length && paginatedPayouts.length > 0;
  const isIndeterminate = selectedPayouts.length > 0 && selectedPayouts.length < paginatedPayouts.length;

  // Show/hide batch actions based on selection
  useEffect(() => {
    setShowBatchActions(selectedPayouts.length > 0);
  }, [selectedPayouts]);

  // Status change functions
  const handleStatusChange = (action) => {
    setStatusAction(action);
    setShowStatusModal(true);
  };

  const confirmStatusChange = async () => {
    try {
      // Get before data for logging
      const beforeData = selectedPayouts.map(payoutId => {
        const payout = payouts.find(payout => payout.id === payoutId);
        return {
          id: payoutId,
          payoutId: payout?.payoutId,
          accountId: payout?.accountId,
          status: payout?.status
        };
      });

      const promises = selectedPayouts.map(payoutId => 
        axios.put(`http://localhost:3001/payouts/${payoutId}/status`, {
          status: statusAction
        }, {
          headers: { 
            'accessToken': localStorage.getItem('accessToken'),
            'Content-Type': 'application/json'
          }
        })
      );
      
      await Promise.all(promises);
      
      // Prepare after data for logging
      const afterData = beforeData.map(payout => ({
        ...payout,
        status: statusAction
      }));

      // Log the update action with before/after data
      frontendLoggingService.logUpdate(
        "Payout", 
        selectedPayouts.join(','), 
        `${selectedPayouts.length} payouts`, 
        beforeData, 
        afterData, 
        `Updated status to ${statusAction} for ${selectedPayouts.length} payouts`
      );
      
      // Update local state
      setPayouts(prev => prev.map(payout => 
        selectedPayouts.includes(payout.id) 
          ? { ...payout, status: statusAction }
          : payout
      ));
      
      showMessage(`${statusAction} ${selectedPayouts.length} payout(s) successfully`, "success");
      setSelectedPayouts([]);
      setShowStatusModal(false);
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to update payout status";
      showMessage(msg, "error");
    }
  };

  // Process payout
  const handleProcessPayout = async (payoutId) => {
    if (!window.confirm('Are you sure you want to process this payout? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await axios.post(`http://localhost:3001/payouts/${payoutId}/process`, {}, {
        headers: { 
          'accessToken': localStorage.getItem('accessToken'),
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setPayouts(prev => prev.map(payout => 
          payout.id === payoutId 
            ? { ...payout, status: 'PROCESSED' }
            : payout
        ));
        frontendLoggingService.logUserAction('Payout Processed', 'Payouts Management');
        showMessage("Payout processed successfully", "success");
      }
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to process payout";
      showMessage(msg, "error");
    }
  };

  return (
    <DashboardWrapper>
      <header className="header">
        <div className="header__left">
          <div className="greeting">Payouts Management</div>
        </div>
      </header>

      <main className="dashboard__content">
        <section className="cards cards--status">
          <div className="card card--approved">
            <div className="card__icon">
              <FiCheckCircle />
            </div>
            <div className="card__content">
              <h4>Processed</h4>
              <div className="card__kpi">{counts.PROCESSED}</div>
            </div>
          </div>
          <div className="card card--pending">
            <div className="card__icon">
              <FiClock />
            </div>
            <div className="card__content">
              <h4>Pending</h4>
              <div className="card__kpi">{counts.PENDING}</div>
            </div>
          </div>
          <div className="card card--returned">
            <div className="card__icon">
              <FiRotateCcw />
            </div>
            <div className="card__content">
              <h4>Failed</h4>
              <div className="card__kpi">{counts.FAILED}</div>
            </div>
          </div>
        </section>

        <section className="card" style={{ padding: 12 }}>
          <div className="tableToolbar">
            <select className="statusSelect" value={statusFilter} onChange={e => {
              frontendLoggingService.logFilter("Status", e.target.value, "PayoutsManagement", `Filtered payouts by status: ${e.target.value || 'All'}`);
              setStatusFilter(e.target.value);
            }}>
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSED">Processed</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <div className="searchWrapper">
              <input className="searchInput" value={search} onChange={e => {
                if (e.target.value.length > 2 || e.target.value.length === 0) {
                  frontendLoggingService.logSearch(e.target.value, "PayoutsManagement", null, `Searched for payouts: "${e.target.value}"`);
                }
                setSearch(e.target.value);
              }} placeholder="Search payouts..." />
              <span className="searchIcon">🔍</span>
            </div>

            {canAdd(PERMISSIONS.PAYOUTS_MANAGEMENT) ? (
              <button 
                className="pill" 
                onClick={() => {
                  frontendLoggingService.logButtonClick("Add Payout", "PayoutsManagement", null, "Clicked Add Payout button");
                  history.push("/payouts/new");
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
                title="Add Payout"
              >
                <FaPlus />
                Add Payout
              </button>
            ) : (
              <button 
                className="pill" 
                onClick={() => showMessage("Your role lacks permission to add payouts", "error")}
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
                title="Add Payout - No Permission"
                disabled
              >
                <FaPlus />
                Add Payout
              </button>
            )}

            {/* Batch Action Buttons */}
            {showBatchActions && canApprove(PERMISSIONS.PAYOUTS_MANAGEMENT) && (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "14px", color: "var(--muted-text)", marginRight: "8px" }}>
                  {selectedPayouts.length} selected
                </span>
                <button 
                  className="pill" 
                  onClick={() => {
                    frontendLoggingService.logButtonClick("Process Payouts", "PayoutsManagement", null, `Clicked Process button for ${selectedPayouts.length} selected payouts`);
                    handleStatusChange("PROCESSED");
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
                  Process
                </button>
                <button 
                  className="pill" 
                  onClick={() => {
                    frontendLoggingService.logButtonClick("Cancel Payouts", "PayoutsManagement", null, `Clicked Cancel button for ${selectedPayouts.length} selected payouts`);
                    handleStatusChange("CANCELLED");
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
                  Cancel
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
                  <th>Payout ID</th>
                  <th>Type</th>
                  <th>Account ID</th>
                  <th>Principal Amount</th>
                  <th>Interest Rate</th>
                  <th>Interest Amount</th>
                  <th>Payout Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPayouts.map(payout => (
                  <tr key={payout.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedPayouts.includes(payout.id)}
                        onChange={(e) => handleSelectPayout(payout.id, e.target.checked)}
                        style={{ cursor: "pointer" }}
                      />
                    </td>
                    <td>{payout.payoutId || payout.id}</td>
                    <td>
                      <span style={{
                        display: "inline-block",
                        padding: "4px 8px",
                        borderRadius: "12px",
                        fontSize: "11px",
                        fontWeight: "600",
                        textTransform: "uppercase",
                        backgroundColor: payout.payoutType === "INTEREST_PAYOUT" ? "rgba(59, 130, 246, 0.2)" : "rgba(245, 158, 11, 0.2)",
                        color: payout.payoutType === "INTEREST_PAYOUT" ? "#1d4ed8" : "#d97706"
                      }}>
                        {payout.payoutType === 'INTEREST_PAYOUT' ? 'Payout' : 'Collection'}
                      </span>
                    </td>
                    <td><code>{payout.accountId}</code></td>
                    <td>
                      <span className="fw-bold">
                        {parseFloat(payout.principalAmount || 0).toLocaleString('en-KE', {
                          style: 'currency',
                          currency: 'KES'
                        })}
                      </span>
                    </td>
                    <td>
                      <span className="fw-bold">
                        {(parseFloat(payout.interestRate || 0) * 100).toFixed(2)}%
                      </span>
                    </td>
                    <td>
                      <span className="fw-bold text-success">
                        {parseFloat(payout.interestAmount || 0).toLocaleString('en-KE', {
                          style: 'currency',
                          currency: 'KES'
                        })}
                      </span>
                    </td>
                    <td>{payout.payoutDate ? new Date(payout.payoutDate).toLocaleDateString() : '-'}</td>
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
                            payout.status === "PENDING" ? "rgba(6, 182, 212, 0.2)" :
                            payout.status === "PROCESSED" ? "rgba(16, 185, 129, 0.2)" :
                            payout.status === "FAILED" ? "rgba(239, 68, 68, 0.2)" :
                            payout.status === "CANCELLED" ? "rgba(107, 114, 128, 0.2)" :
                            "rgba(107, 114, 128, 0.2)",
                          color: 
                            payout.status === "PENDING" ? "#0891b2" :
                            payout.status === "PROCESSED" ? "#059669" :
                            payout.status === "FAILED" ? "#dc2626" :
                            payout.status === "CANCELLED" ? "#6b7280" :
                            "#6b7280",
                          border: `1px solid ${
                            payout.status === "PENDING" ? "rgba(6, 182, 212, 0.3)" :
                            payout.status === "PROCESSED" ? "rgba(16, 185, 129, 0.3)" :
                            payout.status === "FAILED" ? "rgba(239, 68, 68, 0.3)" :
                            payout.status === "CANCELLED" ? "rgba(107, 114, 128, 0.3)" :
                            "rgba(107, 114, 128, 0.3)"
                          }`
                        }}
                      >
                        {payout.status}
                      </div>
                    </td>
                    <td className="actions">
                      <button className="action-btn action-btn--view" onClick={() => {
                        frontendLoggingService.logView("PayoutsManagement", payout.id, payout.payoutId, "Viewed payout details");
                        history.push(`/payouts/${payout.id}`);
                      }} title="View">
                        <FiEye />
                      </button>
                      {canEdit(PERMISSIONS.PAYOUTS_MANAGEMENT) && payout.status === 'PENDING' ? (
                        <button className="action-btn action-btn--edit" onClick={() => {
                          frontendLoggingService.logButtonClick("Edit Payout", "PayoutsManagement", payout.id, `Clicked Edit button for payout: ${payout.payoutId}`);
                          history.push(`/payouts/${payout.id}?edit=1`);
                        }} title="Update">
                          <FiEdit3 />
                        </button>
                      ) : (
                        <button 
                          className="action-btn action-btn--edit" 
                          onClick={() => showMessage("Your role lacks permission to edit payouts or payout is not editable", "error")} 
                          title="Update - No Permission or Not Editable"
                          style={{ opacity: 0.5, cursor: "not-allowed" }}
                          disabled
                        >
                          <FiEdit3 />
                        </button>
                      )}
                      {payout.status === 'PENDING' && (
                        <button className="action-btn action-btn--process" onClick={() => {
                          frontendLoggingService.logButtonClick("Process Payout", "PayoutsManagement", payout.id, `Clicked Process button for payout: ${payout.payoutId}`);
                          handleProcessPayout(payout.id);
                        }} title="Process">
                          <FiPlay />
                        </button>
                      )}
                      {canDelete(PERMISSIONS.PAYOUTS_MANAGEMENT) && payout.status === 'PENDING' ? (
                        <button className="action-btn action-btn--delete" onClick={async () => {
                          try {
                            // Log the delete action with payout data before deletion
                            frontendLoggingService.logDelete("PayoutsManagement", payout.id, payout.payoutId, {
                              payoutId: payout.payoutId,
                              accountId: payout.accountId,
                              status: payout.status
                            }, `Deleted payout: ${payout.payoutId}`);
                            
                            await axios.delete(`http://localhost:3001/payouts/${payout.id}`, { 
                              headers: { 
                                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                                'Content-Type': 'application/json'
                              } 
                            });
                            setPayouts(curr => curr.filter(x => x.id !== payout.id));
                            showMessage("Payout deleted successfully", "success");
                          } catch (err) {
                            const msg = err?.response?.data?.error || "Failed to delete payout";
                            showMessage(msg, "error");
                          }
                        }} title="Delete">
                          <FiTrash2 />
                        </button>
                      ) : (
                        <button 
                          className="action-btn action-btn--delete" 
                          onClick={() => showMessage("Your role lacks permission to delete payouts or payout is not deletable", "error")} 
                          title="Delete - No Permission or Not Deletable"
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
            totalItems={sortedPayouts.length}
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
              You are about to {statusAction === "CANCELLED" ? "Cancel" : statusAction} {selectedPayouts.length} {selectedPayouts.length === 1 ? 'payout' : 'payouts'}.
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
                  backgroundColor: statusAction === "CANCELLED" ? "#ef4444" : "#10b981",
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

export default PayoutsManagement;
