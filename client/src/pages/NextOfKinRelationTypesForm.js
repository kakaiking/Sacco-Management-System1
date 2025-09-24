import React, { useContext, useEffect, useState } from "react";
import { useHistory, useParams, useLocation } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import axios from "axios";
import { useSnackbar } from "../helpers/SnackbarContext";
import { AuthContext } from "../helpers/AuthContext";
import DashboardWrapper from '../components/DashboardWrapper';
import frontendLoggingService from "../services/frontendLoggingService";

function NextOfKinRelationTypesForm() {
  const history = useHistory();
  const { authState, isLoading } = useContext(AuthContext);
  const { id } = useParams();
  const { search } = useLocation();
  const { showMessage } = useSnackbar();
  const isEdit = new URLSearchParams(search).get("edit") === "1";
  const isCreate = id === "new";

  const [form, setForm] = useState({
    relationTypeId: "",
    relationTypeName: "",
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

  // Generate Next of Kin Relation Type ID for new relation types
  const generateRelationTypeId = () => {
    const randomNum = Math.floor(1000000 + Math.random() * 9000000); // 7 digits
    return `RT-${randomNum}`;
  };

  useEffect(() => {
    const load = async () => {
      if (isCreate) {
        // For new relation type, generate ID and set defaults
        setForm(prev => ({
          ...prev,
          relationTypeId: generateRelationTypeId(),
          createdBy: authState.username || "",
          createdOn: new Date().toISOString().split('T')[0]
        }));
      } else {
        // Load existing relation type
        try {
          setLoading(true);
          const response = await axios.get(`http://localhost:3001/next-of-kin-relation-types/${id}`, {
            headers: { accessToken: localStorage.getItem("accessToken") }
          });

          if (response.data.code === 200) {
            const nextOfKinRelationType = response.data.entity;
            // Store original data for logging purposes
            setOriginalData(nextOfKinRelationType);
            setForm({
              relationTypeId: nextOfKinRelationType.relationTypeId || "",
              relationTypeName: nextOfKinRelationType.relationTypeName || "",
              description: nextOfKinRelationType.description || "",
              status: nextOfKinRelationType.status || "Active",
              createdBy: nextOfKinRelationType.createdBy || "",
              createdOn: nextOfKinRelationType.createdOn ? new Date(nextOfKinRelationType.createdOn).toISOString().split('T')[0] : "",
              modifiedBy: nextOfKinRelationType.modifiedBy || "",
              modifiedOn: nextOfKinRelationType.modifiedOn ? new Date(nextOfKinRelationType.modifiedOn).toISOString().split('T')[0] : "",
              approvedBy: nextOfKinRelationType.approvedBy || "",
              approvedOn: nextOfKinRelationType.approvedOn ? new Date(nextOfKinRelationType.approvedOn).toISOString().split('T')[0] : "",
            });
          } else {
            showMessage("Next of kin relation type not found", "error");
            history.push("/next-of-kin-relation-types-maintenance");
          }
        } catch (error) {
          console.error("Error loading next of kin relation type:", error);
          showMessage("Error loading next of kin relation type", "error");
          history.push("/next-of-kin-relation-types-maintenance");
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
    
    if (!form.relationTypeName.trim()) {
      showMessage("Next of kin relation type name is required", "error");
      return;
    }

    try {
      setSaving(true);
      
      if (isCreate) {
        // Create new next of kin relation type
        const response = await axios.post('http://localhost:3001/next-of-kin-relation-types', {
          relationTypeName: form.relationTypeName,
          description: form.description,
        }, {
          headers: { accessToken: localStorage.getItem("accessToken") }
        });

        if (response.data.code === 201) {
          showMessage("Next of kin relation type created successfully", "success");
          frontendLoggingService.logCreate("NextOfKinRelationTypes", response.data.entity.id, form.relationTypeName, response.data.entity, `Created next of kin relation type: ${form.relationTypeName}`);
          history.push("/next-of-kin-relation-types-maintenance");
        }
      } else {
        // Update existing next of kin relation type
        const response = await axios.put(`http://localhost:3001/next-of-kin-relation-types/${id}`, {
          relationTypeName: form.relationTypeName,
          description: form.description,
        }, {
          headers: { accessToken: localStorage.getItem("accessToken") }
        });

        if (response.data.code === 200) {
          showMessage("Next of kin relation type updated successfully", "success");
          frontendLoggingService.logUpdate("NextOfKinRelationTypes", id, form.relationTypeName, originalData, response.data.entity, `Updated next of kin relation type: ${form.relationTypeName}`);
          history.push("/next-of-kin-relation-types-maintenance");
        }
      }
    } catch (error) {
      console.error("Error saving next of kin relation type:", error);
      if (error.response?.data?.message) {
        showMessage(error.response.data.message, "error");
      } else if (error.response?.data?.error) {
        showMessage(error.response.data.error, "error");
      } else {
        showMessage("Error saving next of kin relation type", "error");
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
            onClick={() => history.push("/next-of-kin-relation-types-maintenance")}
            style={{ marginRight: "16px" }}
          >
            <FiArrowLeft style={{ marginRight: "8px" }} />
            Back
          </button>
          <div className="greeting">
            {isCreate ? "Add New Next of Kin Relation Type" : isEdit ? "Edit Next of Kin Relation Type" : "View Next of Kin Relation Type"}
          </div>
        </div>
      </header>

      <main className="dashboard__content">
        <section className="card" style={{ padding: "24px" }}>
          <form onSubmit={save}>
            {/* Next of Kin Relation Type ID and Status - Non-changeable and automatic */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: "20px",
              marginBottom: "12px",
              alignItems: "start"
            }}>
              <div style={{ display: "grid", gap: "12px" }}>
                <label>
                  Next of Kin Relation Type Id
                  <input className="inputa"
                    value={form.relationTypeId}
                    onChange={e => setForm({ ...form, relationTypeId: e.target.value })}
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
                  Next of Kin Relation Type Name *
                  <input
                    className="input"
                    value={form.relationTypeName}
                    onChange={e => setForm({ ...form, relationTypeName: e.target.value })}
                    disabled={!isCreate && !isEdit}
                    required
                    placeholder="e.g., Spouse, Parent, Sibling, Child, Guardian"
                  />
                </label>

                <label>
                  Description
                  <textarea
                    className="input"
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    disabled={!isCreate && !isEdit}
                    placeholder="Additional notes about this relation type..."
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
                    {saving ? "Saving..." : (isCreate ? "Add Next of Kin Relation Type" : "Update Next of Kin Relation Type")}
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

export default NextOfKinRelationTypesForm;

