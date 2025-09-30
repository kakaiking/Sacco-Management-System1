import React, { useContext, useEffect, useState } from "react";
import { useHistory, useParams, useLocation } from "react-router-dom";
import { FiArrowLeft, FiSearch } from "react-icons/fi";
import axios from "axios";
import { useSnackbar } from "../helpers/SnackbarContext";
import { AuthContext } from "../helpers/AuthContext";
import DashboardWrapper from '../components/DashboardWrapper';
import SaccoLookupModal from '../components/SaccoLookupModal';
import InterestTypesLookupModal from '../components/InterestTypesLookupModal';
import InterestFrequencyLookupModal from '../components/InterestFrequencyLookupModal';
import InterestCalculationRulesLookupModal from '../components/InterestCalculationRulesLookupModal';
import ChargesLookupModal from '../components/ChargesLookupModal';
import CurrencyLookupModal from '../components/CurrencyLookupModal';

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
    // Account type fields
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
    isCreditInterest: false,
    isDebitInterest: false,
    needGuarantors: false,
    maxGuarantors: "",
    minGuarantors: "",
    chargeIds: "",
    currency: "KES",
    createdBy: "",
    createdOn: "",
    modifiedBy: "",
    modifiedOn: "",
    approvedBy: "",
    approvedOn: "",
  });

  // Lookup modal states
  const [isSaccoModalOpen, setIsSaccoModalOpen] = useState(false);
  const [isInterestTypeModalOpen, setIsInterestTypeModalOpen] = useState(false);
  const [isInterestFrequencyModalOpen, setIsInterestFrequencyModalOpen] = useState(false);
  const [isInterestCalculationRuleModalOpen, setIsInterestCalculationRuleModalOpen] = useState(false);
  const [isChargesModalOpen, setIsChargesModalOpen] = useState(false);
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  
  // Selected lookup values
  const [selectedInterestType, setSelectedInterestType] = useState(null);
  const [selectedInterestFrequency, setSelectedInterestFrequency] = useState(null);
  const [selectedInterestCalculationRule, setSelectedInterestCalculationRule] = useState(null);
  const [selectedCharges, setSelectedCharges] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState(null);

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
          // Account type fields
          accountType: data.accountType || "MEMBER",
          bosaFosa: data.bosaFosa || "BOSA",
          debitCredit: data.debitCredit || "DEBIT",
          appliedOnMemberOnboarding: data.appliedOnMemberOnboarding || false,
          isWithdrawable: data.isWithdrawable !== undefined ? data.isWithdrawable : true,
          withdrawableFrom: data.withdrawableFrom || "",
          interestRate: data.interestRate || "",
          interestType: data.interestType || "",
          interestCalculationRule: data.interestCalculationRule || "",
          interestFrequency: data.interestFrequency || "",
          isCreditInterest: data.isCreditInterest || false,
          isDebitInterest: data.isDebitInterest || false,
          needGuarantors: data.needGuarantors || false,
          maxGuarantors: data.maxGuarantors || "",
          minGuarantors: data.minGuarantors || "",
          chargeIds: data.chargeIds || "",
          currency: data.currency || "KES",
          createdBy: data.createdBy || "",
          createdOn: data.createdOn || "",
          modifiedBy: data.modifiedBy || "",
          modifiedOn: data.modifiedOn || "",
          approvedBy: data.approvedBy || "",
          approvedOn: data.approvedOn || "",
        });

        // Load related lookup data for editing
        await loadLookupData(data);
      } else {
        // Generate product ID for new products and set saccoId from auth state
        setForm(prev => ({ 
          ...prev, 
          productId: generateProductId(),
          saccoId: authState.saccoId || ''
        }));
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isCreate]);

  // Function to load lookup data for editing
  const loadLookupData = async (productData) => {
    try {
      // Load interest type if exists
      if (productData.interestType) {
        try {
          const interestTypesRes = await axios.get('http://localhost:3001/interest-types', {
            headers: { accessToken: localStorage.getItem('accessToken') }
          });
          const interestType = interestTypesRes.data.entity?.find(it => it.interestTypeId === productData.interestType);
          if (interestType) {
            setSelectedInterestType(interestType);
          }
        } catch (error) {
          console.error('Error loading interest type:', error);
        }
      }

      // Load interest frequency if exists
      if (productData.interestFrequency) {
        try {
          const interestFreqRes = await axios.get('http://localhost:3001/interest-frequency', {
            headers: { accessToken: localStorage.getItem('accessToken') }
          });
          const interestFreq = interestFreqRes.data.entity?.find(freq => freq.interestFrequencyId === productData.interestFrequency);
          if (interestFreq) {
            setSelectedInterestFrequency(interestFreq);
          }
        } catch (error) {
          console.error('Error loading interest frequency:', error);
        }
      }

      // Load interest calculation rule if exists
      if (productData.interestCalculationRule) {
        try {
          const calcRulesRes = await axios.get('http://localhost:3001/interest-calculation-rules', {
            headers: { accessToken: localStorage.getItem('accessToken') }
          });
          const calcRule = calcRulesRes.data.entity?.find(cr => cr.ruleId === productData.interestCalculationRule);
          if (calcRule) {
            setSelectedInterestCalculationRule(calcRule);
          }
        } catch (error) {
          console.error('Error loading interest calculation rule:', error);
        }
      }

      // Load charges if exists
      if (productData.chargeIds) {
        try {
          const chargesRes = await axios.get('http://localhost:3001/charges', {
            headers: { accessToken: localStorage.getItem('accessToken') }
          });
          const chargeIds = productData.chargeIds.split(',').map(id => id.trim());
          const charges = chargesRes.data?.filter(charge => chargeIds.includes(charge.chargeId));
          if (charges && charges.length > 0) {
            setSelectedCharges(charges);
          }
        } catch (error) {
          console.error('Error loading charges:', error);
        }
      }

      // Load currency if exists
      if (productData.currency) {
        try {
          const currenciesRes = await axios.get('http://localhost:3001/currencies', {
            headers: { accessToken: localStorage.getItem('accessToken') }
          });
          const currency = currenciesRes.data.entity?.find(curr => curr.currencyCode === productData.currency);
          if (currency) {
            setSelectedCurrency(currency);
          }
        } catch (error) {
          console.error('Error loading currency:', error);
        }
      }
    } catch (error) {
      console.error('Error loading lookup data:', error);
    }
  };

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

  // Interest Type lookup handlers
  const handleOpenInterestTypeModal = () => {
    setIsInterestTypeModalOpen(true);
  };

  const handleCloseInterestTypeModal = () => {
    setIsInterestTypeModalOpen(false);
  };

  const handleSelectInterestType = (interestType) => {
    setSelectedInterestType(interestType);
    setForm(prev => ({ ...prev, interestType: interestType.interestTypeId }));
    setIsInterestTypeModalOpen(false);
  };

  // Interest Frequency lookup handlers
  const handleOpenInterestFrequencyModal = () => {
    setIsInterestFrequencyModalOpen(true);
  };

  const handleCloseInterestFrequencyModal = () => {
    setIsInterestFrequencyModalOpen(false);
  };

  const handleSelectInterestFrequency = (interestFrequency) => {
    setSelectedInterestFrequency(interestFrequency);
    setForm(prev => ({ ...prev, interestFrequency: interestFrequency.interestFrequencyId }));
    setIsInterestFrequencyModalOpen(false);
  };

  // Interest Calculation Rule lookup handlers
  const handleOpenInterestCalculationRuleModal = () => {
    setIsInterestCalculationRuleModalOpen(true);
  };

  const handleCloseInterestCalculationRuleModal = () => {
    setIsInterestCalculationRuleModalOpen(false);
  };

  const handleSelectInterestCalculationRule = (calculationRule) => {
    setSelectedInterestCalculationRule(calculationRule);
    setForm(prev => ({ ...prev, interestCalculationRule: calculationRule.ruleId }));
    setIsInterestCalculationRuleModalOpen(false);
  };

  // Charges lookup handlers
  const handleOpenChargesModal = () => {
    setIsChargesModalOpen(true);
  };

  const handleCloseChargesModal = () => {
    setIsChargesModalOpen(false);
  };

  const handleSelectCharges = (charges) => {
    setSelectedCharges(charges);
    const chargeIds = charges.map(charge => charge.chargeId).join(',');
    setForm(prev => ({ ...prev, chargeIds: chargeIds }));
    setIsChargesModalOpen(false);
  };

  // Currency lookup handlers
  const handleOpenCurrencyModal = () => {
    setIsCurrencyModalOpen(true);
  };

  const handleCloseCurrencyModal = () => {
    setIsCurrencyModalOpen(false);
  };

  const handleSelectCurrency = (currency) => {
    setSelectedCurrency(currency);
    setForm(prev => ({ ...prev, currency: currency.currencyCode }));
    setIsCurrencyModalOpen(false);
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
              {/* Sacco ID field - hidden for create mode, shown for edit mode */}
              {!isCreate && (
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
              )}

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

              {/* Product Status field - hidden as it defaults to Pending */}

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

            {/* Account Type Configuration Section */}
            <div style={{ 
              border: "1px solid var(--border)", 
              borderRadius: "8px", 
              padding: "20px", 
              marginBottom: "20px",
              backgroundColor: "var(--surface-1)"
            }}>
              <h3 style={{ 
                marginBottom: "16px", 
                color: "var(--primary-700)",
                fontSize: "16px",
                fontWeight: "600"
              }}>
                Account Type Configuration
              </h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <label>
                  Account Type
                  <select
                    className="input"
                    value={form.accountType}
                    onChange={e => setForm({ ...form, accountType: e.target.value })}
                    disabled={!isCreate && !isEdit}
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
                    disabled={!isCreate && !isEdit}
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
                    disabled={!isCreate && !isEdit}
                  >
                    <option value="DEBIT">DEBIT</option>
                    <option value="CREDIT">CREDIT</option>
                  </select>
                </label>

                <label>
                  Currency
                  <div className="role-input-wrapper">
                    <input
                      className="input"
                      value={selectedCurrency ? `${selectedCurrency.currencyCode} - ${selectedCurrency.currencyName}` : form.currency}
                      onChange={e => setForm({ ...form, currency: e.target.value })}
                      disabled={!isCreate && !isEdit}
                      placeholder="Select currency"
                      readOnly={true}
                    />
                    {(isCreate || isEdit) && (
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
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <label>
                  Interest Rate (%)
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    value={form.interestRate}
                    onChange={e => setForm({ ...form, interestRate: e.target.value })}
                    disabled={!isCreate && !isEdit}
                    placeholder="e.g., 5.5"
                  />
                </label>

                <label>
                  Interest Type
                  <div className="role-input-wrapper">
                    <input
                      className="input"
                      value={selectedInterestType ? selectedInterestType.interestTypeName : form.interestType}
                      onChange={e => setForm({ ...form, interestType: e.target.value })}
                      disabled={!isCreate && !isEdit}
                      placeholder="Select interest type"
                      readOnly={true}
                    />
                    {(isCreate || isEdit) && (
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

                <label>
                  Interest Frequency
                  <div className="role-input-wrapper">
                    <input
                      className="input"
                      value={selectedInterestFrequency ? selectedInterestFrequency.interestFrequencyName : form.interestFrequency}
                      onChange={e => setForm({ ...form, interestFrequency: e.target.value })}
                      disabled={!isCreate && !isEdit}
                      placeholder="Select interest frequency"
                      readOnly={true}
                    />
                    {(isCreate || isEdit) && (
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

                <label>
                  Withdrawable From
                  <input
                    type="date"
                    className="input"
                    value={form.withdrawableFrom}
                    onChange={e => setForm({ ...form, withdrawableFrom: e.target.value })}
                    disabled={!isCreate && !isEdit}
                  />
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
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
                  Charge IDs
                  <div className="role-input-wrapper">
                    <input
                      className="input"
                      value={selectedCharges.length > 0 ? selectedCharges.map(c => c.chargeId).join(', ') : form.chargeIds}
                      onChange={e => setForm({ ...form, chargeIds: e.target.value })}
                      disabled={!isCreate && !isEdit}
                      placeholder="Select charges"
                      readOnly={true}
                    />
                    {(isCreate || isEdit) && (
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

                <label>
                  Interest Calculation Rule
                  <div className="role-input-wrapper">
                    <input
                      className="input"
                      value={selectedInterestCalculationRule ? selectedInterestCalculationRule.ruleName : form.interestCalculationRule}
                      onChange={e => setForm({ ...form, interestCalculationRule: e.target.value })}
                      disabled={!isCreate && !isEdit}
                      placeholder="Select calculation rule"
                      readOnly={true}
                    />
                    {(isCreate || isEdit) && (
                      <button
                        type="button"
                        className="role-search-btn"
                        onClick={handleOpenInterestCalculationRuleModal}
                        title="Search calculation rules"
                      >
                        <FiSearch />
                      </button>
                    )}
                  </div>
                </label>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <input
                    type="checkbox"
                    id="appliedOnMemberOnboarding"
                    checked={form.appliedOnMemberOnboarding}
                    onChange={e => setForm({ ...form, appliedOnMemberOnboarding: e.target.checked })}
                    disabled={!isCreate && !isEdit}
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
                    disabled={!isCreate && !isEdit}
                  />
                  <label htmlFor="isWithdrawable" style={{ margin: 0, cursor: "pointer" }}>
                    Is Withdrawable
                  </label>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <input
                    type="checkbox"
                    id="isCreditInterest"
                    checked={form.isCreditInterest}
                    onChange={e => setForm({ ...form, isCreditInterest: e.target.checked })}
                    disabled={!isCreate && !isEdit}
                  />
                  <label htmlFor="isCreditInterest" style={{ margin: 0, cursor: "pointer" }}>
                    Is Credit Interest
                  </label>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <input
                    type="checkbox"
                    id="isDebitInterest"
                    checked={form.isDebitInterest}
                    onChange={e => setForm({ ...form, isDebitInterest: e.target.checked })}
                    disabled={!isCreate && !isEdit}
                  />
                  <label htmlFor="isDebitInterest" style={{ margin: 0, cursor: "pointer" }}>
                    Is Debit Interest
                  </label>
                </div>

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

      {/* Lookup Modals */}
      <SaccoLookupModal
        isOpen={isSaccoModalOpen}
        onClose={handleCloseSaccoModal}
        onSelectSacco={handleSelectSacco}
        selectedSaccoId={form.saccoId}
      />
      
      <InterestTypesLookupModal
        isOpen={isInterestTypeModalOpen}
        onClose={handleCloseInterestTypeModal}
        onSelectInterestType={handleSelectInterestType}
      />
      
      <InterestFrequencyLookupModal
        isOpen={isInterestFrequencyModalOpen}
        onClose={handleCloseInterestFrequencyModal}
        onSelectInterestFrequency={handleSelectInterestFrequency}
      />
      
      <InterestCalculationRulesLookupModal
        isOpen={isInterestCalculationRuleModalOpen}
        onClose={handleCloseInterestCalculationRuleModal}
        onSelectCalculationRule={handleSelectInterestCalculationRule}
      />
      
      <ChargesLookupModal
        isOpen={isChargesModalOpen}
        onClose={handleCloseChargesModal}
        onSelectCharges={handleSelectCharges}
        selectedChargeIds={selectedCharges.map(c => c.chargeId)}
      />
      
      <CurrencyLookupModal
        isOpen={isCurrencyModalOpen}
        onClose={handleCloseCurrencyModal}
        onSelectCurrency={handleSelectCurrency}
      />
    </DashboardWrapper>
  );
}

export default ProductForm;