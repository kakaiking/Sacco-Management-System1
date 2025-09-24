import React, { useContext, useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import axios from "axios";
import { FiEye, FiActivity, FiDatabase, FiEdit3, FiTrash2, FiLogIn, FiLogOut, FiCheck, FiX, FiLock, FiUnlock } from "react-icons/fi";
import DashboardWrapper from '../components/DashboardWrapper';
import Pagination from '../components/Pagination';
import { AuthContext } from "../helpers/AuthContext";

function LogsManagement() {
  const history = useHistory();
  const { authState, isLoading } = useContext(AuthContext);

  useEffect(() => {
    // Only redirect if authentication check is complete and user is not authenticated
    if (!isLoading && !authState.status) {
      history.push("/login");
    }
  }, [authState, isLoading, history]);

  const [logs, setLogs] = useState([]);
  const [actionFilter, setActionFilter] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const fetchLogs = async () => {
      try {
        const params = {};
        if (actionFilter) params.action = actionFilter;
        if (search) params.q = search;
        const res = await axios.get("http://localhost:3001/logs", {
          headers: { accessToken: localStorage.getItem("accessToken") },
          params,
          signal: controller.signal,
        });
        const payload = res?.data?.entity ?? res?.data;
        setLogs(Array.isArray(payload) ? payload : []);
      } catch (error) {
        console.error("Error fetching logs:", error);
        // For now, show mock data if API is not available
        setLogs(getMockLogs());
      }
    };
    fetchLogs();
    return () => controller.abort();
  }, [actionFilter, search]);

  // Mock data for demonstration
  const getMockLogs = () => [
    {
      id: 1,
      action: "CREATE",
      entityType: "Sacco",
      entityId: "SAC-1234",
      entityName: "Test Sacco",
      userId: "USR-001",
      username: "admin",
      timestamp: new Date().toISOString(),
      details: "Sacco created with license ID LIC-001",
      ipAddress: "192.168.1.100"
    },
    {
      id: 2,
      action: "UPDATE",
      entityType: "Member",
      entityId: "MEM-5678",
      entityName: "John Doe",
      userId: "USR-002",
      username: "manager",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      details: "Member details updated - phone number changed",
      ipAddress: "192.168.1.101"
    },
    {
      id: 3,
      action: "DELETE",
      entityType: "Product",
      entityId: "PRD-9012",
      entityName: "Personal Loan",
      userId: "USR-001",
      username: "admin",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      details: "Product deleted due to policy change",
      ipAddress: "192.168.1.100"
    },
    {
      id: 4,
      action: "LOGIN",
      entityType: "User",
      entityId: "USR-003",
      entityName: "Jane Smith",
      userId: "USR-003",
      username: "jane.smith",
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      details: "User logged in successfully",
      ipAddress: "192.168.1.102"
    },
    {
      id: 5,
      action: "APPROVE",
      entityType: "Member",
      entityId: "MEM-3456",
      entityName: "Alice Johnson",
      userId: "USR-001",
      username: "admin",
      timestamp: new Date(Date.now() - 14400000).toISOString(),
      details: "Member application approved",
      ipAddress: "192.168.1.100"
    }
  ];

  const counts = useMemo(() => {
    const list = Array.isArray(logs) ? logs : [];
    return {
      total: list.length,
      create: list.filter(l => l.action === "CREATE").length,
      update: list.filter(l => l.action === "UPDATE").length,
      delete: list.filter(l => l.action === "DELETE").length,
      view: list.filter(l => l.action === "VIEW").length,
      login: list.filter(l => l.action === "LOGIN").length,
      logout: list.filter(l => l.action === "LOGOUT").length,
      approve: list.filter(l => l.action === "APPROVE").length,
      reject: list.filter(l => l.action === "REJECT").length,
      lock: list.filter(l => l.action === "LOCK").length,
      unlock: list.filter(l => l.action === "UNLOCK").length,
    };
  }, [logs]);

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const getActionColor = (action) => {
    switch (action) {
      case "CREATE":
        return { bg: "rgba(16, 185, 129, 0.2)", color: "#059669", border: "rgba(16, 185, 129, 0.3)" };
      case "UPDATE":
        return { bg: "rgba(59, 130, 246, 0.2)", color: "#2563eb", border: "rgba(59, 130, 246, 0.3)" };
      case "DELETE":
        return { bg: "rgba(239, 68, 68, 0.2)", color: "#dc2626", border: "rgba(239, 68, 68, 0.3)" };
      case "VIEW":
        return { bg: "rgba(139, 69, 19, 0.2)", color: "#8b4513", border: "rgba(139, 69, 19, 0.3)" };
      case "LOGIN":
        return { bg: "rgba(34, 197, 94, 0.2)", color: "#16a34a", border: "rgba(34, 197, 94, 0.3)" };
      case "LOGOUT":
        return { bg: "rgba(107, 114, 128, 0.2)", color: "#6b7280", border: "rgba(107, 114, 128, 0.3)" };
      case "APPROVE":
        return { bg: "rgba(34, 197, 94, 0.2)", color: "#16a34a", border: "rgba(34, 197, 94, 0.3)" };
      case "REJECT":
        return { bg: "rgba(239, 68, 68, 0.2)", color: "#dc2626", border: "rgba(239, 68, 68, 0.3)" };
      case "LOCK":
        return { bg: "rgba(239, 68, 68, 0.2)", color: "#dc2626", border: "rgba(239, 68, 68, 0.3)" };
      case "UNLOCK":
        return { bg: "rgba(34, 197, 94, 0.2)", color: "#16a34a", border: "rgba(34, 197, 94, 0.3)" };
      default:
        return { bg: "rgba(107, 114, 128, 0.2)", color: "#6b7280", border: "rgba(107, 114, 128, 0.3)" };
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case "CREATE":
        return <FiDatabase />;
      case "UPDATE":
        return <FiEdit3 />;
      case "DELETE":
        return <FiTrash2 />;
      case "VIEW":
        return <FiEye />;
      case "LOGIN":
        return <FiLogIn />;
      case "LOGOUT":
        return <FiLogOut />;
      case "APPROVE":
        return <FiCheck />;
      case "REJECT":
        return <FiX />;
      case "LOCK":
        return <FiLock />;
      case "UNLOCK":
        return <FiUnlock />;
      default:
        return <FiActivity />;
    }
  };

  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [logs]);

  // Pagination logic
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedLogs.slice(startIndex, endIndex);
  }, [sortedLogs, currentPage, itemsPerPage]);

  // Handle viewing log details
  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setShowDetailsModal(true);
  };

  // Format JSON data for display
  const formatJsonData = (data) => {
    if (!data) return null;
    return JSON.stringify(data, null, 2);
  };

  // Render changes comparison
  const renderChanges = (changes) => {
    if (!changes) return null;
    
    return (
      <div style={{ marginTop: "16px" }}>
        <h4 style={{ marginBottom: "12px", color: "var(--primary-700)" }}>Changes Made:</h4>
        {Object.entries(changes).map(([field, change]) => (
          <div key={field} style={{ 
            marginBottom: "12px", 
            padding: "12px", 
            backgroundColor: "var(--surface-2)", 
            borderRadius: "8px",
            border: "1px solid var(--border)"
          }}>
            <div style={{ fontWeight: "600", marginBottom: "8px", color: "var(--primary-700)" }}>
              {field}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <div style={{ fontSize: "12px", color: "var(--muted-text)", marginBottom: "4px" }}>Before:</div>
                <div style={{ 
                  padding: "8px", 
                  backgroundColor: "rgba(239, 68, 68, 0.1)", 
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontFamily: "monospace"
                }}>
                  {formatJsonData(change.before)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "var(--muted-text)", marginBottom: "4px" }}>After:</div>
                <div style={{ 
                  padding: "8px", 
                  backgroundColor: "rgba(34, 197, 94, 0.1)", 
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontFamily: "monospace"
                }}>
                  {formatJsonData(change.after)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <DashboardWrapper>
      <header className="header">
        <div className="header__left">
          <div className="greeting">System Logs</div>
        </div>
      </header>

      <main className="dashboard__content">
        {/* Summary Cards */}
        <section className="cards cards--status">
          <div className="card card--active">
            <div className="card__icon">
              <FiDatabase />
            </div>
            <div className="card__content">
              <h4>Created</h4>
              <div className="card__kpi">{counts.create}</div>
            </div>
          </div>
          <div className="card card--pending">
            <div className="card__icon">
              <FiEdit3 />
            </div>
            <div className="card__content">
              <h4>Updated</h4>
              <div className="card__kpi">{counts.update}</div>
            </div>
          </div>
          <div className="card card--pending-password">
            <div className="card__icon">
              <FiTrash2 />
            </div>
            <div className="card__content">
              <h4>Deleted</h4>
              <div className="card__kpi">{counts.delete}</div>
            </div>
          </div>
          <div className="card card--inactive">
            <div className="card__icon">
              <FiEye />
            </div>
            <div className="card__content">
              <h4>Viewed</h4>
              <div className="card__kpi">{counts.view}</div>
            </div>
          </div>
          <div className="card card--locked">
            <div className="card__icon">
              <FiLogIn />
            </div>
            <div className="card__content">
              <h4>Logins</h4>
              <div className="card__kpi">{counts.login}</div>
            </div>
          </div>
          <div className="card card--active">
            <div className="card__icon">
              <FiLogOut />
            </div>
            <div className="card__content">
              <h4>Logouts</h4>
              <div className="card__kpi">{counts.logout}</div>
            </div>
          </div>
          <div className="card card--pending">
            <div className="card__icon">
              <FiCheck />
            </div>
            <div className="card__content">
              <h4>Approved</h4>
              <div className="card__kpi">{counts.approve}</div>
            </div>
          </div>
          <div className="card card--inactive">
            <div className="card__icon">
              <FiX />
            </div>
            <div className="card__content">
              <h4>Rejected</h4>
              <div className="card__kpi">{counts.reject}</div>
            </div>
          </div>
        </section>

        <section className="card" style={{ padding: 12 }}>
          <div className="tableToolbar">
            <select className="statusSelect" value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
              <option value="">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="VIEW">View</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
              <option value="APPROVE">Approve</option>
              <option value="REJECT">Reject</option>
              <option value="LOCK">Lock</option>
              <option value="UNLOCK">Unlock</option>
            </select>

            <div className="searchWrapper">
              <input className="searchInput" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search logs..." />
              <span className="searchIcon">🔍</span>
            </div>
          </div>

          <div className="tableContainer">
            <table className="table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Entity Type</th>
                  <th>Entity Name</th>
                  <th>User</th>
                  <th>Timestamp</th>
                  <th>Details</th>
                  <th>IP Address</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLogs.map((log) => {
                  const actionColors = getActionColor(log.action);
                  return (
                    <tr key={log.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ color: actionColors.color }}>
                            {getActionIcon(log.action)}
                          </span>
                          <div 
                            style={{
                              display: "inline-block",
                              padding: "4px 8px",
                              borderRadius: "12px",
                              fontSize: "11px",
                              fontWeight: "600",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                              backgroundColor: actionColors.bg,
                              color: actionColors.color,
                              border: `1px solid ${actionColors.border}`
                            }}
                          >
                            {log.action}
                          </div>
                        </div>
                      </td>
                      <td>{log.entityType}</td>
                      <td>{log.entityName}</td>
                      <td>
                        <div>
                          <div style={{ fontWeight: "600" }}>{log.username}</div>
                          <div style={{ fontSize: "12px", color: "var(--muted-text)" }}>{log.userId}</div>
                          {log.userRole && (
                            <div style={{ fontSize: "11px", color: "var(--primary-600)", fontWeight: "500" }}>
                              {log.userRole}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div>
                          <div>{new Date(log.timestamp).toLocaleDateString()}</div>
                          <div style={{ fontSize: "12px", color: "var(--muted-text)" }}>
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </td>
                      <td style={{ maxWidth: "200px", wordWrap: "break-word" }}>
                        {log.details}
                      </td>
                      <td style={{ fontFamily: "monospace", fontSize: "12px" }}>
                        {log.ipAddress}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "4px" }}>
                          <button
                            className="action-btn action-btn--view"
                            onClick={() => handleViewDetails(log)}
                            title="View Details"
                          >
                            <FiEye />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={sortedLogs.length}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </section>
      </main>

      {/* Log Details Modal */}
      {showDetailsModal && selectedLog && (
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
            backgroundColor: "var(--surface)",
            borderRadius: "12px",
            padding: "24px",
            maxWidth: "800px",
            maxHeight: "80vh",
            width: "90%",
            overflow: "auto",
            boxShadow: "var(--shadow)"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              borderBottom: "1px solid var(--border)",
              paddingBottom: "16px"
            }}>
              <h3 style={{ margin: 0, color: "var(--primary-700)" }}>Log Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "var(--muted-text)"
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <strong>Log ID:</strong> {selectedLog.logId || selectedLog.id}
                </div>
                <div>
                  <strong>Action:</strong> 
                  <span style={{
                    display: "inline-block",
                    marginLeft: "8px",
                    padding: "4px 8px",
                    borderRadius: "12px",
                    fontSize: "11px",
                    fontWeight: "600",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    backgroundColor: getActionColor(selectedLog.action).bg,
                    color: getActionColor(selectedLog.action).color,
                    border: `1px solid ${getActionColor(selectedLog.action).border}`
                  }}>
                    {selectedLog.action}
                  </span>
                </div>
                <div>
                  <strong>Entity Type:</strong> {selectedLog.entityType}
                </div>
                <div>
                  <strong>Entity Name:</strong> {selectedLog.entityName || "N/A"}
                </div>
                <div>
                  <strong>User:</strong> {selectedLog.username} ({selectedLog.userId})
                </div>
                <div>
                  <strong>User Role:</strong> {selectedLog.userRole || "N/A"}
                </div>
                <div>
                  <strong>Timestamp:</strong> {new Date(selectedLog.timestamp).toLocaleString()}
                </div>
                <div>
                  <strong>IP Address:</strong> {selectedLog.ipAddress || "N/A"}
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <strong>Details:</strong>
                <div style={{
                  marginTop: "8px",
                  padding: "12px",
                  backgroundColor: "var(--surface-2)",
                  borderRadius: "8px",
                  border: "1px solid var(--border)"
                }}>
                  {selectedLog.details || "No additional details"}
                </div>
              </div>

              {/* Before/After Data */}
              {selectedLog.beforeData && (
                <div style={{ marginBottom: "16px" }}>
                  <strong>Before Data:</strong>
                  <pre style={{
                    marginTop: "8px",
                    padding: "12px",
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    fontSize: "12px",
                    overflow: "auto",
                    maxHeight: "200px"
                  }}>
                    {formatJsonData(selectedLog.beforeData)}
                  </pre>
                </div>
              )}

              {selectedLog.afterData && (
                <div style={{ marginBottom: "16px" }}>
                  <strong>After Data:</strong>
                  <pre style={{
                    marginTop: "8px",
                    padding: "12px",
                    backgroundColor: "rgba(34, 197, 94, 0.1)",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    fontSize: "12px",
                    overflow: "auto",
                    maxHeight: "200px"
                  }}>
                    {formatJsonData(selectedLog.afterData)}
                  </pre>
                </div>
              )}

              {/* Changes */}
              {selectedLog.changes && renderChanges(selectedLog.changes)}
            </div>

            <div style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
              borderTop: "1px solid var(--border)",
              paddingTop: "16px"
            }}>
              <button
                onClick={() => setShowDetailsModal(false)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "var(--primary-500)",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer"
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardWrapper>
  );
}

export default LogsManagement;
