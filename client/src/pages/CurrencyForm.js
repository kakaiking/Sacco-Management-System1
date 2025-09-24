import React, { useContext, useEffect, useState } from "react";
import { useHistory, useParams, useLocation } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import axios from "axios";
import { useSnackbar } from "../helpers/SnackbarContext";
import { AuthContext } from "../helpers/AuthContext";
import DashboardWrapper from '../components/DashboardWrapper';
import { sortedWorldCurrencies } from '../data/worldCurrencies';

function CurrencyForm() {
  const history = useHistory();
  const { authState, isLoading } = useContext(AuthContext);
  const { id } = useParams();
  const { search } = useLocation();
  const { showMessage } = useSnackbar();
  const isEdit = new URLSearchParams(search).get("edit") === "1";
  const isCreate = id === "new";

  const [form, setForm] = useState({
    currencyId: "",
    currencyCode: "",
    currencyName: "",
    symbol: "",
    decimalPlaces: 2,
    exchangeRate: 1.000000,
    isBaseCurrency: false,
    country: "",
    region: "",
    description: "",
    status: "Active",
    createdBy: "",
    createdOn: "",
    modifiedBy: "",
    modifiedOn: "",
    approvedBy: "",
    approvedOn: "",
  });

  const [activeTab, setActiveTab] = useState("details");
  const [availableCurrencies, setAvailableCurrencies] = useState([]);

  useEffect(() => {
    // Only redirect if authentication check is complete and user is not authenticated
    if (!isLoading && !authState.status) {
      history.push("/login");
    }
  }, [authState, isLoading, history]);

  // Generate currency ID for new currencies
  const generateCurrencyId = () => {
    const randomNum = Math.floor(100000 + Math.random() * 900000); // 6 digits
    return `CUR-${randomNum}`;
  };

  // Initialize world currencies for dropdown
  const initializeWorldCurrencies = () => {
    setAvailableCurrencies(sortedWorldCurrencies);
  };

  // Handle currency selection from dropdown
  const handleCurrencySelection = (selectedCurrencyCode) => {
    const selectedCurrency = availableCurrencies.find(
      currency => currency.code === selectedCurrencyCode
    );
    
    if (selectedCurrency) {
      setForm(prev => ({
        ...prev,
        currencyCode: selectedCurrency.code,
        currencyName: selectedCurrency.name,
        symbol: selectedCurrency.symbol || "",
        decimalPlaces: 2, // Default decimal places
        exchangeRate: 1.000000, // Default exchange rate
        country: selectedCurrency.country || "",
        region: selectedCurrency.region || "",
        description: "", // Not available in world currencies data
      }));
    }
  };

  useEffect(() => {
    const load = async () => {
      // Initialize world currencies for dropdown
      initializeWorldCurrencies();
      
      if (!isCreate) {
        const res = await axios.get(`http://localhost:3001/currencies/${id}`, {
          headers: { accessToken: localStorage.getItem("accessToken") },
        });
        const data = res.data?.entity || res.data;
        setForm({
          currencyId: data.currencyId || "",
          currencyCode: data.currencyCode || "",
          currencyName: data.currencyName || "",
          symbol: data.symbol || "",
          decimalPlaces: data.decimalPlaces || 2,
          exchangeRate: data.exchangeRate || 1.000000,
          isBaseCurrency: data.isBaseCurrency || false,
          country: data.country || "",
          region: data.region || "",
          description: data.description || "",
          status: data.status || "Active",
          createdBy: data.createdBy || "",
          createdOn: data.createdOn || "",
          modifiedBy: data.modifiedBy || "",
          modifiedOn: data.modifiedOn || "",
          approvedBy: data.approvedBy || "",
          approvedOn: data.approvedOn || "",
        });
      } else {
        // Generate currency ID for new currencies
        setForm(prev => ({ ...prev, currencyId: generateCurrencyId() }));
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isCreate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...form,
        currencyCode: form.currencyCode.toUpperCase(),
        modifiedBy: localStorage.getItem("username") || "System",
        modifiedOn: new Date().toISOString(),
      };

      if (isCreate) {
        payload.createdBy = localStorage.getItem("username") || "System";
        payload.createdOn = new Date().toISOString();
        await axios.post("http://localhost:3001/currencies", payload, {
          headers: { accessToken: localStorage.getItem("accessToken") },
        });
        showMessage("Currency created successfully", "success");
        history.push("/currency-maintenance");
      } else {
        await axios.put(`http://localhost:3001/currencies/${id}`, payload, {
          headers: { accessToken: localStorage.getItem("accessToken") },
        });
        showMessage("Currency updated successfully", "success");
        history.push("/currency-maintenance");
      }
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to save currency";
      showMessage(msg, "error");
    }
  };

  return (
    <DashboardWrapper>
      <header className="header">
        <div className="header__left">
          <button className="iconBtn"
            onClick={() => history.push("/currency-maintenance")}
            style={{
              marginRight: "8px"
            }}
          >
            <FiArrowLeft />
          </button>
          <div className="greeting">{isCreate ? "Add Currency" : (isEdit ? "Update Currency Details" : "View Currency Details")}</div>
        </div>
      </header>

      <main className="dashboard__content">
        <section className="card" style={{ padding: "24px" }}>
          <form onSubmit={handleSubmit}>
            {/* Currency ID and Status - Non-changeable and automatic */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: "20px",
              marginBottom: "12px",
              alignItems: "start"
            }}>
              <div style={{ display: "grid", gap: "12px" }}>
                <label>
                  Currency Id
                  <input className="inputa"
                    value={form.currencyId}
                    onChange={e => setForm({ ...form, currencyId: e.target.value })}
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
                      backgroundColor:
                        form.status === "Active" ? "rgba(16, 185, 129, 0.2)" :
                        form.status === "Inactive" ? "rgba(239, 68, 68, 0.2)" :
                        "rgba(107, 114, 128, 0.2)",
                      color:
                        form.status === "Active" ? "#059669" :
                        form.status === "Inactive" ? "#dc2626" :
                        "#6b7280",
                      border: `1px solid ${
                        form.status === "Active" ? "rgba(16, 185, 129, 0.3)" :
                        form.status === "Inactive" ? "rgba(239, 68, 68, 0.3)" :
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
              <div
                onClick={() => setActiveTab("additional")}
                style={{
                  padding: "12px 24px",
                  color: activeTab === "additional" ? "#007bff" : "#666",
                  cursor: "pointer",
                  fontWeight: activeTab === "additional" ? "600" : "400",
                  background: activeTab === "additional" ? "#e3f2fd" : "transparent",
                  border: "1px solid transparent",
                  borderRadius: "6px",
                  fontSize: "14px",
                  transition: "all 0.2s ease"
                }}
              >
                Additional Info
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === "details" && (
              <div>
                <div className="grid2">
                  <label>
                    Currency Code *
                    <select
                      className="input"
                      value={form.currencyCode}
                      onChange={e => handleCurrencySelection(e.target.value)}
                      disabled={!isCreate && !isEdit}
                      required
                    >
                      <option value="">Select Currency Code</option>
                      {availableCurrencies.map((currency, index) => (
                        <option key={index} value={currency.code}>
                          {currency.code} - {currency.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Currency Name *
                    <input
                      className="input"
                      value={form.currencyName}
                      onChange={e => setForm({ ...form, currencyName: e.target.value })}
                      disabled={!isCreate && !isEdit}
                      required
                      placeholder="e.g., US Dollar, Kenyan Shilling"
                    />
                  </label>

                  <label>
                    Symbol
                    <input
                      className="input"
                      value={form.symbol}
                      onChange={e => setForm({ ...form, symbol: e.target.value })}
                      disabled={!isCreate && !isEdit}
                      placeholder="e.g., $, KSh, €"
                    />
                  </label>

                  <label>
                    Decimal Places
                    <input
                      type="number"
                      className="input"
                      value={form.decimalPlaces}
                      onChange={e => setForm({ ...form, decimalPlaces: parseInt(e.target.value) || 2 })}
                      disabled={!isCreate && !isEdit}
                      min="0"
                      max="4"
                    />
                  </label>

                  <label>
                    Exchange Rate
                    <input
                      type="number"
                      step="0.000001"
                      className="input"
                      value={form.exchangeRate}
                      onChange={e => setForm({ ...form, exchangeRate: parseFloat(e.target.value) || 1.000000 })}
                      disabled={!isCreate && !isEdit}
                      min="0"
                    />
                  </label>

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
                    </select>
                  </label>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                  <button
                    type="button"
                    className="pill"
                    onClick={() => setActiveTab("additional")}
                    style={{
                      padding: "8px 16px",
                      fontSize: "14px"
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {activeTab === "additional" && (
              <div>
                {/* Base Currency Checkbox - Centered */}
                <div style={{ 
                  marginBottom: "32px", 
                  display: "flex", 
                  justifyContent: "center", 
                  alignItems: "center",
                  flexDirection: "column",
                  gap: "16px"
                }}>
                  <h4 style={{ marginBottom: "12px", color: "var(--primary-700)", textAlign: "center" }}>Base Currency</h4>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={form.isBaseCurrency}
                      onChange={e => setForm({ ...form, isBaseCurrency: e.target.checked })}
                      disabled={!isCreate && !isEdit}
                      style={{ transform: "scale(1.2)" }}
                    />
                    <span>Set as Base Currency</span>
                  </label>
                </div>

                <div className="grid2">
                  <label>
                    Country
                    <input
                      className="input"
                      value={form.country}
                      onChange={e => setForm({ ...form, country: e.target.value })}
                      disabled={!isCreate && !isEdit}
                      placeholder="e.g., United States, Kenya"
                    />
                  </label>

                  <label>
                    Region
                    <input
                      className="input"
                      value={form.region}
                      onChange={e => setForm({ ...form, region: e.target.value })}
                      disabled={!isCreate && !isEdit}
                      placeholder="e.g., North America, East Africa"
                    />
                  </label>
                </div>

                <label>
                  Description
                  <textarea
                    className="input"
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    disabled={!isCreate && !isEdit}
                    placeholder="Additional notes about this currency..."
                    rows="3"
                  />
                </label>

                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginTop: "24px" }}>
                  <button
                    type="button"
                    className="pill"
                    onClick={() => setActiveTab("details")}
                    style={{
                      padding: "8px 16px",
                      fontSize: "14px"
                    }}
                  >
                    Back
                  </button>
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
                      {isCreate ? "Add Currency" : "Update Currency"}
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

export default CurrencyForm;


