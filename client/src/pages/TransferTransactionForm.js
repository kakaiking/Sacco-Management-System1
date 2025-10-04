import React, { useContext, useEffect, useState, useRef } from "react";
import { useHistory } from "react-router-dom";
import { FiSearch, FiMoreVertical, FiEdit3, FiTrash2, FiRefreshCw, FiCheck } from "react-icons/fi";
import axios from "axios";
import { useSnackbar } from "../helpers/SnackbarContext";
import { AuthContext } from "../helpers/AuthContext";
import DashboardWrapper from '../components/DashboardWrapper';
import AccountLookupModal from '../components/AccountLookupModal';
import TransactionLookupModal from '../components/TransactionLookupModal';

function TransferTransactionForm({ id: propId, isWindowMode = false }) {
  const history = useHistory();
  const { authState, isLoading } = useContext(AuthContext);
  const { showMessage } = useSnackbar();
  
  // Use prop id if in window mode, otherwise default to 'new'
  const id = isWindowMode ? propId : 'new';
  const isCreate = id === "new";
  const isViewingSpecificTransaction = id && id !== "new";
  const [saving, setSaving] = useState(false);
  
  // Form mode state: 'create', 'view', 'edit'
  const [formMode, setFormMode] = useState(isCreate ? 'create' : 'view');
  
  // Actions dropdown state
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  
  // Selected transaction state
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [verifierRemarks, setVerifierRemarks] = useState("");
  
  // Ref for actions dropdown
  const actionsDropdownRef = useRef(null);

  const [form, setForm] = useState({
    transactionId: "",
    saccoId: authState?.saccoId || "",
    saccoName: "",
    debitAccountId: "",
    debitAccountName: "",
    creditAccountId: "",
    creditAccountName: "",
    amount: "",
    type: "TRANSFER",
    status: "Pending",
    remarks: "",
    createdBy: "",
    createdOn: "",
    modifiedBy: "",
    modifiedOn: "",
    approvedBy: "",
    approvedOn: "",
  });

  // Modal states
  const [isDebitAccountModalOpen, setIsDebitAccountModalOpen] = useState(false);
  const [isCreditAccountModalOpen, setIsCreditAccountModalOpen] = useState(false);
  const [isTransactionLookupModalOpen, setIsTransactionLookupModalOpen] = useState(false);

  // Update saccoId when authState changes
  useEffect(() => {
    if (authState?.saccoId) {
      setForm(prev => ({ ...prev, saccoId: authState.saccoId }));
    }
  }, [authState]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionsDropdownRef.current && !actionsDropdownRef.current.contains(event.target)) {
        setShowActionsDropdown(false);
      }
    };

    if (showActionsDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showActionsDropdown]);

  useEffect(() => {
    // Only redirect if not in window mode and authentication check is complete
    if (!isWindowMode && !isLoading && !authState.status) {
      history.push("/login");
    }
  }, [authState, isLoading, history, isWindowMode]);

  // Generate Transaction ID for new transactions
  const generateTransactionId = () => {
    const randomNum = Math.floor(1000000 + Math.random() * 9000000); // 7 digits
    return `T-${randomNum}`;
  };

  useEffect(() => {
    const load = async () => {
      if (!isCreate) {
        try {
          // First, get the current transaction to get its reference number
          const res = await axios.get(`http://localhost:3001/transactions/${id}`, {
            headers: { accessToken: localStorage.getItem("accessToken") },
          });
          const data = res.data?.entity || res.data;
          
          // If we have a reference number, fetch all transactions with the same reference
          if (data.referenceNumber) {
            try {
              const relatedRes = await axios.get(`http://localhost:3001/transactions/reference/${data.referenceNumber}`, {
                headers: { accessToken: localStorage.getItem("accessToken") },
              });
              const relatedTransactions = relatedRes.data?.entity || relatedRes.data || [];
              
              // Find debit and credit transactions
              const debitTransaction = relatedTransactions.find(t => t.entryType === 'DEBIT');
              const creditTransaction = relatedTransactions.find(t => t.entryType === 'CREDIT');
              
              setForm({
                transactionId: data.transactionId || "",
                saccoId: data.saccoId || "",
                saccoName: data.sacco ? data.sacco.saccoName : "",
                debitAccountId: debitTransaction ? debitTransaction.accountId : "",
                debitAccountName: debitTransaction && (
                  (debitTransaction.accountType === 'MEMBER' && debitTransaction.memberAccount) ||
                  (debitTransaction.accountType === 'GL' && debitTransaction.glAccount)
                ) ? 
                  debitTransaction.accountType === 'MEMBER' 
                    ? `${debitTransaction.memberAccount.accountName} (${debitTransaction.memberAccount.accountId})`
                    : `${debitTransaction.glAccount.accountName} (${debitTransaction.glAccount.glAccountId})`
                  : debitTransaction ? debitTransaction.accountId : "",
                creditAccountId: creditTransaction ? creditTransaction.accountId : "",
                creditAccountName: creditTransaction && (
                  (creditTransaction.accountType === 'MEMBER' && creditTransaction.memberAccount) ||
                  (creditTransaction.accountType === 'GL' && creditTransaction.glAccount)
                ) ? 
                  creditTransaction.accountType === 'MEMBER' 
                    ? `${creditTransaction.memberAccount.accountName} (${creditTransaction.memberAccount.accountId})`
                    : `${creditTransaction.glAccount.accountName} (${creditTransaction.glAccount.glAccountId})`
                  : creditTransaction ? creditTransaction.accountId : "",
                amount: data.amount || "",
                type: data.type || "TRANSFER",
                status: data.status || "Pending",
                remarks: data.remarks || "",
                createdBy: data.createdBy || "",
                createdOn: data.createdOn || "",
                modifiedBy: data.modifiedBy || "",
                modifiedOn: data.modifiedOn || "",
                approvedBy: data.approvedBy || "",
                approvedOn: data.approvedOn || "",
              });
            } catch (error) {
              console.error("Error fetching related transactions:", error);
              // Fallback to original data if related transactions fetch fails
              setForm({
                transactionId: data.transactionId || "",
                saccoId: data.saccoId || "",
                saccoName: data.sacco ? data.sacco.saccoName : "",
                debitAccountId: data.debitAccountId || "",
                debitAccountName: data.debitAccount ? `${data.debitAccount.accountName} (${data.debitAccount.accountId})` : data.debitAccountName || "",
                creditAccountId: data.creditAccountId || "",
                creditAccountName: data.creditAccount ? `${data.creditAccount.accountName} (${data.creditAccount.accountId})` : data.creditAccountName || "",
                amount: data.amount || "",
                type: data.type || "TRANSFER",
                status: data.status || "Pending",
                remarks: data.remarks || "",
                createdBy: data.createdBy || "",
                createdOn: data.createdOn || "",
                modifiedBy: data.modifiedBy || "",
                modifiedOn: data.modifiedOn || "",
                approvedBy: data.approvedBy || "",
                approvedOn: data.approvedOn || "",
              });
            }
          } else {
            // Fallback for transactions without reference number
            setForm({
              transactionId: data.transactionId || "",
              saccoId: data.saccoId || "",
              saccoName: data.sacco ? data.sacco.saccoName : "",
              debitAccountId: data.debitAccountId || "",
              debitAccountName: data.debitAccount ? `${data.debitAccount.accountName} (${data.debitAccount.accountId})` : data.debitAccountName || "",
              creditAccountId: data.creditAccountId || "",
              creditAccountName: data.creditAccount ? `${data.creditAccount.accountName} (${data.creditAccount.accountId})` : data.creditAccountName || "",
              amount: data.amount || "",
              type: data.type || "TRANSFER",
              status: data.status || "Pending",
              remarks: data.remarks || "",
              createdBy: data.createdBy || "",
              createdOn: data.createdOn || "",
              modifiedBy: data.modifiedBy || "",
              modifiedOn: data.modifiedOn || "",
              approvedBy: data.approvedBy || "",
              approvedOn: data.approvedOn || "",
            });
          }
        } catch (error) {
          console.error("Error loading transaction:", error);
          showMessage("Failed to load transaction", "error");
        }
      } else {
        // Generate Transaction ID for new transactions
        setForm(prev => ({ ...prev, transactionId: generateTransactionId() }));
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isCreate]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Validate that SACCO ID is set from auth state
      if (!form.saccoId || form.saccoId === 'SYSTEM') {
        showMessage("SACCO ID not found. Please ensure you are logged in with a valid SACCO account.", "error");
        setSaving(false);
        return;
      }
      
      const payload = { ...form };
      // Remove display fields that shouldn't be sent to backend
      delete payload.saccoName;
      delete payload.debitAccountName;
      delete payload.creditAccountName;
      
      console.log("Sending transaction payload:", payload);
      
      if (formMode === 'create') {
        await axios.post("http://localhost:3001/transactions", payload, { 
          headers: { accessToken: localStorage.getItem("accessToken") } 
        });
        showMessage("Transfer transaction created successfully", "success");
        // Reset form for new entry
        setForm({
          transactionId: generateTransactionId(),
          saccoId: authState?.saccoId || "",
          saccoName: "",
          debitAccountId: "",
          debitAccountName: "",
          creditAccountId: "",
          creditAccountName: "",
          amount: "",
          type: "TRANSFER",
          status: "Pending",
          remarks: "",
          createdBy: "",
          createdOn: "",
          modifiedBy: "",
          modifiedOn: "",
          approvedBy: "",
          approvedOn: "",
        });
      } else if (formMode === 'edit') {
        const transactionId = selectedTransaction ? selectedTransaction.id : id;
        await axios.put(`http://localhost:3001/transactions/${transactionId}`, payload, { 
          headers: { accessToken: localStorage.getItem("accessToken") } 
        });
        showMessage("Transfer transaction updated successfully", "success");
        setFormMode('view');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to save transaction";
      showMessage(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDebitAccountSelect = (account) => {
    // Member accounts use 'shortName', GL accounts use 'accountName'
    const displayName = account.shortName || account.accountName || 'Unknown Account';
    setForm(prev => ({
      ...prev,
      debitAccountId: account.accountId, // Use accountId string instead of database id
      debitAccountName: `${displayName} (${account.accountId})`
    }));
  };

  const handleCreditAccountSelect = (account) => {
    // Member accounts use 'shortName', GL accounts use 'accountName'
    const displayName = account.shortName || account.accountName || 'Unknown Account';
    setForm(prev => ({
      ...prev,
      creditAccountId: account.accountId, // Use accountId string instead of database id
      creditAccountName: `${displayName} (${account.accountId})`
    }));
  };

  const handleTransactionSelect = async (transaction) => {
    setSelectedTransaction(transaction);
    setFormMode('view');
    
    // Fetch full transaction details with related transactions
    try {
      if (transaction.referenceNumber) {
        const relatedRes = await axios.get(`http://localhost:3001/transactions/reference/${transaction.referenceNumber}`, {
          headers: { accessToken: localStorage.getItem("accessToken") },
        });
        const relatedTransactions = relatedRes.data?.entity || relatedRes.data || [];
        
        // Find debit and credit transactions
        const debitTransaction = relatedTransactions.find(t => t.entryType === 'DEBIT');
        const creditTransaction = relatedTransactions.find(t => t.entryType === 'CREDIT');
        
        setForm({
          transactionId: transaction.transactionId || "",
          saccoId: transaction.saccoId || "",
          saccoName: transaction.sacco ? transaction.sacco.saccoName : "",
          debitAccountId: debitTransaction ? debitTransaction.accountId : "",
          debitAccountName: debitTransaction && (
            (debitTransaction.accountType === 'MEMBER' && debitTransaction.memberAccount) ||
            (debitTransaction.accountType === 'GL' && debitTransaction.glAccount)
          ) ? 
            debitTransaction.accountType === 'MEMBER' 
              ? `${debitTransaction.memberAccount.accountName} (${debitTransaction.memberAccount.accountId})`
              : `${debitTransaction.glAccount.accountName} (${debitTransaction.glAccount.glAccountId})`
            : debitTransaction ? debitTransaction.accountId : "",
          creditAccountId: creditTransaction ? creditTransaction.accountId : "",
          creditAccountName: creditTransaction && (
            (creditTransaction.accountType === 'MEMBER' && creditTransaction.memberAccount) ||
            (creditTransaction.accountType === 'GL' && creditTransaction.glAccount)
          ) ? 
            creditTransaction.accountType === 'MEMBER' 
              ? `${creditTransaction.memberAccount.accountName} (${creditTransaction.memberAccount.accountId})`
              : `${creditTransaction.glAccount.accountName} (${creditTransaction.glAccount.glAccountId})`
            : creditTransaction ? creditTransaction.accountId : "",
          amount: transaction.amount || "",
          type: transaction.type || "TRANSFER",
          status: transaction.status || "Pending",
          remarks: transaction.remarks || "",
          createdBy: transaction.createdBy || "",
          createdOn: transaction.createdOn || "",
          modifiedBy: transaction.modifiedBy || "",
          modifiedOn: transaction.modifiedOn || "",
          approvedBy: transaction.approvedBy || "",
          approvedOn: transaction.approvedOn || "",
        });
      }
    } catch (error) {
      console.error("Error fetching transaction details:", error);
      showMessage("Failed to load transaction details", "error");
    }
  };

  const handleEdit = () => {
    setFormMode('edit');
    setShowActionsDropdown(false);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
    setShowActionsDropdown(false);
  };

  const confirmDelete = async () => {
    try {
      const transactionId = selectedTransaction ? selectedTransaction.id : id;
      await axios.delete(`http://localhost:3001/transactions/${transactionId}`, { 
        headers: { accessToken: localStorage.getItem("accessToken") } 
      });
      showMessage("Transaction deleted successfully", "success");
      setShowDeleteModal(false);
      handleClearForm();
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to delete transaction";
      showMessage(msg, "error");
    }
  };

  const handleApprove = () => {
    setShowApprovalModal(true);
    setShowActionsDropdown(false);
  };

  const confirmApproval = async () => {
    try {
      // Get the transaction to find its reference number
      const transactionId = selectedTransaction ? selectedTransaction.id : id;
      const transactionRes = await axios.get(`http://localhost:3001/transactions/${transactionId}`, {
        headers: { accessToken: localStorage.getItem("accessToken") }
      });
      const transaction = transactionRes.data.entity || transactionRes.data;
      
      if (!transaction.referenceNumber) {
        throw new Error("Transaction reference number not found");
      }
      
      // Use the correct approval endpoint with reference number
      await axios.put(`http://localhost:3001/transactions/reference/${transaction.referenceNumber}/approve`, {
        verifierRemarks: verifierRemarks
      }, { 
        headers: { accessToken: localStorage.getItem("accessToken") } 
      });
      
      setForm(prev => ({ ...prev, status: "Approved" }));
      showMessage("Transaction approved successfully. Account balances have been updated.", "success");
      setShowApprovalModal(false);
      setVerifierRemarks("");
      
      // Reload the transaction to show updated balances
      if (isViewingSpecificTransaction) {
        window.location.reload();
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to approve transaction";
      showMessage(msg, "error");
    }
  };

  const handleClearForm = () => {
    setSelectedTransaction(null);
    setFormMode('create');
    setForm({
      transactionId: generateTransactionId(),
      saccoId: authState?.saccoId || "",
      saccoName: "",
      debitAccountId: "",
      debitAccountName: "",
      creditAccountId: "",
      creditAccountName: "",
      amount: "",
      type: "TRANSFER",
      status: "Pending",
      remarks: "",
      createdBy: "",
      createdOn: "",
      modifiedBy: "",
      modifiedOn: "",
      approvedBy: "",
      approvedOn: "",
    });
    setShowActionsDropdown(false);
  };

  const formContent = (
    <form className="card" onSubmit={save} style={{ display: "grid", gap: 12, padding: 16 }}>
      {/* Transaction Lookup - Topmost Element */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: formMode === 'create' ? "1fr" : "1fr auto auto", 
          gap: "20px",
          marginBottom: "12px",
          alignItems: "center"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <label style={{ fontWeight: "600", color: "var(--primary-700)", minWidth: "120px" }}>
              Transaction
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
              <div className="combined-member-input" style={{ flex: 1 }}>
                <div className="member-no-section">
                  {selectedTransaction ? selectedTransaction.transactionId : "Select a transaction"}
                </div>
                <div className="member-name-section">
                  {selectedTransaction ? selectedTransaction.referenceNumber || "" : ""}
                </div>
              </div>
              <button
                type="button"
                className="search-icon-external"
                onClick={() => setIsTransactionLookupModalOpen(true)}
                title="Search transactions"
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
            <div style={{ position: "relative" }} ref={actionsDropdownRef}>
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
                    disabled={form.status === "Approved"}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: "none",
                      backgroundColor: "transparent",
                      textAlign: "left",
                      cursor: form.status === "Approved" ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      fontSize: "14px",
                      color: form.status === "Approved" ? "var(--text-disabled)" : "var(--text-primary)",
                      transition: "background-color 0.2s ease",
                      opacity: form.status === "Approved" ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (form.status !== "Approved") {
                        e.target.style.backgroundColor = "var(--surface-2)";
                      }
                    }}
                    onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                  >
                    <FiCheck style={{ color: form.status === "Approved" ? "var(--text-disabled)" : "var(--success-600)" }} />
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
                    <FiTrash2 style={{ color: "var(--error-600)" }} />
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div> 

      <hr style={{ margin: "24px 0", border: "none", borderTop: "1px solid #e0e0e0" }} />

      {/* Main Form Fields */}
      <div className="grid2">
        <label>Debit Account
          <div className="role-input-wrapper">
            <input 
              type="text"
              className="input" 
              value={form.debitAccountName} 
              onChange={e => setForm({ ...form, debitAccountName: e.target.value })} 
              disabled={formMode !== 'create'}
              placeholder="Select debit account"
              readOnly={formMode !== 'create'}
              required
            />
            {formMode === 'create' && (
              <button
                type="button"
                className="role-search-btn"
                onClick={() => setIsDebitAccountModalOpen(true)}
                title="Search accounts"
              >
                <FiSearch />
              </button>
            )}
          </div>
        </label>
        <label>Credit Account
          <div className="role-input-wrapper">
            <input 
              type="text"
              className="input" 
              value={form.creditAccountName} 
              onChange={e => setForm({ ...form, creditAccountName: e.target.value })} 
              disabled={formMode !== 'create'}
              placeholder="Select credit account"
              readOnly={formMode !== 'create'}
              required
            />
            {formMode === 'create' && (
              <button
                type="button"
                className="role-search-btn"
                onClick={() => setIsCreditAccountModalOpen(true)}
                title="Search accounts"
              >
                <FiSearch />
              </button>
            )}
          </div>
        </label>
        <label>Amount
          <input 
            className="input" 
            type="number" 
            step="0.01" 
            min="0" 
            value={form.amount} 
            onChange={e => setForm({ ...form, amount: e.target.value })} 
            required 
            disabled={formMode === 'view'}
            placeholder="Enter amount"
          />
        </label>
      </div>
      
      {/* Transaction Type and Remarks */}
      <div className="grid2">
        <label>Transaction Type
          <select 
            className="input" 
            value={form.type} 
            onChange={e => setForm({ ...form, type: e.target.value })} 
            disabled={formMode === 'view'}
            required
          >
            <option value="">Select transaction type</option>
            <option value="DEPOSIT">Deposit</option>
            <option value="WITHDRAWAL">Withdrawal</option>
            <option value="TRANSFER">Transfer</option>
            <option value="OTHER">Other</option>
          </select>
        </label>
        <label>Remarks
          <input 
            className="input" 
            type="text"
            value={form.remarks} 
            onChange={e => setForm({ ...form, remarks: e.target.value })} 
            disabled={formMode === 'view'}
            placeholder="Optional remarks"
          />
        </label>
      </div>
      
      {/* Action Buttons */}
      {formMode === 'create' && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
          <button
            className="pill"
            type="submit"
            disabled={saving}
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              minWidth: "120px"
            }}
          >
            {saving ? "Saving..." : "Add Transaction"}
          </button>
        </div>
      )}
      
      {formMode === 'edit' && (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
          <button
            type="button"
            className="pill"
            onClick={() => setFormMode('view')}
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              minWidth: "120px",
              backgroundColor: "#6c757d"
            }}
          >
            Cancel
          </button>
          <button
            className="pill"
            type="submit"
            disabled={saving}
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              minWidth: "120px"
            }}
          >
            {saving ? "Saving..." : "Update Transaction"}
          </button>
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
              <input className="input"
                value={form.createdOn ? new Date(form.createdOn).toLocaleDateString() : ""}
                disabled={true}
              />
            </label>

            <label>
              Modified On
              <input className="input"
                value={form.modifiedOn ? new Date(form.modifiedOn).toLocaleDateString() : ""}
                disabled={true}
              />
            </label>

            <label>
              Approved On
              <input className="input"
                value={form.approvedOn ? new Date(form.approvedOn).toLocaleDateString() : ""}
                disabled={true}
              />
            </label>

            <label>
              Created By
              <input className="input"
                value={form.createdBy || ""}
                disabled={true}
              />
            </label>

            <label>
              Modified By
              <input className="input"
                value={form.modifiedBy || ""}
                disabled={true}
              />
            </label>
            
            <label>
              Approved By
              <input className="input"
                value={form.approvedBy || ""}
                disabled={true}
              />
            </label>
          </div>
        </>
      )}
    </form>
  );

  return (
    <>
      {isWindowMode ? (
        <div style={{ padding: '0', height: '100%', overflowY: 'auto' }}>
          {formContent}
        </div>
      ) : (
        <DashboardWrapper>
          <header className="header">
            <div className="header__left">
              <div className="greeting">Transfer Transaction</div>
            </div>
          </header>

          <main className="dashboard__content">
            {formContent}
          </main>
        </DashboardWrapper>
      )}

      {/* Modals */}
      <TransactionLookupModal
        isOpen={isTransactionLookupModalOpen}
        onClose={() => setIsTransactionLookupModalOpen(false)}
        onSelectTransaction={handleTransactionSelect}
      />

      <AccountLookupModal
        isOpen={isDebitAccountModalOpen}
        onClose={() => setIsDebitAccountModalOpen(false)}
        onSelectAccount={handleDebitAccountSelect}
      />

      <AccountLookupModal
        isOpen={isCreditAccountModalOpen}
        onClose={() => setIsCreditAccountModalOpen(false)}
        onSelectAccount={handleCreditAccountSelect}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '100%',
            maxWidth: '400px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>
              Confirm Delete
            </h3>
            <p style={{ margin: '0 0 24px 0', color: '#666' }}>
              Are you sure you want to delete this transaction? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
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
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>
              Approve Transaction
            </h3>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Verifier Remarks (Optional)
              </label>
              <textarea
                value={verifierRemarks}
                onChange={(e) => setVerifierRemarks(e.target.value)}
                placeholder="Enter any remarks..."
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setShowApprovalModal(false);
                  setVerifierRemarks("");
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmApproval}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default TransferTransactionForm;

