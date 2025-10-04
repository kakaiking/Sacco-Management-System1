import React, { useContext, useEffect, useState } from "react";
import { useHistory, useParams, useLocation } from "react-router-dom";
import { FiArrowLeft, FiSearch, FiMoreVertical, FiRefreshCw, FiEdit3, FiTrash2 } from "react-icons/fi";
import axios from "axios";
import { useSnackbar } from "../helpers/SnackbarContext";
import { AuthContext } from "../helpers/AuthContext";
import DashboardWrapper from '../components/DashboardWrapper';
import BranchLookupModal from '../components/BranchLookupModal';

function BranchForm({ id: propId, isWindowMode = false }) {
  const history = useHistory();
  const { authState, isLoading } = useContext(AuthContext);
  const { id: paramId } = useParams();
  const { search } = useLocation();
  const { showMessage } = useSnackbar();
  
  // Use prop id if in window mode, otherwise use param id
  const id = isWindowMode ? propId : paramId;
  
  const isEdit = new URLSearchParams(search).get("edit") === "1";
  const isCreate = id === "new";
  const isViewingSpecificBranch = id && id !== "new";

  // Form mode state: 'create', 'view', 'edit'
  const [formMode, setFormMode] = useState(
    isCreate ? 'create' : 
    (isEdit ? 'edit' : 
    (isViewingSpecificBranch ? 'view' : 'create'))
  );
  
  // Update form mode when URL parameters change
  useEffect(() => {
    const newIsCreate = id === "new";
    const newIsEdit = new URLSearchParams(search).get("edit") === "1";
    const newIsViewingSpecificBranch = id && id !== "new";
    const newFormMode = newIsCreate ? 'create' : 
                       (newIsEdit ? 'edit' : 
                       (newIsViewingSpecificBranch ? 'view' : 'create'));
    setFormMode(newFormMode);
  }, [id, search]);
  
  // Actions dropdown state
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  
  // Modal states
  const [isBranchLookupModalOpen, setIsBranchLookupModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);

  const [form, setForm] = useState({
    branchId: "",
    saccoId: "",
    branchName: "",
    shortName: "",
    branchLocation: "",
    city: "",
    poBox: "",
    postalCode: "",
    phoneNumber: "",
    alternativePhone: "",
    branchCashLimit: "",
    status: "Active",
    createdBy: "",
    createdOn: "",
    modifiedBy: "",
    modifiedOn: "",
    approvedBy: "",
    approvedOn: "",
  });

  useEffect(() => {
    // Only redirect if authentication check is complete and user is not authenticated
    if (!isLoading && !authState.status) {
      if (!isWindowMode) {
        history.push("/login");
      }
    }
  }, [authState, isLoading, history, isWindowMode]);

  // Generate Branch ID for new branches
  const generateBranchId = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000); // 4 digits
    return `BR-${randomNum}`;
  };

  useEffect(() => {
    const load = async () => {
      if (!isCreate && !isWindowMode) {
        const res = await axios.get(`http://localhost:3001/branch/${id}`, {
          headers: { accessToken: localStorage.getItem("accessToken") },
        });
        const data = res.data?.entity || res.data;
        setForm({
          branchId: data.branchId || "",
          saccoId: data.saccoId || "",
          branchName: data.branchName || "",
          shortName: data.shortName || "",
          branchLocation: data.branchLocation || "",
          city: data.city || "",
          poBox: data.poBox || "",
          postalCode: data.postalCode || "",
          phoneNumber: data.phoneNumber || "",
          alternativePhone: data.alternativePhone || "",
          branchCashLimit: data.branchCashLimit || "",
          status: data.status || "Active",
          createdBy: data.createdBy || "",
          createdOn: data.createdOn || "",
          modifiedBy: data.modifiedBy || "",
          modifiedOn: data.modifiedOn || "",
          approvedBy: data.approvedBy || "",
          approvedOn: data.approvedOn || "",
        });
      } else if (isCreate) {
        // Generate Branch ID and set Sacco ID from authState for new branches
        setForm(prev => ({ 
          ...prev, 
          branchId: generateBranchId(),
          saccoId: authState.saccoId || ""
        }));
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isCreate]);

  // Close actions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const dropdown = document.querySelector('[data-actions-dropdown]');
      if (dropdown && !dropdown.contains(event.target)) {
        setShowActionsDropdown(false);
      }
    };

    if (showActionsDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showActionsDropdown]);

  // Handle branch selection from lookup
  const handleBranchSelect = async (branch) => {
    setSelectedBranch(branch);
    setForm({
      branchId: branch.branchId || "",
      saccoId: branch.saccoId || "",
      branchName: branch.branchName || "",
      shortName: branch.shortName || "",
      branchLocation: branch.branchLocation || "",
      city: branch.city || "",
      poBox: branch.poBox || "",
      postalCode: branch.postalCode || "",
      phoneNumber: branch.phoneNumber || "",
      alternativePhone: branch.alternativePhone || "",
      branchCashLimit: branch.branchCashLimit || "",
      status: branch.status || "Active",
      createdBy: branch.createdBy || "",
      createdOn: branch.createdOn || "",
      modifiedBy: branch.modifiedBy || "",
      modifiedOn: branch.modifiedOn || "",
      approvedBy: branch.approvedBy || "",
      approvedOn: branch.approvedOn || "",
    });
    setFormMode('view');
    setIsBranchLookupModalOpen(false);
    showMessage("Branch data loaded successfully", "success");
  };

  // Handle Clear Form
  const handleClearForm = () => {
    setForm({
      branchId: generateBranchId(),
      saccoId: authState.saccoId || "",
      branchName: "",
      shortName: "",
      branchLocation: "",
      city: "",
      poBox: "",
      postalCode: "",
      phoneNumber: "",
      alternativePhone: "",
      branchCashLimit: "",
      status: "Active",
      createdBy: "",
      createdOn: "",
      modifiedBy: "",
      modifiedOn: "",
      approvedBy: "",
      approvedOn: "",
    });
    setSelectedBranch(null);
    setFormMode('create');
    setShowActionsDropdown(false);
    showMessage("Form cleared successfully", "success");
  };

  // Handle Edit
  const handleEdit = () => {
    setFormMode('edit');
    setShowActionsDropdown(false);
    showMessage("Edit mode enabled", "info");
  };

  // Handle Delete
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this branch?")) {
      return;
    }
    try {
      const branchId = selectedBranch ? selectedBranch.id : id;
      await axios.delete(`http://localhost:3001/branch/${branchId}`, {
        headers: { accessToken: localStorage.getItem("accessToken") }
      });
      showMessage("Branch deleted successfully", "success");
      handleClearForm();
      if (!isWindowMode) {
        history.push("/branch-maintenance");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || "Failed to delete branch";
      showMessage(msg, "error");
    }
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      // Use sacco ID from authState
      const payload = { 
        ...form,
        saccoId: authState.saccoId 
      };
      if (formMode === 'create') {
        await axios.post("http://localhost:3001/branch", payload, { headers: { accessToken: localStorage.getItem("accessToken") } });
        showMessage("Branch created successfully", "success");
        // Reset form for next entry in window mode
        if (isWindowMode) {
          handleClearForm();
        } else {
          history.push("/branch-maintenance");
        }
      } else if (formMode === 'edit') {
        const branchId = selectedBranch ? selectedBranch.id : id;
        await axios.put(`http://localhost:3001/branch/${branchId}`, payload, { headers: { accessToken: localStorage.getItem("accessToken") } });
        showMessage("Branch updated successfully", "success");
        setFormMode('view');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || "Failed to save branch";
      showMessage(msg, "error");
    }
  };

  const content = (
    <>
      {!isWindowMode && (
        <header className="header">
          <div className="header__left">
            <button className="iconBtn" onClick={() => history.push("/branch-maintenance")} title="Back" aria-label="Back" style={{ marginRight: 8 }}>
              <FiArrowLeft className="icon" style={{ fontWeight: "bolder" }}/>
            </button>
            <div className="greeting">{isCreate ? "Add Branch" : (isEdit ? "Update Branch Details" : "View Branch Details")}</div>
          </div>
        </header>
      )}

      <main className={isWindowMode ? "" : "dashboard__content"} style={isWindowMode ? { width: '100%', height: '100%', overflow: 'auto', padding: '20px', boxSizing: 'border-box' } : {}}>
        <form className="card" onSubmit={save} style={{ display: "grid", gap: 12, padding: 16 }}>
          {/* Branch Lookup - Topmost Element */}
          <div style={{ marginBottom: "24px" }}>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: formMode === 'create' ? "1fr auto" : "1fr auto auto", 
              gap: "20px",
              marginBottom: "12px",
              alignItems: "center"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <label style={{ fontWeight: "600", color: "var(--primary-700)", minWidth: "80px" }}>
                  Branch
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                  <div className="combined-member-input" style={{ flex: 1 }}>
                    <div className="member-no-section">
                      {selectedBranch ? selectedBranch.branchId : "Select a branch"}
                    </div>
                    <div className="member-name-section">
                      {selectedBranch ? selectedBranch.branchName : ""}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="search-icon-external"
                    onClick={() => setIsBranchLookupModalOpen(true)}
                    title="Search branches"
                    disabled={formMode === 'view'}
                  >
                    <FiSearch />
                  </button>
                </div>
              </div>
              
              {/* Status Badge - Only show in view and edit modes */}
              {(formMode === 'view' || formMode === 'edit') && (
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
                      form.status === "Active" ? "rgba(16, 185, 129, 0.2)" :
                      form.status === "Inactive" ? "rgba(239, 68, 68, 0.2)" :
                      "rgba(107, 114, 128, 0.2)",
                    color: 
                      form.status === "Active" ? "#059669" :
                      form.status === "Inactive" ? "#dc2626" :
                      "#6b7280",
                    border: `1px solid ${
                      form.status === "Active" ? "rgba(16, 185, 129, 0.3)" :
                      form.status === "Inactive" ? "rgba(239, 68, 68, 0.3)" :
                      "rgba(107, 114, 128, 0.3)"
                    }`
                  }}
                >
                  {form.status || "Active"}
                </div>
              )}
              
              {/* Actions Button */}
              {formMode !== 'create' && (
                <div style={{ position: "relative" }} data-actions-dropdown>
                  <button
                    type="button"
                    className="pill"
                    onClick={() => setShowActionsDropdown(!showActionsDropdown)}
                    style={{
                      padding: "12px 16px",
                      fontSize: "14px",
                      fontWeight: "600",
                      backgroundColor: "var(--primary-500)",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      minWidth: "120px",
                      justifyContent: "center"
                    }}
                  >
                    <FiMoreVertical />
                    Actions
                  </button>
                  
                  {/* Actions Dropdown */}
                  {showActionsDropdown && (
                    <div style={{
                      position: "absolute",
                      top: "100%",
                      right: "0",
                      marginTop: "8px",
                      backgroundColor: "white",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                      zIndex: 1000,
                      minWidth: "200px",
                      overflow: "hidden"
                    }}>
                      <button
                        type="button"
                        onClick={handleClearForm}
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          border: "none",
                          backgroundColor: "transparent",
                          textAlign: "left",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          fontSize: "14px",
                          color: "var(--text-primary)",
                          transition: "background-color 0.2s ease"
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = "var(--surface-2)"}
                        onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                      >
                        <FiRefreshCw style={{ color: "var(--primary-600)" }} />
                        Clear Form
                      </button>
                      
                      {formMode === 'view' && (
                        <button
                          type="button"
                          onClick={handleEdit}
                          style={{
                            width: "100%",
                            padding: "12px 16px",
                            border: "none",
                            backgroundColor: "transparent",
                            textAlign: "left",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            fontSize: "14px",
                            color: "var(--text-primary)",
                            transition: "background-color 0.2s ease"
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = "var(--surface-2)"}
                          onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                        >
                          <FiEdit3 style={{ color: "#2563eb" }} />
                          Edit
                        </button>
                      )}
                      
                      <button
                        type="button"
                        onClick={handleDelete}
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          border: "none",
                          backgroundColor: "transparent",
                          textAlign: "left",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          fontSize: "14px",
                          color: "var(--text-primary)",
                          transition: "background-color 0.2s ease"
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = "#fee"}
                        onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                      >
                        <FiTrash2 style={{ color: "#dc2626" }} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div> 

          <div className="grid4">
            <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
              <span style={{ whiteSpace: 'nowrap' }}>
                <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Branch Name</span> <span style={{ color: '#ef4444' }}>*</span>
              </span>
              <input className="input" 
                value={form.branchName} 
                onChange={e => setForm({ ...form, branchName: e.target.value })} 
                required 
                disabled={formMode === 'view'} 
              />
            </label>
            <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
              <span style={{ whiteSpace: 'nowrap' }}>
                <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Short Name</span>
              </span>
              <input className="input" 
                value={form.shortName} 
                onChange={e => setForm({ ...form, shortName: e.target.value })} 
                disabled={formMode === 'view'} 
              />
            </label>
            <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
              <span style={{ whiteSpace: 'nowrap' }}>
                <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Branch Location</span>
              </span>
              <input className="input" 
                value={form.branchLocation} 
                onChange={e => setForm({ ...form, branchLocation: e.target.value })} 
                disabled={formMode === 'view'} 
              />
            </label>
            <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
              <span style={{ whiteSpace: 'nowrap' }}>
                <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>City</span>
              </span>
              <input className="input" 
                value={form.city} 
                onChange={e => setForm({ ...form, city: e.target.value })} 
                disabled={formMode === 'view'} 
              />
            </label>
            <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
              <span style={{ whiteSpace: 'nowrap' }}>
                <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>P.O. Box</span>
              </span>
              <input className="input" 
                value={form.poBox} 
                onChange={e => setForm({ ...form, poBox: e.target.value })} 
                disabled={formMode === 'view'} 
              />
            </label>
            <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
              <span style={{ whiteSpace: 'nowrap' }}>
                <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Postal Code</span>
              </span>
              <input className="input" 
                value={form.postalCode} 
                onChange={e => setForm({ ...form, postalCode: e.target.value })} 
                disabled={formMode === 'view'} 
              />
            </label>
            <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
              <span style={{ whiteSpace: 'nowrap' }}>
                <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Phone Number</span>
              </span>
              <input className="input" 
                type="tel"
                value={form.phoneNumber} 
                onChange={e => setForm({ ...form, phoneNumber: e.target.value })} 
                disabled={formMode === 'view'} 
              />
            </label>
            <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
              <span style={{ whiteSpace: 'nowrap' }}>
                <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Alternative Phone</span>
              </span>
              <input className="input" 
                type="tel"
                value={form.alternativePhone} 
                onChange={e => setForm({ ...form, alternativePhone: e.target.value })} 
                disabled={formMode === 'view'} 
              />
            </label>
            <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
              <span style={{ whiteSpace: 'nowrap' }}>
                <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Branch Cash Limit</span>
              </span>
              <input className="input" 
                type="number"
                step="0.01"
                value={form.branchCashLimit} 
                onChange={e => setForm({ ...form, branchCashLimit: e.target.value })} 
                disabled={formMode === 'view'} 
              />
            </label>
          </div>

          {(formMode === 'create' || formMode === 'edit') && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
              <button
                className="pill"
                type="submit"
                style={{
                  padding: "12px 24px",
                  fontSize: "16px",
                  minWidth: "auto"
                }}
              >
                {formMode === 'create' ? "Add Branch" : "Update Branch"}
              </button>
            </div>
          )}

          {/* Audit Fields Section */}
          <hr style={{ margin: "24px 0", border: "none", borderTop: "1px solid #e0e0e0" }} />

          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(3, 1fr)", 
            gap: "12px", 
            marginTop: "16px"
          }}>

            <label>
              Created On
              <input className="inputf"
                value={form.createdOn ? new Date(form.createdOn).toLocaleDateString() : ""}
                disabled={true}
              />
            </label>

            <label>
              Modified On
              <input className="inputf"
                value={form.modifiedOn ? new Date(form.modifiedOn).toLocaleDateString() : ""}
                disabled={true}
              />
            </label>

            <label>
              Approved On
              <input className="inputf"
                value={form.approvedOn ? new Date(form.approvedOn).toLocaleDateString() : ""}
                disabled={true}
              />
            </label>

            <label>
              Created By
              <input className="inputf"
                value={form.createdBy || ""}
                disabled={true}
              />
            </label>

            <label>
              Modified By
              <input className="inputf"
                value={form.modifiedBy || ""}
                disabled={true}
              />
            </label>
            
            <label>
              Approved By
              <input className="inputf"
                value={form.approvedBy || ""}
                disabled={true}
              />
            </label>
            
          </div>
        </form>
      </main>

      {/* Branch Lookup Modal */}
      <BranchLookupModal
        isOpen={isBranchLookupModalOpen}
        onClose={() => setIsBranchLookupModalOpen(false)}
        onSelectBranch={handleBranchSelect}
      />
    </>
  );

  return isWindowMode ? content : <DashboardWrapper>{content}</DashboardWrapper>;
}

export default BranchForm;
