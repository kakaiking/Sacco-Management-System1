import React, { useContext, useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import axios from "axios";
import { FiEye, FiEdit3, FiTrash2, FiCheckCircle, FiClock, FiRotateCcw, FiXCircle } from "react-icons/fi";
import { FaPlus } from 'react-icons/fa';
import DashboardWrapper from '../components/DashboardWrapper';
import Pagination from '../components/Pagination';
import { useSnackbar } from "../helpers/SnackbarContext";
import { AuthContext } from "../helpers/AuthContext";
import { usePermissions } from "../hooks/usePermissions";
import { PERMISSIONS } from "../helpers/PermissionUtils";
import frontendLoggingService from "../services/frontendLoggingService";

function CashTransactions() {
  const history = useHistory();
  const { showMessage } = useSnackbar();
  const { authState, isLoading } = useContext(AuthContext);
  const { canView, canAdd, canEdit, canDelete, canApprove } = usePermissions();

  useEffect(() => {
    // Only redirect if authentication check is complete and user is not authenticated
    if (!isLoading && !authState.status) {
      history.push("/login");
    } else if (!isLoading && authState.status) {
      // Log page view when user is authenticated
      frontendLoggingService.logView("CashTransaction", null, null, "Viewed Cash Transactions Maintenance page");
    }
  }, [authState, isLoading, history]);

  const [transactions, setTransactions] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState("");
  const [sortField] = useState("createdOn");
  const [sortDirection] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const controller = new AbortController();
    const fetchTransactions = async () => {
      try {
        const params = {};
        if (statusFilter) params.status = statusFilter;
        if (search) params.q = search;
        const res = await axios.get("http://localhost:3001/transactions/cash", {
          headers: { accessToken: localStorage.getItem("accessToken") },
          params,
          signal: controller.signal,
        });
        const payload = res?.data?.entity?.transactions ?? res?.data?.entity ?? res?.data;
        setTransactions(Array.isArray(payload) ? payload : []);
      } catch {}
    };
    fetchTransactions();
    return () => controller.abort();
  }, [statusFilter, search]);

  const counts = useMemo(() => {
    const list = Array.isArray(transactions) ? transactions : [];
    const c = { Approved: 0, Pending: 0, Returned: 0, Rejected: 0 };
    for (const transaction of list) {
      if (transaction.status && c[transaction.status] !== undefined) c[transaction.status] += 1;
    }
    return c;
  }, [transactions]);

  const sortedTransactions = useMemo(() => {
    const list = Array.isArray(transactions) ? transactions : [];
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
  }, [transactions, sortField, sortDirection]);

  // Pagination logic
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedTransactions.slice(startIndex, endIndex);
  }, [sortedTransactions, currentPage, itemsPerPage]);

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSelectedTransactions([]); // Clear selection when changing pages
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
    setSelectedTransactions([]); // Clear selection
  };

  // Selection functions
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedTransactions(paginatedTransactions.map(transaction => transaction.id));
    } else {
      setSelectedTransactions([]);
    }
  };

  const handleSelectTransaction = (transactionId, checked) => {
    if (checked) {
      setSelectedTransactions(prev => [...prev, transactionId]);
    } else {
      setSelectedTransactions(prev => prev.filter(id => id !== transactionId));
    }
  };

  const isAllSelected = selectedTransactions.length === paginatedTransactions.length && paginatedTransactions.length > 0;
  const isIndeterminate = selectedTransactions.length > 0 && selectedTransactions.length < paginatedTransactions.length;

  // Show/hide batch actions based on selection
  useEffect(() => {
    setShowBatchActions(selectedTransactions.length > 0);
  }, [selectedTransactions]);

  // Status change functions
  const handleStatusChange = (action) => {
    setStatusAction(action);
    setShowStatusModal(true);
  };

  const confirmStatusChange = async () => {
    try {
      // Get before data for logging
      const beforeData = selectedTransactions.map(transactionId => {
        const transaction = transactions.find(transaction => transaction.id === transactionId);
        return {
          id: transactionId,
          transactionId: transaction?.transactionId,
          amount: transaction?.amount,
          status: transaction?.status
        };
      });

      const promises = selectedTransactions.map(transactionId => 
        axios.put(`http://localhost:3001/transactions/${transactionId}/status`, {
          status: statusAction
        }, {
          headers: { accessToken: localStorage.getItem("accessToken") }
        })
      );
      
      await Promise.all(promises);
      
      // Prepare after data for logging
      const afterData = beforeData.map(transaction => ({
        ...transaction,
        status: statusAction
      }));

      // Log the update action with before/after data
      frontendLoggingService.logUpdate(
        "CashTransaction", 
        selectedTransactions.join(','), 
        `${selectedTransactions.length} cash transactions`, 
        beforeData, 
        afterData, 
        `Updated status to ${statusAction} for ${selectedTransactions.length} cash transactions`
      );
      
      // Update local state
      setTransactions(prev => prev.map(transaction => 
        selectedTransactions.includes(transaction.id) 
          ? { ...transaction, status: statusAction }
          : transaction
      ));
      
      showMessage(`${statusAction} ${selectedTransactions.length} cash transaction(s) successfully`, "success");
      setSelectedTransactions([]);
      setShowStatusModal(false);
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to update cash transaction status";
      showMessage(msg, "error");
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Show loading state only when authentication is still loading
  if (isLoading) {
    return (
      <DashboardWrapper>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
          <div>Loading...</div>
        </div>
      </DashboardWrapper>
    );
  }

  // Check if user has permission to view cash transaction module
  if (!canView(PERMISSIONS.CASH_TRANSACTION_MAINTENANCE)) {
    return (
      <DashboardWrapper>
        <div style={{ 
          display: "flex", 
          flexDirection: "column",
          justifyContent: "center", 
          alignItems: "center", 
          height: "400px",
          textAlign: "center",
          padding: "20px"
        }}>
          <div style={{ 
            fontSize: "24px", 
            color: "#e74c3c", 
            marginBottom: "16px",
            fontWeight: "600"
          }}>
            Access Denied
          </div>
          <div style={{ 
            fontSize: "16px", 
            color: "#666", 
            marginBottom: "8px"
          }}>
            You don't have permission to access the Cash Transactions module.
          </div>
          <div style={{ 
            fontSize: "14px", 
            color: "#999",
            marginBottom: "16px"
          }}>
            Please contact your administrator to request access to this feature.
          </div>
          <button 
            onClick={() => history.push("/dashboard")}
            style={{
              backgroundColor: "#3498db",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "14px"
            }}
          >
            Go to Dashboard
          </button>
        </div>
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper>
      <header className="header">
        <div className="header__left">
          <div className="greeting">Cash Transactions Maintenance</div>
        </div>
      </header>

      <main className="dashboard__content">
        <section className="cards cards--status">
          <div className="card card--approved">
            <div className="card__icon">
              <FiCheckCircle />
            </div>
            <div className="card__content">
              <h4>Approved</h4>
              <div className="card__kpi">{counts.Approved}</div>
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
              <h4>Returned</h4>
              <div className="card__kpi">{counts.Returned}</div>
            </div>
          </div>
          <div className="card card--rejected">
            <div className="card__icon">
              <FiXCircle />
            </div>
            <div className="card__content">
              <h4>Rejected</h4>
              <div className="card__kpi">{counts.Rejected}</div>
            </div>
          </div>
        </section>

        <section className="card" style={{ padding: 12 }}>
          <div className="tableToolbar">
            <select className="statusSelect" value={statusFilter} onChange={e => {
              frontendLoggingService.logFilter("Status", e.target.value, "CashTransaction", `Filtered cash transactions by status: ${e.target.value || 'All'}`);
              setStatusFilter(e.target.value);
            }}>
              <option value="">All Statuses</option>
              <option value="Approved">Approved</option>
              <option value="Pending">Pending</option>
              <option value="Returned">Returned</option>
              <option value="Rejected">Rejected</option>
            </select>

            <div className="searchWrapper">
              <input className="searchInput" value={search} onChange={e => {
                if (e.target.value.length > 2 || e.target.value.length === 0) {
                  frontendLoggingService.logSearch(e.target.value, "CashTransaction", null, `Searched for cash transactions: "${e.target.value}"`);
                }
                setSearch(e.target.value);
              }} placeholder="Search cash transactions..." />
              <span className="searchIcon">🔍</span>
            </div>

            {canAdd(PERMISSIONS.CASH_TRANSACTION_MAINTENANCE) ? (
              <button 
                className="pill" 
                onClick={() => {
                  frontendLoggingService.logButtonClick("Add Cash Transaction", "CashTransaction", null, "Clicked Add Cash Transaction button");
                  history.push("/cash-transaction/new");
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
                title="Add Cash Transaction"
              >
                <FaPlus />
                Add Cash Transaction
              </button>
            ) : (
              <button 
                className="pill" 
                onClick={() => showMessage("Your role lacks permission to add cash transactions", "error")}
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
                title="Add Cash Transaction - No Permission"
                disabled
              >
                <FaPlus />
                Add Cash Transaction
              </button>
            )}

            {/* Batch Action Buttons */}
            {showBatchActions && canApprove(PERMISSIONS.CASH_TRANSACTION_MAINTENANCE) && (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "14px", color: "var(--muted-text)", marginRight: "8px" }}>
                  {selectedTransactions.length} selected
                </span>
                <button 
                  className="pill" 
                  onClick={() => {
                    frontendLoggingService.logButtonClick("Approve Cash Transactions", "CashTransaction", null, `Clicked Approve button for ${selectedTransactions.length} selected cash transactions`);
                    handleStatusChange("Approved");
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
                  Approve
                </button>
                <button 
                  className="pill" 
                  onClick={() => {
                    frontendLoggingService.logButtonClick("Return Cash Transactions", "CashTransaction", null, `Clicked Return button for ${selectedTransactions.length} selected cash transactions`);
                    handleStatusChange("Returned");
                  }}
                  style={{
                    backgroundColor: "#f59e0b",
                    color: "white",
                    border: "none",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  Return
                </button>
                <button 
                  className="pill" 
                  onClick={() => {
                    frontendLoggingService.logButtonClick("Reject Cash Transactions", "CashTransaction", null, `Clicked Reject button for ${selectedTransactions.length} selected cash transactions`);
                    handleStatusChange("Rejected");
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
                  Reject
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
                    Transaction ID
                    {sortField === 'transactionId' && (
                      <span style={{ marginLeft: '8px', color: 'var(--primary-500)' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th>Type</th>
                  <th>Member Account</th>
                  <th>Amount</th>
                  <th>Narration</th>
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
                {paginatedTransactions.map(transaction => (
                  <tr key={transaction.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedTransactions.includes(transaction.id)}
                        onChange={(e) => handleSelectTransaction(transaction.id, e.target.checked)}
                        style={{ cursor: "pointer" }}
                      />
                    </td>
                    <td>{transaction.transactionId}</td>
                    <td>
                      <span style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "500",
                        backgroundColor: transaction.transactionType === "debit" ? "#fee2e2" : "#dcfce7",
                        color: transaction.transactionType === "debit" ? "#dc2626" : "#16a34a"
                      }}>
                        {transaction.transactionType === "debit" ? "Withdrawal" : "Deposit"}
                      </span>
                    </td>
                    <td>
                      {transaction.memberAccount?.member?.firstName} {transaction.memberAccount?.member?.lastName}
                      <br />
                      <small style={{ color: "#666" }}>
                        {transaction.memberAccount?.product?.productName}
                      </small>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: "500" }}>
                      {formatAmount(transaction.amount)}
                    </td>
                    <td>{transaction.remarks || '-'}</td>
                    <td>{transaction.createdOn ? new Date(transaction.createdOn).toLocaleDateString() : '-'}</td>
                    <td>{transaction.createdBy || '-'}</td>
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
                            transaction.status === "Approved" ? "rgba(16, 185, 129, 0.2)" :
                            transaction.status === "Pending" ? "rgba(6, 182, 212, 0.2)" :
                            transaction.status === "Returned" ? "rgba(245, 158, 11, 0.2)" :
                            transaction.status === "Rejected" ? "rgba(239, 68, 68, 0.2)" :
                            "rgba(107, 114, 128, 0.2)",
                          color: 
                            transaction.status === "Approved" ? "#059669" :
                            transaction.status === "Pending" ? "#0891b2" :
                            transaction.status === "Returned" ? "#d97706" :
                            transaction.status === "Rejected" ? "#dc2626" :
                            "#6b7280",
                          border: `1px solid ${
                            transaction.status === "Approved" ? "rgba(16, 185, 129, 0.3)" :
                            transaction.status === "Pending" ? "rgba(6, 182, 212, 0.3)" :
                            transaction.status === "Returned" ? "rgba(245, 158, 11, 0.3)" :
                            transaction.status === "Rejected" ? "rgba(239, 68, 68, 0.3)" :
                            "rgba(107, 114, 128, 0.3)"
                          }`
                        }}
                      >
                        {transaction.status}
                      </div>
                    </td>
                    <td className="actions">
                      <button className="action-btn action-btn--view" onClick={() => {
                        frontendLoggingService.logView("CashTransaction", transaction.id, transaction.transactionId, "Viewed cash transaction details");
                        history.push(`/cash-transaction/${transaction.id}`);
                      }} title="View">
                        <FiEye />
                      </button>
                      {canEdit(PERMISSIONS.CASH_TRANSACTION_MAINTENANCE) ? (
                        <button className="action-btn action-btn--edit" onClick={() => {
                          frontendLoggingService.logButtonClick("Edit Cash Transaction", "CashTransaction", transaction.id, `Clicked Edit button for cash transaction: ${transaction.transactionId}`);
                          history.push(`/cash-transaction/${transaction.id}?edit=1`);
                        }} title="Update">
                          <FiEdit3 />
                        </button>
                      ) : (
                        <button 
                          className="action-btn action-btn--edit" 
                          onClick={() => showMessage("Your role lacks permission to edit cash transactions", "error")} 
                          title="Update - No Permission"
                          style={{ opacity: 0.5, cursor: "not-allowed" }}
                          disabled
                        >
                          <FiEdit3 />
                        </button>
                      )}
                      {canDelete(PERMISSIONS.CASH_TRANSACTION_MAINTENANCE) ? (
                        <button className="action-btn action-btn--delete" onClick={async () => {
                          try {
                            // Log the delete action with transaction data before deletion
                            frontendLoggingService.logDelete("CashTransaction", transaction.id, transaction.transactionId, {
                              transactionId: transaction.transactionId,
                              amount: transaction.amount,
                              status: transaction.status
                            }, `Deleted cash transaction: ${transaction.transactionId}`);
                            
                            await axios.delete(`http://localhost:3001/transactions/${transaction.id}`, { headers: { accessToken: localStorage.getItem("accessToken") } });
                            setTransactions(curr => curr.filter(x => x.id !== transaction.id));
                            showMessage("Cash transaction deleted successfully", "success");
                          } catch (err) {
                            const msg = err?.response?.data?.error || "Failed to delete cash transaction";
                            showMessage(msg, "error");
                          }
                        }} title="Delete">
                          <FiTrash2 />
                        </button>
                      ) : (
                        <button 
                          className="action-btn action-btn--delete" 
                          onClick={() => showMessage("Your role lacks permission to delete cash transactions", "error")} 
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
            totalItems={sortedTransactions.length}
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
              You are about to {statusAction} {selectedTransactions.length} {selectedTransactions.length === 1 ? 'cash transaction' : 'cash transactions'}.
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
                  backgroundColor: statusAction === "Rejected" ? "#ef4444" : statusAction === "Returned" ? "#f59e0b" : "#10b981",
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

export default CashTransactions;
