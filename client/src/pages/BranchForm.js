import React, { useContext, useEffect, useState } from "react";
import { useHistory, useParams, useLocation } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import axios from "axios";
import { useSnackbar } from "../helpers/SnackbarContext";
import { AuthContext } from "../helpers/AuthContext";
import DashboardWrapper from '../components/DashboardWrapper';

function BranchForm() {
  const history = useHistory();
  const { authState, isLoading } = useContext(AuthContext);
  const { id } = useParams();
  const { search } = useLocation();
  const { showMessage } = useSnackbar();
  const isEdit = new URLSearchParams(search).get("edit") === "1";
  const isCreate = id === "new";

  const [form, setForm] = useState({
    branchId: "",
    saccoId: "",
    branchName: "",
    branchLocation: "",
    status: "Active",
    createdBy: "",
    createdOn: "",
    modifiedBy: "",
    modifiedOn: "",
    approvedBy: "",
    approvedOn: "",
  });

  const [saccos, setSaccos] = useState([]);

  useEffect(() => {
    // Only redirect if authentication check is complete and user is not authenticated
    if (!isLoading && !authState.status) {
      history.push("/login");
    }
  }, [authState, isLoading, history]);

  // Generate Branch ID for new branches
  const generateBranchId = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000); // 4 digits
    return `BR-${randomNum}`;
  };

  // Load saccos for dropdown
  useEffect(() => {
    const loadSaccos = async () => {
      try {
        const res = await axios.get("http://localhost:3001/sacco", {
          headers: { accessToken: localStorage.getItem("accessToken") },
        });
        setSaccos(res.data?.entity || []);
      } catch (err) {
        console.error("Failed to load saccos:", err);
      }
    };
    loadSaccos();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!isCreate) {
        const res = await axios.get(`http://localhost:3001/branch/${id}`, {
          headers: { accessToken: localStorage.getItem("accessToken") },
        });
        const data = res.data?.entity || res.data;
        setForm({
          branchId: data.branchId || "",
          saccoId: data.saccoId || "",
          branchName: data.branchName || "",
          branchLocation: data.branchLocation || "",
          status: data.status || "Active",
          createdBy: data.createdBy || "",
          createdOn: data.createdOn || "",
          modifiedBy: data.modifiedBy || "",
          modifiedOn: data.modifiedOn || "",
          approvedBy: data.approvedBy || "",
          approvedOn: data.approvedOn || "",
        });
      } else {
        // Generate Branch ID for new branches
        setForm(prev => ({ ...prev, branchId: generateBranchId() }));
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
        await axios.post("http://localhost:3001/branch", payload, { headers: { accessToken: localStorage.getItem("accessToken") } });
        showMessage("Branch created successfully", "success");
      } else {
        await axios.put(`http://localhost:3001/branch/${id}`, payload, { headers: { accessToken: localStorage.getItem("accessToken") } });
        showMessage("Branch updated successfully", "success");
      }
      history.push("/branch-maintenance");
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || "Failed to save branch";
      showMessage(msg, "error");
    }
  };

  return (
    <DashboardWrapper>
      <header className="header">
        <div className="header__left">
          <button className="iconBtn" onClick={() => history.push("/branch-maintenance")} title="Back" aria-label="Back" style={{ marginRight: 8 }}>
            <FiArrowLeft className="icon" style={{ fontWeight: "bolder" }}/>
          </button>
          <div className="greeting">{isCreate ? "Add Branch" : (isEdit ? "Update Branch Details" : "View Branch Details")}</div>
        </div>
      </header>

      <main className="dashboard__content">
        <form className="card" onSubmit={save} style={{ display: "grid", gap: 12, padding: 16 }}>
          {/* Branch ID and Branch Name at the top */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "1fr auto", 
            gap: "20px",
            marginBottom: "12px",
            alignItems: "start"
          }}>
            <div style={{ display: "grid", gap: "12px" }}>
              <label>
                Branch ID
                <input className="inputa"
                  value={form.branchId}
                  onChange={e => setForm({ ...form, branchId: e.target.value })}
                  required
                  disabled={true}
                />
              </label>
              <label>
                Branch Name
                <input
                  className="inputa"
                  value={form.branchName}
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
            <label>Sacco ID
              <select className="input" 
                value={form.saccoId} 
                onChange={e => setForm({ ...form, saccoId: e.target.value })} 
                required 
                disabled={!isCreate && !isEdit} 
              >
                <option value="">Select Sacco</option>
                {saccos.map((sacco) => (
                  <option key={sacco.id} value={sacco.saccoId}>
                    {sacco.saccoName} ({sacco.saccoId})
                  </option>
                ))}
              </select>
            </label>
            <label>Branch Name
              <input className="input" 
                value={form.branchName} 
                onChange={e => setForm({ ...form, branchName: e.target.value })} 
                required 
                disabled={!isCreate && !isEdit} 
              />
            </label>
            <label>Branch Location
              <input className="input" 
                value={form.branchLocation} 
                onChange={e => setForm({ ...form, branchLocation: e.target.value })} 
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
                {isCreate ? "Add Branch" : "Update Branch"}
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

export default BranchForm;
