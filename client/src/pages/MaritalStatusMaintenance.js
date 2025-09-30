import React, { useContext, useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import axios from "axios";
import { FiEye, FiEdit3, FiTrash2, FiCheckCircle, FiXCircle } from "react-icons/fi";
import { FaPlus } from 'react-icons/fa';
import DashboardWrapper from '../components/DashboardWrapper';
import Pagination from '../components/Pagination';
import { useSnackbar } from "../helpers/SnackbarContext";
import { AuthContext } from "../helpers/AuthContext";

function MaritalStatusMaintenance() {
  const history = useHistory();
  const { authState, isLoading } = useContext(AuthContext);
  const { showMessage } = useSnackbar();

  useEffect(() => {
    // Only redirect if authentication check is complete and user is not authenticated
    if (!isLoading && !authState.status) {
      history.push("/login");
    }
  }, [authState, isLoading, history]);

  const [maritalStatuses, setMaritalStatuses] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedMaritalStatuses, setSelectedMaritalStatuses] = useState([]);
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState("");
  const [verifierRemarks, setVerifierRemarks] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const controller = new AbortController();
    const fetchMaritalStatuses = async () => {
      try {
        const params = {};
        if (statusFilter) params.status = statusFilter;
        if (search) params.q = search;
        const res = await axios.get("http://localhost:3001/marital-status", {
          headers: { accessToken: localStorage.getItem("accessToken") },
          params,
          signal: controller.signal,
        });
        const payload = res?.data?.entity ?? res?.data;
        setMaritalStatuses(Array.isArray(payload) ? payload : []);
      } catch {}
    };
    fetchMaritalStatuses();
    return () => controller.abort();
  }, [statusFilter, search]);

  const counts = useMemo(() => {
    const list = Array.isArray(maritalStatuses) ? maritalStatuses : [];
    const c = { Active: 0, Inactive: 0 };
    for (const c of list) {
      if (c.status && c[c.status] !== undefined) c[c.status] += 1;
    }
    return c;
  }, [maritalStatuses]);

  // Pagination logic
  const paginatedMaritalStatuses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return maritalStatuses.slice(startIndex, endIndex);
  }, [maritalStatuses, currentPage, itemsPerPage]);

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSelectedMaritalStatuses([]); // Clear selection when changing pages
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
    setSelectedMaritalStatuses([]); // Clear selection
  };

  // Selection functions
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedMaritalStatuses(paginatedMaritalStatuses.map(c => c.id));
    } else {
      setSelectedMaritalStatuses([]);
    }
  };

  const handleSelectMaritalStatus = (maritalStatusId, checked) => {
    if (checked) {
      setSelectedMaritalStatuses(prev => [...prev, maritalStatusId]);
    } else {
      setSelectedMaritalStatuses(prev => prev.filter(id => id !== maritalStatusId));
    }
  };

  const isAllSelected = selectedMaritalStatuses.length === paginatedMaritalStatuses.length && paginatedMaritalStatuses.length > 0;
  const isIndeterminate = selectedMaritalStatuses.length > 0 && selectedMaritalStatuses.length < paginatedMaritalStatuses.length;

  // Show/hide batch actions based on selection
  useEffect(() => {
    setShowBatchActions(selectedMaritalStatuses.length > 0);
  }, [selectedMaritalStatuses]);

  // Status change functions
  const handleStatusChange = (action) => {
    setStatusAction(action);
    setShowStatusModal(true);
  };

  const confirmStatusChange = async () => {
    try {
      const promises = selectedMaritalStatuses.map(maritalStatusId => 
        axios.put(`http://localhost:3001/marital-status/${maritalStatusId}`, {
          status: statusAction,
          verifierRemarks: verifierRemarks
        }, { 
          headers: { accessToken: localStorage.getItem("accessToken") } 
        })
      );
      
      await Promise.all(promises);
      
      // Update local state
      setMaritalStatuses(prev => prev.map(maritalStatus => 
        selectedMaritalStatuses.includes(maritalStatus.id) 
          ? { ...maritalStatus, status: statusAction, verifierRemarks: verifierRemarks }
          : maritalStatus
      ));
      
      showMessage(`${statusAction} ${selectedMaritalStatuses.length} marital status(es) successfully`, "success");
      setSelectedMaritalStatuses([]);
      setShowStatusModal(false);
      setVerifierRemarks("");
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to update marital status";
      showMessage(msg, "error");
    }
  };

  return (
    <DashboardWrapper>
      <header className="header">
        <div className="header__left">
          <div className="greeting">Marital Status Maintenance</div>
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
              <input className="searchInput" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search marital statuses..." />
              <span className="searchIcon">🔍</span>
            </div>

            <button 
              className="pill" 
              onClick={() => history.push("/marital-status-form/new")}
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
              title="Add Marital Status"
            >
              <FaPlus />
              Add Marital Status
            </button>

            {/* Batch Action Buttons */}
            {showBatchActions && (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "14px", color: "var(--muted-text)", marginRight: "8px" }}>
                  {selectedMaritalStatuses.length} selected
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
                  <th>Marital Status ID</th>
                  <th>Marital Status Name</th>
                  <th>Code</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMaritalStatuses.map(c => (
                  <tr key={c.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedMaritalStatuses.includes(c.id)}
                        onChange={(e) => handleSelectMaritalStatus(c.id, e.target.checked)}
                        style={{ cursor: "pointer" }}
                      />
                    </td>
                    <td>{c.maritalStatusId}</td>
                    <td>{c.maritalStatusName}</td>
                    <td>{c.maritalStatusCode || '-'}</td>
                    <td>{c.description || '-'}</td>
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
                            c.status === "Active" ? "rgba(16, 185, 129, 0.2)" :
                            c.status === "Inactive" ? "rgba(239, 68, 68, 0.2)" :
                            "rgba(107, 114, 128, 0.2)",
                          color: 
                            c.status === "Active" ? "#059669" :
                            c.status === "Inactive" ? "#dc2626" :
                            "#6b7280",
                          border: `1px solid ${
                            c.status === "Active" ? "rgba(16, 185, 129, 0.3)" :
                            c.status === "Inactive" ? "rgba(239, 68, 68, 0.3)" :
                            "rgba(107, 114, 128, 0.3)"
                          }`
                        }}
                      >
                        {c.status}
                      </div>
                    </td>
                    <td className="actions">
                      <button className="action-btn action-btn--view" onClick={() => history.push(`/marital-status-form/${c.id}`)} title="View">
                        <FiEye />
                      </button>
                      <button className="action-btn action-btn--edit" onClick={() => history.push(`/marital-status-form/${c.id}?edit=1`)} title="Update">
                        <FiEdit3 />
                      </button>
                      <button className="action-btn action-btn--delete" onClick={async () => {
                        try {
                          await axios.delete(`http://localhost:3001/marital-status/${c.id}`, { headers: { accessToken: localStorage.getItem("accessToken") } });
                          setMaritalStatuses(curr => curr.filter(x => x.id !== c.id));
                          showMessage("Marital status deleted successfully", "success");
                        } catch (err) {
                          const msg = err?.response?.data?.error || "Failed to delete marital status";
                          showMessage(msg, "error");
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
            totalItems={maritalStatuses.length}
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
              You are about to {statusAction} {selectedMaritalStatuses.length} {selectedMaritalStatuses.length === 1 ? 'marital status' : 'marital statuses'}.
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

export default MaritalStatusMaintenance;