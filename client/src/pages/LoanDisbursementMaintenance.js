import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { FiEye, FiChevronLeft, FiChevronRight, FiSearch, FiFilter } from "react-icons/fi";
import axios from "axios";
import { useSnackbar } from "../helpers/SnackbarContext";
import { AuthContext } from "../helpers/AuthContext";
import DashboardWrapper from '../components/DashboardWrapper';
import Pagination from '../components/Pagination';
import { usePermissions } from "../hooks/usePermissions";
import { PERMISSIONS } from "../helpers/PermissionUtils";
import frontendLoggingService from "../services/frontendLoggingService";

function LoanDisbursementMaintenance() {
  const history = useHistory();
  const { authState, isLoading } = useContext(AuthContext);
  const { showMessage } = useSnackbar();
  const { canView, canApprove } = usePermissions();

  const [loanApplications, setLoanApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("createdOn");
  const [sortDirection, setSortDirection] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedLoanApplications, setSelectedLoanApplications] = useState([]);
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState("");

  useEffect(() => {
    // Only redirect if authentication check is complete and user is not authenticated
    if (!isLoading && !authState.status) {
      history.push("/login");
    }
  }, [authState, isLoading, history]);

  useEffect(() => {
    if (authState.status) {
      fetchLoanApplications();
    }
  }, [authState.status, search, sortField, sortDirection, currentPage, itemsPerPage]);

  useEffect(() => {
    setShowBatchActions(selectedLoanApplications.length > 0);
  }, [selectedLoanApplications]);

  const fetchLoanApplications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('status', 'Sanctioned'); // Only show sanctioned applications
      if (search) params.append('q', search);
      if (sortField) params.append('sortField', sortField);
      if (sortDirection) params.append('sortDirection', sortDirection);
      params.append('page', currentPage);
      params.append('limit', itemsPerPage);

      console.log('Fetching loan applications with params:', params.toString());
      
      const response = await axios.get(`http://localhost:3001/loan-applications?${params}`, {
        headers: { 
          accessToken: localStorage.getItem('accessToken'),
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });
      
      console.log('Loan applications response:', response.data);
      
      if (response.data && response.data.entity) {
        setLoanApplications(Array.isArray(response.data.entity) ? response.data.entity : []);
      } else if (response.data && Array.isArray(response.data)) {
        setLoanApplications(response.data);
      } else {
        console.warn('Unexpected response format:', response.data);
        setLoanApplications([]);
      }
      
      // Log successful fetch
      frontendLoggingService.logView("LoanDisbursement", null, null, "Fetched sanctioned loan applications for disbursement");
      
    } catch (error) {
      console.error('Error fetching loan applications:', error);
      
      let errorMessage = 'Failed to fetch loan applications';
      
      if (error.response) {
        // Server responded with error status
        errorMessage = error.response.data?.message || error.response.data?.error || `Server error: ${error.response.status}`;
        console.error('Server error response:', error.response.data);
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'Network error: Unable to connect to server';
        console.error('Network error:', error.request);
      } else {
        // Something else happened
        errorMessage = error.message || 'Unknown error occurred';
        console.error('Request setup error:', error.message);
      }
      
      showMessage(errorMessage, 'error');
      setLoanApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    frontendLoggingService.logPagination("LoanDisbursement", page, itemsPerPage, "Changed page in loan disbursement maintenance");
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
    frontendLoggingService.logPagination("LoanDisbursement", 1, newItemsPerPage, "Changed items per page in loan disbursement maintenance");
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      const allIds = loanApplications.map(loanApplication => loanApplication.id);
      setSelectedLoanApplications(allIds);
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

  const handleStatusChange = (action) => {
    setStatusAction(action);
    setShowStatusModal(true);
  };

  const confirmStatusChange = async () => {
    if (!selectedLoanApplications.length) {
      showMessage('No loan applications selected for disbursement', 'error');
      return;
    }

    try {
      console.log('Starting disbursement process for applications:', selectedLoanApplications);
      
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

      console.log('Before data for logging:', beforeData);

      // Process disbursements one by one to handle individual failures
      const results = [];
      const errors = [];
      
      for (const loanApplicationId of selectedLoanApplications) {
        try {
          console.log(`Processing disbursement for application ID: ${loanApplicationId}`);
          
          const response = await axios.put(`http://localhost:3001/loan-applications/${loanApplicationId}/disburse`, {
            status: statusAction
          }, {
            headers: { 
              accessToken: localStorage.getItem("accessToken"),
              'Content-Type': 'application/json'
            },
            timeout: 15000 // 15 second timeout per request
          });
          
          console.log(`Disbursement successful for application ${loanApplicationId}:`, response.data);
          results.push({ id: loanApplicationId, success: true, data: response.data });
          
        } catch (error) {
          console.error(`Disbursement failed for application ${loanApplicationId}:`, error);
          
          let errorMessage = 'Unknown error';
          if (error.response) {
            errorMessage = error.response.data?.message || error.response.data?.error || `Server error: ${error.response.status}`;
          } else if (error.request) {
            errorMessage = 'Network error: Unable to connect to server';
          } else {
            errorMessage = error.message || 'Request setup error';
          }
          
          errors.push({ id: loanApplicationId, error: errorMessage });
        }
      }
      
      // Log the results
      console.log('Disbursement results:', { successful: results.length, failed: errors.length });
      
      if (results.length > 0) {
        // Prepare after data for logging successful disbursements
        const afterData = beforeData.filter(item => 
          results.some(result => result.id === item.id)
        ).map(loanApplication => ({
          ...loanApplication,
          status: statusAction
        }));

        // Log the successful disbursements
        frontendLoggingService.logBulkUpdate("LoanApplication", 
          beforeData.filter(item => results.some(result => result.id === item.id)), 
          afterData, 
          `Successfully disbursed ${results.length} loan applications`
        );
      }
      
      // Show appropriate messages
      if (results.length === selectedLoanApplications.length) {
        // All successful
        showMessage(`Successfully disbursed all ${results.length} loan application(s)`, 'success');
      } else if (results.length > 0) {
        // Partial success
        showMessage(`Disbursed ${results.length} of ${selectedLoanApplications.length} loan applications. ${errors.length} failed.`, 'warning');
        
        // Log failed disbursements
        if (errors.length > 0) {
          console.error('Failed disbursements:', errors);
          frontendLoggingService.logError("LoanDisbursement", 
            `Failed to disburse ${errors.length} loan applications`, 
            errors
          );
        }
      } else {
        // All failed
        showMessage(`Failed to disburse all ${selectedLoanApplications.length} loan applications`, 'error');
        
        // Log all failures
        frontendLoggingService.logError("LoanDisbursement", 
          `Failed to disburse all ${errors.length} loan applications`, 
          errors
        );
      }
      
      // Clear selection and close modal
      setSelectedLoanApplications([]);
      setShowStatusModal(false);
      
      // Refresh the data
      await fetchLoanApplications();
      
    } catch (error) {
      console.error('Unexpected error during disbursement process:', error);
      showMessage('An unexpected error occurred during disbursement', 'error');
      
      // Log the unexpected error
      frontendLoggingService.logError("LoanDisbursement", 
        "Unexpected error during disbursement process", 
        error
      );
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    frontendLoggingService.logSort("LoanDisbursement", field, sortDirection === field ? (sortDirection === 'asc' ? 'desc' : 'asc') : 'asc', "Sorted loan disbursement maintenance");
  };

  if (isLoading) {
    return (
      <DashboardWrapper>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <div>Loading...</div>
        </div>
      </DashboardWrapper>
    );
  }

  if (!authState.status) {
    return null;
  }

  // Calculate pagination
  const totalPages = Math.ceil(loanApplications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLoanApplications = loanApplications.slice(startIndex, endIndex);

  return (
    <DashboardWrapper>
      <header className="header">
        <div className="header__left">
          <div className="greeting">Loan Disbursement Management</div>
        </div>
      </header>

      <main className="dashboard__content">
        <section className="card" style={{ padding: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <h2 style={{ margin: 0, color: "var(--primary-700)" }}>Sanctioned Loan Applications</h2>
              <div style={{ 
                display: "inline-block",
                padding: "4px 8px",
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: "600",
                backgroundColor: "rgba(34, 197, 94, 0.2)",
                color: "#15803d",
                border: "1px solid rgba(34, 197, 94, 0.3)"
              }}>
                {loanApplications.length} Applications
              </div>
            </div>
          </div>
        </section>

        <section className="card" style={{ padding: 12 }}>
          <div className="tableToolbar">
            <div className="searchWrapper">
              <input className="searchInput" value={search} onChange={e => {
                if (e.target.value.length > 2 || e.target.value.length === 0) {
                  frontendLoggingService.logSearch(e.target.value, "LoanDisbursement", null, `Searched for loan applications: "${e.target.value}"`);
                  setSearch(e.target.value);
                }
              }} placeholder="Search by application ID, loan name, or member name..." />
              <FiSearch className="searchIcon" />
            </div>

            {/* Batch Action Buttons */}
            {showBatchActions && canApprove(PERMISSIONS.LOAN_PRODUCTS_MAINTENANCE) && (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "14px", color: "var(--muted-text)", marginRight: "8px" }}>
                  {selectedLoanApplications.length} selected
                </span>
                <button 
                  className="pill" 
                  onClick={() => {
                    frontendLoggingService.logButtonClick("Disburse Loan Applications", "LoanDisbursement", null, `Clicked Disburse button for ${selectedLoanApplications.length} selected loan applications`);
                    handleStatusChange("Disbursed");
                  }}
                  style={{
                    backgroundColor: "#059669",
                    color: "white",
                    border: "none",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  Disburse Funds
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
                      checked={selectedLoanApplications.length === loanApplications.length && loanApplications.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      style={{ cursor: "pointer" }}
                    />
                  </th>
                  <th onClick={() => handleSort('loanApplicationId')} style={{ cursor: 'pointer' }}>
                    Application ID
                    {sortField === 'loanApplicationId' && (
                      <span style={{ marginLeft: '8px', color: 'var(--primary-500)' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th onClick={() => handleSort('loanName')} style={{ cursor: 'pointer' }}>
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
                  <th onClick={() => handleSort('createdOn')} style={{ cursor: 'pointer' }}>
                    Created On
                    {sortField === 'createdOn' && (
                      <span style={{ marginLeft: '8px', color: 'var(--primary-500)' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th>Created By</th>
                  <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
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
                {loading ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>
                      Loading loan applications...
                    </td>
                  </tr>
                ) : paginatedLoanApplications.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '20px', color: 'var(--muted-text)' }}>
                      No sanctioned loan applications found
                    </td>
                  </tr>
                ) : (
                  paginatedLoanApplications.map(loanApplication => (
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
                              loanApplication.status === "Sanctioned" ? "rgba(34, 197, 94, 0.2)" :
                              loanApplication.status === "Disbursed" ? "rgba(16, 185, 129, 0.2)" :
                              "rgba(107, 114, 128, 0.2)",
                            color: 
                              loanApplication.status === "Sanctioned" ? "#15803d" :
                              loanApplication.status === "Disbursed" ? "#059669" :
                              "#6b7280",
                            border: `1px solid ${
                              loanApplication.status === "Sanctioned" ? "rgba(34, 197, 94, 0.3)" :
                              loanApplication.status === "Disbursed" ? "rgba(16, 185, 129, 0.3)" :
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
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {loanApplications.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={handleItemsPerPageChange}
              totalItems={loanApplications.length}
            />
          )}
        </section>
      </main>

      {/* Status Change Confirmation Modal */}
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
              Confirm Disbursement
            </h3>
            
            <p style={{ marginBottom: "20px", color: "var(--muted-text)", textAlign: "center" }}>
              You are about to disburse funds for {selectedLoanApplications.length} {selectedLoanApplications.length === 1 ? 'loan application' : 'loan applications'}.
              This will create loan accounts and process transactions.
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
                  backgroundColor: "#059669",
                  color: "white",
                  cursor: "pointer"
                }}
              >
                Confirm Disbursement
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardWrapper>
  );
}

export default LoanDisbursementMaintenance;

