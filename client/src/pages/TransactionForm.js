import React, { useContext, useEffect, useState } from "react";
import { useHistory, useParams, useLocation } from "react-router-dom";
import { FiArrowLeft, FiSearch } from "react-icons/fi";
import axios from "axios";
import { useSnackbar } from "../helpers/SnackbarContext";
import { AuthContext } from "../helpers/AuthContext";
import DashboardWrapper from '../components/DashboardWrapper';
import SaccoLookupModal from '../components/SaccoLookupModal';
import AccountLookupModal from '../components/AccountLookupModal';

function TransactionForm() {
  const history = useHistory();
  const { authState, isLoading } = useContext(AuthContext);
  const { id } = useParams();
  const { search, pathname } = useLocation();
  const { showMessage } = useSnackbar();
  const isEdit = new URLSearchParams(search).get("edit") === "1";
  const isCreate = id === "new" || pathname === "/transfer-transaction";

  const [form, setForm] = useState({
    transactionId: "",
    saccoId: "",
    saccoName: "",
    debitAccountId: "",
    debitAccountName: "",
    creditAccountId: "",
    creditAccountName: "",
    amount: "",
    type: "",
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
  const [isSaccoModalOpen, setIsSaccoModalOpen] = useState(false);
  const [isDebitAccountModalOpen, setIsDebitAccountModalOpen] = useState(false);
  const [isCreditAccountModalOpen, setIsCreditAccountModalOpen] = useState(false);


  useEffect(() => {
    // Only redirect if authentication check is complete and user is not authenticated
    if (!isLoading && !authState.status) {
      history.push("/login");
    }
  }, [authState, isLoading, history]);

  // Generate Transaction ID for new transactions
  const generateTransactionId = () => {
    const randomNum = Math.floor(1000000 + Math.random() * 9000000); // 7 digits
    return `T-${randomNum}`;
  };

  useEffect(() => {
    const load = async () => {
      if (!isCreate) {
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
        // Generate Transaction ID for new transactions
        setForm(prev => ({ ...prev, transactionId: generateTransactionId() }));
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isCreate]);

  const save = async (e) => {
    e.preventDefault();
    try {
      // Validate that SACCO ID is set
      if (!form.saccoId || form.saccoId === 'SYSTEM') {
        showMessage("Please select a SACCO or select accounts to automatically set the SACCO", "error");
        return;
      }
      
      const payload = { ...form };
      // Remove display fields that shouldn't be sent to backend
      delete payload.saccoName;
      delete payload.debitAccountName;
      delete payload.creditAccountName;
      
      console.log("Sending transaction payload:", payload);
      
      if (isCreate) {
        await axios.post("http://localhost:3001/transactions", payload, { headers: { accessToken: localStorage.getItem("accessToken") } });
        showMessage("Transaction created successfully", "success");
      } else {
        await axios.put(`http://localhost:3001/transactions/${id}`, payload, { headers: { accessToken: localStorage.getItem("accessToken") } });
        showMessage("Transaction updated successfully", "success");
      }
      history.push("/transactions");
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to save transaction";
      showMessage(msg, "error");
    }
  };

  const handleSaccoSelect = (sacco) => {
    setForm(prev => ({
      ...prev,
      saccoId: sacco.saccoId,
      saccoName: sacco.saccoName
    }));
  };

  const handleDebitAccountSelect = (account) => {
    setForm(prev => ({
      ...prev,
      debitAccountId: account.accountId, // Use accountId string instead of database id
      debitAccountName: `${account.accountName} (${account.accountId})`,
      // Set SACCO ID from the selected account
      saccoId: account.saccoId || prev.saccoId,
      saccoName: account.sacco ? account.sacco.saccoName : prev.saccoName
    }));
  };

  const handleCreditAccountSelect = (account) => {
    setForm(prev => ({
      ...prev,
      creditAccountId: account.accountId, // Use accountId string instead of database id
      creditAccountName: `${account.accountName} (${account.accountId})`,
      // Set SACCO ID from the selected account
      saccoId: account.saccoId || prev.saccoId,
      saccoName: account.sacco ? account.sacco.saccoName : prev.saccoName
    }));
  };

  return (
    <DashboardWrapper>
      <header className="header">
        <div className="header__left">
          <button className="iconBtn" onClick={() => history.push("/transactions")} title="Back" aria-label="Back" style={{ marginRight: 8 }}>
            <FiArrowLeft className="icon" style={{ fontWeight: "bolder" }}/>
          </button>
          <div className="greeting">{isCreate ? "Add Transaction" : (isEdit ? "Update Transaction Details" : "View Transaction Details")}</div>
        </div>
      </header>

      <main className="dashboard__content">
        <form className="card" onSubmit={save} style={{ display: "grid", gap: 12, padding: 16 }}>
          {/* Transaction ID and Transaction Name at the top */}
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
                  onChange={e => setForm({ ...form, transactionId: e.target.value })}
                  required
                  disabled={true}
                />
              </label>
              {/* <label>
                Transaction Name
                <input
                  className="inputa"
                  value={`${form.debitAccountName} → ${form.creditAccountName}`.trim()}
                  disabled={true}
                  placeholder="Auto-generated"
                />
              </label> */}
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
              </div>
            </div>
            
        
          </div> 

          <hr style={{ margin: "24px 0", border: "none", borderTop: "1px solid #e0e0e0" }} />


          <div className="grid2">
            <label>Sacco
              <div className="role-input-wrapper">
                <input 
                  type="text"
                  className="input" 
                  value={form.saccoName} 
                  onChange={e => setForm({ ...form, saccoName: e.target.value })} 
                  disabled={!isCreate && !isEdit}
                  placeholder="Select a sacco"
                  readOnly={!isCreate && !isEdit}
                  required
                />
                {(isCreate || isEdit) && (
                  <button
                    type="button"
                    className="role-search-btn"
                    onClick={() => setIsSaccoModalOpen(true)}
                    title="Search saccos"
                  >
                    <FiSearch />
                  </button>
                )}
              </div>
              {form.saccoId && form.saccoId !== 'SYSTEM' && (
                <small style={{ color: 'var(--primary-500)', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  SACCO ID: {form.saccoId}
                </small>
              )}
            </label>
            <label>Debit Account
              <div className="role-input-wrapper">
                <input 
                  type="text"
                  className="input" 
                  value={form.debitAccountName} 
                  onChange={e => setForm({ ...form, debitAccountName: e.target.value })} 
                  disabled={!isCreate && !isEdit}
                  placeholder="Select debit account"
                  readOnly={!isCreate && !isEdit}
                  required
                />
                {(isCreate || isEdit) && (
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
                  disabled={!isCreate && !isEdit}
                  placeholder="Select credit account"
                  readOnly={!isCreate && !isEdit}
                  required
                />
                {(isCreate || isEdit) && (
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
            <label>Amount<input className="input" type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required disabled={!isCreate && !isEdit} /></label>
          </div>
          
          {/* Transaction Type */}
          <div className="grid2">
            <label>Transaction Type
              <select 
                className="input" 
                value={form.type} 
                onChange={e => setForm({ ...form, type: e.target.value })} 
                disabled={!isCreate && !isEdit}
                required
              >
                <option value="">Select transaction type</option>
                <option value="DEPOSIT">Deposit</option>
                <option value="WITHDRAWAL">Withdrawal</option>
                <option value="TRANSFER">Transfer</option>
                <option value="OTHER">Other</option>
              </select>
            </label>
            <div></div>
          </div>
          
          {/* Remarks */}
          <div style={{ marginBottom: "24px" }}>
            <label>Remarks
              <textarea
                className="input"
                value={form.remarks}
                onChange={e => setForm({ ...form, remarks: e.target.value })}
                disabled={!isCreate && !isEdit}
                placeholder="Enter transaction remarks..."
                rows={4}
                style={{
                  resize: "vertical"
                }}
              />
            </label>
          </div>
          
          {(isCreate || isEdit) && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
              <button
                className="pill"
                type="submit"
                style={{
                  padding: "8px 16px",
                  fontSize: "14px",
                  minWidth: "auto"
                }}
              >
                {isCreate ? "Add Transaction" : "Update Transaction"}
              </button>
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

      {/* Modals */}
      <SaccoLookupModal
        isOpen={isSaccoModalOpen}
        onClose={() => setIsSaccoModalOpen(false)}
        onSelectSacco={handleSaccoSelect}
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
    </DashboardWrapper>
  );
}

export default TransactionForm;
