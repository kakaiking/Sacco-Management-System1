import React, { useContext, useEffect, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import axios from "axios";
import { FiSave, FiArrowLeft } from "react-icons/fi";
import DashboardWrapper from '../components/DashboardWrapper';
import { useSnackbar } from "../helpers/SnackbarContext";
import { AuthContext } from "../helpers/AuthContext";

// System modules based on the sidebar navigation - moved outside component to prevent re-creation
const systemModules = [
  // Admin Section
  { name: "Member Maintenance", key: "member_maintenance" },
  { name: "User Maintenance", key: "user_maintenance" },
  { name: "Role Maintenance", key: "role_maintenance" },
  { name: "Logs Maintenance", key: "logs_maintenance" },
  { name: "Loan Calculator", key: "loan_calculator" },
  
  // Configurations Section
  { name: "Product Maintenance", key: "product_maintenance" },
  { name: "Sacco Maintenance", key: "sacco_maintenance" },
  { name: "Branch Maintenance", key: "branch_maintenance" },
  { name: "Charges Management", key: "charges_management" },
  { name: "Till Maintenance", key: "till_maintenance" },
  
  // Accounting Section
  { name: "Accounts Management", key: "accounts_management" },
  { name: "GL Accounts Management", key: "gl_accounts_management" },
  { name: "Account Types Maintenance", key: "account_types_maintenance" },
  
  // Transactions Section
  { name: "Transaction Maintenance", key: "transaction_maintenance" },
  { name: "Cash Transaction Maintenance", key: "cash_transaction_maintenance" },
  
  // Static Data Section - Grouped as requested
  { name: "Static Data Management", key: "static_data_management" }
];

function RoleForm() {
  const history = useHistory();
  const { id } = useParams();
  const { authState, isLoading } = useContext(AuthContext);
  const { showMessage } = useSnackbar();
  const isEdit = id !== "new";
  const isCreate = id === "new";
  const isViewMode = isEdit && !new URLSearchParams(window.location.search).get('edit');

  const [formData, setFormData] = useState({
    roleId: "",
    roleName: "",
    description: "",
    status: "Active",
    permissions: {}
  });


  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);

  // Generate role ID for new roles
  const generateRoleId = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `ROL-${randomNum}`;
  };

  useEffect(() => {
    // Only redirect if authentication check is complete and user is not authenticated
    if (!isLoading && !authState.status) {
      history.push("/login");
    }
  }, [authState, isLoading, history]);

  // Initialize permissions for all modules
  useEffect(() => {
    if (!isEdit) {
      const initialPermissions = {};
      systemModules.forEach(module => {
        initialPermissions[module.key] = {
          canAdd: false,
          canView: false,
          canEdit: false,
          canDelete: false,
          canApprove: false
        };
      });
      setFormData(prev => ({ ...prev, permissions: initialPermissions }));
    }
  }, [isEdit]);

  // Fetch role data for editing
  useEffect(() => {
    const fetchRole = async () => {
      if (isEdit && authState.status) {
        try {
          setInitialLoading(true);
          const response = await axios.get(`http://localhost:3001/roles/${id}`, {
            headers: { accessToken: localStorage.getItem("accessToken") }
          });
          const role = response.data.entity;
          
          // Initialize permissions if not present
          const permissions = role.permissions || {};
          systemModules.forEach(module => {
            if (!permissions[module.key]) {
              permissions[module.key] = {
                canAdd: false,
                canView: false,
                canEdit: false,
                canDelete: false,
                canApprove: false
              };
            } else {
              // Ensure canApprove exists for existing permissions
              if (permissions[module.key].canApprove === undefined) {
                permissions[module.key].canApprove = false;
              }
            }
          });

          setFormData({
            roleId: role.roleId || "",
            roleName: role.roleName || "",
            description: role.description || "",
            status: role.status || "Active",
            permissions: permissions
          });
        } catch (error) {
          console.error("Error fetching role:", error);
          showMessage("Failed to fetch role data", "error");
          history.push("/role-maintenance");
        } finally {
          setInitialLoading(false);
        }
      }
    };

    if (isEdit) {
      fetchRole();
    } else {
      // Generate role ID for new roles
      setFormData(prev => ({ ...prev, roleId: generateRoleId() }));
    }
  }, [id, isEdit, authState.status, showMessage, history]);


  const handlePermissionChange = (moduleKey, permission, checked) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [moduleKey]: {
          ...prev.permissions[moduleKey],
          [permission]: checked
        }
      }
    }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent submission in view mode
    if (isViewMode) {
      return;
    }
    
    if (!formData.roleName.trim()) {
      showMessage("Please fill in the role name", "error");
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        await axios.put(`http://localhost:3001/roles/${id}`, formData, {
          headers: { accessToken: localStorage.getItem("accessToken") }
        });
        showMessage("Role updated successfully", "success");
      } else {
        await axios.post("http://localhost:3001/roles", formData, {
          headers: { accessToken: localStorage.getItem("accessToken") }
        });
        showMessage("Role created successfully", "success");
      }
      history.push("/role-maintenance");
    } catch (error) {
      console.error("Error saving role:", error);
      showMessage("Failed to save role", "error");
    } finally {
      setLoading(false);
    }
  };


  if (initialLoading) {
    return (
      <DashboardWrapper>
        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
          Loading role data...
        </div>
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper>
      <header className="header">
        <div className="header__left">
          <button className="iconBtn" onClick={() => history.push("/role-maintenance")} title="Back" aria-label="Back" style={{ marginRight: 8 }}>
            <FiArrowLeft className="icon" style={{ fontWeight: "bolder" }}/>
          </button>
          <div className="greeting">{isCreate ? "Add Role" : (isEdit ? "Update Role Details" : "View Role Details")}</div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="form">
        <div className="form__section">
          {/* <h2 className="form__section-title">Role Information</h2> */}
          
          <div style={{ display: "grid", gap: "12px" }}>
            <label>
              Role ID
              <input className="inputa"
                value={formData.roleId}
                onChange={e => setFormData({ ...formData, roleId: e.target.value })}
                required
                disabled={true}
              />
            </label>
            <label>
              Role Name
              <input
                className="inputa"
                value={formData.roleName}
                onChange={e => setFormData({ ...formData, roleName: e.target.value })}
                required
                disabled={isViewMode}
                placeholder="Enter role name"
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
                    formData.status === "Active" ? "rgba(16, 185, 129, 0.2)" :
                    formData.status === "Inactive" ? "rgba(239, 68, 68, 0.2)" :
                    "rgba(107, 114, 128, 0.2)",
                  color: 
                    formData.status === "Active" ? "#059669" :
                    formData.status === "Inactive" ? "#dc2626" :
                    "#6b7280",
                  border: `1px solid ${
                    formData.status === "Active" ? "rgba(16, 185, 129, 0.3)" :
                    formData.status === "Inactive" ? "rgba(239, 68, 68, 0.3)" :
                    "rgba(107, 114, 128, 0.3)"
                  }`
                }}
              >
                {formData.status || "Active"}
              </div>
            </div>
            <hr />

            <label>
              Description
              <textarea
                className="inputa"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                disabled={isViewMode}
                placeholder="Enter role description"
                rows={3}
                style={{ width: "100%", resize: "vertical" }}
              />
            </label>
            
          </div>
        </div>

        <div className="form__section">
          <h2 className="form__section-title">Permissions</h2>
          <p className="form__section-description">
            Select the permissions for each module in the system.
          </p>

          <div className="permissions-table">
            <table className="table">
              <thead>
                <tr>
                  <th>Module Name</th>
                  <th>CanAdd</th>
                  <th>CanView</th>
                  <th>CanEdit</th>
                  <th>CanDelete</th>
                  <th>CanApprove</th>
                </tr>
              </thead>
              <tbody>
                {systemModules.map(module => {
                  const modulePermissions = formData.permissions[module.key] || {
                    canAdd: false,
                    canView: false,
                    canEdit: false,
                    canDelete: false,
                    canApprove: false
                  };
                  

                  return (
                    <tr key={module.key}>
                      <td>{module.name}</td>
                      <td>
                        <input
                          type="checkbox"
                          checked={modulePermissions.canAdd}
                          onChange={(e) => handlePermissionChange(module.key, "canAdd", e.target.checked)}
                          disabled={isViewMode}
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={modulePermissions.canView}
                          onChange={(e) => handlePermissionChange(module.key, "canView", e.target.checked)}
                          disabled={isViewMode}
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={modulePermissions.canEdit}
                          onChange={(e) => handlePermissionChange(module.key, "canEdit", e.target.checked)}
                          disabled={isViewMode}
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={modulePermissions.canDelete}
                          onChange={(e) => handlePermissionChange(module.key, "canDelete", e.target.checked)}
                          disabled={isViewMode}
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={modulePermissions.canApprove}
                          onChange={(e) => handlePermissionChange(module.key, "canApprove", e.target.checked)}
                          disabled={isViewMode}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {!isViewMode && (
          <div className="form__actions">
            <button
              type="submit"
              className="pill"
              disabled={loading}
              style={{
                backgroundColor: "var(--primary-500)",
                color: "white",
                border: "none",
                padding: "12px 24px",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1
              }}
            >
              <FiSave />
              {loading ? "Saving..." : (isEdit ? "Update Role" : "Create Role")}
            </button>
          </div>
        )}
      </form>
    </DashboardWrapper>
  );
}

export default RoleForm;
