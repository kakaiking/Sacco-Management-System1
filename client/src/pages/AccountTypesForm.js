import React, { useContext, useEffect, useState } from "react";
import { useHistory, useParams, useLocation } from "react-router-dom";
import { FiArrowLeft, FiSearch } from "react-icons/fi";
import axios from "axios";
import { useSnackbar } from "../helpers/SnackbarContext";
import { AuthContext } from "../helpers/AuthContext";
import DashboardWrapper from '../components/DashboardWrapper';
import frontendLoggingService from "../services/frontendLoggingService";
import InterestTypesLookupModal from '../components/InterestTypesLookupModal';
import InterestCalculationRulesLookupModal from '../components/InterestCalculationRulesLookupModal';
import InterestFrequencyLookupModal from '../components/InterestFrequencyLookupModal';
import CurrencyLookupModal from '../components/CurrencyLookupModal';
import ChargesLookupModal from '../components/ChargesLookupModal';
import ProductLookupModal from '../components/ProductLookupModal';
import '../helpers/MockAuth'; // Import mock auth for testing

function AccountTypesForm() {
  const history = useHistory();
  const { authState, isLoading } = useContext(AuthContext);
  const { id } = useParams();
  const { search } = useLocation();
  const { showMessage } = useSnackbar();
  const isEdit = new URLSearchParams(search).get("edit") === "1";
  const isCreate = id === "new";

  const [form, setForm] = useState({
    accountTypeId: "",
    accountTypeName: "",
    productId: "",
    productName: "",
    accountType: "MEMBER",
    bosaFosa: "BOSA",
    debitCredit: "DEBIT",
    appliedOnMemberOnboarding: false,
    isWithdrawable: true,
    withdrawableFrom: "",
    interestRate: "",
    interestType: "",
    interestCalculationRule: "",
    interestFrequency: "",
    chargeIds: "",
    currency: "UGX",
    status: "Draft",
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
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isInterestTypeModalOpen, setIsInterestTypeModalOpen] = useState(false);
  const [isInterestCalculationRuleModalOpen, setIsInterestCalculationRuleModalOpen] = useState(false);
  const [isInterestFrequencyModalOpen, setIsInterestFrequencyModalOpen] = useState(false);
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  const [isChargesModalOpen, setIsChargesModalOpen] = useState(false);

  // Status-dependent variables (must be after form state initialization)
  const isActive = form.status === "Active";
  const canEdit = (isCreate || isEdit) && !isActive;

  useEffect(() => {
    // Only redirect if authentication check is complete and user is not authenticated
    if (!isLoading && !authState.status) {
      history.push("/login");
    }
  }, [authState, isLoading, history]);

  // Generate Account Type ID for new types
  const generateAccountTypeId = () => {
    const randomNum = Math.floor(1000000 + Math.random() * 9000000); // 7 digits
    return `AT-${randomNum}`;
  };


  // Lookup modal handlers
  const handleOpenProductModal = () => setIsProductModalOpen(true);
  const handleCloseProductModal = () => setIsProductModalOpen(false);
  const handleSelectProduct = (selectedProduct) => {
    setForm(prev => ({ 
      ...prev, 
      productId: selectedProduct.id.toString(),
      productName: selectedProduct.productName
    }));
    setIsProductModalOpen(false);
  };

  const handleOpenInterestTypeModal = () => setIsInterestTypeModalOpen(true);
  const handleCloseInterestTypeModal = () => setIsInterestTypeModalOpen(false);
  const handleSelectInterestType = (selectedInterestType) => {
    setForm(prev => ({ 
      ...prev, 
      interestType: selectedInterestType.interestTypeName
    }));
    setIsInterestTypeModalOpen(false);
  };

  const handleOpenInterestCalculationRuleModal = () => setIsInterestCalculationRuleModalOpen(true);
  const handleCloseInterestCalculationRuleModal = () => setIsInterestCalculationRuleModalOpen(false);
  const handleSelectInterestCalculationRule = (selectedCalculationRule) => {
    setForm(prev => ({ 
      ...prev, 
      interestCalculationRule: selectedCalculationRule.ruleName
    }));
    setIsInterestCalculationRuleModalOpen(false);
  };

  const handleOpenInterestFrequencyModal = () => setIsInterestFrequencyModalOpen(true);
  const handleCloseInterestFrequencyModal = () => setIsInterestFrequencyModalOpen(false);
  const handleSelectInterestFrequency = (selectedInterestFrequency) => {
    setForm(prev => ({ 
      ...prev, 
      interestFrequency: selectedInterestFrequency.interestFrequencyName
    }));
    setIsInterestFrequencyModalOpen(false);
  };

  const handleOpenCurrencyModal = () => setIsCurrencyModalOpen(true);
  const handleCloseCurrencyModal = () => setIsCurrencyModalOpen(false);
  const handleSelectCurrency = (selectedCurrency) => {
    setForm(prev => ({ 
      ...prev, 
      currency: selectedCurrency.currencyCode
    }));
    setIsCurrencyModalOpen(false);
  };

  const handleOpenChargesModal = () => setIsChargesModalOpen(true);
  const handleCloseChargesModal = () => setIsChargesModalOpen(false);
  const handleSelectCharges = (selectedCharges) => {
    // Convert charges array to comma-separated string of charge IDs
    const chargeIds = selectedCharges.map(charge => charge.chargeId).join(',');
    setForm(prev => ({ 
      ...prev, 
      chargeIds: chargeIds
    }));
    setIsChargesModalOpen(false);
  };


  useEffect(() => {
    const load = async () => {
      if (isCreate) {
        // For new account type, generate ID and set defaults
        setForm(prev => ({
          ...prev,
          accountTypeId: generateAccountTypeId(),
          createdBy: authState.username || "",
          createdOn: new Date().toISOString().split('T')[0]
        }));
      } else {
        // Load existing account type
        try {
          setLoading(true);
          const response = await axios.get(`http://localhost:3001/account-types/${id}`, {
            headers: { accessToken: localStorage.getItem("accessToken") }
          });

          if (response.data.code === 200) {
            const accountType = response.data.entity;
            // Store original data for logging purposes
            setOriginalData(accountType);
            setForm({
              accountTypeId: accountType.accountTypeId || "",
              accountTypeName: accountType.accountTypeName || "",
              productId: accountType.productId || "",
              productName: accountType.product?.productName || accountType.loanProduct?.loanProductName || 'N/A',
              accountType: accountType.accountType || "MEMBER",
              bosaFosa: accountType.bosaFosa || "BOSA",
              debitCredit: accountType.debitCredit || "DEBIT",
              appliedOnMemberOnboarding: accountType.appliedOnMemberOnboarding || false,
              isWithdrawable: accountType.isWithdrawable || true,
              withdrawableFrom: accountType.withdrawableFrom || "",
              interestRate: accountType.interestRate || "",
              interestType: accountType.interestType || "",
              interestCalculationRule: accountType.interestCalculationRule || "",
              interestFrequency: accountType.interestFrequency || "",
              chargeIds: accountType.chargeIds || "",
              currency: accountType.currency || "UGX",
              status: accountType.status || "Draft",
              remarks: accountType.remarks || "",
              createdBy: accountType.createdBy || "",
              createdOn: accountType.createdOn ? new Date(accountType.createdOn).toISOString().split('T')[0] : "",
              modifiedBy: accountType.modifiedBy || "",
              modifiedOn: accountType.modifiedOn ? new Date(accountType.modifiedOn).toISOString().split('T')[0] : "",
              approvedBy: accountType.approvedBy || "",
              approvedOn: accountType.approvedOn ? new Date(accountType.approvedOn).toISOString().split('T')[0] : "",
            });
          } else {
            showMessage("Account type not found", "error");
            history.push("/account-types-maintenance");
          }
        } catch (error) {
          console.error("Error loading account type:", error);
          showMessage("Error loading account type", "error");
          history.push("/account-types-maintenance");
        } finally {
          setLoading(false);
        }
      }
    };

    if (authState.status) {
      load();
    }
  }, [authState.status, id, isCreate, authState.username, history, showMessage]);

  const save = async (e) => {
    e.preventDefault();
    
    if (!form.accountTypeName.trim()) {
      showMessage("Account type name is required", "error");
      return;
    }

    if (!form.productId) {
      showMessage("Product is required", "error");
      return;
    }

    try {
      setSaving(true);
      
      if (isCreate) {
        // Create new account type
        const response = await axios.post('http://localhost:3001/account-types', {
          accountTypeName: form.accountTypeName,
          productId: form.productId,
          accountType: form.accountType,
          bosaFosa: form.bosaFosa,
          debitCredit: form.debitCredit,
          appliedOnMemberOnboarding: form.appliedOnMemberOnboarding,
          isWithdrawable: form.isWithdrawable,
          withdrawableFrom: form.withdrawableFrom || null,
          interestRate: form.interestRate || null,
          interestType: form.interestType || null,
          interestCalculationRule: form.interestCalculationRule || null,
          interestFrequency: form.interestFrequency || null,
          chargeIds: form.chargeIds || null,
          currency: form.currency,
          status: form.status,
          remarks: form.remarks || null,
        }, {
          headers: { accessToken: localStorage.getItem("accessToken") }
        });

        if (response.data.code === 201) {
          showMessage("Account type created successfully", "success");
          frontendLoggingService.logCreate("AccountTypes", response.data.entity.id, form.accountTypeName, response.data.entity, `Created account type: ${form.accountTypeName}`);
          history.push("/account-types-maintenance");
        }
      } else {
        // Update existing account type
        // If the current status is Draft, change it to Pending when updated
        const newStatus = originalData?.status === "Draft" ? "Pending" : form.status;
        
        const response = await axios.put(`http://localhost:3001/account-types/${id}`, {
          accountTypeName: form.accountTypeName,
          productId: form.productId,
          accountType: form.accountType,
          bosaFosa: form.bosaFosa,
          debitCredit: form.debitCredit,
          appliedOnMemberOnboarding: form.appliedOnMemberOnboarding,
          isWithdrawable: form.isWithdrawable,
          withdrawableFrom: form.withdrawableFrom || null,
          interestRate: form.interestRate || null,
          interestType: form.interestType || null,
          interestCalculationRule: form.interestCalculationRule || null,
          interestFrequency: form.interestFrequency || null,
          chargeIds: form.chargeIds || null,
          currency: form.currency,
          status: newStatus,
          remarks: form.remarks || null,
        }, {
          headers: { accessToken: localStorage.getItem("accessToken") }
        });

        if (response.data.code === 200) {
          const statusMessage = newStatus === "Pending" ? "Account type updated and submitted for approval" : "Account type updated successfully";
          showMessage(statusMessage, "success");
          frontendLoggingService.logUpdate("AccountTypes", id, form.accountTypeName, originalData, response.data.entity, `Updated account type: ${form.accountTypeName}`);
          history.push("/account-types-maintenance");
        }
      }
    } catch (error) {
      console.error("Error saving account type:", error);
      if (error.response?.data?.message) {
        showMessage(error.response.data.message, "error");
      } else if (error.response?.data?.error) {
        showMessage(error.response.data.error, "error");
      } else {
        showMessage("Error saving account type", "error");
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
            onClick={() => history.push("/account-types-maintenance")}
            style={{ marginRight: "16px" }}
          >
            <FiArrowLeft style={{ marginRight: "8px" }} />
            Back
          </button>
          <div className="greeting">
            {isCreate ? "Add New Account Type" : isEdit ? "Edit Account Type" : "View Account Type"}
          </div>
        </div>
      </header>

      <main className="dashboard__content">
        <section className="card" style={{ padding: "24px" }}>
          <form onSubmit={save}>
            {/* Account Type ID and Status - Non-changeable and automatic */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: "20px",
              marginBottom: "12px",
              alignItems: "start"
            }}>
              <div style={{ display: "grid", gap: "12px" }}>
                <label>
                  Account Type Id
                  <input className="inputa"
                    value={form.accountTypeId}
                    onChange={e => setForm({ ...form, accountTypeId: e.target.value })}
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
                        form.status === "Draft" ? "rgba(6, 182, 212, 0.2)" :
                        form.status === "Inactive" ? "rgba(239, 68, 68, 0.2)" :
                        "rgba(107, 114, 128, 0.2)",
                      color:
                        form.status === "Active" ? "#059669" :
                        form.status === "Draft" ? "#0891b2" :
                        form.status === "Inactive" ? "#dc2626" :
                        "#6b7280",
                      border: `1px solid ${
                        form.status === "Active" ? "rgba(16, 185, 129, 0.3)" :
                        form.status === "Draft" ? "rgba(6, 182, 212, 0.3)" :
                        form.status === "Inactive" ? "rgba(239, 68, 68, 0.3)" :
                        "rgba(107, 114, 128, 0.3)"
                      }`
                    }}
                  >
                    {form.status || "Draft"}
                  </div>
                </div>
              </div>
            </div>

            {/* Form Content */}
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px", marginBottom: "20px" }}>
                <label>
                  Account Type Name *
                  <input
                    className="input"
                    value={form.accountTypeName}
                    onChange={e => setForm({ ...form, accountTypeName: e.target.value })}
                    disabled={!canEdit}
                    required
                    placeholder="e.g., Primary Savings Account, Personal Loan Account"
                  />
                </label>

                <label>
                  Product *
                  <div className="role-input-wrapper">
                    <input 
                      type="text"
                      className="input" 
                      value={form.productName} 
                      disabled={true}
                      placeholder="Select a product"
                      readOnly={true}
                      required
                      style={{
                        backgroundColor: form.productId ? '#f8f9fa' : 'white',
                        color: form.productId ? '#6c757d' : 'inherit'
                      }}
                    />
                    {canEdit && !form.productId && (
                      <button
                        type="button"
                        className="role-search-btn"
                        onClick={handleOpenProductModal}
                        title="Search products"
                      >
                        <FiSearch />
                      </button>
                    )}
                    {form.productId && (
                      <span 
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#6c757d',
                          fontSize: '14px'
                        }}
                        title="Product is locked and cannot be changed"
                      >
                        🔒
                      </span>
                    )}
                  </div>
                </label>
              </div>

              {/* Product field info message */}
              {form.productId && (
                <div style={{
                  marginBottom: "20px",
                  padding: "8px 12px",
                  backgroundColor: "#e3f2fd",
                  border: "1px solid #2196f3",
                  borderRadius: "4px",
                  fontSize: "12px",
                  color: "#1976d2"
                }}>
                  <strong>Note:</strong> The product field is locked and cannot be changed once set. This ensures data integrity and prevents conflicts with existing accounts.
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "20px" }}>
                <label>
                  Account Type
                  <select
                    className="input"
                    value={form.accountType}
                    onChange={e => setForm({ ...form, accountType: e.target.value })}
                    disabled={!canEdit}
                  >
                    <option value="MEMBER">MEMBER</option>
                    <option value="GL">GL</option>
                  </select>
                </label>

                <label>
                  BOSA/FOSA
                  <select
                    className="input"
                    value={form.bosaFosa}
                    onChange={e => setForm({ ...form, bosaFosa: e.target.value })}
                    disabled={!canEdit}
                  >
                    <option value="BOSA">BOSA</option>
                    <option value="FOSA">FOSA</option>
                  </select>
                </label>

                <label>
                  Debit/Credit
                  <select
                    className="input"
                    value={form.debitCredit}
                    onChange={e => setForm({ ...form, debitCredit: e.target.value })}
                    disabled={!canEdit}
                  >
                    <option value="DEBIT">DEBIT</option>
                    <option value="CREDIT">CREDIT</option>
                  </select>
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px", marginBottom: "20px" }}>
                <label>
                  Currency
                  <div className="role-input-wrapper">
                    <input 
                      type="text"
                      className="input" 
                      value={form.currency} 
                      disabled={true}
                      placeholder="Select a currency"
                      readOnly={true}
                    />
                    {canEdit && (
                      <button
                        type="button"
                        className="role-search-btn"
                        onClick={handleOpenCurrencyModal}
                        title="Search currencies"
                      >
                        <FiSearch />
                      </button>
                    )}
                  </div>
                </label>

                <label>
                  Withdrawable From
                  <input
                    type="date"
                    className="input"
                    value={form.withdrawableFrom}
                    onChange={e => setForm({ ...form, withdrawableFrom: e.target.value })}
                    disabled={!canEdit}
                  />
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px", marginBottom: "20px" }}>
                <label>
                  Interest Rate (%)
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    value={form.interestRate}
                    onChange={e => setForm({ ...form, interestRate: e.target.value })}
                    disabled={!canEdit}
                    placeholder="e.g., 5.5"
                  />
                </label>

                <label>
                  Interest Type
                  <div className="role-input-wrapper">
                    <input
                      className="input"
                      value={form.interestType}
                      disabled={true}
                      placeholder="Select an interest type"
                      readOnly={true}
                    />
                    {canEdit && (
                      <button
                        type="button"
                        className="role-search-btn"
                        onClick={handleOpenInterestTypeModal}
                        title="Search interest types"
                      >
                        <FiSearch />
                      </button>
                    )}
                  </div>
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px", marginBottom: "20px" }}>
                <label>
                  Interest Calculation Rule
                  <div className="role-input-wrapper">
                    <input
                      className="input"
                      value={form.interestCalculationRule}
                      disabled={true}
                      placeholder="Select an interest calculation rule"
                      readOnly={true}
                    />
                    {canEdit && (
                      <button
                        type="button"
                        className="role-search-btn"
                        onClick={handleOpenInterestCalculationRuleModal}
                        title="Search interest calculation rules"
                      >
                        <FiSearch />
                      </button>
                    )}
                  </div>
                </label>

                <label>
                  Interest Frequency
                  <div className="role-input-wrapper">
                    <input
                      className="input"
                      value={form.interestFrequency}
                      disabled={true}
                      placeholder="Select an interest frequency"
                      readOnly={true}
                    />
                    {canEdit && (
                      <button
                        type="button"
                        className="role-search-btn"
                        onClick={handleOpenInterestFrequencyModal}
                        title="Search interest frequencies"
                      >
                        <FiSearch />
                      </button>
                    )}
                  </div>
                </label>
              </div>


              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px", marginBottom: "20px" }}>
                <label>
                  Charge IDs
                  <div className="role-input-wrapper">
                    <input 
                      type="text"
                      className="input" 
                      value={form.chargeIds} 
                      disabled={true}
                      placeholder="Select charges"
                      readOnly={true}
                    />
                    {canEdit && (
                      <button
                        type="button"
                        className="role-search-btn"
                        onClick={handleOpenChargesModal}
                        title="Search charges"
                      >
                        <FiSearch />
                      </button>
                    )}
                  </div>
                </label>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <input
                    type="checkbox"
                    id="appliedOnMemberOnboarding"
                    checked={form.appliedOnMemberOnboarding}
                    onChange={e => setForm({ ...form, appliedOnMemberOnboarding: e.target.checked })}
                    disabled={!canEdit}
                  />
                  <label htmlFor="appliedOnMemberOnboarding" style={{ margin: 0, cursor: "pointer" }}>
                    Applied on Member Onboarding
                  </label>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <input
                    type="checkbox"
                    id="isWithdrawable"
                    checked={form.isWithdrawable}
                    onChange={e => setForm({ ...form, isWithdrawable: e.target.checked })}
                    disabled={!canEdit}
                  />
                  <label htmlFor="isWithdrawable" style={{ margin: 0, cursor: "pointer" }}>
                    Is Withdrawable
                  </label>
                </div>

              </div>

              <label>
                Remarks
                <textarea
                  className="input"
                  value={form.remarks}
                  onChange={e => setForm({ ...form, remarks: e.target.value })}
                  disabled={!isCreate && !isEdit}
                  placeholder="Additional notes about this account type..."
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
                  {saving ? "Saving..." : (isCreate ? "Add Account Type" : "Update Account Type")}
                </button>
              )}

            </div>

            {/* Status message for Active account types */}
            {!isCreate && form.status === "Active" && (
              <div style={{
                marginTop: "16px",
                padding: "12px 16px",
                backgroundColor: "#f0f9ff",
                border: "1px solid #0ea5e9",
                borderRadius: "8px",
                color: "#0369a1",
                textAlign: "center"
              }}>
                <strong>Account Type is Active</strong><br />
                This account type has been approved and cannot be edited.
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
        </section>
      </main>

      {/* Lookup Modals */}
      <ProductLookupModal
        isOpen={isProductModalOpen}
        onClose={handleCloseProductModal}
        onSelectProduct={handleSelectProduct}
      />

      <InterestTypesLookupModal
        isOpen={isInterestTypeModalOpen}
        onClose={handleCloseInterestTypeModal}
        onSelectInterestType={handleSelectInterestType}
      />

      <InterestCalculationRulesLookupModal
        isOpen={isInterestCalculationRuleModalOpen}
        onClose={handleCloseInterestCalculationRuleModal}
        onSelectCalculationRule={handleSelectInterestCalculationRule}
      />

      <InterestFrequencyLookupModal
        isOpen={isInterestFrequencyModalOpen}
        onClose={handleCloseInterestFrequencyModal}
        onSelectInterestFrequency={handleSelectInterestFrequency}
      />

      <CurrencyLookupModal
        isOpen={isCurrencyModalOpen}
        onClose={handleCloseCurrencyModal}
        onSelectCurrency={handleSelectCurrency}
      />

      <ChargesLookupModal
        isOpen={isChargesModalOpen}
        onClose={handleCloseChargesModal}
        onSelectCharges={handleSelectCharges}
        selectedChargeIds={form.chargeIds ? form.chargeIds.split(',').filter(id => id.trim()) : []}
      />
    </DashboardWrapper>
  );
}

export default AccountTypesForm;

