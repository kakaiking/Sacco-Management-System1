import React, { useContext, useEffect, useState } from "react";
import { useHistory, useParams, useLocation } from "react-router-dom";
import { FiArrowLeft, FiSearch } from "react-icons/fi";
import axios from "axios";
import { useSnackbar } from "../helpers/SnackbarContext";
import { AuthContext } from "../helpers/AuthContext";
import DashboardWrapper from '../components/DashboardWrapper';
import SaccoLookupModal from '../components/SaccoLookupModal';
import GLAccountsLookupModal from '../components/GLAccountsLookupModal';
import frontendLoggingService from "../services/frontendLoggingService";

function TillForm() {
  const history = useHistory();
  const { authState, isLoading } = useContext(AuthContext);
  const { id } = useParams();
  const { search } = useLocation();
  const { showMessage } = useSnackbar();
  const isEdit = new URLSearchParams(search).get("edit") === "1";
  const isCreate = id === "new";

  const [form, setForm] = useState({
    tillId: "",
    tillName: "",
    cashierId: "",
    cashierDisplay: "",
    glAccountId: "",
    glAccountDisplay: "",
    maximumAmountCapacity: "",
    minimumAmountCapacity: "",
    saccoId: "",
    saccoDisplay: "",
    status: "Active",
    remarks: "",
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

  // Lookup modal states
  const [isSaccoModalOpen, setIsSaccoModalOpen] = useState(false);
  const [isCashierModalOpen, setIsCashierModalOpen] = useState(false);
  const [isGLAccountModalOpen, setIsGLAccountModalOpen] = useState(false);
  
  // Cashiers list
  const [cashiers, setCashiers] = useState([]);
  const [cashiersLoading, setCashiersLoading] = useState(false);

  useEffect(() => {
    // Only redirect if authentication check is complete and user is not authenticated
    if (!isLoading && !authState.status) {
      history.push("/login");
    }
  }, [authState, isLoading, history]);

  // Fetch cashiers
  const fetchCashiers = async () => {
    setCashiersLoading(true);
    try {
      const res = await axios.get("http://localhost:3001/tills/cashiers/list", {
        headers: { accessToken: localStorage.getItem("accessToken") },
      });
      const data = res.data?.entity || res.data;
      setCashiers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching cashiers:", err);
      setCashiers([]);
    } finally {
      setCashiersLoading(false);
    }
  };

  useEffect(() => {
    fetchCashiers();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (isCreate) {
        // For new till, set defaults
        setForm(prev => ({
          ...prev,
          createdBy: authState.username || "",
          createdOn: new Date().toISOString().split('T')[0]
        }));
      } else {
        // Load existing till
        try {
          setLoading(true);
          const response = await axios.get(`http://localhost:3001/tills/${id}`, {
            headers: { accessToken: localStorage.getItem("accessToken") }
          });

          if (response.data.code === 200) {
            const till = response.data.entity;
            // Store original data for logging purposes
            setOriginalData(till);
            setForm({
              tillId: till.tillId || "",
              tillName: till.tillName || "",
              cashierId: till.cashierId || "",
              cashierDisplay: till.cashier ? `${till.cashier.firstName} ${till.cashier.lastName}` : "",
              glAccountId: till.glAccountId || "",
              glAccountDisplay: till.glAccount ? `${till.glAccount.accountName}` : "",
              maximumAmountCapacity: till.maximumAmountCapacity || "",
              minimumAmountCapacity: till.minimumAmountCapacity || "",
              saccoId: till.saccoId || "",
              saccoDisplay: till.sacco ? till.sacco.saccoName : "",
              status: till.status || "Active",
              remarks: till.remarks || "",
              createdBy: till.createdBy || "",
              createdOn: till.createdOn ? new Date(till.createdOn).toISOString().split('T')[0] : "",
              modifiedBy: till.modifiedBy || "",
              modifiedOn: till.modifiedOn ? new Date(till.modifiedOn).toISOString().split('T')[0] : "",
              approvedBy: till.approvedBy || "",
              approvedOn: till.approvedOn ? new Date(till.approvedOn).toISOString().split('T')[0] : "",
            });
          } else {
            showMessage("Till not found", "error");
            history.push("/till-maintenance");
          }
        } catch (error) {
          console.error("Error loading till:", error);
          showMessage("Error loading till", "error");
          history.push("/till-maintenance");
        } finally {
          setLoading(false);
        }
      }
    };

    if (authState.status) {
      load();
    }
  }, [authState.status, id, isCreate, authState.username, history, showMessage]);

  // Sacco lookup modal handlers
  const handleOpenSaccoModal = () => {
    setIsSaccoModalOpen(true);
  };

  const handleCloseSaccoModal = () => {
    setIsSaccoModalOpen(false);
  };

  const handleSelectSacco = (selectedSacco) => {
    setForm(prev => ({ 
      ...prev, 
      saccoId: selectedSacco.saccoId,
      saccoDisplay: selectedSacco.saccoName
    }));
    setIsSaccoModalOpen(false);
  };

  // Cashier lookup modal handlers
  const handleOpenCashierModal = () => {
    setIsCashierModalOpen(true);
  };

  const handleCloseCashierModal = () => {
    setIsCashierModalOpen(false);
  };

  const handleSelectCashier = (selectedCashier) => {
    setForm(prev => ({ 
      ...prev, 
      cashierId: selectedCashier.userId,
      cashierDisplay: `${selectedCashier.firstName} ${selectedCashier.lastName}`
    }));
    setIsCashierModalOpen(false);
  };

  // GL Account lookup modal handlers
  const handleOpenGLAccountModal = () => {
    setIsGLAccountModalOpen(true);
  };

  const handleCloseGLAccountModal = () => {
    setIsGLAccountModalOpen(false);
  };

  const handleSelectGLAccount = (selectedGLAccount) => {
    setForm(prev => ({ 
      ...prev, 
      glAccountId: selectedGLAccount.glAccountId,
      glAccountDisplay: `${selectedGLAccount.accountName}`
    }));
    setIsGLAccountModalOpen(false);
  };

  const save = async (e) => {
    e.preventDefault();
    
    if (!form.tillName.trim()) {
      showMessage("Till name is required", "error");
      return;
    }

    if (!form.saccoId) {
      showMessage("Sacco is required", "error");
      return;
    }

    try {
      setSaving(true);
      
      if (isCreate) {
        // Create new till
        const response = await axios.post('http://localhost:3001/tills', {
          tillName: form.tillName,
          cashierId: form.cashierId || null,
          glAccountId: form.glAccountId || null,
          maximumAmountCapacity: form.maximumAmountCapacity ? parseFloat(form.maximumAmountCapacity) : null,
          minimumAmountCapacity: form.minimumAmountCapacity ? parseFloat(form.minimumAmountCapacity) : null,
          saccoId: form.saccoId,
          status: form.status,
          remarks: form.remarks || null
        }, {
          headers: { accessToken: localStorage.getItem("accessToken") }
        });

        if (response.data.code === 201) {
          showMessage("Till created successfully", "success");
          frontendLoggingService.logCreate("Till", response.data.entity.id, form.tillName, response.data.entity, `Created till: ${form.tillName}`);
          history.push("/till-maintenance");
        }
      } else {
        // Update existing till
        const response = await axios.put(`http://localhost:3001/tills/${id}`, {
          tillName: form.tillName,
          cashierId: form.cashierId || null,
          glAccountId: form.glAccountId || null,
          maximumAmountCapacity: form.maximumAmountCapacity ? parseFloat(form.maximumAmountCapacity) : null,
          minimumAmountCapacity: form.minimumAmountCapacity ? parseFloat(form.minimumAmountCapacity) : null,
          saccoId: form.saccoId,
          status: form.status,
          remarks: form.remarks || null
        }, {
          headers: { accessToken: localStorage.getItem("accessToken") }
        });

        if (response.data.code === 200) {
          showMessage("Till updated successfully", "success");
          frontendLoggingService.logUpdate("Till", id, form.tillName, originalData, response.data.entity, `Updated till: ${form.tillName}`);
          history.push("/till-maintenance");
        }
      }
    } catch (error) {
      console.error("Error saving till:", error);
      if (error.response?.data?.message) {
        showMessage(error.response.data.message, "error");
      } else if (error.response?.data?.error) {
        showMessage(error.response.data.error, "error");
      } else {
        showMessage("Error saving till", "error");
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
            onClick={() => history.push("/till-maintenance")}
            style={{ marginRight: "16px" }}
          >
            <FiArrowLeft style={{ marginRight: "8px" }} />
            Back
          </button>
          <div className="greeting">
            {isCreate ? "Add New Till" : isEdit ? "Edit Till" : "View Till"}
          </div>
        </div>
      </header>

      <main className="dashboard__content">
        <section className="card" style={{ padding: "24px" }}>
          <form onSubmit={save}>
            {/* Till ID and Status - Non-changeable and automatic */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: "20px",
              marginBottom: "12px",
              alignItems: "start"
            }}>
              <div style={{ display: "grid", gap: "12px" }}>
                <label>
                  Till Id
                  <input className="inputa"
                    value={form.tillId}
                    onChange={e => setForm({ ...form, tillId: e.target.value })}
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
                  Till Name *
                  <input
                    className="input"
                    value={form.tillName}
                    onChange={e => setForm({ ...form, tillName: e.target.value })}
                    disabled={!isCreate && !isEdit}
                    required
                    placeholder="e.g., Main Till, Branch Till, Mobile Till"
                  />
                </label>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  <label>
                    Sacco *
                    <div className="lookup-input">
                      <input
                        type="text"
                        className="input"
                        value={form.saccoDisplay}
                        readOnly
                        placeholder="Select sacco"
                        required
                        disabled={!isCreate && !isEdit}
                      />
                      <button
                        type="button"
                        className="lookup-btn"
                        onClick={handleOpenSaccoModal}
                        disabled={!isCreate && !isEdit}
                      >
                        <FiSearch className="icon" />
                      </button>
                    </div>
                  </label>

                  <label>
                    Cashier
                    <div className="lookup-input">
                      <input
                        type="text"
                        className="input"
                        value={form.cashierDisplay}
                        readOnly
                        placeholder="Select cashier"
                        disabled={!isCreate && !isEdit}
                      />
                      <button
                        type="button"
                        className="lookup-btn"
                        onClick={handleOpenCashierModal}
                        disabled={!isCreate && !isEdit}
                      >
                        <FiSearch className="icon" />
                      </button>
                    </div>
                  </label>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  <label>
                    GL Account
                    <div className="lookup-input">
                      <input
                        type="text"
                        className="input"
                        value={form.glAccountDisplay}
                        readOnly
                        placeholder="Select GL account"
                        disabled={!isCreate && !isEdit}
                      />
                      <button
                        type="button"
                        className="lookup-btn"
                        onClick={handleOpenGLAccountModal}
                        disabled={!isCreate && !isEdit}
                      >
                        <FiSearch className="icon" />
                      </button>
                    </div>
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

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  <label>
                    Maximum Amount Capacity
                    <input
                      type="number"
                      className="input"
                      value={form.maximumAmountCapacity}
                      onChange={e => setForm({ ...form, maximumAmountCapacity: e.target.value })}
                      disabled={!isCreate && !isEdit}
                      placeholder="Enter maximum amount capacity"
                      min="0"
                      step="0.01"
                    />
                  </label>

                  <label>
                    Minimum Amount Capacity
                    <input
                      type="number"
                      className="input"
                      value={form.minimumAmountCapacity}
                      onChange={e => setForm({ ...form, minimumAmountCapacity: e.target.value })}
                      disabled={!isCreate && !isEdit}
                      placeholder="Enter minimum amount capacity"
                      min="0"
                      step="0.01"
                    />
                  </label>
                </div>

                <label>
                  Remarks
                  <textarea
                    className="input"
                    value={form.remarks}
                    onChange={e => setForm({ ...form, remarks: e.target.value })}
                    disabled={!isCreate && !isEdit}
                    placeholder="Additional notes about this till..."
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
                    {saving ? "Saving..." : (isCreate ? "Add Till" : "Update Till")}
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

      {/* Lookup Modals */}
      <SaccoLookupModal
        isOpen={isSaccoModalOpen}
        onClose={handleCloseSaccoModal}
        onSelectSacco={handleSelectSacco}
      />

      {/* Cashier Lookup Modal */}
      {isCashierModalOpen && (
        <div className="modal-overlay" onClick={handleCloseCashierModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3>Select Cashier</h3>
              <button className="modal__close" onClick={handleCloseCashierModal}>
                ×
              </button>
            </div>
            <div className="modal__content">
              {cashiersLoading ? (
                <div>Loading cashiers...</div>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cashiers.map((cashier) => (
                        <tr key={cashier.userId}>
                          <td>{cashier.firstName} {cashier.lastName}</td>
                          <td>{cashier.username}</td>
                          <td>{cashier.email}</td>
                          <td>
                            <button
                              className="btn btn--primary btn--sm"
                              onClick={() => handleSelectCashier(cashier)}
                            >
                              Select
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <GLAccountsLookupModal
        isOpen={isGLAccountModalOpen}
        onClose={handleCloseGLAccountModal}
        onSelectGLAccount={handleSelectGLAccount}
      />
    </DashboardWrapper>
  );
}

export default TillForm;
