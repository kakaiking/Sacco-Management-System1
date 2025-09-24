import React, { useContext, useEffect, useState } from "react";
import { useHistory, useParams, useLocation } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import axios from "axios";
import { useSnackbar } from "../helpers/SnackbarContext";
import { AuthContext } from "../helpers/AuthContext";
import DashboardWrapper from '../components/DashboardWrapper';
import frontendLoggingService from "../services/frontendLoggingService";

function LoanProductForm() {
  const history = useHistory();
  const { authState, isLoading } = useContext(AuthContext);
  const { id } = useParams();
  const { search } = useLocation();
  const { showMessage } = useSnackbar();
  const isEdit = new URLSearchParams(search).get("edit") === "1";
  const isCreate = id === "new";

  const [form, setForm] = useState({
    loanProductId: "",
    loanProductName: "",
    description: "",
    needGuarantors: false,
    maxGuarantors: "",
    minGuarantors: "",
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

  // Generate Loan Product ID for new products
  const generateLoanProductId = () => {
    const randomNum = Math.floor(1000000 + Math.random() * 9000000); // 7 digits
    return `LP-${randomNum}`;
  };

  useEffect(() => {
    const load = async () => {
      if (isCreate) {
        // For new loan product, generate ID and set defaults
        setForm(prev => ({
          ...prev,
          loanProductId: generateLoanProductId(),
          createdBy: authState.username || "",
          createdOn: new Date().toISOString().split('T')[0]
        }));
      } else {
        // Load existing loan product
        try {
          setLoading(true);
          const response = await axios.get(`http://localhost:3001/loan-products/${id}`, {
            headers: { accessToken: localStorage.getItem("accessToken") }
          });

          if (response.data.code === 200) {
            const loanProduct = response.data.entity;
            // Store original data for logging purposes
            setOriginalData(loanProduct);
            setForm({
              loanProductId: loanProduct.loanProductId || "",
              loanProductName: loanProduct.loanProductName || "",
              description: loanProduct.description || "",
              needGuarantors: loanProduct.needGuarantors || false,
              maxGuarantors: loanProduct.maxGuarantors || "",
              minGuarantors: loanProduct.minGuarantors || "",
              status: loanProduct.status || "Active",
              createdBy: loanProduct.createdBy || "",
              createdOn: loanProduct.createdOn ? new Date(loanProduct.createdOn).toISOString().split('T')[0] : "",
              modifiedBy: loanProduct.modifiedBy || "",
              modifiedOn: loanProduct.modifiedOn ? new Date(loanProduct.modifiedOn).toISOString().split('T')[0] : "",
              approvedBy: loanProduct.approvedBy || "",
              approvedOn: loanProduct.approvedOn ? new Date(loanProduct.approvedOn).toISOString().split('T')[0] : "",
            });
          } else {
            showMessage("Loan product not found", "error");
            history.push("/loan-products-maintenance");
          }
        } catch (error) {
          console.error("Error loading loan product:", error);
          showMessage("Error loading loan product", "error");
          history.push("/loan-products-maintenance");
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
    
    if (!form.loanProductName.trim()) {
      showMessage("Loan product name is required", "error");
      return;
    }

    try {
      setSaving(true);
      
      if (isCreate) {
        // Create new loan product
        const response = await axios.post('http://localhost:3001/loan-products', {
          loanProductName: form.loanProductName,
          description: form.description,
        }, {
          headers: { accessToken: localStorage.getItem("accessToken") }
        });

        if (response.data.code === 201) {
          showMessage("Loan product created successfully", "success");
          frontendLoggingService.logCreate("LoanProduct", response.data.entity.id, form.loanProductName, response.data.entity, `Created loan product: ${form.loanProductName}`);
          history.push("/loan-products-maintenance");
        }
      } else {
        // Update existing loan product
        const response = await axios.put(`http://localhost:3001/loan-products/${id}`, {
          loanProductName: form.loanProductName,
          description: form.description,
        }, {
          headers: { accessToken: localStorage.getItem("accessToken") }
        });

        if (response.data.code === 200) {
          showMessage("Loan product updated successfully", "success");
          frontendLoggingService.logUpdate("LoanProduct", id, form.loanProductName, originalData, response.data.entity, `Updated loan product: ${form.loanProductName}`);
          history.push("/loan-products-maintenance");
        }
      }
    } catch (error) {
      console.error("Error saving loan product:", error);
      if (error.response?.data?.message) {
        showMessage(error.response.data.message, "error");
      } else if (error.response?.data?.error) {
        showMessage(error.response.data.error, "error");
      } else {
        showMessage("Error saving loan product", "error");
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
            onClick={() => history.push("/loan-products-maintenance")}
            style={{ marginRight: "16px" }}
          >
            <FiArrowLeft style={{ marginRight: "8px" }} />
            Back
          </button>
          <div className="greeting">
            {isCreate ? "Add New Loan Product" : isEdit ? "Edit Loan Product" : "View Loan Product"}
          </div>
        </div>
      </header>

      <main className="dashboard__content">
        <section className="card" style={{ padding: "24px" }}>
          <form onSubmit={save}>
            {/* Loan Product ID and Status - Non-changeable and automatic */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: "20px",
              marginBottom: "12px",
              alignItems: "start"
            }}>
              <div style={{ display: "grid", gap: "12px" }}>
                <label>
                  Loan Product Id
                  <input className="inputa"
                    value={form.loanProductId}
                    onChange={e => setForm({ ...form, loanProductId: e.target.value })}
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
                  Loan Product Name *
                  <input
                    className="input"
                    value={form.loanProductName}
                    onChange={e => setForm({ ...form, loanProductName: e.target.value })}
                    disabled={!isCreate && !isEdit}
                    required
                    placeholder="e.g., Personal Loan, Business Loan, Emergency Loan"
                  />
                </label>

                <label>
                  Max Guarantors
                  <input
                    type="number"
                    className="input"
                    value={form.maxGuarantors}
                    onChange={e => setForm({ ...form, maxGuarantors: e.target.value })}
                    disabled={!isCreate && !isEdit}
                    placeholder="e.g., 3"
                  />
                </label>

                <label>
                  Min Guarantors
                  <input
                    type="number"
                    className="input"
                    value={form.minGuarantors}
                    onChange={e => setForm({ ...form, minGuarantors: e.target.value })}
                    disabled={!isCreate && !isEdit}
                    placeholder="e.g., 1"
                  />
                </label>

                <label>
                  Description
                  <textarea
                    className="input"
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    disabled={!isCreate && !isEdit}
                    placeholder="Additional notes about this loan product..."
                    rows="3"
                  />
                </label>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <input
                    type="checkbox"
                    id="needGuarantors"
                    checked={form.needGuarantors}
                    onChange={e => setForm({ ...form, needGuarantors: e.target.checked })}
                    disabled={!isCreate && !isEdit}
                  />
                  <label htmlFor="needGuarantors" style={{ margin: 0, cursor: "pointer" }}>
                    Need Guarantors
                  </label>
                </div>
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
                    {saving ? "Saving..." : (isCreate ? "Add Loan Product" : "Update Loan Product")}
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

export default LoanProductForm;