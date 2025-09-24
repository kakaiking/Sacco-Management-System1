import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { FiArrowLeft, FiPlus, FiTrash2, FiSearch, FiCheck, FiX } from "react-icons/fi";
import axios from "axios";
import { useSnackbar } from "../helpers/SnackbarContext";
import { AuthContext } from "../helpers/AuthContext";
import DashboardWrapper from '../components/DashboardWrapper';
import SaccoLookupModal from '../components/SaccoLookupModal';
import AccountLookupModal from '../components/AccountLookupModal';
import frontendLoggingService from "../services/frontendLoggingService";

function SmartTeller() {
  const history = useHistory();
  const { authState, isLoading } = useContext(AuthContext);
  const { showMessage } = useSnackbar();

  const [form, setForm] = useState({
    transactionId: "",
    saccoId: "",
    saccoName: "",
    transactionType: "TRANSFER",
    status: "Pending",
    remarks: "",
    createdBy: "",
    createdOn: "",
  });

  const [entries, setEntries] = useState([
    { id: 1, type: "debit", accountId: "", accountName: "", amount: "" },
    { id: 2, type: "credit", accountId: "", accountName: "", amount: "" }
  ]);

  const [saving, setSaving] = useState(false);
  const [isSaccoModalOpen, setIsSaccoModalOpen] = useState(false);
  const [activeAccountModal, setActiveAccountModal] = useState(null);

  // Transaction type options
  const transactionTypeOptions = [
    { value: "TRANSFER", label: "Transfer" },
    { value: "DEPOSIT", label: "Deposit" },
    { value: "WITHDRAWAL", label: "Withdrawal" },
    { value: "LOAN_DISBURSEMENT", label: "Loan Disbursement" },
    { value: "LOAN_REPAYMENT", label: "Loan Repayment" },
    { value: "INTEREST_PAYMENT", label: "Interest Payment" },
    { value: "FEE_COLLECTION", label: "Fee Collection" },
    { value: "REFUND", label: "Refund" },
    { value: "ADJUSTMENT", label: "Adjustment" },
    { value: "OTHER", label: "Other" }
  ];

  useEffect(() => {
    if (!isLoading && !authState.status) {
      history.push("/login");
    } else if (!isLoading && authState.status) {
      frontendLoggingService.logView("SmartTeller", null, null, "Viewed Smart Teller page");
    }
  }, [authState, isLoading, history]);

  // Generate Transaction ID for new transactions
  const generateTransactionId = () => {
    const randomNum = Math.floor(1000000 + Math.random() * 9000000); // 7 digits
    return `T-${randomNum}`;
  };

  useEffect(() => {
    if (authState.status) {
      setForm(prev => ({
        ...prev,
        transactionId: generateTransactionId(),
        createdBy: authState.username || "System"
      }));
    }
  }, [authState]);

  // Calculate total debits and credits
  const totalDebits = entries
    .filter(entry => entry.type === "debit")
    .reduce((sum, entry) => sum + (parseFloat(entry.amount) || 0), 0);

  const totalCredits = entries
    .filter(entry => entry.type === "credit")
    .reduce((sum, entry) => sum + (parseFloat(entry.amount) || 0), 0);

  const balance = totalDebits - totalCredits;
  const isBalanced = Math.abs(balance) < 0.01; // Allow for small floating point differences

  // Add new entry
  const addEntry = (type) => {
    const newId = Math.max(...entries.map(e => e.id), 0) + 1;
    setEntries(prev => [...prev, {
      id: newId,
      type,
      accountId: "",
      accountName: "",
      amount: ""
    }]);
  };

  // Remove entry
  const removeEntry = (id) => {
    if (entries.length <= 2) {
      showMessage("At least one debit and one credit entry are required", "error");
      return;
    }
    setEntries(prev => prev.filter(entry => entry.id !== id));
  };

  // Update entry
  const updateEntry = (id, field, value) => {
    setEntries(prev => prev.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  };

  // Handle account selection
  const handleAccountSelect = (account, entryId) => {
    updateEntry(entryId, "accountId", account.accountId || account.glAccountId);
    updateEntry(entryId, "accountName", 
      account.accountName ? 
        `${account.accountName} (${account.accountId})` : 
        `${account.glAccountName} (${account.glAccountId})`
    );
    
    // Set SACCO from the selected account
    if (account.saccoId) {
      setForm(prev => ({
        ...prev,
        saccoId: account.saccoId,
        saccoName: account.sacco ? account.sacco.saccoName : prev.saccoName
      }));
    }
    
    setActiveAccountModal(null);
  };

  // Handle SACCO selection
  const handleSaccoSelect = (sacco) => {
    setForm(prev => ({
      ...prev,
      saccoId: sacco.saccoId,
      saccoName: sacco.saccoName
    }));
  };

  // Validate form
  const validateForm = () => {
    if (!form.saccoId) {
      showMessage("Please select a SACCO", "error");
      return false;
    }


    const validEntries = entries.filter(entry => 
      entry.accountId && entry.amount && parseFloat(entry.amount) > 0
    );

    if (validEntries.length < 2) {
      showMessage("At least two valid entries are required", "error");
      return false;
    }

    const hasDebit = validEntries.some(entry => entry.type === "debit");
    const hasCredit = validEntries.some(entry => entry.type === "credit");

    if (!hasDebit || !hasCredit) {
      showMessage("At least one debit and one credit entry are required", "error");
      return false;
    }

    if (!isBalanced) {
      showMessage(`Transaction is not balanced. Difference: ${balance.toFixed(2)}`, "error");
      return false;
    }

    return true;
  };

  // Save transaction
  const save = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const validEntries = entries.filter(entry => 
        entry.accountId && entry.amount && parseFloat(entry.amount) > 0
      );

      const payload = {
        ...form,
        entries: validEntries.map(entry => ({
          type: entry.type,
          accountId: entry.accountId,
          amount: parseFloat(entry.amount)
        }))
      };

      console.log("Sending Smart Teller transaction payload:", payload);
      
      await axios.post("http://localhost:3001/smart-teller", payload, { 
        headers: { accessToken: localStorage.getItem("accessToken") } 
      });
      
      showMessage("Smart Teller transaction created successfully", "success");
      history.push("/transactions");
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to create Smart Teller transaction";
      showMessage(msg, "error");
      console.error("Error creating Smart Teller transaction:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardWrapper>
      <header className="header">
        <div className="header__left">
          <button className="iconBtn" onClick={() => history.push("/transactions")} title="Back" aria-label="Back" style={{ marginRight: 8 }}>
            <FiArrowLeft className="icon" style={{ fontWeight: "bolder" }}/>
          </button>
          <div className="greeting">Smart Teller - Multi-Entry Transaction</div>
        </div>
      </header>

      <main className="dashboard__content">
        <form className="card" onSubmit={save} style={{ display: "grid", gap: 12, padding: 16 }}>
          {/* Transaction ID and Status at the top */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "1fr auto", 
            gap: "20px",
            marginBottom: "12px",
            alignItems: "start"
          }}>
            <div style={{ display: "grid", gap: "12px" }}>
              <label>
                Transaction ID
                <input className="inputa"
                  value={form.transactionId}
                  disabled={true}
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
                    backgroundColor: "rgba(6, 182, 212, 0.2)",
                    color: "#0891b2",
                    border: "1px solid rgba(6, 182, 212, 0.3)"
                  }}
                >
                  {form.status || "Pending"}
                </div>
              </div>
            </div>
          </div> 

          <hr style={{ margin: "24px 0", border: "none", borderTop: "1px solid #e0e0e0" }} />

          {/* SACCO Selection */}
          <div className="grid2">
            <label>SACCO
              <div className="role-input-wrapper">
                <input 
                  type="text"
                  className="input" 
                  value={form.saccoName} 
                  placeholder="Select a SACCO"
                  readOnly={true}
                  required
                />
                <button
                  type="button"
                  className="role-search-btn"
                  onClick={() => setIsSaccoModalOpen(true)}
                  title="Search SACCOs"
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
                onChange={(e) => setForm(prev => ({ ...prev, transactionType: e.target.value }))}
                required
              >
                {transactionTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>


          {/* Smart Teller Entries Section */}
          <div style={{ marginBottom: "24px" }}>
            <div className="smart-teller-section-header" style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              marginBottom: "20px" 
            }}>
              <h3 style={{ margin: 0, color: "var(--primary-700)", fontSize: "18px" }}>
                Transaction Entries
              </h3>
              <div className="smart-teller-entry-actions" style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className="pill"
                  onClick={() => addEntry("debit")}
                  style={{
                    padding: "6px 12px",
                    fontSize: "12px",
                    backgroundColor: "var(--danger-100)",
                    color: "var(--danger-700)",
                    border: "1px solid var(--danger-300)"
                  }}
                >
                  <FiPlus style={{ marginRight: "4px" }} /> Add Debit
                </button>
                <button
                  type="button"
                  className="pill"
                  onClick={() => addEntry("credit")}
                  style={{
                    padding: "6px 12px",
                    fontSize: "12px",
                    backgroundColor: "var(--accent-100)",
                    color: "var(--accent-700)",
                    border: "1px solid var(--accent-300)"
                  }}
                >
                  <FiPlus style={{ marginRight: "4px" }} /> Add Credit
                </button>
              </div>
            </div>

            {/* Entries Container */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
              {entries.map((entry, index) => (
                <div key={entry.id} className="smart-teller-entry-row" style={{
                  display: "grid",
                  gridTemplateColumns: "80px 1fr 120px 40px",
                  gap: "16px",
                  alignItems: "end",
                  padding: "16px",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  borderLeft: `4px solid ${entry.type === 'debit' ? 'var(--danger-500)' : 'var(--accent-500)'}`
                }}>
                  <div className="smart-teller-entry-type" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "600",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      backgroundColor: entry.type === 'debit' ? "var(--danger-100)" : "var(--accent-100)",
                      color: entry.type === 'debit' ? "var(--danger-700)" : "var(--accent-700)"
                    }}>
                      {entry.type.toUpperCase()}
                    </span>
                  </div>
                  
                  <div>
                    <label style={{ 
                      display: "block", 
                      fontSize: "12px", 
                      fontWeight: "600", 
                      color: "var(--text-secondary)", 
                      marginBottom: "4px", 
                      textTransform: "uppercase", 
                      letterSpacing: "0.5px" 
                    }}>
                      Account
                    </label>
                    <div className="role-input-wrapper">
                      <input
                        type="text"
                        value={entry.accountName}
                        readOnly
                        className="input"
                        placeholder="Select account"
                      />
                      <button
                        type="button"
                        className="role-search-btn"
                        onClick={() => setActiveAccountModal(entry.id)}
                        title="Search accounts"
                      >
                        <FiSearch />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ 
                      display: "block", 
                      fontSize: "12px", 
                      fontWeight: "600", 
                      color: "var(--text-secondary)", 
                      marginBottom: "4px", 
                      textTransform: "uppercase", 
                      letterSpacing: "0.5px" 
                    }}>
                      Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={entry.amount}
                      onChange={(e) => updateEntry(entry.id, "amount", e.target.value)}
                      className="input"
                      placeholder="0.00"
                      style={{ textAlign: "right", fontWeight: "600" }}
                    />
                  </div>


                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {entries.length > 2 && (
                      <button
                        type="button"
                        className="iconBtn"
                        onClick={() => removeEntry(entry.id)}
                        title="Remove entry"
                        style={{ 
                          color: "var(--danger-500)",
                          backgroundColor: "var(--danger-100)",
                          border: "1px solid var(--danger-300)"
                        }}
                      >
                        <FiTrash2 />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Balance Summary */}
            <div style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "20px",
              marginBottom: "24px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", fontSize: "14px" }}>
                <span>Total Debits:</span>
                <span style={{ color: "var(--danger-600)", fontWeight: "600" }}>{totalDebits.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", fontSize: "14px" }}>
                <span>Total Credits:</span>
                <span style={{ color: "var(--accent-600)", fontWeight: "600" }}>{totalCredits.toFixed(2)}</span>
              </div>
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center", 
                padding: "16px 0 8px 0", 
                borderTop: "1px solid var(--border)", 
                marginTop: "12px", 
                fontWeight: "600", 
                fontSize: "16px" 
              }}>
                <span>Balance:</span>
                <span style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "8px", 
                  fontWeight: "700",
                  color: isBalanced ? "var(--accent-600)" : "var(--danger-600)"
                }}>
                  {balance.toFixed(2)}
                  {isBalanced ? <FiCheck style={{ fontSize: "18px" }} /> : <FiX style={{ fontSize: "18px" }} />}
                </span>
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div style={{ marginBottom: "24px" }}>
            <label>Remarks
              <textarea
                className="input"
                value={form.remarks}
                onChange={(e) => setForm(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder="Enter transaction remarks..."
                rows={3}
                style={{
                  resize: "vertical"
                }}
              />
            </label>
          </div>
          
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
            <button
              className="pill"
              type="submit"
              disabled={!isBalanced || saving}
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                minWidth: "auto",
                opacity: (!isBalanced || saving) ? 0.6 : 1,
                cursor: (!isBalanced || saving) ? "not-allowed" : "pointer"
              }}
            >
              {saving ? "Creating..." : "Create Smart Teller Transaction"}
            </button>
          </div>
        </form>
      </main>

      {/* SACCO Lookup Modal */}
      <SaccoLookupModal
        isOpen={isSaccoModalOpen}
        onClose={() => setIsSaccoModalOpen(false)}
        onSelectSacco={handleSaccoSelect}
      />

      {/* Account Lookup Modal */}
      <AccountLookupModal
        isOpen={activeAccountModal !== null}
        onClose={() => setActiveAccountModal(null)}
        onSelectAccount={(account) => handleAccountSelect(account, activeAccountModal)}
      />
    </DashboardWrapper>
  );
}

export default SmartTeller;
