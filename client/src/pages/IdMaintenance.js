import React, { useState, useEffect, useContext, useMemo } from 'react';
import { FiEdit, FiSave, FiX, FiEye, FiPlus, FiRefreshCw, FiCheckCircle, FiXCircle, FiEdit3, FiTrash2 } from 'react-icons/fi';
import { FaPlus } from 'react-icons/fa';
import { useHistory } from 'react-router-dom';
import DashboardWrapper from '../components/DashboardWrapper';
import Pagination from '../components/Pagination';
import { useSnackbar } from '../helpers/SnackbarContext';
import { usePermissions } from '../hooks/usePermissions';
import { PERMISSIONS } from '../helpers/PermissionUtils';
import { AuthContext } from '../helpers/AuthContext';
import axios from 'axios';

function IdMaintenance() {
  const history = useHistory();
  const { authState, isLoading } = useContext(AuthContext);
  const { showMessage: showSnackbar } = useSnackbar();
  const { canView, canAdd, canEdit, canDelete } = usePermissions();

  const [configurations, setConfigurations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedConfigurations, setSelectedConfigurations] = useState([]);
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState("");
  const [verifierRemarks, setVerifierRemarks] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    // Only redirect if authentication check is complete and user is not authenticated
    if (!isLoading && !authState.status) {
      history.push("/login");
    }
  }, [authState, isLoading, history]);

  // Available models in the system
  const availableModels = [
    { name: 'Members', displayName: 'Member ID' },
    { name: 'Users', displayName: 'User ID' },
    { name: 'Products', displayName: 'Product ID' },
    { name: 'Accounts', displayName: 'Account ID' },
    { name: 'Transactions', displayName: 'Transaction ID' },
    { name: 'Loans', displayName: 'Loan ID' },
    { name: 'Collateral', displayName: 'Collateral ID' },
    { name: 'Tills', displayName: 'Till ID' },
    { name: 'Branches', displayName: 'Branch ID' },
    { name: 'Charges', displayName: 'Charge ID' }
  ];

  useEffect(() => {
    const controller = new AbortController();
  const fetchConfigurations = async () => {
    try {
      setLoading(true);
        const params = {};
        if (statusFilter) params.status = statusFilter;
        if (search) params.q = search;
        const response = await axios.get('/id-format-configurations', {
          headers: { accessToken: localStorage.getItem("accessToken") },
          params,
          signal: controller.signal,
        });
      if (response.data.success) {
        setConfigurations(response.data.data);
      } else {
        showSnackbar('Failed to fetch configurations', 'error');
      }
    } catch (error) {
        if (error.name !== 'AbortError') {
      console.error('Error fetching configurations:', error);
      showSnackbar('Error fetching configurations', 'error');
        }
    } finally {
      setLoading(false);
    }
  };
    fetchConfigurations();
    return () => controller.abort();
  }, [statusFilter, search]);

  const counts = useMemo(() => {
    const list = Array.isArray(configurations) ? configurations : [];
    const c = { Active: 0, Inactive: 0 };
    for (const config of list) {
      if (config.isActive) c.Active += 1;
      else c.Inactive += 1;
    }
    return c;
  }, [configurations]);

  // Pagination logic
  const paginatedConfigurations = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return configurations.slice(startIndex, endIndex);
  }, [configurations, currentPage, itemsPerPage]);

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSelectedConfigurations([]); // Clear selection when changing pages
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
    setSelectedConfigurations([]); // Clear selection
  };

  // Selection functions
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedConfigurations(paginatedConfigurations.map(c => c.id));
      } else {
      setSelectedConfigurations([]);
    }
  };

  const handleSelectConfiguration = (configId, checked) => {
    if (checked) {
      setSelectedConfigurations(prev => [...prev, configId]);
      } else {
      setSelectedConfigurations(prev => prev.filter(id => id !== configId));
    }
  };

  const isAllSelected = selectedConfigurations.length === paginatedConfigurations.length && paginatedConfigurations.length > 0;
  const isIndeterminate = selectedConfigurations.length > 0 && selectedConfigurations.length < paginatedConfigurations.length;

  // Show/hide batch actions based on selection
  useEffect(() => {
    setShowBatchActions(selectedConfigurations.length > 0);
  }, [selectedConfigurations]);

  // Status change functions
  const handleStatusChange = (action) => {
    setStatusAction(action);
    setShowStatusModal(true);
  };

  const confirmStatusChange = async () => {
    try {
      const promises = selectedConfigurations.map(configId => 
        axios.put(`/id-format-configurations/${configId}`, {
          isActive: statusAction === "Active",
          verifierRemarks: verifierRemarks
        }, { 
          headers: { accessToken: localStorage.getItem("accessToken") } 
        })
      );
      
      await Promise.all(promises);
      
      // Update local state
      setConfigurations(prev => prev.map(config => 
        selectedConfigurations.includes(config.id) 
          ? { ...config, isActive: statusAction === "Active", verifierRemarks: verifierRemarks }
          : config
      ));
      
      showSnackbar(`${statusAction} ${selectedConfigurations.length} configuration(s) successfully`, "success");
      setSelectedConfigurations([]);
      setShowStatusModal(false);
      setVerifierRemarks("");
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to update configuration status";
      showSnackbar(msg, "error");
    }
  };


  if (!canView(PERMISSIONS.ID_MAINTENANCE)) {
    return (
      <DashboardWrapper>
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <div className="alert alert-warning">
                You don't have permission to view this page.
              </div>
            </div>
          </div>
        </div>
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper>
      <header className="header">
        <div className="header__left">
          <div className="greeting">ID Format Maintenance</div>
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
              <FiXCircle />
            </div>
            <div className="card__content">
              <h4>Inactive</h4>
              <div className="card__kpi">{counts.Inactive}</div>
                        </div>
                      </div>
        </section>

        <section className="card" style={{ padding: 12 }}>
          <div className="tableToolbar">
            <select className="statusSelect" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            <div className="searchWrapper">
              <input className="searchInput" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search configurations..." />
              <span className="searchIcon">🔍</span>
                            </div>

            <button 
              className="pill" 
              onClick={() => history.push("/id-format/new")}
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
              title="Add Configuration"
            >
              <FaPlus />
              Add Configuration
            </button>

            {/* Batch Action Buttons */}
            {showBatchActions && (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "14px", color: "var(--muted-text)", marginRight: "8px" }}>
                  {selectedConfigurations.length} selected
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
                  <th>Model Name</th>
                  <th>Display Name</th>
                  <th>Prefix</th>
                  <th>Suffix</th>
                  <th>Digit Count</th>
                  <th>Character Type</th>
                  <th>Current Number</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedConfigurations.map(config => (
                  <tr key={config.id}>
                    <td>
                            <input
                        type="checkbox"
                        checked={selectedConfigurations.includes(config.id)}
                        onChange={(e) => handleSelectConfiguration(config.id, e.target.checked)}
                        style={{ cursor: "pointer" }}
                      />
                    </td>
                    <td>{config.modelName}</td>
                    <td>{config.displayName}</td>
                    <td>{config.prefix || 'None'}</td>
                    <td>{config.suffix || 'None'}</td>
                    <td>{config.digitCount}</td>
                    <td>{config.characterType}</td>
                    <td>{config.currentNumber}</td>
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
                            config.isActive ? "rgba(16, 185, 129, 0.2)" :
                            "rgba(239, 68, 68, 0.2)",
                          color: 
                            config.isActive ? "#059669" :
                            "#dc2626",
                          border: `1px solid ${
                            config.isActive ? "rgba(16, 185, 129, 0.3)" :
                            "rgba(239, 68, 68, 0.3)"
                          }`
                        }}
                      >
                        {config.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </td>
                    <td className="actions">
                      <button className="action-btn action-btn--view" onClick={() => history.push(`/id-format/${config.id}`)} title="View">
                        <FiEye />
                      </button>
                      <button className="action-btn action-btn--edit" onClick={() => history.push(`/id-format/${config.id}?edit=1`)} title="Update">
                        <FiEdit3 />
                      </button>
                      <button className="action-btn action-btn--delete" onClick={async () => {
                        try {
                          await axios.delete(`/id-format-configurations/${config.id}`, { headers: { accessToken: localStorage.getItem("accessToken") } });
                          setConfigurations(curr => curr.filter(x => x.id !== config.id));
                          showSnackbar("Configuration deleted successfully", "success");
                        } catch (err) {
                          const msg = err?.response?.data?.error || "Failed to delete configuration";
                          showSnackbar(msg, "error");
                        }
                      }} title="Delete">
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={configurations.length}
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
              You are about to {statusAction} {selectedConfigurations.length} {selectedConfigurations.length === 1 ? 'configuration' : 'configurations'}.
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
                {statusAction}
                      </button>
                    </div>
          </div>
        </div>
      )}
    </DashboardWrapper>
  );
}

export default IdMaintenance;
