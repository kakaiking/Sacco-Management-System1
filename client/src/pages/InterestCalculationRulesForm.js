import React, { useContext, useEffect, useState } from "react";
import { useHistory, useParams, useLocation } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import axios from "axios";
import { useSnackbar } from "../helpers/SnackbarContext";
import { AuthContext } from "../helpers/AuthContext";
import DashboardWrapper from '../components/DashboardWrapper';
import frontendLoggingService from "../services/frontendLoggingService";

function InterestCalculationRulesForm() {
  const history = useHistory();
  const { authState, isLoading } = useContext(AuthContext);
  const { id } = useParams();
  const { search } = useLocation();
  const { showMessage } = useSnackbar();
  const isEdit = new URLSearchParams(search).get("edit") === "1";
  const isCreate = id === "new";

  const [form, setForm] = useState({
    ruleId: "",
    ruleName: "",
    description: "",
    status: "Active",
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

  // Generate Interest Calculation Rule ID for new rules
  const generateRuleId = () => {
    const randomNum = Math.floor(1000000 + Math.random() * 9000000); // 7 digits
    return `ICR-${randomNum}`;
  };

  useEffect(() => {
    const load = async () => {
      if (isCreate) {
        // For new rule, generate ID and set defaults
        setForm(prev => ({
          ...prev,
          ruleId: generateRuleId(),
          createdBy: authState.username || "",
          createdOn: new Date().toISOString().split('T')[0]
        }));
      } else {
        // Load existing rule
        try {
          setLoading(true);
          const response = await axios.get(`http://localhost:3001/interest-calculation-rules/${id}`, {
            headers: { accessToken: localStorage.getItem("accessToken") }
          });

          if (response.data.code === 200) {
            const interestCalculationRule = response.data.entity;
            // Store original data for logging purposes
            setOriginalData(interestCalculationRule);
            setForm({
              ruleId: interestCalculationRule.ruleId || "",
              ruleName: interestCalculationRule.ruleName || "",
              description: interestCalculationRule.description || "",
              status: interestCalculationRule.status || "Active",
              createdBy: interestCalculationRule.createdBy || "",
              createdOn: interestCalculationRule.createdOn ? new Date(interestCalculationRule.createdOn).toISOString().split('T')[0] : "",
              modifiedBy: interestCalculationRule.modifiedBy || "",
              modifiedOn: interestCalculationRule.modifiedOn ? new Date(interestCalculationRule.modifiedOn).toISOString().split('T')[0] : "",
              approvedBy: interestCalculationRule.approvedBy || "",
              approvedOn: interestCalculationRule.approvedOn ? new Date(interestCalculationRule.approvedOn).toISOString().split('T')[0] : "",
            });
          } else {
            showMessage("Interest calculation rule not found", "error");
            history.push("/interest-calculation-rules-maintenance");
          }
        } catch (error) {
          console.error("Error loading interest calculation rule:", error);
          showMessage("Error loading interest calculation rule", "error");
          history.push("/interest-calculation-rules-maintenance");
        } finally {
          setLoading(false);
        }
      }
    };

    if (authState.status) {
      load();
    }
  }, [authState.status, id, isCreate, authState.token, authState.username, history, showMessage]);

  const save = async (e) => {
    e.preventDefault();
    
    if (!form.ruleName.trim()) {
      showMessage("Interest calculation rule name is required", "error");
      return;
    }

    try {
      setSaving(true);
      
      if (isCreate) {
        // Create new interest calculation rule
        const response = await axios.post('http://localhost:3001/interest-calculation-rules', {
          ruleName: form.ruleName,
          description: form.description,
        }, {
          headers: { accessToken: localStorage.getItem("accessToken") }
        });

        if (response.data.code === 201) {
          showMessage("Interest calculation rule created successfully", "success");
          frontendLoggingService.logCreate("InterestCalculationRules", response.data.entity.id, form.ruleName, response.data.entity, `Created interest calculation rule: ${form.ruleName}`);
          history.push("/interest-calculation-rules-maintenance");
        }
      } else {
        // Update existing interest calculation rule
        const response = await axios.put(`http://localhost:3001/interest-calculation-rules/${id}`, {
          ruleName: form.ruleName,
          description: form.description,
        }, {
          headers: { accessToken: localStorage.getItem("accessToken") }
        });

        if (response.data.code === 200) {
          showMessage("Interest calculation rule updated successfully", "success");
          frontendLoggingService.logUpdate("InterestCalculationRules", id, form.ruleName, originalData, response.data.entity, `Updated interest calculation rule: ${form.ruleName}`);
          history.push("/interest-calculation-rules-maintenance");
        }
      }
    } catch (error) {
      console.error("Error saving interest calculation rule:", error);
      if (error.response?.data?.message) {
        showMessage(error.response.data.message, "error");
      } else if (error.response?.data?.error) {
        showMessage(error.response.data.error, "error");
      } else {
        showMessage("Error saving interest calculation rule", "error");
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
            onClick={() => history.push("/interest-calculation-rules-maintenance")}
            style={{ marginRight: "16px" }}
          >
            <FiArrowLeft style={{ marginRight: "8px" }} />
            Back
          </button>
          <div className="greeting">
            {isCreate ? "Add New Interest Calculation Rule" : isEdit ? "Edit Interest Calculation Rule" : "View Interest Calculation Rule"}
          </div>
        </div>
      </header>

      <main className="dashboard__content">
        <section className="card" style={{ padding: "24px" }}>
          <form onSubmit={save}>
            {/* Interest Calculation Rule ID and Status - Non-changeable and automatic */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: "20px",
              marginBottom: "12px",
              alignItems: "start"
            }}>
              <div style={{ display: "grid", gap: "12px" }}>
                <label>
                  Interest Calculation Rule Id
                  <input className="inputa"
                    value={form.ruleId}
                    onChange={e => setForm({ ...form, ruleId: e.target.value })}
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

            {/* Form Content */}
            <div>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <label>
                  Interest Calculation Rule Name *
                  <input
                    className="input"
                    value={form.ruleName}
                    onChange={e => setForm({ ...form, ruleName: e.target.value })}
                    disabled={!isCreate && !isEdit}
                    required
                    placeholder="e.g., Simple Interest, Compound Interest, Flat Rate"
                  />
                </label>

                <label>
                  Description
                  <textarea
                    className="input"
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    disabled={!isCreate && !isEdit}
                    placeholder="Additional notes about this interest calculation rule..."
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
                    {saving ? "Saving..." : (isCreate ? "Add Interest Calculation Rule" : "Update Interest Calculation Rule")}
                  </button>
                )}
              </div>
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

export default InterestCalculationRulesForm;

