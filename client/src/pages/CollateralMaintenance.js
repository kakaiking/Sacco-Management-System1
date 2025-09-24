import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { FiEye, FiEdit3, FiTrash2, FiPlus, FiSearch, FiFilter, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import axios from "axios";
import { useSnackbar } from "../helpers/SnackbarContext";
import { AuthContext } from "../helpers/AuthContext";
import DashboardWrapper from '../components/DashboardWrapper';
import Pagination from '../components/Pagination';
import { usePermissions } from "../hooks/usePermissions";
import { PERMISSIONS } from "../helpers/PermissionUtils";
import frontendLoggingService from "../services/frontendLoggingService";

function CollateralMaintenance() {
  const history = useHistory();
  const { authState, isLoading } = useContext(AuthContext);
  const { showMessage } = useSnackbar();
  const { canView, canAdd, canEdit, canDelete } = usePermissions();

  const [collaterals, setCollaterals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [collateralTypeFilter, setCollateralTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortField, setSortField] = useState("createdOn");
  const [sortDirection, setSortDirection] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedCollaterals, setSelectedCollaterals] = useState([]);
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    if (!isLoading && !authState.status) {
      history.push("/login");
    }
  }, [authState, isLoading, history]);

  useEffect(() => {
    if (authState.status) {
      fetchCollaterals();
    }
  }, [authState.status, search, collateralTypeFilter, statusFilter, sortField, sortDirection, currentPage, itemsPerPage]);

  useEffect(() => {
    setShowBatchActions(selectedCollaterals.length > 0);
  }, [selectedCollaterals]);

  const fetchCollaterals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('q', search);
      if (collateralTypeFilter) params.append('collateralType', collateralTypeFilter);
      if (statusFilter) params.append('status', statusFilter);
      params.append('page', currentPage);
      params.append('limit', itemsPerPage);

      const response = await axios.get(`http://localhost:3001/collateral?${params}`, {
        headers: { 
          accessToken: localStorage.getItem('accessToken'),
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.entity) {
        setCollaterals(response.data.entity.collaterals || []);
      } else {
        setCollaterals([]);
      }
      
      frontendLoggingService.logView("Collateral", null, null, "Fetched collateral list");
      
    } catch (error) {
      console.error('Error fetching collaterals:', error);
      let errorMessage = 'Failed to fetch collaterals';
      
      if (error.response) {
        errorMessage = error.response.data?.message || error.response.data?.error || `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'Network error: Unable to connect to server';
      } else {
        errorMessage = error.message || 'Unknown error occurred';
      }
      
      showMessage(errorMessage, 'error');
      setCollaterals([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    frontendLoggingService.logPagination("Collateral", page, itemsPerPage, "Changed page in collateral maintenance");
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
    frontendLoggingService.logPagination("Collateral", 1, newItemsPerPage, "Changed items per page in collateral maintenance");
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      const allIds = collaterals.map(collateral => collateral.id);
      setSelectedCollaterals(allIds);
    } else {
      setSelectedCollaterals([]);
    }
  };

  const handleSelectCollateral = (collateralId, checked) => {
    if (checked) {
      setSelectedCollaterals(prev => [...prev, collateralId]);
    } else {
      setSelectedCollaterals(prev => prev.filter(id => id !== collateralId));
    }
  };

  const handleStatusChange = (action) => {
    setStatusAction(action);
    setShowStatusModal(true);
  };

  const confirmStatusChange = async () => {
    if (!selectedCollaterals.length) {
      showMessage('No collaterals selected', 'error');
      return;
    }

    try {
      const results = [];
      const errors = [];
      
      for (const collateralId of selectedCollaterals) {
        try {
          const response = await axios.put(`http://localhost:3001/collateral/${collateralId}/status`, {
            status: statusAction
          }, {
            headers: { 
              accessToken: localStorage.getItem("accessToken"),
              'Content-Type': 'application/json'
            }
          });
          
          results.push({ id: collateralId, success: true, data: response.data });
          
        } catch (error) {
          let errorMessage = 'Unknown error';
          if (error.response) {
            errorMessage = error.response.data?.message || error.response.data?.error || `Server error: ${error.response.status}`;
          } else if (error.request) {
            errorMessage = 'Network error: Unable to connect to server';
          } else {
            errorMessage = error.message || 'Request setup error';
          }
          
          errors.push({ id: collateralId, error: errorMessage });
        }
      }
      
      if (results.length === selectedCollaterals.length) {
        showMessage(`Successfully updated status for all ${results.length} collateral(s)`, 'success');
      } else if (results.length > 0) {
        showMessage(`Updated status for ${results.length} of ${selectedCollaterals.length} collaterals. ${errors.length} failed.`, 'warning');
      } else {
        showMessage(`Failed to update status for all ${selectedCollaterals.length} collaterals`, 'error');
      }
      
      setSelectedCollaterals([]);
      setShowStatusModal(false);
      await fetchCollaterals();
      
    } catch (error) {
      console.error('Unexpected error during status update:', error);
      showMessage('An unexpected error occurred during status update', 'error');
    }
  };

  const handleDelete = (collateral) => {
    setDeleteTarget(collateral);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await axios.delete(`http://localhost:3001/collateral/${deleteTarget.id}`, {
        headers: { 
          accessToken: localStorage.getItem("accessToken"),
          'Content-Type': 'application/json'
        }
      });
      
      showMessage('Collateral deleted successfully', 'success');
      setShowDeleteModal(false);
      setDeleteTarget(null);
      await fetchCollaterals();
      
    } catch (error) {
      console.error('Error deleting collateral:', error);
      let errorMessage = 'Failed to delete collateral';
      
      if (error.response) {
        errorMessage = error.response.data?.message || error.response.data?.error || `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'Network error: Unable to connect to server';
      } else {
        errorMessage = error.message || 'Unknown error occurred';
      }
      
      showMessage(errorMessage, 'error');
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    frontendLoggingService.logSort("Collateral", field, sortDirection === field ? (sortDirection === 'asc' ? 'desc' : 'asc') : 'asc', "Sorted collateral maintenance");
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return { bg: 'rgba(34, 197, 94, 0.2)', color: '#15803d', border: 'rgba(34, 197, 94, 0.3)' };
      case 'Inactive': return { bg: 'rgba(107, 114, 128, 0.2)', color: '#6b7280', border: 'rgba(107, 114, 128, 0.3)' };
      case 'Under Review': return { bg: 'rgba(6, 182, 212, 0.2)', color: '#0891b2', border: 'rgba(6, 182, 212, 0.3)' };
      case 'Rejected': return { bg: 'rgba(239, 68, 68, 0.2)', color: '#dc2626', border: 'rgba(239, 68, 68, 0.3)' };
      case 'Released': return { bg: 'rgba(16, 185, 129, 0.2)', color: '#059669', border: 'rgba(16, 185, 129, 0.3)' };
      default: return { bg: 'rgba(107, 114, 128, 0.2)', color: '#6b7280', border: 'rgba(107, 114, 128, 0.3)' };
    }
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

  return (
    <DashboardWrapper>
      <header className="header">
        <div className="header__left">
          <div className="greeting">Collateral Maintenance</div>
        </div>
        <div className="header__right">
          {canAdd(PERMISSIONS.COLLATERAL_MAINTENANCE) && (
            <button 
              className="btn btn--primary"
              onClick={() => {
                frontendLoggingService.logButtonClick("Add Collateral", "Collateral", null, "Clicked Add Collateral button");
                history.push("/collateral/new");
              }}
            >
              <FiPlus /> Add Collateral
            </button>
          )}
        </div>
      </header>

      <main className="dashboard__content">
        <section className="card" style={{ padding: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <h2 style={{ margin: 0, color: "var(--primary-700)" }}>Collateral Management</h2>
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
                {collaterals.length} Collaterals
              </div>
            </div>
          </div>
        </section>

        <section className="card" style={{ padding: 12 }}>
          <div className="tableToolbar">
            <div className="searchWrapper">
              <input 
                className="searchInput" 
                value={search} 
                onChange={e => {
                  if (e.target.value.length > 2 || e.target.value.length === 0) {
                    frontendLoggingService.logSearch(e.target.value, "Collateral", null, `Searched for collaterals: "${e.target.value}"`);
                    setSearch(e.target.value);
                  }
                }} 
                placeholder="Search by ID, description, document number..." 
              />
              <FiSearch className="searchIcon" />
            </div>

            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <select 
                value={collateralTypeFilter} 
                onChange={e => setCollateralTypeFilter(e.target.value)}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px"
                }}
              >
                <option value="">All Types</option>
                <option value="Real Estate">Real Estate</option>
                <option value="Vehicle">Vehicle</option>
                <option value="Equipment">Equipment</option>
                <option value="Inventory">Inventory</option>
                <option value="Securities">Securities</option>
                <option value="Cash Deposit">Cash Deposit</option>
                <option value="Other">Other</option>
              </select>

              <select 
                value={statusFilter} 
                onChange={e => setStatusFilter(e.target.value)}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px"
                }}
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Under Review">Under Review</option>
                <option value="Rejected">Rejected</option>
                <option value="Released">Released</option>
              </select>

              {showBatchActions && (
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span style={{ fontSize: "14px", color: "var(--muted-text)", marginRight: "8px" }}>
                    {selectedCollaterals.length} selected
                  </span>
                  <select 
                    onChange={e => {
                      if (e.target.value) {
                        frontendLoggingService.logButtonClick("Update Status", "Collateral", null, `Clicked Update Status button for ${selectedCollaterals.length} selected collaterals`);
                        handleStatusChange(e.target.value);
                        e.target.value = "";
                      }
                    }}
                    style={{
                      padding: "6px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px"
                    }}
                  >
                    <option value="">Update Status</option>
                    <option value="Active">Mark as Active</option>
                    <option value="Inactive">Mark as Inactive</option>
                    <option value="Under Review">Mark as Under Review</option>
                    <option value="Rejected">Mark as Rejected</option>
                    <option value="Released">Mark as Released</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="tableContainer">
            <table className="table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={selectedCollaterals.length === collaterals.length && collaterals.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      style={{ cursor: "pointer" }}
                    />
                  </th>
                  <th onClick={() => handleSort('collateralId')} style={{ cursor: 'pointer' }}>
                    Collateral ID
                    {sortField === 'collateralId' && (
                      <span style={{ marginLeft: '8px', color: 'var(--primary-500)' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th onClick={() => handleSort('collateralType')} style={{ cursor: 'pointer' }}>
                    Type
                    {sortField === 'collateralType' && (
                      <span style={{ marginLeft: '8px', color: 'var(--primary-500)' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th>Description</th>
                  <th>Member</th>
                  <th onClick={() => handleSort('value')} style={{ cursor: 'pointer' }}>
                    Value
                    {sortField === 'value' && (
                      <span style={{ marginLeft: '8px', color: 'var(--primary-500)' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th>Condition</th>
                  <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
                    Status
                    {sortField === 'status' && (
                      <span style={{ marginLeft: '8px', color: 'var(--primary-500)' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th onClick={() => handleSort('createdOn')} style={{ cursor: 'pointer' }}>
                    Created On
                    {sortField === 'createdOn' && (
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
                      Loading collaterals...
                    </td>
                  </tr>
                ) : collaterals.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '20px', color: 'var(--muted-text)' }}>
                      No collaterals found
                    </td>
                  </tr>
                ) : (
                  collaterals.map(collateral => {
                    const statusColors = getStatusColor(collateral.status);
                    return (
                      <tr key={collateral.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedCollaterals.includes(collateral.id)}
                            onChange={(e) => handleSelectCollateral(collateral.id, e.target.checked)}
                            style={{ cursor: "pointer" }}
                          />
                        </td>
                        <td>{collateral.collateralId}</td>
                        <td>
                          <span style={{
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: "500",
                            backgroundColor: "#f3f4f6",
                            color: "#374151"
                          }}>
                            {collateral.collateralType}
                          </span>
                        </td>
                        <td style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {collateral.description}
                        </td>
                        <td>
                          {collateral.member ? 
                            `${collateral.member.firstName} ${collateral.member.lastName}` : 
                            'Unknown Member'
                          }
                        </td>
                        <td style={{ fontFamily: "monospace", fontWeight: "600" }}>
                          {formatCurrency(collateral.value, collateral.currency)}
                        </td>
                        <td>
                          {collateral.condition ? (
                            <span style={{
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontSize: "12px",
                              fontWeight: "500",
                              backgroundColor: 
                                collateral.condition === 'Excellent' ? '#dcfce7' :
                                collateral.condition === 'Good' ? '#dbeafe' :
                                collateral.condition === 'Fair' ? '#fef3c7' :
                                '#fee2e2',
                              color: 
                                collateral.condition === 'Excellent' ? '#15803d' :
                                collateral.condition === 'Good' ? '#1d4ed8' :
                                collateral.condition === 'Fair' ? '#d97706' :
                                '#dc2626'
                            }}>
                              {collateral.condition}
                            </span>
                          ) : '-'}
                        </td>
                        <td>
                          <div style={{
                            display: "inline-block",
                            padding: "6px 12px",
                            borderRadius: "16px",
                            fontSize: "12px",
                            fontWeight: "600",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            backgroundColor: statusColors.bg,
                            color: statusColors.color,
                            border: `1px solid ${statusColors.border}`
                          }}>
                            {collateral.status}
                          </div>
                        </td>
                        <td>{collateral.createdOn ? new Date(collateral.createdOn).toLocaleDateString() : '-'}</td>
                        <td className="actions">
                          <button 
                            className="action-btn action-btn--view" 
                            onClick={() => {
                              frontendLoggingService.logView("Collateral", collateral.id, collateral.collateralId, "Viewed collateral details");
                              history.push(`/collateral/${collateral.id}`);
                            }} 
                            title="View"
                          >
                            <FiEye />
                          </button>
                          {canEdit(PERMISSIONS.COLLATERAL_MAINTENANCE) && (
                            <button 
                              className="action-btn action-btn--edit" 
                              onClick={() => {
                                frontendLoggingService.logEdit("Collateral", collateral.id, collateral.collateralId, "Clicked edit collateral");
                                history.push(`/collateral/${collateral.id}/edit`);
                              }} 
                              title="Edit"
                            >
                              <FiEdit3 />
                            </button>
                          )}
                          {canDelete(PERMISSIONS.COLLATERAL_MAINTENANCE) && (
                            <button 
                              className="action-btn action-btn--delete" 
                              onClick={() => {
                                frontendLoggingService.logDelete("Collateral", collateral.id, collateral.collateralId, "Clicked delete collateral");
                                handleDelete(collateral);
                              }} 
                              title="Delete"
                            >
                              <FiTrash2 />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {collaterals.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(collaterals.length / itemsPerPage)}
              onPageChange={handlePageChange}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={handleItemsPerPageChange}
              totalItems={collaterals.length}
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
              Confirm Status Update
            </h3>
            
            <p style={{ marginBottom: "20px", color: "var(--muted-text)", textAlign: "center" }}>
              You are about to update the status of {selectedCollaterals.length} {selectedCollaterals.length === 1 ? 'collateral' : 'collaterals'} to "{statusAction}".
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
                Confirm Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteTarget && (
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
          onClick={() => setShowDeleteModal(false)}
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
              Confirm Deletion
            </h3>
            
            <p style={{ marginBottom: "20px", color: "var(--muted-text)", textAlign: "center" }}>
              Are you sure you want to delete the collateral "{deleteTarget.collateralId}"? This action cannot be undone.
            </p>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowDeleteModal(false)}
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
                onClick={confirmDelete}
                style={{
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: "6px",
                  backgroundColor: "#dc2626",
                  color: "white",
                  cursor: "pointer"
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardWrapper>
  );
}

export default CollateralMaintenance;
