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

function LoanProductsMaintenance() {
  // Loan Products Maintenance Component
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
      frontendLoggingService.logView("LoanProduct", null, null, "Viewed Loan Products Maintenance page");
    }
  }, [authState, isLoading, history]);

  const [loanProducts, setLoanProducts] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedLoanProducts, setSelectedLoanProducts] = useState([]);
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState("");
  const [sortField] = useState("createdOn");
  const [sortDirection] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const controller = new AbortController();
    const fetchLoanProducts = async () => {
      try {
        const params = {};
        if (statusFilter) params.status = statusFilter;
        if (search) params.q = search;
        const res = await axios.get("http://localhost:3001/loan-products", {
          headers: { accessToken: localStorage.getItem("accessToken") },
          params,
          signal: controller.signal,
        });
        const payload = res?.data?.entity ?? res?.data;
        setLoanProducts(Array.isArray(payload) ? payload : []);
      } catch {}
    };
    fetchLoanProducts();
    return () => controller.abort();
  }, [statusFilter, search]);

  const counts = useMemo(() => {
    const list = Array.isArray(loanProducts) ? loanProducts : [];
    const c = { Active: 0, Inactive: 0, Pending: 0 };
    for (const loanProduct of list) {
      if (loanProduct.status && c[loanProduct.status] !== undefined) c[loanProduct.status] += 1;
    }
    return c;
  }, [loanProducts]);

  const sortedLoanProducts = useMemo(() => {
    const list = Array.isArray(loanProducts) ? loanProducts : [];
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
  }, [loanProducts, sortField, sortDirection]);

  // Pagination logic
  const paginatedLoanProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedLoanProducts.slice(startIndex, endIndex);
  }, [sortedLoanProducts, currentPage, itemsPerPage]);

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSelectedLoanProducts([]); // Clear selection when changing pages
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
    setSelectedLoanProducts([]); // Clear selection
  };

  // Selection functions
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedLoanProducts(paginatedLoanProducts.map(loanProduct => loanProduct.id));
    } else {
      setSelectedLoanProducts([]);
    }
  };

  const handleSelectLoanProduct = (loanProductId, checked) => {
    if (checked) {
      setSelectedLoanProducts(prev => [...prev, loanProductId]);
    } else {
      setSelectedLoanProducts(prev => prev.filter(id => id !== loanProductId));
    }
  };

  const isAllSelected = selectedLoanProducts.length === paginatedLoanProducts.length && paginatedLoanProducts.length > 0;
  const isIndeterminate = selectedLoanProducts.length > 0 && selectedLoanProducts.length < paginatedLoanProducts.length;

  // Show/hide batch actions based on selection
  useEffect(() => {
    setShowBatchActions(selectedLoanProducts.length > 0);
  }, [selectedLoanProducts]);

  // Status change functions
  const handleStatusChange = (action) => {
    setStatusAction(action);
    setShowStatusModal(true);
  };

  const confirmStatusChange = async () => {
    try {
      // Get before data for logging
      const beforeData = selectedLoanProducts.map(loanProductId => {
        const loanProduct = loanProducts.find(loanProduct => loanProduct.id === loanProductId);
        return {
          id: loanProductId,
          loanProductId: loanProduct?.loanProductId,
          loanProductName: loanProduct?.loanProductName,
          status: loanProduct?.status
        };
      });

      const promises = selectedLoanProducts.map(loanProductId => 
        axios.put(`http://localhost:3001/loan-products/${loanProductId}/status`, {
          status: statusAction
        }, {
          headers: { accessToken: localStorage.getItem("accessToken") }
        })
      );
      
      await Promise.all(promises);
      
      // Prepare after data for logging
      const afterData = beforeData.map(loanProduct => ({
        ...loanProduct,
        status: statusAction
      }));

      // Log the update action with before/after data
      frontendLoggingService.logUpdate(
        "LoanProduct", 
        selectedLoanProducts.join(','), 
        `${selectedLoanProducts.length} loan products`, 
        beforeData, 
        afterData, 
        `Updated status to ${statusAction} for ${selectedLoanProducts.length} loan products`
      );
      
      // Update local state
      setLoanProducts(prev => prev.map(loanProduct => 
        selectedLoanProducts.includes(loanProduct.id) 
          ? { ...loanProduct, status: statusAction }
          : loanProduct
      ));
      
      showMessage(`${statusAction} ${selectedLoanProducts.length} loan product(s) successfully`, "success");
      setSelectedLoanProducts([]);
      setShowStatusModal(false);
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to update loan product status";
      showMessage(msg, "error");
    }
  };

  return (
    <DashboardWrapper>
      <header className="header">
        <div className="header__left">
          <div className="greeting">Loan Products Maintenance</div>
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
              frontendLoggingService.logFilter("Status", e.target.value, "LoanProduct", `Filtered loan products by status: ${e.target.value || 'All'}`);
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
                  frontendLoggingService.logSearch(e.target.value, "LoanProduct", null, `Searched for loan products: "${e.target.value}"`);
                }
                setSearch(e.target.value);
              }} placeholder="Search loan products..." />
              <span className="searchIcon">🔍</span>
            </div>

            {canAdd(PERMISSIONS.LOAN_PRODUCTS_MAINTENANCE) ? (
              <button 
                className="pill" 
                onClick={() => {
                  frontendLoggingService.logButtonClick("Add Loan Product", "LoanProduct", null, "Clicked Add Loan Product button");
                  history.push("/loan-product/new");
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
                title="Add Loan Product"
              >
                <FaPlus />
                Add Loan Product
              </button>
            ) : (
              <button 
                className="pill" 
                onClick={() => showMessage("Your role lacks permission to add loan products", "error")}
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
                title="Add Loan Product - No Permission"
                disabled
              >
                <FaPlus />
                Add Loan Product
              </button>
            )}

            {/* Batch Action Buttons */}
            {showBatchActions && canApprove(PERMISSIONS.LOAN_PRODUCTS_MAINTENANCE) && (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "14px", color: "var(--muted-text)", marginRight: "8px" }}>
                  {selectedLoanProducts.length} selected
                </span>
                <button 
                  className="pill" 
                  onClick={() => {
                    frontendLoggingService.logButtonClick("Activate Loan Products", "LoanProduct", null, `Clicked Activate button for ${selectedLoanProducts.length} selected loan products`);
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
                    frontendLoggingService.logButtonClick("Deactivate Loan Products", "LoanProduct", null, `Clicked Deactivate button for ${selectedLoanProducts.length} selected loan products`);
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
                    Product ID
                    {sortField === 'loanProductId' && (
                      <span style={{ marginLeft: '8px', color: 'var(--primary-500)' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th>
                    Product Name
                    {sortField === 'loanProductName' && (
                      <span style={{ marginLeft: '8px', color: 'var(--primary-500)' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th>Type</th>
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
                {paginatedLoanProducts.map(loanProduct => (
                  <tr key={loanProduct.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedLoanProducts.includes(loanProduct.id)}
                        onChange={(e) => handleSelectLoanProduct(loanProduct.id, e.target.checked)}
                        style={{ cursor: "pointer" }}
                      />
                    </td>
                    <td>{loanProduct.loanProductId}</td>
                    <td>{loanProduct.loanProductName}</td>
                    <td>{loanProduct.loanProductType}</td>
                    <td>{loanProduct.description || '-'}</td>
                    <td>{loanProduct.createdOn ? new Date(loanProduct.createdOn).toLocaleDateString() : '-'}</td>
                    <td>{loanProduct.createdBy || '-'}</td>
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
                            loanProduct.status === "Active" ? "rgba(16, 185, 129, 0.2)" :
                            loanProduct.status === "Pending" ? "rgba(6, 182, 212, 0.2)" :
                            loanProduct.status === "Inactive" ? "rgba(239, 68, 68, 0.2)" :
                            "rgba(107, 114, 128, 0.2)",
                          color: 
                            loanProduct.status === "Active" ? "#059669" :
                            loanProduct.status === "Pending" ? "#0891b2" :
                            loanProduct.status === "Inactive" ? "#dc2626" :
                            "#6b7280",
                          border: `1px solid ${
                            loanProduct.status === "Active" ? "rgba(16, 185, 129, 0.3)" :
                            loanProduct.status === "Pending" ? "rgba(6, 182, 212, 0.3)" :
                            loanProduct.status === "Inactive" ? "rgba(239, 68, 68, 0.3)" :
                            "rgba(107, 114, 128, 0.3)"
                          }`
                        }}
                      >
                        {loanProduct.status}
                      </div>
                    </td>
                    <td className="actions">
                      <button className="action-btn action-btn--view" onClick={() => {
                        frontendLoggingService.logView("LoanProduct", loanProduct.id, loanProduct.loanProductName, "Viewed loan product details");
                        history.push(`/loan-product/${loanProduct.id}`);
                      }} title="View">
                        <FiEye />
                      </button>
                      {canEdit(PERMISSIONS.LOAN_PRODUCTS_MAINTENANCE) ? (
                        <button className="action-btn action-btn--edit" onClick={() => {
                          frontendLoggingService.logButtonClick("Edit Loan Product", "LoanProduct", loanProduct.id, `Clicked Edit button for loan product: ${loanProduct.loanProductName}`);
                          history.push(`/loan-product/${loanProduct.id}?edit=1`);
                        }} title="Update">
                          <FiEdit3 />
                        </button>
                      ) : (
                        <button 
                          className="action-btn action-btn--edit" 
                          onClick={() => showMessage("Your role lacks permission to edit loan products", "error")} 
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
                            // Log the delete action with loan product data before deletion
                            frontendLoggingService.logDelete("LoanProduct", loanProduct.id, loanProduct.loanProductName, {
                              loanProductId: loanProduct.loanProductId,
                              loanProductName: loanProduct.loanProductName,
                              status: loanProduct.status
                            }, `Deleted loan product: ${loanProduct.loanProductName}`);
                            
                            await axios.delete(`http://localhost:3001/loan-products/${loanProduct.id}`, { headers: { accessToken: localStorage.getItem("accessToken") } });
                            setLoanProducts(curr => curr.filter(x => x.id !== loanProduct.id));
                            showMessage("Loan product deleted successfully", "success");
                          } catch (err) {
                            const msg = err?.response?.data?.error || "Failed to delete loan product";
                            showMessage(msg, "error");
                          }
                        }} title="Delete">
                          <FiTrash2 />
                        </button>
                      ) : (
                        <button 
                          className="action-btn action-btn--delete" 
                          onClick={() => showMessage("Your role lacks permission to delete loan products", "error")} 
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
            totalItems={sortedLoanProducts.length}
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
              You are about to {statusAction === "Inactive" ? "Deactivate" : statusAction} {selectedLoanProducts.length} {selectedLoanProducts.length === 1 ? 'record' : 'records'}.
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

export default LoanProductsMaintenance;
