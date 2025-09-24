import React, { useContext, useEffect, useState } from "react";
import { useHistory, useParams, useLocation } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import axios from "axios";
import { useSnackbar } from "../helpers/SnackbarContext";
import { AuthContext } from "../helpers/AuthContext";
import DashboardWrapper from '../components/DashboardWrapper';
import frontendLoggingService from "../services/frontendLoggingService";

function PayoutsForm() {
  const history = useHistory();
  const { authState, isLoading } = useContext(AuthContext);
  const { id } = useParams();
  const { search } = useLocation();
  const { showMessage } = useSnackbar();
  const isEdit = new URLSearchParams(search).get("edit") === "1";
  const isCreate = id === "new";

  const [form, setForm] = useState({
    payoutType: 'INTEREST_PAYOUT',
    payoutCategory: 'PRODUCT_INTEREST',
    accountId: '',
    productId: '',
    loanProductId: '',
    principalAmount: '',
    interestRate: '',
    calculationPeriod: 'MONTHLY',
    periodStartDate: '',
    periodEndDate: '',
    payoutDate: new Date().toISOString().split('T')[0],
    remarks: '',
    status: 'PENDING',
    createdBy: "",
    createdOn: "",
    modifiedBy: "",
    modifiedOn: "",
    approvedBy: "",
    approvedOn: "",
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [originalData, setOriginalData] = useState(null);

  useEffect(() => {
    // Only redirect if authentication check is complete and user is not authenticated
    if (!isLoading && !authState.status) {
      history.push("/login");
    }
  }, [authState, isLoading, history]);

  // Generate Payout ID for new payouts
  const generatePayoutId = () => {
    const randomNum = Math.floor(1000000 + Math.random() * 9000000); // 7 digits
    return `PO-${randomNum}`;
  };

  useEffect(() => {
    const load = async () => {
      if (isCreate) {
        // For new payout, set defaults
        setForm(prev => ({
          ...prev,
          createdBy: authState.username || "",
          createdOn: new Date().toISOString().split('T')[0]
        }));
      } else {
        // Load existing payout
        try {
          setLoading(true);
          const response = await axios.get(`http://localhost:3001/payouts/${id}`, {
            headers: { 
              'accessToken': localStorage.getItem('accessToken'),
              'Content-Type': 'application/json'
            }
          });

          if (response.data.success) {
            const payout = response.data.data;
            // Store original data for logging purposes
            setOriginalData(payout);
            setForm({
              payoutType: payout.payoutType || 'INTEREST_PAYOUT',
              payoutCategory: payout.payoutCategory || 'PRODUCT_INTEREST',
              accountId: payout.accountId || '',
              productId: payout.productId || '',
              loanProductId: payout.loanProductId || '',
              principalAmount: payout.principalAmount || '',
              interestRate: payout.interestRate || '',
              calculationPeriod: payout.calculationPeriod || 'MONTHLY',
              periodStartDate: payout.periodStartDate ? new Date(payout.periodStartDate).toISOString().split('T')[0] : '',
              periodEndDate: payout.periodEndDate ? new Date(payout.periodEndDate).toISOString().split('T')[0] : '',
              payoutDate: payout.payoutDate ? new Date(payout.payoutDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              remarks: payout.remarks || '',
              status: payout.status || 'PENDING',
              createdBy: payout.createdBy || "",
              createdOn: payout.createdOn ? new Date(payout.createdOn).toISOString().split('T')[0] : "",
              modifiedBy: payout.modifiedBy || "",
              modifiedOn: payout.modifiedOn ? new Date(payout.modifiedOn).toISOString().split('T')[0] : "",
              approvedBy: payout.approvedBy || "",
              approvedOn: payout.approvedOn ? new Date(payout.approvedOn).toISOString().split('T')[0] : "",
            });
          } else {
            showMessage("Payout not found", "error");
            history.push("/payouts-management");
          }
        } catch (error) {
          console.error("Error loading payout:", error);
          showMessage("Error loading payout", "error");
          history.push("/payouts-management");
        } finally {
          setLoading(false);
        }
      }
    };

    if (authState.status) {
      load();
    }
  }, [authState.status, id, isCreate, authState.token, authState.username, history, showMessage]);

  // Calculate interest amount
  const calculateInterest = () => {
    const principal = parseFloat(form.principalAmount) || 0;
    const rate = parseFloat(form.interestRate) || 0;
    
    if (principal > 0 && rate > 0) {
      let interest = 0;
      switch (form.calculationPeriod) {
        case 'DAILY':
          interest = principal * rate / 365;
          break;
        case 'MONTHLY':
          interest = principal * rate / 12;
          break;
        case 'QUARTERLY':
          interest = principal * rate / 4;
          break;
        case 'ANNUALLY':
          interest = principal * rate;
          break;
        default:
          interest = principal * rate / 12;
      }
      return interest.toFixed(2);
    }
    return '0.00';
  };

  const save = async (e) => {
    e.preventDefault();
    
    if (!form.accountId.trim()) {
      showMessage("Account ID is required", "error");
      return;
    }

    if (!form.principalAmount || parseFloat(form.principalAmount) <= 0) {
      showMessage("Principal amount must be greater than 0", "error");
      return;
    }

    if (!form.interestRate || parseFloat(form.interestRate) <= 0) {
      showMessage("Interest rate must be greater than 0", "error");
      return;
    }

    try {
      setSaving(true);
      
      const payoutData = {
        ...form,
        saccoId: authState?.saccoId || '',
        interestAmount: calculateInterest()
      };
      
      if (isCreate) {
        // Create new payout
        const response = await axios.post('http://localhost:3001/payouts', payoutData, {
          headers: { 
            'accessToken': localStorage.getItem('accessToken'),
            'Content-Type': 'application/json'
          }
        });

        if (response.data.success) {
          showMessage("Payout created successfully", "success");
          frontendLoggingService.logCreate("Payout", response.data.data.id, `Payout for Account ${form.accountId}`, response.data.data, `Created payout for Account ${form.accountId}`);
          history.push("/payouts-management");
        }
      } else {
        // Update existing payout
        const response = await axios.put(`http://localhost:3001/payouts/${id}`, payoutData, {
          headers: { 
            'accessToken': localStorage.getItem('accessToken'),
            'Content-Type': 'application/json'
          }
        });

        if (response.data.success) {
          showMessage("Payout updated successfully", "success");
          frontendLoggingService.logUpdate("Payout", id, `Payout for Account ${form.accountId}`, originalData, response.data.data, `Updated payout for Account ${form.accountId}`);
          history.push("/payouts-management");
        }
      }
    } catch (error) {
      console.error("Error saving payout:", error);
      if (error.response?.data?.message) {
        showMessage(error.response.data.message, "error");
      } else if (error.response?.data?.error) {
        showMessage(error.response.data.error, "error");
      } else {
        showMessage("Error saving payout", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardWrapper>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
          <div>Loading...</div>
        </div>
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper>
      <header className="header">
        <div className="header__left">
          <button 
            className="btn btn--secondary" 
            onClick={() => history.push("/payouts-management")}
            style={{ marginRight: "16px" }}
          >
            <FiArrowLeft style={{ marginRight: "8px" }} />
            Back
          </button>
          <div className="greeting">
            {isCreate ? "Add New Payout" : isEdit ? "Edit Payout" : "View Payout"}
          </div>
        </div>
      </header>

      <main className="dashboard__content">
        <section className="card" style={{ padding: "24px" }}>
          <form onSubmit={save}>
            {/* Status - Non-changeable and automatic */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "24px"
            }}>
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
                    form.status === "PENDING" ? "rgba(6, 182, 212, 0.2)" :
                    form.status === "PROCESSED" ? "rgba(16, 185, 129, 0.2)" :
                    form.status === "FAILED" ? "rgba(239, 68, 68, 0.2)" :
                    form.status === "CANCELLED" ? "rgba(107, 114, 128, 0.2)" :
                    "rgba(107, 114, 128, 0.2)",
                  color:
                    form.status === "PENDING" ? "#0891b2" :
                    form.status === "PROCESSED" ? "#059669" :
                    form.status === "FAILED" ? "#dc2626" :
                    form.status === "CANCELLED" ? "#6b7280" :
                    "#6b7280",
                  border: `1px solid ${
                    form.status === "PENDING" ? "rgba(6, 182, 212, 0.3)" :
                    form.status === "PROCESSED" ? "rgba(16, 185, 129, 0.3)" :
                    form.status === "FAILED" ? "rgba(239, 68, 68, 0.3)" :
                    form.status === "CANCELLED" ? "rgba(107, 114, 128, 0.3)" :
                    "rgba(107, 114, 128, 0.3)"
                  }`
                }}
              >
                {form.status || "PENDING"}
              </div>
            </div>

            {/* Form Content */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <label>
                  Payout Type *
                  <select
                    className="input"
                    value={form.payoutType}
                    onChange={e => setForm({ ...form, payoutType: e.target.value })}
                    disabled={!isCreate && !isEdit}
                    required
                  >
                    <option value="INTEREST_PAYOUT">Interest Payout (To Member)</option>
                    <option value="INTEREST_COLLECTION">Interest Collection (From Member)</option>
                  </select>
                </label>

                <label>
                  Payout Category *
                  <select
                    className="input"
                    value={form.payoutCategory}
                    onChange={e => setForm({ ...form, payoutCategory: e.target.value })}
                    disabled={!isCreate && !isEdit}
                    required
                  >
                    <option value="PRODUCT_INTEREST">Product Interest</option>
                    <option value="LOAN_INTEREST">Loan Interest</option>
                    <option value="MANUAL">Manual</option>
                  </select>
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <label>
                  Account ID *
                  <input
                    className="input"
                    value={form.accountId}
                    onChange={e => setForm({ ...form, accountId: e.target.value })}
                    disabled={!isCreate && !isEdit}
                    required
                    placeholder="Enter account ID"
                  />
                </label>

                <label>
                  Principal Amount *
                  <input
                    className="input"
                    type="number"
                    value={form.principalAmount}
                    onChange={e => setForm({ ...form, principalAmount: e.target.value })}
                    disabled={!isCreate && !isEdit}
                    required
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                  />
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <label>
                  Interest Rate (Decimal) *
                  <input
                    className="input"
                    type="number"
                    value={form.interestRate}
                    onChange={e => setForm({ ...form, interestRate: e.target.value })}
                    disabled={!isCreate && !isEdit}
                    required
                    step="0.0001"
                    min="0"
                    max="1"
                    placeholder="0.05 (for 5%)"
                  />
                </label>

                <label>
                  Calculation Period *
                  <select
                    className="input"
                    value={form.calculationPeriod}
                    onChange={e => setForm({ ...form, calculationPeriod: e.target.value })}
                    disabled={!isCreate && !isEdit}
                    required
                  >
                    <option value="DAILY">Daily</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="ANNUALLY">Annually</option>
                  </select>
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <label>
                  Period Start Date *
                  <input
                    className="input"
                    type="date"
                    value={form.periodStartDate}
                    onChange={e => setForm({ ...form, periodStartDate: e.target.value })}
                    disabled={!isCreate && !isEdit}
                    required
                  />
                </label>

                <label>
                  Period End Date *
                  <input
                    className="input"
                    type="date"
                    value={form.periodEndDate}
                    onChange={e => setForm({ ...form, periodEndDate: e.target.value })}
                    disabled={!isCreate && !isEdit}
                    required
                  />
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <label>
                  Payout Date *
                  <input
                    className="input"
                    type="date"
                    value={form.payoutDate}
                    onChange={e => setForm({ ...form, payoutDate: e.target.value })}
                    disabled={!isCreate && !isEdit}
                    required
                  />
                </label>

                <label>
                  Calculated Interest Amount
                  <input
                    className="input"
                    value={`KES ${calculateInterest()}`}
                    readOnly
                    style={{ backgroundColor: '#f8f9fa' }}
                  />
                </label>
              </div>

              <label>
                Remarks
                <textarea
                  className="input"
                  value={form.remarks}
                  onChange={e => setForm({ ...form, remarks: e.target.value })}
                  disabled={!isCreate && !isEdit}
                  placeholder="Additional notes..."
                  rows="3"
                />
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
                  {saving ? "Saving..." : (isCreate ? "Create Payout" : "Update Payout")}
                </button>
              )}
            </div>

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
        </section>
      </main>
    </DashboardWrapper>
  );
}

export default PayoutsForm;
