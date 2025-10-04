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

function TransactionMaintenance({ isWindowMode = false, onRefresh }) {
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
      frontendLoggingService.logView("Transaction", null, null, "Viewed Transaction Maintenance page");
    }
  }, [authState, isLoading, history]);

  const [transactions, setTransactions] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState("");
  const [verifierRemarks, setVerifierRemarks] = useState("");
  const [sortField] = useState("createdOn");
  const [sortDirection] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Extract fetch function so it can be called on demand
  const fetchTransactions = async (signal) => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (search) params.q = search;
      const res = await axios.get("http://localhost:3001/transactions", {
        headers: { accessToken: localStorage.getItem("accessToken") },
        params,
        signal,
      });
      const payload = res?.data?.entity ?? res?.data;
      setTransactions(Array.isArray(payload) ? payload : []);
    } catch {}
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchTransactions(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, search]);

  // Handle refresh from window header button
  useEffect(() => {
    if (onRefresh) {
      onRefresh(async () => {
        await fetchTransactions();
        showMessage("Transactions refreshed successfully", "success");
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRefresh]);

  const counts = useMemo(() => {
    const list = Array.isArray(transactions) ? transactions : [];
    const c = { Approved: 0, Pending: 0, Returned: 0, Rejected: 0 };
    for (const t of list) {
      if (t.status && c[t.status] !== undefined) c[t.status] += 1;
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
      // Get all unique reference numbers from paginated transactions
      const uniqueReferenceNumbers = [...new Set(paginatedTransactions.map(t => t.referenceNumber))];
      
      // Select all transactions that have reference numbers in the current page
      const allTransactionsWithSameReferences = transactions
        .filter(t => uniqueReferenceNumbers.includes(t.referenceNumber))
        .map(t => t.id);
      
      setSelectedTransactions(allTransactionsWithSameReferences);
    } else {
      setSelectedTransactions([]);
    }
  };

  const handleSelectTransaction = (transactionId, checked) => {
    // Find the clicked transaction to get its reference number
    const clickedTransaction = transactions.find(t => t.id === transactionId);
    if (!clickedTransaction) return;

    if (checked) {
      // Select all transactions with the same reference number
      const sameReferenceTransactions = transactions
        .filter(t => t.referenceNumber === clickedTransaction.referenceNumber)
        .map(t => t.id);
      
      setSelectedTransactions(prev => {
        // Add all transactions with same reference number, avoiding duplicates
        const newSelection = [...prev];
        sameReferenceTransactions.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    } else {
      // Deselect all transactions with the same reference number
      setSelectedTransactions(prev => 
        prev.filter(id => {
          const transaction = transactions.find(t => t.id === id);
          return transaction && transaction.referenceNumber !== clickedTransaction.referenceNumber;
        })
      );
    }
  };

  // Check if all reference numbers in current page are selected
  const isAllSelected = useMemo(() => {
    if (paginatedTransactions.length === 0) return false;
    
    const uniqueReferenceNumbers = [...new Set(paginatedTransactions.map(t => t.referenceNumber))];
    const selectedReferenceNumbers = [...new Set(
      selectedTransactions
        .map(id => transactions.find(t => t.id === id))
        .filter(t => t)
        .map(t => t.referenceNumber)
    )];
    
    return uniqueReferenceNumbers.every(ref => selectedReferenceNumbers.includes(ref));
  }, [paginatedTransactions, selectedTransactions, transactions]);

  const isIndeterminate = useMemo(() => {
    if (paginatedTransactions.length === 0) return false;
    
    const uniqueReferenceNumbers = [...new Set(paginatedTransactions.map(t => t.referenceNumber))];
    const selectedReferenceNumbers = [...new Set(
      selectedTransactions
        .map(id => transactions.find(t => t.id === id))
        .filter(t => t)
        .map(t => t.referenceNumber)
    )];
    
    const selectedRefsInPage = uniqueReferenceNumbers.filter(ref => selectedReferenceNumbers.includes(ref));
    return selectedRefsInPage.length > 0 && selectedRefsInPage.length < uniqueReferenceNumbers.length;
  }, [paginatedTransactions, selectedTransactions, transactions]);

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
        const transaction = transactions.find(t => t.id === transactionId);
        return {
          id: transactionId,
          transactionId: transaction?.transactionId,
          referenceNumber: transaction?.referenceNumber,
          amount: transaction?.amount,
          status: transaction?.status
        };
      });

      // For Approved status, use the proper approval endpoint
      if (statusAction === "Approved") {
        const promises = selectedTransactions.map(async transactionId => {
          const transaction = transactions.find(t => t.id === transactionId);
          if (!transaction?.referenceNumber) {
            throw new Error(`Transaction ${transactionId} has no reference number`);
          }
          // Use the correct approval endpoint that updates balances
          return axios.put(
            `http://localhost:3001/transactions/reference/${transaction.referenceNumber}/approve`, 
            { verifierRemarks: verifierRemarks },
            { headers: { accessToken: localStorage.getItem("accessToken") } }
          );
        });
        await Promise.all(promises);
      } else {
        // For other status changes (Return, Reject), use the regular update
        const promises = selectedTransactions.map(transactionId => 
          axios.put(`http://localhost:3001/transactions/${transactionId}`, {
            status: statusAction,
            verifierRemarks: verifierRemarks
          }, {
            headers: { accessToken: localStorage.getItem("accessToken") }
          })
        );
        await Promise.all(promises);
      }
      
      // Prepare after data for logging
      const afterData = beforeData.map(transaction => ({
        ...transaction,
        status: statusAction,
        verifierRemarks: verifierRemarks
      }));

      // Log the update action with before/after data
      frontendLoggingService.logUpdate(
        "Transaction", 
        selectedTransactions.join(','), 
        `${selectedTransactions.length} transactions`, 
        beforeData, 
        afterData, 
        `Updated status to ${statusAction} for ${selectedTransactions.length} transactions`
      );
      
      // Update local state
      setTransactions(prev => prev.map(transaction => 
        selectedTransactions.includes(transaction.id) 
          ? { ...transaction, status: statusAction, verifierRemarks: verifierRemarks }
          : transaction
      ));
      
      showMessage(`${statusAction} ${selectedTransactions.length} transaction(s) successfully`, "success");
      setSelectedTransactions([]);
      setShowStatusModal(false);
      setVerifierRemarks("");
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to update transaction status";
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
              <h4>Approved</h4>
              <div className="card__kpi">{counts.Approved}</div>
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
              <h4>Returned</h4>
              <div className="card__kpi">{counts.Returned}</div>
            </div>
          </div>
          <div className="card card--rejected" style={{ borderRadius: '12px' }}>
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
              frontendLoggingService.logFilter("Status", e.target.value, "Transaction", `Filtered transactions by status: ${e.target.value || 'All'}`);
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
                  frontendLoggingService.logSearch(e.target.value, "Transaction", null, `Searched for transactions: "${e.target.value}"`);
                }
                setSearch(e.target.value);
              }} placeholder="Search transactions..." />
              <span className="searchIcon">🔍</span>
            </div>

            {/* Batch Action Buttons */}
            {showBatchActions && canApprove(PERMISSIONS.TRANSACTION_MAINTENANCE) && (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "14px", color: "var(--muted-text)", marginRight: "8px" }}>
                  {selectedTransactions.length} transactions selected
                  {(() => {
                    const selectedRefs = [...new Set(
                      selectedTransactions
                        .map(id => transactions.find(t => t.id === id))
                        .filter(t => t)
                        .map(t => t.referenceNumber)
                    )];
                    return selectedRefs.length > 0 ? ` (${selectedRefs.length} reference${selectedRefs.length > 1 ? 's' : ''})` : '';
                  })()}
                </span>
                <button 
                  className="pill" 
                  onClick={() => {
                    frontendLoggingService.logButtonClick("Approve Transactions", "Transaction", null, `Clicked Approve button for ${selectedTransactions.length} selected transactions`);
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
                    frontendLoggingService.logButtonClick("Return Transactions", "Transaction", null, `Clicked Return button for ${selectedTransactions.length} selected transactions`);
                    handleStatusChange("Returned");
                  }}
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
                  Return
                </button>
                <button 
                  className="pill" 
                  onClick={() => {
                    frontendLoggingService.logButtonClick("Reject Transactions", "Transaction", null, `Clicked Reject button for ${selectedTransactions.length} selected transactions`);
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
                  <th>
                    Reference Number
                    {sortField === 'referenceNumber' && (
                      <span style={{ marginLeft: '8px', color: 'var(--primary-500)' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th>Account</th>
                  <th>Entry Type</th>
                  <th>Amount</th>
                  <th>
                    Created On
                    {sortField === 'createdOn' && (
                      <span style={{ marginLeft: '8px', color: 'var(--primary-500)' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
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
                {paginatedTransactions.map((t, index) => {
                  // Check if this is the first occurrence of this reference number in the current page
                  const isFirstOfReference = paginatedTransactions.findIndex(tr => tr.referenceNumber === t.referenceNumber) === index;
                  const referenceCount = paginatedTransactions.filter(tr => tr.referenceNumber === t.referenceNumber).length;
                  
                  return (
                    <tr 
                      key={t.id}
                      style={{
                        backgroundColor: isFirstOfReference && referenceCount > 1 
                          ? 'rgba(59, 130, 246, 0.05)' 
                          : 'transparent',
                        borderLeft: isFirstOfReference && referenceCount > 1 
                          ? '3px solid rgba(59, 130, 246, 0.3)' 
                          : '3px solid transparent'
                      }}
                    >
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedTransactions.includes(t.id)}
                        onChange={(e) => handleSelectTransaction(t.id, e.target.checked)}
                        style={{ cursor: "pointer" }}
                        title={`Select all transactions with reference ${t.referenceNumber}`}
                      />
                    </td>
                    <td style={{ fontFamily: "monospace", fontWeight: "600" }}>
                      {t.transactionId}
                    </td>
                    <td style={{ fontFamily: "monospace", fontWeight: "500" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {t.referenceNumber}
                        {(() => {
                          const sameRefCount = paginatedTransactions.filter(tr => tr.referenceNumber === t.referenceNumber).length;
                          return sameRefCount > 1 ? (
                            <span 
                              style={{
                                backgroundColor: "rgba(59, 130, 246, 0.2)",
                                color: "#2563eb",
                                fontSize: "10px",
                                padding: "2px 6px",
                                borderRadius: "10px",
                                fontWeight: "600"
                              }}
                              title={`${sameRefCount} entries with this reference`}
                            >
                              {sameRefCount}
                            </span>
                          ) : null;
                        })()}
                      </div>
                    </td>
                    <td>
                      <div>
                        <div style={{ fontWeight: "500" }}>
                          {t.memberAccount 
                            ? t.memberAccount.accountId 
                            : t.glAccount 
                            ? t.glAccount.glAccountId 
                            : 'N/A'}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--muted-text)" }}>
                          {t.memberAccount && t.memberAccount.member 
                            ? `${t.memberAccount.member.firstName} ${t.memberAccount.member.lastName}`
                            : t.memberAccount 
                            ? t.memberAccount.shortName || t.memberAccount.accountName 
                            : t.glAccount 
                            ? t.glAccount.accountName 
                            : 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div 
                        style={{
                          display: "inline-block",
                          padding: "4px 8px",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: "600",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          backgroundColor: t.entryType === "DEBIT" ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)",
                          color: t.entryType === "DEBIT" ? "#dc2626" : "#059669",
                          border: `1px solid ${t.entryType === "DEBIT" ? "rgba(239, 68, 68, 0.3)" : "rgba(16, 185, 129, 0.3)"}`
                        }}
                      >
                        {t.entryType}
                      </div>
                    </td>
                    <td style={{ fontFamily: "monospace", fontWeight: "600" }}>
                      ${parseFloat(t.amount).toFixed(2)}
                    </td>
                    <td>{t.createdOn ? new Date(t.createdOn).toLocaleDateString() : '-'}</td>
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
                            t.status === "Approved" ? "rgba(16, 185, 129, 0.2)" :
                            t.status === "Pending" ? "rgba(6, 182, 212, 0.2)" :
                            t.status === "Returned" ? "rgba(249, 115, 22, 0.2)" :
                            t.status === "Rejected" ? "rgba(239, 68, 68, 0.2)" :
                            "rgba(107, 114, 128, 0.2)",
                          color: 
                            t.status === "Approved" ? "#059669" :
                            t.status === "Pending" ? "#0891b2" :
                            t.status === "Returned" ? "#ea580c" :
                            t.status === "Rejected" ? "#dc2626" :
                            "#6b7280",
                          border: `1px solid ${
                            t.status === "Approved" ? "rgba(16, 185, 129, 0.3)" :
                            t.status === "Pending" ? "rgba(6, 182, 212, 0.3)" :
                            t.status === "Returned" ? "rgba(249, 115, 22, 0.3)" :
                            t.status === "Rejected" ? "rgba(239, 68, 68, 0.3)" :
                            "rgba(107, 114, 128, 0.3)"
                          }`
                        }}
                      >
                        {t.status}
                      </div>
                    </td>
                    <td className="actions">
                      <button className="action-btn action-btn--view" onClick={() => {
                        frontendLoggingService.logView("Transaction", t.id, t.transactionId, "Viewed transaction details");
                        history.push(`/transaction/${t.id}`);
                      }} title="View">
                        <FiEye />
                      </button>
                      {canEdit(PERMISSIONS.TRANSACTION_MAINTENANCE) ? (
                        <button className="action-btn action-btn--edit" onClick={() => {
                          frontendLoggingService.logButtonClick("Edit Transaction", "Transaction", t.id, `Clicked Edit button for transaction: ${t.transactionId}`);
                          history.push(`/transaction/${t.id}?edit=1`);
                        }} title="Update">
                          <FiEdit3 />
                        </button>
                      ) : (
                        <button 
                          className="action-btn action-btn--edit" 
                          onClick={() => showMessage("Your role lacks permission to edit transactions", "error")} 
                          title="Update - No Permission"
                          style={{ opacity: 0.5, cursor: "not-allowed" }}
                          disabled
                        >
                          <FiEdit3 />
                        </button>
                      )}
                      {canDelete(PERMISSIONS.TRANSACTION_MAINTENANCE) ? (
                        <button className="action-btn action-btn--delete" onClick={async () => {
                          try {
                            // Log the delete action with transaction data before deletion
                            frontendLoggingService.logDelete("Transaction", t.id, t.transactionId, {
                              transactionId: t.transactionId,
                              referenceNumber: t.referenceNumber,
                              amount: t.amount,
                              status: t.status
                            }, `Deleted transaction: ${t.transactionId}`);
                            
                            await axios.delete(`http://localhost:3001/transactions/${t.id}`, { headers: { accessToken: localStorage.getItem("accessToken") } });
                            setTransactions(curr => curr.filter(x => x.id !== t.id));
                            showMessage("Transaction deleted successfully", "success");
                          } catch (err) {
                            const msg = err?.response?.data?.error || "Failed to delete transaction";
                            showMessage(msg, "error");
                          }
                        }} title="Delete">
                          <FiTrash2 />
                        </button>
                      ) : (
                        <button 
                          className="action-btn action-btn--delete" 
                          onClick={() => showMessage("Your role lacks permission to delete transactions", "error")} 
                          title="Delete - No Permission"
                          style={{ opacity: 0.5, cursor: "not-allowed" }}
                          disabled
                        >
                          <FiTrash2 />
                        </button>
                      )}
                    </td>
                  </tr>
                  );
                })}
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
              You are about to {statusAction === "Returned" ? "Return" : statusAction} {selectedTransactions.length} {selectedTransactions.length === 1 ? 'record' : 'records'}.
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
                    statusAction === "Approved" ? "#10b981" :
                    statusAction === "Returned" ? "#f97316" :
                    statusAction === "Rejected" ? "#ef4444" :
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
    </div>
  ) : (
    <DashboardWrapper>
      <header className="header">
        <div className="header__left">
          <div className="greeting">Transaction Maintenance</div>
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
              frontendLoggingService.logFilter("Status", e.target.value, "Transaction", `Filtered transactions by status: ${e.target.value || 'All'}`);
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
                  frontendLoggingService.logSearch(e.target.value, "Transaction", null, `Searched for transactions: "${e.target.value}"`);
                }
                setSearch(e.target.value);
              }} placeholder="Search transactions..." />
              <span className="searchIcon">🔍</span>
            </div>

            {canAdd(PERMISSIONS.TRANSACTION_MAINTENANCE) ? (
              <button 
                className="pill" 
                onClick={() => {
                  frontendLoggingService.logButtonClick("Add Transaction", "Transaction", null, "Clicked Add Transaction button");
                  history.push("/transaction/new");
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
                title="Add Transaction"
              >
                <FaPlus />
                Add Transaction
              </button>
            ) : (
              <button 
                className="pill" 
                onClick={() => showMessage("Your role lacks permission to add transactions", "error")}
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
                title="Add Transaction - No Permission"
                disabled
              >
                <FaPlus />
                Add Transaction
              </button>
            )}

            {/* Batch Action Buttons */}
            {showBatchActions && canApprove(PERMISSIONS.TRANSACTION_MAINTENANCE) && (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "14px", color: "var(--muted-text)", marginRight: "8px" }}>
                  {selectedTransactions.length} transactions selected
                  {(() => {
                    const selectedRefs = [...new Set(
                      selectedTransactions
                        .map(id => transactions.find(t => t.id === id))
                        .filter(t => t)
                        .map(t => t.referenceNumber)
                    )];
                    return selectedRefs.length > 0 ? ` (${selectedRefs.length} reference${selectedRefs.length > 1 ? 's' : ''})` : '';
                  })()}
                </span>
                <button 
                  className="pill" 
                  onClick={() => {
                    frontendLoggingService.logButtonClick("Approve Transactions", "Transaction", null, `Clicked Approve button for ${selectedTransactions.length} selected transactions`);
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
                    frontendLoggingService.logButtonClick("Return Transactions", "Transaction", null, `Clicked Return button for ${selectedTransactions.length} selected transactions`);
                    handleStatusChange("Returned");
                  }}
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
                  Return
                </button>
                <button 
                  className="pill" 
                  onClick={() => {
                    frontendLoggingService.logButtonClick("Reject Transactions", "Transaction", null, `Clicked Reject button for ${selectedTransactions.length} selected transactions`);
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
                  <th>
                    Reference Number
                    {sortField === 'referenceNumber' && (
                      <span style={{ marginLeft: '8px', color: 'var(--primary-500)' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th>Account</th>
                  <th>Entry Type</th>
                  <th>Amount</th>
                  <th>
                    Created On
                    {sortField === 'createdOn' && (
                      <span style={{ marginLeft: '8px', color: 'var(--primary-500)' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
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
                {paginatedTransactions.map((t, index) => {
                  // Check if this is the first occurrence of this reference number in the current page
                  const isFirstOfReference = paginatedTransactions.findIndex(tr => tr.referenceNumber === t.referenceNumber) === index;
                  const referenceCount = paginatedTransactions.filter(tr => tr.referenceNumber === t.referenceNumber).length;
                  
                  return (
                    <tr 
                      key={t.id}
                      style={{
                        backgroundColor: isFirstOfReference && referenceCount > 1 
                          ? 'rgba(59, 130, 246, 0.05)' 
                          : 'transparent',
                        borderLeft: isFirstOfReference && referenceCount > 1 
                          ? '3px solid rgba(59, 130, 246, 0.3)' 
                          : '3px solid transparent'
                      }}
                    >
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedTransactions.includes(t.id)}
                        onChange={(e) => handleSelectTransaction(t.id, e.target.checked)}
                        style={{ cursor: "pointer" }}
                        title={`Select all transactions with reference ${t.referenceNumber}`}
                      />
                    </td>
                    <td style={{ fontFamily: "monospace", fontWeight: "600" }}>
                      {t.transactionId}
                    </td>
                    <td style={{ fontFamily: "monospace", fontWeight: "500" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {t.referenceNumber}
                        {(() => {
                          const sameRefCount = paginatedTransactions.filter(tr => tr.referenceNumber === t.referenceNumber).length;
                          return sameRefCount > 1 ? (
                            <span 
                              style={{
                                backgroundColor: "rgba(59, 130, 246, 0.2)",
                                color: "#2563eb",
                                fontSize: "10px",
                                padding: "2px 6px",
                                borderRadius: "10px",
                                fontWeight: "600"
                              }}
                              title={`${sameRefCount} entries with this reference`}
                            >
                              {sameRefCount}
                            </span>
                          ) : null;
                        })()}
                      </div>
                    </td>
                    <td>
                      <div>
                        <div style={{ fontWeight: "500" }}>
                          {t.memberAccount 
                            ? t.memberAccount.accountId 
                            : t.glAccount 
                            ? t.glAccount.glAccountId 
                            : 'N/A'}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--muted-text)" }}>
                          {t.memberAccount && t.memberAccount.member 
                            ? `${t.memberAccount.member.firstName} ${t.memberAccount.member.lastName}`
                            : t.memberAccount 
                            ? t.memberAccount.shortName || t.memberAccount.accountName 
                            : t.glAccount 
                            ? t.glAccount.accountName 
                            : 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div 
                        style={{
                          display: "inline-block",
                          padding: "4px 8px",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: "600",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          backgroundColor: t.entryType === "DEBIT" ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)",
                          color: t.entryType === "DEBIT" ? "#dc2626" : "#059669",
                          border: `1px solid ${t.entryType === "DEBIT" ? "rgba(239, 68, 68, 0.3)" : "rgba(16, 185, 129, 0.3)"}`
                        }}
                      >
                        {t.entryType}
                      </div>
                    </td>
                    <td style={{ fontFamily: "monospace", fontWeight: "600" }}>
                      ${parseFloat(t.amount).toFixed(2)}
                    </td>
                    <td>{t.createdOn ? new Date(t.createdOn).toLocaleDateString() : '-'}</td>
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
                            t.status === "Approved" ? "rgba(16, 185, 129, 0.2)" :
                            t.status === "Pending" ? "rgba(6, 182, 212, 0.2)" :
                            t.status === "Returned" ? "rgba(249, 115, 22, 0.2)" :
                            t.status === "Rejected" ? "rgba(239, 68, 68, 0.2)" :
                            "rgba(107, 114, 128, 0.2)",
                          color: 
                            t.status === "Approved" ? "#059669" :
                            t.status === "Pending" ? "#0891b2" :
                            t.status === "Returned" ? "#ea580c" :
                            t.status === "Rejected" ? "#dc2626" :
                            "#6b7280",
                          border: `1px solid ${
                            t.status === "Approved" ? "rgba(16, 185, 129, 0.3)" :
                            t.status === "Pending" ? "rgba(6, 182, 212, 0.3)" :
                            t.status === "Returned" ? "rgba(249, 115, 22, 0.3)" :
                            t.status === "Rejected" ? "rgba(239, 68, 68, 0.3)" :
                            "rgba(107, 114, 128, 0.3)"
                          }`
                        }}
                      >
                        {t.status}
                      </div>
                    </td>
                    <td className="actions">
                      <button className="action-btn action-btn--view" onClick={() => {
                        frontendLoggingService.logView("Transaction", t.id, t.transactionId, "Viewed transaction details");
                        history.push(`/transaction/${t.id}`);
                      }} title="View">
                        <FiEye />
                      </button>
                      {canEdit(PERMISSIONS.TRANSACTION_MAINTENANCE) ? (
                        <button className="action-btn action-btn--edit" onClick={() => {
                          frontendLoggingService.logButtonClick("Edit Transaction", "Transaction", t.id, `Clicked Edit button for transaction: ${t.transactionId}`);
                          history.push(`/transaction/${t.id}?edit=1`);
                        }} title="Update">
                          <FiEdit3 />
                        </button>
                      ) : (
                        <button 
                          className="action-btn action-btn--edit" 
                          onClick={() => showMessage("Your role lacks permission to edit transactions", "error")} 
                          title="Update - No Permission"
                          style={{ opacity: 0.5, cursor: "not-allowed" }}
                          disabled
                        >
                          <FiEdit3 />
                        </button>
                      )}
                      {canDelete(PERMISSIONS.TRANSACTION_MAINTENANCE) ? (
                        <button className="action-btn action-btn--delete" onClick={async () => {
                          try {
                            // Log the delete action with transaction data before deletion
                            frontendLoggingService.logDelete("Transaction", t.id, t.transactionId, {
                              transactionId: t.transactionId,
                              referenceNumber: t.referenceNumber,
                              amount: t.amount,
                              status: t.status
                            }, `Deleted transaction: ${t.transactionId}`);
                            
                            await axios.delete(`http://localhost:3001/transactions/${t.id}`, { headers: { accessToken: localStorage.getItem("accessToken") } });
                            setTransactions(curr => curr.filter(x => x.id !== t.id));
                            showMessage("Transaction deleted successfully", "success");
                          } catch (err) {
                            const msg = err?.response?.data?.error || "Failed to delete transaction";
                            showMessage(msg, "error");
                          }
                        }} title="Delete">
                          <FiTrash2 />
                        </button>
                      ) : (
                        <button 
                          className="action-btn action-btn--delete" 
                          onClick={() => showMessage("Your role lacks permission to delete transactions", "error")} 
                          title="Delete - No Permission"
                          style={{ opacity: 0.5, cursor: "not-allowed" }}
                          disabled
                        >
                          <FiTrash2 />
                        </button>
                      )}
                    </td>
                  </tr>
                  );
                })}
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
              You are about to {statusAction === "Returned" ? "Return" : statusAction} {selectedTransactions.length} {selectedTransactions.length === 1 ? 'record' : 'records'}.
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
                    statusAction === "Approved" ? "#10b981" :
                    statusAction === "Returned" ? "#f97316" :
                    statusAction === "Rejected" ? "#ef4444" :
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

export default TransactionMaintenance;