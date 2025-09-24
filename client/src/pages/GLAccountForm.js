import React, { useContext, useEffect, useState } from "react";
import { useHistory, useParams, useLocation } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import axios from "axios";
import { useSnackbar } from "../helpers/SnackbarContext";
import { AuthContext } from "../helpers/AuthContext";
import DashboardWrapper from '../components/DashboardWrapper';

function GLAccountForm() {
  const history = useHistory();
  const { authState, isLoading } = useContext(AuthContext);
  const { id } = useParams();
  const { search } = useLocation();
  const { showMessage } = useSnackbar();
  const isEdit = new URLSearchParams(search).get("edit") === "1";
  const isCreate = id === "new";

  const [form, setForm] = useState({
    glAccountId: "",
    saccoId: "",
    accountName: "",
    accountCategory: "ASSET",
    accountSubCategory: "",
    parentAccountId: "",
    accountLevel: 1,
    isParentAccount: false,
    normalBalance: "DEBIT",
    availableBalance: 0.00,
    status: "Active",
    remarks: "",
    createdBy: "",
    createdOn: "",
    modifiedBy: "",
    modifiedOn: "",
    statusChangedBy: "",
    statusChangedOn: "",
  });

  const [saccos, setSaccos] = useState([]);
  const [parentAccounts, setParentAccounts] = useState([]);
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    // Only redirect if authentication check is complete and user is not authenticated
    if (!isLoading && !authState.status) {
      history.push("/login");
    }
  }, [authState, isLoading, history]);

  // Load saccos and parent accounts for dropdowns
  useEffect(() => {
    const loadData = async () => {
      try {
        const [saccosRes, parentAccountsRes] = await Promise.all([
          axios.get("http://localhost:3001/sacco", {
            headers: { accessToken: localStorage.getItem("accessToken") },
          }),
          axios.get("http://localhost:3001/gl-accounts", {
            headers: { accessToken: localStorage.getItem("accessToken") },
          })
        ]);

        const saccosData = saccosRes.data?.entity || saccosRes.data || [];
        const parentAccountsData = parentAccountsRes.data?.entity || parentAccountsRes.data || [];

        setSaccos(Array.isArray(saccosData) ? saccosData : []);
        setParentAccounts(Array.isArray(parentAccountsData) ? parentAccountsData : []);
      } catch (err) {
        showMessage("Failed to load data", "error");
      }
    };
    loadData();
  }, [showMessage]);

  useEffect(() => {
    const load = async () => {
      if (!isCreate) {
        const res = await axios.get(`http://localhost:3001/gl-accounts/${id}`, {
          headers: { accessToken: localStorage.getItem("accessToken") },
        });
        const data = res.data?.entity || res.data;
        setForm({
          glAccountId: data.glAccountId || "",
          saccoId: data.saccoId || "",
          accountName: data.accountName || "",
          accountCategory: data.accountCategory || "ASSET",
          accountSubCategory: data.accountSubCategory || "",
          parentAccountId: data.parentAccountId || "",
          accountLevel: data.accountLevel || 1,
          isParentAccount: data.isParentAccount || false,
          normalBalance: data.normalBalance || "DEBIT",
          availableBalance: data.availableBalance || 0.00,
          status: data.status || "Active",
          remarks: data.remarks || "",
          createdBy: data.createdBy || "",
          createdOn: data.createdOn || "",
          modifiedBy: data.modifiedBy || "",
          modifiedOn: data.modifiedOn || "",
          statusChangedBy: data.statusChangedBy || "",
          statusChangedOn: data.statusChangedOn || "",
        });
      }
    };
    load();
  }, [id, isCreate]);

  // Update normal balance when category changes
  useEffect(() => {
    const normalBalance = ['ASSET', 'EXPENSE'].includes(form.accountCategory) ? 'DEBIT' : 'CREDIT';
    setForm(prev => ({ ...prev, normalBalance }));
  }, [form.accountCategory]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isCreate) {
        const payload = {
          saccoId: form.saccoId,
          accountName: form.accountName,
          accountCategory: form.accountCategory,
          accountSubCategory: form.accountSubCategory,
          parentAccountId: form.parentAccountId || null,
          accountLevel: form.accountLevel,
          isParentAccount: form.isParentAccount,
          availableBalance: form.availableBalance,
          status: form.status,
          remarks: form.remarks
        };
        
        await axios.post("http://localhost:3001/gl-accounts", payload, {
          headers: { accessToken: localStorage.getItem("accessToken") },
        });
        showMessage("GL Account created successfully", "success");
        history.push("/gl-accounts-management");
      } else {
        const payload = {
          accountName: form.accountName,
          accountSubCategory: form.accountSubCategory,
          parentAccountId: form.parentAccountId || null,
          accountLevel: form.accountLevel,
          isParentAccount: form.isParentAccount,
          availableBalance: form.availableBalance,
          status: form.status,
          remarks: form.remarks
        };
        
        await axios.put(`http://localhost:3001/gl-accounts/${id}`, payload, {
          headers: { accessToken: localStorage.getItem("accessToken") },
        });
        showMessage("GL Account updated successfully", "success");
        history.push("/gl-accounts-management");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to save GL account";
      showMessage(msg, "error");
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'ASSET': '#10b981',
      'LIABILITY': '#f59e0b', 
      'EQUITY': '#3b82f6',
      'INCOME': '#8b5cf6',
      'EXPENSE': '#ef4444'
    };
    return colors[category] || '#6b7280';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'ASSET': '💰',
      'LIABILITY': '📋',
      'EQUITY': '🏛️',
      'INCOME': '📈',
      'EXPENSE': '💸'
    };
    return icons[category] || '📊';
  };

  return (
    <DashboardWrapper>
      <header className="header">
        <div className="header__left">
          <button className="iconBtn" onClick={() => history.push("/gl-accounts-management")} title="Back" aria-label="Back" style={{ marginRight: 8 }}>
            <FiArrowLeft className="icon" style={{ fontWeight: "bolder" }}/>
          </button>
          <div className="greeting">{isCreate ? "Add GL Account" : (isEdit ? "Update GL Account Details" : "View GL Account Details")}</div>
        </div>
      </header>

      <main className="dashboard__content">
        <section className="card" style={{ padding: "24px" }}>
          <form onSubmit={handleSubmit}>
            {/* GL Account ID and Number - Auto-generated and read-only */}
            <div style={{ 
            display: "grid", 
            gridTemplateColumns: "1fr auto", 
            gap: "20px",
            marginBottom: "12px",
            alignItems: "start"
          }}>
            <div style={{ display: "grid", gap: "12px" }}>
              <label>
                GL Account ID
                <input className="inputa"
                  value={form.glAccountId}
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
                    backgroundColor: 
                      form.status === "Active" ? "rgba(16, 185, 129, 0.2)" :
                      form.status === "Inactive" ? "rgba(107, 114, 128, 0.2)" :
                      form.status === "Suspended" ? "rgba(249, 115, 22, 0.2)" :
                      form.status === "Closed" ? "rgba(239, 68, 68, 0.2)" :
                      "rgba(107, 114, 128, 0.2)",
                    color: 
                      form.status === "Active" ? "#059669" :
                      form.status === "Inactive" ? "#6b7280" :
                      form.status === "Suspended" ? "#ea580c" :
                      form.status === "Closed" ? "#dc2626" :
                      "#6b7280",
                    border: `1px solid ${
                      form.status === "Active" ? "rgba(16, 185, 129, 0.3)" :
                      form.status === "Inactive" ? "rgba(107, 114, 128, 0.3)" :
                      form.status === "Suspended" ? "rgba(249, 115, 22, 0.3)" :
                      form.status === "Closed" ? "rgba(239, 68, 68, 0.3)" :
                      "rgba(107, 114, 128, 0.3)"
                    }`
                  }}
                >
                  {form.status || "Active"}
                </div>
              </div>
            </div>         
          </div> 

            {/* Tab Navigation */}
            <div style={{
              display: "flex",
              justifyContent: "center",
              gap: "8px",
              marginBottom: "24px",
              backgroundColor: "var(--surface-2)",
              borderRadius: "8px",
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
                  transition: "all 0.2s ease"
                }}
              >
                Details
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === "details" && (
              <div>
                <div className="grid2">
                  {/* SACCO field */}
                  <label>
                    SACCO *
                    <select
                      className="input"
                      value={form.saccoId}
                      onChange={e => setForm({ ...form, saccoId: e.target.value })}
                      disabled={!isCreate && !isEdit}
                      required
                    >
                      <option value="">Select SACCO</option>
                      {saccos.map(sacco => (
                        <option key={sacco.id} value={sacco.saccoId}>
                          {sacco.saccoId} - {sacco.saccoName}
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* Account Category */}
                  <label>
                    Account Category *
                    <select
                      className="input"
                      value={form.accountCategory}
                      onChange={e => setForm({ ...form, accountCategory: e.target.value })}
                      disabled={!isCreate && !isEdit}
                      required
                    >
                      <option value="ASSET">💰 Assets</option>
                      <option value="LIABILITY">📋 Liabilities</option>
                      <option value="EQUITY">🏛️ Equity</option>
                      <option value="INCOME">📈 Income</option>
                      <option value="EXPENSE">💸 Expenses</option>
                    </select>
                  </label>

                  {/* Account Name */}
                  <label>
                    Account Name *
                    <input
                      className="input"
                      value={form.accountName}
                      onChange={e => setForm({ ...form, accountName: e.target.value })}
                      disabled={!isCreate && !isEdit}
                      placeholder="Enter account name (e.g., Cash Account)"
                      required
                    />
                  </label>

                  {/* Account Sub Category */}
                  <label>
                    Account Sub Category
                    <input
                      className="input"
                      value={form.accountSubCategory}
                      onChange={e => setForm({ ...form, accountSubCategory: e.target.value })}
                      disabled={!isCreate && !isEdit}
                      placeholder="Enter sub category (e.g., Current Assets)"
                    />
                  </label>

                  {/* Parent Account */}
                  <label>
                    Parent Account
                    <select
                      className="input"
                      value={form.parentAccountId}
                      onChange={e => setForm({ ...form, parentAccountId: e.target.value })}
                      disabled={!isCreate && !isEdit}
                    >
                      <option value="">Select Parent Account (Optional)</option>
                      {parentAccounts
                        .filter(account => account.id !== parseInt(id) && account.isParentAccount)
                        .map(account => (
                          <option key={account.id} value={account.id}>
                            {account.glAccountId} - {account.accountName}
                          </option>
                        ))}
                    </select>
                  </label>

                  {/* Account Level */}
                  <label>
                    Account Level
                    <input
                      type="number"
                      min="1"
                      max="5"
                      className="input"
                      value={form.accountLevel}
                      onChange={e => setForm({ ...form, accountLevel: parseInt(e.target.value) || 1 })}
                      disabled={!isCreate && !isEdit}
                    />
                  </label>

                  {/* Normal Balance - Auto-determined */}
                  <label>
                    Normal Balance
                    <input
                      className="input"
                      value={form.normalBalance}
                      disabled={true}
                      style={{
                        backgroundColor: form.normalBalance === 'DEBIT' ? "#fef3c7" : "#dbeafe",
                        color: form.normalBalance === 'DEBIT' ? "#92400e" : "#1e40af",
                        fontWeight: "600"
                      }}
                    />
                  </label>

                  {/* Is Parent Account */}
                  <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <input
                      type="checkbox"
                      checked={form.isParentAccount}
                      onChange={e => setForm({ ...form, isParentAccount: e.target.checked })}
                      disabled={!isCreate && !isEdit}
                    />
                    <span>Is Parent Account</span>
                  </label>

                  {/* Available Balance */}
                  <label>
                    Available Balance (KSH)
                    <input
                      type="number"
                      step="0.01"
                      className="input"
                      value={form.availableBalance}
                      onChange={e => setForm({ ...form, availableBalance: parseFloat(e.target.value) || 0 })}
                      disabled={!isCreate && !isEdit}
                      required
                    />
                  </label>

                  {/* Status */}
                  <label>
                    Status
                    <select
                      className="input"
                      value={form.status}
                      onChange={e => setForm({ ...form, status: e.target.value })}
                      disabled={!isCreate && !isEdit}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Suspended">Suspended</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </label>

                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                  {(isCreate || isEdit) && (
                    <button
                      type="submit"
                      className="pill"
                      style={{
                        padding: "8px 16px",
                        fontSize: "14px",
                        backgroundColor: "var(--primary-500)",
                        color: "white",
                        border: "none"
                      }}
                    >
                      {isCreate ? "Add GL Account" : "Update GL Account"}
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
                Status Changed On
                <input className="inputf"
                  value={form.statusChangedOn ? new Date(form.statusChangedOn).toLocaleDateString() : ""}
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
                Status Changed By
                <input className="inputf"
                  value={form.statusChangedBy || ""}
                  disabled={true}
                />
              </label>
            </div>

            <label style={{ marginTop: "16px" }}>
              Remarks
              <textarea
                className="inputa"
                value={form.remarks || ""}
                onChange={(e) => setForm(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder="Enter remarks about this GL account..."
                rows={3}
                style={{ resize: "vertical" }}
              />
            </label>

          </form>
        </section>
      </main>
    </DashboardWrapper>
  );
}

export default GLAccountForm;
