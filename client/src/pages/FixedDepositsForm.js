import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../helpers/AuthContext";
import { useHistory, useParams, useLocation } from "react-router-dom";
import { FiArrowLeft, FiEdit3, FiTrash2, FiX, FiSearch, FiMoreVertical, FiCheck, FiRefreshCw, FiRotateCcw, FiDownload, FiPrinter, FiFile, FiFileText } from "react-icons/fi";
import axios from "axios";
import { useSnackbar } from "../helpers/SnackbarContext";
import DashboardWrapper from '../components/DashboardWrapper';
import MemberLookupModal from '../components/MemberLookupModal';
import ProductLookupModal from '../components/ProductLookupModal';
import AccountOfficerLookupModal from '../components/AccountOfficerLookupModal';
import AccountLookupModal from '../components/AccountLookupModal';
import SignatoriesTab from "../components/SignatoriesTab";
import { useWindow } from "../helpers/WindowContext";

const formatDateInput = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60000;
  const local = new Date(date.getTime() - offsetMs);
  return local.toISOString().split('T')[0];
};

const formatDisplayDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date
    .toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    .toUpperCase();
};

const getCurrentMonthRange = () => {
  const now = new Date();
  return {
    from: new Date(now.getFullYear(), now.getMonth(), 1),
    to: new Date(now.getFullYear(), now.getMonth() + 1, 0)
  };
};

const getCurrentAndPreviousRange = () => {
  const now = new Date();
  return {
    from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
    to: new Date(now.getFullYear(), now.getMonth() + 1, 0)
  };
};

const formatAmountDisplay = (value) => {
  if (value === null || value === undefined || value === "") return "";
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return value;
  const formatter = new Intl.NumberFormat('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  const formatted = formatter.format(Math.abs(numericValue));
  return numericValue < 0 ? `(${formatted})` : formatted;
};

// Removed sampleStatementRows - now fetched from backend

const parseSignatoriesArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to parse signatories array:', error);
    return [];
  }
};

function FixedDepositsForm({ id: propId, isWindowMode = false }) {
  const history = useHistory();
  const { authState, isLoading } = useContext(AuthContext);
  const { id: paramId } = useParams();
  const { search } = useLocation();
  const { showMessage } = useSnackbar();
  const { getWindowByType, updateWindowTitle } = useWindow();
  
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
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [verifierRemarks, setVerifierRemarks] = useState("");
  
  // Audit fields visibility state
  const [showAuditFields, setShowAuditFields] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState("accountInfo");

  const tabItems = [
    { key: "accountInfo", label: "Account Info" },
    { key: "statements", label: "Statements" },
    { key: "signatories", label: "Signatories" }
  ];

  // Statement filters
  const [statementOption, setStatementOption] = useState('currentMonth');
  const [statementFrom, setStatementFrom] = useState(() => {
    const { from } = getCurrentMonthRange();
    return formatDateInput(from);
  });
  const [statementTo, setStatementTo] = useState(() => {
    const { to } = getCurrentMonthRange();
    return formatDateInput(to);
  });
  
  // Statement data state
  const [statementTransactions, setStatementTransactions] = useState([]);
  const [isLoadingStatements, setIsLoadingStatements] = useState(false);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [closingBalance, setClosingBalance] = useState(0);

  useEffect(() => {
    if (statementOption === 'currentMonth') {
      const { from, to } = getCurrentMonthRange();
      setStatementFrom(formatDateInput(from));
      setStatementTo(formatDateInput(to));
    } else if (statementOption === 'currentPrevious') {
      const { from, to } = getCurrentAndPreviousRange();
      setStatementFrom(formatDateInput(from));
      setStatementTo(formatDateInput(to));
    }
  }, [statementOption]);


  // Form state
  const [form, setForm] = useState({
    // Database ID (primary key) - needed for updates
    id: null,
    
    // Head section fields
    accountId: "",
    saccoId: "",
    branchId: "",
    memberNo: "",
    productId: "",
    
    // Overview Account Details
    shortName: "",
    accountType: "Fixed Deposit", // Always set to Fixed Deposit
    currencyId: "",
    address: "",
    city: "",
    phone: "",
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
  const [showProductLookup, setShowProductLookup] = useState(false);
  const [showAccountOfficerLookup, setShowAccountOfficerLookup] = useState(false);

  // Selected data for display
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedAccountOfficer, setSelectedAccountOfficer] = useState(null);

  // Field errors state
  const [fieldErrors, setFieldErrors] = useState({});

  // Auto-populate from auth state and fetch branch if needed
  useEffect(() => {
    const initializeForm = async () => {
      if (authState && isCreate) {
        console.log('Initializing form with auth state:', authState);
        
        // If we have a branchId, always fetch the branch to get saccoId and city
        if (authState.branchId) {
          try {
            const response = await axios.get(`http://localhost:3001/branch/byBranchId/${authState.branchId}`, {
              headers: { accessToken: localStorage.getItem('accessToken') }
            });
            const branch = response.data.entity;
            console.log('Fetched branch data:', branch);
            
            if (branch) {
              // Update window title with branch name if in window mode
              if (isWindowMode && branch.branchName) {
                const fixedDepositsWindow = getWindowByType('fixed-deposits');
                if (fixedDepositsWindow) {
                  updateWindowTitle(
                    fixedDepositsWindow.id, 
                    `Fixed Deposits (${branch.branchName})`, // Full title for window header
                    'Fixed Deposits' // Short title for tabs
                  );
                }
              }
              
              setForm(prev => ({
                ...prev,
                saccoId: branch.saccoId || authState.saccoId || "",
                branchId: authState.branchId || "",
                city: branch.branchLocation || ""
              }));
              return;
            }
          } catch (error) {
            console.error('Error fetching branch:', error);
          }
        }
        
        // Fallback initialization if no branchId or fetch failed
        setForm(prev => ({
          ...prev,
          saccoId: authState.saccoId || "",
          branchId: authState.branchId || "",
          city: ""
        }));
      }
    };
    
    initializeForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState, isCreate, isWindowMode]);

  // Close actions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showActionsDropdown && !event.target.closest('[data-actions-dropdown]')) {
        setShowActionsDropdown(false);
      }
      if (showExportDropdown && !event.target.closest('[data-export-dropdown]')) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showActionsDropdown, showExportDropdown]);

  // Handle account selection from lookup
  const handleAccountSelect = (account) => {
    setSelectedAccount(account);
    setForm(prev => ({
      ...prev,
      id: account.id, // Store database ID for updates
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
    if (account.product) {
      setSelectedProduct(account.product);
    }
    if (account.accountOfficer) {
      setSelectedAccountOfficer(account.accountOfficer);
    }

    setAccountSignatories(parseSignatoriesArray(account.signatories));
    setExistingMemberSignatories(
      account.member ? parseSignatoriesArray(account.member.authorizedSignatories) : []
    );
    
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
      kraPin: member.kraPin || "",
      emailId: member.email || ""
    }));
    setExistingMemberSignatories(parseSignatoriesArray(member.authorizedSignatories));
    setShowMemberLookup(false);
  };

  // Handle product selection from lookup
  const handleProductSelect = (product) => {
    console.log('Selected product:', product);
    setSelectedProduct(product);
    setForm(prev => ({
      ...prev,
      productId: product.id,
      currencyId: product.currencyId || prev.currencyId || 1 // Auto-populate currency from product
    }));
    setShowProductLookup(false);
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
        
        const createdAccount = response.data.entity;
        
        // Load the created account in view mode
        setForm({
          id: createdAccount.id,
          accountId: createdAccount.accountId,
          saccoId: createdAccount.saccoId || "",
          branchId: createdAccount.branchId || "",
          memberNo: createdAccount.memberNo || "",
          productId: createdAccount.productId || "",
          shortName: createdAccount.shortName || "",
          accountType: createdAccount.accountType || "Fixed Deposit",
          currencyId: createdAccount.currencyId || "",
          address: createdAccount.address || "",
          city: createdAccount.city || "",
          phone: createdAccount.phone || "",
          kraPin: createdAccount.kraPin || "",
          emailId: createdAccount.emailId || "",
          operatingMode: createdAccount.operatingMode || "Self",
          operatingInstructions: createdAccount.operatingInstructions || "",
          accountOfficerId: createdAccount.accountOfficerId || "",
          clearBalance: createdAccount.clearBalance || 0.00,
          unclearBalance: createdAccount.unclearBalance || 0.00,
          unsupervisedCredits: createdAccount.unsupervisedCredits || 0.00,
          unsupervisedDebits: createdAccount.unsupervisedDebits || 0.00,
          frozenAmount: createdAccount.frozenAmount || 0.00,
          creditRate: createdAccount.creditRate || 0.0000,
          debitRate: createdAccount.debitRate || 0.0000,
          penaltyRate: createdAccount.penaltyRate || 0.0000,
          pendingCharges: createdAccount.pendingCharges || 0.00,
          availableBalance: createdAccount.availableBalance || 0.00,
          totalBalance: createdAccount.totalBalance || 0.00,
          creditInterest: createdAccount.creditInterest || 0.00,
          debitInterest: createdAccount.debitInterest || 0.00,
          minimumBalance: createdAccount.minimumBalance || 0.00,
          fixedBalance: createdAccount.fixedBalance || 0.00,
          status: createdAccount.status || "Active",
          remarks: createdAccount.remarks || "",
          createdBy: createdAccount.createdBy || "",
          createdOn: createdAccount.createdOn || "",
          modifiedBy: createdAccount.modifiedBy || "",
          modifiedOn: createdAccount.modifiedOn || "",
          approvedBy: createdAccount.approvedBy || "",
          approvedOn: createdAccount.approvedOn || ""
        });
        
        setSelectedAccount(createdAccount);
        setFormMode('view');
        
        if (!isWindowMode) {
          history.push(`/fixed-deposits/${createdAccount.id}`);
        }
      } else if (formMode === 'edit') {
        // Use the database ID from form state
        const accountDbId = form.id;
        if (!accountDbId) {
          showMessage('Account ID is missing. Cannot update account.', 'error');
          return;
        }
        await axios.put(`http://localhost:3001/accounts/${accountDbId}`, form, {
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
      const accountDbId = form.id;
      if (!accountDbId) {
        showMessage('Account ID is missing. Cannot delete account.', 'error');
        return;
      }
      await axios.delete(`http://localhost:3001/accounts/${accountDbId}`, {
        headers: { accessToken: localStorage.getItem('accessToken') }
      });
      showMessage('Account deleted successfully', 'success');
      setShowDeleteModal(false);
      if (!isWindowMode) {
        history.push('/fixed-deposits');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      showMessage(error.response?.data?.message || 'Error deleting account', 'error');
    }
  };

  // Handle status change
  const handleStatusChange = async (newStatus) => {
    try {
      const accountDbId = form.id;
      if (!accountDbId) {
        showMessage('Account ID is missing. Cannot update status.', 'error');
        return;
      }
      await axios.patch(`http://localhost:3001/accounts/${accountDbId}/status`, {
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
      // Database ID
      id: null,
      
      // Head section fields
      accountId: "",
      saccoId: authState?.saccoId || "",
      branchId: authState?.branchId || "",
      memberNo: "",
      productId: "",
      
      // Overview Account Details
      shortName: "",
      accountType: "Fixed Deposit",
      currencyId: "",
      address: "",
      city: authState?.branchLocation || "",
      phone: "",
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
    setSelectedProduct(null);
    setSelectedAccountOfficer(null);
    setAccountSignatories([]);
    setExistingMemberSignatories([]);
    
    // Switch to create mode
    setFormMode('create');
    
    // Close the dropdown
    setShowActionsDropdown(false);
    
    showMessage('Form cleared successfully', 'success');
  };

  const [accountSignatories, setAccountSignatories] = useState([]);
  const [existingMemberSignatories, setExistingMemberSignatories] = useState([]);
  const [isLoadingSignatories, setIsLoadingSignatories] = useState(false);
  const [signatoriesError, setSignatoriesError] = useState(null);

  useEffect(() => {
    const fetchAccountSignatories = async () => {
      if (!id || id === "new") {
        setAccountSignatories([]);
        setIsLoadingSignatories(false);
        setSignatoriesError(null);
        return;
      }

      setIsLoadingSignatories(true);
      setSignatoriesError(null);

      try {
        const response = await axios.get(`http://localhost:3001/accounts/${id}`, {
          headers: { accessToken: localStorage.getItem('accessToken') }
        });

        const fetchedAccount = response.data.entity || null;

        if (fetchedAccount) {
          setAccountSignatories(parseSignatoriesArray(fetchedAccount.signatories));

          const fetchedMember = fetchedAccount.member || null;
          setExistingMemberSignatories(
            fetchedMember ? parseSignatoriesArray(fetchedMember.authorizedSignatories) : []
          );

          if (fetchedMember) {
            setSelectedMember(fetchedMember);
          }
        } else {
          setAccountSignatories([]);
          setExistingMemberSignatories([]);
        }
      } catch (error) {
        console.error('Error fetching account signatories:', error);
        setSignatoriesError(error.response?.data?.message || 'Failed to load signatories');
      } finally {
        setIsLoadingSignatories(false);
      }
    };

    fetchAccountSignatories();
  }, [id]);

  const addSignatoryToAccount = (newSignatory) => {
    setAccountSignatories((prev) => [...prev, newSignatory]);
  };

  const updateSignatoryForAccount = (index, updatedSignatory) => {
    setAccountSignatories((prev) => prev.map((signatory, i) => (i === index ? updatedSignatory : signatory)));
  };

  const removeSignatoryFromAccount = (index) => {
    setAccountSignatories((prev) => prev.filter((_, i) => i !== index));
  };

  // Fetch account statements when viewing an account
  useEffect(() => {
    const fetchStatements = async () => {
      if (!form.accountId || id === 'new') {
        setStatementTransactions([]);
        return;
      }

      if (activeTab !== 'statements') {
        return;
      }

      setIsLoadingStatements(true);
      try {
        const response = await axios.get(`http://localhost:3001/transactions/account/${form.accountId}`, {
          params: {
            fromDate: statementFrom,
            toDate: statementTo,
            status: 'Approved' // Only show approved transactions
          },
          headers: { accessToken: localStorage.getItem('accessToken') }
        });
        
        const transactions = response.data.entity || [];
        
        // Calculate running balance for each transaction
        let runningBalance = form.clearBalance || 0;
        
        // Get opening balance (balance before the date range)
        // This would be the clearBalance minus all transactions in the range
        const openingBal = form.clearBalance || 0;
        runningBalance = openingBal;
        
        const transactionsWithBalance = transactions.map((txn) => {
          // Calculate debit/credit based on entry type
          const isDebit = txn.entryType === 'DEBIT';
          const isCredit = txn.entryType === 'CREDIT';
          const amount = parseFloat(txn.amount) || 0;
          
          // Update running balance
          if (isCredit) {
            runningBalance += amount;
          } else if (isDebit) {
            runningBalance -= amount;
          }
          
          return {
            id: txn.id,
            date: txn.createdOn,
            particulars: txn.type || txn.remarks || 'Transaction',
            debit: isDebit ? amount : 0,
            credit: isCredit ? amount : 0,
            closing: runningBalance,
            operatorId: txn.createdBy || '',
            supervisorId: txn.approvedBy || '',
            refNo: txn.referenceNumber || ''
          };
        });
        
        setStatementTransactions(transactionsWithBalance);
        setOpeningBalance(openingBal);
        setClosingBalance(runningBalance);
      } catch (error) {
        console.error('Error fetching statements:', error);
        showMessage(error.response?.data?.message || 'Error fetching statements', 'error');
        setStatementTransactions([]);
      } finally {
        setIsLoadingStatements(false);
      }
    };

    fetchStatements();
  }, [form.accountId, form.clearBalance, statementFrom, statementTo, activeTab, id, showMessage]);

  // Build statement row data with opening and closing as regular rows
  const statementRowData = [
    // Opening balance as first row
    {
      type: 'data',
      id: 'opening-balance',
      date: statementFrom,
      particulars: `OPENING BALANCE ${statementFrom ? formatDisplayDate(statementFrom) : ''}`,
      debit: 0,
      credit: 0,
      closing: openingBalance,
      operatorId: '',
      supervisorId: '',
      refNo: '',
      isSpecialRow: true
    },
    // All transactions
    ...statementTransactions.map((row) => ({ type: 'data', ...row, isSpecialRow: false })),
    // Closing balance as last row
    {
      type: 'data',
      id: 'closing-balance',
      date: statementTo,
      particulars: `CLOSING BALANCE ${statementTo ? formatDisplayDate(statementTo) : ''}`,
      debit: 0,
      credit: 0,
      closing: closingBalance,
      operatorId: '',
      supervisorId: '',
      refNo: '',
      isSpecialRow: true
    }
  ];

  // Export functions
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const accountInfo = `Account: ${form.accountId || 'N/A'} - ${form.shortName || 'N/A'}`;
    const dateRange = `Period: ${formatDisplayDate(statementFrom)} to ${formatDisplayDate(statementTo)}`;
    
    let printContent = `
      <html>
        <head>
          <title>Account Statement - ${form.accountId}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { color: #333; margin-bottom: 5px; }
            .header-info { margin-bottom: 20px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #e2e8f0; padding: 12px; text-align: left; border: 1px solid #cbd5f5; font-weight: 600; color: #1e40af; }
            td { padding: 10px 12px; border: 1px solid #e5e7eb; }
            tr:nth-child(even) { background-color: #f5f8ff; }
            .marker-row { background-color: #dde9ff !important; font-weight: bold; color: #1d4ed8; }
            .text-right { text-align: right; }
            .negative { color: #ef4444; }
          </style>
        </head>
        <body>
          <h2>Account Statement</h2>
          <div class="header-info">
            <div>${accountInfo}</div>
            <div>${dateRange}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Particulars</th>
                <th class="text-right">Debit</th>
                <th class="text-right">Credit</th>
                <th class="text-right">Closing</th>
                <th>Operator ID</th>
                <th>Supervisor ID</th>
                <th>Ref No</th>
              </tr>
            </thead>
            <tbody>
    `;

    statementRowData.forEach(row => {
      const isNegativeDebit = Number(row.debit) < 0;
      const isSpecialRow = row.isSpecialRow;
      const rowClass = isSpecialRow ? 'marker-row' : '';
      
      printContent += `
        <tr class="${rowClass}">
          <td>${row.date ? new Date(row.date).toLocaleDateString('en-GB') : ''}</td>
          <td style="${isSpecialRow ? 'text-transform: uppercase; font-weight: bold;' : ''}">${row.particulars || ''}</td>
          <td class="text-right ${isNegativeDebit ? 'negative' : ''}">${row.debit > 0 ? formatAmountDisplay(row.debit) : ''}</td>
          <td class="text-right">${row.credit > 0 ? formatAmountDisplay(row.credit) : ''}</td>
          <td class="text-right" style="${isSpecialRow ? 'font-weight: bold;' : ''}">${formatAmountDisplay(row.closing)}</td>
          <td>${row.operatorId || ''}</td>
          <td>${row.supervisorId || ''}</td>
          <td>${row.refNo || ''}</td>
        </tr>
      `;
    });

    printContent += `
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
    setShowExportDropdown(false);
  };

  const handleExportExcel = () => {
    const data = statementRowData.map(row => ({
      'Date': row.date ? new Date(row.date).toLocaleDateString('en-GB') : '',
      'Particulars': row.particulars || '',
      'Debit': row.debit || 0,
      'Credit': row.credit || 0,
      'Closing': row.closing || 0,
      'Operator ID': row.operatorId || '',
      'Supervisor ID': row.supervisorId || '',
      'Ref No': row.refNo || ''
    }));

    const worksheet = [
      ['Account Statement'],
      [`Account: ${form.accountId || 'N/A'} - ${form.shortName || 'N/A'}`],
      [`Period: ${formatDisplayDate(statementFrom)} to ${formatDisplayDate(statementTo)}`],
      [],
      ['Date', 'Particulars', 'Debit', 'Credit', 'Closing', 'Operator ID', 'Supervisor ID', 'Ref No'],
      ...data.map(row => Object.values(row))
    ];

    let csv = worksheet.map(row => row.join('\t')).join('\n');
    const blob = new Blob([csv], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `statement_${form.accountId}_${new Date().toISOString().split('T')[0]}.xls`;
    link.click();
    window.URL.revokeObjectURL(url);
    setShowExportDropdown(false);
    showMessage('Statement exported to Excel successfully', 'success');
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Particulars', 'Debit', 'Credit', 'Closing', 'Operator ID', 'Supervisor ID', 'Ref No'];
    const rows = statementRowData.map(row => [
      row.date ? new Date(row.date).toLocaleDateString('en-GB') : '',
      row.particulars || '',
      row.debit || 0,
      row.credit || 0,
      row.closing || 0,
      row.operatorId || '',
      row.supervisorId || '',
      row.refNo || ''
    ]);

    const csvContent = [
      ['Account Statement'],
      [`Account: ${form.accountId || 'N/A'} - ${form.shortName || 'N/A'}`],
      [`Period: ${formatDisplayDate(statementFrom)} to ${formatDisplayDate(statementTo)}`],
      [],
      headers,
      ...rows
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `statement_${form.accountId}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    setShowExportDropdown(false);
    showMessage('Statement exported to CSV successfully', 'success');
  };

  const handleExportJSON = () => {
    const exportData = {
      account: {
        accountId: form.accountId,
        shortName: form.shortName,
        memberNo: form.memberNo
      },
      period: {
        from: statementFrom,
        to: statementTo
      },
      openingBalance: openingBalance,
      closingBalance: closingBalance,
      statements: statementRowData.filter(row => !row.isSpecialRow).map(row => ({
        date: row.date,
        particulars: row.particulars,
        debit: row.debit,
        credit: row.credit,
        closing: row.closing,
        operatorId: row.operatorId,
        supervisorId: row.supervisorId,
        refNo: row.refNo
      })),
      exportedAt: new Date().toISOString()
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `statement_${form.accountId}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
    setShowExportDropdown(false);
    showMessage('Statement exported to JSON successfully', 'success');
  };


  const content = (
    <div className="savings-accounts-form" style={{ padding: "10px 14px" }}>
      {/* Account Lookup - Topmost Element */}
      <div style={{ 
        marginBottom: "6px"
      }}>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: formMode === 'create' ? "1fr auto" : "1fr auto auto", 
          gap: "10px",
          marginBottom: "6px",
          alignItems: "center"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <label style={{ fontWeight: "600", color: "var(--primary-700)", minWidth: "80px" }}>
              Account
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1 }}>
              <div className="combined-member-input compact" style={{ flex: 1 }}>
                <div className="member-no-section">
                  {selectedAccount ? selectedAccount.accountId : "Select an account"}
                </div>
                <div className="member-name-section">
                  {selectedAccount ? selectedAccount.accountName || selectedAccount.shortName || "" : ""}
                </div>
              </div>
              <button
                type="button"
                className="search-icon-external compact"
                onClick={() => setShowAccountLookup(true)}
                title="Search accounts"
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

      {/* Member and Product Lookups - Horizontal Layout */}
      <div style={{ 
        marginBottom: "10px"
      }}>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "1fr 1fr", 
          gap: "10px",
          marginBottom: "6px",
          alignItems: "center"
        }}>
          {/* Member Lookup */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <label style={{ fontWeight: "600", color: "var(--primary-700)", minWidth: "80px" }}>
              Member{isFieldRequired('memberNo') && <span style={{ color: '#ef4444' }}>*</span>}
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1 }}>
              <div className="combined-member-input compact" style={{ flex: 1 }}>
                <div className="member-no-section" style={{ whiteSpace: 'nowrap', minWidth: 'fit-content' }}>
                  {selectedMember ? selectedMember.memberNo : "Select a member"}
                </div>
                <div className="member-name-section">
                  {selectedMember ? (selectedMember.category === 'Corporate' ? selectedMember.companyName || "" : selectedMember.category === 'Chama' ? selectedMember.chamaName || "" : `${selectedMember.title || ''} ${selectedMember.firstName || ''} ${selectedMember.lastName || ''}`.trim()) : ""}
                </div>
              </div>
              <button
                type="button"
                className="search-icon-external compact"
                onClick={() => setShowMemberLookup(true)}
                title="Search members"
                disabled={formMode === 'view'}
              >
                <FiSearch />
              </button>
            </div>
          </div>

          {/* Product Lookup */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <label style={{ fontWeight: "600", color: "var(--primary-700)", minWidth: "80px" }}>
              Product{isFieldRequired('productId') && <span style={{ color: '#ef4444' }}>*</span>}
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1 }}>
              <div className="combined-member-input compact" style={{ flex: 1 }}>
                <div className="member-no-section">
                  {selectedProduct ? selectedProduct.id : "Select a product"}
                </div>
                <div className="member-name-section">
                  {selectedProduct ? (selectedProduct.productName || selectedProduct.name || "") : ""}
                </div>
              </div>
              <button
                type="button"
                className="search-icon-external compact"
                onClick={() => setShowProductLookup(true)}
                title="Search products"
                disabled={formMode === 'view'}
              >
                <FiSearch />
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* Tabs */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "4px",
          border: "1px solid #e0e0e0",
          borderRadius: "8px",
          background: "#e3f2fd",
          padding: "4px",
          margin: "16px 0 12px"
        }}
      >
        {tabItems.map((tab) => (
          <div
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "12px 24px",
              color: activeTab === tab.key ? "#007bff" : "#666",
              cursor: "pointer",
              fontWeight: activeTab === tab.key ? "600" : "400",
              background: activeTab === tab.key ? "#fff" : "transparent",
              border: "1px solid transparent",
              borderRadius: "6px",
              fontSize: "14px",
              transition: "all 0.2s ease",
              margin: "0 2px"
            }}
          >
            {tab.label}
          </div>
        ))}
      </div>

      {/* Form Content */}
      {activeTab === "accountInfo" && (
        <form onSubmit={handleSubmit}>
          {/* Overview Account Details */}
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
                style={{ minHeight: "32px" }}
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
                style={{ minHeight: "32px" }}
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

        {/* Separator */}
        <hr style={{
          border: "none",
          borderTop: "2px solid #e0e0e0",
          margin: "16px 0 12px 0",
          borderRadius: "1px"
        }} />

        {/* In-depth Account Details */}
        <div style={{ 
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "12px"
        }}>
          {/* Row 1: Available Balance, Clear Balance, Unclear Balance */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ 
              color: "var(--primary-700)", 
              fontWeight: "600", 
              fontSize: "13px",
              marginBottom: "4px"
            }}>
              Available Balance
            </label>
            <input
              type="number"
              step="0.01"
              className="input"
              value={form.availableBalance}
              onChange={(e) => handleInputChange('availableBalance', parseFloat(e.target.value) || 0)}
              disabled={formMode === 'view'}
              placeholder="0.00"
              style={{ 
                height: "32px", 
                fontSize: "13px", 
                borderRadius: "10px",
                WebkitAppearance: "none",
                MozAppearance: "textfield"
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ 
              color: "var(--primary-700)", 
              fontWeight: "600", 
              fontSize: "13px",
              marginBottom: "4px"
            }}>
              Clear Balance
            </label>
            <input
              type="number"
              step="0.01"
              className="input"
              value={form.clearBalance}
              onChange={(e) => handleInputChange('clearBalance', parseFloat(e.target.value) || 0)}
              disabled={formMode === 'view'}
              placeholder="0.00"
              style={{ 
                height: "32px", 
                fontSize: "13px", 
                borderRadius: "10px",
                WebkitAppearance: "none",
                MozAppearance: "textfield"
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ 
              color: "var(--primary-700)", 
              fontWeight: "600", 
              fontSize: "13px",
              marginBottom: "4px"
            }}>
              Unclear Balance
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <input
                type="number"
                step="0.01"
                className="input"
                value={form.unclearBalance}
                onChange={(e) => handleInputChange('unclearBalance', parseFloat(e.target.value) || 0)}
                disabled={formMode === 'view'}
                placeholder="0.00"
                style={{ 
                  flex: 1,
                  height: "32px", 
                  fontSize: "13px", 
                  borderRadius: "10px",
                  WebkitAppearance: "none",
                  MozAppearance: "textfield"
                }}
              />
              <button
                type="button"
                style={{
                  width: "28px",
                  height: "28px",
                  backgroundColor: "#20b2aa",
                  border: "none",
                  borderRadius: "3px",
                  color: "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px"
                }}
                title="Lookup"
              >
                ...
              </button>
            </div>
          </div>

          {/* Row 2: Unsupervised Credits, Credit Rate, Credit Interest */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ 
              color: "var(--primary-700)", 
              fontWeight: "600", 
              fontSize: "13px",
              marginBottom: "4px"
            }}>
              Unsupervised Credits
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <input
                type="number"
                step="0.01"
                className="input"
                value={form.unsupervisedCredits}
                onChange={(e) => handleInputChange('unsupervisedCredits', parseFloat(e.target.value) || 0)}
                disabled={formMode === 'view'}
                placeholder="0.00"
                style={{ 
                  flex: 1,
                  height: "32px", 
                  fontSize: "13px", 
                  borderRadius: "10px",
                  WebkitAppearance: "none",
                  MozAppearance: "textfield"
                }}
              />
              <button
                type="button"
                style={{
                  width: "28px",
                  height: "28px",
                  backgroundColor: "#20b2aa",
                  border: "none",
                  borderRadius: "3px",
                  color: "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px"
                }}
                title="Lookup"
              >
                ...
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ 
              color: "var(--primary-700)", 
              fontWeight: "600", 
              fontSize: "13px",
              marginBottom: "4px"
            }}>
              Credit Rate
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <input
                type="number"
                step="0.0001"
                className="input"
                value={form.creditRate}
                onChange={(e) => handleInputChange('creditRate', parseFloat(e.target.value) || 0)}
                disabled={formMode === 'view'}
                placeholder="0.0000"
                style={{ 
                  flex: 1,
                  height: "32px", 
                  fontSize: "13px", 
                  borderRadius: "10px",
                  WebkitAppearance: "none",
                  MozAppearance: "textfield"
                }}
              />
              <button
                type="button"
                style={{
                  width: "28px",
                  height: "28px",
                  backgroundColor: "#20b2aa",
                  border: "none",
                  borderRadius: "3px",
                  color: "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px"
                }}
                title="Lookup"
              >
                ...
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ 
              color: "var(--primary-700)", 
              fontWeight: "600", 
              fontSize: "13px",
              marginBottom: "4px"
            }}>
              Credit Interest
            </label>
            <input
              type="number"
              step="0.01"
              className="input"
              value={form.creditInterest}
              onChange={(e) => handleInputChange('creditInterest', parseFloat(e.target.value) || 0)}
              disabled={formMode === 'view'}
              placeholder="0.00"
              style={{ 
                height: "32px", 
                fontSize: "13px", 
                borderRadius: "10px",
                WebkitAppearance: "none",
                MozAppearance: "textfield"
              }}
            />
          </div>

          {/* Row 3: Unsupervised Debits, Debit Rate, Debit Interest */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ 
              color: "var(--primary-700)", 
              fontWeight: "600", 
              fontSize: "13px",
              marginBottom: "4px"
            }}>
              Unsupervised Debits
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <input
                type="number"
                step="0.01"
                className="input"
                value={form.unsupervisedDebits}
                onChange={(e) => handleInputChange('unsupervisedDebits', parseFloat(e.target.value) || 0)}
                disabled={formMode === 'view'}
                placeholder="0.00"
                style={{ 
                  flex: 1,
                  height: "32px", 
                  fontSize: "13px", 
                  borderRadius: "10px",
                  WebkitAppearance: "none",
                  MozAppearance: "textfield"
                }}
              />
              <button
                type="button"
                style={{
                  width: "28px",
                  height: "28px",
                  backgroundColor: "#20b2aa",
                  border: "none",
                  borderRadius: "3px",
                  color: "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px"
                }}
                title="Lookup"
              >
                ...
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ 
              color: "var(--primary-700)", 
              fontWeight: "600", 
              fontSize: "13px",
              marginBottom: "4px"
            }}>
              Debit Rate
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <input
                type="number"
                step="0.0001"
                className="input"
                value={form.debitRate}
                onChange={(e) => handleInputChange('debitRate', parseFloat(e.target.value) || 0)}
                disabled={formMode === 'view'}
                placeholder="0.0000"
                style={{ 
                  flex: 1,
                  height: "32px", 
                  fontSize: "13px", 
                  borderRadius: "10px",
                  WebkitAppearance: "none",
                  MozAppearance: "textfield"
                }}
              />
              <button
                type="button"
                style={{
                  width: "28px",
                  height: "28px",
                  backgroundColor: "#20b2aa",
                  border: "none",
                  borderRadius: "3px",
                  color: "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px"
                }}
                title="Lookup"
              >
                ...
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ 
              color: "var(--primary-700)", 
              fontWeight: "600", 
              fontSize: "13px",
              marginBottom: "4px"
            }}>
              Debit Interest
            </label>
            <input
              type="number"
              step="0.01"
              className="input"
              value={form.debitInterest}
              onChange={(e) => handleInputChange('debitInterest', parseFloat(e.target.value) || 0)}
              disabled={formMode === 'view'}
              placeholder="0.00"
              style={{ 
                height: "32px", 
                fontSize: "13px", 
                borderRadius: "10px",
                WebkitAppearance: "none",
                MozAppearance: "textfield"
              }}
            />
          </div>

          {/* Row 4: Total Balance, Penalty Rate, Frozen Amount */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ 
              color: "var(--primary-700)", 
              fontWeight: "600", 
              fontSize: "13px",
              marginBottom: "4px"
            }}>
              Total Balance
            </label>
            <input
              type="number"
              step="0.01"
              className="input"
              value={form.totalBalance}
              onChange={(e) => handleInputChange('totalBalance', parseFloat(e.target.value) || 0)}
              disabled={formMode === 'view'}
              placeholder="0.00"
              style={{ 
                height: "32px", 
                fontSize: "13px", 
                borderRadius: "10px",
                WebkitAppearance: "none",
                MozAppearance: "textfield"
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ 
              color: "var(--primary-700)", 
              fontWeight: "600", 
              fontSize: "13px",
              marginBottom: "4px"
            }}>
              Penalty Rate
            </label>
            <input
              type="number"
              step="0.0001"
              className="input"
              value={form.penaltyRate}
              onChange={(e) => handleInputChange('penaltyRate', parseFloat(e.target.value) || 0)}
              disabled={formMode === 'view'}
              placeholder="0.0000"
              style={{ 
                height: "32px", 
                fontSize: "13px", 
                borderRadius: "10px",
                WebkitAppearance: "none",
                MozAppearance: "textfield"
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ 
              color: "var(--primary-700)", 
              fontWeight: "600", 
              fontSize: "13px",
              marginBottom: "4px"
            }}>
              Frozen Amount
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <input
                type="number"
                step="0.01"
                className="input"
                value={form.frozenAmount}
                onChange={(e) => handleInputChange('frozenAmount', parseFloat(e.target.value) || 0)}
                disabled={formMode === 'view'}
                placeholder="0.00"
                style={{ 
                  flex: 1,
                  height: "32px", 
                  fontSize: "13px", 
                  borderRadius: "10px",
                  WebkitAppearance: "none",
                  MozAppearance: "textfield"
                }}
              />
              <button
                type="button"
                style={{
                  width: "28px",
                  height: "28px",
                  backgroundColor: "#20b2aa",
                  border: "none",
                  borderRadius: "3px",
                  color: "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px"
                }}
                title="Lookup"
              >
                ...
              </button>
            </div>
          </div>

          {/* Row 5: Pending Charges, Minimum Balance, Fixed Balance */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ 
              color: "var(--primary-700)", 
              fontWeight: "600", 
              fontSize: "13px",
              marginBottom: "4px"
            }}>
              Pending Charges
            </label>
            <input
              type="number"
              step="0.01"
              className="input"
              value={form.pendingCharges}
              onChange={(e) => handleInputChange('pendingCharges', parseFloat(e.target.value) || 0)}
              disabled={formMode === 'view'}
              placeholder="0.00"
              style={{ 
                height: "32px", 
                fontSize: "13px", 
                borderRadius: "10px",
                WebkitAppearance: "none",
                MozAppearance: "textfield"
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ 
              color: "var(--primary-700)", 
              fontWeight: "600", 
              fontSize: "13px",
              marginBottom: "4px"
            }}>
              Minimum Balance
            </label>
            <input
              type="number"
              step="0.01"
              className="input"
              value={form.minimumBalance}
              onChange={(e) => handleInputChange('minimumBalance', parseFloat(e.target.value) || 0)}
              disabled={formMode === 'view'}
              placeholder="0.00"
              style={{ 
                height: "32px", 
                fontSize: "13px", 
                borderRadius: "10px",
                WebkitAppearance: "none",
                MozAppearance: "textfield"
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ 
              color: "var(--primary-700)", 
              fontWeight: "600", 
              fontSize: "13px",
              marginBottom: "4px"
            }}>
              Fixed Balance
            </label>
            <input
              type="number"
              step="0.01"
              className="input"
              value={form.fixedBalance}
              onChange={(e) => handleInputChange('fixedBalance', parseFloat(e.target.value) || 0)}
              disabled={formMode === 'view'}
              placeholder="0.00"
              style={{ 
                height: "32px", 
                fontSize: "13px", 
                borderRadius: "10px",
                WebkitAppearance: "none",
                MozAppearance: "textfield"
              }}
            />
          </div>
        </div>

        {/* Create Account Button - Below the grid */}
        {(formMode === 'create' || formMode === 'edit') && (
          <div style={{ 
            display: "flex", 
            justifyContent: "flex-end", 
            marginTop: "16px"
          }}>
            <button
              type="submit"
              className="pill"
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                minWidth: "auto"
              }}
            >
              {formMode === 'create' ? 'Create Account' : 'Update Account'}
            </button>
          </div>
        )}

        {/* Collapsible Audit Fields Header */}
        <div 
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 14px",
            backgroundColor: "#f8f9fa",
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            cursor: "pointer",
            marginTop: "16px",
            marginBottom: showAuditFields ? "12px" : "0",
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
              gap: "10px",
              marginTop: "12px",
              padding: "12px",
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
      )}

      {activeTab === "statements" && (
        <div
          style={{
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            overflow: "hidden",
            backgroundColor: "#e3f2fd",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)"
          }}
        >
          <div
            style={{
              padding: "16px 18px",
              backgroundColor: "#e3f2fd",
              borderBottom: "1px solid #e0e0e0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "20px"
            }}
          >
            {/* Left side - Filters */}
            <div style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* Statement For - First Row */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <label style={{ color: "var(--primary-700)", fontWeight: "600", width: "110px" }}>
                  <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Statement For</span>
                </label>
                <select
                  className="form__select"
                  value={statementOption}
                  onChange={(e) => setStatementOption(e.target.value)}
                  style={{ width: "250px" }}
                >
                  <option value="currentMonth">Current Month</option>
                  <option value="currentPrevious">Current & Previous</option>
                  <option value="dateRange">Date Range</option>
                </select>
              </div>

              {/* From Date and To Date - Second Row */}
              <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <label style={{ color: "var(--primary-700)", fontWeight: "600", width: "110px" }}>
                    <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>From Date</span>
                  </label>
                  <input
                    type="date"
                    className="input"
                    value={statementFrom}
                    onChange={(e) => setStatementFrom(e.target.value)}
                    disabled={statementOption !== 'dateRange'}
                    style={{ width: "160px" }}
                  />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <label style={{ color: "var(--primary-700)", fontWeight: "600", width: "60px" }}>
                    <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>To Date</span>
                  </label>
                  <input
                    type="date"
                    className="input"
                    value={statementTo}
                    onChange={(e) => setStatementTo(e.target.value)}
                    disabled={statementOption !== 'dateRange'}
                    style={{ width: "160px" }}
                  />
                </div>
              </div>
            </div>

            {/* Right side - Export Button */}
            <div style={{ position: "relative", marginTop: "30px" }} data-export-dropdown>
              <button
                type="button"
                className="pill"
                onClick={() => setShowExportDropdown(!showExportDropdown)}
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
                <FiDownload />
                Export
              </button>
              
              {/* Export Dropdown */}
              {showExportDropdown && (
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
                    onClick={handlePrint}
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
                    <FiPrinter style={{ color: "var(--primary-600)" }} />
                    Print
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleExportExcel}
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
                    <FiFile style={{ color: "#107C41" }} />
                    Export Excel
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleExportCSV}
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
                    <FiFileText style={{ color: "#10B981" }} />
                    Export CSV
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleExportJSON}
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
                    <FiFileText style={{ color: "#F59E0B" }} />
                    Export JSON
                  </button>
                </div>
              )}
            </div>
          </div>

          <div style={{ backgroundColor: "white" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "120px 1fr 120px 120px 120px 140px 140px 140px",
                fontWeight: 600,
                backgroundColor: "#e2e8f0",
                borderBottom: "1px solid #cbd5f5",
                textTransform: "uppercase",
                color: "#1e40af"
              }}
            >
              <div style={{ padding: "12px", borderRight: "1px solid #cbd5f5" }}>Date</div>
              <div style={{ padding: "12px", borderRight: "1px solid #cbd5f5" }}>Particulars</div>
              <div style={{ padding: "12px", borderRight: "1px solid #cbd5f5", textAlign: "right" }}>Debit</div>
              <div style={{ padding: "12px", borderRight: "1px solid #cbd5f5", textAlign: "right" }}>Credit</div>
              <div style={{ padding: "12px", borderRight: "1px solid #cbd5f5", textAlign: "right" }}>Closing</div>
              <div style={{ padding: "12px", borderRight: "1px solid #cbd5f5" }}>Operator ID</div>
              <div style={{ padding: "12px", borderRight: "1px solid #cbd5f5" }}>Supervisor ID</div>
              <div style={{ padding: "12px" }}>Ref No</div>
            </div>

            <div style={{ minHeight: "240px" }}>
              {isLoadingStatements ? (
                <div style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>
                  Loading statements...
                </div>
              ) : statementRowData.length <= 2 ? (
                <div style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>
                  No statements found for the selected period.
                </div>
              ) : (
                statementRowData.map((row, index) => {
                  const isNegativeDebit = Number(row.debit) < 0;
                  const isSpecialRow = row.isSpecialRow;
                  // Alternate row colors for regular rows, special styling for opening/closing
                  const rowBackground = isSpecialRow ? "#dde9ff" : (index % 2 === 0 ? "#ffffff" : "#f5f8ff");
                  const fontWeight = isSpecialRow ? 700 : (isNegativeDebit ? 600 : 400);
                  const textColor = isSpecialRow ? "#1d4ed8" : (isNegativeDebit && !isSpecialRow ? '#ef4444' : '#1f2937');
                  
                  return (
                    <div
                      key={`entry-${row.id}`}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "120px 1fr 120px 120px 120px 140px 140px 140px",
                        borderBottom: "1px solid #e5e7eb",
                        backgroundColor: rowBackground,
                        fontSize: isSpecialRow ? "13px" : "14px",
                        color: textColor,
                        fontWeight: fontWeight
                      }}
                    >
                      <div style={{ padding: "10px 12px", borderRight: "1px solid #e5e7eb" }}>
                        {row.date ? new Date(row.date).toLocaleDateString('en-GB') : ''}
                      </div>
                      <div style={{ 
                        padding: "10px 12px", 
                        borderRight: "1px solid #e5e7eb", 
                        whiteSpace: isSpecialRow ? 'normal' : 'nowrap',
                        textTransform: isSpecialRow ? 'uppercase' : 'none'
                      }}>
                        {row.particulars || ''}
                      </div>
                      <div style={{ 
                        padding: "10px 12px", 
                        borderRight: "1px solid #e5e7eb", 
                        textAlign: "right" 
                      }}>
                        {row.debit > 0 ? formatAmountDisplay(row.debit) : ''}
                      </div>
                      <div style={{ 
                        padding: "10px 12px", 
                        borderRight: "1px solid #e5e7eb", 
                        textAlign: "right" 
                      }}>
                        {row.credit > 0 ? formatAmountDisplay(row.credit) : ''}
                      </div>
                      <div style={{ 
                        padding: "10px 12px", 
                        borderRight: "1px solid #e5e7eb", 
                        textAlign: "right",
                        fontWeight: isSpecialRow ? 700 : 400
                      }}>
                        {formatAmountDisplay(row.closing)}
                      </div>
                      <div style={{ padding: "10px 12px", borderRight: "1px solid #e5e7eb" }}>
                        {row.operatorId || ''}
                      </div>
                      <div style={{ padding: "10px 12px", borderRight: "1px solid #e5e7eb" }}>
                        {row.supervisorId || ''}
                      </div>
                      <div style={{ padding: "10px 12px" }}>
                        {row.refNo || ''}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "signatories" && (
        <SignatoriesTab
          accountId={id}
          member={selectedMember}
          accountSignatories={accountSignatories}
          onAddSignatory={addSignatoryToAccount}
          onEditSignatory={updateSignatoryForAccount}
          onRemoveSignatory={removeSignatoryFromAccount}
          isLoading={isLoadingSignatories}
          existingMemberSignatories={existingMemberSignatories}
          error={signatoriesError}
          isViewMode={formMode === 'view'}
          showMessage={showMessage}
        />
      )}

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

      {showProductLookup && (
        <ProductLookupModal
          isOpen={showProductLookup}
          onClose={() => setShowProductLookup(false)}
          onSelectProduct={handleProductSelect}
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
              Are you sure you want to delete this fixed deposit account? This action cannot be undone.
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

export default FixedDepositsForm;
