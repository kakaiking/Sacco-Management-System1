import React, { useContext, useEffect, useState } from "react";
import { useHistory, useParams, useLocation } from "react-router-dom";
import { FiArrowLeft, FiSearch } from "react-icons/fi";
import axios from "axios";
import { useSnackbar } from "../helpers/SnackbarContext";
import { AuthContext } from "../helpers/AuthContext";
import DashboardWrapper from '../components/DashboardWrapper';
import MemberLookupModal from '../components/MemberLookupModal';
import AccountTypeLookupModal from '../components/AccountTypeLookupModal';

function AccountForm() {
  const history = useHistory();
  const { authState, isLoading } = useContext(AuthContext);
  const { id } = useParams();
  const { search } = useLocation();
  const { showMessage } = useSnackbar();
  const isEdit = new URLSearchParams(search).get("edit") === "1";
  const isCreate = id === "new";

  const [form, setForm] = useState({
    accountId: "",
    accountType: "MEMBER",
    saccoId: "",
    memberId: "",
    memberDisplay: "",
    accountTypeId: "",
    accountTypeDisplay: "",
    productId: "",
    accountName: "",
    availableBalance: 0.00,
    status: "Active",
    remarks: "",
    createdBy: "",
    createdOn: "",
    modifiedBy: "",
    modifiedOn: "",
    statusChangedBy: "",
    statusChangedOn: "",
  });

  const [, setMembers] = useState([]);
  const [products, setProducts] = useState([]);
  const [saccos, setSaccos] = useState([]);
  const [activeTab, setActiveTab] = useState("details");
  
  // Member lookup modal state
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isAccountTypeModalOpen, setIsAccountTypeModalOpen] = useState(false);

  useEffect(() => {
    // Only redirect if authentication check is complete and user is not authenticated
    if (!isLoading && !authState.status) {
      history.push("/login");
    }
  }, [authState, isLoading, history]);

  // Load members, products, and saccos for dropdowns
  useEffect(() => {
    const loadData = async () => {
      try {
        const [membersRes, productsRes, saccosRes] = await Promise.all([
          axios.get("http://localhost:3001/members", {
            headers: { accessToken: localStorage.getItem("accessToken") },
          }),
          axios.get("http://localhost:3001/products", {
            headers: { accessToken: localStorage.getItem("accessToken") },
          }),
          axios.get("http://localhost:3001/sacco", {
            headers: { accessToken: localStorage.getItem("accessToken") },
          })
        ]);

        const membersData = membersRes.data?.entity || membersRes.data || [];
        const productsData = productsRes.data?.entity || productsRes.data || [];
        const saccosData = saccosRes.data?.entity || saccosRes.data || [];

        setMembers(Array.isArray(membersData) ? membersData : []);
        setProducts(Array.isArray(productsData) ? productsData : []);
        setSaccos(Array.isArray(saccosData) ? saccosData : []);
      } catch (err) {
        showMessage("Failed to load data", "error");
      }
    };
    loadData();
  }, [showMessage]);

  useEffect(() => {
    const load = async () => {
      if (!isCreate) {
        const res = await axios.get(`http://localhost:3001/accounts/${id}`, {
          headers: { accessToken: localStorage.getItem("accessToken") },
        });
        const data = res.data?.entity || res.data;
        setForm({
          accountId: data.accountId || "",
          accountType: data.accountType || "MEMBER",
          saccoId: data.saccoId || "",
          memberId: data.memberId || "",
          memberDisplay: data.member ? `${data.member.memberNo} - ${data.member.firstName} ${data.member.lastName}` : "",
          accountTypeId: data.accountTypeId || "",
          accountTypeDisplay: data.accountTypeDefinition ? `${data.accountTypeDefinition.accountTypeId} - ${data.accountTypeDefinition.accountTypeName}` : "",
          productId: data.productId || "",
          accountName: data.accountName || "",
          availableBalance: data.availableBalance || 0.00,
          status: data.status || "Active",
          remarks: data.remarks || "",
          createdBy: data.createdBy || "",
          createdOn: data.createdOn || "",
          modifiedBy: data.modifiedBy || "",
          modifiedOn: data.modifiedOn || "",
          statusChangedBy: data.statusChangedBy || "",
          statusChangedOn: data.statusChangedOn || "",
        });
      }
    };
    load();
  }, [id, isCreate]);

  // Member lookup modal handlers
  const handleOpenMemberModal = () => {
    setIsMemberModalOpen(true);
  };

  const handleCloseMemberModal = () => {
    setIsMemberModalOpen(false);
  };

  const handleSelectMember = (selectedMember) => {
    setForm(prev => ({ 
      ...prev, 
      memberId: selectedMember.id,
      memberDisplay: `${selectedMember.memberNo} - ${selectedMember.firstName} ${selectedMember.lastName}`
    }));
    setIsMemberModalOpen(false);
  };

  // Account type lookup modal handlers
  const handleOpenAccountTypeModal = () => {
    setIsAccountTypeModalOpen(true);
  };

  const handleCloseAccountTypeModal = () => {
    setIsAccountTypeModalOpen(false);
  };

  const handleSelectAccountType = (selectedAccountType) => {
    setForm(prev => ({ 
      ...prev, 
      accountTypeId: selectedAccountType.id,
      accountTypeDisplay: `${selectedAccountType.accountTypeId} - ${selectedAccountType.accountTypeName}`,
      productId: selectedAccountType.productId,
      accountName: selectedAccountType.accountTypeName
    }));
    setIsAccountTypeModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isCreate) {
        // For creation, only send the required fields - backend will generate accountId, accountName, accountNumber
        const payload = {
          accountType: form.accountType,
          saccoId: form.saccoId,
          memberId: form.memberId,
          productId: form.productId,
          accountName: form.accountName,
          availableBalance: form.availableBalance,
          status: form.status,
          remarks: form.remarks
        };
        
        await axios.post("http://localhost:3001/accounts", payload, {
          headers: { accessToken: localStorage.getItem("accessToken") },
        });
        showMessage("Account created successfully", "success");
        history.push("/accounts-management");
      } else {
        // For updates, send the fields that can be updated
        const payload = {
          availableBalance: form.availableBalance,
          status: form.status,
          remarks: form.remarks
        };
        
        await axios.put(`http://localhost:3001/accounts/${id}`, payload, {
          headers: { accessToken: localStorage.getItem("accessToken") },
        });
        showMessage("Account updated successfully", "success");
        history.push("/accounts-management");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to save account";
      showMessage(msg, "error");
    }
  };


  return (
    <DashboardWrapper>
      <header className="header">
        <div className="header__left">
          <button className="iconBtn" onClick={() => history.push("/accounts-management")} title="Back" aria-label="Back" style={{ marginRight: 8 }}>
            <FiArrowLeft className="icon" style={{ fontWeight: "bolder" }}/>
          </button>
          {/* <div className="brand">
            <span className="brand__logo">S</span>
            <span className="brand__name">SACCOFLOW</span>
          </div> */}
          <div className="greeting">{isCreate ? "Add Member Account" : (isEdit ? "Update Member Account Details" : "View Member Account Details")}</div>
        </div>
      </header>

      <main className="dashboard__content">
        <section className="card" style={{ padding: "24px" }}>
          <form onSubmit={handleSubmit}>
            {/* Account ID - Auto-generated and read-only */}
            <div style={{ 
            display: "grid", 
            gridTemplateColumns: "1fr auto", 
            gap: "20px",
            marginBottom: "12px",
            alignItems: "start"
          }}>
            <div style={{ display: "grid", gap: "12px" }}>
              <label>
                Account ID
                <input className="inputa"
                  value={form.accountId}
                  onChange={e => setForm({ ...form, accountId: e.target.value })}
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
                      form.status === "Inactive" ? "rgba(107, 114, 128, 0.2)" :
                      form.status === "Suspended" ? "rgba(249, 115, 22, 0.2)" :
                      form.status === "Closed" ? "rgba(239, 68, 68, 0.2)" :
                      "rgba(107, 114, 128, 0.2)",
                    color: 
                      form.status === "Active" ? "#059669" :
                      form.status === "Inactive" ? "#6b7280" :
                      form.status === "Suspended" ? "#ea580c" :
                      form.status === "Closed" ? "#dc2626" :
                      "#6b7280",
                    border: `1px solid ${
                      form.status === "Active" ? "rgba(16, 185, 129, 0.3)" :
                      form.status === "Inactive" ? "rgba(107, 114, 128, 0.3)" :
                      form.status === "Suspended" ? "rgba(249, 115, 22, 0.3)" :
                      form.status === "Closed" ? "rgba(239, 68, 68, 0.3)" :
                      "rgba(107, 114, 128, 0.3)"
                    }`
                  }}
                >
                  {form.status || "Active"}
                </div>
              </div>
            </div>         
          </div> 

          {/* Account Type - Fixed to MEMBER */}
          <div style={{ marginBottom: "20px" }}>
            <label>
              Account Type
              <input
                className="input"
                value="Member Account"
                disabled={true}
                style={{ backgroundColor: "#f3f4f6", color: "#6b7280" }}
              />
            </label>
          </div>

            {/* Tab Navigation */}
            <div style={{
              display: "flex",
              justifyContent: "center",
              gap: "8px",
              marginBottom: "24px",
              backgroundColor: "var(--surface-2)",
              borderRadius: "8px",
              padding: "4px"
            }}>
              <div
                onClick={() => setActiveTab("details")}
                style={{
                  padding: "12px 24px",
                  color: activeTab === "details" ? "#007bff" : "#666",
                  cursor: "pointer",
                  fontWeight: activeTab === "details" ? "600" : "400",
                  background: activeTab === "details" ? "#e3f2fd" : "transparent",
                  border: "1px solid transparent",
                  borderRadius: "6px",
                  fontSize: "14px",
                  transition: "all 0.2s ease"
                }}
              >
                Details
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === "details" && (
              <div>
                <div className="grid2">
                  {/* Member field - required for Member accounts */}
                  <label>
                    Member *
                    <div className="role-input-wrapper">
                      <input 
                        type="text"
                        className="input" 
                        value={form.memberDisplay} 
                        onChange={e => setForm({ ...form, memberDisplay: e.target.value })} 
                        disabled={!isCreate && !isEdit}
                        placeholder="Select a member"
                        readOnly={!isCreate && !isEdit}
                        required
                      />
                      {(isCreate || isEdit) && (
                        <button
                          type="button"
                          className="role-search-btn"
                          onClick={handleOpenMemberModal}
                          title="Search members"
                        >
                          <FiSearch />
                        </button>
                      )}
                    </div>
                  </label>

                  {/* Account Type field - required for Member accounts */}
                  <label>
                    Account Type *
                    <div className="role-input-wrapper">
                      <input 
                        type="text"
                        className="input" 
                        value={form.accountTypeDisplay} 
                        onChange={e => setForm({ ...form, accountTypeDisplay: e.target.value })} 
                        disabled={!isCreate && !isEdit}
                        placeholder="Select an account type"
                        readOnly={!isCreate && !isEdit}
                        required
                      />
                      {(isCreate || isEdit) && (
                        <button
                          type="button"
                          className="role-search-btn"
                          onClick={handleOpenAccountTypeModal}
                          title="Search account types"
                        >
                          <FiSearch />
                        </button>
                      )}
                    </div>
                  </label>

                  {/* Account Name field - auto-generated for Member accounts */}
                  <label>
                    Account Name
                    <input
                      className="input"
                      value={form.accountName}
                      disabled={true}
                      placeholder="Auto-generated from product name"
                    />
                  </label>

                  <label>
                    Available Balance (KSH)
                    <input
                      type="number"
                      step="0.01"
                      className="input"
                      value={form.availableBalance}
                      onChange={e => setForm({ ...form, availableBalance: parseFloat(e.target.value) || 0 })}
                      disabled={!isCreate && !isEdit}
                      required
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
                      {isCreate ? "Add Member Account" : "Update Member Account"}
                    </button>
                  )}
                </div>
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
                Status Changed On
                <input className="inputf"
                  value={form.statusChangedOn ? new Date(form.statusChangedOn).toLocaleDateString() : ""}
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
                Status Changed By
                <input className="inputf"
                  value={form.statusChangedBy || ""}
                  disabled={true}
                />
              </label>
            </div>

            <label style={{ marginTop: "16px" }}>
              Remarks
              <textarea
                className="inputa"
                value={form.remarks || ""}
                onChange={(e) => setForm(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder="Enter remarks about this account..."
                rows={3}
                style={{ resize: "vertical" }}
              />
            </label>

          </form>
        </section>
      </main>

      {/* Member Lookup Modal */}
      <MemberLookupModal
        isOpen={isMemberModalOpen}
        onClose={handleCloseMemberModal}
        onSelectMember={handleSelectMember}
      />

      {/* Account Type Lookup Modal */}
      <AccountTypeLookupModal
        isOpen={isAccountTypeModalOpen}
        onClose={handleCloseAccountTypeModal}
        onSelect={handleSelectAccountType}
        status="Active"
      />
    </DashboardWrapper>
  );
}

export default AccountForm;
