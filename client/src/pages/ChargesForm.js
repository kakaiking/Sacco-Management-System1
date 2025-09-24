import React, { useContext, useEffect, useState, useCallback } from "react";
import { useHistory, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import { FiArrowLeft } from "react-icons/fi";
import DashboardWrapper from '../components/DashboardWrapper';
import CurrencyLookupModal from '../components/CurrencyLookupModal';
import { useSnackbar } from "../helpers/SnackbarContext";
import { AuthContext } from "../helpers/AuthContext";

function ChargesForm() {
  const history = useHistory();
  const { id } = useParams();
  const { search } = useLocation();
  const { authState, isLoading } = useContext(AuthContext);
  const { showMessage } = useSnackbar();
  
  const isEdit = new URLSearchParams(search).get("edit") === "1";
  const isCreate = id === "new";
  
  const [form, setForm] = useState({
    chargeId: '',
    name: '',
    currency: '',
    amount: '',
    status: 'Active',
    createdBy: '',
    createdOn: '',
    modifiedBy: '',
    modifiedOn: '',
    approvedBy: '',
    approvedOn: '',
    verifierRemarks: ''
  });
  
  const [, setLoading] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(null);

  // Define fetchCharge function first
  const fetchCharge = useCallback(async () => {
    try {
      const response = await axios.get(`http://localhost:3001/charges/${id}`, {
        headers: { accessToken: localStorage.getItem("accessToken") }
      });
      setForm(response.data);
    } catch (error) {
      showMessage("Error fetching charge details", "error");
    }
  }, [id, showMessage]);

  useEffect(() => {
    if (!isLoading && !authState.status) {
      history.push("/login");
    }
    
    if (id && id !== 'new') {
      fetchCharge();
    } else if (isCreate) {
      // Generate Charge ID for new charges
      const generateChargeId = () => {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `CHG-${timestamp}${random}`;
      };
      setForm(prev => ({ ...prev, chargeId: generateChargeId() }));
    }
  }, [authState, isLoading, history, id, isCreate, fetchCharge]);

  const save = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("accessToken");
      
      if (isEdit) {
        await axios.put(`http://localhost:3001/charges/${id}`, form, {
          headers: { accessToken: token }
        });
        showMessage("Charge updated successfully", "success");
      } else {
        await axios.post("http://localhost:3001/charges", form, {
          headers: { accessToken: token }
        });
        showMessage("Charge created successfully", "success");
      }
      
      history.push("/charges-management");
    } catch (error) {
      showMessage(error.response?.data?.error || "An error occurred", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCurrencySelect = (currency) => {
    setSelectedCurrency(currency);
    setForm({ ...form, currency: currency.currencyCode });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return { bg: "rgba(16, 185, 129, 0.2)", color: "#059669", border: "rgba(16, 185, 129, 0.3)" };
      case "Inactive":
        return { bg: "rgba(239, 68, 68, 0.2)", color: "#dc2626", border: "rgba(239, 68, 68, 0.3)" };
      default:
        return { bg: "rgba(107, 114, 128, 0.2)", color: "#6b7280", border: "rgba(107, 114, 128, 0.3)" };
    }
  };

  const statusColors = getStatusColor(form.status);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Loading...
      </div>
    );
  }

  return (
    <DashboardWrapper>
      <header className="header">
        <div className="header__left">
          <button className="iconBtn" onClick={() => history.push("/charges-management")} title="Back" aria-label="Back" style={{ marginRight: 8 }}>
            <FiArrowLeft className="icon" style={{ fontWeight: "bolder" }}/>
          </button>
          <div className="greeting">{isCreate ? "Add Charge" : (isEdit ? "Update Charge Details" : "View Charge Details")}</div>
        </div>
      </header>

      <main className="dashboard__content">
        <form className="card" onSubmit={save} style={{ display: "grid", gap: 12, padding: 16 }}>
          {/* Charge ID and Status at the top */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "1fr auto", 
            gap: "20px",
            marginBottom: "12px",
            alignItems: "start"
          }}>
            <div style={{ display: "grid", gap: "12px" }}>
              <label>
                Charge ID
                <input className="inputa"
                  value={form.chargeId}
                  onChange={e => setForm({ ...form, chargeId: e.target.value })}
                  required
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
                    backgroundColor: statusColors.bg,
                    color: statusColors.color,
                    border: `1px solid ${statusColors.border}`
                  }}
                >
                  {form.status || "Active"}
                </div>
              </div>
            </div>
          </div> 

          <div className="grid2">
            <label>Charge Name
              <input className="input" 
                value={form.name} 
                onChange={e => setForm({ ...form, name: e.target.value })} 
                required 
                disabled={!isCreate && !isEdit} 
              />
            </label>
            <label>Currency
              <div style={{ display: "flex", gap: "8px" }}>
                <input 
                  className="input" 
                  value={selectedCurrency ? `${selectedCurrency.currencyCode} - ${selectedCurrency.currencyName}` : form.currency}
                  readOnly
                  placeholder="Select currency"
                  required
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="pill"
                  onClick={() => setShowCurrencyModal(true)}
                  disabled={!isCreate && !isEdit}
                  style={{
                    padding: "8px 16px",
                    fontSize: "14px",
                    minWidth: "auto",
                    backgroundColor: "var(--primary-500)",
                    color: "white",
                    border: "none"
                  }}
                >
                  Select
                </button>
              </div>
            </label>
            <label>Amount
              <input className="input" 
                type="number"
                value={form.amount} 
                onChange={e => setForm({ ...form, amount: e.target.value })} 
                required 
                min="0"
                step="0.01"
                disabled={!isCreate && !isEdit} 
              />
            </label>
            <label>Status
              <select className="input" 
                value={form.status} 
                onChange={e => setForm({ ...form, status: e.target.value })} 
                disabled={!isCreate && !isEdit} 
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </label>
          </div>

          {(isCreate || isEdit) && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
              <button
                className="pill"
                type="submit"
                style={{
                  padding: "12px 24px",
                  fontSize: "16px",
                  minWidth: "auto"
                }}
              >
                {isCreate ? "Add Charge" : "Update Charge"}
              </button>
            </div>
          )}

          {/* Audit Fields Section */}
          <hr style={{ margin: "24px 0", border: "none", borderTop: "1px solid #e0e0e0" }} />

          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(3, 1fr)", 
            gap: "12px",
            fontSize: "14px",
            color: "#666"
          }}>
            <div>
              <strong>Created By:</strong> {form.createdBy || "N/A"}
            </div>
            <div>
              <strong>Created On:</strong> {form.createdOn ? new Date(form.createdOn).toLocaleString() : "N/A"}
            </div>
            <div>
              <strong>Modified By:</strong> {form.modifiedBy || "N/A"}
            </div>
            <div>
              <strong>Modified On:</strong> {form.modifiedOn ? new Date(form.modifiedOn).toLocaleString() : "N/A"}
            </div>
            <div>
              <strong>Approved By:</strong> {form.approvedBy || "N/A"}
            </div>
            <div>
              <strong>Approved On:</strong> {form.approvedOn ? new Date(form.approvedOn).toLocaleString() : "N/A"}
            </div>
          </div>

          {form.verifierRemarks && (
            <div style={{ marginTop: "12px" }}>
              <strong style={{ color: "#666" }}>Verifier Remarks:</strong>
              <div style={{ 
                marginTop: "4px", 
                padding: "8px", 
                backgroundColor: "#f5f5f5", 
                borderRadius: "4px",
                fontSize: "14px"
              }}>
                {form.verifierRemarks}
              </div>
            </div>
          )}
        </form>
      </main>

      {/* Currency Lookup Modal */}
      <CurrencyLookupModal
        isOpen={showCurrencyModal}
        onClose={() => setShowCurrencyModal(false)}
        onSelectCurrency={handleCurrencySelect}
      />
    </DashboardWrapper>
  );
}

export default ChargesForm;
