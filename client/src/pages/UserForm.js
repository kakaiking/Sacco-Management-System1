import React, { useContext, useEffect, useState } from "react";
import { useHistory, useParams, useLocation } from "react-router-dom";
import { FiArrowLeft, FiSearch } from "react-icons/fi";
import axios from "axios";
import { useSnackbar } from "../helpers/SnackbarContext";
import { AuthContext } from "../helpers/AuthContext";
import DashboardWrapper from '../components/DashboardWrapper';
import RoleLookupModal from '../components/RoleLookupModal';

function UserForm() {
  const history = useHistory();
  const { authState, isLoading } = useContext(AuthContext);
  const { id } = useParams();
  const { search } = useLocation();
  const { showMessage } = useSnackbar();
  const isEdit = new URLSearchParams(search).get("edit") === "1";
  const isCreate = id === "new";

  const [form, setForm] = useState({
    userId: "",
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    role: "",
    status: "Pending Password",
    createdBy: "",
    createdOn: "",
    modifiedBy: "",
    modifiedOn: "",
    approvedBy: "",
    approvedOn: "",
    lockedBy: "",
    lockedOn: "",
    lockRemarks: "",
  });


  // Role lookup modal state
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  useEffect(() => {
    // Only redirect if authentication check is complete and user is not authenticated
    if (!isLoading && !authState.status) {
      history.push("/login");
    }
  }, [authState, isLoading, history]);

  // Generate User ID for new users
  const generateUserId = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `USR-${randomNum}`;
  };

  useEffect(() => {
    const load = async () => {
      if (!isCreate) {
        const res = await axios.get(`http://localhost:3001/users/${id}`, {
          headers: { accessToken: localStorage.getItem("accessToken") },
        });
        const data = res.data?.entity || res.data;
        setForm({
          userId: data.userId || "",
          username: data.username || "",
          email: data.email || "",
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          phoneNumber: data.phoneNumber || "",
          role: data.role || "User",
          status: data.status || "Pending Password",
          createdBy: data.createdBy || "",
          createdOn: data.createdOn || "",
          modifiedBy: data.modifiedBy || "",
          modifiedOn: data.modifiedOn || "",
          approvedBy: data.approvedBy || "",
          approvedOn: data.approvedOn || "",
          lockedBy: data.lockedBy || "",
          lockedOn: data.lockedOn || "",
          lockRemarks: data.lockRemarks || "",
        });
      } else {
        // Generate User ID for new users
        setForm(prev => ({ ...prev, userId: generateUserId() }));
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
        await axios.post("http://localhost:3001/users", payload, { headers: { accessToken: localStorage.getItem("accessToken") } });
        showMessage("User created successfully. An email has been sent to set up password.", "success");
      } else {
        await axios.put(`http://localhost:3001/users/${id}`, payload, { headers: { accessToken: localStorage.getItem("accessToken") } });
        showMessage("User updated successfully", "success");
      }
      history.push("/user-maintenance");
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || "Failed to save user";
      showMessage(msg, "error");
    }
  };

  // Role lookup modal handlers
  const handleOpenRoleModal = () => {
    setIsRoleModalOpen(true);
  };

  const handleCloseRoleModal = () => {
    setIsRoleModalOpen(false);
  };

  const handleSelectRole = (selectedRole) => {
    setForm(prev => ({ ...prev, role: selectedRole.roleName }));
    setIsRoleModalOpen(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return { bg: "rgba(16, 185, 129, 0.2)", color: "#059669", border: "rgba(16, 185, 129, 0.3)" };
      case "Inactive":
        return { bg: "rgba(239, 68, 68, 0.2)", color: "#dc2626", border: "rgba(239, 68, 68, 0.3)" };
      case "Pending":
        return { bg: "rgba(245, 158, 11, 0.2)", color: "#d97706", border: "rgba(245, 158, 11, 0.3)" };
      case "Pending Password":
        return { bg: "rgba(59, 130, 246, 0.2)", color: "#2563eb", border: "rgba(59, 130, 246, 0.3)" };
      case "Locked":
        return { bg: "rgba(107, 114, 128, 0.2)", color: "#6b7280", border: "rgba(107, 114, 128, 0.3)" };
      default:
        return { bg: "rgba(107, 114, 128, 0.2)", color: "#6b7280", border: "rgba(107, 114, 128, 0.3)" };
    }
  };

  const statusColors = getStatusColor(form.status);

  return (
    <DashboardWrapper>
      <header className="header">
        <div className="header__left">
          <button className="iconBtn" onClick={() => history.push("/user-maintenance")} title="Back" aria-label="Back" style={{ marginRight: 8 }}>
            <FiArrowLeft className="icon" style={{ fontWeight: "bolder" }}/>
          </button>
          <div className="greeting">{isCreate ? "Add User" : (isEdit ? "Update User Details" : "View User Details")}</div>
        </div>
      </header>

      <main className="dashboard__content">
        <form className="card" onSubmit={save} style={{ display: "grid", gap: 12, padding: 16 }}>
          {/* User ID and Status at the top */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "1fr auto", 
            gap: "20px",
            marginBottom: "12px",
            alignItems: "start"
          }}>
            <div style={{ display: "grid", gap: "12px" }}>
              <label>
                User ID
                <input className="inputa"
                  value={form.userId}
                  onChange={e => setForm({ ...form, userId: e.target.value })}
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
                  {form.status || "Pending Password"}
                </div>
              </div>
            </div>
          </div> 

          <div className="grid2">
            <label>Username
              <input className="input" 
                value={form.username} 
                onChange={e => setForm({ ...form, username: e.target.value })} 
                required 
                disabled={!isCreate && !isEdit} 
              />
            </label>
            <label>Email
              <input className="input" 
                type="email"
                value={form.email} 
                onChange={e => setForm({ ...form, email: e.target.value })} 
                required 
                disabled={!isCreate && !isEdit} 
              />
            </label>
            <label>First Name
              <input className="input" 
                value={form.firstName} 
                onChange={e => setForm({ ...form, firstName: e.target.value })} 
                required 
                disabled={!isCreate && !isEdit} 
              />
            </label>
            <label>Last Name
              <input className="input" 
                value={form.lastName} 
                onChange={e => setForm({ ...form, lastName: e.target.value })} 
                required 
                disabled={!isCreate && !isEdit} 
              />
            </label>
            <label>Phone Number
              <input className="input" 
                value={form.phoneNumber} 
                onChange={e => setForm({ ...form, phoneNumber: e.target.value })} 
                disabled={!isCreate && !isEdit} 
              />
            </label>
            <label>Role
              <div className="role-input-wrapper">
                <input 
                  type="text"
                  className="input" 
                  value={form.role} 
                  onChange={e => setForm({ ...form, role: e.target.value })} 
                  disabled={!isCreate && !isEdit}
                  placeholder="Select a role"
                  readOnly={!isCreate && !isEdit}
                />
                {(isCreate || isEdit) && (
                  <button
                    type="button"
                    className="role-search-btn"
                    onClick={handleOpenRoleModal}
                    title="Search roles"
                  >
                    <FiSearch />
                  </button>
                )}
              </div>
            </label>
            {/* {!isCreate && (
              <label>Status
                <select className="input" 
                  value={form.status} 
                  onChange={e => setForm({ ...form, status: e.target.value })} 
                  disabled={!isEdit} 
                >
                  <option value="Pending Password">Pending Password</option>
                  <option value="Pending">Pending</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Locked">Locked</option>
                </select>
              </label>
            )} */}
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
                {isCreate ? "Add User" : "Update User"}
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

            <label>
              Locked On
              <input className="inputf"
                value={form.lockedOn ? new Date(form.lockedOn).toLocaleDateString() : ""}
                disabled={true}
              />
            </label>

            <label>
              Locked By
              <input className="inputf"
                value={form.lockedBy || ""}
                disabled={true}
              />
            </label>

            <label>
              Lock Remarks
              <textarea className="inputf"
                value={form.lockRemarks || ""}
                disabled={true}
                rows={3}
                style={{ resize: "vertical" }}
              />
            </label>
            
          </div>
        </form>
      </main>

      {/* Role Lookup Modal */}
      <RoleLookupModal
        isOpen={isRoleModalOpen}
        onClose={handleCloseRoleModal}
        onSelectRole={handleSelectRole}
      />
    </DashboardWrapper>
  );
}

export default UserForm;
