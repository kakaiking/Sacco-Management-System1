import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { FiArrowLeft, FiSearch, FiMoreVertical, FiCheck, FiEdit3, FiTrash2, FiRefreshCw } from "react-icons/fi";
import axios from "axios";
import { useSnackbar } from "../helpers/SnackbarContext";
import { AuthContext } from "../helpers/AuthContext";
import { usePermissions } from "../hooks/usePermissions";
import { PERMISSIONS } from "../helpers/PermissionUtils";
import DashboardWrapper from '../components/DashboardWrapper';
import SaccoLookupModal from '../components/SaccoLookupModal';
import AccountLookupModal from '../components/AccountLookupModal';
import TransactionLookupModal from '../components/TransactionLookupModal';

function CashTransactionForm({ isWindowMode = false, onRefresh }) {
  const history = useHistory();
  const { authState, isLoading } = useContext(AuthContext);
  const { showMessage } = useSnackbar();
  const { canView, canAdd } = usePermissions();

  const [form, setForm] = useState({
    transactionId: "",
    saccoId: "",
    saccoName: "",
    transactionType: "credit", // "debit" or "credit"
    accountId: "",
    accountName: "",
    amount: "",
    status: "Pending",
    remarks: "",
    createdBy: "",
    createdOn: "",
  });

  const [cashierTill, setCashierTill] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Form mode state: 'create' or 'view'
  const [formMode, setFormMode] = useState('create');
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Modal states
  const [isSaccoModalOpen, setIsSaccoModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isTransactionLookupOpen, setIsTransactionLookupOpen] = useState(false);
  
  // Actions dropdown state
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);

  useEffect(() => {
    // Only redirect if authentication check is complete and user is not authenticated and not in window mode
    if (!isLoading && !authState.status && !isWindowMode) {
      history.push("/login");
    }
  }, [authState, isLoading, history, isWindowMode]);

  // Generate Transaction ID for new transactions
  const generateTransactionId = () => {
    const randomNum = Math.floor(1000000 + Math.random() * 9000000); // 7 digits
    return `T-${randomNum}`;
  };

  // Load cashier till information when component mounts
  useEffect(() => {
    const loadCashierTill = async () => {
      if (!authState.status || authState.role !== 'Cashier') {
        return;
      }

      try {
        const response = await axios.get(`http://localhost:3001/tills/cashier/${authState.userId}`, {
          headers: { accessToken: localStorage.getItem('accessToken') }
        });

        if (response.data.code === 200 && response.data.entity) {
          setCashierTill(response.data.entity);
          // Auto-set sacco from till
          setForm(prev => ({
            ...prev,
            saccoId: response.data.entity.saccoId,
            saccoName: response.data.entity.sacco?.saccoName || ""
          }));
        } else {
          showMessage("No till found for this cashier", "error");
        }
      } catch (error) {
        console.error("Error loading cashier till:", error);
        showMessage("Error loading cashier till information", "error");
      }
    };

    loadCashierTill();
  }, [authState, showMessage]);


  // Set transaction ID when component mounts
  useEffect(() => {
    setForm(prev => ({ ...prev, transactionId: generateTransactionId() }));
  }, []);

  // Handle transaction selection from lookup
  const handleTransactionSelect = (transaction) => {
    setSelectedTransaction(transaction);
    setFormMode('view');
    setForm({
      transactionId: transaction.transactionId || "",
      saccoId: transaction.saccoId || "",
      saccoName: transaction.sacco?.saccoName || "",
      transactionType: transaction.type === "DEPOSIT" ? "credit" : "debit",
      accountId: transaction.debitAccountId || transaction.creditAccountId || "",
      accountName: `${transaction.debitAccount?.member?.firstName || ''} ${transaction.debitAccount?.member?.lastName || ''}`.trim() || 
                   `${transaction.creditAccount?.member?.firstName || ''} ${transaction.creditAccount?.member?.lastName || ''}`.trim(),
      amount: transaction.amount || "",
      status: transaction.status || "Pending",
      remarks: transaction.remarks || "",
      createdBy: transaction.createdBy || "",
      createdOn: transaction.createdOn || "",
    });
    setIsTransactionLookupOpen(false);
  };

  // Handle Clear Form action
  const handleClearForm = () => {
    setSelectedTransaction(null);
    setFormMode('create');
    setForm({
      transactionId: generateTransactionId(),
      saccoId: cashierTill?.saccoId || "",
      saccoName: cashierTill?.sacco?.saccoName || "",
      transactionType: "credit",
      accountId: "",
      accountName: "",
      amount: "",
      status: "Pending",
      remarks: "",
      createdBy: "",
      createdOn: "",
    });
    setShowActionsDropdown(false);
  };

  // Handle Approve action
  const handleApprove = async () => {
    if (!selectedTransaction) return;
    
    try {
      const response = await axios.put(
        `http://localhost:3001/transactions/${selectedTransaction.id}/approve`,
        { remarks: "Approved by cashier" },
        { headers: { accessToken: localStorage.getItem('accessToken') } }
      );
      
      if (response.data.code === 200) {
        showMessage("Transaction approved successfully", "success");
        setForm(prev => ({ ...prev, status: "Approved" }));
        if (selectedTransaction) {
          setSelectedTransaction(prev => ({ ...prev, status: "Approved" }));
        }
      }
    } catch (error) {
      console.error("Error approving transaction:", error);
      showMessage(error.response?.data?.message || "Error approving transaction", "error");
    }
    setShowActionsDropdown(false);
  };

  // Handle Edit action
  const handleEdit = () => {
    setFormMode('edit');
    setShowActionsDropdown(false);
  };

  // Handle Delete action
  const handleDelete = async () => {
    if (!selectedTransaction) return;
    
    const confirmed = window.confirm("Are you sure you want to delete this transaction?");
    if (!confirmed) return;
    
    try {
      const response = await axios.delete(
        `http://localhost:3001/transactions/${selectedTransaction.id}`,
        { headers: { accessToken: localStorage.getItem('accessToken') } }
      );
      
      if (response.data.code === 200) {
        showMessage("Transaction deleted successfully", "success");
        handleClearForm();
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
      showMessage(error.response?.data?.message || "Error deleting transaction", "error");
    }
    setShowActionsDropdown(false);
  };

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

  const save = async (e) => {
    e.preventDefault();
    
    if (!cashierTill) {
      showMessage("Cashier till information not found", "error");
      return;
    }

    if (!form.saccoId || !form.accountId || !form.amount) {
      showMessage("Please fill in all required fields", "error");
      return;
    }

    try {
      setSaving(true);
      
      // Prepare transaction data for double-entry
      const transactionData = {
        saccoId: form.saccoId,
        amount: parseFloat(form.amount),
        remarks: form.remarks,
        status: form.status,
        transactionType: form.transactionType,
        memberAccountId: form.accountId,
        tillGlAccountId: cashierTill.glAccountId
      };

      const response = await axios.post("http://localhost:3001/transactions/cash", transactionData, {
        headers: { accessToken: localStorage.getItem('accessToken') }
      });

      if (response.data.code === 201) {
        showMessage("Cash transaction created successfully", "success");
        history.push("/transactions");
      } else {
        showMessage(response.data.message || "Error creating transaction", "error");
      }
    } catch (error) {
      console.error("Error saving cash transaction:", error);
      showMessage(error.response?.data?.message || "Error creating transaction", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaccoSelect = (sacco) => {
    setForm(prev => ({
      ...prev,
      saccoId: sacco.saccoId,
      saccoName: sacco.saccoName
    }));
    setIsSaccoModalOpen(false);
  };

  const handleAccountSelect = (account) => {
    setForm(prev => ({
      ...prev,
      accountId: account.accountId,
      accountName: `${account.member?.firstName || ''} ${account.member?.lastName || ''} - ${account.product?.productName || ''}`.trim()
    }));
    setIsAccountModalOpen(false);
  };

  // Show loading state only when authentication is still loading
  if (isLoading) {
    const LoadingContent = (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
        <div>Loading...</div>
      </div>
    );
    return isWindowMode ? LoadingContent : <DashboardWrapper>{LoadingContent}</DashboardWrapper>;
  }

  // Check if user has permission to view cash transaction module
  if (!canView(PERMISSIONS.CASH_TRANSACTION_MAINTENANCE)) {
    const AccessDenied = (
      <div style={{ 
        display: "flex", 
        flexDirection: "column",
        justifyContent: "center", 
        alignItems: "center", 
        height: "300px",
        textAlign: "center",
        padding: "20px"
      }}>
        <div style={{ 
          fontSize: "24px", 
          color: "#e74c3c", 
          marginBottom: "16px",
          fontWeight: "600"
        }}>
          Access Denied
        </div>
        <div style={{ 
          fontSize: "16px", 
          color: "#666", 
          marginBottom: "8px"
        }}>
          You don't have permission to access the Cash Transaction module.
        </div>
        <div style={{ 
          fontSize: "14px", 
          color: "#999"
        }}>
          Please contact your administrator to request access to this feature.
        </div>
      </div>
    );
    return isWindowMode ? AccessDenied : <DashboardWrapper>{AccessDenied}</DashboardWrapper>;
  }

  // Check if user has permission to add cash transactions
  if (!canAdd(PERMISSIONS.CASH_TRANSACTION_MAINTENANCE)) {
    const PermissionDenied = (
      <div style={{ 
        display: "flex", 
        flexDirection: "column",
        justifyContent: "center", 
        alignItems: "center", 
        height: "300px",
        textAlign: "center",
        padding: "20px"
      }}>
        <div style={{ 
          fontSize: "24px", 
          color: "#e74c3c", 
          marginBottom: "16px",
          fontWeight: "600"
        }}>
          Permission Denied
        </div>
        <div style={{ 
          fontSize: "16px", 
          color: "#666", 
          marginBottom: "8px"
        }}>
          You can view cash transactions but don't have permission to create new ones.
        </div>
        <div style={{ 
          fontSize: "14px", 
          color: "#999"
        }}>
          Please contact your administrator to request permission to add cash transactions.
        </div>
      </div>
    );
    return isWindowMode ? PermissionDenied : <DashboardWrapper>{PermissionDenied}</DashboardWrapper>;
  }

  // Check if user is a Cashier (role-based check)
  if (authState.role !== 'Cashier') {
    const RoleRestriction = (
      <div style={{ 
        display: "flex", 
        flexDirection: "column",
        justifyContent: "center", 
        alignItems: "center", 
        height: "300px",
        textAlign: "center",
        padding: "20px"
      }}>
        <div style={{ 
          fontSize: "24px", 
          color: "#e74c3c", 
          marginBottom: "16px",
          fontWeight: "600"
        }}>
          Role Restriction
        </div>
        <div style={{ 
          fontSize: "16px", 
          color: "#666", 
          marginBottom: "8px"
        }}>
          This feature is only available for users with the Cashier role.
        </div>
        <div style={{ 
          fontSize: "14px", 
          color: "#999"
        }}>
          Your current role: <strong>{authState.role}</strong>
        </div>
      </div>
    );
    return isWindowMode ? RoleRestriction : <DashboardWrapper>{RoleRestriction}</DashboardWrapper>;
  }

  // Show loading state while fetching cashier till information
  if (!cashierTill) {
    const LoadingTill = (
      <div style={{ 
        display: "flex", 
        flexDirection: "column",
        justifyContent: "center", 
        alignItems: "center", 
        height: "300px",
        textAlign: "center",
        padding: "20px"
      }}>
        <div style={{ 
          fontSize: "20px", 
          color: "#f39c12", 
          marginBottom: "16px",
          fontWeight: "600"
        }}>
          Loading Cashier Information...
        </div>
        <div style={{ 
          fontSize: "14px", 
          color: "#999"
        }}>
          Please wait while we load your till information.
        </div>
      </div>
    );
    return isWindowMode ? LoadingTill : <DashboardWrapper>{LoadingTill}</DashboardWrapper>;
  }

  const FormContent = (
    <>
      {!isWindowMode && (
        <header className="header">
          <div className="header__left">
            <button className="iconBtn" onClick={() => history.push("/transactions")} title="Back" aria-label="Back" style={{ marginRight: 8 }}>
              <FiArrowLeft className="icon" style={{ fontWeight: "bolder" }}/>
            </button>
            <div className="greeting">Add Cash Transaction</div>
          </div>
        </header>
      )}

      <main className={isWindowMode ? "" : "dashboard__content"}>
        <form className="card" onSubmit={save} style={{ display: "grid", gap: 12, padding: 16 }}>
          {/* Transaction Lookup - First Row */}
          <div style={{ 
            marginBottom: "16px"
          }}>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: formMode === 'create' ? "1fr" : "1fr auto auto", 
              gap: "20px",
              marginBottom: "12px",
              alignItems: "center"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <label style={{ fontWeight: "600", color: "var(--primary-700)", minWidth: "100px" }}>
                  Transaction
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                  <div className="combined-member-input" style={{ flex: 1 }}>
                    <div className="member-no-section">
                      {selectedTransaction ? selectedTransaction.transactionId : "New Transaction"}
                    </div>
                    <div className="member-name-section">
                      {selectedTransaction ? (
                        `${selectedTransaction.type || ''} - ${selectedTransaction.status || 'Pending'}`
                      ) : ""}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="search-icon-external"
                    onClick={() => setIsTransactionLookupOpen(true)}
                    title="Search transactions"
                  >
                    <FiSearch />
                  </button>
                </div>
              </div>
              
              {/* Status Badge - Only show in view mode */}
              {formMode === 'view' && (
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

          {/* Cashier Till Information */}
          <div style={{ 
            padding: "16px", 
            backgroundColor: "#f8f9fa", 
            borderRadius: "8px", 
            marginBottom: "16px" 
          }}>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: "600" }}>Cashier Till Information</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "14px" }}>
              <div><strong>Till:</strong> {cashierTill.tillName}</div>
              <div><strong>GL Account:</strong> {cashierTill.glAccount?.accountName}</div>
            </div>
          </div>

          <div className="grid2">
            <label>Sacco
              <div className="role-input-wrapper">
                <input 
                  type="text"
                  className="input" 
                  value={form.saccoName} 
                  onChange={e => setForm({ ...form, saccoName: e.target.value })} 
                  placeholder="Select a sacco"
                  readOnly
                  required
                  disabled={formMode === 'view'}
                />
                <button
                  type="button"
                  className="role-search-btn"
                  onClick={() => setIsSaccoModalOpen(true)}
                  title="Search saccos"
                  disabled={formMode === 'view'}
                >
                  <FiSearch />
                </button>
              </div>
              {form.saccoId && form.saccoId !== 'SYSTEM' && (
                <small style={{ color: 'var(--primary-500)', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  SACCO ID: {form.saccoId}
                </small>
              )}
            </label>
            <label>Transaction Type
              <select
                className="input"
                value={form.transactionType}
                onChange={e => setForm({ ...form, transactionType: e.target.value })}
                required
                disabled={formMode === 'view'}
              >
                <option value="credit">Credit (Member Deposit)</option>
                <option value="debit">Debit (Member Withdrawal)</option>
              </select>
            </label>
            <label>Member Account
              <div className="role-input-wrapper">
                <input
                  className="input"
                  value={form.accountName}
                  placeholder="Select Member Account"
                  readOnly
                  required
                  disabled={formMode === 'view'}
                />
                <button
                  type="button"
                  className="role-search-btn"
                  onClick={() => setIsAccountModalOpen(true)}
                  title="Search accounts"
                  disabled={formMode === 'view'}
                >
                  <FiSearch />
                </button>
              </div>
            </label>
            <label>Amount<input className="input" type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required placeholder="Enter amount" disabled={formMode === 'view'} /></label>
          </div>
          
          {/* Remarks */}
          <div style={{ marginBottom: "24px" }}>
            <label>Remarks
              <textarea
                className="input"
                value={form.remarks}
                onChange={e => setForm({ ...form, remarks: e.target.value })}
                placeholder="Enter additional remarks (optional)"
                rows={3}
                style={{
                  resize: "vertical"
                }}
                disabled={formMode === 'view'}
              />
            </label>
          </div>

          {/* Action Buttons */}
          {formMode !== 'view' && (
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px" }}>
              {!isWindowMode && (
                <button type="button" className="btn btn--secondary" onClick={() => history.push("/transactions")}>
                  Cancel
                </button>
              )}
              <button type="submit" className="btn btn--primary" disabled={saving}>
                {saving ? (formMode === 'edit' ? "Updating..." : "Creating...") : (formMode === 'edit' ? "Update Transaction" : "Create Cash Transaction")}
              </button>
            </div>
          )}
        </form>
      </main>

      {/* Modals */}
      <SaccoLookupModal
        isOpen={isSaccoModalOpen}
        onClose={() => setIsSaccoModalOpen(false)}
        onSelectSacco={handleSaccoSelect}
      />

      <AccountLookupModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onSelectAccount={handleAccountSelect}
        saccoId={form.saccoId}
      />

      <TransactionLookupModal
        isOpen={isTransactionLookupOpen}
        onClose={() => setIsTransactionLookupOpen(false)}
        onSelectTransaction={handleTransactionSelect}
      />
    </>
  );

  return isWindowMode ? (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      overflow: 'auto', 
      padding: '20px',
      boxSizing: 'border-box',
      backgroundColor: 'white'
    }}>
      {FormContent}
    </div>
  ) : (
    <DashboardWrapper>
      {FormContent}
    </DashboardWrapper>
  );
}

export default CashTransactionForm;
