import React, { useContext, useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import axios from "axios";
import { FiEye, FiEdit3, FiTrash2, FiCheckCircle, FiClock, FiRotateCcw } from "react-icons/fi";
import { FaPlus } from 'react-icons/fa';
import DashboardWrapper from '../components/DashboardWrapper';
import Pagination from '../components/Pagination';
import { useSnackbar } from "../helpers/SnackbarContext";
import { AuthContext } from "../helpers/AuthContext";

function RoleMaintenance() {
  const history = useHistory();
  const { authState, isLoading } = useContext(AuthContext);
  const { showMessage } = useSnackbar();

  useEffect(() => {
    // Only redirect if authentication check is complete and user is not authenticated
    if (!isLoading && !authState.status) {
      history.push("/login");
    }
  }, [authState, isLoading, history]);

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch roles from API
  useEffect(() => {
    const controller = new AbortController();
    const fetchRoles = async () => {
      try {
        setLoading(true);
        const response = await axios.get("http://localhost:3001/roles", {
          headers: { accessToken: localStorage.getItem("accessToken") },
          signal: controller.signal
        });
        setRoles(response.data.entity || []);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error("Error fetching roles:", error);
          showMessage("Failed to fetch roles", "error");
        }
      } finally {
        setLoading(false);
      }
    };

    if (authState.status) {
      fetchRoles();
    }

    return () => controller.abort();
  }, [authState.status, showMessage]);

  const counts = useMemo(() => {
    const list = Array.isArray(roles) ? roles : [];
    const c = { Active: 0, Inactive: 0 };
    for (const role of list) {
      if (role.status && c[role.status] !== undefined) c[role.status] += 1;
    }
    return c;
  }, [roles]);

  const filteredRoles = useMemo(() => {
    let filtered = Array.isArray(roles) ? roles : [];
    
    // Filter by status
    if (statusFilter) {
      filtered = filtered.filter(role => role.status === statusFilter);
    }
    
    // Filter by search
    if (search) {
      filtered = filtered.filter(role =>
        role.roleId?.toLowerCase().includes(search.toLowerCase()) ||
        role.roleName?.toLowerCase().includes(search.toLowerCase()) ||
        role.description?.toLowerCase().includes(search.toLowerCase()) ||
        role.status?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    return filtered;
  }, [roles, search, statusFilter]);

  // Pagination logic
  const paginatedRoles = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredRoles.slice(startIndex, endIndex);
  }, [filteredRoles, currentPage, itemsPerPage]);

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSelectedRoles([]); // Clear selection when changing pages
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
    setSelectedRoles([]); // Clear selection
  };

  const isAllSelected = selectedRoles.length === paginatedRoles.length && paginatedRoles.length > 0;
  const isIndeterminate = selectedRoles.length > 0 && selectedRoles.length < paginatedRoles.length;

  const handleSelectRole = (roleId, checked) => {
    if (checked) {
      setSelectedRoles(prev => [...prev, roleId]);
    } else {
      setSelectedRoles(prev => prev.filter(id => id !== roleId));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedRoles(paginatedRoles.map(role => role.id));
    } else {
      setSelectedRoles([]);
    }
  };

  useEffect(() => {
    setShowBatchActions(selectedRoles.length > 0);
  }, [selectedRoles]);

  const handleDelete = async (roleId) => {
    if (window.confirm("Are you sure you want to delete this role?")) {
      try {
        await axios.delete(`http://localhost:3001/roles/${roleId}`, {
          headers: { accessToken: localStorage.getItem("accessToken") }
        });
        setRoles(prev => prev.filter(role => role.id !== roleId));
        showMessage("Role deleted successfully", "success");
      } catch (err) {
        console.error("Error deleting role:", err);
        showMessage("Failed to delete role", "error");
      }
    }
  };

  const handleBatchDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedRoles.length} role(s)?`)) {
      try {
        // Delete each role individually
        for (const roleId of selectedRoles) {
          await axios.delete(`http://localhost:3001/roles/${roleId}`, {
            headers: { accessToken: localStorage.getItem("accessToken") }
          });
        }
        setRoles(prev => prev.filter(role => !selectedRoles.includes(role.id)));
        showMessage(`${selectedRoles.length} role(s) deleted successfully`, "success");
        setSelectedRoles([]);
      } catch (err) {
        console.error("Error deleting roles:", err);
        showMessage("Failed to delete roles", "error");
      }
    }
  };

  return (
    <DashboardWrapper>
      <header className="header">
        <div className="header__left">
          <div className="greeting">Role Maintenance</div>
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
              <h4>Inactive</h4>
              <div className="card__kpi">{counts.Inactive}</div>
            </div>
          </div>
          <div className="card card--returned">
            <div className="card__icon">
              <FiRotateCcw />
            </div>
            <div className="card__content">
              <h4>Total</h4>
              <div className="card__kpi">{roles.length}</div>
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
              <input className="searchInput" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search roles..." />
              <span className="searchIcon">🔍</span>
            </div>

            <button 
              className="pill" 
              onClick={() => history.push("/role-form/new")}
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
              title="Add Role"
            >
              <FaPlus />
              Add Role
            </button>

            {/* Batch Action Buttons */}
            {showBatchActions && (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "14px", color: "var(--muted-text)", marginRight: "8px" }}>
                  {selectedRoles.length} selected
                </span>
                <button 
                  className="pill" 
                  onClick={handleBatchDelete}
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
                  Delete Selected
                </button>
              </div>
            )}

          </div>

          <div className="tableContainer">
            {loading ? (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
                Loading roles...
              </div>
            ) : (
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
                    <th>Role ID</th>
                    <th>Role Name</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th className="actions-column">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRoles.map(role => (
                  <tr key={role.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedRoles.includes(role.id)}
                        onChange={(e) => handleSelectRole(role.id, e.target.checked)}
                        style={{ cursor: "pointer" }}
                      />
                    </td>
                    <td>{role.roleId}</td>
                    <td>{role.roleName}</td>
                    <td>{role.description}</td>
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
                            role.status === "Active" ? "rgba(16, 185, 129, 0.2)" :
                            "rgba(107, 114, 128, 0.2)",
                          color: 
                            role.status === "Active" ? "#059669" :
                            "#6b7280",
                          border: `1px solid ${
                            role.status === "Active" ? "rgba(16, 185, 129, 0.3)" :
                            "rgba(107, 114, 128, 0.3)"
                          }`
                        }}
                      >
                        {role.status}
                      </div>
                    </td>
                    <td className="actions-column">
                      <div className="actions">
                        <button
                          className="action-btn action-btn--view"
                          onClick={() => history.push(`/role-form/${role.id}`)}
                          title="View"
                        >
                          <FiEye />
                        </button>
                        <button
                          className="action-btn action-btn--edit"
                          onClick={() => history.push(`/role-form/${role.id}?edit=1`)}
                          title="Edit"
                        >
                          <FiEdit3 />
                        </button>
                        <button
                          className="action-btn action-btn--delete"
                          onClick={() => handleDelete(role.id)}
                          title="Delete"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={filteredRoles.length}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </section>
      </main>
    </DashboardWrapper>
  );
}

export default RoleMaintenance;
