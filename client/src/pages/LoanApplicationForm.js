import React, { useContext, useEffect, useState } from "react";
import { useHistory, useParams, useLocation } from "react-router-dom";
import { FiArrowLeft, FiSearch, FiEdit3, FiTrash2 } from "react-icons/fi";
import axios from "axios";
import { useSnackbar } from "../helpers/SnackbarContext";
import { AuthContext } from "../helpers/AuthContext";
import DashboardWrapper from '../components/DashboardWrapper';
import MemberLookupModal from '../components/MemberLookupModal';
import LoanProductLookupModal from '../components/LoanProductLookupModal';
import AccountLookupModal from '../components/AccountLookupModal';
import CollateralLookupModal from '../components/CollateralLookupModal';

function LoanApplicationForm() {
  const history = useHistory();
  const { id } = useParams();
  const location = useLocation();
  const { authState, isLoading } = useContext(AuthContext);
  const { showMessage } = useSnackbar();

  const [form, setForm] = useState({
    loanApplicationId: "",
    loanName: "",
    memberId: "",
    memberDisplay: "",
    productId: "",
    productDisplay: "",
    loanAmount: "",
    mainRepaymentAccountId: "",
    mainRepaymentAccountDisplay: "",
    collateralId: "",
    collateralDisplay: "",
    status: "Pending Appraisal",
    createdBy: "",
    createdOn: "",
    modifiedBy: "",
    modifiedOn: "",
    approvedBy: "",
    approvedOn: "",
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isGuarantorModalOpen, setIsGuarantorModalOpen] = useState(false);
  const [isCollateralModalOpen, setIsCollateralModalOpen] = useState(false);
  
  // Guarantors state
  const [guarantors, setGuarantors] = useState([]);
  const [guarantorForm, setGuarantorForm] = useState({
    memberId: "",
    memberDisplay: "",
    percentage: "",
  });
  const [editingGuarantorIndex, setEditingGuarantorIndex] = useState(-1);
  
  // Determine if we're in edit/view mode
  const isEditMode = id && location.search.includes('edit=1');
  const isViewMode = id && !location.search.includes('edit=1');
  const isCreate = !id;
  
  // Tab state
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    // Only redirect if authentication check is complete and user is not authenticated
    if (!isLoading && !authState.status) {
      history.push("/login");
    }
  }, [authState, isLoading, history]);

  // Fetch existing loan application data when in edit/view mode
  useEffect(() => {
    if (id && (isEditMode || isViewMode)) {
      const fetchLoanApplication = async () => {
        setLoading(true);
        try {
          const response = await axios.get(`http://localhost:3001/loan-applications/${id}`, {
            headers: { accessToken: localStorage.getItem('accessToken') }
          });
          
          const loanApplication = response.data.entity || response.data;
          
          // Populate form with existing data
          setForm({
            loanApplicationId: loanApplication.loanApplicationId || "",
            loanName: loanApplication.loanName || "",
            memberId: loanApplication.memberId || "",
            memberDisplay: loanApplication.member ? 
              `${loanApplication.member.memberNo} - ${loanApplication.member.firstName} ${loanApplication.member.lastName}` : "",
            productId: loanApplication.productId || "",
            productDisplay: loanApplication.product ? 
              `${loanApplication.product.loanProductId} - ${loanApplication.product.loanProductName}` : "",
            loanAmount: loanApplication.loanAmount || "",
            mainRepaymentAccountId: loanApplication.mainRepaymentAccountId || "",
            mainRepaymentAccountDisplay: loanApplication.mainRepaymentAccount ? 
              `${loanApplication.mainRepaymentAccount.accountId} - ${loanApplication.mainRepaymentAccount.accountName}` : "",
            collateralId: loanApplication.collateralId || "",
            collateralDisplay: loanApplication.collateral ? 
              `${loanApplication.collateral.collateralId} - ${loanApplication.collateral.description}` : "",
            status: loanApplication.status || "Pending Appraisal",
            createdBy: loanApplication.createdBy || "",
            createdOn: loanApplication.createdOn || "",
            modifiedBy: loanApplication.modifiedBy || "",
            modifiedOn: loanApplication.modifiedOn || "",
            approvedBy: loanApplication.approvedBy || "",
            approvedOn: loanApplication.approvedOn || "",
          });
          
          // Load guarantors data if available
          let guarantorsData = [];
          if (loanApplication.guarantors) {
            try {
              // If guarantors is a string (JSON), parse it
              guarantorsData = typeof loanApplication.guarantors === 'string' 
                ? JSON.parse(loanApplication.guarantors) 
                : loanApplication.guarantors;
              // Ensure it's an array
              guarantorsData = Array.isArray(guarantorsData) ? guarantorsData : [];
            } catch (error) {
              console.error('Error parsing guarantors data:', error);
              guarantorsData = [];
            }
          }
          setGuarantors(guarantorsData);
        } catch (error) {
          console.error('Error fetching loan application:', error);
          const errorMessage = error.response?.data?.message || "Failed to fetch loan application";
          showMessage(errorMessage, "error");
          history.push("/loan-appraisal-maintenance");
        } finally {
          setLoading(false);
        }
      };
      
      fetchLoanApplication();
    } else if (isCreate) {
      // Generate loan application ID for new applications
      setForm(prev => ({ ...prev, loanApplicationId: generateLoanApplicationId() }));
    }
  }, [id, isEditMode, isViewMode, isCreate, history, showMessage]);

  // Generate Loan Application ID for new applications
  const generateLoanApplicationId = () => {
    const randomNum = Math.floor(1000000 + Math.random() * 9000000); // 7 digits
    return `LA-${randomNum}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.memberId) {
      showMessage("Please select a member", "error");
      return;
    }
    
    if (!form.productId) {
      showMessage("Please select a loan product", "error");
      return;
    }
    
    if (!form.loanAmount || parseFloat(form.loanAmount) <= 0) {
      showMessage("Please enter a valid loan amount", "error");
      return;
    }

    // Make main repayment account optional for testing
    // if (!form.mainRepaymentAccountId) {
    //   showMessage("Please select a main repayment account", "error");
    //   return;
    // }

    // Validate guarantor limits
    const guarantorValidation = validateGuarantorLimits();
    if (!guarantorValidation.isValid) {
      showMessage(guarantorValidation.message, "error");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        loanName: form.loanName,
        memberId: form.memberId,
        productId: form.productId,
        loanAmount: parseFloat(form.loanAmount),
        mainRepaymentAccountId: form.mainRepaymentAccountId,
        collateralId: form.collateralId,
        guarantors: guarantors,
        status: form.status,
      };

      let response;
      if (isEditMode) {
        // Update existing loan application
        response = await axios.put(`http://localhost:3001/loan-applications/${id}`, payload, {
          headers: { accessToken: localStorage.getItem('accessToken') }
        });
        showMessage("Loan application updated successfully!", "success");
      } else {
        // Create new loan application
        payload.loanApplicationId = generateLoanApplicationId();
        payload.createdBy = authState.username || "System";
        payload.createdOn = new Date().toISOString();
        
        response = await axios.post('http://localhost:3001/loan-applications', payload, {
          headers: { accessToken: localStorage.getItem('accessToken') }
        });
        showMessage("Loan application submitted successfully!", "success");
      }
      
      // Navigate back to loan appraisal maintenance
      history.push("/loan-appraisal-maintenance");
      
    } catch (error) {
      console.error('Error submitting loan application:', error);
      const errorMessage = error.response?.data?.message || 
        (isEditMode ? "Failed to update loan application" : "Failed to submit loan application");
      showMessage(errorMessage, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenMemberModal = () => {
    setIsMemberModalOpen(true);
  };

  const handleSelectMember = (member) => {
    const newForm = {
      ...form,
      memberId: member.id,
      memberDisplay: `${member.memberNo} - ${member.firstName} ${member.lastName}`
    };
    
    // Generate loan name if both member and product are selected
    if (form.productId && form.productDisplay) {
      const productName = form.productDisplay.split(' - ')[1]; // Extract product name from display
      newForm.loanName = `${member.firstName} ${productName}`;
    }
    
    setForm(newForm);
  };

  const handleOpenProductModal = () => {
    setIsProductModalOpen(true);
  };

  const handleSelectProduct = (product) => {
    const newForm = {
      ...form,
      productId: product.id,
      productDisplay: `${product.loanProductId} - ${product.loanProductName}`
    };
    
    // Generate loan name if both member and product are selected
    if (form.memberId && form.memberDisplay) {
      const memberName = form.memberDisplay.split(' - ')[1].split(' ')[0]; // Extract first name from display
      newForm.loanName = `${memberName} ${product.loanProductName}`;
    }
    
    setForm(newForm);
  };

  // Account selection handler
  const handleSelectAccount = (account) => {
    setForm({
      ...form,
      mainRepaymentAccountId: account.id,
      mainRepaymentAccountDisplay: `${account.accountId} - ${account.accountName}`
    });
    setIsAccountModalOpen(false);
  };

  // Collateral selection handler
  const handleSelectCollateral = (collateral) => {
    setForm({
      ...form,
      collateralId: collateral.id,
      collateralDisplay: `${collateral.collateralId} - ${collateral.description}`
    });
    setIsCollateralModalOpen(false);
  };

  // Guarantor management functions
  const addGuarantor = (e) => {
    e.preventDefault();
    if (!guarantorForm.memberId || !guarantorForm.percentage) {
      showMessage("Please fill in all guarantor fields", "error");
      return;
    }
    
    const percentage = parseFloat(guarantorForm.percentage);
    if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
      showMessage("Percentage must be between 1 and 100", "error");
      return;
    }
    
    // Check if the selected guarantor is the same as the loan applicant
    if (guarantorForm.memberId === form.memberId) {
      showMessage("A member cannot be their own guarantor", "error");
      return;
    }
    
    // Check for duplicate guarantors (excluding the one being edited)
    const existingGuarantors = Array.isArray(guarantors) ? guarantors : [];
    const isDuplicate = existingGuarantors.some((g, index) => 
      g.memberId === guarantorForm.memberId && index !== editingGuarantorIndex
    );
    
    if (isDuplicate) {
      showMessage("This member is already a guarantor", "error");
      return;
    }
    
    // Calculate current total percentage (excluding the one being edited)
    const currentTotal = existingGuarantors.reduce((sum, g, index) => {
      if (index === editingGuarantorIndex) return sum; // Exclude the one being edited
      return sum + parseFloat(g.percentage || 0);
    }, 0);
    
    if (currentTotal + percentage > 100) {
      showMessage(`Total percentage cannot exceed 100%. Current total: ${currentTotal.toFixed(2)}%`, "error");
      return;
    }
    
    if (editingGuarantorIndex >= 0) {
      // Update existing guarantor
      const updated = [...existingGuarantors];
      updated[editingGuarantorIndex] = { ...guarantorForm };
      setGuarantors(updated);
      setEditingGuarantorIndex(-1);
      showMessage("Guarantor updated successfully", "success");
    } else {
      // Add new guarantor
      setGuarantors([...existingGuarantors, { ...guarantorForm }]);
      showMessage("Guarantor added successfully", "success");
    }
    
    // Reset form
    setGuarantorForm({
      memberId: "",
      memberDisplay: "",
      percentage: "",
    });
  };

  const editGuarantor = (index) => {
    if (Array.isArray(guarantors) && guarantors[index]) {
      const guarantor = guarantors[index];
      setGuarantorForm({ ...guarantor });
      setEditingGuarantorIndex(index);
    }
  };

  const deleteGuarantor = (index) => {
    if (Array.isArray(guarantors)) {
      setGuarantors(guarantors.filter((_, i) => i !== index));
      showMessage("Guarantor deleted successfully", "success");
    }
  };

  const handleSelectGuarantor = (member) => {
    setGuarantorForm({
      ...guarantorForm,
      memberId: member.id,
      memberDisplay: `${member.memberNo} - ${member.firstName} ${member.lastName}`
    });
    setIsGuarantorModalOpen(false);
  };

  // Validation function for guarantor limits
  const validateGuarantorLimits = () => {
    if (!form.productId) return { isValid: false, message: "Please select a loan product first" };
    
    // Use default limits for now - in a real implementation, you would fetch product details
    // to get the actual minGuarantors and maxGuarantors from the selected loan product
    const minGuarantors = 0; // Allow no guarantors for flexibility
    const maxGuarantors = 5; // Default maximum
    
    if (!Array.isArray(guarantors)) {
      return { isValid: false, message: "Guarantors data is invalid" };
    }
    
    // Check for duplicate guarantors
    const memberIds = guarantors.map(g => g.memberId).filter(id => id);
    const uniqueMemberIds = [...new Set(memberIds)];
    if (memberIds.length !== uniqueMemberIds.length) {
      return { isValid: false, message: "Duplicate guarantors are not allowed" };
    }
    
    // Check if applicant is trying to be their own guarantor
    if (memberIds.includes(form.memberId)) {
      return { isValid: false, message: "A member cannot be their own guarantor" };
    }
    
    if (guarantors.length < minGuarantors) {
      return { isValid: false, message: `Minimum ${minGuarantors} guarantor(s) required` };
    }
    
    if (guarantors.length > maxGuarantors) {
      return { isValid: false, message: `Maximum ${maxGuarantors} guarantor(s) allowed` };
    }
    
    // Validate individual guarantor percentages
    for (let i = 0; i < guarantors.length; i++) {
      const guarantor = guarantors[i];
      const percentage = parseFloat(guarantor.percentage || 0);
      
      if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
        return { isValid: false, message: `Guarantor ${i + 1} percentage must be between 1 and 100` };
      }
      
      if (!guarantor.memberId || !guarantor.memberDisplay) {
        return { isValid: false, message: `Guarantor ${i + 1} member information is incomplete` };
      }
    }
    
    // Only validate percentage total if there are guarantors
    if (Array.isArray(guarantors) && guarantors.length > 0) {
      const totalPercentage = guarantors.reduce((sum, g) => sum + parseFloat(g.percentage || 0), 0);
      if (Math.abs(totalPercentage - 100) > 0.01) { // Allow for small floating point differences
        return { isValid: false, message: `Total guarantor percentage must equal 100%. Current total: ${totalPercentage.toFixed(2)}%` };
      }
    }
    
    return { isValid: true };
  };

  if (isLoading || (id && loading)) {
    return (
      <DashboardWrapper>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <div>Loading loan application...</div>
        </div>
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper>
      <header className="header">
        <div className="header__left">
          <button className="iconBtn" onClick={() => history.push("/loan-appraisal-maintenance")} title="Back" aria-label="Back" style={{ marginRight: 8 }}>
            <FiArrowLeft className="icon" style={{ fontWeight: "bolder" }}/>
          </button>
          <div className="greeting">{isCreate ? "Add Loan Application" : (isEditMode ? "Update Loan Application Details" : "View Loan Application Details")}</div>
        </div>
      </header>

      <main className="dashboard__content">
        <form className="card" onSubmit={handleSubmit} style={{ display: "grid", gap: 12, padding: 16 }}>
          {/* Application ID and Application Name at the top */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "1fr auto", 
            gap: "20px",
            marginBottom: "12px",
            alignItems: "start"
          }}>
            <div style={{ display: "grid", gap: "12px" }}>
              <label>
                Application ID
                <input className="inputa"
                  value={form.loanApplicationId || ""}
                  onChange={e => setForm({ ...form, loanApplicationId: e.target.value })}
                  required
                  disabled={true}
                />
              </label>
              <label>
                Application Name
                <input
                  className="inputa"
                  value={form.loanName || ""}
                  disabled={true}
                  placeholder="Auto-generated"
                />
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontWeight: "600", color: "var(--primary-700)", minWidth: "60px" }}>
                  Status:
                </span>
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
                      form.status === "Approved" ? "rgba(16, 185, 129, 0.2)" :
                      form.status === "Pending Appraisal" ? "rgba(6, 182, 212, 0.2)" :
                      form.status === "Rejected" ? "rgba(239, 68, 68, 0.2)" :
                      "rgba(107, 114, 128, 0.2)",
                    color: 
                      form.status === "Approved" ? "#059669" :
                      form.status === "Pending Appraisal" ? "#0891b2" :
                      form.status === "Rejected" ? "#dc2626" :
                      "#6b7280",
                    border: `1px solid ${
                      form.status === "Approved" ? "rgba(16, 185, 129, 0.3)" :
                      form.status === "Pending Appraisal" ? "rgba(6, 182, 212, 0.3)" :
                      form.status === "Rejected" ? "rgba(239, 68, 68, 0.3)" :
                      "rgba(107, 114, 128, 0.3)"
                    }`
                  }}
                >
                  {form.status || "Pending Appraisal"}
                </div>
              </div>
            </div>
            
            {/* Application Icon Display */}
            <div style={{
              width: "120px",
              height: "120px",
              borderRadius: "12px",
              border: "2px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "var(--surface-2)",
              overflow: "hidden",
              position: "relative"
            }}>
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--muted-text)",
                textAlign: "center"
              }}>
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>📋</div>
                <div style={{ fontSize: "12px", fontWeight: "600" }}>
                  Loan Application
                </div>
              </div>
            </div>          
          </div> 

          {/* Tab Navigation */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            marginBottom: "16px",
            backgroundColor: "#f8f9fa",
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
                transition: "all 0.2s ease",
                margin: "0 2px"
              }}
            >
              Application Details
            </div>
            <div
              onClick={() => setActiveTab("security")}
              style={{
                padding: "12px 24px",
                color: activeTab === "security" ? "#007bff" : "#666",
                cursor: "pointer",
                fontWeight: activeTab === "security" ? "600" : "400",
                background: activeTab === "security" ? "#e3f2fd" : "transparent",
                border: "1px solid transparent",
                borderRadius: "6px",
                fontSize: "14px",
                transition: "all 0.2s ease",
                margin: "0 2px"
              }}
            >
              Loan Security
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "details" && (
            <div>
              <div className="grid2">
                <label>Member *
                  <div className="role-input-wrapper">
                    <input
                      className="input"
                      value={form.memberDisplay}
                      disabled={true}
                      placeholder="Select a member"
                      readOnly={true}
                      required
                    />
                    {(isCreate || isEditMode) && (
                      <button
                        type="button"
                        className="role-search-btn"
                        onClick={handleOpenMemberModal}
                        title="Search members"
                      >
                        <FiSearch />
                      </button>
                    )}
                  </div>
                </label>
                <label>Loan Product *
                  <div className="role-input-wrapper">
                    <input
                      className="input"
                      value={form.productDisplay}
                      disabled={true}
                      placeholder="Select a loan product"
                      readOnly={true}
                      required
                    />
                    {(isCreate || isEditMode) && (
                      <button
                        type="button"
                        className="role-search-btn"
                        onClick={handleOpenProductModal}
                        title="Search loan products"
                      >
                        <FiSearch />
                      </button>
                    )}
                  </div>
                </label>
                <label>Loan Amount (KES) *
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.loanAmount}
                    onChange={e => setForm({ ...form, loanAmount: e.target.value })}
                    required
                    placeholder="Enter loan amount"
                    disabled={isViewMode}
                    readOnly={isViewMode}
                  />
                </label>
                <label>Main Repayment Account
                  <div className="role-input-wrapper">
                    <input
                      className="input"
                      value={form.mainRepaymentAccountDisplay}
                      disabled={true}
                      placeholder="Select a repayment account (optional)"
                      readOnly={true}
                    />
                    {(isCreate || isEditMode) && (
                      <button
                        type="button"
                        className="role-search-btn"
                        onClick={() => {
                          if (!form.memberId) {
                            showMessage("Please select a member first to view their accounts", "error");
                            return;
                          }
                          setIsAccountModalOpen(true);
                        }}
                        title="Search member accounts"
                      >
                        <FiSearch />
                      </button>
                    )}
                  </div>
                </label>
                {/* <label>Status
                  <input
                    className="input"
                    value={form.status}
                    disabled={true}
                    readOnly={true}
                  />
                </label> */}
              </div>
              
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
                <button
                  type="button"
                  className="pill"
                  onClick={() => setActiveTab("security")}
                  style={{
                    padding: "8px 16px",
                    fontSize: "14px",
                    minWidth: "auto"
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div>
              {/* Guarantors Section */}
              <div style={{ marginBottom: "24px" }}>
                <h3 style={{ 
                  marginBottom: "16px", 
                  color: "var(--primary-700)",
                  fontSize: "18px",
                  fontWeight: "600"
                }}>
                  Guarantors
                </h3>
                
                {/* Add/Edit Guarantor Form */}
                {(isCreate || isEditMode) && (
                  <div style={{
                    border: "1px solid #e0e0e0",
                    borderRadius: "8px",
                    padding: "16px",
                    marginBottom: "16px",
                    backgroundColor: "#f8f9fa"
                  }}>
                    <h4 style={{ 
                      marginBottom: "12px", 
                      color: "var(--primary-600)",
                      fontSize: "14px",
                      fontWeight: "600"
                    }}>
                      {editingGuarantorIndex >= 0 ? "Edit Guarantor" : "Add Guarantor"}
                    </h4>
                    
                    <div className="grid2">
                      <label>Guarantor Member *
                        <div className="role-input-wrapper">
                          <input
                            className="input"
                            value={guarantorForm.memberDisplay}
                            disabled={true}
                            placeholder="Select a guarantor member"
                            readOnly={true}
                            required
                          />
                          <button
                            type="button"
                            className="role-search-btn"
                            onClick={() => setIsGuarantorModalOpen(true)}
                            title="Search members"
                          >
                            <FiSearch />
                          </button>
                        </div>
                      </label>
                      <label>Guarantee Percentage *
                        <input
                          className="input"
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={guarantorForm.percentage}
                          onChange={e => setGuarantorForm({ ...guarantorForm, percentage: e.target.value })}
                          placeholder="Enter percentage (1-100)"
                          required
                        />
                      </label>
                    </div>
                    
                    <div style={{ 
                      display: "flex", 
                      gap: "8px", 
                      marginTop: "12px",
                      justifyContent: "flex-end"
                    }}>
                      {editingGuarantorIndex >= 0 && (
                        <button
                          type="button"
                          className="pill"
                          onClick={() => {
                            setEditingGuarantorIndex(-1);
                            setGuarantorForm({
                              memberId: "",
                              memberDisplay: "",
                              percentage: "",
                            });
                          }}
                          style={{
                            padding: "6px 12px",
                            fontSize: "12px",
                            backgroundColor: "#6b7280",
                            color: "white"
                          }}
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="button"
                        className="pill"
                        onClick={addGuarantor}
                        style={{
                          padding: "6px 12px",
                          fontSize: "12px",
                          backgroundColor: editingGuarantorIndex >= 0 ? "#059669" : "#007bff",
                          color: "white"
                        }}
                      >
                        {editingGuarantorIndex >= 0 ? "Update Guarantor" : "Add Guarantor"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Guarantors List */}
                {Array.isArray(guarantors) && guarantors.length > 0 && (
                  <div className="tableContainer">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Member</th>
                          <th>Percentage</th>
                          {(isCreate || isEditMode) && <th>Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {guarantors.map((guarantor, index) => (
                          <tr key={index}>
                            <td>{guarantor.memberDisplay}</td>
                            <td>{guarantor.percentage}%</td>
                            {(isCreate || isEditMode) && (
                              <td>
                                <div style={{ 
                                  display: "flex", 
                                  gap: "8px", 
                                  justifyContent: "center",
                                  alignItems: "center"
                                }}>
                                  <button
                                    type="button"
                                    onClick={() => editGuarantor(index)}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      width: "32px",
                                      height: "32px",
                                      backgroundColor: "#f8fafc",
                                      color: "#f59e0b",
                                      border: "1px solid #e2e8f0",
                                      borderRadius: "8px",
                                      cursor: "pointer",
                                      transition: "all 0.2s ease",
                                      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)"
                                    }}
                                    onMouseEnter={(e) => {
                                      e.target.style.backgroundColor = "#fef3c7";
                                      e.target.style.borderColor = "#f59e0b";
                                      e.target.style.transform = "translateY(-1px)";
                                      e.target.style.boxShadow = "0 4px 8px rgba(245, 158, 11, 0.15)";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.target.style.backgroundColor = "#f8fafc";
                                      e.target.style.borderColor = "#e2e8f0";
                                      e.target.style.transform = "translateY(0)";
                                      e.target.style.boxShadow = "0 1px 2px rgba(0, 0, 0, 0.05)";
                                    }}
                                    title="Edit guarantor"
                                  >
                                    <FiEdit3 size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => deleteGuarantor(index)}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      width: "32px",
                                      height: "32px",
                                      backgroundColor: "#fef2f2",
                                      color: "#ef4444",
                                      border: "1px solid #fecaca",
                                      borderRadius: "8px",
                                      cursor: "pointer",
                                      transition: "all 0.2s ease",
                                      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)"
                                    }}
                                    onMouseEnter={(e) => {
                                      e.target.style.backgroundColor = "#fee2e2";
                                      e.target.style.borderColor = "#ef4444";
                                      e.target.style.transform = "translateY(-1px)";
                                      e.target.style.boxShadow = "0 4px 8px rgba(239, 68, 68, 0.15)";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.target.style.backgroundColor = "#fef2f2";
                                      e.target.style.borderColor = "#fecaca";
                                      e.target.style.transform = "translateY(0)";
                                      e.target.style.boxShadow = "0 1px 2px rgba(0, 0, 0, 0.05)";
                                    }}
                                    title="Delete guarantor"
                                  >
                                    <FiTrash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ 
                      marginTop: "12px", 
                      textAlign: "right", 
                      fontWeight: "600", 
                      color: (Array.isArray(guarantors) ? guarantors.reduce((sum, g) => sum + parseFloat(g.percentage || 0), 0) : 0) === 100 ? "var(--success-700)" : "var(--error-700)",
                      padding: "8px 12px",
                      backgroundColor: (Array.isArray(guarantors) ? guarantors.reduce((sum, g) => sum + parseFloat(g.percentage || 0), 0) : 0) === 100 ? "var(--success-50)" : "var(--error-50)",
                      borderRadius: "6px",
                      border: `1px solid ${(Array.isArray(guarantors) ? guarantors.reduce((sum, g) => sum + parseFloat(g.percentage || 0), 0) : 0) === 100 ? "var(--success-200)" : "var(--error-200)"}`
                    }}>
                      Total: {Array.isArray(guarantors) ? guarantors.reduce((sum, g) => sum + parseFloat(g.percentage || 0), 0) : 0}%
                      {(Array.isArray(guarantors) ? guarantors.reduce((sum, g) => sum + parseFloat(g.percentage || 0), 0) : 0) === 100 ? " ✓" : " (Must equal 100%)"}
                    </div>
                  </div>
                )}

                {/* No Guarantors Message */}
                {(!Array.isArray(guarantors) || guarantors.length === 0) && (
                  <div style={{
                    textAlign: "center",
                    padding: "24px",
                    color: "#6b7280",
                    backgroundColor: "#f9fafb",
                    border: "1px dashed #d1d5db",
                    borderRadius: "8px"
                  }}>
                    <div style={{ fontSize: "16px", marginBottom: "8px" }}>👥</div>
                    <div style={{ fontSize: "14px", fontWeight: "500" }}>No guarantors added yet</div>
                    <div style={{ fontSize: "12px", marginTop: "4px" }}>
                      {(isCreate || isEditMode) ? "Use the form above to add guarantors" : "No guarantors have been assigned to this loan application"}
                    </div>
                  </div>
                )}
              </div>

              {/* Collateral Section */}
              <div style={{ marginBottom: "24px" }}>
                <h3 style={{ 
                  marginBottom: "16px", 
                  color: "var(--primary-700)",
                  fontSize: "18px",
                  fontWeight: "600"
                }}>
                  Collateral
                </h3>
                
                <div className="grid2">
                  <label>Collateral
                    <div className="role-input-wrapper">
                      <input
                        className="input"
                        value={form.collateralDisplay}
                        disabled={true}
                        placeholder="Select a collateral"
                        readOnly={true}
                      />
                      {(isCreate || isEditMode) && (
                        <button
                          type="button"
                          className="role-search-btn"
                          onClick={() => {
                            if (!form.memberId) {
                              showMessage("Please select a member first to view their collaterals", "error");
                              return;
                            }
                            setIsCollateralModalOpen(true);
                          }}
                          title="Search member collaterals"
                        >
                          <FiSearch />
                        </button>
                      )}
                    </div>
                  </label>
                </div>
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px" }}>
                <button
                  type="button"
                  className="pill"
                  onClick={() => setActiveTab("details")}
                  style={{
                    padding: "8px 16px",
                    fontSize: "14px",
                    minWidth: "auto"
                  }}
                >
                  Back
                </button>
                {(isCreate || isEditMode) && (
                  <button
                    className="pill"
                    type="submit"
                    style={{
                      padding: "8px 16px",
                      fontSize: "14px",
                      minWidth: "auto"
                    }}
                    disabled={saving}
                  >
                    {saving ? (isEditMode ? "Updating..." : "Submitting...") : (isEditMode ? "Update Application" : "Submit Application")}
                  </button>
                )}
              </div>
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

      {/* Member Lookup Modal */}
      <MemberLookupModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        onSelectMember={handleSelectMember}
      />

      {/* Loan Product Lookup Modal */}
      <LoanProductLookupModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSelectLoanProduct={handleSelectProduct}
      />

      {/* Account Lookup Modal */}
      <AccountLookupModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onSelectAccount={handleSelectAccount}
        memberId={form.memberId}
      />

      {/* Guarantor Member Lookup Modal */}
      <MemberLookupModal
        isOpen={isGuarantorModalOpen}
        onClose={() => setIsGuarantorModalOpen(false)}
        onSelectMember={handleSelectGuarantor}
      />

      {/* Collateral Lookup Modal */}
      <CollateralLookupModal
        isOpen={isCollateralModalOpen}
        onClose={() => setIsCollateralModalOpen(false)}
        onSelectCollateral={handleSelectCollateral}
        memberId={form.memberId}
      />
    </DashboardWrapper>
  );
}

export default LoanApplicationForm;
