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
import '../helpers/MockAuth'; // Import mock auth for testing

function AccountTypesMaintenance() {
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
      frontendLoggingService.logView("AccountTypes", null, null, "Viewed Account Types Maintenance page");
    }
  }, [authState, isLoading, history]);

  const [accountTypes, setAccountTypes] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedAccountTypes, setSelectedAccountTypes] = useState([]);
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState("");
  const [sortField] = useState("createdOn");
  const [sortDirection] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const controller = new AbortController();
    const fetchAccountTypes = async () => {
      try {
        const params = {};
        if (statusFilter) params.status = statusFilter;
        if (search) params.q = search;
        const res = await axios.get("http://localhost:3001/account-types", {
          headers: { accessToken: localStorage.getItem("accessToken") },
          params,
          signal: controller.signal,
        });
        const payload = res?.data?.entity ?? res?.data;
        setAccountTypes(Array.isArray(payload) ? payload : []);
      } catch {}
    };
    fetchAccountTypes();
    return () => controller.abort();
  }, [statusFilter, search]);

  const counts = useMemo(() => {
    const list = Array.isArray(accountTypes) ? accountTypes : [];
    const c = { Active: 0, Draft: 0, Inactive: 0 };
    for (const accountType of list) {
      if (accountType.status && c[accountType.status] !== undefined) c[accountType.status] += 1;
    }
    return c;
  }, [accountTypes]);

  const sortedAccountTypes = useMemo(() => {
    const list = Array.isArray(accountTypes) ? accountTypes : [];
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
  }, [accountTypes, sortField, sortDirection]);

  // Pagination logic
  const paginatedAccountTypes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedAccountTypes.slice(startIndex, endIndex);
  }, [sortedAccountTypes, currentPage, itemsPerPage]);

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSelectedAccountTypes([]); // Clear selection when changing pages
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
    setSelectedAccountTypes([]); // Clear selection
  };

  // Selection functions
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedAccountTypes(paginatedAccountTypes.map(accountType => accountType.id));
    } else {
      setSelectedAccountTypes([]);
    }
  };

  const handleSelectAccountType = (accountTypeId, checked) => {
    if (checked) {
      setSelectedAccountTypes(prev => [...prev, accountTypeId]);
    } else {
      setSelectedAccountTypes(prev => prev.filter(id => id !== accountTypeId));
    }
  };

  const isAllSelected = selectedAccountTypes.length === paginatedAccountTypes.length && paginatedAccountTypes.length > 0;
  const isIndeterminate = selectedAccountTypes.length > 0 && selectedAccountTypes.length < paginatedAccountTypes.length;

  // Show/hide batch actions based on selection
  useEffect(() => {
    setShowBatchActions(selectedAccountTypes.length > 0);
  }, [selectedAccountTypes]);

  // Status change functions
  const handleStatusChange = (action) => {
    setStatusAction(action);
    setShowStatusModal(true);
  };

  // Bulk approve function
  const handleBulkApprove = async () => {
    try {
      // Get before data for logging
      const beforeData = selectedAccountTypes.map(accountTypeId => {
        const accountType = accountTypes.find(accountType => accountType.id === accountTypeId);
        return {
          id: accountTypeId,
          accountTypeId: accountType?.accountTypeId,
          accountTypeName: accountType?.accountTypeName,
          status: accountType?.status
        };
      });

      const promises = selectedAccountTypes.map(accountTypeId => 
        axios.put(`http://localhost:3001/account-types/${accountTypeId}/approve`, {
          verifierRemarks: null
        }, {
          headers: { accessToken: localStorage.getItem("accessToken") }
        })
      );
      
      await Promise.all(promises);
      
      // Prepare after data for logging
      const afterData = beforeData.map(accountType => ({
        ...accountType,
        status: "Active"
      }));

      // Log the update action with before/after data
      frontendLoggingService.logUpdate(
        "AccountTypes", 
        selectedAccountTypes.join(','), 
        `${selectedAccountTypes.length} account types`, 
        beforeData, 
        afterData, 
        `Approved ${selectedAccountTypes.length} account types`
      );
      
      // Update local state
      setAccountTypes(prev => prev.map(accountType => 
        selectedAccountTypes.includes(accountType.id) 
          ? { ...accountType, status: "Active" }
          : accountType
      ));
      
      showMessage(`Approved ${selectedAccountTypes.length} account type(s) successfully`, "success");
      setSelectedAccountTypes([]);
    } catch (error) {
      console.error("Error approving account types:", error);
      showMessage("Error approving account types", "error");
    }
  };

  // Bulk reject function
  const handleBulkReject = async () => {
    try {
      // Get before data for logging
      const beforeData = selectedAccountTypes.map(accountTypeId => {
        const accountType = accountTypes.find(accountType => accountType.id === accountTypeId);
        return {
          id: accountTypeId,
          accountTypeId: accountType?.accountTypeId,
          accountTypeName: accountType?.accountTypeName,
          status: accountType?.status
        };
      });

      const promises = selectedAccountTypes.map(accountTypeId => 
        axios.put(`http://localhost:3001/account-types/${accountTypeId}/reject`, {
          verifierRemarks: null
        }, {
          headers: { accessToken: localStorage.getItem("accessToken") }
        })
      );
      
      await Promise.all(promises);
      
      // Prepare after data for logging
      const afterData = beforeData.map(accountType => ({
        ...accountType,
        status: "Draft"
      }));

      // Log the update action with before/after data
      frontendLoggingService.logUpdate(
        "AccountTypes", 
        selectedAccountTypes.join(','), 
        `${selectedAccountTypes.length} account types`, 
        beforeData, 
        afterData, 
        `Rejected ${selectedAccountTypes.length} account types`
      );
      
      // Update local state
      setAccountTypes(prev => prev.map(accountType => 
        selectedAccountTypes.includes(accountType.id) 
          ? { ...accountType, status: "Draft" }
          : accountType
      ));
      
      showMessage(`Rejected ${selectedAccountTypes.length} account type(s) successfully`, "success");
      setSelectedAccountTypes([]);
    } catch (error) {
      console.error("Error rejecting account types:", error);
      showMessage("Error rejecting account types", "error");
    }
  };

  const confirmStatusChange = async () => {
    try {
      // Get before data for logging
      const beforeData = selectedAccountTypes.map(accountTypeId => {
        const accountType = accountTypes.find(accountType => accountType.id === accountTypeId);
        return {
          id: accountTypeId,
          accountTypeId: accountType?.accountTypeId,
          accountTypeName: accountType?.accountTypeName,
          status: accountType?.status
        };
      });

      const promises = selectedAccountTypes.map(accountTypeId => 
        axios.put(`http://localhost:3001/account-types/${accountTypeId}/status`, {
          status: statusAction
        }, {
          headers: { accessToken: localStorage.getItem("accessToken") }
        })
      );
      
      await Promise.all(promises);
      
      // Prepare after data for logging
      const afterData = beforeData.map(accountType => ({
        ...accountType,
        status: statusAction
      }));

      // Log the update action with before/after data
      frontendLoggingService.logUpdate(
        "AccountTypes", 
        selectedAccountTypes.join(','), 
        `${selectedAccountTypes.length} account types`, 
        beforeData, 
        afterData, 
        `Updated status to ${statusAction} for ${selectedAccountTypes.length} account types`
      );
      
      // Update local state
      setAccountTypes(prev => prev.map(accountType => 
        selectedAccountTypes.includes(accountType.id) 
          ? { ...accountType, status: statusAction }
          : accountType
      ));
      
      showMessage(`${statusAction} ${selectedAccountTypes.length} account type(s) successfully`, "success");
      setSelectedAccountTypes([]);
      setShowStatusModal(false);
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to update account type status";
      showMessage(msg, "error");
    }
  };

  return (
    <DashboardWrapper>
      <header className="header">
        <div className="header__left">
          <div className="greeting">Account Types Maintenance</div>
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
              <h4>Draft</h4>
              <div className="card__kpi">{counts.Draft}</div>
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
              frontendLoggingService.logFilter("Status", e.target.value, "AccountTypes", `Filtered account types by status: ${e.target.value || 'All'}`);
              setStatusFilter(e.target.value);
            }}>
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Inactive">Inactive</option>
            </select>

            <div className="searchWrapper">
              <input className="searchInput" value={search} onChange={e => {
                if (e.target.value.length > 2 || e.target.value.length === 0) {
                  frontendLoggingService.logSearch(e.target.value, "AccountTypes", null, `Searched for account types: "${e.target.value}"`);
                }
                setSearch(e.target.value);
              }} placeholder="Search account types..." />
              <span className="searchIcon">🔍</span>
            </div>

            {canAdd(PERMISSIONS.ACCOUNT_TYPES_MAINTENANCE) ? (
              <button 
                className="pill" 
                onClick={() => {
                  frontendLoggingService.logButtonClick("Add Account Type", "AccountTypes", null, "Clicked Add Account Type button");
                  history.push("/account-types/new");
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
                title="Add Account Type"
              >
                <FaPlus />
                Add Account Type
              </button>
            ) : (
              <button 
                className="pill" 
                onClick={() => showMessage("Your role lacks permission to add account types", "error")}
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
                title="Add Account Type - No Permission"
                disabled
              >
                <FaPlus />
                Add Account Type
              </button>
            )}

            {/* Batch Action Buttons */}
            {showBatchActions && canApprove(PERMISSIONS.ACCOUNT_TYPES_MAINTENANCE) && (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "14px", color: "var(--muted-text)", marginRight: "8px" }}>
                  {selectedAccountTypes.length} selected
                </span>
                <button 
                  className="pill" 
                  onClick={() => {
                    frontendLoggingService.logButtonClick("Approve Account Types", "AccountTypes", null, `Clicked Approve button for ${selectedAccountTypes.length} selected account types`);
                    handleBulkApprove();
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
                    frontendLoggingService.logButtonClick("Reject Account Types", "AccountTypes", null, `Clicked Reject button for ${selectedAccountTypes.length} selected account types`);
                    handleBulkReject();
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
                    Account Type ID
                    {sortField === 'accountTypeId' && (
                      <span style={{ marginLeft: '8px', color: 'var(--primary-500)' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th>
                    Account Type Name
                    {sortField === 'accountTypeName' && (
                      <span style={{ marginLeft: '8px', color: 'var(--primary-500)' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th>Product</th>
                  <th>BOSA/FOSA</th>
                  <th>Debit/Credit</th>
                  <th>Onboarding</th>
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
                {paginatedAccountTypes.map(accountType => (
                  <tr key={accountType.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedAccountTypes.includes(accountType.id)}
                        onChange={(e) => handleSelectAccountType(accountType.id, e.target.checked)}
                        style={{ cursor: "pointer" }}
                      />
                    </td>
                    <td>{accountType.accountTypeId}</td>
                    <td>{accountType.accountTypeName}</td>
                    <td>{accountType.product?.productName || accountType.loanProduct?.loanProductName || 'N/A'}</td>
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
                          backgroundColor: accountType.bosaFosa === "BOSA" ? "rgba(16, 185, 129, 0.2)" : "rgba(6, 182, 212, 0.2)",
                          color: accountType.bosaFosa === "BOSA" ? "#059669" : "#0891b2",
                          border: `1px solid ${accountType.bosaFosa === "BOSA" ? "rgba(16, 185, 129, 0.3)" : "rgba(6, 182, 212, 0.3)"}`
                        }}
                      >
                        {accountType.bosaFosa}
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
                          backgroundColor: accountType.debitCredit === "DEBIT" ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)",
                          color: accountType.debitCredit === "DEBIT" ? "#dc2626" : "#059669",
                          border: `1px solid ${accountType.debitCredit === "DEBIT" ? "rgba(239, 68, 68, 0.3)" : "rgba(16, 185, 129, 0.3)"}`
                        }}
                      >
                        {accountType.debitCredit}
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
                          backgroundColor: accountType.appliedOnMemberOnboarding ? "rgba(16, 185, 129, 0.2)" : "rgba(107, 114, 128, 0.2)",
                          color: accountType.appliedOnMemberOnboarding ? "#059669" : "#6b7280",
                          border: `1px solid ${accountType.appliedOnMemberOnboarding ? "rgba(16, 185, 129, 0.3)" : "rgba(107, 114, 128, 0.3)"}`
                        }}
                      >
                        {accountType.appliedOnMemberOnboarding ? "Yes" : "No"}
                      </div>
                    </td>
                    <td>{accountType.createdOn ? new Date(accountType.createdOn).toLocaleDateString() : '-'}</td>
                    <td>{accountType.createdBy || '-'}</td>
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
                            accountType.status === "Active" ? "rgba(16, 185, 129, 0.2)" :
                            accountType.status === "Draft" ? "rgba(6, 182, 212, 0.2)" :
                            accountType.status === "Inactive" ? "rgba(239, 68, 68, 0.2)" :
                            "rgba(107, 114, 128, 0.2)",
                          color: 
                            accountType.status === "Active" ? "#059669" :
                            accountType.status === "Draft" ? "#0891b2" :
                            accountType.status === "Inactive" ? "#dc2626" :
                            "#6b7280",
                          border: `1px solid ${
                            accountType.status === "Active" ? "rgba(16, 185, 129, 0.3)" :
                            accountType.status === "Draft" ? "rgba(6, 182, 212, 0.3)" :
                            accountType.status === "Inactive" ? "rgba(239, 68, 68, 0.3)" :
                            "rgba(107, 114, 128, 0.3)"
                          }`
                        }}
                      >
                        {accountType.status}
                      </div>
                    </td>
                    <td className="actions">
                      <button className="action-btn action-btn--view" onClick={() => {
                        frontendLoggingService.logView("AccountTypes", accountType.id, accountType.accountTypeName, "Viewed account type details");
                        history.push(`/account-types/${accountType.id}`);
                      }} title="View">
                        <FiEye />
                      </button>
                      {canEdit(PERMISSIONS.ACCOUNT_TYPES_MAINTENANCE) ? (
                        <button className="action-btn action-btn--edit" onClick={() => {
                          frontendLoggingService.logButtonClick("Edit Account Type", "AccountTypes", accountType.id, `Clicked Edit button for account type: ${accountType.accountTypeName}`);
                          history.push(`/account-types/${accountType.id}?edit=1`);
                        }} title="Update">
                          <FiEdit3 />
                        </button>
                      ) : (
                        <button 
                          className="action-btn action-btn--edit" 
                          onClick={() => showMessage("Your role lacks permission to edit account types", "error")} 
                          title="Update - No Permission"
                          style={{ opacity: 0.5, cursor: "not-allowed" }}
                          disabled
                        >
                          <FiEdit3 />
                        </button>
                      )}
                      {canDelete(PERMISSIONS.ACCOUNT_TYPES_MAINTENANCE) ? (
                        <button className="action-btn action-btn--delete" onClick={async () => {
                          try {
                            // Log the delete action with account type data before deletion
                            frontendLoggingService.logDelete("AccountTypes", accountType.id, accountType.accountTypeName, {
                              accountTypeId: accountType.accountTypeId,
                              accountTypeName: accountType.accountTypeName,
                              status: accountType.status
                            }, `Deleted account type: ${accountType.accountTypeName}`);
                            
                            await axios.delete(`http://localhost:3001/account-types/${accountType.id}`, { headers: { accessToken: localStorage.getItem("accessToken") } });
                            setAccountTypes(curr => curr.filter(x => x.id !== accountType.id));
                            showMessage("Account type deleted successfully", "success");
                          } catch (err) {
                            const msg = err?.response?.data?.error || "Failed to delete account type";
                            showMessage(msg, "error");
                          }
                        }} title="Delete">
                          <FiTrash2 />
                        </button>
                      ) : (
                        <button 
                          className="action-btn action-btn--delete" 
                          onClick={() => showMessage("Your role lacks permission to delete account types", "error")} 
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
            totalItems={sortedAccountTypes.length}
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
              You are about to {statusAction === "Inactive" ? "Deactivate" : statusAction} {selectedAccountTypes.length} {selectedAccountTypes.length === 1 ? 'record' : 'records'}.
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

export default AccountTypesMaintenance;