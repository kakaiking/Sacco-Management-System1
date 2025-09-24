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

function LoanAppraisalMaintenance() {
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
      frontendLoggingService.logView("LoanAppraisal", null, null, "Viewed Loan Appraisal Maintenance page");
    }
  }, [authState, isLoading, history]);

  const [loanApplications, setLoanApplications] = useState([]);
  const [statusFilter, setStatusFilter] = useState("Pending Appraisal");
  const [search, setSearch] = useState("");
  const [selectedLoanApplications, setSelectedLoanApplications] = useState([]);
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState("");
  const [sortField] = useState("createdOn");
  const [sortDirection] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const controller = new AbortController();
    const fetchLoanApplications = async () => {
      try {
        const params = {};
        if (statusFilter) params.status = statusFilter;
        if (search) params.q = search;
        const res = await axios.get("http://localhost:3001/loan-applications", {
          headers: { accessToken: localStorage.getItem("accessToken") },
          params,
          signal: controller.signal,
        });
        const payload = res?.data?.entity ?? res?.data;
        setLoanApplications(Array.isArray(payload) ? payload : []);
      } catch {}
    };
    fetchLoanApplications();
    return () => controller.abort();
  }, [statusFilter, search]);

  const counts = useMemo(() => {
    const list = Array.isArray(loanApplications) ? loanApplications : [];
    const c = { "Pending Appraisal": 0, "Approved": 0, "Rejected": 0 };
    for (const loanApplication of list) {
      if (loanApplication.status && c[loanApplication.status] !== undefined) c[loanApplication.status] += 1;
    }
    return c;
  }, [loanApplications]);

  const sortedLoanApplications = useMemo(() => {
    const list = Array.isArray(loanApplications) ? loanApplications : [];
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
  }, [loanApplications, sortField, sortDirection]);

  // Pagination logic
  const paginatedLoanApplications = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedLoanApplications.slice(startIndex, endIndex);
  }, [sortedLoanApplications, currentPage, itemsPerPage]);

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSelectedLoanApplications([]); // Clear selection when changing pages
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
    setSelectedLoanApplications([]); // Clear selection
  };

  // Selection functions
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedLoanApplications(paginatedLoanApplications.map(loanApplication => loanApplication.id));
    } else {
      setSelectedLoanApplications([]);
    }
  };

  const handleSelectLoanApplication = (loanApplicationId, checked) => {
    if (checked) {
      setSelectedLoanApplications(prev => [...prev, loanApplicationId]);
    } else {
      setSelectedLoanApplications(prev => prev.filter(id => id !== loanApplicationId));
    }
  };

  const isAllSelected = selectedLoanApplications.length === paginatedLoanApplications.length && paginatedLoanApplications.length > 0;
  const isIndeterminate = selectedLoanApplications.length > 0 && selectedLoanApplications.length < paginatedLoanApplications.length;

  // Show/hide batch actions based on selection
  useEffect(() => {
    setShowBatchActions(selectedLoanApplications.length > 0);
  }, [selectedLoanApplications]);

  // Status change functions
  const handleStatusChange = (action) => {
    setStatusAction(action);
    setShowStatusModal(true);
  };

  const confirmStatusChange = async () => {
    try {
      // Get before data for logging
      const beforeData = selectedLoanApplications.map(loanApplicationId => {
        const loanApplication = loanApplications.find(loanApplication => loanApplication.id === loanApplicationId);
        return {
          id: loanApplicationId,
          loanApplicationId: loanApplication?.loanApplicationId,
          loanName: loanApplication?.loanName,
          status: loanApplication?.status
        };
      });

      const promises = selectedLoanApplications.map(loanApplicationId => 
        axios.put(`http://localhost:3001/loan-applications/${loanApplicationId}/status`, {
          status: statusAction
        }, {
          headers: { accessToken: localStorage.getItem("accessToken") }
        })
      );
      
      await Promise.all(promises);
      
      // Prepare after data for logging
      const afterData = beforeData.map(loanApplication => ({
        ...loanApplication,
        status: statusAction
      }));

      // Log the update action with before/after data
      frontendLoggingService.logUpdate(
        "LoanApplication", 
        selectedLoanApplications.join(','), 
        `${selectedLoanApplications.length} loan applications`, 
        beforeData, 
        afterData, 
        `Updated status to ${statusAction} for ${selectedLoanApplications.length} loan applications`
      );
      
      // Update local state
      setLoanApplications(prev => prev.map(loanApplication => 
        selectedLoanApplications.includes(loanApplication.id) 
          ? { ...loanApplication, status: statusAction }
          : loanApplication
      ));
      
      showMessage(`${statusAction} ${selectedLoanApplications.length} loan application(s) successfully`, "success");
      setSelectedLoanApplications([]);
      setShowStatusModal(false);
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to update loan application status";
      showMessage(msg, "error");
    }
  };

  return (
    <DashboardWrapper>
      <header className="header">
        <div className="header__left">
          <div className="greeting">Loan Appraisal Maintenance</div>
        </div>
      </header>

      <main className="dashboard__content">
        <section className="cards cards--status">
          <div className="card card--pending">
            <div className="card__icon">
              <FiClock />
            </div>
            <div className="card__content">
              <h4>Pending Appraisal</h4>
              <div className="card__kpi">{counts["Pending Appraisal"]}</div>
            </div>
          </div>
          <div className="card card--approved">
            <div className="card__icon">
              <FiCheckCircle />
            </div>
            <div className="card__content">
              <h4>Approved</h4>
              <div className="card__kpi">{counts["Approved"]}</div>
            </div>
          </div>
          <div className="card card--returned">
            <div className="card__icon">
              <FiRotateCcw />
            </div>
            <div className="card__content">
              <h4>Rejected</h4>
              <div className="card__kpi">{counts["Rejected"]}</div>
            </div>
          </div>
        </section>

        <section className="card" style={{ padding: 12 }}>
          <div className="tableToolbar">
            <select className="statusSelect" value={statusFilter} onChange={e => {
              frontendLoggingService.logFilter("Status", e.target.value, "LoanAppraisal", `Filtered loan applications by status: ${e.target.value || 'All'}`);
              setStatusFilter(e.target.value);
            }}>
              <option value="">All Statuses</option>
              <option value="Pending Appraisal">Pending Appraisal</option>
              <option value="Sanctioned">Sanctioned</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>

            <div className="searchWrapper">
              <input className="searchInput" value={search} onChange={e => {
                if (e.target.value.length > 2 || e.target.value.length === 0) {
                  frontendLoggingService.logSearch(e.target.value, "LoanAppraisal", null, `Searched for loan applications: "${e.target.value}"`);
                }
                setSearch(e.target.value);
              }} placeholder="Search loan applications..." />
              <span className="searchIcon">🔍</span>
            </div>

            {canAdd(PERMISSIONS.LOAN_PRODUCTS_MAINTENANCE) ? (
              <button 
                className="pill" 
                onClick={() => {
                  frontendLoggingService.logButtonClick("Add Loan Application", "LoanAppraisal", null, "Clicked Add Loan Application button");
                  history.push("/loan-application");
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
                title="Add Loan Application"
              >
                <FaPlus />
                Add Loan Application
              </button>
            ) : (
              <button 
                className="pill" 
                onClick={() => showMessage("Your role lacks permission to add loan applications", "error")}
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
                title="Add Loan Application - No Permission"
                disabled
              >
                <FaPlus />
                Add Loan Application
              </button>
            )}

            {/* Batch Action Buttons */}
            {showBatchActions && canApprove(PERMISSIONS.LOAN_PRODUCTS_MAINTENANCE) && (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "14px", color: "var(--muted-text)", marginRight: "8px" }}>
                  {selectedLoanApplications.length} selected
                </span>
                <button 
                  className="pill" 
                  onClick={() => {
                    frontendLoggingService.logButtonClick("Sanction Loan Applications", "LoanAppraisal", null, `Clicked Sanction button for ${selectedLoanApplications.length} selected loan applications`);
                    handleStatusChange("Sanctioned");
                  }}
                  style={{
                    backgroundColor: "#22c55e",
                    color: "white",
                    border: "none",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  Sanction
                </button>
                <button 
                  className="pill" 
                  onClick={() => {
                    frontendLoggingService.logButtonClick("Approve Loan Applications", "LoanAppraisal", null, `Clicked Approve button for ${selectedLoanApplications.length} selected loan applications`);
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
                    frontendLoggingService.logButtonClick("Reject Loan Applications", "LoanAppraisal", null, `Clicked Reject button for ${selectedLoanApplications.length} selected loan applications`);
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
                    Application ID
                    {sortField === 'loanApplicationId' && (
                      <span style={{ marginLeft: '8px', color: 'var(--primary-500)' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th>
                    Loan Name
                    {sortField === 'loanName' && (
                      <span style={{ marginLeft: '8px', color: 'var(--primary-500)' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th>Member</th>
                  <th>Product</th>
                  <th>Loan Amount</th>
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
                {paginatedLoanApplications.map(loanApplication => (
                  <tr key={loanApplication.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedLoanApplications.includes(loanApplication.id)}
                        onChange={(e) => handleSelectLoanApplication(loanApplication.id, e.target.checked)}
                        style={{ cursor: "pointer" }}
                      />
                    </td>
                    <td>{loanApplication.loanApplicationId}</td>
                    <td>{loanApplication.loanName}</td>
                    <td>{loanApplication.member?.firstName + ' ' + loanApplication.member?.lastName || '-'}</td>
                    <td>{loanApplication.product?.loanProductName || '-'}</td>
                    <td>
                      {loanApplication.loanAmount ? (() => {
                        const amount = parseFloat(loanApplication.loanAmount).toLocaleString();
                        const currency = loanApplication.product?.accountTypes?.[0]?.currency;
                        const symbol = currency?.symbol || currency?.currencyCode || '$';
                        return `${symbol}${amount}`;
                      })() : '-'}
                    </td>
                    <td>{loanApplication.createdOn ? new Date(loanApplication.createdOn).toLocaleDateString() : '-'}</td>
                    <td>{loanApplication.createdBy || '-'}</td>
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
                            loanApplication.status === "Approved" ? "rgba(16, 185, 129, 0.2)" :
                            loanApplication.status === "Sanctioned" ? "rgba(34, 197, 94, 0.2)" :
                            loanApplication.status === "Pending Appraisal" ? "rgba(6, 182, 212, 0.2)" :
                            loanApplication.status === "Rejected" ? "rgba(239, 68, 68, 0.2)" :
                            "rgba(107, 114, 128, 0.2)",
                          color: 
                            loanApplication.status === "Approved" ? "#059669" :
                            loanApplication.status === "Sanctioned" ? "#15803d" :
                            loanApplication.status === "Pending Appraisal" ? "#0891b2" :
                            loanApplication.status === "Rejected" ? "#dc2626" :
                            "#6b7280",
                          border: `1px solid ${
                            loanApplication.status === "Approved" ? "rgba(16, 185, 129, 0.3)" :
                            loanApplication.status === "Sanctioned" ? "rgba(34, 197, 94, 0.3)" :
                            loanApplication.status === "Pending Appraisal" ? "rgba(6, 182, 212, 0.3)" :
                            loanApplication.status === "Rejected" ? "rgba(239, 68, 68, 0.3)" :
                            "rgba(107, 114, 128, 0.3)"
                          }`
                        }}
                      >
                        {loanApplication.status}
                      </div>
                    </td>
                    <td className="actions">
                      <button className="action-btn action-btn--view" onClick={() => {
                        frontendLoggingService.logView("LoanApplication", loanApplication.id, loanApplication.loanName, "Viewed loan application details");
                        history.push(`/loan-application/${loanApplication.id}`);
                      }} title="View">
                        <FiEye />
                      </button>
                      {canEdit(PERMISSIONS.LOAN_PRODUCTS_MAINTENANCE) ? (
                        <button className="action-btn action-btn--edit" onClick={() => {
                          frontendLoggingService.logButtonClick("Edit Loan Application", "LoanAppraisal", loanApplication.id, `Clicked Edit button for loan application: ${loanApplication.loanName}`);
                          history.push(`/loan-application/${loanApplication.id}?edit=1`);
                        }} title="Update">
                          <FiEdit3 />
                        </button>
                      ) : (
                        <button 
                          className="action-btn action-btn--edit" 
                          onClick={() => showMessage("Your role lacks permission to edit loan applications", "error")} 
                          title="Update - No Permission"
                          style={{ opacity: 0.5, cursor: "not-allowed" }}
                          disabled
                        >
                          <FiEdit3 />
                        </button>
                      )}
                      {canDelete(PERMISSIONS.LOAN_PRODUCTS_MAINTENANCE) ? (
                        <button className="action-btn action-btn--delete" onClick={async () => {
                          try {
                            // Log the delete action with loan application data before deletion
                            frontendLoggingService.logDelete("LoanApplication", loanApplication.id, loanApplication.loanName, {
                              loanApplicationId: loanApplication.loanApplicationId,
                              loanName: loanApplication.loanName,
                              status: loanApplication.status
                            }, `Deleted loan application: ${loanApplication.loanName}`);
                            
                            await axios.delete(`http://localhost:3001/loan-applications/${loanApplication.id}`, { headers: { accessToken: localStorage.getItem("accessToken") } });
                            setLoanApplications(curr => curr.filter(x => x.id !== loanApplication.id));
                            showMessage("Loan application deleted successfully", "success");
                          } catch (err) {
                            const msg = err?.response?.data?.error || "Failed to delete loan application";
                            showMessage(msg, "error");
                          }
                        }} title="Delete">
                          <FiTrash2 />
                        </button>
                      ) : (
                        <button 
                          className="action-btn action-btn--delete" 
                          onClick={() => showMessage("Your role lacks permission to delete loan applications", "error")} 
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
            totalItems={sortedLoanApplications.length}
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
              You are about to {statusAction === "Rejected" ? "Reject" : statusAction === "Sanctioned" ? "Sanction" : statusAction} {selectedLoanApplications.length} {selectedLoanApplications.length === 1 ? 'loan application' : 'loan applications'}.
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
                  backgroundColor: statusAction === "Rejected" ? "#ef4444" : statusAction === "Sanctioned" ? "#22c55e" : "#10b981",
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

export default LoanAppraisalMaintenance;
