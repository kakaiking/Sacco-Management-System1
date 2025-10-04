import React, { useContext, useEffect, useState, useCallback } from "react";
import { useHistory, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import { FiArrowLeft, FiEdit3, FiTrash2, FiSearch, FiMoreVertical, FiCheck, FiRefreshCw } from "react-icons/fi";
import DashboardWrapper from '../components/DashboardWrapper';
import CurrencyLookupModal from '../components/CurrencyLookupModal';
import ChargeLookupModal from '../components/ChargeLookupModal';
import { useSnackbar } from "../helpers/SnackbarContext";
import { AuthContext } from "../helpers/AuthContext";

function ChargesForm({ id: propId, isWindowMode = false }) {
  const history = useHistory();
  const { id: paramId } = useParams();
  const { search } = useLocation();
  const { authState, isLoading } = useContext(AuthContext);
  const { showMessage } = useSnackbar();
  
  // Use propId if provided (window mode), otherwise use paramId from URL
  const id = propId || paramId;
  
  const isEdit = new URLSearchParams(search).get("edit") === "1";
  const isCreate = id === "new";
  const isViewingSpecificCharge = id && id !== "new";

  // Form mode state: 'create', 'view', 'edit'
  const [formMode, setFormMode] = useState(
    isCreate ? 'create' : 
    (isEdit ? 'edit' : 
    (isViewingSpecificCharge ? 'view' : 'create'))
  );

  // Update form mode when URL parameters change
  useEffect(() => {
    const newIsCreate = id === "new";
    const newIsEdit = new URLSearchParams(search).get("edit") === "1";
    const newIsViewingSpecificCharge = id && id !== "new";
    const newFormMode = newIsCreate ? 'create' : 
                       (newIsEdit ? 'edit' : 
                       (newIsViewingSpecificCharge ? 'view' : 'create'));
    setFormMode(newFormMode);
  }, [id, search]);

  // Actions dropdown state
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [verifierRemarks, setVerifierRemarks] = useState("");
  
  // Audit fields visibility state
  const [showAuditFields, setShowAuditFields] = useState(false);
  
  const [form, setForm] = useState({
    chargeId: '',
    name: '',
    currency: '',
    amount: '',
    status: 'Active',
    createdBy: '',
    createdOn: '',
    modifiedBy: '',
    modifiedOn: '',
    approvedBy: '',
    approvedOn: '',
    verifierRemarks: ''
  });
  
  const [, setLoading] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [isChargeLookupModalOpen, setIsChargeLookupModalOpen] = useState(false);
  const [selectedCharge, setSelectedCharge] = useState(null);

  // Define fetchCharge function
  const fetchCharge = useCallback(async (chargeId) => {
    try {
      const response = await axios.get(`http://localhost:3001/charges/${chargeId}`, {
        headers: { accessToken: localStorage.getItem("accessToken") }
      });
      setForm(response.data);
      setSelectedCharge({ chargeId: response.data.chargeId, name: response.data.name });
      return response.data;
    } catch (error) {
      showMessage("Error fetching charge details", "error");
    }
  }, [showMessage]);

  useEffect(() => {
    if (!isLoading && !authState.status) {
      if (!isWindowMode) {
        history.push("/login");
      }
    }
    
    if (id && id !== 'new') {
      fetchCharge(id);
    } else if (isCreate) {
      // Generate Charge ID for new charges
      const generateChargeId = () => {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `CHG-${timestamp}${random}`;
      };
      setForm(prev => ({ ...prev, chargeId: generateChargeId() }));
    }
  }, [authState, isLoading, history, id, isCreate, fetchCharge, isWindowMode]);

  // Handle charge selection from lookup modal
  const handleSelectCharge = (charge) => {
    setSelectedCharge({ chargeId: charge.chargeId, name: charge.name });
    fetchCharge(charge.chargeId);
    setFormMode('view');
  };

  // Clear form and return to create mode
  const handleClearForm = () => {
    const generateChargeId = () => {
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `CHG-${timestamp}${random}`;
    };
    
    setForm({
      chargeId: generateChargeId(),
      name: '',
      currency: '',
      amount: '',
      status: 'Active',
      createdBy: '',
      createdOn: '',
      modifiedBy: '',
      modifiedOn: '',
      approvedBy: '',
      approvedOn: '',
      verifierRemarks: ''
    });
    setSelectedCharge(null);
    setSelectedCurrency(null);
    setFormMode('create');
    setShowActionsDropdown(false);
  };

  // Handle edit action
  const handleEdit = () => {
    setFormMode('edit');
    setShowActionsDropdown(false);
  };

  // Handle delete action
  const handleDeleteClick = () => {
    setShowDeleteModal(true);
    setShowActionsDropdown(false);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`http://localhost:3001/charges/${form.chargeId}`, {
        headers: { accessToken: localStorage.getItem("accessToken") }
      });
      showMessage("Charge deleted successfully", "success");
      handleClearForm();
      setShowDeleteModal(false);
    } catch (error) {
      showMessage(error.response?.data?.error || "Failed to delete charge", "error");
    }
  };

  // Handle approve action
  const handleApprove = () => {
    setShowApprovalModal(true);
    setShowActionsDropdown(false);
  };

  const confirmApprove = async () => {
    try {
      await axios.patch(`http://localhost:3001/charges/${form.chargeId}/status`, {
        status: 'Active',
        verifierRemarks: verifierRemarks
      }, {
        headers: { accessToken: localStorage.getItem("accessToken") }
      });
      showMessage("Charge approved successfully", "success");
      setForm(prev => ({ ...prev, status: 'Active', verifierRemarks: verifierRemarks }));
      setVerifierRemarks("");
      setShowApprovalModal(false);
    } catch (error) {
      showMessage(error.response?.data?.error || "Failed to approve charge", "error");
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("accessToken");
      
      if (formMode === 'edit') {
        await axios.put(`http://localhost:3001/charges/${form.chargeId}`, form, {
          headers: { accessToken: token }
        });
        showMessage("Charge updated successfully", "success");
        await fetchCharge(form.chargeId);
        setFormMode('view');
      } else {
        await axios.post("http://localhost:3001/charges", form, {
          headers: { accessToken: token }
        });
        showMessage("Charge created successfully", "success");
        if (!isWindowMode) {
          history.push("/charges-management");
        } else {
          // In window mode, fetch the newly created charge and switch to view mode
          await fetchCharge(form.chargeId);
          setFormMode('view');
        }
      }
    } catch (error) {
      showMessage(error.response?.data?.error || "An error occurred", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCurrencySelect = (currency) => {
    setSelectedCurrency(currency);
    setForm({ ...form, currency: currency.currencyCode });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return { bg: "rgba(16, 185, 129, 0.2)", color: "#059669", border: "rgba(16, 185, 129, 0.3)" };
      case "Inactive":
        return { bg: "rgba(239, 68, 68, 0.2)", color: "#dc2626", border: "rgba(239, 68, 68, 0.3)" };
      case "Pending":
        return { bg: "rgba(6, 182, 212, 0.2)", color: "#0891b2", border: "rgba(6, 182, 212, 0.3)" };
      default:
        return { bg: "rgba(107, 114, 128, 0.2)", color: "#6b7280", border: "rgba(107, 114, 128, 0.3)" };
    }
  };

  const statusColors = getStatusColor(form.status);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const dropdown = document.querySelector('[data-actions-dropdown]');
      if (dropdown && !dropdown.contains(event.target)) {
        setShowActionsDropdown(false);
      }
    };

    if (showActionsDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showActionsDropdown]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Loading...
      </div>
    );
  }

  const formContent = (
    <>
      {!isWindowMode && (
        <header className="header">
          <div className="header__left">
            <button className="iconBtn" onClick={() => history.push("/charges-management")} title="Back" aria-label="Back" style={{ marginRight: 8 }}>
              <FiArrowLeft className="icon" style={{ fontWeight: "bolder" }}/>
            </button>
            <div className="greeting">{formMode === 'create' ? "Add Charge" : (formMode === 'edit' ? "Update Charge Details" : "View Charge Details")}</div>
          </div>
        </header>
      )}

      <main className="dashboard__content" style={isWindowMode ? { padding: '20px', height: '100%', overflow: 'auto' } : {}}>
        <section className="card" style={{ padding: "24px" }}>
          <form onSubmit={save}>
            {/* Charge Lookup - Topmost Element */}
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
                    Charge
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                    <div className="combined-member-input" style={{ flex: 1 }}>
                      <div className="member-no-section">
                        {selectedCharge ? selectedCharge.chargeId : "Select a charge"}
                      </div>
                      <div className="member-name-section">
                        {selectedCharge ? selectedCharge.name : ""}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="search-icon-external"
                      onClick={() => setIsChargeLookupModalOpen(true)}
                      title="Search charges"
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
                      backgroundColor: statusColors.bg,
                      color: statusColors.color,
                      border: `1px solid ${statusColors.border}`
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
                          onClick={handleApprove}
                          disabled={form.status === "Active"}
                          style={{
                            width: "100%",
                            padding: "12px 16px",
                            border: "none",
                            backgroundColor: "transparent",
                            textAlign: "left",
                            cursor: form.status === "Active" ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            fontSize: "14px",
                            color: form.status === "Active" ? "var(--text-disabled)" : "var(--text-primary)",
                            transition: "background-color 0.2s ease",
                            opacity: form.status === "Active" ? 0.5 : 1
                          }}
                          onMouseEnter={(e) => {
                            if (form.status !== "Active") {
                              e.target.style.backgroundColor = "var(--surface-2)";
                            }
                          }}
                          onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                        >
                          <FiCheck style={{ color: form.status === "Active" ? "var(--text-disabled)" : "var(--success-600)" }} />
                          Approve
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
                          onClick={handleDeleteClick}
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
                          <FiTrash2 style={{ color: "var(--danger-600)" }} />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Horizontal Rule below charge lookup */}
            <hr style={{ margin: "24px 0", border: "none", borderTop: "1px solid #e0e0e0" }} />

            {/* Form Fields */}
            <div className="grid2">
              <label style={{ fontWeight: "600", color: "var(--primary-700)" }}>
                Charge Name
                <input 
                  className="input" 
                  value={form.name} 
                  onChange={e => setForm({ ...form, name: e.target.value })} 
                  required 
                  disabled={formMode === 'view'} 
                />
              </label>

              <label style={{ fontWeight: "600", color: "var(--primary-700)" }}>
                Currency
                <div className="role-input-wrapper">
                  <input 
                    type="text"
                    className="input" 
                    value={selectedCurrency ? `${selectedCurrency.currencyCode} - ${selectedCurrency.currencyName}` : form.currency}
                    readOnly
                    placeholder="Select currency"
                    required
                  />
                  {(formMode === 'create' || formMode === 'edit') && (
                    <button
                      type="button"
                      className="role-search-btn"
                      onClick={() => setShowCurrencyModal(true)}
                      title="Search currencies"
                    >
                      <FiSearch />
                    </button>
                  )}
                </div>
              </label>

              <label style={{ fontWeight: "600", color: "var(--primary-700)" }}>
                Amount
                <input 
                  className="input" 
                  type="number"
                  value={form.amount} 
                  onChange={e => setForm({ ...form, amount: e.target.value })} 
                  required 
                  min="0"
                  step="0.01"
                  disabled={formMode === 'view'} 
                />
              </label>
            </div>

            {/* Submit Button */}
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
                  {formMode === 'create' ? "Add Charge" : "Update Charge"}
                </button>
              </div>
            )}

            {/* Audit Fields Section */}
            <hr style={{ margin: "24px 0", border: "none", borderTop: "1px solid #e0e0e0" }} />

            {/* Collapsible Audit Fields Header */}
            <div 
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
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
                <label style={{ fontWeight: "600", color: "var(--primary-700)" }}>
                  Created On
                  <input 
                    className="input"
                    value={form.createdOn ? new Date(form.createdOn).toLocaleString() : ""}
                    disabled={true}
                  />
                </label>

                <label style={{ fontWeight: "600", color: "var(--primary-700)" }}>
                  Modified On
                  <input 
                    className="input"
                    value={form.modifiedOn ? new Date(form.modifiedOn).toLocaleString() : ""}
                    disabled={true}
                  />
                </label>

                <label style={{ fontWeight: "600", color: "var(--primary-700)" }}>
                  Approved On
                  <input 
                    className="input"
                    value={form.approvedOn ? new Date(form.approvedOn).toLocaleString() : ""}
                    disabled={true}
                  />
                </label>

                <label style={{ fontWeight: "600", color: "var(--primary-700)" }}>
                  Created By
                  <input 
                    className="input"
                    value={form.createdBy || ""}
                    disabled={true}
                  />
                </label>
                
                <label style={{ fontWeight: "600", color: "var(--primary-700)" }}>
                  Modified By
                  <input 
                    className="input"
                    value={form.modifiedBy || ""}
                    disabled={true}
                  />
                </label>
                
                <label style={{ fontWeight: "600", color: "var(--primary-700)" }}>
                  Approved By
                  <input 
                    className="input"
                    value={form.approvedBy || ""}
                    disabled={true}
                  />
                </label>

                {form.verifierRemarks && (
                  <div style={{ gridColumn: "1 / -1", marginTop: "8px" }}>
                    <label style={{ fontWeight: "600", color: "var(--primary-700)" }}>
                      Verifier Remarks
                      <div style={{ 
                        marginTop: "8px", 
                        padding: "12px", 
                        backgroundColor: "#f5f5f5", 
                        borderRadius: "8px",
                        fontSize: "14px",
                        border: "1px solid #e0e0e0"
                      }}>
                        {form.verifierRemarks}
                      </div>
                    </label>
                  </div>
                )}
              </div>
            )}
          </form>
        </section>

        {/* Charge Lookup Modal */}
        <ChargeLookupModal
          isOpen={isChargeLookupModalOpen}
          onClose={() => setIsChargeLookupModalOpen(false)}
          onSelectCharge={handleSelectCharge}
        />

        {/* Currency Lookup Modal */}
        <CurrencyLookupModal
          isOpen={showCurrencyModal}
          onClose={() => setShowCurrencyModal(false)}
          onSelectCurrency={handleCurrencySelect}
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
            zIndex: 10000
          }}>
            <div style={{
              backgroundColor: "white",
              padding: "24px",
              borderRadius: "12px",
              width: "90%",
              maxWidth: "500px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
            }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: "600", color: "var(--danger-600)" }}>
                Delete Charge
              </h3>
              <p style={{ marginBottom: "20px", color: "var(--text-secondary)" }}>
                Are you sure you want to delete charge <strong>{form.chargeId}</strong>? This action cannot be undone.
              </p>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  type="button"
                  className="pill"
                  onClick={() => setShowDeleteModal(false)}
                  style={{ padding: "8px 16px", fontSize: "14px" }}
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
                    backgroundColor: "var(--danger-600)",
                    color: "white"
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Approval Confirmation Modal */}
        {showApprovalModal && (
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
            zIndex: 10000
          }}>
            <div style={{
              backgroundColor: "white",
              padding: "24px",
              borderRadius: "12px",
              width: "90%",
              maxWidth: "500px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
            }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: "600", color: "var(--primary-700)" }}>
                Approve Charge
              </h3>
              <p style={{ marginBottom: "20px", color: "var(--text-secondary)" }}>
                You are about to approve charge <strong>{form.chargeId}</strong>.
              </p>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "var(--primary-700)" }}>
                  Verifier Remarks:
                </label>
                <textarea
                  value={verifierRemarks}
                  onChange={(e) => setVerifierRemarks(e.target.value)}
                  placeholder="Enter remarks for this approval..."
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
                  onClick={() => setShowApprovalModal(false)}
                  style={{ padding: "8px 16px", fontSize: "14px" }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="pill"
                  onClick={confirmApprove}
                  style={{
                    padding: "8px 16px",
                    fontSize: "14px",
                    backgroundColor: "var(--success-600)",
                    color: "white"
                  }}
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );

  return isWindowMode ? formContent : <DashboardWrapper>{formContent}</DashboardWrapper>;
}

export default ChargesForm;
