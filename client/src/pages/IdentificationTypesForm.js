import React, { useContext, useEffect, useState } from "react";
import { useHistory, useParams, useLocation } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import axios from "axios";
import { useSnackbar } from "../helpers/SnackbarContext";
import { AuthContext } from "../helpers/AuthContext";
import DashboardWrapper from '../components/DashboardWrapper';
import frontendLoggingService from "../services/frontendLoggingService";

function IdentificationTypesForm() {
  const history = useHistory();
  const { authState, isLoading } = useContext(AuthContext);
  const { id } = useParams();
  const { search } = useLocation();
  const { showMessage } = useSnackbar();
  const isEdit = new URLSearchParams(search).get("edit") === "1";
  const isCreate = id === "new";

  const [form, setForm] = useState({
    identificationTypeId: "",
    identificationTypeName: "",
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
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    // Only redirect if authentication check is complete and user is not authenticated
    if (!isLoading && !authState.status) {
      history.push("/login");
    }
  }, [authState, isLoading, history]);

  // Generate Identification Type ID for new identification types
  const generateIdentificationTypeId = () => {
    const randomNum = Math.floor(1000000 + Math.random() * 9000000); // 7 digits
    return `ID-${randomNum}`;
  };

  useEffect(() => {
    const load = async () => {
      if (isCreate) {
        // For new identification type, generate ID and set defaults
        setForm(prev => ({
          ...prev,
          identificationTypeId: generateIdentificationTypeId(),
          createdBy: authState.username || "",
          createdOn: new Date().toISOString().split('T')[0]
        }));
      } else {
        // Load existing identification type
        try {
          setLoading(true);
          const response = await axios.get(`http://localhost:3001/identification-types/${id}`, {
            headers: { accessToken: localStorage.getItem("accessToken") }
          });

          if (response.data.code === 200) {
            const identificationType = response.data.entity;
            // Store original data for logging purposes
            setOriginalData(identificationType);
            setForm({
              identificationTypeId: identificationType.identificationTypeId || "",
              identificationTypeName: identificationType.identificationTypeName || "",
              description: identificationType.description || "",
              status: identificationType.status || "Active",
              createdBy: identificationType.createdBy || "",
              createdOn: identificationType.createdOn ? new Date(identificationType.createdOn).toISOString().split('T')[0] : "",
              modifiedBy: identificationType.modifiedBy || "",
              modifiedOn: identificationType.modifiedOn ? new Date(identificationType.modifiedOn).toISOString().split('T')[0] : "",
              approvedBy: identificationType.approvedBy || "",
              approvedOn: identificationType.approvedOn ? new Date(identificationType.approvedOn).toISOString().split('T')[0] : "",
            });
          } else {
            showMessage("Identification type not found", "error");
            history.push("/identification-types-maintenance");
          }
        } catch (error) {
          console.error("Error loading identification type:", error);
          showMessage("Error loading identification type", "error");
          history.push("/identification-types-maintenance");
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
    
    if (!form.identificationTypeName.trim()) {
      showMessage("Identification type name is required", "error");
      return;
    }

    try {
      setSaving(true);
      
      if (isCreate) {
        // Create new identification type
        const response = await axios.post('http://localhost:3001/identification-types', {
          identificationTypeName: form.identificationTypeName,
          description: form.description,
        }, {
          headers: { accessToken: localStorage.getItem("accessToken") }
        });

        if (response.data.code === 201) {
          showMessage("Identification type created successfully", "success");
          frontendLoggingService.logCreate("IdentificationTypes", response.data.entity.id, form.identificationTypeName, response.data.entity, `Created identification type: ${form.identificationTypeName}`);
          history.push("/identification-types-maintenance");
        }
      } else {
        // Update existing identification type
        const response = await axios.put(`http://localhost:3001/identification-types/${id}`, {
          identificationTypeName: form.identificationTypeName,
          description: form.description,
          status: form.status,
        }, {
          headers: { accessToken: localStorage.getItem("accessToken") }
        });

        if (response.data.code === 200) {
          showMessage("Identification type updated successfully", "success");
          frontendLoggingService.logUpdate("IdentificationTypes", id, form.identificationTypeName, originalData, response.data.entity, `Updated identification type: ${form.identificationTypeName}`);
          history.push("/identification-types-maintenance");
        }
      }
    } catch (error) {
      console.error("Error saving identification type:", error);
      if (error.response?.data?.message) {
        showMessage(error.response.data.message, "error");
      } else if (error.response?.data?.error) {
        showMessage(error.response.data.error, "error");
      } else {
        showMessage("Error saving identification type", "error");
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
            onClick={() => history.push("/identification-types-maintenance")}
            style={{ marginRight: "16px" }}
          >
            <FiArrowLeft style={{ marginRight: "8px" }} />
            Back
          </button>
          <div className="greeting">
            {isCreate ? "Add New Identification Type" : isEdit ? "Edit Identification Type" : "View Identification Type"}
          </div>
        </div>
      </header>

      <main className="dashboard__content">
        <section className="card" style={{ padding: "24px" }}>
          <form onSubmit={save}>
            {/* Identification Type ID and Status - Non-changeable and automatic */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: "20px",
              marginBottom: "12px",
              alignItems: "start"
            }}>
              <div style={{ display: "grid", gap: "12px" }}>
                <label>
                  Identification Type Id
                  <input className="inputa"
                    value={form.identificationTypeId}
                    onChange={e => setForm({ ...form, identificationTypeId: e.target.value })}
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
                    Identification Type Name *
                    <input
                      className="input"
                      value={form.identificationTypeName}
                      onChange={e => setForm({ ...form, identificationTypeName: e.target.value })}
                      disabled={!isCreate && !isEdit}
                      required
                      placeholder="e.g., National ID, Passport, Driver's License"
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
                      <option value="Pending">Pending</option>
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
                <div className="grid2">
                  <label>
                    Description
                    <textarea
                      className="input"
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      disabled={!isCreate && !isEdit}
                      placeholder="Additional notes about this identification type..."
                      rows="3"
                    />
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
                      {saving ? "Saving..." : (isCreate ? "Add Identification Type" : "Update Identification Type")}
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

export default IdentificationTypesForm;


