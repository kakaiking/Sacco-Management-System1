import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../helpers/AuthContext";
import { useHistory, useParams, useLocation } from "react-router-dom";
import { FiArrowLeft, FiEdit3, FiTrash2, FiX, FiSearch, FiMoreVertical, FiCheck, FiRefreshCw, FiRotateCcw } from "react-icons/fi";
import axios from "axios";
import { useSnackbar } from "../helpers/SnackbarContext";
import DashboardWrapper from '../components/DashboardWrapper';
import MemberLookupModal from '../components/MemberLookupModal';
import BranchLookupModal from '../components/BranchLookupModal';
import ProductLookupModal from '../components/ProductLookupModal';
import CurrencyLookupModal from '../components/CurrencyLookupModal';
import AccountOfficerLookupModal from '../components/AccountOfficerLookupModal';
import AccountLookupModal from '../components/AccountLookupModal';

function SavingsAccountsForm({ id: propId, isWindowMode = false }) {
  const history = useHistory();
  const { authState, isLoading } = useContext(AuthContext);
  const { id: paramId } = useParams();
  const { search } = useLocation();
  const { showMessage } = useSnackbar();
  
  // Use prop id if in window mode, otherwise use param id
  const id = isWindowMode ? propId : paramId;
  
  const isEdit = new URLSearchParams(search).get("edit") === "1";
  const isCreate = id === "new";
  const isViewingSpecificAccount = id && id !== "new";

  // Form mode state: 'create', 'view', 'edit'
  const [formMode, setFormMode] = useState(
    isCreate ? 'create' : 
    (isEdit ? 'edit' : 
    (isViewingSpecificAccount ? 'view' : 'create'))
  );
  
  // Update form mode when URL parameters change
  useEffect(() => {
    const newIsCreate = id === "new";
    const newIsEdit = new URLSearchParams(search).get("edit") === "1";
    const newIsViewingSpecificAccount = id && id !== "new";
    const newFormMode = newIsCreate ? 'create' : 
                       (newIsEdit ? 'edit' : 
                       (newIsViewingSpecificAccount ? 'view' : 'create'));
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

  // Tab state
  const [activeTab, setActiveTab] = useState('overview');

  // Form state
  const [form, setForm] = useState({
    // Head section fields
    accountId: "",
    saccoId: "",
    branchId: "",
    memberNo: "",
    productId: "",
    
    // Overview Account Details
    shortName: "",
    accountType: "Savings", // Always set to Savings
    currencyId: "",
    address: "",
    city: "",
    phone: "",
    alternativePhone: "",
    kraPin: "",
    emailId: "",
    operatingMode: "Self",
    operatingInstructions: "",
    accountOfficerId: "",
    
    // In-depth Account Details
    clearBalance: 0.00,
    unclearBalance: 0.00,
    unsupervisedCredits: 0.00,
    unsupervisedDebits: 0.00,
    frozenAmount: 0.00,
    creditRate: 0.0000,
    debitRate: 0.0000,
    penaltyRate: 0.0000,
    pendingCharges: 0.00,
    availableBalance: 0.00,
    totalBalance: 0.00,
    creditInterest: 0.00,
    debitInterest: 0.00,
    minimumBalance: 0.00,
    fixedBalance: 0.00,
    
    // Standard fields
    status: "Active",
    remarks: "",
    createdBy: "",
    createdOn: "",
    modifiedBy: "",
    modifiedOn: "",
    approvedBy: "",
    approvedOn: "",
  });

  // Lookup modal states
  const [showAccountLookup, setShowAccountLookup] = useState(false);
  const [showMemberLookup, setShowMemberLookup] = useState(false);
  const [showBranchLookup, setShowBranchLookup] = useState(false);
  const [showProductLookup, setShowProductLookup] = useState(false);
  const [showCurrencyLookup, setShowCurrencyLookup] = useState(false);
  const [showAccountOfficerLookup, setShowAccountOfficerLookup] = useState(false);

  // Selected data for display
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [selectedAccountOfficer, setSelectedAccountOfficer] = useState(null);

  // Field errors state
  const [fieldErrors, setFieldErrors] = useState({});

  // Auto-populate from auth state
  useEffect(() => {
    if (authState && isCreate) {
      setForm(prev => ({
        ...prev,
        saccoId: authState.saccoId || "",
        branchId: authState.branchId || "",
        city: authState.branchLocation || ""
      }));
    }
  }, [authState, isCreate]);

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

  // Handle account selection from lookup
  const handleAccountSelect = (account) => {
    setSelectedAccount(account);
    setForm(prev => ({
      ...prev,
      accountId: account.accountId,
      saccoId: account.saccoId || "",
      branchId: account.branchId || "",
      memberNo: account.memberNo || "",
      productId: account.productId || "",
      shortName: account.shortName || "",
      currencyId: account.currencyId || "",
      address: account.address || "",
      city: account.city || "",
      phone: account.phone || "",
      alternativePhone: account.alternativePhone || "",
      kraPin: account.kraPin || "",
      emailId: account.emailId || "",
      operatingMode: account.operatingMode || "Self",
      operatingInstructions: account.operatingInstructions || "",
      accountOfficerId: account.accountOfficerId || "",
      clearBalance: account.clearBalance || 0.00,
      unclearBalance: account.unclearBalance || 0.00,
      unsupervisedCredits: account.unsupervisedCredits || 0.00,
      unsupervisedDebits: account.unsupervisedDebits || 0.00,
      frozenAmount: account.frozenAmount || 0.00,
      creditRate: account.creditRate || 0.0000,
      debitRate: account.debitRate || 0.0000,
      penaltyRate: account.penaltyRate || 0.0000,
      pendingCharges: account.pendingCharges || 0.00,
      availableBalance: account.availableBalance || 0.00,
      totalBalance: account.totalBalance || 0.00,
      creditInterest: account.creditInterest || 0.00,
      debitInterest: account.debitInterest || 0.00,
      minimumBalance: account.minimumBalance || 0.00,
      fixedBalance: account.fixedBalance || 0.00,
      status: account.status || "Active",
      remarks: account.remarks || "",
      createdBy: account.createdBy || "",
      createdOn: account.createdOn || "",
      modifiedBy: account.modifiedBy || "",
      modifiedOn: account.modifiedOn || "",
      approvedBy: account.approvedBy || "",
      approvedOn: account.approvedOn || ""
    }));
    
    // Set related lookup data
    if (account.member) {
      setSelectedMember(account.member);
    }
    if (account.branch) {
      setSelectedBranch(account.branch);
    }
    if (account.product) {
      setSelectedProduct(account.product);
    }
    if (account.currency) {
      setSelectedCurrency(account.currency);
    }
    if (account.accountOfficer) {
      setSelectedAccountOfficer(account.accountOfficer);
    }
    
    setShowAccountLookup(false);
    setFormMode('view'); // Switch to view mode when account is selected
  };

  // Handle member selection from lookup
  const handleMemberSelect = (member) => {
    setSelectedMember(member);
    setForm(prev => ({
      ...prev,
      memberNo: member.memberNo,
      address: member.address || "",
      phone: member.personalPhone || "",
      alternativePhone: member.alternativePhone || "",
      kraPin: member.kraPin || "",
      emailId: member.email || ""
    }));
    setShowMemberLookup(false);
  };

  // Handle branch selection from lookup
  const handleBranchSelect = (branch) => {
    setSelectedBranch(branch);
    setForm(prev => ({
      ...prev,
      branchId: branch.branchId,
      city: branch.branchLocation || ""
    }));
    setShowBranchLookup(false);
  };

  // Handle product selection from lookup
  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setForm(prev => ({
      ...prev,
      productId: product.id
    }));
    setShowProductLookup(false);
  };

  // Handle currency selection from lookup
  const handleCurrencySelect = (currency) => {
    setSelectedCurrency(currency);
    setForm(prev => ({
      ...prev,
      currencyId: currency.id
    }));
    setShowCurrencyLookup(false);
  };

  // Handle account officer selection from lookup
  const handleAccountOfficerSelect = (officer) => {
    setSelectedAccountOfficer(officer);
    setForm(prev => ({
      ...prev,
      accountOfficerId: officer.id
    }));
    setShowAccountOfficerLookup(false);
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  // Handle tab change
  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
  };

  // Helper function to check if a field is required
  const isFieldRequired = (fieldName) => {
    const requiredFields = [
      'saccoId', 'branchId', 'memberNo', 'productId', 'accountId', // Head section
      'shortName', 'currencyId', 'operatingMode', // Overview section
      'clearBalance', 'unclearBalance', 'unsupervisedCredits', 'unsupervisedDebits', 
      'frozenAmount', 'creditRate', 'debitRate', 'penaltyRate', 'pendingCharges',
      'availableBalance', 'totalBalance', 'creditInterest', 'debitInterest',
      'minimumBalance', 'fixedBalance', 'status' // In-depth section
    ];
    return requiredFields.includes(fieldName);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (formMode === 'create') {
        const response = await axios.post('http://localhost:3001/accounts', form, {
          headers: { accessToken: localStorage.getItem('accessToken') }
        });
        showMessage('Account created successfully', 'success');
        if (!isWindowMode) {
          history.push(`/savings-accounts/${response.data.entity.id}`);
        }
      } else if (formMode === 'edit') {
        await axios.put(`http://localhost:3001/accounts/${id}`, form, {
          headers: { accessToken: localStorage.getItem('accessToken') }
        });
        showMessage('Account updated successfully', 'success');
        setFormMode('view');
      }
    } catch (error) {
      console.error('Error saving account:', error);
      showMessage(error.response?.data?.message || 'Error saving account', 'error');
    }
  };

  // Handle delete account
  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:3001/accounts/${id}`, {
        headers: { accessToken: localStorage.getItem('accessToken') }
      });
      showMessage('Account deleted successfully', 'success');
      setShowDeleteModal(false);
      if (!isWindowMode) {
        history.push('/savings-accounts');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      showMessage(error.response?.data?.message || 'Error deleting account', 'error');
    }
  };

  // Handle status change
  const handleStatusChange = async (newStatus) => {
    try {
      await axios.patch(`http://localhost:3001/accounts/${id}/status`, {
        status: newStatus
      }, {
        headers: { accessToken: localStorage.getItem('accessToken') }
      });
      showMessage(`Account status changed to ${newStatus}`, 'success');
      setForm(prev => ({ ...prev, status: newStatus }));
    } catch (error) {
      console.error('Error updating status:', error);
      showMessage(error.response?.data?.message || 'Error updating status', 'error');
    }
  };

  // Handle edit mode
  const handleEdit = () => {
    setFormMode('edit');
    setShowActionsDropdown(false);
    showMessage('Form switched to edit mode', 'success');
  };

  // Clear form function
  const clearForm = () => {
    setForm({
      // Head section fields
      accountId: "",
      saccoId: "",
      branchId: "",
      memberNo: "",
      productId: "",
      
      // Overview Account Details
      shortName: "",
      accountType: "Savings",
      currencyId: "",
      address: "",
      city: "",
      phone: "",
      alternativePhone: "",
      kraPin: "",
      emailId: "",
      operatingMode: "Self",
      operatingInstructions: "",
      accountOfficerId: "",
      
      // In-depth Account Details
      clearBalance: 0.00,
      unclearBalance: 0.00,
      unsupervisedCredits: 0.00,
      unsupervisedDebits: 0.00,
      frozenAmount: 0.00,
      creditRate: 0.0000,
      debitRate: 0.0000,
      penaltyRate: 0.0000,
      pendingCharges: 0.00,
      availableBalance: 0.00,
      totalBalance: 0.00,
      creditInterest: 0.00,
      debitInterest: 0.00,
      minimumBalance: 0.00,
      fixedBalance: 0.00,
      
      // Standard fields
      status: "Active",
      remarks: "",
      createdBy: "",
      createdOn: "",
      modifiedBy: "",
      modifiedOn: "",
      approvedBy: "",
      approvedOn: "",
    });
    
    // Clear selected lookup values
    setSelectedAccount(null);
    setSelectedMember(null);
    setSelectedBranch(null);
    setSelectedProduct(null);
    setSelectedCurrency(null);
    setSelectedAccountOfficer(null);
    
    // Switch to create mode
    setFormMode('create');
    
    // Close the dropdown
    setShowActionsDropdown(false);
    
    showMessage('Form cleared successfully', 'success');
  };

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview Account Details', icon: '📋' },
    { id: 'in-depth', label: 'In-depth Account Details', icon: '💰' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="grid4">
            <div>
              <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                <span style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Short Name</span>{isFieldRequired('shortName') && <span style={{ color: '#ef4444' }}>*</span>}
                </span>
              </label>
              <input
                className="input"
                value={form.shortName}
                onChange={(e) => handleInputChange('shortName', e.target.value)}
                disabled={formMode === 'view'}
                placeholder="Enter short name"
              />
            </div>

            <div>
              <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                <span style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Currency</span>{isFieldRequired('currencyId') && <span style={{ color: '#ef4444' }}>*</span>}
                </span>
              </label>
              <div className="role-input-wrapper">
                <input 
                  type="text"
                  className="input" 
                  value={selectedCurrency ? `${selectedCurrency.currencyCode || selectedCurrency.id} - ${selectedCurrency.currencyName || selectedCurrency.name || ""}` : ""} 
                  onChange={() => {}} 
                  disabled={formMode === 'view'}
                  placeholder="Select a currency"
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
                <span style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Address</span>{isFieldRequired('address') && <span style={{ color: '#ef4444' }}>*</span>}
                </span>
              </label>
              <textarea
                className="form__textarea"
                value={form.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                disabled={formMode === 'view'}
                placeholder="Enter address"
                rows="1"
              />
            </div>

            <div>
              <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                <span style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>City (Branch City)</span>{isFieldRequired('city') && <span style={{ color: '#ef4444' }}>*</span>}
                </span>
              </label>
              <input
                className="input"
                value={form.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                disabled={formMode === 'view'}
                placeholder="Branch city"
              />
            </div>

            <div>
              <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                <span style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Phone</span>{isFieldRequired('phone') && <span style={{ color: '#ef4444' }}>*</span>}
                </span>
              </label>
              <input
                className="input"
                value={form.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                disabled={formMode === 'view'}
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                <span style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Alternative Phone</span>{isFieldRequired('alternativePhone') && <span style={{ color: '#ef4444' }}>*</span>}
                </span>
              </label>
              <input
                className="input"
                value={form.alternativePhone}
                onChange={(e) => handleInputChange('alternativePhone', e.target.value)}
                disabled={formMode === 'view'}
                placeholder="Enter alternative phone"
              />
            </div>

            <div>
              <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                <span style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>KRA PIN</span>{isFieldRequired('kraPin') && <span style={{ color: '#ef4444' }}>*</span>}
                </span>
              </label>
              <input
                className="input"
                value={form.kraPin}
                onChange={(e) => handleInputChange('kraPin', e.target.value)}
                disabled={formMode === 'view'}
                placeholder="Enter KRA PIN"
              />
            </div>

            <div>
              <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                <span style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Email ID</span>{isFieldRequired('emailId') && <span style={{ color: '#ef4444' }}>*</span>}
                </span>
              </label>
              <input
                className="input"
                value={form.emailId}
                onChange={(e) => handleInputChange('emailId', e.target.value)}
                disabled={formMode === 'view'}
                placeholder="Enter email"
              />
            </div>

            <div>
              <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                <span style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Operating Mode</span>{isFieldRequired('operatingMode') && <span style={{ color: '#ef4444' }}>*</span>}
                </span>
              </label>
              <select
                className="form__select"
                value={form.operatingMode}
                onChange={(e) => handleInputChange('operatingMode', e.target.value)}
                disabled={formMode === 'view'}
              >
                <option value="Self">Self</option>
                <option value="Either to sign">Either to sign</option>
                <option value="All to sign">All to sign</option>
                <option value="Two to sign">Two to sign</option>
                <option value="Three to sign">Three to sign</option>
                <option value="Four to sign">Four to sign</option>
              </select>
            </div>

            <div>
              <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                <span style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Operating Instructions</span>{isFieldRequired('operatingInstructions') && <span style={{ color: '#ef4444' }}>*</span>}
                </span>
              </label>
              <textarea
                className="form__textarea"
                value={form.operatingInstructions}
                onChange={(e) => handleInputChange('operatingInstructions', e.target.value)}
                disabled={formMode === 'view'}
                placeholder="Enter operating instructions"
                rows="1"
              />
            </div>

            <div>
              <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                <span style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Account Officer</span>{isFieldRequired('accountOfficerId') && <span style={{ color: '#ef4444' }}>*</span>}
                </span>
              </label>
              <div className="role-input-wrapper">
                <input 
                  type="text"
                  className="input" 
                  value={selectedAccountOfficer ? `${selectedAccountOfficer.employeeId || selectedAccountOfficer.id} - ${selectedAccountOfficer.firstName || ''} ${selectedAccountOfficer.lastName || ''}`.trim() : ""} 
                  onChange={() => {}} 
                  disabled={formMode === 'view'}
                  placeholder="Select an account officer"
                  readOnly={true}
                />
                {formMode !== 'view' && (
                  <button
                    type="button"
                    className="role-search-btn"
                    onClick={() => setShowAccountOfficerLookup(true)}
                    title="Search account officers"
                  >
                    <FiSearch />
                  </button>
                )}
              </div>
            </div>
          </div>
        );

      case 'in-depth':
        return (
          <div className="grid4">
            <div>
              <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                <span style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Clear Balance</span>{isFieldRequired('clearBalance') && <span style={{ color: '#ef4444' }}>*</span>}
                </span>
              </label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={form.clearBalance}
                onChange={(e) => handleInputChange('clearBalance', parseFloat(e.target.value) || 0)}
                disabled={formMode === 'view'}
                placeholder="0.00"
              />
            </div>

            <div>
              <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                <span style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Unclear Balance</span>{isFieldRequired('unclearBalance') && <span style={{ color: '#ef4444' }}>*</span>}
                </span>
              </label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={form.unclearBalance}
                onChange={(e) => handleInputChange('unclearBalance', parseFloat(e.target.value) || 0)}
                disabled={formMode === 'view'}
                placeholder="0.00"
              />
            </div>

            <div>
              <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                <span style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Unsupervised Credits</span>{isFieldRequired('unsupervisedCredits') && <span style={{ color: '#ef4444' }}>*</span>}
                </span>
              </label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={form.unsupervisedCredits}
                onChange={(e) => handleInputChange('unsupervisedCredits', parseFloat(e.target.value) || 0)}
                disabled={formMode === 'view'}
                placeholder="0.00"
              />
            </div>

            <div>
              <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                <span style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Unsupervised Debits</span>{isFieldRequired('unsupervisedDebits') && <span style={{ color: '#ef4444' }}>*</span>}
                </span>
              </label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={form.unsupervisedDebits}
                onChange={(e) => handleInputChange('unsupervisedDebits', parseFloat(e.target.value) || 0)}
                disabled={formMode === 'view'}
                placeholder="0.00"
              />
            </div>

            <div>
              <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                <span style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Frozen Amount</span>{isFieldRequired('frozenAmount') && <span style={{ color: '#ef4444' }}>*</span>}
                </span>
              </label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={form.frozenAmount}
                onChange={(e) => handleInputChange('frozenAmount', parseFloat(e.target.value) || 0)}
                disabled={formMode === 'view'}
                placeholder="0.00"
              />
            </div>

            <div>
              <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                <span style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Credit Rate</span>{isFieldRequired('creditRate') && <span style={{ color: '#ef4444' }}>*</span>}
                </span>
              </label>
              <input
                type="number"
                step="0.0001"
                className="input"
                value={form.creditRate}
                onChange={(e) => handleInputChange('creditRate', parseFloat(e.target.value) || 0)}
                disabled={formMode === 'view'}
                placeholder="0.0000"
              />
            </div>

            <div>
              <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                <span style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Debit Rate</span>{isFieldRequired('debitRate') && <span style={{ color: '#ef4444' }}>*</span>}
                </span>
              </label>
              <input
                type="number"
                step="0.0001"
                className="input"
                value={form.debitRate}
                onChange={(e) => handleInputChange('debitRate', parseFloat(e.target.value) || 0)}
                disabled={formMode === 'view'}
                placeholder="0.0000"
              />
            </div>

            <div>
              <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                <span style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Penalty Rate</span>{isFieldRequired('penaltyRate') && <span style={{ color: '#ef4444' }}>*</span>}
                </span>
              </label>
              <input
                type="number"
                step="0.0001"
                className="input"
                value={form.penaltyRate}
                onChange={(e) => handleInputChange('penaltyRate', parseFloat(e.target.value) || 0)}
                disabled={formMode === 'view'}
                placeholder="0.0000"
              />
            </div>

            <div>
              <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                <span style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Pending Charges</span>{isFieldRequired('pendingCharges') && <span style={{ color: '#ef4444' }}>*</span>}
                </span>
              </label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={form.pendingCharges}
                onChange={(e) => handleInputChange('pendingCharges', parseFloat(e.target.value) || 0)}
                disabled={formMode === 'view'}
                placeholder="0.00"
              />
            </div>

            <div>
              <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                <span style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Available Balance</span>{isFieldRequired('availableBalance') && <span style={{ color: '#ef4444' }}>*</span>}
                </span>
              </label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={form.availableBalance}
                onChange={(e) => handleInputChange('availableBalance', parseFloat(e.target.value) || 0)}
                disabled={formMode === 'view'}
                placeholder="0.00"
              />
            </div>

            <div>
              <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                <span style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Total Balance</span>{isFieldRequired('totalBalance') && <span style={{ color: '#ef4444' }}>*</span>}
                </span>
              </label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={form.totalBalance}
                onChange={(e) => handleInputChange('totalBalance', parseFloat(e.target.value) || 0)}
                disabled={formMode === 'view'}
                placeholder="0.00"
              />
            </div>

            <div>
              <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                <span style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Credit Interest</span>{isFieldRequired('creditInterest') && <span style={{ color: '#ef4444' }}>*</span>}
                </span>
              </label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={form.creditInterest}
                onChange={(e) => handleInputChange('creditInterest', parseFloat(e.target.value) || 0)}
                disabled={formMode === 'view'}
                placeholder="0.00"
              />
            </div>

            <div>
              <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                <span style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Debit Interest</span>{isFieldRequired('debitInterest') && <span style={{ color: '#ef4444' }}>*</span>}
                </span>
              </label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={form.debitInterest}
                onChange={(e) => handleInputChange('debitInterest', parseFloat(e.target.value) || 0)}
                disabled={formMode === 'view'}
                placeholder="0.00"
              />
            </div>

            <div>
              <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                <span style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Minimum Balance</span>{isFieldRequired('minimumBalance') && <span style={{ color: '#ef4444' }}>*</span>}
                </span>
              </label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={form.minimumBalance}
                onChange={(e) => handleInputChange('minimumBalance', parseFloat(e.target.value) || 0)}
                disabled={formMode === 'view'}
                placeholder="0.00"
              />
            </div>

            <div>
              <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                <span style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Fixed Balance</span>{isFieldRequired('fixedBalance') && <span style={{ color: '#ef4444' }}>*</span>}
                </span>
              </label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={form.fixedBalance}
                onChange={(e) => handleInputChange('fixedBalance', parseFloat(e.target.value) || 0)}
                disabled={formMode === 'view'}
                placeholder="0.00"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const content = (
    <div style={{ padding: "24px" }}>
      {/* Header */}


      {/* Account Lookup - Topmost Element */}
      <div style={{ 
        marginBottom: "24px"
      }}>
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
                Account
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                <div className="combined-member-input" style={{ flex: 1 }}>
                  <div className="member-no-section">
                    {selectedAccount ? selectedAccount.accountId : "Select an account"}
                  </div>
                  <div className="member-name-section">
                    {selectedAccount ? selectedAccount.accountName || selectedAccount.shortName || "" : ""}
                  </div>
                </div>
                <button
                  type="button"
                  className="search-icon-external"
                  onClick={() => setShowAccountLookup(true)}
                  title="Search accounts"
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
                  borderRadius: "16px",
                  fontSize: "12px",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  backgroundColor: 
                    form.status === "Active" ? "rgba(16, 185, 129, 0.2)" :
                    form.status === "Inactive" ? "rgba(239, 68, 68, 0.2)" :
                    form.status === "Suspended" ? "rgba(249, 115, 22, 0.2)" :
                    form.status === "Closed" ? "rgba(107, 114, 128, 0.2)" :
                    "rgba(107, 114, 128, 0.2)",
                  color: 
                    form.status === "Active" ? "#059669" :
                    form.status === "Inactive" ? "#dc2626" :
                    form.status === "Suspended" ? "#ea580c" :
                    form.status === "Closed" ? "#6b7280" :
                    "#6b7280",
                  border: `1px solid ${
                    form.status === "Active" ? "rgba(16, 185, 129, 0.3)" :
                    form.status === "Inactive" ? "rgba(239, 68, 68, 0.3)" :
                    form.status === "Suspended" ? "rgba(249, 115, 22, 0.3)" :
                    form.status === "Closed" ? "rgba(107, 114, 128, 0.3)" :
                    "rgba(107, 114, 128, 0.3)"
                  }`
                }}
              >
                {form.status || "Active"}
              </div>
            </div>
          </div>
          
          {/* Actions Button */}
          {formMode !== 'create' && (
            <div style={{ position: "relative" }} data-actions-dropdown>
              <button
                type="button"
                onClick={() => setShowActionsDropdown(!showActionsDropdown)}
                style={{
                  background: "var(--primary-600)",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "6px",
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
        </div>
      </div>

      {/* Account Setup Fields */}
      <div style={{ 
        marginBottom: "24px"
      }}>

        <div className="grid4">

          {/* SACCO ID */}
          <div>
            <label style={{ color: "var(--primary-700)", fontWeight: "600", marginBottom: "8px", display: "block" }}>
              <span style={{ whiteSpace: 'nowrap' }}>
                <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>SACCO ID</span>{isFieldRequired('saccoId') && <span style={{ color: '#ef4444' }}>*</span>}
              </span>
            </label>
            <input
              className="input"
              value={form.saccoId}
              onChange={(e) => handleInputChange('saccoId', e.target.value)}
              disabled={formMode === 'view'}
              placeholder="Enter SACCO ID"
            />
          </div>

          {/* Branch Selection */}
          <div>
            <label style={{ color: "var(--primary-700)", fontWeight: "600", marginBottom: "8px", display: "block" }}>
              <span style={{ whiteSpace: 'nowrap' }}>
                <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Branch</span>{isFieldRequired('branchId') && <span style={{ color: '#ef4444' }}>*</span>}
              </span>
            </label>
            <div className="role-input-wrapper">
              <input 
                type="text"
                className="input" 
                value={selectedBranch ? `${selectedBranch.branchId} - ${selectedBranch.branchName || selectedBranch.branchLocation || ""}` : ""} 
                onChange={() => {}} 
                disabled={formMode === 'view'}
                placeholder="Select a branch"
                readOnly={true}
              />
              {formMode !== 'view' && (
                <button
                  type="button"
                  className="role-search-btn"
                  onClick={() => setShowBranchLookup(true)}
                  title="Search branches"
                >
                  <FiSearch />
                </button>
              )}
            </div>
          </div>

          {/* Member Selection */}
          <div>
            <label style={{ color: "var(--primary-700)", fontWeight: "600", marginBottom: "8px", display: "block" }}>
              <span style={{ whiteSpace: 'nowrap' }}>
                <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Member</span>{isFieldRequired('memberNo') && <span style={{ color: '#ef4444' }}>*</span>}
              </span>
            </label>
            <div className="role-input-wrapper">
              <input 
                type="text"
                className="input" 
                value={selectedMember ? `${selectedMember.memberNo} - ${selectedMember.category === 'Corporate' ? selectedMember.companyName || "" : selectedMember.category === 'Chama' ? selectedMember.chamaName || "" : `${selectedMember.title || ''} ${selectedMember.firstName || ''} ${selectedMember.lastName || ''}`.trim()}` : ""} 
                onChange={() => {}} 
                disabled={formMode === 'view'}
                placeholder="Select a member"
                readOnly={true}
              />
              {formMode !== 'view' && (
                <button
                  type="button"
                  className="role-search-btn"
                  onClick={() => setShowMemberLookup(true)}
                  title="Search members"
                >
                  <FiSearch />
                </button>
              )}
            </div>
          </div>

          {/* Product Selection */}
          <div>
            <label style={{ color: "var(--primary-700)", fontWeight: "600", marginBottom: "8px", display: "block" }}>
              <span style={{ whiteSpace: 'nowrap' }}>
                <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Product</span>{isFieldRequired('productId') && <span style={{ color: '#ef4444' }}>*</span>}
              </span>
            </label>
            <div className="role-input-wrapper">
              <input 
                type="text"
                className="input" 
                value={selectedProduct ? `${selectedProduct.id} - ${selectedProduct.productName || selectedProduct.name || ""}` : ""} 
                onChange={() => {}} 
                disabled={formMode === 'view'}
                placeholder="Select a product"
                readOnly={true}
              />
              {formMode !== 'view' && (
                <button
                  type="button"
                  className="role-search-btn"
                  onClick={() => setShowProductLookup(true)}
                  title="Search products"
                >
                  <FiSearch />
                </button>
              )}
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
        background: "#e3f2fd",
        padding: "4px"
      }}>
        {tabs.map((tab) => (
          <div key={tab.id} style={{ position: "relative" }}>
            <div
              onClick={() => handleTabChange(tab.id)}
              style={{
                padding: "12px 24px",
                color: activeTab === tab.id ? "#007bff" : "#666",
                cursor: "pointer",
                fontWeight: activeTab === tab.id ? "600" : "400",
                background: activeTab === tab.id ? "#fff" : "transparent",
                border: "1px solid transparent",
                borderRadius: "6px",
                fontSize: "14px",
                transition: "all 0.2s ease",
                margin: "0 2px",
                position: "relative"
              }}
            >
              {tab.label}
            </div>
          </div>
        ))}
      </div>

      {/* Tab Content */}
      <form onSubmit={handleSubmit}>
        {renderTabContent()}
        
        {/* Form Actions */}
        {(formMode === 'create' || formMode === 'edit') && (
          <div style={{ 
            marginTop: "32px", 
            paddingTop: "24px", 
            borderTop: "1px solid var(--border)",
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end"
          }}>
            <button
              type="button"
              onClick={() => isWindowMode ? null : history.goBack()}
              style={{
                background: "var(--gray-100)",
                color: "var(--gray-700)",
                border: "1px solid var(--gray-300)",
                padding: "12px 24px",
                borderRadius: "6px",
                cursor: "pointer"
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                background: "var(--primary-600)",
                color: "white",
                border: "none",
                padding: "12px 24px",
                borderRadius: "6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <FiCheck size={16} />
              {formMode === 'create' ? 'Create Account' : 'Update Account'}
            </button>
          </div>
        )}
      </form>

      {/* Lookup Modals */}
      {showAccountLookup && (
        <AccountLookupModal
          isOpen={showAccountLookup}
          onClose={() => setShowAccountLookup(false)}
          onSelectAccount={handleAccountSelect}
        />
      )}

      {showMemberLookup && (
        <MemberLookupModal
          isOpen={showMemberLookup}
          onClose={() => setShowMemberLookup(false)}
          onSelectMember={handleMemberSelect}
        />
      )}

      {showBranchLookup && (
        <BranchLookupModal
          isOpen={showBranchLookup}
          onClose={() => setShowBranchLookup(false)}
          onSelectBranch={handleBranchSelect}
        />
      )}

      {showProductLookup && (
        <ProductLookupModal
          isOpen={showProductLookup}
          onClose={() => setShowProductLookup(false)}
          onSelectProduct={handleProductSelect}
        />
      )}

      {showCurrencyLookup && (
        <CurrencyLookupModal
          isOpen={showCurrencyLookup}
          onClose={() => setShowCurrencyLookup(false)}
          onSelectCurrency={handleCurrencySelect}
        />
      )}

      {showAccountOfficerLookup && (
        <AccountOfficerLookupModal
          isOpen={showAccountOfficerLookup}
          onClose={() => setShowAccountOfficerLookup(false)}
          onSelect={handleAccountOfficerSelect}
        />
      )}

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
          zIndex: 2000
        }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "24px",
            maxWidth: "400px",
            width: "90%",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)"
          }}>
            <h3 style={{ margin: "0 0 16px 0", color: "var(--text-primary)" }}>
              Confirm Delete
            </h3>
            <p style={{ margin: "0 0 24px 0", color: "var(--text-secondary)" }}>
              Are you sure you want to delete this savings account? This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{
                  background: "var(--gray-100)",
                  color: "var(--gray-700)",
                  border: "1px solid var(--gray-300)",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                style={{
                  background: "var(--error-600)",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  cursor: "pointer"
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
      {content}
    </DashboardWrapper>
  );
}

export default SavingsAccountsForm;
