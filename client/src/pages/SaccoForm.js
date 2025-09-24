import React, { useContext, useEffect, useState } from "react";
import { useHistory, useParams, useLocation } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import axios from "axios";
import { useSnackbar } from "../helpers/SnackbarContext";
import { AuthContext } from "../helpers/AuthContext";
import DashboardWrapper from '../components/DashboardWrapper';

function SaccoForm() {
  const history = useHistory();
  const { authState, isLoading } = useContext(AuthContext);
  const { id } = useParams();
  const { search } = useLocation();
  const { showMessage } = useSnackbar();
  const isEdit = new URLSearchParams(search).get("edit") === "1";
  const isCreate = id === "new";

  const [form, setForm] = useState({
    saccoId: "",
    licenseId: "",
    saccoName: "",
    address: "",
    contactPhone: "",
    contactEmail: "",
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

  // Generate Sacco ID for new saccos
  const generateSaccoId = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000); // 4 digits
    return `SAC-${randomNum}`;
  };

  useEffect(() => {
    const load = async () => {
      if (!isCreate) {
        const res = await axios.get(`http://localhost:3001/sacco/${id}`, {
          headers: { accessToken: localStorage.getItem("accessToken") },
        });
        const data = res.data?.entity || res.data;
        setForm({
          saccoId: data.saccoId || "",
          licenseId: data.licenseId || "",
          saccoName: data.saccoName || "",
          address: data.address || "",
          contactPhone: data.contactPhone || "",
          contactEmail: data.contactEmail || "",
          status: data.status || "Active",
          createdBy: data.createdBy || "",
          createdOn: data.createdOn || "",
          modifiedBy: data.modifiedBy || "",
          modifiedOn: data.modifiedOn || "",
          approvedBy: data.approvedBy || "",
          approvedOn: data.approvedOn || "",
        });
      } else {
        // Generate Sacco ID for new saccos
        setForm(prev => ({ ...prev, saccoId: generateSaccoId() }));
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isCreate]);

  const save = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (isCreate) {
        await axios.post("http://localhost:3001/sacco", payload, { headers: { accessToken: localStorage.getItem("accessToken") } });
        showMessage("Sacco created successfully", "success");
      } else {
        await axios.put(`http://localhost:3001/sacco/${id}`, payload, { headers: { accessToken: localStorage.getItem("accessToken") } });
        showMessage("Sacco updated successfully", "success");
      }
      history.push("/sacco-maintenance");
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || "Failed to save sacco";
      showMessage(msg, "error");
    }
  };

  return (
    <DashboardWrapper>
      <header className="header">
        <div className="header__left">
          <button className="iconBtn" onClick={() => history.push("/sacco-maintenance")} title="Back" aria-label="Back" style={{ marginRight: 8 }}>
            <FiArrowLeft className="icon" style={{ fontWeight: "bolder" }}/>
          </button>
          <div className="greeting">{isCreate ? "Add Sacco" : (isEdit ? "Update Sacco Details" : "View Sacco Details")}</div>
        </div>
      </header>

      <main className="dashboard__content">
        <form className="card" onSubmit={save} style={{ display: "grid", gap: 12, padding: 16 }}>
          {/* Sacco ID and Sacco Name at the top */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "1fr auto", 
            gap: "20px",
            marginBottom: "12px",
            alignItems: "start"
          }}>
            <div style={{ display: "grid", gap: "12px" }}>
              <label>
                Sacco ID
                <input className="inputa"
                  value={form.saccoId}
                  onChange={e => setForm({ ...form, saccoId: e.target.value })}
                  required
                  disabled={true}
                />
              </label>
              <label>
                Sacco Name
                <input
                  className="inputa"
                  value={form.saccoName}
                  disabled={true}
                  placeholder="Auto-generated"
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

          <div className="grid2">
            <label>License ID
              <input className="input" 
                value={form.licenseId} 
                onChange={e => setForm({ ...form, licenseId: e.target.value })} 
                required 
                disabled={!isCreate && !isEdit} 
              />
            </label>
            <label>Sacco Name
              <input className="input" 
                value={form.saccoName} 
                onChange={e => setForm({ ...form, saccoName: e.target.value })} 
                required 
                disabled={!isCreate && !isEdit} 
              />
            </label>
            <label>Contact Phone
              <input className="input" 
                type="tel" 
                value={form.contactPhone} 
                onChange={e => setForm({ ...form, contactPhone: e.target.value })} 
                disabled={!isCreate && !isEdit} 
              />
            </label>
            <label>Contact Email
              <input className="input" 
                type="email" 
                value={form.contactEmail} 
                onChange={e => setForm({ ...form, contactEmail: e.target.value })} 
                disabled={!isCreate && !isEdit} 
              />
            </label>
          </div>

          <label>Address
            <textarea className="input" 
              value={form.address} 
              onChange={e => setForm({ ...form, address: e.target.value })} 
              rows="3"
              disabled={!isCreate && !isEdit} 
            />
          </label>


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
                {isCreate ? "Add Sacco" : "Update Sacco"}
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
    </DashboardWrapper>
  );
}

export default SaccoForm;
