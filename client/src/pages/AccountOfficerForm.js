import React, { useContext, useEffect, useState } from "react";
import { useHistory, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import { FiSave, FiArrowLeft, FiEdit3, FiTrash2, FiX, FiMoreVertical, FiCheck, FiRefreshCw, FiSearch, FiRotateCcw } from "react-icons/fi";
import DashboardWrapper from '../components/DashboardWrapper';
import { useSnackbar } from "../helpers/SnackbarContext";
import { AuthContext } from "../helpers/AuthContext";
import UserLookupModal from '../components/UserLookupModal';
import BranchLookupModal from '../components/BranchLookupModal';
import AccountOfficerLookupModal from '../components/AccountOfficerLookupModal';

function AccountOfficerForm({ id: propId, isWindowMode = false }) {
  const history = useHistory();
  const { authState, isLoading } = useContext(AuthContext);
  const { id: paramId } = useParams();
  const { search } = useLocation();
  const { showMessage } = useSnackbar();
  
  // Use prop id if in window mode, otherwise use param id
  const id = isWindowMode ? propId : paramId;
  
  const isEdit = new URLSearchParams(search).get("edit") === "1";
  const isCreate = id === "new";
  const isViewingSpecificAccountOfficer = id && id !== "new";

  // Form mode state: 'create', 'view', 'edit'
  const [formMode, setFormMode] = useState(
    isCreate ? 'create' : 
    (isEdit ? 'edit' : 
    (isViewingSpecificAccountOfficer ? 'view' : 'create'))
  );
  
  // Update form mode when URL parameters change
  useEffect(() => {
    const newIsCreate = id === "new";
    const newIsEdit = new URLSearchParams(search).get("edit") === "1";
    const newIsViewingSpecificAccountOfficer = id && id !== "new";
    const newFormMode = newIsCreate ? 'create' : 
                       (newIsEdit ? 'edit' : 
                       (newIsViewingSpecificAccountOfficer ? 'view' : 'create'));
    setFormMode(newFormMode);
  }, [id, search]);
  
  // Actions dropdown state
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showAccountOfficerModal, setShowAccountOfficerModal] = useState(false);
  
  // Audit fields visibility state
  const [showAuditFields, setShowAuditFields] = useState(false);

  const [form, setForm] = useState({
    accountOfficerId: "",
    userId: "",
    employeeId: "",
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    branchId: "",
    department: "",
    position: "",
    effectiveDate: "",
    expiryDate: "",
    isDefault: false,
    maxClients: "",
    currentClients: 0,
    status: "Active",
    saccoId: "",
    createdBy: "",
    createdOn: "",
    modifiedBy: "",
    modifiedOn: "",
    approvedBy: "",
    approvedOn: "",
  });

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isViewingSpecificAccountOfficer || isEdit);

  // Selected lookup values
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedAccountOfficer, setSelectedAccountOfficer] = useState(null);

  // Helper function to check if a field is required
  const isFieldRequired = (fieldName) => {
    const requiredFields = ['userId', 'firstName', 'lastName', 'email', 'effectiveDate'];
    return requiredFields.includes(fieldName);
  };

  // Helper function to format date for HTML date input (yyyy-MM-dd)
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  };

  useEffect(() => {
    // Only redirect if authentication check is complete and user is not authenticated
    if (!isLoading && !authState.status) {
      history.push("/login");
    }
  }, [authState, isLoading, history]);

  // Close Actions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showActionsDropdown && !event.target.closest('[data-actions-dropdown]')) {
        setShowActionsDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showActionsDropdown]);

  // Fetch account officer data for editing/viewing
  useEffect(() => {
    if (isViewingSpecificAccountOfficer || isEdit) {
      fetchAccountOfficer();
    }
  }, [id, isViewingSpecificAccountOfficer, isEdit]);

  const fetchAccountOfficer = async () => {
    setInitialLoading(true);
    try {
      console.log('🔍 AccountOfficerForm: Fetching account officer with ID:', id);
      console.log('🔍 Access token exists:', !!localStorage.getItem('accessToken'));
      
      const response = await axios.get(`http://localhost:3001/account-officers/${id}`, {
        headers: { accessToken: localStorage.getItem('accessToken') }
      });
      
      console.log('✅ AccountOfficerForm: API response received');
      console.log('✅ Response status:', response.status);
      console.log('✅ Response data:', response.data);
      
      const accountOfficer = response.data.entity;
      setForm(accountOfficer);
      
      console.log('✅ Account officer data set:', accountOfficer);
      
      // Set selected lookup values
      if (accountOfficer.user) {
        console.log('✅ Setting selected user:', accountOfficer.user);
        setSelectedUser(accountOfficer.user);
      } else {
        console.warn('⚠️ No user data in account officer response');
      }
      
      if (accountOfficer.branch) {
        console.log('✅ Setting selected branch:', accountOfficer.branch);
        setSelectedBranch(accountOfficer.branch);
      } else {
        console.warn('⚠️ No branch data in account officer response');
      }
      
    } catch (error) {
      console.error("❌ AccountOfficerForm: Error fetching account officer:", error);
      console.error("❌ Error response:", error.response?.data);
      console.error("❌ Error status:", error.response?.status);
      showMessage("Error fetching account officer details: " + (error.response?.data?.error || error.message), "error");
    } finally {
      setInitialLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleUserSelect = (user) => {
    console.log('🔍 AccountOfficerForm: User selected:', user);
    setSelectedUser(user);
    setForm(prev => ({
      ...prev,
      userId: user.userId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber || ""
    }));
    console.log('✅ AccountOfficerForm: Form updated with user data');
    setShowUserModal(false);
  };

  const handleBranchSelect = (branch) => {
    setSelectedBranch(branch);
    setForm(prev => ({
      ...prev,
      branchId: branch.branchId
    }));
    setShowBranchModal(false);
  };

  const handleAccountOfficerSelect = (accountOfficer) => {
    console.log('🔍 AccountOfficerForm: Account officer selected:', accountOfficer);
    setSelectedAccountOfficer(accountOfficer);
    setForm(prev => ({
      ...prev,
      accountOfficerId: accountOfficer.accountOfficerId,
      userId: accountOfficer.userId,
      employeeId: accountOfficer.employeeId,
      firstName: accountOfficer.firstName,
      lastName: accountOfficer.lastName,
      email: accountOfficer.email,
      phoneNumber: accountOfficer.phoneNumber,
      branchId: accountOfficer.branchId,
      department: accountOfficer.department,
      position: accountOfficer.position,
      effectiveDate: accountOfficer.effectiveDate,
      expiryDate: accountOfficer.expiryDate,
      isDefault: accountOfficer.isDefault,
      maxClients: accountOfficer.maxClients,
      currentClients: accountOfficer.currentClients,
      status: accountOfficer.status,
      saccoId: accountOfficer.saccoId,
      createdBy: accountOfficer.createdBy,
      createdOn: accountOfficer.createdOn,
      modifiedBy: accountOfficer.modifiedBy,
      modifiedOn: accountOfficer.modifiedOn,
      approvedBy: accountOfficer.approvedBy,
      approvedOn: accountOfficer.approvedOn
    }));
    
    console.log('✅ AccountOfficerForm: Form updated with account officer data');
    
    // Set selected lookup values
    if (accountOfficer.user) {
      console.log('✅ Setting selected user from account officer:', accountOfficer.user);
      setSelectedUser(accountOfficer.user);
    } else {
      console.warn('⚠️ No user data in selected account officer');
    }
    
    if (accountOfficer.branch) {
      console.log('✅ Setting selected branch from account officer:', accountOfficer.branch);
      setSelectedBranch(accountOfficer.branch);
    } else {
      console.warn('⚠️ No branch data in selected account officer');
    }
    
    // Switch to view mode when an account officer is selected
    setFormMode('view');
    setShowAccountOfficerModal(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.userId || !form.firstName || !form.lastName || !form.email) {
      showMessage("Please fill in all required fields", "error");
      return;
    }

    setLoading(true);
    try {
      // Remove remarks from form data for frontend submission
      const { remarks, ...formData } = form;
      
      // Determine if this is a create or update operation
      const isUpdateOperation = form.accountOfficerId && form.accountOfficerId !== "";
      
      if (isUpdateOperation) {
        // Update existing account officer
        await axios.put(`http://localhost:3001/account-officers/${form.accountOfficerId}`, formData, {
          headers: { accessToken: localStorage.getItem('accessToken') }
        });
        showMessage("Account officer updated successfully", "success");
        if (isWindowMode) {
          window.close();
        } else {
          history.push('/account-officers');
        }
      } else {
        // Create new account officer
        await axios.post('http://localhost:3001/account-officers', formData, {
          headers: { accessToken: localStorage.getItem('accessToken') }
        });
        showMessage("Account officer created successfully", "success");
        if (isWindowMode) {
          window.close();
        } else {
          history.push('/account-officers');
        }
      }
    } catch (error) {
      console.error("Error saving account officer:", error);
      showMessage(error.response?.data?.error || "Error saving account officer", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      // Use the actual accountOfficerId from the form data, not the URL parameter
      const accountOfficerIdToDelete = form.accountOfficerId;
      
      if (!accountOfficerIdToDelete) {
        showMessage("No account officer selected to delete", "error");
        setLoading(false);
        setShowDeleteModal(false);
        return;
      }
      
      await axios.delete(`http://localhost:3001/account-officers/${accountOfficerIdToDelete}`, {
        headers: { accessToken: localStorage.getItem('accessToken') }
      });
      showMessage("Account officer deleted successfully", "success");
      if (isWindowMode) {
        window.close();
      } else {
        history.push('/account-officers');
      }
    } catch (error) {
      console.error("Error deleting account officer:", error);
      showMessage(error.response?.data?.error || "Error deleting account officer", "error");
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setLoading(true);
    try {
      // Use the actual accountOfficerId from the form data, not the URL parameter
      const accountOfficerIdToUpdate = form.accountOfficerId;
      
      if (!accountOfficerIdToUpdate) {
        showMessage("No account officer selected to update", "error");
        setLoading(false);
        return;
      }
      
      await axios.patch(`http://localhost:3001/account-officers/${accountOfficerIdToUpdate}/status`, {
        status: newStatus
      }, {
        headers: { accessToken: localStorage.getItem('accessToken') }
      });
      showMessage(`Account officer status changed to ${newStatus}`, "success");
      fetchAccountOfficer(); // Refresh data
    } catch (error) {
      console.error("Error updating status:", error);
      showMessage(error.response?.data?.error || "Error updating status", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    // Switch to edit mode directly without navigation
    setFormMode('edit');
    setShowActionsDropdown(false);
    showMessage("Form switched to edit mode", "success");
  };

  const handleBack = () => {
    if (isWindowMode) {
      window.close();
    } else {
      history.push('/account-officers');
    }
  };

  const clearForm = () => {
    setForm({
      accountOfficerId: "",
      userId: "",
      employeeId: "",
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      branchId: "",
      department: "",
      position: "",
      effectiveDate: "",
      expiryDate: "",
      isDefault: false,
      maxClients: "",
      currentClients: 0,
      status: "Active",
      saccoId: "",
      createdBy: "",
      createdOn: "",
      modifiedBy: "",
      modifiedOn: "",
      approvedBy: "",
      approvedOn: "",
    });
    
    // Clear selected lookup values
    setSelectedUser(null);
    setSelectedBranch(null);
    setSelectedAccountOfficer(null);
    
    // Switch to create mode
    setFormMode('create');
    
    // Close the dropdown
    setShowActionsDropdown(false);
    
    showMessage("Form cleared successfully", "success");
  };


  if (initialLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  const formContent = (
    <>
      <main className="dashboard__content">
        <section className="card" style={{ padding: "24px" }}>
          <form onSubmit={handleSave}>
            {/* Actions Button */}
            {formMode !== 'create' && (
              <div style={{ position: "relative", marginBottom: "20px", display: "flex", justifyContent: "flex-end" }} data-actions-dropdown>
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
                      onClick={clearForm}
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
                      <FiRotateCcw style={{ color: "var(--info-600)" }} />
                      Clear Form
                    </button>
                    
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
                      <FiEdit3 style={{ color: "var(--primary-600)" }} />
                      Edit
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(true)}
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
                      <FiTrash2 style={{ color: "var(--error-600)" }} />
                      Delete
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleStatusChange('Active')}
                      disabled={form.status === 'Active'}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: "none",
                        backgroundColor: "transparent",
                        textAlign: "left",
                        cursor: form.status === 'Active' ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        fontSize: "14px",
                        color: form.status === 'Active' ? "var(--text-disabled)" : "var(--text-primary)",
                        transition: "background-color 0.2s ease"
                      }}
                      onMouseEnter={(e) => {
                        if (form.status !== 'Active') {
                          e.target.style.backgroundColor = "var(--surface-2)";
                        }
                      }}
                      onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                    >
                      <FiCheck style={{ color: form.status === 'Active' ? "var(--text-disabled)" : "var(--success-600)" }} />
                      Activate
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleStatusChange('Inactive')}
                      disabled={form.status === 'Inactive'}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: "none",
                        backgroundColor: "transparent",
                        textAlign: "left",
                        cursor: form.status === 'Inactive' ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        fontSize: "14px",
                        color: form.status === 'Inactive' ? "var(--text-disabled)" : "var(--text-primary)",
                        transition: "background-color 0.2s ease"
                      }}
                      onMouseEnter={(e) => {
                        if (form.status !== 'Inactive') {
                          e.target.style.backgroundColor = "var(--surface-2)";
                        }
                      }}
                      onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                    >
                      <FiRefreshCw style={{ color: form.status === 'Inactive' ? "var(--text-disabled)" : "var(--warning-600)" }} />
                      Deactivate
                    </button>
                    </div>
                  )}
                </div>
              )}

            {/* Account Officer ID and Name at the top */}
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "1fr auto", 
              gap: "20px",
              marginBottom: "12px",
              alignItems: "start"
            }}>
              <div style={{ display: "grid", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <label style={{ fontWeight: "600", color: "var(--primary-700)", minWidth: "80px" }}>
                    Account Officer
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                    <div className="combined-member-input" style={{ flex: 1 }}>
                      <div className="member-no-section">
                        {selectedAccountOfficer ? selectedAccountOfficer.accountOfficerId : (form.accountOfficerId || "New Account Officer")}
                      </div>
                      <div className="member-name-section">
                        {selectedAccountOfficer ? `${selectedAccountOfficer.firstName} ${selectedAccountOfficer.lastName}` : (selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : "Select an account officer")}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="search-icon-external"
                      onClick={() => setShowAccountOfficerModal(true)}
                      title="Search account officers"
                      disabled={formMode === 'view'}
                    >
                      <FiSearch />
                    </button>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontWeight: "600", color: "var(--primary-700)", minWidth: "60px" }}>
                    Status
                  </span>
                  <div 
                    style={{
                      display: "inline-block",
                      padding: "6px 12px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "600",
                      textTransform: "uppercase",
                      backgroundColor: form.status === 'Active' ? '#dcfce7' : 
                                      form.status === 'Inactive' ? '#fef3c7' :
                                      form.status === 'Suspended' ? '#fee2e2' : '#f3f4f6',
                      color: form.status === 'Active' ? '#166534' : 
                             form.status === 'Inactive' ? '#92400e' :
                             form.status === 'Suspended' ? '#991b1b' : '#374151'
                    }}
                  >
                    {form.status}
                  </div>
                </div>
              </div>
            </div>

            {/* HR Separator */}
            <hr style={{ 
              margin: "20px 0", 
              border: "none", 
              borderTop: "1px solid #e5e7eb" 
            }} />

            {/* Form Fields - 4 Column Layout */}
            <div className="grid4">
              {/* User Lookup */}
              <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                <span style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>User</span>{isFieldRequired('userId') && <span style={{ color: '#ef4444' }}>*</span>}
                </span>
                <div className="role-input-wrapper">
                  <input
                    type="text"
                    className="input"
                    value={selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : ''}
                    placeholder="Select user"
                    readOnly
                    disabled={formMode === 'view'}
                  />
                  {formMode !== 'view' && (
                    <button
                      type="button"
                      className="role-search-btn"
                      onClick={() => setShowUserModal(true)}
                      title="Search users"
                    >
                      <FiSearch />
                    </button>
                  )}
                </div>
              </label>
              
              {/* Employee ID */}
              <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                <span style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Employee ID</span>
                </span>
                <input
                  type="text"
                  name="employeeId"
                  value={form.employeeId}
                  onChange={handleInputChange}
                  placeholder="Employee ID"
                  disabled={formMode === 'view'}
                  className="input"
                />
              </label>
              
              {/* First Name */}
              <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                <span style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>First Name</span>{isFieldRequired('firstName') && <span style={{ color: '#ef4444' }}>*</span>}
                </span>
                <input
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleInputChange}
                  placeholder="First Name"
                  disabled={formMode === 'view'}
                  required
                  className="input"
                />
              </label>
              
              {/* Last Name */}
              <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                <span style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Last Name</span>{isFieldRequired('lastName') && <span style={{ color: '#ef4444' }}>*</span>}
                </span>
                <input
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleInputChange}
                  placeholder="Last Name"
                  disabled={formMode === 'view'}
                  required
                  className="input"
                />
              </label>
              
              {/* Email */}
              <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                <span style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Email</span>{isFieldRequired('email') && <span style={{ color: '#ef4444' }}>*</span>}
                </span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleInputChange}
                  placeholder="Email"
                  disabled={formMode === 'view'}
                  required
                  className="input"
                />
              </label>
              
              {/* Phone Number */}
              <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                <span style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Phone Number</span>
                </span>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={form.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="Phone Number"
                  disabled={formMode === 'view'}
                  className="input"
                />
              </label>
              
              {/* Branch Lookup */}
              <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                <span style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Branch</span>
                </span>
                <div className="role-input-wrapper">
                  <input
                    type="text"
                    className="input"
                    value={selectedBranch ? selectedBranch.branchName : ''}
                    placeholder="Select branch"
                    readOnly
                    disabled={formMode === 'view'}
                  />
                  {formMode !== 'view' && (
                    <button
                      type="button"
                      className="role-search-btn"
                      onClick={() => setShowBranchModal(true)}
                      title="Search branches"
                    >
                      <FiSearch />
                    </button>
                  )}
                </div>
              </label>
              
              {/* Department */}
              <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                <span style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Department</span>
                </span>
                <input
                  type="text"
                  name="department"
                  value={form.department}
                  onChange={handleInputChange}
                  placeholder="Department"
                  disabled={formMode === 'view'}
                  className="input"
                />
              </label>
              
              {/* Position */}
              <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                <span style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Position</span>
                </span>
                <input
                  type="text"
                  name="position"
                  value={form.position}
                  onChange={handleInputChange}
                  placeholder="Position"
                  disabled={formMode === 'view'}
                  className="input"
                />
              </label>
              
              {/* Status */}
              {/* <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                <span style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Status</span>
                </span>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleInputChange}
                  disabled={formMode === 'view'}
                  className="input"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Terminated">Terminated</option>
                </select>
              </label> */}
              
              {/* Effective Date */}
              <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                <span style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Effective Date</span>{isFieldRequired('effectiveDate') && <span style={{ color: '#ef4444' }}>*</span>}
                </span>
                <input
                  type="date"
                  name="effectiveDate"
                  value={formatDateForInput(form.effectiveDate)}
                  onChange={handleInputChange}
                  disabled={formMode === 'view'}
                  required
                  className="input"
                />
              </label>
              
              {/* Expiry Date */}
              <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                <span style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Expiry Date</span>
                </span>
                <input
                  type="date"
                  name="expiryDate"
                  value={formatDateForInput(form.expiryDate)}
                  onChange={handleInputChange}
                  disabled={formMode === 'view'}
                  className="input"
                />
              </label>
              
              {/* Max Clients */}
              <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                <span style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Max Clients</span>
                </span>
                <input
                  type="number"
                  name="maxClients"
                  value={form.maxClients}
                  onChange={handleInputChange}
                  placeholder="Maximum number of clients"
                  disabled={formMode === 'view'}
                  min="0"
                  className="input"
                />
              </label>
              
              {/* Current Clients */}
              <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                <span style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Current Clients</span>
                </span>
                <input
                  type="number"
                  value={form.currentClients}
                  disabled
                  className="input"
                />
              </label>
              
              {/* Default Account Officer Checkbox */}
              <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                <span style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Default Account Officer</span>
                </span>
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "8px",
                  padding: "8px 0"
                }}>
                  <input
                    type="checkbox"
                    name="isDefault"
                    checked={form.isDefault}
                    onChange={handleInputChange}
                    disabled={formMode === 'view'}
                    style={{
                      width: "16px",
                      height: "16px"
                    }}
                  />
                  <span style={{ fontSize: "14px", color: "#6b7280" }}>
                    {form.isDefault ? "Yes" : "No"}
                  </span>
                </div>
              </label>
            </div>

            {/* Save Button - Inside Form */}
            {formMode !== 'view' && (
              <div style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
                marginTop: "24px"
              }}>
                <button
                  type="submit"
                  className="pill"
                  style={{
                    padding: "8px 16px",
                    fontSize: "14px",
                    minWidth: "auto"
                  }}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Account Officer'}
                </button>
              </div>
            )}

            {/* Audit Information Section - Exactly like Member Form */}
            <div
          style={{
            padding: "12px 16px",
            backgroundColor: "#f8f9fa",
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            cursor: "pointer",
            marginBottom: showAuditFields ? "16px" : "0",
            transition: "all 0.3s ease"
          }}
          onClick={() => setShowAuditFields(!showAuditFields)}
        >
          <h3 style={{ 
            margin: 0, 
            fontSize: "16px", 
            fontWeight: "600", 
            color: "#333",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <span>📋</span>
            Audit Information
          </h3>
          <span style={{
            fontSize: "18px",
            fontWeight: "bold",
            color: "#666",
            transform: showAuditFields ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.3s ease"
          }}>
            ▼
          </span>
        </div>

        {/* Collapsible Audit Fields Content */}
        {showAuditFields && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "12px",
            marginTop: "16px",
            padding: "16px",
            backgroundColor: "#fafafa",
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            animation: "fadeIn 0.3s ease"
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
        )}
          </form>
        </section>
      </main>


      {/* Modals */}
      <AccountOfficerLookupModal
        isOpen={showAccountOfficerModal}
        onClose={() => setShowAccountOfficerModal(false)}
        onSelect={handleAccountOfficerSelect}
      />

      <UserLookupModal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        onSelectUser={handleUserSelect}
      />

      <BranchLookupModal
        isOpen={showBranchModal}
        onClose={() => setShowBranchModal(false)}
        onSelectBranch={handleBranchSelect}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div style={{
          position: "fixed",
          top: "0",
          left: "0",
          right: "0",
          bottom: "0",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2000
        }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "24px",
            maxWidth: "500px",
            width: "90%",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px"
            }}>
              <h3 style={{ margin: "0", fontSize: "18px", fontWeight: "600" }}>Confirm Delete</h3>
              <button 
                onClick={() => setShowDeleteModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <FiX />
              </button>
            </div>
            <div style={{ marginBottom: "24px" }}>
              <p style={{ margin: "0 0 12px 0", color: "#374151" }}>
                Are you sure you want to delete this account officer? This action cannot be undone.
              </p>
              {form.currentClients > 0 && (
                <p style={{ 
                  margin: "0", 
                  color: "#dc2626", 
                  fontSize: "14px",
                  fontWeight: "500"
                }}>
                  <strong>Warning:</strong> This account officer has {form.currentClients} active clients. 
                  Please reassign them before deleting.
                </p>
              )}
            </div>
            <div style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px"
            }}>
              <button 
                onClick={() => setShowDeleteModal(false)}
                style={{
                  padding: "8px 16px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  backgroundColor: "white",
                  color: "#374151",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500"
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                disabled={loading}
                style={{
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: "6px",
                  backgroundColor: loading ? "#9ca3af" : "#dc2626",
                  color: "white",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "500"
                }}
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (isWindowMode) {
    return formContent;
  }

  return (
    <DashboardWrapper>
      {formContent}
    </DashboardWrapper>
  );
}

export default AccountOfficerForm;
