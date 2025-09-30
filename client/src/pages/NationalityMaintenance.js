import React, { useContext, useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import axios from "axios";
import { FiEye, FiEdit3, FiTrash2, FiCheckCircle, FiXCircle } from "react-icons/fi";
import { FaPlus } from 'react-icons/fa';
import DashboardWrapper from '../components/DashboardWrapper';
import Pagination from '../components/Pagination';
import { useSnackbar } from "../helpers/SnackbarContext";
import { AuthContext } from "../helpers/AuthContext";

function NationalityMaintenance() {
  const history = useHistory();
  const { authState, isLoading } = useContext(AuthContext);
  const { showMessage } = useSnackbar();

  useEffect(() => {
    // Only redirect if authentication check is complete and user is not authenticated
    if (!isLoading && !authState.status) {
      history.push("/login");
    }
  }, [authState, isLoading, history]);

  const [nationalities, setNationalities] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedNationalities, setSelectedNationalities] = useState([]);
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState("");
  const [verifierRemarks, setVerifierRemarks] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const controller = new AbortController();
    const fetchNationalities = async () => {
      try {
        const params = {};
        if (statusFilter) params.status = statusFilter;
        if (search) params.q = search;
        const res = await axios.get("http://localhost:3001/nationality", {
          headers: { accessToken: localStorage.getItem("accessToken") },
          params,
          signal: controller.signal,
        });
        const payload = res?.data?.entity ?? res?.data;
        setNationalities(Array.isArray(payload) ? payload : []);
      } catch {}
    };
    fetchNationalities();
    return () => controller.abort();
  }, [statusFilter, search]);

  const counts = useMemo(() => {
    const list = Array.isArray(nationalities) ? nationalities : [];
    const c = { Active: 0, Inactive: 0 };
    for (const c of list) {
      if (c.status && c[c.status] !== undefined) c[c.status] += 1;
    }
    return c;
  }, [nationalities]);

  // Pagination logic
  const paginatedNationalities = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return nationalities.slice(startIndex, endIndex);
  }, [nationalities, currentPage, itemsPerPage]);

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSelectedNationalities([]); // Clear selection when changing pages
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
    setSelectedNationalities([]); // Clear selection
  };

  // Selection functions
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedNationalities(paginatedNationalities.map(n => n.id));
    } else {
      setSelectedNationalities([]);
    }
  };

  const handleSelectNationality = (nationalityId, checked) => {
    if (checked) {
      setSelectedNationalities(prev => [...prev, nationalityId]);
    } else {
      setSelectedNationalities(prev => prev.filter(id => id !== nationalityId));
    }
  };

  const isAllSelected = selectedNationalities.length === paginatedNationalities.length && paginatedNationalities.length > 0;
  const isIndeterminate = selectedNationalities.length > 0 && selectedNationalities.length < paginatedNationalities.length;

  // Show/hide batch actions based on selection
  useEffect(() => {
    setShowBatchActions(selectedNationalities.length > 0);
  }, [selectedNationalities]);

  // Status change functions
  const handleStatusChange = (action) => {
    setStatusAction(action);
    setShowStatusModal(true);
  };

  const confirmStatusChange = async () => {
    try {
      const promises = selectedNationalities.map(nationalityId => 
        axios.put(`http://localhost:3001/nationality/${nationalityId}`, {
          status: statusAction,
          verifierRemarks: verifierRemarks
        }, { 
          headers: { accessToken: localStorage.getItem("accessToken") } 
        })
      );
      
      await Promise.all(promises);
      
      // Update local state
      setNationalities(prev => prev.map(nationality => 
        selectedNationalities.includes(nationality.id) 
          ? { ...nationality, status: statusAction, verifierRemarks: verifierRemarks }
          : nationality
      ));
      
      showMessage(`${statusAction} ${selectedNationalities.length} nationality(ies) successfully`, "success");
      setSelectedNationalities([]);
      setShowStatusModal(false);
      setVerifierRemarks("");
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to update nationality status";
      showMessage(msg, "error");
    }
  };

  return (
    <DashboardWrapper>
      <header className="header">
        <div className="header__left">
          <div className="greeting">Nationality Maintenance</div>
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
              <input className="searchInput" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search nationalities..." />
              <span className="searchIcon">🔍</span>
            </div>

            <button 
              className="pill" 
              onClick={() => history.push("/nationality/new")}
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
              title="Add Nationality"
            >
              <FaPlus />
              Add Nationality
            </button>

            {/* Batch Action Buttons */}
            {showBatchActions && (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "14px", color: "var(--muted-text)", marginRight: "8px" }}>
                  {selectedNationalities.length} selected
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
                  <th>Nationality ID</th>
                  <th>Nationality Name</th>
                  <th>ISO Code</th>
                  <th>Country Code</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedNationalities.map(n => (
                  <tr key={n.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedNationalities.includes(n.id)}
                        onChange={(e) => handleSelectNationality(n.id, e.target.checked)}
                        style={{ cursor: "pointer" }}
                      />
                    </td>
                    <td>{n.nationalityId}</td>
                    <td>{n.nationalityName}</td>
                    <td>{n.isoCode || "-"}</td>
                    <td>{n.countryCode || "-"}</td>
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
                            n.status === "Active" ? "rgba(16, 185, 129, 0.2)" :
                            n.status === "Inactive" ? "rgba(239, 68, 68, 0.2)" :
                            "rgba(107, 114, 128, 0.2)",
                          color: 
                            n.status === "Active" ? "#059669" :
                            n.status === "Inactive" ? "#dc2626" :
                            "#6b7280",
                          border: `1px solid ${
                            n.status === "Active" ? "rgba(16, 185, 129, 0.3)" :
                            n.status === "Inactive" ? "rgba(239, 68, 68, 0.3)" :
                            "rgba(107, 114, 128, 0.3)"
                          }`
                        }}
                      >
                        {n.status}
                      </div>
                    </td>
                    <td className="actions">
                      <button className="action-btn action-btn--view" onClick={() => history.push(`/nationality/${n.id}`)} title="View">
                        <FiEye />
                      </button>
                      <button className="action-btn action-btn--edit" onClick={() => history.push(`/nationality/${n.id}?edit=1`)} title="Update">
                        <FiEdit3 />
                      </button>
                      <button className="action-btn action-btn--delete" onClick={async () => {
                        try {
                          await axios.delete(`http://localhost:3001/nationality/${n.id}`, { headers: { accessToken: localStorage.getItem("accessToken") } });
                          setNationalities(curr => curr.filter(x => x.id !== n.id));
                          showMessage("Nationality deleted successfully", "success");
                        } catch (err) {
                          const msg = err?.response?.data?.error || "Failed to delete nationality";
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
            totalItems={nationalities.length}
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
              You are about to {statusAction} {selectedNationalities.length} {selectedNationalities.length === 1 ? 'nationality' : 'nationalities'}.
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

export default NationalityMaintenance;
