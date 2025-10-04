import React, { useContext, useEffect, useState } from "react";
import { useHistory, useParams, useLocation } from "react-router-dom";
import { FiArrowLeft, FiSearch, FiMoreVertical, FiEdit3, FiTrash2, FiCheck, FiRefreshCw, FiRotateCcw } from "react-icons/fi";
import axios from "axios";
import { useSnackbar } from "../helpers/SnackbarContext";
import { AuthContext } from "../helpers/AuthContext";
import DashboardWrapper from '../components/DashboardWrapper';
import SaccoLookupModal from '../components/SaccoLookupModal';
import InterestTypesLookupModal from '../components/InterestTypesLookupModal';
import InterestFrequencyLookupModal from '../components/InterestFrequencyLookupModal';
import InterestCalculationRulesLookupModal from '../components/InterestCalculationRulesLookupModal';
import ChargesLookupModal from '../components/ChargesLookupModal';
import CurrencyLookupModal from '../components/CurrencyLookupModal';
import ProductLookupModal from '../components/ProductLookupModal';

function SavingsProductsForm({ id: propId, isWindowMode = false }) {
  const history = useHistory();
  const { authState, isLoading } = useContext(AuthContext);
  const { id: paramId } = useParams();
  const { search } = useLocation();
  const { showMessage } = useSnackbar();
  
  // Use prop id if in window mode, otherwise use param id
  const id = isWindowMode ? propId : paramId;
  
  const isEdit = new URLSearchParams(search).get("edit") === "1";
  const isCreate = id === "new";
  const isViewingSpecificProduct = id && id !== "new";

  // Form mode state: 'create', 'view', 'edit'
  const [formMode, setFormMode] = useState(
    isCreate ? 'create' : 
    (isEdit ? 'edit' : 
    (isViewingSpecificProduct ? 'view' : 'create'))
  );

  // Lookup modal states
  const [showProductLookup, setShowProductLookup] = useState(false);
  const [showSaccoLookup, setShowSaccoLookup] = useState(false);
  const [showInterestTypeLookup, setShowInterestTypeLookup] = useState(false);
  const [showInterestFrequencyLookup, setShowInterestFrequencyLookup] = useState(false);
  const [showInterestCalculationRuleLookup, setShowInterestCalculationRuleLookup] = useState(false);
  const [showChargesLookup, setShowChargesLookup] = useState(false);
  const [showCurrencyLookup, setShowCurrencyLookup] = useState(false);

  // Selected data for display
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedInterestType, setSelectedInterestType] = useState(null);
  const [selectedInterestFrequency, setSelectedInterestFrequency] = useState(null);
  const [selectedInterestCalculationRule, setSelectedInterestCalculationRule] = useState(null);
  const [selectedCharges, setSelectedCharges] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState(null);

  // Form state
  const [form, setForm] = useState({
    id: "", // Database ID for updates
    productId: "",
    productName: "",
    saccoId: "",
    productType: "Savings",
    productStatus: "Pending",
    status: "Pending",
    description: "",
    isSpecial: false,
    maxSpecialUsers: "",
    // Account type fields
    accountType: "MEMBER",
    bosaFosa: "BOSA",
    debitCredit: "DEBIT",
    appliedOnMemberOnboarding: false,
    isWithdrawable: true,
    withdrawableFrom: "",
    interestRate: "",
    interestType: "",
    interestCalculationRule: "",
    interestFrequency: "",
    isCreditInterest: false,
    isDebitInterest: false,
    needGuarantors: false,
    maxGuarantors: "",
    minGuarantors: "",
    chargeIds: "",
    currency: "KES",
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
      history.push("/login");
    }
  }, [authState, isLoading, history]);

  // Actions dropdown state
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  
  // Audit fields visibility state
  const [showAuditFields, setShowAuditFields] = useState(false);

  // Auto-populate from auth state
  useEffect(() => {
    if (authState && isCreate) {
      setForm(prev => ({
        ...prev,
        saccoId: authState.saccoId || "",
      }));
    }
  }, [authState, isCreate]);

  // Fetch product data when viewing an existing product
  useEffect(() => {
    const fetchProduct = async () => {
      if (id && id !== 'new') {
        try {
          const response = await axios.get(`http://localhost:3001/products/${id}`, {
            headers: { accessToken: localStorage.getItem('accessToken') }
          });
          
          const product = response.data;
          
          // Set form data
          setForm({
            id: product.id,
            productId: product.productId,
            productName: product.productName || product.name,
            saccoId: product.saccoId || "",
            productType: product.productType || "Savings",
            productStatus: product.productStatus || "Pending",
            status: product.status || "Pending",
            description: product.description || "",
            isSpecial: product.isSpecial || false,
            maxSpecialUsers: product.maxSpecialUsers || "",
            accountType: product.accountType || "MEMBER",
            bosaFosa: product.bosaFosa || "BOSA",
            debitCredit: product.debitCredit || "DEBIT",
            appliedOnMemberOnboarding: product.appliedOnMemberOnboarding || false,
            isWithdrawable: product.isWithdrawable !== undefined ? product.isWithdrawable : true,
            withdrawableFrom: product.withdrawableFrom || "",
            interestRate: product.interestRate || "",
            interestType: product.interestType || "",
            interestCalculationRule: product.interestCalculationRule || "",
            interestFrequency: product.interestFrequency || "",
            isCreditInterest: product.isCreditInterest || false,
            isDebitInterest: product.isDebitInterest || false,
            needGuarantors: product.needGuarantors || false,
            maxGuarantors: product.maxGuarantors || "",
            minGuarantors: product.minGuarantors || "",
            chargeIds: product.chargeIds || "",
            currency: product.currency || "KES",
            createdBy: product.createdBy || "",
            createdOn: product.createdOn || "",
            modifiedBy: product.modifiedBy || "",
            modifiedOn: product.modifiedOn || "",
            approvedBy: product.approvedBy || "",
            approvedOn: product.approvedOn || "",
          });
          
          // Set selected product for display in lookup
          setSelectedProduct(product);
          
          // Set form mode to view
          setFormMode('view');
          
        } catch (error) {
          console.error('Error fetching product:', error);
          showMessage(error.response?.data?.message || 'Error loading product', 'error');
        }
      }
    };
    
    fetchProduct();
  }, [id]);

  // Close actions dropdown when clicking outside
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

  // Lookup handler functions
  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setForm(prev => ({
      ...prev,
      id: product.id, // Database ID for updates
      productId: product.productId, // String ID like "P-123456"
      productName: product.productName || product.name,
      saccoId: product.saccoId || "",
      productType: product.productType || "Savings",
      productStatus: product.productStatus || "Pending",
      status: product.status || "Pending",
      description: product.description || "",
      isSpecial: product.isSpecial || false,
      maxSpecialUsers: product.maxSpecialUsers || "",
      accountType: product.accountType || "MEMBER",
      bosaFosa: product.bosaFosa || "BOSA",
      debitCredit: product.debitCredit || "DEBIT",
      appliedOnMemberOnboarding: product.appliedOnMemberOnboarding || false,
      isWithdrawable: product.isWithdrawable !== undefined ? product.isWithdrawable : true,
      withdrawableFrom: product.withdrawableFrom || "",
      interestRate: product.interestRate || "",
      interestType: product.interestType || "",
      interestCalculationRule: product.interestCalculationRule || "",
      interestFrequency: product.interestFrequency || "",
      isCreditInterest: product.isCreditInterest || false,
      isDebitInterest: product.isDebitInterest || false,
      needGuarantors: product.needGuarantors || false,
      maxGuarantors: product.maxGuarantors || "",
      minGuarantors: product.minGuarantors || "",
      chargeIds: product.chargeIds || "",
      currency: product.currency || "KES",
      createdBy: product.createdBy || "",
      createdOn: product.createdOn || "",
      modifiedBy: product.modifiedBy || "",
      modifiedOn: product.modifiedOn || "",
      approvedBy: product.approvedBy || "",
      approvedOn: product.approvedOn || "",
    }));
    setShowProductLookup(false);
    setFormMode('view'); // Switch to view mode when product is selected
  };

  const handleSelectInterestType = (interestType) => {
    setSelectedInterestType(interestType);
    setForm(prev => ({ ...prev, interestType: interestType.interestTypeId }));
    setShowInterestTypeLookup(false);
  };

  const handleSelectInterestFrequency = (interestFrequency) => {
    setSelectedInterestFrequency(interestFrequency);
    setForm(prev => ({ ...prev, interestFrequency: interestFrequency.interestFrequencyId }));
    setShowInterestFrequencyLookup(false);
  };

  const handleSelectInterestCalculationRule = (calculationRule) => {
    setSelectedInterestCalculationRule(calculationRule);
    setForm(prev => ({ ...prev, interestCalculationRule: calculationRule.ruleId }));
    setShowInterestCalculationRuleLookup(false);
  };

  const handleSelectCharges = (charges) => {
    setSelectedCharges(charges);
    const chargeIds = charges.map(charge => charge.chargeId).join(',');
    setForm(prev => ({ ...prev, chargeIds: chargeIds }));
    setShowChargesLookup(false);
  };

  const handleSelectCurrency = (currency) => {
    setSelectedCurrency(currency);
    setForm(prev => ({ ...prev, currency: currency.currencyCode }));
    setShowCurrencyLookup(false);
  };

  // Action handler functions
  const handleEdit = () => {
    setFormMode('edit');
    setShowActionsDropdown(false);
    showMessage('Form switched to edit mode', 'success');
  };

  const clearForm = () => {
    setForm({
      id: "",
      productId: "",
      productName: "",
      saccoId: "",
      productType: "Savings",
      productStatus: "Pending",
      status: "Pending",
      description: "",
      isSpecial: false,
      maxSpecialUsers: "",
      accountType: "MEMBER",
      bosaFosa: "BOSA",
      debitCredit: "DEBIT",
      appliedOnMemberOnboarding: false,
      isWithdrawable: true,
      withdrawableFrom: "",
      interestRate: "",
      interestType: "",
      interestCalculationRule: "",
      interestFrequency: "",
      isCreditInterest: false,
      isDebitInterest: false,
      needGuarantors: false,
      maxGuarantors: "",
      minGuarantors: "",
      chargeIds: "",
      currency: "KES",
      createdBy: "",
      createdOn: "",
      modifiedBy: "",
      modifiedOn: "",
      approvedBy: "",
      approvedOn: "",
    });
    
    // Clear selected lookup values
    setSelectedProduct(null);
    setSelectedInterestType(null);
    setSelectedInterestFrequency(null);
    setSelectedInterestCalculationRule(null);
    setSelectedCharges([]);
    setSelectedCurrency(null);
    
    // Switch to create mode
    setFormMode('create');
    
    // Close the dropdown
    setShowActionsDropdown(false);
    
    showMessage('Form cleared successfully', 'success');
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Clean up form data: convert empty strings to null for numeric/date fields
      const cleanedForm = { ...form };
      const numericFields = ['maxSpecialUsers', 'interestRate', 'maxGuarantors', 'minGuarantors'];
      const dateFields = ['withdrawableFrom'];
      
      numericFields.forEach(field => {
        if (cleanedForm[field] === '' || cleanedForm[field] === null || cleanedForm[field] === undefined) {
          cleanedForm[field] = null;
        }
      });
      
      dateFields.forEach(field => {
        if (cleanedForm[field] === '' || cleanedForm[field] === null || cleanedForm[field] === undefined) {
          cleanedForm[field] = null;
        }
      });
      
      // Remove productId if it's empty (will be auto-generated by backend)
      if (!cleanedForm.productId || cleanedForm.productId.trim() === '') {
        delete cleanedForm.productId;
      }
      
      if (formMode === 'create') {
        const response = await axios.post('http://localhost:3001/products', cleanedForm, {
          headers: { accessToken: localStorage.getItem('accessToken') }
        });
        showMessage('Product created successfully', 'success');
        
        const createdProduct = response.data.entity;
        
        // Load the created product in view mode
        setForm({
          id: createdProduct.id,
          productId: createdProduct.productId,
          productName: createdProduct.productName || createdProduct.name,
          saccoId: createdProduct.saccoId || "",
          productType: createdProduct.productType || "Savings",
          productStatus: createdProduct.productStatus || "Pending",
          status: createdProduct.status || "Pending",
          description: createdProduct.description || "",
          isSpecial: createdProduct.isSpecial || false,
          maxSpecialUsers: createdProduct.maxSpecialUsers || "",
          accountType: createdProduct.accountType || "MEMBER",
          bosaFosa: createdProduct.bosaFosa || "BOSA",
          debitCredit: createdProduct.debitCredit || "DEBIT",
          appliedOnMemberOnboarding: createdProduct.appliedOnMemberOnboarding || false,
          isWithdrawable: createdProduct.isWithdrawable !== undefined ? createdProduct.isWithdrawable : true,
          withdrawableFrom: createdProduct.withdrawableFrom || "",
          interestRate: createdProduct.interestRate || "",
          interestType: createdProduct.interestType || "",
          interestCalculationRule: createdProduct.interestCalculationRule || "",
          interestFrequency: createdProduct.interestFrequency || "",
          isCreditInterest: createdProduct.isCreditInterest || false,
          isDebitInterest: createdProduct.isDebitInterest || false,
          needGuarantors: createdProduct.needGuarantors || false,
          maxGuarantors: createdProduct.maxGuarantors || "",
          minGuarantors: createdProduct.minGuarantors || "",
          chargeIds: createdProduct.chargeIds || "",
          currency: createdProduct.currency || "KES",
          createdBy: createdProduct.createdBy || "",
          createdOn: createdProduct.createdOn || "",
          modifiedBy: createdProduct.modifiedBy || "",
          modifiedOn: createdProduct.modifiedOn || "",
          approvedBy: createdProduct.approvedBy || "",
          approvedOn: createdProduct.approvedOn || "",
        });
        
        setSelectedProduct(createdProduct);
        setFormMode('view');
        
        if (!isWindowMode) {
          history.push(`/savings-products/${createdProduct.id}`);
        }
      } else if (formMode === 'edit') {
        // Use the product's database ID from the form data, not the URL parameter
        const productDbId = form.id || form.productId;
        if (!productDbId) {
          showMessage('Product ID is missing. Cannot update product.', 'error');
          return;
        }
        await axios.put(`http://localhost:3001/products/${productDbId}`, cleanedForm, {
          headers: { accessToken: localStorage.getItem('accessToken') }
        });
        showMessage('Product updated successfully', 'success');
        setFormMode('view');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      showMessage(error.response?.data?.message || 'Error saving product', 'error');
    }
  };

  const content = (
    <div style={{ padding: "24px" }}>
      {/* Product Lookup - Topmost Element */}
      <div style={{ 
        marginBottom: "24px"
      }}>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: formMode === 'create' ? "1fr auto" : "1fr auto auto", 
          gap: "20px",
          marginBottom: "12px",
          alignItems: "center"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <label style={{ fontWeight: "600", color: "var(--primary-700)", minWidth: "80px" }}>
              Product
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
              <div className="combined-member-input" style={{ flex: 1 }}>
                <div className="member-no-section">
                  {selectedProduct ? selectedProduct.id || selectedProduct.productId : "Select a product"}
                </div>
                <div className="member-name-section">
                  {selectedProduct ? selectedProduct.productName || selectedProduct.name || "" : ""}
                </div>
              </div>
              <button
                type="button"
                className="search-icon-external"
                onClick={() => setShowProductLookup(true)}
                title="Search products"
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
                  form.status === "Approved" ? "rgba(16, 185, 129, 0.2)" :
                  form.status === "Pending" ? "rgba(6, 182, 212, 0.2)" :
                  form.status === "Returned" ? "rgba(249, 115, 22, 0.2)" :
                  form.status === "Rejected" ? "rgba(239, 68, 68, 0.2)" :
                  "rgba(107, 114, 128, 0.2)",
                color: 
                  form.status === "Approved" ? "#059669" :
                  form.status === "Pending" ? "#0891b2" :
                  form.status === "Returned" ? "#ea580c" :
                  form.status === "Rejected" ? "#dc2626" :
                  "#6b7280",
                border: `1px solid ${
                  form.status === "Approved" ? "rgba(16, 185, 129, 0.3)" :
                  form.status === "Pending" ? "rgba(6, 182, 212, 0.3)" :
                  form.status === "Returned" ? "rgba(249, 115, 22, 0.3)" :
                  form.status === "Rejected" ? "rgba(239, 68, 68, 0.3)" :
                  "rgba(107, 114, 128, 0.3)"
                }`
              }}
            >
              {form.status || "Pending"}
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
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit}>
        {/* Description */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
            Description
          </label>
          <textarea
            className="form__textarea"
            value={form.description}
            onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
            disabled={formMode === 'view'}
            placeholder="Enter product description"
            rows="3"
          />
        </div>

        {/* Separator */}
        <hr style={{ margin: "24px 0", border: "none", borderTop: "1px solid var(--border)" }} />

        {/* All Input Fields - 4 Columns */}
        <div className="grid4" style={{ marginBottom: "16px" }}>
          <div>
            <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
              Product Name
            </label>
            <input
              className="input"
              value={form.productName}
              onChange={(e) => setForm(prev => ({ ...prev, productName: e.target.value }))}
              disabled={formMode === 'view'}
              placeholder="Enter product name"
            />
          </div>

          <div>
            <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
              Product Type
            </label>
            <input
              className="input"
              value={form.productType}
              disabled={true}
            />
          </div>

          <div>
            <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
              Max Special Users
            </label>
            <input
              type="number"
              className="input"
              value={form.maxSpecialUsers}
              onChange={(e) => setForm(prev => ({ ...prev, maxSpecialUsers: e.target.value }))}
              disabled={formMode === 'view'}
              placeholder="e.g., 10"
            />
          </div>

          <div>
            <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
              Currency
            </label>
            <div className="role-input-wrapper">
              <input 
                type="text"
                className="input" 
                value={selectedCurrency ? `${selectedCurrency.currencyCode} - ${selectedCurrency.currencyName}` : form.currency} 
                onChange={() => {}} 
                disabled={formMode === 'view'}
                placeholder="Select currency"
                readOnly={true}
              />
              {formMode !== 'view' && (
                <button
                  type="button"
                  className="role-search-btn"
                  onClick={() => setShowCurrencyLookup(true)}
                  title="Search currencies"
                >
                  <FiSearch />
                </button>
              )}
            </div>
          </div>

          <div>
            <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
              Account Type
            </label>
            <select
              className="form__select"
              value={form.accountType}
              onChange={(e) => setForm(prev => ({ ...prev, accountType: e.target.value }))}
              disabled={formMode === 'view'}
            >
              <option value="MEMBER">MEMBER</option>
              <option value="GL">GL</option>
            </select>
          </div>

          <div>
            <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
              BOSA/FOSA
            </label>
            <select
              className="form__select"
              value={form.bosaFosa}
              onChange={(e) => setForm(prev => ({ ...prev, bosaFosa: e.target.value }))}
              disabled={formMode === 'view'}
            >
              <option value="BOSA">BOSA</option>
              <option value="FOSA">FOSA</option>
            </select>
          </div>

          <div>
            <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
              Debit/Credit
            </label>
            <select
              className="form__select"
              value={form.debitCredit}
              onChange={(e) => setForm(prev => ({ ...prev, debitCredit: e.target.value }))}
              disabled={formMode === 'view'}
            >
              <option value="DEBIT">DEBIT</option>
              <option value="CREDIT">CREDIT</option>
            </select>
          </div>

          <div>
            <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
              Interest Rate (%)
            </label>
            <input
              type="number"
              step="0.01"
              className="input"
              value={form.interestRate}
              onChange={(e) => setForm(prev => ({ ...prev, interestRate: e.target.value }))}
              disabled={formMode === 'view'}
              placeholder="e.g., 5.5"
            />
          </div>

          <div>
            <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
              Interest Type
            </label>
            <div className="role-input-wrapper">
              <input
                className="input"
                value={selectedInterestType ? selectedInterestType.interestTypeName : form.interestType}
                onChange={() => {}}
                disabled={formMode === 'view'}
                placeholder="Select interest type"
                readOnly={true}
              />
              {formMode !== 'view' && (
                <button
                  type="button"
                  className="role-search-btn"
                  onClick={() => setShowInterestTypeLookup(true)}
                  title="Search interest types"
                >
                  <FiSearch />
                </button>
              )}
            </div>
          </div>

          <div>
            <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
              Interest Frequency
            </label>
            <div className="role-input-wrapper">
              <input
                className="input"
                value={selectedInterestFrequency ? selectedInterestFrequency.interestFrequencyName : form.interestFrequency}
                onChange={() => {}}
                disabled={formMode === 'view'}
                placeholder="Select interest frequency"
                readOnly={true}
              />
              {formMode !== 'view' && (
                <button
                  type="button"
                  className="role-search-btn"
                  onClick={() => setShowInterestFrequencyLookup(true)}
                  title="Search interest frequencies"
                >
                  <FiSearch />
                </button>
              )}
            </div>
          </div>

          <div>
            <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
              Interest Calculation Rule
            </label>
            <div className="role-input-wrapper">
              <input
                className="input"
                value={selectedInterestCalculationRule ? selectedInterestCalculationRule.ruleName : form.interestCalculationRule}
                onChange={() => {}}
                disabled={formMode === 'view'}
                placeholder="Select calculation rule"
                readOnly={true}
              />
              {formMode !== 'view' && (
                <button
                  type="button"
                  className="role-search-btn"
                  onClick={() => setShowInterestCalculationRuleLookup(true)}
                  title="Search calculation rules"
                >
                  <FiSearch />
                </button>
              )}
            </div>
          </div>

          <div>
            <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
              Withdrawable From
            </label>
            <input
              type="date"
              className="input"
              value={form.withdrawableFrom}
              onChange={(e) => setForm(prev => ({ ...prev, withdrawableFrom: e.target.value }))}
              disabled={formMode === 'view'}
            />
          </div>

          <div>
            <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
              Min Guarantors
            </label>
            <input
              type="number"
              className="input"
              value={form.minGuarantors}
              onChange={(e) => setForm(prev => ({ ...prev, minGuarantors: e.target.value }))}
              disabled={formMode === 'view'}
              placeholder="e.g., 1"
            />
          </div>

          <div>
            <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
              Max Guarantors
            </label>
            <input
              type="number"
              className="input"
              value={form.maxGuarantors}
              onChange={(e) => setForm(prev => ({ ...prev, maxGuarantors: e.target.value }))}
              disabled={formMode === 'view'}
              placeholder="e.g., 3"
            />
          </div>

          <div>
            <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
              Charge IDs
            </label>
            <div className="role-input-wrapper">
              <input
                className="input"
                value={selectedCharges.length > 0 ? selectedCharges.map(c => c.chargeId).join(', ') : form.chargeIds}
                onChange={() => {}}
                disabled={formMode === 'view'}
                placeholder="Select charges"
                readOnly={true}
              />
              {formMode !== 'view' && (
                <button
                  type="button"
                  className="role-search-btn"
                  onClick={() => setShowChargesLookup(true)}
                  title="Search charges"
                >
                  <FiSearch />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* All Checkboxes - 2 rows x 3 columns */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(3, 1fr)", 
          gap: "16px", 
          marginTop: "20px" 
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <input
              type="checkbox"
              id="isSpecial"
              checked={form.isSpecial}
              onChange={(e) => setForm(prev => ({ ...prev, isSpecial: e.target.checked }))}
              disabled={formMode === 'view'}
            />
            <label htmlFor="isSpecial" style={{ margin: 0, cursor: "pointer" }}>
              Is Special
            </label>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <input
              type="checkbox"
              id="appliedOnMemberOnboarding"
              checked={form.appliedOnMemberOnboarding}
              onChange={(e) => setForm(prev => ({ ...prev, appliedOnMemberOnboarding: e.target.checked }))}
              disabled={formMode === 'view'}
            />
            <label htmlFor="appliedOnMemberOnboarding" style={{ margin: 0, cursor: "pointer" }}>
              Applied on Member Onboarding
            </label>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <input
              type="checkbox"
              id="isWithdrawable"
              checked={form.isWithdrawable}
              onChange={(e) => setForm(prev => ({ ...prev, isWithdrawable: e.target.checked }))}
              disabled={formMode === 'view'}
            />
            <label htmlFor="isWithdrawable" style={{ margin: 0, cursor: "pointer" }}>
              Is Withdrawable
            </label>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <input
              type="checkbox"
              id="isCreditInterest"
              checked={form.isCreditInterest}
              onChange={(e) => setForm(prev => ({ ...prev, isCreditInterest: e.target.checked }))}
              disabled={formMode === 'view'}
            />
            <label htmlFor="isCreditInterest" style={{ margin: 0, cursor: "pointer" }}>
              Is Credit Interest
            </label>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <input
              type="checkbox"
              id="isDebitInterest"
              checked={form.isDebitInterest}
              onChange={(e) => setForm(prev => ({ ...prev, isDebitInterest: e.target.checked }))}
              disabled={formMode === 'view'}
            />
            <label htmlFor="isDebitInterest" style={{ margin: 0, cursor: "pointer" }}>
              Is Debit Interest
            </label>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <input
              type="checkbox"
              id="needGuarantors"
              checked={form.needGuarantors}
              onChange={(e) => setForm(prev => ({ ...prev, needGuarantors: e.target.checked }))}
              disabled={formMode === 'view'}
            />
            <label htmlFor="needGuarantors" style={{ margin: 0, cursor: "pointer" }}>
              Need Guarantors
            </label>
          </div>
        </div>

        {/* Create/Update Button */}
        {(formMode === 'create' || formMode === 'edit') && (
          <div style={{ 
            display: "flex", 
            justifyContent: "flex-end", 
            marginTop: "24px"
          }}>
            <button
              type="submit"
              className="pill"
              style={{
                padding: "12px 32px",
                fontSize: "16px",
                fontWeight: "600",
                backgroundColor: "var(--primary-500)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "background-color 0.2s ease",
                minWidth: "180px"
              }}
            >
              {formMode === 'create' ? 'Create Product' : 'Update Product'}
            </button>
          </div>
        )}
      </form>

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

      {/* Lookup Modals */}
      <ProductLookupModal
        isOpen={showProductLookup}
        onClose={() => setShowProductLookup(false)}
        onSelectProduct={handleSelectProduct}
      />
      
      <CurrencyLookupModal
        isOpen={showCurrencyLookup}
        onClose={() => setShowCurrencyLookup(false)}
        onSelectCurrency={handleSelectCurrency}
      />
      
      <InterestTypesLookupModal
        isOpen={showInterestTypeLookup}
        onClose={() => setShowInterestTypeLookup(false)}
        onSelectInterestType={handleSelectInterestType}
      />
      
      <InterestFrequencyLookupModal
        isOpen={showInterestFrequencyLookup}
        onClose={() => setShowInterestFrequencyLookup(false)}
        onSelectInterestFrequency={handleSelectInterestFrequency}
      />
      
      <InterestCalculationRulesLookupModal
        isOpen={showInterestCalculationRuleLookup}
        onClose={() => setShowInterestCalculationRuleLookup(false)}
        onSelectCalculationRule={handleSelectInterestCalculationRule}
      />
      
      <ChargesLookupModal
        isOpen={showChargesLookup}
        onClose={() => setShowChargesLookup(false)}
        onSelectCharges={handleSelectCharges}
        selectedChargeIds={selectedCharges.map(c => c.chargeId)}
      />
    </div>
  );

  if (isWindowMode) {
    return content;
  }

  return (
    <DashboardWrapper>
      {content}
    </DashboardWrapper>
  );
}

export default SavingsProductsForm;
