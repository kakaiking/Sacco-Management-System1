import React, { useContext, useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import axios from "axios";
import { FiEye, FiEdit3, FiCheckCircle, FiClock, FiXCircle, FiLock, FiUnlock, FiMail } from "react-icons/fi";
import { FaPlus } from 'react-icons/fa';
import DashboardWrapper from '../components/DashboardWrapper';
import Pagination from '../components/Pagination';
import { useSnackbar } from "../helpers/SnackbarContext";
import { AuthContext } from "../helpers/AuthContext";

function UserMaintenance() {
  const history = useHistory();
  const { showMessage } = useSnackbar();
  const { authState, isLoading } = useContext(AuthContext);

  useEffect(() => {
    // Only redirect if authentication check is complete and user is not authenticated
    if (!isLoading && !authState.status) {
      history.push("/login");
    }
  }, [authState, isLoading, history]);

  const [users, setUsers] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState("");
  const [verifierRemarks, setVerifierRemarks] = useState("");
  const [sortField] = useState("userId");
  const [sortDirection] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const controller = new AbortController();
    const fetchUsers = async () => {
      try {
        const params = {};
        if (statusFilter) params.status = statusFilter;
        if (search) params.q = search;
        const res = await axios.get("http://localhost:3001/users", {
          headers: { accessToken: localStorage.getItem("accessToken") },
          params,
          signal: controller.signal,
        });
        const payload = res?.data?.entity ?? res?.data;
        setUsers(Array.isArray(payload) ? payload : []);
      } catch {}
    };
    fetchUsers();
    return () => controller.abort();
  }, [statusFilter, search]);

  const counts = useMemo(() => {
    const list = Array.isArray(users) ? users : [];
    return {
      total: list.length,
      active: list.filter(u => u.status === "Active").length,
      pending: list.filter(u => u.status === "Pending").length,
      pendingPassword: list.filter(u => u.status === "Pending Password").length,
      inactive: list.filter(u => u.status === "Inactive").length,
      locked: list.filter(u => u.status === "Locked").length,
    };
  }, [users]);

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSelectedUsers([]); // Clear selection when changing pages
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
    setSelectedUsers([]); // Clear selection
  };

  const handleSelectUser = (userId, checked) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedUsers(paginatedUsers.map(u => u.id));
    } else {
      setSelectedUsers([]);
    }
  };


  // Check if all selected users can transition to a specific status
  const canTransitionToStatus = (targetStatus) => {
    if (selectedUsers.length === 0) return false;
    
    return selectedUsers.every(userId => {
      const user = users.find(u => u.id === userId);
      if (!user) return false;
      
      const currentStatus = user.status;
      
      // Define valid status transitions
      switch (targetStatus) {
        case "Active":
          // Can activate users who are in "Pending" or "Inactive" status
          return currentStatus === "Pending" || currentStatus === "Inactive";
        case "Inactive":
          // Can only deactivate users who are in "Active" status
          return currentStatus === "Active";
        case "Locked":
          // Can lock users who are not already locked
          return currentStatus !== "Locked";
        default:
          return false;
      }
    });
  };


  // Show/hide batch actions based on selection
  useEffect(() => {
    setShowBatchActions(selectedUsers.length > 0);
  }, [selectedUsers]);

  const handleBatchAction = (action) => {
    if (selectedUsers.length === 0) {
      showMessage("Please select users to perform batch action", "error");
      return;
    }
    setStatusAction(action);
    setShowStatusModal(true);
  };

  const executeBatchAction = async () => {
    try {
      const promises = selectedUsers.map(userId => {
        if (statusAction === "approve") {
          return axios.put(`http://localhost:3001/users/${userId}/approve`, 
            { action: "approve", verifierRemarks: verifierRemarks },
            { headers: { accessToken: localStorage.getItem("accessToken") } }
          );
        } else if (statusAction === "reject") {
          return axios.put(`http://localhost:3001/users/${userId}/approve`, 
            { action: "reject", verifierRemarks: verifierRemarks },
            { headers: { accessToken: localStorage.getItem("accessToken") } }
          );
        } else if (statusAction === "inactive") {
          return axios.put(`http://localhost:3001/users/${userId}`, 
            { status: "Inactive", verifierRemarks: verifierRemarks },
            { headers: { accessToken: localStorage.getItem("accessToken") } }
          );
        } else if (statusAction === "lock") {
          return axios.put(`http://localhost:3001/users/${userId}/lock`, 
            { lockRemarks: verifierRemarks },
            { headers: { accessToken: localStorage.getItem("accessToken") } }
          );
        }
        return Promise.resolve();
      });

      await Promise.all(promises);
      showMessage(`Batch ${statusAction} completed successfully`, "success");
      setSelectedUsers([]);
      setShowStatusModal(false);
      setVerifierRemarks("");
      // Refresh the list
      window.location.reload();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || `Failed to ${statusAction} users`;
      showMessage(msg, "error");
    }
  };

  const handleSingleAction = async (userId, action) => {
    try {
      if (action === "approve") {
        await axios.put(`http://localhost:3001/users/${userId}/approve`, 
          { action: "approve", verifierRemarks: "User approved by administrator" },
          { headers: { accessToken: localStorage.getItem("accessToken") } }
        );
        showMessage("User approved successfully", "success");
      } else if (action === "reject") {
        await axios.put(`http://localhost:3001/users/${userId}/approve`, 
          { action: "reject", verifierRemarks: "User rejected by administrator" },
          { headers: { accessToken: localStorage.getItem("accessToken") } }
        );
        showMessage("User rejected successfully", "success");
      } else if (action === "lock") {
        await axios.put(`http://localhost:3001/users/${userId}/lock`, 
          { lockRemarks: "User locked by administrator" },
          { headers: { accessToken: localStorage.getItem("accessToken") } }
        );
        showMessage("User locked successfully", "success");
      } else if (action === "unlock") {
        await axios.put(`http://localhost:3001/users/${userId}/lock`, 
          { lockRemarks: "User unlocked by administrator" },
          { headers: { accessToken: localStorage.getItem("accessToken") } }
        );
        showMessage("User unlocked successfully", "success");
      } else if (action === "resend-email") {
        const response = await axios.post(`http://localhost:3001/users/${userId}/resend-email`, 
          {},
          { headers: { accessToken: localStorage.getItem("accessToken") } }
        );
        const message = response.data.emailSent 
          ? "Password setup email resent successfully" 
          : "Email could not be sent - please check email configuration";
        showMessage(message, response.data.emailSent ? "success" : "error");
        return; // Don't reload for email resend
      }
      // Refresh the list
      window.location.reload();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || `Failed to ${action} user`;
      showMessage(msg, "error");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return { bg: "rgba(16, 185, 129, 0.2)", color: "#059669", border: "rgba(16, 185, 129, 0.3)" };
      case "Inactive":
        return { bg: "rgba(239, 68, 68, 0.2)", color: "#dc2626", border: "rgba(239, 68, 68, 0.3)" };
      case "Pending":
        return { bg: "rgba(245, 158, 11, 0.2)", color: "#d97706", border: "rgba(245, 158, 11, 0.3)" };
      case "Pending Password":
        return { bg: "rgba(59, 130, 246, 0.2)", color: "#2563eb", border: "rgba(59, 130, 246, 0.3)" };
      case "Locked":
        return { bg: "rgba(107, 114, 128, 0.2)", color: "#6b7280", border: "rgba(107, 114, 128, 0.3)" };
      default:
        return { bg: "rgba(107, 114, 128, 0.2)", color: "#6b7280", border: "rgba(107, 114, 128, 0.3)" };
    }
  };

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      const aVal = a[sortField] || "";
      const bVal = b[sortField] || "";
      if (sortDirection === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }, [users, sortField, sortDirection]);

  // Pagination logic
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedUsers.slice(startIndex, endIndex);
  }, [sortedUsers, currentPage, itemsPerPage]);

  const isAllSelected = selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0;
  const isIndeterminate = selectedUsers.length > 0 && selectedUsers.length < paginatedUsers.length;

  return (
    <DashboardWrapper>
      <header className="header">
        <div className="header__left">
          <div className="greeting">User Maintenance</div>
        </div>
      </header>

      <main className="dashboard__content">
        {/* Summary Cards */}
        <section className="cards cards--status">
          <div className="card card--active">
            <div className="card__icon">
              <FiCheckCircle />
            </div>
            <div className="card__content">
              <h4>Active</h4>
              <div className="card__kpi">{counts.active}</div>
            </div>
          </div>
          <div className="card card--pending">
            <div className="card__icon">
              <FiClock />
            </div>
            <div className="card__content">
              <h4>Pending</h4>
              <div className="card__kpi">{counts.pending}</div>
            </div>
          </div>
          <div className="card card--pending-password">
            <div className="card__icon">
              <FiMail />
            </div>
            <div className="card__content">
              <h4>Pending Password</h4>
              <div className="card__kpi">{counts.pendingPassword}</div>
            </div>
          </div>
          <div className="card card--inactive">
            <div className="card__icon">
              <FiXCircle />
            </div>
            <div className="card__content">
              <h4>Inactive</h4>
              <div className="card__kpi">{counts.inactive}</div>
            </div>
          </div>
          <div className="card card--locked">
            <div className="card__icon">
              <FiLock />
            </div>
            <div className="card__content">
              <h4>Locked</h4>
              <div className="card__kpi">{counts.locked}</div>
            </div>
          </div>
        </section>

        <section className="card" style={{ padding: 12 }}>
          <div className="tableToolbar">
            <select className="statusSelect" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Pending Password">Pending Password</option>
              <option value="Inactive">Inactive</option>
              <option value="Locked">Locked</option>
            </select>


            <div className="searchWrapper">
              <input className="searchInput" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." />
              <span className="searchIcon">🔍</span>
            </div>

            <button 
              className="pill" 
              onClick={() => history.push("/user-form/new")}
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
              title="Add User"
            >
              <FaPlus />
              Add User
            </button>

            {/* Batch Action Buttons */}
            {showBatchActions && (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "14px", color: "var(--muted-text)", marginRight: "8px" }}>
                  {selectedUsers.length} selected
                </span>
                <button 
                  className="pill" 
                  onClick={() => handleBatchAction("approve")}
                  disabled={!canTransitionToStatus("Active")}
                  style={{
                    backgroundColor: !canTransitionToStatus("Active") ? "#9ca3af" : "#10b981",
                    color: "white",
                    border: "none",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: !canTransitionToStatus("Active") ? "not-allowed" : "pointer",
                    opacity: !canTransitionToStatus("Active") ? 0.6 : 1
                  }}
                >
                  Activate
                </button>
                <button 
                  className="pill" 
                  onClick={() => handleBatchAction("inactive")}
                  disabled={!canTransitionToStatus("Inactive")}
                  style={{
                    backgroundColor: !canTransitionToStatus("Inactive") ? "#9ca3af" : "#ef4444",
                    color: "white",
                    border: "none",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: !canTransitionToStatus("Inactive") ? "not-allowed" : "pointer",
                    opacity: !canTransitionToStatus("Inactive") ? 0.6 : 1
                  }}
                >
                  Deactivate
                </button>
                {/* <button 
                  className="pill" 
                  onClick={() => handleBatchAction("reject")}
                  disabled={!canTransitionToStatus("Inactive")}
                  style={{
                    backgroundColor: !canTransitionToStatus("Inactive") ? "#9ca3af" : "#dc2626",
                    color: "white",
                    border: "none",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: !canTransitionToStatus("Inactive") ? "not-allowed" : "pointer",
                    opacity: !canTransitionToStatus("Inactive") ? 0.6 : 1
                  }}
                >
                  Reject
                </button> */}
                <button 
                  className="pill" 
                  onClick={() => handleBatchAction("lock")}
                  disabled={!canTransitionToStatus("Locked")}
                  style={{
                    backgroundColor: !canTransitionToStatus("Locked") ? "#9ca3af" : "#6b7280",
                    color: "white",
                    border: "none",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: !canTransitionToStatus("Locked") ? "not-allowed" : "pointer",
                    opacity: !canTransitionToStatus("Locked") ? 0.6 : 1
                  }}
                >
                  Lock
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
                  <th>User ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => {
                  const statusColors = getStatusColor(user.status);
                  return (
                    <tr key={user.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={(e) => handleSelectUser(user.id, e.target.checked)}
                          style={{ cursor: "pointer" }}
                        />
                      </td>
                      <td>{user.userId}</td>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>{user.firstName} {user.lastName}</td>
                      <td>{user.role}</td>
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
                            backgroundColor: statusColors.bg,
                            color: statusColors.color,
                            border: `1px solid ${statusColors.border}`
                          }}
                        >
                          {user.status}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "4px" }}>
                          <button
                            className="action-btn action-btn--view"
                            onClick={() => history.push(`/user-form/${user.id}`)}
                            title="View"
                          >
                            <FiEye />
                          </button>
                          <button
                            className="action-btn action-btn--edit"
                            onClick={() => history.push(`/user-form/${user.id}?edit=1`)}
                            title="Edit"
                          >
                            <FiEdit3 />
                          </button>
                          {(user.status === "Pending Password" || user.status === "Active") && (
                            <button
                              className="action-btn"
                              onClick={() => handleSingleAction(user.id, "resend-email")}
                              title="Resend Email"
                              style={{ background: "#e0f2fe", color: "#0277bd" }}
                            >
                              <FiMail />
                            </button>
                          )}
                          {user.status === "Locked" ? (
                            <button
                              className="action-btn"
                              onClick={() => handleSingleAction(user.id, "unlock")}
                              title="Unlock"
                              style={{ background: "#e8f5e8", color: "#059669" }}
                            >
                              <FiUnlock />
                            </button>
                          ) : (
                            <button
                              className="action-btn"
                              onClick={() => handleSingleAction(user.id, "lock")}
                              title="Lock"
                              style={{ background: "#f3f4f6", color: "#6b7280" }}
                            >
                              <FiLock />
                            </button>
                          )}
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
            totalItems={sortedUsers.length}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </section>

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
                You are about to {statusAction === "approve" ? "Activate" : 
                                 statusAction === "reject" ? "Reject" : 
                                 statusAction === "inactive" ? "Deactivate" :
                                 statusAction === "lock" ? "Lock" : statusAction} {selectedUsers.length} {selectedUsers.length === 1 ? 'user' : 'users'}.
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
                  onClick={executeBatchAction}
                  style={{
                    padding: "8px 16px",
                    fontSize: "14px",
                    backgroundColor: 
                      statusAction === "approve" ? "#10b981" :
                      statusAction === "reject" ? "#ef4444" :
                      statusAction === "inactive" ? "#ef4444" :
                      statusAction === "lock" ? "#6b7280" :
                      "var(--primary-500)",
                    color: "white"
                  }}
                >
                  {statusAction === "approve" ? "Activate" : 
                   statusAction === "reject" ? "Reject" : 
                   statusAction === "inactive" ? "Deactivate" :
                   statusAction === "lock" ? "Lock" : statusAction}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </DashboardWrapper>
  );
}

export default UserMaintenance;
