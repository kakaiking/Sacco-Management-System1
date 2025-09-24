import React, { useContext, useEffect, useState } from "react";
import { useHistory, useParams, useLocation } from "react-router-dom";
import { FiArrowLeft, FiSearch } from "react-icons/fi";
import axios from "axios";
import { useSnackbar } from "../helpers/SnackbarContext";
import { AuthContext } from "../helpers/AuthContext";
import DashboardWrapper from '../components/DashboardWrapper';
import SaccoLookupModal from '../components/SaccoLookupModal';

function ProductForm() {
  const history = useHistory();
  const { authState, isLoading } = useContext(AuthContext);
  const { id } = useParams();
  const { search } = useLocation();
  const { showMessage } = useSnackbar();
  const isEdit = new URLSearchParams(search).get("edit") === "1";
  const isCreate = id === "new";

  const [form, setForm] = useState({
    productId: "",
    productName: "",
    saccoId: "",
    productType: "BOSA",
    productStatus: "Pending",
    status: "Pending",
    description: "",
    isSpecial: false,
    maxSpecialUsers: "",
    createdBy: "",
    createdOn: "",
    modifiedBy: "",
    modifiedOn: "",
    approvedBy: "",
    approvedOn: "",
  });

  // Sacco lookup modal state
  const [isSaccoModalOpen, setIsSaccoModalOpen] = useState(false);

  useEffect(() => {
    // Only redirect if authentication check is complete and user is not authenticated
    if (!isLoading && !authState.status) {
      history.push("/login");
    }
  }, [authState, isLoading, history]);

  // Generate product ID for new products
  const generateProductId = () => {
    const randomNum = Math.floor(100000 + Math.random() * 900000); // 6 digits
    return `P-${randomNum}`;
  };

  useEffect(() => {
    const load = async () => {
      if (!isCreate) {
        const res = await axios.get(`http://localhost:3001/products/${id}`, {
          headers: { accessToken: localStorage.getItem("accessToken") },
        });
        const data = res.data?.entity || res.data;
        setForm({
          productId: data.productId || "",
          productName: data.productName || "",
          saccoId: data.saccoId || "",
          productType: data.productType || "BOSA",
          productStatus: data.productStatus || "Pending",
          status: data.status || "Pending",
          description: data.description || "",
          isSpecial: data.isSpecial || false,
          maxSpecialUsers: data.maxSpecialUsers || "",
          createdBy: data.createdBy || "",
          createdOn: data.createdOn || "",
          modifiedBy: data.modifiedBy || "",
          modifiedOn: data.modifiedOn || "",
          approvedBy: data.approvedBy || "",
          approvedOn: data.approvedOn || "",
        });
      } else {
        // Generate product ID for new products
        setForm(prev => ({ ...prev, productId: generateProductId() }));
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
        modifiedBy: localStorage.getItem("username") || "System",
        modifiedOn: new Date().toISOString(),
      };

      if (isCreate) {
        payload.createdBy = localStorage.getItem("username") || "System";
        payload.createdOn = new Date().toISOString();
        await axios.post("http://localhost:3001/products", payload, {
          headers: { accessToken: localStorage.getItem("accessToken") },
        });
        showMessage("Product created successfully", "success");
        history.push("/product-maintenance");
      } else {
        await axios.put(`http://localhost:3001/products/${id}`, payload, {
          headers: { accessToken: localStorage.getItem("accessToken") },
        });
        showMessage("Product updated successfully", "success");
        history.push("/product-maintenance");
      }
    } catch (err) {
      const apiMsg = err?.response?.data?.message || err?.response?.data?.error;
      const msg = apiMsg || "Failed to save product";
      showMessage(msg, "error");
    }
  };

  // Sacco lookup modal handlers
  const handleOpenSaccoModal = () => {
    setIsSaccoModalOpen(true);
  };

  const handleCloseSaccoModal = () => {
    setIsSaccoModalOpen(false);
  };

  const handleSelectSacco = (selectedSacco) => {
    setForm(prev => ({ ...prev, saccoId: selectedSacco.saccoId }));
    setIsSaccoModalOpen(false);
  };

  return (
    <DashboardWrapper>
      <header className="header">
        <div className="header__left">
          <button className="iconBtn"
            onClick={() => history.push("/product-maintenance")}
            style={{
              marginRight: "8px"
            }}
          >
            <FiArrowLeft />
          </button>
          <div className="greeting">{isCreate ? "Add Product" : (isEdit ? "Update Product Details" : "View Product Details")}</div>
        </div>
      </header>

      <main className="dashboard__content">
        <section className="card" style={{ padding: "24px" }}>
          <form onSubmit={handleSubmit}>
            {/* Product ID, Name, and Status - Non-changeable and automatic */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: "20px",
              marginBottom: "12px",
              alignItems: "start"
            }}>
              <div style={{ display: "grid", gap: "12px" }}>
                <label>
                  Product Id
                  <input className="inputa"
                    value={form.productId}
                    onChange={e => setForm({ ...form, productId: e.target.value })}
                    required
                    disabled={true}
                  />
                </label>
                <label>
                  Product Name
                  <input
                    className="inputa"
                    value={form.productName}
                    onChange={e => setForm({ ...form, productName: e.target.value })}
                    disabled={!isCreate && !isEdit}
                    placeholder="Enter product name"
                    required
                  />
                </label>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "flex-end" }}>
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
                      form.status === "Approved" ? "rgba(16, 185, 129, 0.2)" :
                      form.status === "Pending" ? "rgba(6, 182, 212, 0.2)" :
                      form.status === "Returned" ? "rgba(249, 115, 22, 0.2)" :
                      form.status === "Rejected" ? "rgba(239, 68, 68, 0.2)" :
                      "rgba(107, 114, 128, 0.2)",
                    color: 
                      form.status === "Approved" ? "#059669" :
                      form.status === "Pending" ? "#0891b2" :
                      form.status === "Returned" ? "#ea580c" :
                      form.status === "Rejected" ? "#dc2626" :
                      "#6b7280",
                    border: `1px solid ${form.status === "Approved" ? "rgba(16, 185, 129, 0.3)" :
                      form.status === "Pending" ? "rgba(6, 182, 212, 0.3)" :
                      form.status === "Returned" ? "rgba(249, 115, 22, 0.3)" :
                      form.status === "Rejected" ? "rgba(239, 68, 68, 0.3)" :
                      "rgba(107, 114, 128, 0.3)"
                    }`
                  }}
                >
                  {form.status || "Pending"}
                </div>
              </div>
            </div>

            <div className="grid2">
              <label>
                Sacco ID
                <div className="role-input-wrapper">
                  <input
                    type="text"
                    className="input"
                    value={form.saccoId}
                    onChange={e => setForm({ ...form, saccoId: e.target.value })}
                    disabled={!isCreate && !isEdit}
                    placeholder="Select a sacco"
                    readOnly={true}
                  />
                  {(isCreate || isEdit) && (
                    <button
                      type="button"
                      className="role-search-btn"
                      onClick={handleOpenSaccoModal}
                      title="Search saccos"
                    >
                      <FiSearch />
                    </button>
                  )}
                </div>
              </label>

              <label>
                Product Type
                <select
                  className="input"
                  value={form.productType}
                  onChange={e => setForm({ ...form, productType: e.target.value })}
                  disabled={!isCreate && !isEdit}
                >
                  <option value="BOSA">BOSA</option>
                  <option value="FOSA">FOSA</option>
                </select>
              </label>

              <label>
                Product Status
                <select
                  className="input"
                  value={form.productStatus}
                  onChange={e => setForm({ ...form, productStatus: e.target.value })}
                  disabled={!isCreate && !isEdit}
                >
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </label>

              <label>
                Max Special Users
                <input
                  type="number"
                  className="input"
                  value={form.maxSpecialUsers}
                  onChange={e => setForm({ ...form, maxSpecialUsers: e.target.value })}
                  disabled={!isCreate && !isEdit}
                  placeholder="e.g., 10"
                />
              </label>

              <label>
                Description
                <textarea
                  className="input"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  disabled={!isCreate && !isEdit}
                  placeholder="Enter product description"
                  rows={3}
                />
              </label>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <input
                  type="checkbox"
                  id="isSpecial"
                  checked={form.isSpecial}
                  onChange={e => setForm({ ...form, isSpecial: e.target.checked })}
                  disabled={!isCreate && !isEdit}
                />
                <label htmlFor="isSpecial" style={{ margin: 0, cursor: "pointer" }}>
                  Is Special
                </label>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
              <button
                type="button"
                className="pill"
                onClick={() => history.push("/product-maintenance")}
                style={{
                  padding: "8px 16px",
                  fontSize: "14px"
                }}
              >
                Cancel
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
                  {isCreate ? "Add Product" : "Update Product"}
                </button>
              )}
            </div>
          </form>

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
              Created By
              <input className="inputf"
                value={form.createdBy || ""}
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
              Modified By
              <input className="inputf"
                value={form.modifiedBy || ""}
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
              Approved By
              <input className="inputf"
                value={form.approvedBy || ""}
                disabled={true}
              />
            </label>
          </div>
        </section>
      </main>

      {/* Sacco Lookup Modal */}
      <SaccoLookupModal
        isOpen={isSaccoModalOpen}
        onClose={handleCloseSaccoModal}
        onSelectSacco={handleSelectSacco}
        selectedSaccoId={form.saccoId}
      />
    </DashboardWrapper>
  );
}

export default ProductForm;