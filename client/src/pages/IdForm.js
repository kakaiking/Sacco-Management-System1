import React, { useContext, useEffect, useState } from "react";
import { useHistory, useParams, useLocation } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import axios from "axios";
import { useSnackbar } from "../helpers/SnackbarContext";
import { AuthContext } from "../helpers/AuthContext";
import DashboardWrapper from '../components/DashboardWrapper';

function IdForm() {
  const history = useHistory();
  const { authState, isLoading } = useContext(AuthContext);
  const { id } = useParams();
  const { search } = useLocation();
  const { showMessage } = useSnackbar();
  const isEdit = new URLSearchParams(search).get("edit") === "1";
  const isCreate = id === "new";

  const [form, setForm] = useState({
    id: "",
    modelName: "",
    displayName: "",
    prefix: "",
    suffix: "",
    digitCount: 7,
    characterType: "NUMERIC",
    startNumber: 1,
    currentNumber: 0,
    isActive: true,
    example: "",
    createdBy: "",
    createdOn: "",
    modifiedBy: "",
    modifiedOn: "",
    approvedBy: "",
    approvedOn: "",
  });

  const [activeTab, setActiveTab] = useState("details");
  const [preview, setPreview] = useState("");

  // Available models in the system
  const availableModels = [
    { name: 'Members', displayName: 'Member ID' },
    { name: 'Users', displayName: 'User ID' },
    { name: 'Products', displayName: 'Product ID' },
    { name: 'Accounts', displayName: 'Account ID' },
    { name: 'Transactions', displayName: 'Transaction ID' },
    { name: 'Loans', displayName: 'Loan ID' },
    { name: 'Collateral', displayName: 'Collateral ID' },
    { name: 'Tills', displayName: 'Till ID' },
    { name: 'Branches', displayName: 'Branch ID' },
    { name: 'Charges', displayName: 'Charge ID' }
  ];

  useEffect(() => {
    // Only redirect if authentication check is complete and user is not authenticated
    if (!isLoading && !authState.status) {
      history.push("/login");
    }
  }, [authState, isLoading, history]);

  // Generate preview when form changes
  useEffect(() => {
    if (form.modelName && form.displayName) {
      generatePreview();
    }
  }, [form.prefix, form.suffix, form.digitCount, form.characterType, form.startNumber]);

  const generatePreview = async () => {
    try {
      const response = await axios.post('/id-format-configurations/preview', {
        prefix: form.prefix,
        suffix: form.suffix,
        digitCount: form.digitCount,
        characterType: form.characterType,
        startNumber: form.startNumber
      });
      if (response.data.success) {
        setPreview(response.data.data.example);
      }
    } catch (error) {
      console.error('Error generating preview:', error);
    }
  };

  // Handle model selection
  const handleModelSelection = (selectedModelName) => {
    const selectedModel = availableModels.find(
      model => model.name === selectedModelName
    );
    
    if (selectedModel) {
      setForm(prev => ({
        ...prev,
        modelName: selectedModel.name,
        displayName: selectedModel.displayName
      }));
    }
  };

  useEffect(() => {
    const load = async () => {
      if (!isCreate) {
        try {
          const res = await axios.get(`/id-format-configurations/${id}`, {
            headers: { accessToken: localStorage.getItem("accessToken") },
          });
          const data = res.data?.data || res.data;
          setForm({
            id: data.id || "",
            modelName: data.modelName || "",
            displayName: data.displayName || "",
            prefix: data.prefix || "",
            suffix: data.suffix || "",
            digitCount: data.digitCount || 7,
            characterType: data.characterType || "NUMERIC",
            startNumber: data.startNumber || 1,
            currentNumber: data.currentNumber || 0,
            isActive: data.isActive !== undefined ? data.isActive : true,
            example: data.example || "",
            createdBy: data.createdBy || "",
            createdOn: data.createdOn || "",
            modifiedBy: data.modifiedBy || "",
            modifiedOn: data.modifiedOn || "",
            approvedBy: data.approvedBy || "",
            approvedOn: data.approvedOn || "",
          });
        } catch (error) {
          console.error('Error loading configuration:', error);
          showMessage('Error loading configuration', 'error');
        }
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
        modifiedBy: localStorage.getItem("username") || "System",
        modifiedOn: new Date().toISOString(),
      };

      if (isCreate) {
        payload.createdBy = localStorage.getItem("username") || "System";
        payload.createdOn = new Date().toISOString();
        await axios.post("/id-format-configurations", payload, {
          headers: { accessToken: localStorage.getItem("accessToken") },
        });
        showMessage("ID configuration created successfully", "success");
        history.push("/id-maintenance");
      } else {
        await axios.put(`/id-format-configurations/${id}`, payload, {
          headers: { accessToken: localStorage.getItem("accessToken") },
        });
        showMessage("ID configuration updated successfully", "success");
        history.push("/id-maintenance");
      }
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to save ID configuration";
      showMessage(msg, "error");
    }
  };

  return (
    <DashboardWrapper>
      <header className="header">
        <div className="header__left">
          <button className="iconBtn"
            onClick={() => history.push("/id-maintenance")}
            style={{
              marginRight: "8px"
            }}
          >
            <FiArrowLeft />
          </button>
          <div className="greeting">{isCreate ? "Add ID Configuration" : (isEdit ? "Update ID Configuration" : "View ID Configuration")}</div>
        </div>
      </header>

      <main className="dashboard__content">
        <section className="card" style={{ padding: "24px" }}>
          <form onSubmit={handleSubmit}>
            {/* Configuration ID and Status - Non-changeable and automatic */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: "20px",
              marginBottom: "12px",
              alignItems: "start"
            }}>
              <div style={{ display: "grid", gap: "12px" }}>
                <label>
                  Configuration ID
                  <input className="inputa"
                    value={form.id}
                    onChange={e => setForm({ ...form, id: e.target.value })}
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
                        form.isActive ? "rgba(16, 185, 129, 0.2)" :
                        "rgba(239, 68, 68, 0.2)",
                      color:
                        form.isActive ? "#059669" :
                        "#dc2626",
                      border: `1px solid ${
                        form.isActive ? "rgba(16, 185, 129, 0.3)" :
                        "rgba(239, 68, 68, 0.3)"
                      }`
                    }}
                  >
                    {form.isActive ? 'Active' : 'Inactive'}
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
                onClick={() => setActiveTab("formatting")}
                style={{
                  padding: "12px 24px",
                  color: activeTab === "formatting" ? "#007bff" : "#666",
                  cursor: "pointer",
                  fontWeight: activeTab === "formatting" ? "600" : "400",
                  background: activeTab === "formatting" ? "#e3f2fd" : "transparent",
                  border: "1px solid transparent",
                  borderRadius: "6px",
                  fontSize: "14px",
                  transition: "all 0.2s ease"
                }}
              >
                Formatting
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === "details" && (
              <div>
                <div className="grid2">
                  <label>
                    Model *
                    <select
                      className="input"
                      value={form.modelName}
                      onChange={e => handleModelSelection(e.target.value)}
                      disabled={!isCreate && !isEdit}
                      required
                    >
                      <option value="">Select a Model</option>
                      {availableModels.map((model, index) => (
                        <option key={index} value={model.name}>
                          {model.displayName}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Display Name *
                    <input
                      className="input"
                      value={form.displayName}
                      onChange={e => setForm({ ...form, displayName: e.target.value })}
                      disabled={!isCreate && !isEdit}
                      required
                      placeholder="e.g., Member ID, User ID"
                    />
                  </label>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                  <button
                    type="button"
                    className="pill"
                    onClick={() => setActiveTab("formatting")}
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

            {activeTab === "formatting" && (
              <div>
                <div className="grid2">
                  <label>
                    Prefix
                    <input
                      className="input"
                      value={form.prefix}
                      onChange={e => setForm({ ...form, prefix: e.target.value })}
                      disabled={!isCreate && !isEdit}
                      placeholder="e.g., M-, USR-"
                    />
                  </label>

                  <label>
                    Suffix
                    <input
                      className="input"
                      value={form.suffix}
                      onChange={e => setForm({ ...form, suffix: e.target.value })}
                      disabled={!isCreate && !isEdit}
                      placeholder="e.g., -2024, -KEN"
                    />
                  </label>

                  <label>
                    Digit Count
                    <input
                      type="number"
                      className="input"
                      value={form.digitCount}
                      onChange={e => setForm({ ...form, digitCount: parseInt(e.target.value) || 7 })}
                      disabled={!isCreate && !isEdit}
                      min="1"
                      max="20"
                    />
                  </label>

                  <label>
                    Character Type
                    <select
                      className="input"
                      value={form.characterType}
                      onChange={e => setForm({ ...form, characterType: e.target.value })}
                      disabled={!isCreate && !isEdit}
                    >
                      <option value="NUMERIC">Numeric Only</option>
                      <option value="ALPHANUMERIC">Alphanumeric</option>
                      <option value="ALPHA">Alphabetic Only</option>
                    </select>
                  </label>

                  <label>
                    Start Number
                    <input
                      type="number"
                      className="input"
                      value={form.startNumber}
                      onChange={e => setForm({ ...form, startNumber: parseInt(e.target.value) || 1 })}
                      disabled={!isCreate && !isEdit}
                      min="1"
                    />
                  </label>

                  <label>
                    Current Number
                    <input
                      type="number"
                      className="input"
                      value={form.currentNumber}
                      onChange={e => setForm({ ...form, currentNumber: parseInt(e.target.value) || 0 })}
                      disabled={!isCreate && !isEdit}
                      min="0"
                    />
                  </label>
                </div>

                {/* Preview Section */}
                {preview && (
                  <div style={{ marginTop: "24px" }}>
                    <label>
                      Preview
                      <div className="input" style={{ 
                        backgroundColor: "var(--surface-2)", 
                        fontFamily: "monospace",
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "var(--primary-700)"
                      }}>
                        {preview}
                      </div>
                    </label>
                  </div>
                )}

                {/* Active Status Checkbox - Centered */}
                <div style={{ 
                  marginTop: "32px", 
                  display: "flex", 
                  justifyContent: "center", 
                  alignItems: "center",
                  flexDirection: "column",
                  gap: "16px"
                }}>
                  <h4 style={{ marginBottom: "12px", color: "var(--primary-700)", textAlign: "center" }}>Configuration Status</h4>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={e => setForm({ ...form, isActive: e.target.checked })}
                      disabled={!isCreate && !isEdit}
                      style={{ transform: "scale(1.2)" }}
                    />
                    <span>Active Configuration</span>
                  </label>
                </div>

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
                      {isCreate ? "Add Configuration" : "Update Configuration"}
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

export default IdForm;
