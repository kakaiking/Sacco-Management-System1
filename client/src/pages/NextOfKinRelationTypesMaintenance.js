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

function NextOfKinRelationTypesMaintenance() {
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
      frontendLoggingService.logView("NextOfKinRelationTypes", null, null, "Viewed Next of Kin Relation Types Maintenance page");
    }
  }, [authState, isLoading, history]);

  const [nextOfKinRelationTypes, setNextOfKinRelationTypes] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedNextOfKinRelationTypes, setSelectedNextOfKinRelationTypes] = useState([]);
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState("");
  const [sortField] = useState("createdOn");
  const [sortDirection] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const controller = new AbortController();
    const fetchNextOfKinRelationTypes = async () => {
      try {
        const params = {};
        if (statusFilter) params.status = statusFilter;
        if (search) params.q = search;
        const res = await axios.get("http://localhost:3001/next-of-kin-relation-types", {
          headers: { accessToken: localStorage.getItem("accessToken") },
          params,
          signal: controller.signal,
        });
        const payload = res?.data?.entity ?? res?.data;
        setNextOfKinRelationTypes(Array.isArray(payload) ? payload : []);
      } catch {}
    };
    fetchNextOfKinRelationTypes();
    return () => controller.abort();
  }, [statusFilter, search]);

  const counts = useMemo(() => {
    const list = Array.isArray(nextOfKinRelationTypes) ? nextOfKinRelationTypes : [];
    const c = { Active: 0, Inactive: 0, Pending: 0 };
    for (const rt of list) {
      if (rt.status && c[rt.status] !== undefined) c[rt.status] += 1;
    }
    return c;
  }, [nextOfKinRelationTypes]);

  const sortedNextOfKinRelationTypes = useMemo(() => {
    const list = Array.isArray(nextOfKinRelationTypes) ? nextOfKinRelationTypes : [];
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
  }, [nextOfKinRelationTypes, sortField, sortDirection]);

  // Pagination logic
  const paginatedNextOfKinRelationTypes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedNextOfKinRelationTypes.slice(startIndex, endIndex);
  }, [sortedNextOfKinRelationTypes, currentPage, itemsPerPage]);

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSelectedNextOfKinRelationTypes([]); // Clear selection when changing pages
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
    setSelectedNextOfKinRelationTypes([]); // Clear selection
  };

  // Selection functions
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedNextOfKinRelationTypes(paginatedNextOfKinRelationTypes.map(rt => rt.id));
    } else {
      setSelectedNextOfKinRelationTypes([]);
    }
  };

  const handleSelectNextOfKinRelationType = (nextOfKinRelationTypeId, checked) => {
    if (checked) {
      setSelectedNextOfKinRelationTypes(prev => [...prev, nextOfKinRelationTypeId]);
    } else {
      setSelectedNextOfKinRelationTypes(prev => prev.filter(id => id !== nextOfKinRelationTypeId));
    }
  };

  const isAllSelected = selectedNextOfKinRelationTypes.length === paginatedNextOfKinRelationTypes.length && paginatedNextOfKinRelationTypes.length > 0;
  const isIndeterminate = selectedNextOfKinRelationTypes.length > 0 && selectedNextOfKinRelationTypes.length < paginatedNextOfKinRelationTypes.length;

  // Show/hide batch actions based on selection
  useEffect(() => {
    setShowBatchActions(selectedNextOfKinRelationTypes.length > 0);
  }, [selectedNextOfKinRelationTypes]);

  // Status change functions
  const handleStatusChange = (action) => {
    setStatusAction(action);
    setShowStatusModal(true);
  };

  const confirmStatusChange = async () => {
    try {
      // Get before data for logging
      const beforeData = selectedNextOfKinRelationTypes.map(nextOfKinRelationTypeId => {
        const nextOfKinRelationType = nextOfKinRelationTypes.find(rt => rt.id === nextOfKinRelationTypeId);
        return {
          id: nextOfKinRelationTypeId,
          relationTypeId: nextOfKinRelationType?.relationTypeId,
          relationTypeName: nextOfKinRelationType?.relationTypeName,
          status: nextOfKinRelationType?.status
        };
      });

      const promises = selectedNextOfKinRelationTypes.map(nextOfKinRelationTypeId => 
        axios.put(`http://localhost:3001/next-of-kin-relation-types/${nextOfKinRelationTypeId}/status`, {
          status: statusAction
        }, {
          headers: { accessToken: localStorage.getItem("accessToken") }
        })
      );
      
      await Promise.all(promises);
      
      // Prepare after data for logging
      const afterData = beforeData.map(nextOfKinRelationType => ({
        ...nextOfKinRelationType,
        status: statusAction
      }));

      // Log the update action with before/after data
      frontendLoggingService.logUpdate(
        "NextOfKinRelationTypes", 
        selectedNextOfKinRelationTypes.join(','), 
        `${selectedNextOfKinRelationTypes.length} next of kin relation types`, 
        beforeData, 
        afterData, 
        `Updated status to ${statusAction} for ${selectedNextOfKinRelationTypes.length} next of kin relation types`
      );
      
      // Update local state
      setNextOfKinRelationTypes(prev => prev.map(nextOfKinRelationType => 
        selectedNextOfKinRelationTypes.includes(nextOfKinRelationType.id) 
          ? { ...nextOfKinRelationType, status: statusAction }
          : nextOfKinRelationType
      ));
      
      showMessage(`${statusAction} ${selectedNextOfKinRelationTypes.length} next of kin relation type(s) successfully`, "success");
      setSelectedNextOfKinRelationTypes([]);
      setShowStatusModal(false);
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to update next of kin relation type status";
      showMessage(msg, "error");
    }
  };

  return (
    <DashboardWrapper>
      <header className="header">
        <div className="header__left">
          <div className="greeting">Next of Kin Relation Types Maintenance</div>
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
              frontendLoggingService.logFilter("Status", e.target.value, "NextOfKinRelationTypes", `Filtered next of kin relation types by status: ${e.target.value || 'All'}`);
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
                  frontendLoggingService.logSearch(e.target.value, "NextOfKinRelationTypes", null, `Searched for next of kin relation types: "${e.target.value}"`);
                }
                setSearch(e.target.value);
              }} placeholder="Search next of kin relation types..." />
              <span className="searchIcon">🔍</span>
            </div>

            {canAdd(PERMISSIONS.NEXT_OF_KIN_RELATION_TYPES_MAINTENANCE) ? (
              <button 
                className="pill" 
                onClick={() => {
                  frontendLoggingService.logButtonClick("Add Next of Kin Relation Type", "NextOfKinRelationTypes", null, "Clicked Add Next of Kin Relation Type button");
                  history.push("/next-of-kin-relation-types/new");
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
                title="Add Next of Kin Relation Type"
              >
                <FaPlus />
                Add Next of Kin Relation Type
              </button>
            ) : (
              <button 
                className="pill" 
                onClick={() => showMessage("Your role lacks permission to add next of kin relation types", "error")}
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
                title="Add Next of Kin Relation Type - No Permission"
                disabled
              >
                <FaPlus />
                Add Next of Kin Relation Type
              </button>
            )}

            {/* Batch Action Buttons */}
            {showBatchActions && canApprove(PERMISSIONS.NEXT_OF_KIN_RELATION_TYPES_MAINTENANCE) && (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "14px", color: "var(--muted-text)", marginRight: "8px" }}>
                  {selectedNextOfKinRelationTypes.length} selected
                </span>
                <button 
                  className="pill" 
                  onClick={() => {
                    frontendLoggingService.logButtonClick("Activate Next of Kin Relation Types", "NextOfKinRelationTypes", null, `Clicked Activate button for ${selectedNextOfKinRelationTypes.length} selected next of kin relation types`);
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
                    frontendLoggingService.logButtonClick("Deactivate Next of Kin Relation Types", "NextOfKinRelationTypes", null, `Clicked Deactivate button for ${selectedNextOfKinRelationTypes.length} selected next of kin relation types`);
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
                    Relation Type ID
                    {sortField === 'relationTypeId' && (
                      <span style={{ marginLeft: '8px', color: 'var(--primary-500)' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th>
                    Relation Type Name
                    {sortField === 'relationTypeName' && (
                      <span style={{ marginLeft: '8px', color: 'var(--primary-500)' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
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
                {paginatedNextOfKinRelationTypes.map(rt => (
                  <tr key={rt.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedNextOfKinRelationTypes.includes(rt.id)}
                        onChange={(e) => handleSelectNextOfKinRelationType(rt.id, e.target.checked)}
                        style={{ cursor: "pointer" }}
                      />
                    </td>
                    <td>{rt.relationTypeId}</td>
                    <td>{rt.relationTypeName}</td>
                    <td>{rt.description || '-'}</td>
                    <td>{rt.createdOn ? new Date(rt.createdOn).toLocaleDateString() : '-'}</td>
                    <td>{rt.createdBy || '-'}</td>
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
                            rt.status === "Active" ? "rgba(16, 185, 129, 0.2)" :
                            rt.status === "Pending" ? "rgba(6, 182, 212, 0.2)" :
                            rt.status === "Inactive" ? "rgba(239, 68, 68, 0.2)" :
                            "rgba(107, 114, 128, 0.2)",
                          color: 
                            rt.status === "Active" ? "#059669" :
                            rt.status === "Pending" ? "#0891b2" :
                            rt.status === "Inactive" ? "#dc2626" :
                            "#6b7280",
                          border: `1px solid ${
                            rt.status === "Active" ? "rgba(16, 185, 129, 0.3)" :
                            rt.status === "Pending" ? "rgba(6, 182, 212, 0.3)" :
                            rt.status === "Inactive" ? "rgba(239, 68, 68, 0.3)" :
                            "rgba(107, 114, 128, 0.3)"
                          }`
                        }}
                      >
                        {rt.status}
                      </div>
                    </td>
                    <td className="actions">
                      <button className="action-btn action-btn--view" onClick={() => {
                        frontendLoggingService.logView("NextOfKinRelationTypes", rt.id, rt.relationTypeName, "Viewed next of kin relation type details");
                        history.push(`/next-of-kin-relation-types/${rt.id}`);
                      }} title="View">
                        <FiEye />
                      </button>
                      {canEdit(PERMISSIONS.NEXT_OF_KIN_RELATION_TYPES_MAINTENANCE) ? (
                        <button className="action-btn action-btn--edit" onClick={() => {
                          frontendLoggingService.logButtonClick("Edit Next of Kin Relation Type", "NextOfKinRelationTypes", rt.id, `Clicked Edit button for next of kin relation type: ${rt.relationTypeName}`);
                          history.push(`/next-of-kin-relation-types/${rt.id}?edit=1`);
                        }} title="Update">
                          <FiEdit3 />
                        </button>
                      ) : (
                        <button 
                          className="action-btn action-btn--edit" 
                          onClick={() => showMessage("Your role lacks permission to edit next of kin relation types", "error")} 
                          title="Update - No Permission"
                          style={{ opacity: 0.5, cursor: "not-allowed" }}
                          disabled
                        >
                          <FiEdit3 />
                        </button>
                      )}
                      {canDelete(PERMISSIONS.NEXT_OF_KIN_RELATION_TYPES_MAINTENANCE) ? (
                        <button className="action-btn action-btn--delete" onClick={async () => {
                          try {
                            // Log the delete action with next of kin relation type data before deletion
                            frontendLoggingService.logDelete("NextOfKinRelationTypes", rt.id, rt.relationTypeName, {
                              relationTypeId: rt.relationTypeId,
                              relationTypeName: rt.relationTypeName,
                              status: rt.status
                            }, `Deleted next of kin relation type: ${rt.relationTypeName}`);
                            
                            await axios.delete(`http://localhost:3001/next-of-kin-relation-types/${rt.id}`, { headers: { accessToken: localStorage.getItem("accessToken") } });
                            setNextOfKinRelationTypes(curr => curr.filter(x => x.id !== rt.id));
                            showMessage("Next of kin relation type deleted successfully", "success");
                          } catch (err) {
                            const msg = err?.response?.data?.error || "Failed to delete next of kin relation type";
                            showMessage(msg, "error");
                          }
                        }} title="Delete">
                          <FiTrash2 />
                        </button>
                      ) : (
                        <button 
                          className="action-btn action-btn--delete" 
                          onClick={() => showMessage("Your role lacks permission to delete next of kin relation types", "error")} 
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
            totalItems={sortedNextOfKinRelationTypes.length}
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
              You are about to {statusAction === "Inactive" ? "Deactivate" : statusAction} {selectedNextOfKinRelationTypes.length} {selectedNextOfKinRelationTypes.length === 1 ? 'record' : 'records'}.
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

export default NextOfKinRelationTypesMaintenance;

