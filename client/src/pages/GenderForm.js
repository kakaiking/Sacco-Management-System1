import React, { useContext, useEffect, useState } from "react";
import { useHistory, useParams, useLocation } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import axios from "axios";
import { useSnackbar } from "../helpers/SnackbarContext";
import { AuthContext } from "../helpers/AuthContext";
import DashboardWrapper from '../components/DashboardWrapper';
import frontendLoggingService from "../services/frontendLoggingService";

function GenderForm() {
  const history = useHistory();
  const { authState, isLoading } = useContext(AuthContext);
  const { id } = useParams();
  const { search } = useLocation();
  const { showMessage } = useSnackbar();
  const isEdit = new URLSearchParams(search).get("edit") === "1";
  const isCreate = id === "new";

  const [form, setForm] = useState({
    genderId: "",
    genderName: "",
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

  // Generate Gender ID for new genders
  const generateGenderId = () => {
    const randomNum = Math.floor(1000000 + Math.random() * 9000000); // 7 digits
    return `G-${randomNum}`;
  };

  useEffect(() => {
    const load = async () => {
      if (isCreate) {
        // For new gender, generate ID and set defaults
        setForm(prev => ({
          ...prev,
          genderId: generateGenderId(),
          createdBy: authState.username || "",
          createdOn: new Date().toISOString().split('T')[0]
        }));
      } else {
        // Load existing gender
        try {
          setLoading(true);
          const response = await axios.get(`http://localhost:3001/gender/${id}`, {
            headers: { accessToken: localStorage.getItem("accessToken") }
          });

          if (response.data.code === 200) {
            const gender = response.data.entity;
            // Store original data for logging purposes
            setOriginalData(gender);
            setForm({
              genderId: gender.genderId || "",
              genderName: gender.genderName || "",
              description: gender.description || "",
              status: gender.status || "Active",
              createdBy: gender.createdBy || "",
              createdOn: gender.createdOn ? new Date(gender.createdOn).toISOString().split('T')[0] : "",
              modifiedBy: gender.modifiedBy || "",
              modifiedOn: gender.modifiedOn ? new Date(gender.modifiedOn).toISOString().split('T')[0] : "",
              approvedBy: gender.approvedBy || "",
              approvedOn: gender.approvedOn ? new Date(gender.approvedOn).toISOString().split('T')[0] : "",
            });
          } else {
            showMessage("Gender not found", "error");
            history.push("/gender-maintenance");
          }
        } catch (error) {
          console.error("Error loading gender:", error);
          showMessage("Error loading gender", "error");
          history.push("/gender-maintenance");
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
    
    if (!form.genderName.trim()) {
      showMessage("Gender name is required", "error");
      return;
    }

    try {
      setSaving(true);
      
      if (isCreate) {
        // Create new gender
        const response = await axios.post('http://localhost:3001/gender', {
          genderName: form.genderName,
          description: form.description,
        }, {
          headers: { accessToken: localStorage.getItem("accessToken") }
        });

        if (response.data.code === 201) {
          showMessage("Gender created successfully", "success");
          frontendLoggingService.logCreate("Gender", response.data.entity.id, form.genderName, response.data.entity, `Created gender: ${form.genderName}`);
          history.push("/gender-maintenance");
        }
      } else {
        // Update existing gender
        const response = await axios.put(`http://localhost:3001/gender/${id}`, {
          genderName: form.genderName,
          description: form.description,
          status: form.status,
        }, {
          headers: { accessToken: localStorage.getItem("accessToken") }
        });

        if (response.data.code === 200) {
          showMessage("Gender updated successfully", "success");
          frontendLoggingService.logUpdate("Gender", id, form.genderName, originalData, response.data.entity, `Updated gender: ${form.genderName}`);
          history.push("/gender-maintenance");
        }
      }
    } catch (error) {
      console.error("Error saving gender:", error);
      if (error.response?.data?.message) {
        showMessage(error.response.data.message, "error");
      } else if (error.response?.data?.error) {
        showMessage(error.response.data.error, "error");
      } else {
        showMessage("Error saving gender", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardWrapper>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
          Loading...
        </div>
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper>
      <header className="header">
        <div className="header__left">
          <button 
            className="iconBtn" 
            onClick={() => history.push("/gender-maintenance")} 
            title="Back" 
            aria-label="Back" 
            style={{ marginRight: 8 }}
          >
            <FiArrowLeft className="icon" style={{ fontWeight: "bolder" }}/>
          </button>
          <div className="greeting">
            {isCreate ? "Add Gender" : (isEdit ? "Update Gender Details" : "View Gender Details")}
          </div>
        </div>
      </header>

      <main className="dashboard__content">
        <form className="card" onSubmit={save} style={{ display: "grid", gap: 12, padding: 16 }}>
          {/* Gender ID and Gender Name at the top */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "1fr auto", 
            gap: "20px",
            marginBottom: "12px",
            alignItems: "start"
          }}>
            <div style={{ display: "grid", gap: "12px" }}>
              <label>
                Gender ID
                <input 
                  className="inputf"
                  value={form.genderId}
                  disabled={true}
                />
              </label>
              <label>
                Gender Name
                <input 
                  className="inputf"
                  value={form.genderName}
                  onChange={e => setForm({ ...form, genderName: e.target.value })}
                  disabled={!isCreate && !isEdit}
                  placeholder="Enter gender name"
                  required
                />
              </label>
            </div>
            
            {/* Status Badge */}
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "12px",
              marginTop: "8px"
            }}>
              <span className={`status-badge ${form.status === 'Active' ? 'status-badge--active' : 'status-badge--inactive'}`}>
                {form.status}
              </span>
            </div>
          </div>

          {/* Description */}
          <label>
            Description
            <textarea 
              className="inputf"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              disabled={!isCreate && !isEdit}
              placeholder="Enter gender description (optional)"
              rows={3}
            />
          </label>

          {/* Status (only for edit mode) */}
          {!isCreate && isEdit && (
            <label>
              Status
              <select 
                className="inputf"
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Pending">Pending</option>
              </select>
            </label>
          )}

          {/* Audit Fields */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "1fr 1fr", 
            gap: "12px",
            marginTop: "20px",
            paddingTop: "20px",
            borderTop: "1px solid #e0e0e0"
          }}>
            <label>
              Created By
              <input 
                className="inputf"
                value={form.createdBy || ""}
                disabled={true}
              />
            </label>
            
            <label>
              Created On
              <input 
                className="inputf"
                value={form.createdOn || ""}
                disabled={true}
              />
            </label>
            
            <label>
              Modified By
              <input 
                className="inputf"
                value={form.modifiedBy || ""}
                disabled={true}
              />
            </label>
            
            <label>
              Modified On
              <input 
                className="inputf"
                value={form.modifiedOn || ""}
                disabled={true}
              />
            </label>
            
            <label>
              Approved By
              <input 
                className="inputf"
                value={form.approvedBy || ""}
                disabled={true}
              />
            </label>
            
            <label>
              Approved On
              <input 
                className="inputf"
                value={form.approvedOn || ""}
                disabled={true}
              />
            </label>
          </div>

          {/* Action Buttons */}
          {(isCreate || isEdit) && (
            <div style={{ 
              display: "flex", 
              gap: "12px", 
              marginTop: "20px",
              paddingTop: "20px",
              borderTop: "1px solid #e0e0e0"
            }}>
              <button 
                type="submit" 
                className="btn btn--primary"
                disabled={saving}
              >
                {saving ? "Saving..." : (isCreate ? "Create Gender" : "Update Gender")}
              </button>
              <button 
                type="button" 
                className="btn btn--secondary"
                onClick={() => history.push("/gender-maintenance")}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          )}
        </form>
      </main>
    </DashboardWrapper>
  );
}

export default GenderForm;
