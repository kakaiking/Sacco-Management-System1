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

function MemberCategoriesMaintenance() {
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
      frontendLoggingService.logView("MemberCategories", null, null, "Viewed Member Categories Maintenance page");
    }
  }, [authState, isLoading, history]);

  const [memberCategories, setMemberCategories] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedMemberCategories, setSelectedMemberCategories] = useState([]);
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState("");
  const [sortField] = useState("createdOn");
  const [sortDirection] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const controller = new AbortController();
    const fetchMemberCategories = async () => {
      try {
        const params = {};
        if (statusFilter) params.status = statusFilter;
        if (search) params.q = search;
        const res = await axios.get("http://localhost:3001/member-categories", {
          headers: { accessToken: localStorage.getItem("accessToken") },
          params,
          signal: controller.signal
        });
        const payload = res?.data?.entity ?? res?.data;
        setMemberCategories(Array.isArray(payload) ? payload : []);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error("Error fetching member categories:", error);
          showMessage("Error fetching member categories", "error");
        }
      }
    };
    fetchMemberCategories();
    return () => controller.abort();
  }, [statusFilter, search, showMessage]);

  const counts = useMemo(() => {
    const list = Array.isArray(memberCategories) ? memberCategories : [];
    const c = { Active: 0, Inactive: 0, Pending: 0 };
    for (const mc of list) {
      if (mc.status && c[mc.status] !== undefined) c[mc.status] += 1;
    }
    return c;
  }, [memberCategories]);

  const sortedMemberCategories = useMemo(() => {
    const list = Array.isArray(memberCategories) ? memberCategories : [];
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
  }, [memberCategories, sortField, sortDirection]);

  // Pagination logic
  const paginatedMemberCategories = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedMemberCategories.slice(startIndex, endIndex);
  }, [sortedMemberCategories, currentPage, itemsPerPage]);

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSelectedMemberCategories([]); // Clear selection when changing pages
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
    setSelectedMemberCategories([]); // Clear selection
  };

  const handleSelectMemberCategory = (id, checked) => {
    if (checked) {
      setSelectedMemberCategories(prev => [...prev, id]);
    } else {
      setSelectedMemberCategories(prev => prev.filter(item => item !== id));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedMemberCategories(paginatedMemberCategories.map(mc => mc.id));
    } else {
      setSelectedMemberCategories([]);
    }
  };

  const isAllSelected = selectedMemberCategories.length === paginatedMemberCategories.length && paginatedMemberCategories.length > 0;
  const isIndeterminate = selectedMemberCategories.length > 0 && selectedMemberCategories.length < paginatedMemberCategories.length;

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this member category?")) {
      try {
        const res = await axios.delete(`http://localhost:3001/member-categories/${id}`, {
          headers: { accessToken: localStorage.getItem("accessToken") }
        });
        if (res.data.code === 200) {
          showMessage("Member category deleted successfully", "success");
          frontendLoggingService.logDelete("MemberCategories", id, "Member Category", null, `Deleted member category with ID: ${id}`);
          setMemberCategories(prev => prev.filter(mc => mc.id !== id));
        }
      } catch (error) {
        console.error("Error deleting member category:", error);
        showMessage("Error deleting member category", "error");
      }
    }
  };

  // Status change functions
  const handleStatusChange = (action) => {
    setStatusAction(action);
    setShowStatusModal(true);
  };

  const confirmStatusChange = async () => {
    try {
      // Get before data for logging
      const beforeData = selectedMemberCategories.map(memberCategoryId => {
        const memberCategory = memberCategories.find(mc => mc.id === memberCategoryId);
        return {
          id: memberCategoryId,
          memberCategoryId: memberCategory?.memberCategoryId,
          memberCategoryName: memberCategory?.memberCategoryName,
          status: memberCategory?.status
        };
      });

      const promises = selectedMemberCategories.map(memberCategoryId => 
        axios.put(`http://localhost:3001/member-categories/${memberCategoryId}/status`, {
          status: statusAction
        }, {
          headers: { accessToken: localStorage.getItem("accessToken") }
        })
      );
      
      await Promise.all(promises);
      
      // Prepare after data for logging
      const afterData = beforeData.map(memberCategory => ({
        ...memberCategory,
        status: statusAction
      }));

      // Log the update action with before/after data
      frontendLoggingService.logUpdate(
        "MemberCategories", 
        selectedMemberCategories.join(','), 
        `${selectedMemberCategories.length} member categories`, 
        beforeData, 
        afterData, 
        `Updated status to ${statusAction} for ${selectedMemberCategories.length} member categories`
      );
      
      // Update local state
      setMemberCategories(prev => prev.map(memberCategory => 
        selectedMemberCategories.includes(memberCategory.id) 
          ? { ...memberCategory, status: statusAction }
          : memberCategory
      ));
      
      showMessage(`${statusAction} ${selectedMemberCategories.length} member category(ies) successfully`, "success");
      setSelectedMemberCategories([]);
      setShowStatusModal(false);
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to update member category status";
      showMessage(msg, "error");
    }
  };

  // Show/hide batch actions based on selection
  useEffect(() => {
    setShowBatchActions(selectedMemberCategories.length > 0);
  }, [selectedMemberCategories]);

  return (
    <DashboardWrapper>
      <header className="header">
        <div className="header__left">
          <div className="greeting">Member Categories Maintenance</div>
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
              frontendLoggingService.logFilter("Status", e.target.value, "MemberCategories", `Filtered member categories by status: ${e.target.value || 'All'}`);
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
                  frontendLoggingService.logSearch(e.target.value, "MemberCategories", null, `Searched for member categories: "${e.target.value}"`);
                }
                setSearch(e.target.value);
              }} placeholder="Search member categories..." />
              <span className="searchIcon">🔍</span>
            </div>

            {canAdd(PERMISSIONS.MEMBER_CATEGORIES_MAINTENANCE) ? (
              <button 
                className="pill" 
                onClick={() => {
                  frontendLoggingService.logButtonClick("Add Member Category", "MemberCategories", null, "Clicked Add Member Category button");
                  history.push("/member-categories/new");
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
                title="Add Member Category"
              >
                <FaPlus />
                Add Member Category
              </button>
            ) : (
              <button 
                className="pill" 
                onClick={() => showMessage("Your role lacks permission to add member categories", "error")}
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
                title="Add Member Category - No Permission"
                disabled
              >
                <FaPlus />
                Add Member Category
              </button>
            )}

            {/* Batch Action Buttons */}
            {showBatchActions && canApprove(PERMISSIONS.MEMBER_CATEGORIES_MAINTENANCE) && (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "14px", color: "var(--muted-text)", marginRight: "8px" }}>
                  {selectedMemberCategories.length} selected
                </span>
                <button 
                  className="pill" 
                  onClick={() => {
                    frontendLoggingService.logButtonClick("Activate Member Categories", "MemberCategories", null, `Clicked Activate button for ${selectedMemberCategories.length} selected member categories`);
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
                    frontendLoggingService.logButtonClick("Deactivate Member Categories", "MemberCategories", null, `Clicked Deactivate button for ${selectedMemberCategories.length} selected member categories`);
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
                    Category ID
                    {sortField === 'memberCategoryId' && (
                      <span style={{ marginLeft: '8px', color: 'var(--primary-500)' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th>
                    Category Name
                    {sortField === 'memberCategoryName' && (
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
                {paginatedMemberCategories.map(mc => (
                  <tr key={mc.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedMemberCategories.includes(mc.id)}
                        onChange={(e) => handleSelectMemberCategory(mc.id, e.target.checked)}
                        style={{ cursor: "pointer" }}
                      />
                    </td>
                    <td>{mc.memberCategoryId}</td>
                    <td>{mc.memberCategoryName}</td>
                    <td>{mc.description || '-'}</td>
                    <td>{mc.createdOn ? new Date(mc.createdOn).toLocaleDateString() : '-'}</td>
                    <td>{mc.createdBy || '-'}</td>
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
                            mc.status === "Active" ? "rgba(16, 185, 129, 0.2)" :
                            mc.status === "Pending" ? "rgba(6, 182, 212, 0.2)" :
                            mc.status === "Inactive" ? "rgba(239, 68, 68, 0.2)" :
                            "rgba(107, 114, 128, 0.2)",
                          color: 
                            mc.status === "Active" ? "#059669" :
                            mc.status === "Pending" ? "#0891b2" :
                            mc.status === "Inactive" ? "#dc2626" :
                            "#6b7280",
                          border: `1px solid ${
                            mc.status === "Active" ? "rgba(16, 185, 129, 0.3)" :
                            mc.status === "Pending" ? "rgba(6, 182, 212, 0.3)" :
                            mc.status === "Inactive" ? "rgba(239, 68, 68, 0.3)" :
                            "rgba(107, 114, 128, 0.3)"
                          }`
                        }}
                      >
                        {mc.status}
                      </div>
                    </td>
                    <td className="actions">
                      <button className="action-btn action-btn--view" onClick={() => {
                        frontendLoggingService.logView("MemberCategories", mc.id, mc.memberCategoryName, "Viewed member category details");
                        history.push(`/member-categories/${mc.id}`);
                      }} title="View">
                        <FiEye />
                      </button>
                      {canEdit(PERMISSIONS.MEMBER_CATEGORIES_MAINTENANCE) ? (
                        <button className="action-btn action-btn--edit" onClick={() => {
                          frontendLoggingService.logButtonClick("Edit Member Category", "MemberCategories", mc.id, `Clicked Edit button for member category: ${mc.memberCategoryName}`);
                          history.push(`/member-categories/${mc.id}?edit=1`);
                        }} title="Update">
                          <FiEdit3 />
                        </button>
                      ) : (
                        <button 
                          className="action-btn action-btn--edit" 
                          onClick={() => showMessage("Your role lacks permission to edit member categories", "error")} 
                          title="Update - No Permission"
                          style={{ opacity: 0.5, cursor: "not-allowed" }}
                          disabled
                        >
                          <FiEdit3 />
                        </button>
                      )}
                      {canDelete(PERMISSIONS.MEMBER_CATEGORIES_MAINTENANCE) ? (
                        <button className="action-btn action-btn--delete" onClick={async () => {
                          try {
                            // Log the delete action with member category data before deletion
                            frontendLoggingService.logDelete("MemberCategories", mc.id, mc.memberCategoryName, {
                              memberCategoryId: mc.memberCategoryId,
                              memberCategoryName: mc.memberCategoryName,
                              status: mc.status
                            }, `Deleted member category: ${mc.memberCategoryName}`);
                            
                            await axios.delete(`http://localhost:3001/member-categories/${mc.id}`, { headers: { accessToken: localStorage.getItem("accessToken") } });
                            setMemberCategories(curr => curr.filter(x => x.id !== mc.id));
                            showMessage("Member category deleted successfully", "success");
                          } catch (err) {
                            const msg = err?.response?.data?.error || "Failed to delete member category";
                            showMessage(msg, "error");
                          }
                        }} title="Delete">
                          <FiTrash2 />
                        </button>
                      ) : (
                        <button 
                          className="action-btn action-btn--delete" 
                          onClick={() => showMessage("Your role lacks permission to delete member categories", "error")} 
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
            totalItems={sortedMemberCategories.length}
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
              You are about to {statusAction === "Inactive" ? "Deactivate" : statusAction} {selectedMemberCategories.length} {selectedMemberCategories.length === 1 ? 'record' : 'records'}.
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

export default MemberCategoriesMaintenance;


