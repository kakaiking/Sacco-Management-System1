import React, { useContext, useEffect, useState } from "react";
import { useHistory, useParams, useLocation } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import axios from "axios";
import { useSnackbar } from "../helpers/SnackbarContext";
import { AuthContext } from "../helpers/AuthContext";
import DashboardWrapper from '../components/DashboardWrapper';

function NationalityForm() {
  const history = useHistory();
  const { authState, isLoading } = useContext(AuthContext);
  const { id } = useParams();
  const { search } = useLocation();
  const { showMessage } = useSnackbar();
  const isEdit = new URLSearchParams(search).get("edit") === "1";
  const isCreate = id === "new";

  const [form, setForm] = useState({
    nationalityId: "",
    nationalityName: "",
    isoCode: "",
    countryCode: "",
    description: "",
    status: "Active",
    createdBy: "",
    createdOn: "",
    modifiedBy: "",
    modifiedOn: "",
    approvedBy: "",
    approvedOn: "",
  });


  useEffect(() => {
    // Only redirect if authentication check is complete and user is not authenticated
    if (!isLoading && !authState.status) {
      history.push("/login");
    }
  }, [authState, isLoading, history]);

  // Generate nationality ID for new nationalities
  const generateNationalityId = () => {
    const randomNum = Math.floor(100000 + Math.random() * 900000); // 6 digits
    return `NAT-${randomNum}`;
  };

  useEffect(() => {
    const load = async () => {
      if (!isCreate) {
        const res = await axios.get(`http://localhost:3001/nationality/${id}`, {
          headers: { accessToken: localStorage.getItem("accessToken") },
        });
        const data = res.data?.entity || res.data;
        setForm({
          nationalityId: data.nationalityId || "",
          nationalityName: data.nationalityName || "",
          isoCode: data.isoCode || "",
          countryCode: data.countryCode || "",
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
        // Generate nationality ID for new nationalities
        setForm(prev => ({ ...prev, nationalityId: generateNationalityId() }));
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
        isoCode: form.isoCode.toUpperCase(),
        countryCode: form.countryCode.toUpperCase(),
        modifiedBy: localStorage.getItem("username") || "System",
        modifiedOn: new Date().toISOString(),
      };

      if (isCreate) {
        payload.createdBy = localStorage.getItem("username") || "System";
        payload.createdOn = new Date().toISOString();
        await axios.post("http://localhost:3001/nationality", payload, {
          headers: { accessToken: localStorage.getItem("accessToken") },
        });
        showMessage("Nationality created successfully", "success");
        history.push("/nationality-maintenance");
      } else {
        await axios.put(`http://localhost:3001/nationality/${id}`, payload, {
          headers: { accessToken: localStorage.getItem("accessToken") },
        });
        showMessage("Nationality updated successfully", "success");
        history.push("/nationality-maintenance");
      }
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to save nationality";
      showMessage(msg, "error");
    }
  };

  return (
    <DashboardWrapper>
      <header className="header">
        <div className="header__left">
          <button className="iconBtn"
            onClick={() => history.push("/nationality-maintenance")}
            style={{
              marginRight: "8px"
            }}
          >
            <FiArrowLeft />
          </button>
          <div className="greeting">{isCreate ? "Add Nationality" : (isEdit ? "Update Nationality Details" : "View Nationality Details")}</div>
        </div>
      </header>

      <main className="dashboard__content">
        <section className="card" style={{ padding: "24px" }}>
          <form onSubmit={handleSubmit}>
            {/* Nationality ID and Status - Non-changeable and automatic */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: "20px",
              marginBottom: "12px",
              alignItems: "start"
            }}>
              <div style={{ display: "grid", gap: "12px" }}>
                <label>
                  Nationality Id
                  <input className="inputa"
                    value={form.nationalityId}
                    onChange={e => setForm({ ...form, nationalityId: e.target.value })}
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

            <hr style={{ margin: "24px 0", border: "none", borderTop: "1px solid #e0e0e0" }} />

            {/* Form Content */}
            <div>
              <div className="grid2">
                <label>
                  Nationality Name *
                  <input
                    className="input"
                    value={form.nationalityName}
                    onChange={e => setForm({ ...form, nationalityName: e.target.value })}
                    disabled={!isCreate && !isEdit}
                    required
                    placeholder="e.g., American, Kenyan, British"
                  />
                </label>

                <label>
                  ISO Code
                  <input
                    className="input"
                    value={form.isoCode}
                    onChange={e => setForm({ ...form, isoCode: e.target.value })}
                    disabled={!isCreate && !isEdit}
                    placeholder="e.g., US, KE, GB"
                    maxLength="2"
                  />
                </label>

                <label>
                  Country Code
                  <input
                    className="input"
                    value={form.countryCode}
                    onChange={e => setForm({ ...form, countryCode: e.target.value })}
                    disabled={!isCreate && !isEdit}
                    placeholder="e.g., USA, KEN, GBR"
                    maxLength="3"
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

              <label>
                Description
                <textarea
                  className="input"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  disabled={!isCreate && !isEdit}
                  placeholder="Additional notes about this nationality..."
                  rows="3"
                />
              </label>

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
                    {isCreate ? "Add Nationality" : "Update Nationality"}
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

export default NationalityForm;