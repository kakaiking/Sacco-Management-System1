import React, { useContext, useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import axios from "axios";
import { FiEye, FiEdit3, FiTrash2, FiCheckCircle, FiClock, FiRotateCcw, FiXCircle, FiRefreshCw } from "react-icons/fi";
import { FaPlus } from 'react-icons/fa';
import DashboardWrapper from '../components/DashboardWrapper';
import Pagination from '../components/Pagination';
import { useSnackbar } from "../helpers/SnackbarContext";
import { AuthContext } from "../helpers/AuthContext";

function GLAccountsManagement() {
  const history = useHistory();
  const { showMessage } = useSnackbar();
  const { authState, isLoading } = useContext(AuthContext);

  useEffect(() => {
    // Only redirect if authentication check is complete and user is not authenticated
    if (!isLoading && !authState.status) {
      history.push("/login");
    }
  }, [authState, isLoading, history]);

  const [glAccounts, setGlAccounts] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState("");
  const [verifierRemarks, setVerifierRemarks] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch GL Accounts function
  const fetchGLAccounts = async (signal) => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (search) params.q = search;
      const res = await axios.get("http://localhost:3001/gl-accounts", {
        headers: { accessToken: localStorage.getItem("accessToken") },
        params,
        signal,
      });
      const payload = res?.data?.entity ?? res?.data;
      setGlAccounts(Array.isArray(payload) ? payload : []);
    } catch {}
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchGLAccounts(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, categoryFilter, search]);

  // Manual refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchGLAccounts();
    setTimeout(() => setIsRefreshing(false), 500); // Show spinner for at least 500ms
    showMessage("GL Accounts refreshed successfully", "success");
  };

  const counts = useMemo(() => {
    return glAccounts.reduce((acc, account) => {
      acc[account.status] = (acc[account.status] || 0) + 1;
      return acc;
    }, {});
  }, [glAccounts]);

  const categoryCounts = useMemo(() => {
    return glAccounts.reduce((acc, account) => {
      acc[account.accountCategory] = (acc[account.accountCategory] || 0) + 1;
      return acc;
    }, {});
  }, [glAccounts]);

  // Pagination logic
  const paginatedAccounts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return glAccounts.slice(startIndex, endIndex);
  }, [glAccounts, currentPage, itemsPerPage]);

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSelectedAccounts([]); // Clear selection when changing pages
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
    setSelectedAccounts([]); // Clear selection
  };

  const isAllSelected = selectedAccounts.length === paginatedAccounts.length && paginatedAccounts.length > 0;
  const isIndeterminate = selectedAccounts.length > 0 && selectedAccounts.length < paginatedAccounts.length;

  const handleSelectAccount = (accountId, checked) => {
    if (checked) {
      setSelectedAccounts(prev => [...prev, accountId]);
    } else {
      setSelectedAccounts(prev => prev.filter(id => id !== accountId));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedAccounts(paginatedAccounts.map(account => account.id));
    } else {
      setSelectedAccounts([]);
    }
  };

  useEffect(() => {
    setShowBatchActions(selectedAccounts.length > 0);
  }, [selectedAccounts]);

  const handleDelete = async (accountId) => {
    if (window.confirm("Are you sure you want to delete this GL account?")) {
      try {
        await axios.delete(`http://localhost:3001/gl-accounts/${accountId}`, {
          headers: { accessToken: localStorage.getItem("accessToken") },
        });
        showMessage("GL Account deleted successfully", "success");
        setGlAccounts(prev => prev.filter(account => account.id !== accountId));
      } catch (err) {
        const msg = err?.response?.data?.error || "Failed to delete GL account";
        showMessage(msg, "error");
      }
    }
  };

  // Status change functions
  const handleStatusChange = (action) => {
    setStatusAction(action);
    setShowStatusModal(true);
  };

  const confirmStatusChange = async () => {
    try {
      const promises = selectedAccounts.map(accountId => 
        axios.put(`http://localhost:3001/gl-accounts/${accountId}`, {
          status: statusAction,
          remarks: verifierRemarks
        }, { 
          headers: { accessToken: localStorage.getItem("accessToken") } 
        })
      );
      
      await Promise.all(promises);
      
      // Update local state
      setGlAccounts(prev => prev.map(account => 
        selectedAccounts.includes(account.id) 
          ? { ...account, status: statusAction, remarks: verifierRemarks }
          : account
      ));
      
      showMessage(`${statusAction} ${selectedAccounts.length} GL account(s) successfully`, "success");
      setSelectedAccounts([]);
      setShowStatusModal(false);
      setVerifierRemarks("");
    } catch (err) {
      console.error("Error updating GL account status:", err);
      const msg = err?.response?.data?.message || err?.response?.data?.error || "Failed to update GL account status";
      showMessage(msg, "error");
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'ASSET': '#10b981',
      'LIABILITY': '#f59e0b', 
      'EQUITY': '#3b82f6',
      'INCOME': '#8b5cf6',
      'EXPENSE': '#ef4444'
    };
    return colors[category] || '#6b7280';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'ASSET': '💰',
      'LIABILITY': '📋',
      'EQUITY': '🏛️',
      'INCOME': '📈',
      'EXPENSE': '💸'
    };
    return icons[category] || '📊';
  };

  return (
    <DashboardWrapper>
      <header className="header">
        <div className="header__left">
          <div className="greeting">GL Accounts Management</div>
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
          <div className="card card--pending">
            <div className="card__icon">
              <FiClock />
            </div>
            <div className="card__content">
              <h4>Inactive</h4>
              <div className="card__kpi">{counts.Inactive || 0}</div>
            </div>
          </div>
          <div className="card card--returned">
            <div className="card__icon">
              <FiRotateCcw />
            </div>
            <div className="card__content">
              <h4>Suspended</h4>
              <div className="card__kpi">{counts.Suspended || 0}</div>
            </div>
          </div>
          <div className="card card--rejected">
            <div className="card__icon">
              <FiXCircle />
            </div>
            <div className="card__content">
              <h4>Closed</h4>
              <div className="card__kpi">{counts.Closed || 0}</div>
            </div>
          </div>
        </section>

        {/* Category Cards */}
        <section className="cards" style={{ marginBottom: "24px" }}>
          <div className="card" style={{ backgroundColor: "#10b981", color: "white" }}>
            <div className="card__content">
              <h4>💰 Assets</h4>
              <div className="card__kpi">{categoryCounts.ASSET || 0}</div>
            </div>
          </div>
          <div className="card" style={{ backgroundColor: "#f59e0b", color: "white" }}>
            <div className="card__content">
              <h4>📋 Liabilities</h4>
              <div className="card__kpi">{categoryCounts.LIABILITY || 0}</div>
            </div>
          </div>
          <div className="card" style={{ backgroundColor: "#3b82f6", color: "white" }}>
            <div className="card__content">
              <h4>🏛️ Equity</h4>
              <div className="card__kpi">{categoryCounts.EQUITY || 0}</div>
            </div>
          </div>
          <div className="card" style={{ backgroundColor: "#8b5cf6", color: "white" }}>
            <div className="card__content">
              <h4>📈 Income</h4>
              <div className="card__kpi">{categoryCounts.INCOME || 0}</div>
            </div>
          </div>
          <div className="card" style={{ backgroundColor: "#ef4444", color: "white" }}>
            <div className="card__content">
              <h4>💸 Expenses</h4>
              <div className="card__kpi">{categoryCounts.EXPENSE || 0}</div>
            </div>
          </div>
        </section>

        <section className="card" style={{ padding: 12 }}>
          <div className="tableToolbar">
            <select className="statusSelect" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
              <option value="Closed">Closed</option>
            </select>

            <select className="statusSelect" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              <option value="">All Categories</option>
              <option value="ASSET">Assets</option>
              <option value="LIABILITY">Liabilities</option>
              <option value="EQUITY">Equity</option>
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expenses</option>
            </select>

            <div className="searchWrapper">
              <input className="searchInput" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search GL accounts..." />
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
              onClick={() => history.push("/gl-account-form/new")}
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
              title="Add GL Account"
            >
              <FaPlus />
              Add GL Account
            </button>

            {/* Batch Action Buttons */}
            {showBatchActions && (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "14px", color: "var(--muted-text)", marginRight: "8px" }}>
                  {selectedAccounts.length} selected
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
                    backgroundColor: "#6b7280",
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
                <button 
                  className="pill" 
                  onClick={() => handleStatusChange("Suspended")}
                  style={{
                    backgroundColor: "#f97316",
                    color: "white",
                    border: "none",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  Suspend
                </button>
                <button 
                  className="pill" 
                  onClick={() => handleStatusChange("Closed")}
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
                  Close
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
                  <th>GL Account ID</th>
                  <th>Account Name</th>
                  <th>Category</th>
                  <th>Sub Category</th>
                  <th>Normal Balance</th>
                  <th>Balance (KSH)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAccounts.map(account => (
                  <tr key={account.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedAccounts.includes(account.id)}
                        onChange={(e) => handleSelectAccount(account.id, e.target.checked)}
                        style={{ cursor: "pointer" }}
                      />
                    </td>
                    <td>{account.glAccountId}</td>
                    <td>{account.accountName}</td>
                    <td>
                      <div 
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "4px 8px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: "600",
                          backgroundColor: `${getCategoryColor(account.accountCategory)}20`,
                          color: getCategoryColor(account.accountCategory),
                          border: `1px solid ${getCategoryColor(account.accountCategory)}40`
                        }}
                      >
                        <span>{getCategoryIcon(account.accountCategory)}</span>
                        {account.accountCategory}
                      </div>
                    </td>
                    <td>{account.accountSubCategory || 'N/A'}</td>
                    <td>
                      <div 
                        style={{
                          display: "inline-block",
                          padding: "4px 8px",
                          borderRadius: "8px",
                          fontSize: "11px",
                          fontWeight: "600",
                          textTransform: "uppercase",
                          backgroundColor: account.normalBalance === 'DEBIT' ? "#fef3c7" : "#dbeafe",
                          color: account.normalBalance === 'DEBIT' ? "#92400e" : "#1e40af"
                        }}
                      >
                        {account.normalBalance}
                      </div>
                    </td>
                    <td>{account.availableBalance?.toLocaleString() || '0'}</td>
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
                            account.status === "Active" ? "rgba(16, 185, 129, 0.2)" :
                            account.status === "Inactive" ? "rgba(107, 114, 128, 0.2)" :
                            account.status === "Suspended" ? "rgba(249, 115, 22, 0.2)" :
                            account.status === "Closed" ? "rgba(239, 68, 68, 0.2)" :
                            "rgba(107, 114, 128, 0.2)",
                          color: 
                            account.status === "Active" ? "#059669" :
                            account.status === "Inactive" ? "#6b7280" :
                            account.status === "Suspended" ? "#ea580c" :
                            account.status === "Closed" ? "#dc2626" :
                            "#6b7280",
                          border: `1px solid ${
                            account.status === "Active" ? "rgba(16, 185, 129, 0.3)" :
                            account.status === "Inactive" ? "rgba(107, 114, 128, 0.3)" :
                            account.status === "Suspended" ? "rgba(249, 115, 22, 0.3)" :
                            account.status === "Closed" ? "rgba(239, 68, 68, 0.3)" :
                            "rgba(107, 114, 128, 0.3)"
                          }`
                        }}
                      >
                        {account.status}
                      </div>
                    </td>
                    <td>
                      <div className="actions">
                        <button
                          className="action-btn action-btn--view"
                          onClick={() => history.push(`/gl-account-form/${account.id}`)}
                          title="View"
                        >
                          <FiEye />
                        </button>
                        <button
                          className="action-btn action-btn--edit"
                          onClick={() => history.push(`/gl-account-form/${account.id}?edit=1`)}
                          title="Edit"
                        >
                          <FiEdit3 />
                        </button>
                        <button
                          className="action-btn action-btn--delete"
                          onClick={() => handleDelete(account.id)}
                          title="Delete"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={glAccounts.length}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </section>
      </main>

      {/* Status Change Modal */}
      {showStatusModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "white",
            padding: "24px",
            borderRadius: "12px",
            width: "90%",
            maxWidth: "500px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
          }}>
            <h3 style={{
              margin: "0 0 16px 0",
              fontSize: "18px",
              fontWeight: "600",
              color: "var(--primary-700)"
            }}>
              Change Status to {statusAction}
            </h3>
            
            <p style={{
              margin: "0 0 20px 0",
              color: "var(--muted-text)",
              fontSize: "14px"
            }}>
              You are about to change the status of {selectedAccounts.length} GL account(s) to <strong>{statusAction}</strong>.
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
                    statusAction === "Inactive" ? "#6b7280" :
                    statusAction === "Suspended" ? "#f97316" :
                    statusAction === "Closed" ? "#ef4444" :
                    "var(--primary-500)",
                  color: "white"
                }}
              >
                {statusAction}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardWrapper>
  );
}

export default GLAccountsManagement;
