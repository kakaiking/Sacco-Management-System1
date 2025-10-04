import React, { useContext, useEffect, useState } from "react";
import { useHistory, useParams, useLocation } from "react-router-dom";
import { FiArrowLeft, FiMoreVertical, FiEdit3, FiTrash2, FiRefreshCw, FiSearch } from "react-icons/fi";
import axios from "axios";
import { useSnackbar } from "../helpers/SnackbarContext";
import { AuthContext } from "../helpers/AuthContext";
import DashboardWrapper from '../components/DashboardWrapper';
import GLAccountsLookupModal from '../components/GLAccountsLookupModal';

function GLAccountForm({ id: propId, isWindowMode = false }) {
  const history = useHistory();
  const { authState, isLoading } = useContext(AuthContext);
  const { id: paramId } = useParams();
  const { search } = useLocation();
  const { showMessage } = useSnackbar();
  
  // Use propId if in window mode, otherwise use paramId from URL
  const id = isWindowMode ? propId : paramId;
  
  const isEdit = new URLSearchParams(search).get("edit") === "1";
  const isCreate = id === "new";
  const isViewingSpecificGLAccount = id && id !== "new";

  // Form mode state: 'create', 'view', 'edit'
  // Default to create mode unless we're viewing a specific GL account or editing
  const [formMode, setFormMode] = useState(
    isCreate ? 'create' : 
    (isEdit ? 'edit' : 
    (isViewingSpecificGLAccount ? 'view' : 'create'))
  );
  
  // Update form mode when URL parameters change
  useEffect(() => {
    const newIsCreate = id === "new";
    const newIsEdit = new URLSearchParams(search).get("edit") === "1";
    const newIsViewingSpecificGLAccount = id && id !== "new";
    const newFormMode = newIsCreate ? 'create' : 
                       (newIsEdit ? 'edit' : 
                       (newIsViewingSpecificGLAccount ? 'view' : 'create'));
    setFormMode(newFormMode);
  }, [id, search]);
  
  // Actions dropdown state
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showGLAccountLookup, setShowGLAccountLookup] = useState(false);
  
  // Selected GL Account for display
  const [selectedGLAccount, setSelectedGLAccount] = useState(null);

  const [form, setForm] = useState({
    id: null,
    glAccountId: "",
    saccoId: "",
    accountName: "",
    accountCategory: "ASSET",
    accountSubCategory: "",
    parentAccountId: "",
    accountLevel: 1,
    isParentAccount: false,
    normalBalance: "DEBIT",
    availableBalance: 0.00,
    status: "Active",
    remarks: "",
    createdBy: "",
    createdOn: "",
    modifiedBy: "",
    modifiedOn: "",
    statusChangedBy: "",
    statusChangedOn: "",
  });

  const [saccos, setSaccos] = useState([]);
  const [parentAccounts, setParentAccounts] = useState([]);
  const [activeTab, setActiveTab] = useState("details");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isViewingSpecificGLAccount || isEdit);

  useEffect(() => {
    // Only redirect if authentication check is complete and user is not authenticated
    if (!isLoading && !authState.status) {
      history.push("/login");
    }
  }, [authState, isLoading, history]);

  // Auto-populate from auth state
  useEffect(() => {
    if (authState?.saccoId && formMode === 'create') {
      setForm(prev => ({
        ...prev,
        saccoId: authState.saccoId
      }));
    }
  }, [authState, formMode]);

  // Load saccos and parent accounts for dropdowns
  useEffect(() => {
    const loadData = async () => {
      try {
        const [saccosRes, parentAccountsRes] = await Promise.all([
          axios.get("http://localhost:3001/sacco", {
            headers: { accessToken: localStorage.getItem("accessToken") },
          }),
          axios.get("http://localhost:3001/gl-accounts", {
            headers: { accessToken: localStorage.getItem("accessToken") },
          })
        ]);

        const saccosData = saccosRes.data?.entity || saccosRes.data || [];
        const parentAccountsData = parentAccountsRes.data?.entity || parentAccountsRes.data || [];

        setSaccos(Array.isArray(saccosData) ? saccosData : []);
        setParentAccounts(Array.isArray(parentAccountsData) ? parentAccountsData : []);
      } catch (err) {
        showMessage("Failed to load data", "error");
      }
    };
    loadData();
  }, [showMessage]);

  // Load GL account data when viewing/editing specific GL account
  useEffect(() => {
    const load = async () => {
      if (!isCreate && id && id !== "new") {
        setInitialLoading(true);
        try {
          const res = await axios.get(`http://localhost:3001/gl-accounts/${id}`, {
            headers: { accessToken: localStorage.getItem("accessToken") },
          });
          const data = res.data?.entity || res.data;
          setForm({
            id: data.id || null,
            glAccountId: data.glAccountId || "",
            saccoId: data.saccoId || "",
            accountName: data.accountName || "",
            accountCategory: data.accountCategory || "ASSET",
            accountSubCategory: data.accountSubCategory || "",
            parentAccountId: data.parentAccountId || "",
            accountLevel: data.accountLevel || 1,
            isParentAccount: data.isParentAccount || false,
            normalBalance: data.normalBalance || "DEBIT",
            availableBalance: data.availableBalance || 0.00,
            status: data.status || "Active",
            remarks: data.remarks || "",
            createdBy: data.createdBy || "",
            createdOn: data.createdOn || "",
            modifiedBy: data.modifiedBy || "",
            modifiedOn: data.modifiedOn || "",
            statusChangedBy: data.statusChangedBy || "",
            statusChangedOn: data.statusChangedOn || "",
          });
          setSelectedGLAccount(data);
        } catch (err) {
          showMessage("Failed to load GL account", "error");
        } finally {
          setInitialLoading(false);
        }
      }
    };
    load();
  }, [id, isCreate, showMessage]);

  // Update normal balance when category changes
  useEffect(() => {
    const normalBalance = ['ASSET', 'EXPENSE'].includes(form.accountCategory) ? 'DEBIT' : 'CREDIT';
    setForm(prev => ({ ...prev, normalBalance }));
  }, [form.accountCategory]);

  // Handle GL Account selection from lookup
  const handleGLAccountSelect = async (glAccount) => {
    try {
      setInitialLoading(true);
      const res = await axios.get(`http://localhost:3001/gl-accounts/${glAccount.id}`, {
        headers: { accessToken: localStorage.getItem("accessToken") },
      });
      const data = res.data?.entity || res.data;
      
      setForm({
        id: data.id || null,
        glAccountId: data.glAccountId || "",
        saccoId: data.saccoId || "",
        accountName: data.accountName || "",
        accountCategory: data.accountCategory || "ASSET",
        accountSubCategory: data.accountSubCategory || "",
        parentAccountId: data.parentAccountId || "",
        accountLevel: data.accountLevel || 1,
        isParentAccount: data.isParentAccount || false,
        normalBalance: data.normalBalance || "DEBIT",
        availableBalance: data.availableBalance || 0.00,
        status: data.status || "Active",
        remarks: data.remarks || "",
        createdBy: data.createdBy || "",
        createdOn: data.createdOn || "",
        modifiedBy: data.modifiedBy || "",
        modifiedOn: data.modifiedOn || "",
        statusChangedBy: data.statusChangedBy || "",
        statusChangedOn: data.statusChangedOn || "",
      });
      setSelectedGLAccount(data);
      setFormMode('view');
    } catch (err) {
      showMessage("Failed to load GL account details", "error");
    } finally {
      setInitialLoading(false);
    }
  };

  // Handle clear form (switch to create mode)
  const handleClearForm = () => {
    setForm({
      id: null,
      glAccountId: "",
      saccoId: authState?.saccoId || "",
      accountName: "",
      accountCategory: "ASSET",
      accountSubCategory: "",
      parentAccountId: "",
      accountLevel: 1,
      isParentAccount: false,
      normalBalance: "DEBIT",
      availableBalance: 0.00,
      status: "Active",
      remarks: "",
      createdBy: "",
      createdOn: "",
      modifiedBy: "",
      modifiedOn: "",
      statusChangedBy: "",
      statusChangedOn: "",
    });
    setSelectedGLAccount(null);
    setFormMode('create');
    setShowActionsDropdown(false);
  };

  // Handle edit mode
  const handleEdit = () => {
    setFormMode('edit');
    setShowActionsDropdown(false);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!form.id) return;
    
    setShowDeleteModal(true);
    setShowActionsDropdown(false);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`http://localhost:3001/gl-accounts/${form.id}`, {
        headers: { accessToken: localStorage.getItem("accessToken") },
      });
      showMessage("GL Account deleted successfully", "success");
      handleClearForm();
      setShowDeleteModal(false);
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to delete GL account";
      showMessage(msg, "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (formMode === 'create') {
        const payload = {
          saccoId: form.saccoId,
          accountName: form.accountName,
          accountCategory: form.accountCategory,
          accountSubCategory: form.accountSubCategory,
          parentAccountId: form.parentAccountId || null,
          accountLevel: form.accountLevel,
          isParentAccount: form.isParentAccount,
          availableBalance: form.availableBalance,
          status: form.status,
          remarks: form.remarks
        };
        
        const res = await axios.post("http://localhost:3001/gl-accounts", payload, {
          headers: { accessToken: localStorage.getItem("accessToken") },
        });
        showMessage("GL Account created successfully", "success");
        
        // Load the newly created account and switch to view mode
        const newAccount = res.data?.entity || res.data;
        if (newAccount && newAccount.id) {
          handleGLAccountSelect(newAccount);
        }
      } else if (formMode === 'edit') {
        const payload = {
          accountName: form.accountName,
          accountSubCategory: form.accountSubCategory,
          parentAccountId: form.parentAccountId || null,
          accountLevel: form.accountLevel,
          isParentAccount: form.isParentAccount,
          availableBalance: form.availableBalance,
          status: form.status,
          remarks: form.remarks
        };
        
        await axios.put(`http://localhost:3001/gl-accounts/${form.id}`, payload, {
          headers: { accessToken: localStorage.getItem("accessToken") },
        });
        showMessage("GL Account updated successfully", "success");
        
        // Reload the account and switch to view mode
        if (form.id) {
          const res = await axios.get(`http://localhost:3001/gl-accounts/${form.id}`, {
            headers: { accessToken: localStorage.getItem("accessToken") },
          });
          const updatedData = res.data?.entity || res.data;
          setForm(prev => ({
            ...prev,
            ...updatedData
          }));
          setSelectedGLAccount(updatedData);
        }
        setFormMode('view');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to save GL account";
      showMessage(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const actionsDropdown = document.querySelector('[data-actions-dropdown]');
      if (actionsDropdown && !actionsDropdown.contains(event.target)) {
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

  const getCategoryColor = (category) => {
    const colors = {
      'ASSET': '#10b981',
      'LIABILITY': '#f59e0b', 
      'EQUITY': '#3b82f6',
      'INCOME': '#8b5cf6',
      'EXPENSE': '#ef4444'
    };
    return colors[category] || '#6b7280';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'ASSET': '💰',
      'LIABILITY': '📋',
      'EQUITY': '🏛️',
      'INCOME': '📈',
      'EXPENSE': '💸'
    };
    return icons[category] || '📊';
  };

  const content = (
    <div style={{ padding: "10px 14px" }}>
      <section className="card" style={{ padding: "24px" }}>
        <form onSubmit={handleSubmit}>
          {/* First Row: GL Account Lookup, Status Badge, Actions Dropdown */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: formMode === 'create' ? "1fr" : "1fr auto auto", 
            gap: "20px",
            marginBottom: "12px",
            alignItems: "center"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <label style={{ fontWeight: "600", color: "var(--primary-700)", minWidth: "110px" }}>
                GL Account
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                <div className="combined-member-input" style={{ flex: 1 }}>
                  <div className="member-no-section">
                    {selectedGLAccount ? selectedGLAccount.glAccountId : "New GL Account"}
                  </div>
                  <div className="member-name-section">
                    {selectedGLAccount ? selectedGLAccount.accountName : ""}
                  </div>
                </div>
                <button
                  type="button"
                  className="search-icon-external"
                  onClick={() => setShowGLAccountLookup(true)}
                  title="Search GL accounts"
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
                    form.status === "Inactive" ? "rgba(107, 114, 128, 0.2)" :
                    form.status === "Suspended" ? "rgba(249, 115, 22, 0.2)" :
                    form.status === "Closed" ? "rgba(239, 68, 68, 0.2)" :
                    "rgba(107, 114, 128, 0.2)",
                  color: 
                    form.status === "Active" ? "#059669" :
                    form.status === "Inactive" ? "#6b7280" :
                    form.status === "Suspended" ? "#ea580c" :
                    form.status === "Closed" ? "#dc2626" :
                    "#6b7280",
                  border: `1px solid ${
                    form.status === "Active" ? "rgba(16, 185, 129, 0.3)" :
                    form.status === "Inactive" ? "rgba(107, 114, 128, 0.3)" :
                    form.status === "Suspended" ? "rgba(249, 115, 22, 0.3)" :
                    form.status === "Closed" ? "rgba(239, 68, 68, 0.3)" :
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
                    
                    <button
                      type="button"
                      onClick={handleEdit}
                      disabled={formMode === 'edit'}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: "none",
                        backgroundColor: "transparent",
                        textAlign: "left",
                        cursor: formMode === 'edit' ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        fontSize: "14px",
                        color: formMode === 'edit' ? "var(--muted-text)" : "var(--text-primary)",
                        transition: "background-color 0.2s ease"
                      }}
                      onMouseEnter={(e) => {
                        if (formMode !== 'edit') e.target.style.backgroundColor = "var(--surface-2)";
                      }}
                      onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                    >
                      <FiEdit3 style={{ color: formMode === 'edit' ? "var(--muted-text)" : "#f59e0b" }} />
                      Edit
                    </button>
                    
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
                      onMouseEnter={(e) => e.target.style.backgroundColor = "var(--surface-2)"}
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

          {/* Tab Navigation */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: "8px",
            marginBottom: "24px",
            backgroundColor: "var(--surface-2)",
            borderRadius: "8px",
            padding: "4px"
          }}>
            <div
              onClick={() => setActiveTab("details")}
              style={{
                padding: "12px 24px",
                color: activeTab === "details" ? "#007bff" : "#666",
                cursor: "pointer",
                fontWeight: activeTab === "details" ? "600" : "400",
                background: activeTab === "details" ? "#e3f2fd" : "transparent",
                border: "1px solid transparent",
                borderRadius: "6px",
                fontSize: "14px",
                transition: "all 0.2s ease"
              }}
            >
              Details
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "details" && (
            <div>
              <div className="grid2">
                {/* SACCO field */}
                <label>
                  SACCO *
                  <select
                    className="input"
                    value={form.saccoId}
                    onChange={e => setForm({ ...form, saccoId: e.target.value })}
                    disabled={formMode === 'view' || (formMode === 'edit')}
                    required
                  >
                    <option value="">Select SACCO</option>
                    {saccos.map(sacco => (
                      <option key={sacco.id} value={sacco.saccoId}>
                        {sacco.saccoId} - {sacco.saccoName}
                      </option>
                    ))}
                  </select>
                </label>

                {/* Account Category */}
                <label>
                  Account Category *
                  <select
                    className="input"
                    value={form.accountCategory}
                    onChange={e => setForm({ ...form, accountCategory: e.target.value })}
                    disabled={formMode === 'view' || (formMode === 'edit')}
                    required
                  >
                    <option value="ASSET">💰 Assets</option>
                    <option value="LIABILITY">📋 Liabilities</option>
                    <option value="EQUITY">🏛️ Equity</option>
                    <option value="INCOME">📈 Income</option>
                    <option value="EXPENSE">💸 Expenses</option>
                  </select>
                </label>

                {/* Account Name */}
                <label>
                  Account Name *
                  <input
                    className="input"
                    value={form.accountName}
                    onChange={e => setForm({ ...form, accountName: e.target.value })}
                    disabled={formMode === 'view'}
                    placeholder="Enter account name (e.g., Cash Account)"
                    required
                  />
                </label>

                {/* Account Sub Category */}
                <label>
                  Account Sub Category
                  <input
                    className="input"
                    value={form.accountSubCategory}
                    onChange={e => setForm({ ...form, accountSubCategory: e.target.value })}
                    disabled={formMode === 'view'}
                    placeholder="Enter sub category (e.g., Current Assets)"
                  />
                </label>

                {/* Parent Account */}
                <label>
                  Parent Account
                  <select
                    className="input"
                    value={form.parentAccountId}
                    onChange={e => setForm({ ...form, parentAccountId: e.target.value })}
                    disabled={formMode === 'view'}
                  >
                    <option value="">Select Parent Account (Optional)</option>
                    {parentAccounts
                      .filter(account => account.id !== form.id && account.isParentAccount)
                      .map(account => (
                        <option key={account.id} value={account.id}>
                          {account.glAccountId} - {account.accountName}
                        </option>
                      ))}
                  </select>
                </label>

                {/* Account Level */}
                <label>
                  Account Level
                  <input
                    type="number"
                    min="1"
                    max="5"
                    className="input"
                    value={form.accountLevel}
                    onChange={e => setForm({ ...form, accountLevel: parseInt(e.target.value) || 1 })}
                    disabled={formMode === 'view'}
                  />
                </label>

                {/* Normal Balance - Auto-determined */}
                <label>
                  Normal Balance
                  <input
                    className="input"
                    value={form.normalBalance}
                    disabled={true}
                    style={{
                      backgroundColor: form.normalBalance === 'DEBIT' ? "#fef3c7" : "#dbeafe",
                      color: form.normalBalance === 'DEBIT' ? "#92400e" : "#1e40af",
                      fontWeight: "600"
                    }}
                  />
                </label>

                {/* Is Parent Account */}
                <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="checkbox"
                    checked={form.isParentAccount}
                    onChange={e => setForm({ ...form, isParentAccount: e.target.checked })}
                    disabled={formMode === 'view'}
                  />
                  <span>Is Parent Account</span>
                </label>

                {/* Available Balance */}
                <label>
                  Available Balance (KSH)
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    value={form.availableBalance}
                    onChange={e => setForm({ ...form, availableBalance: parseFloat(e.target.value) || 0 })}
                    disabled={formMode === 'view'}
                    required
                  />
                </label>

                {/* Status */}
                <label>
                  Status
                  <select
                    className="input"
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value })}
                    disabled={formMode === 'view'}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Closed">Closed</option>
                  </select>
                </label>

              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                {formMode === 'create' && (
                  <button
                    type="submit"
                    className="pill"
                    disabled={loading}
                    style={{
                      padding: "8px 16px",
                      fontSize: "14px",
                      backgroundColor: "var(--primary-500)",
                      color: "white",
                      border: "none",
                      cursor: loading ? "not-allowed" : "pointer",
                      opacity: loading ? 0.7 : 1
                    }}
                  >
                    {loading ? "Creating..." : "Create GL Account"}
                  </button>
                )}
                
                {formMode === 'edit' && (
                  <>
                    <button
                      type="button"
                      className="pill"
                      onClick={() => {
                        // Reload original data and switch to view mode
                        if (form.id) {
                          handleGLAccountSelect({ id: form.id });
                        }
                      }}
                      disabled={loading}
                      style={{
                        padding: "8px 16px",
                        fontSize: "14px",
                        backgroundColor: "var(--gray-200)",
                        color: "var(--text-primary)",
                        border: "1px solid var(--border)",
                        cursor: loading ? "not-allowed" : "pointer"
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="pill"
                      disabled={loading}
                      style={{
                        padding: "8px 16px",
                        fontSize: "14px",
                        backgroundColor: "var(--primary-500)",
                        color: "white",
                        border: "none",
                        cursor: loading ? "not-allowed" : "pointer",
                        opacity: loading ? 0.7 : 1
                      }}
                    >
                      {loading ? "Updating..." : "Update GL Account"}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Audit Fields Section */}
          {formMode !== 'create' && (
            <>
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
                  Status Changed On
                  <input className="inputf"
                    value={form.statusChangedOn ? new Date(form.statusChangedOn).toLocaleDateString() : ""}
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
                  Status Changed By
                  <input className="inputf"
                    value={form.statusChangedBy || ""}
                    disabled={true}
                  />
                </label>
              </div>

              <label style={{ marginTop: "16px" }}>
                Remarks
                <textarea
                  className="inputa"
                  value={form.remarks || ""}
                  onChange={(e) => setForm(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="Enter remarks about this GL account..."
                  rows={3}
                  style={{ resize: "vertical" }}
                  disabled={formMode === 'view'}
                />
              </label>
            </>
          )}

        </form>
      </section>

      {/* GL Account Lookup Modal */}
      <GLAccountsLookupModal
        isOpen={showGLAccountLookup}
        onClose={() => setShowGLAccountLookup(false)}
        onSelectGLAccount={handleGLAccountSelect}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
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
            backgroundColor: "white",
            padding: "24px",
            borderRadius: "12px",
            width: "90%",
            maxWidth: "500px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
          }}>
            <h3 style={{
              margin: "0 0 16px 0",
              fontSize: "18px",
              fontWeight: "600",
              color: "var(--primary-700)"
            }}>
              Confirm Deletion
            </h3>
            
            <p style={{
              margin: "0 0 20px 0",
              color: "var(--muted-text)",
              fontSize: "14px"
            }}>
              Are you sure you want to delete this GL Account? This action cannot be undone.
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button
                type="button"
                className="pill"
                onClick={() => setShowDeleteModal(false)}
                style={{
                  padding: "8px 16px",
                  fontSize: "14px",
                  backgroundColor: "var(--gray-200)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border)"
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="pill"
                onClick={confirmDelete}
                style={{
                  padding: "8px 16px",
                  fontSize: "14px",
                  backgroundColor: "#dc2626",
                  color: "white",
                  border: "none"
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (isWindowMode) {
    return content;
  }

  return (
    <DashboardWrapper>
      <header className="header">
        <div className="header__left">
          <button className="iconBtn" onClick={() => history.push("/gl-accounts-management")} title="Back" aria-label="Back" style={{ marginRight: 8 }}>
            <FiArrowLeft className="icon" style={{ fontWeight: "bolder" }}/>
          </button>
          <div className="greeting">
            {formMode === 'create' ? "Create GL Account" : 
             formMode === 'edit' ? "Edit GL Account" : 
             "View GL Account"}
          </div>
        </div>
      </header>

      <main className="dashboard__content">
        {content}
      </main>
    </DashboardWrapper>
  );
}

export default GLAccountForm;
