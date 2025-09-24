import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../helpers/AuthContext";
import { useHistory, useParams, useLocation } from "react-router-dom";
import { FiArrowLeft, FiEdit3, FiTrash2, FiX, FiSearch } from "react-icons/fi";
import axios from "axios";
import { useSnackbar } from "../helpers/SnackbarContext";
import DashboardWrapper from '../components/DashboardWrapper';
import SaccoLookupModal from '../components/SaccoLookupModal';
import GenderLookupModal from '../components/GenderLookupModal';
import IdentificationTypesLookupModal from '../components/IdentificationTypesLookupModal';
import NextOfKinRelationTypesLookupModal from '../components/NextOfKinRelationTypesLookupModal';
import MemberCategoriesLookupModal from '../components/MemberCategoriesLookupModal';

function MemberForm() {
  const history = useHistory();
  const { authState, isLoading } = useContext(AuthContext);
  const { id } = useParams();
  const { search } = useLocation();
  const { showMessage } = useSnackbar();
  const isEdit = new URLSearchParams(search).get("edit") === "1";
  const isCreate = id === "new";

  const [form, setForm] = useState({
    memberNo: "",
    saccoId: "",
    firstName: "",
    lastName: "",
    title: "",
    category: "",
    gender: "",
    dateOfBirth: "",
    nationality: "",
    identificationType: "",
    identificationNumber: "",
    identificationExpiryDate: "",
    kraPin: "",
    maritalStatus: "",
    country: "",
    county: "",
    email: "",
    personalPhone: "",
    alternativePhone: "",
    createdBy: "",
    createdOn: "",
    modifiedBy: "",
    modifiedOn: "",
    approvedBy: "",
    approvedOn: "",
    status: "Pending",
  });

  const [nextOfKin, setNextOfKin] = useState([]);
  const [nextOfKinForm, setNextOfKinForm] = useState({
    title: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    relationType: "",
    gender: "",
  });
  const [editingNextOfKinIndex, setEditingNextOfKinIndex] = useState(-1);
  
  // Photo and Signature states
  const [photo, setPhoto] = useState(null);
  const [signature, setSignature] = useState(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showPhotoViewModal, setShowPhotoViewModal] = useState(false);
  const [showSignatureViewModal, setShowSignatureViewModal] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [activeTab, setActiveTab] = useState("personal");
  
  // Lookup modal states
  const [isSaccoModalOpen, setIsSaccoModalOpen] = useState(false);
  const [isGenderModalOpen, setIsGenderModalOpen] = useState(false);
  const [isIdentificationTypeModalOpen, setIsIdentificationTypeModalOpen] = useState(false);
  const [isNextOfKinRelationTypeModalOpen, setIsNextOfKinRelationTypeModalOpen] = useState(false);
  const [isMemberCategoryModalOpen, setIsMemberCategoryModalOpen] = useState(false);
  const [isNextOfKinGenderModalOpen, setIsNextOfKinGenderModalOpen] = useState(false);
  
  // Accounts state
  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState(null);

  useEffect(() => {
    // Only redirect if authentication check is complete and user is not authenticated
    if (!isLoading && !authState.status) {
      history.push("/login");
    }
  }, [authState, isLoading, history]);

  // Generate member number for new members
  const generateMemberNo = () => {
    const randomNum = Math.floor(1000000 + Math.random() * 9000000); // 7 digits
    return `M-${randomNum}`;
  };

  // Fetch accounts for the member
  const fetchMemberAccounts = async (memberId) => {
    if (!memberId || memberId === "new") return;
    
    console.log("Fetching accounts for member ID:", memberId);
    setAccountsLoading(true);
    setAccountsError(null);
    
    try {
      const res = await axios.get(`http://localhost:3001/accounts/member/${memberId}`, {
        headers: { accessToken: localStorage.getItem("accessToken") },
      });
      console.log("Accounts response:", res.data);
      const data = res.data?.entity || res.data;
      setAccounts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching member accounts:", err);
      console.error("Error response:", err.response?.data);
      setAccountsError(err?.response?.data?.message || err?.response?.data?.error || "Failed to fetch accounts");
      setAccounts([]);
    } finally {
      setAccountsLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      if (!isCreate) {
        const res = await axios.get(`http://localhost:3001/members/${id}`, {
          headers: { accessToken: localStorage.getItem("accessToken") },
        });
        const data = res.data?.entity || res.data;
        setForm({
          memberNo: data.memberNo || "",
          saccoId: data.saccoId || "",
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          title: data.title || "",
          category: data.category || "",
          gender: data.gender || "",
          dateOfBirth: data.dateOfBirth || "",
          nationality: data.nationality || "",
          identificationType: data.identificationType || "",
          identificationNumber: data.identificationNumber || "",
          identificationExpiryDate: data.identificationExpiryDate || "",
          kraPin: data.kraPin || "",
          maritalStatus: data.maritalStatus || "",
          country: data.country || "",
          county: data.county || "",
          email: data.email || "",
          personalPhone: data.personalPhone || "",
          alternativePhone: data.alternativePhone || "",
          createdBy: data.createdBy || "",
          createdOn: data.createdOn || "",
          modifiedBy: data.modifiedBy || "",
          modifiedOn: data.modifiedOn || "",
          approvedBy: data.approvedBy || "",
          approvedOn: data.approvedOn || "",
          status: data.status || "Pending",
        });
        // Load next of kin data if available
        setNextOfKin(data.nextOfKin || []);
        // Load photo and signature data if available
        if (data.photo) {
          if (typeof data.photo === 'string' && data.photo.startsWith('data:')) {
            // Base64 data - create a mock file object for display
            setPhoto({ 
              name: 'member-photo.jpg', 
              data: data.photo,
              isBase64: true 
            });
          } else {
            // Just filename
            setPhoto({ name: data.photo });
          }
        } else {
          setPhoto(null);
        }
        
        if (data.signature) {
          if (typeof data.signature === 'string' && data.signature.startsWith('data:')) {
            // Base64 data - create a mock file object for display
            setSignature({ 
              name: 'member-signature.jpg', 
              data: data.signature,
              isBase64: true 
            });
          } else {
            // Just filename
            setSignature({ name: data.signature });
          }
        } else {
          setSignature(null);
        }
        
        // Fetch accounts for this member
        await fetchMemberAccounts(id);
      } else {
        // Generate member number for new members
        setForm(prev => ({ ...prev, memberNo: generateMemberNo() }));
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isCreate]);

  const addNextOfKin = (e) => {
    e.preventDefault(); // Prevent form submission
    if (!nextOfKinForm.firstName || !nextOfKinForm.lastName || !nextOfKinForm.phoneNumber) {
      showMessage("Please fill in all required next of kin fields", "error");
      return;
    }
    
    if (editingNextOfKinIndex >= 0) {
      // Update existing next of kin
      const updated = [...nextOfKin];
      updated[editingNextOfKinIndex] = { ...nextOfKinForm };
      setNextOfKin(updated);
      setEditingNextOfKinIndex(-1);
      showMessage("Next of kin updated successfully", "success");
    } else {
      // Add new next of kin
      setNextOfKin([...nextOfKin, { ...nextOfKinForm }]);
      showMessage("Next of kin added successfully", "success");
    }
    
    // Reset form
    setNextOfKinForm({
      title: "",
      firstName: "",
      lastName: "",
      phoneNumber: "",
      relationType: "",
      gender: "",
    });
  };

  const editNextOfKin = (index) => {
    const kin = nextOfKin[index];
    setNextOfKinForm({ ...kin });
    setEditingNextOfKinIndex(index);
  };

  const deleteNextOfKin = (index) => {
    setNextOfKin(nextOfKin.filter((_, i) => i !== index));
    showMessage("Next of kin deleted successfully", "success");
  };

  // Sacco selection handler
  const handleSaccoSelect = (sacco) => {
    setForm({ ...form, saccoId: sacco.saccoId });
    showMessage(`Sacco "${sacco.saccoName}" selected successfully`, "success");
  };

  // Gender lookup modal handlers
  const handleOpenGenderModal = () => setIsGenderModalOpen(true);
  const handleCloseGenderModal = () => setIsGenderModalOpen(false);
  const handleSelectGender = (selectedGender) => {
    setForm(prev => ({ 
      ...prev, 
      gender: selectedGender.genderName
    }));
    setIsGenderModalOpen(false);
  };

  // Identification Type lookup modal handlers
  const handleOpenIdentificationTypeModal = () => setIsIdentificationTypeModalOpen(true);
  const handleCloseIdentificationTypeModal = () => setIsIdentificationTypeModalOpen(false);
  const handleSelectIdentificationType = (selectedIdentificationType) => {
    setForm(prev => ({ 
      ...prev, 
      identificationType: selectedIdentificationType.identificationTypeName
    }));
    setIsIdentificationTypeModalOpen(false);
  };

  // Next of Kin Relation Type lookup modal handlers
  const handleOpenNextOfKinRelationTypeModal = () => setIsNextOfKinRelationTypeModalOpen(true);
  const handleCloseNextOfKinRelationTypeModal = () => setIsNextOfKinRelationTypeModalOpen(false);
  const handleSelectNextOfKinRelationType = (selectedRelationType) => {
    setNextOfKinForm(prev => ({ 
      ...prev, 
      relationType: selectedRelationType.relationTypeName
    }));
    setIsNextOfKinRelationTypeModalOpen(false);
  };

  // Member Category lookup modal handlers
  const handleOpenMemberCategoryModal = () => setIsMemberCategoryModalOpen(true);
  const handleCloseMemberCategoryModal = () => setIsMemberCategoryModalOpen(false);
  const handleSelectMemberCategory = (selectedMemberCategory) => {
    setForm(prev => ({ 
      ...prev, 
      category: selectedMemberCategory.memberCategoryName
    }));
    setIsMemberCategoryModalOpen(false);
  };

  // Next of Kin Gender lookup modal handlers
  const handleOpenNextOfKinGenderModal = () => setIsNextOfKinGenderModalOpen(true);
  const handleCloseNextOfKinGenderModal = () => setIsNextOfKinGenderModalOpen(false);
  const handleSelectNextOfKinGender = (selectedGender) => {
    setNextOfKinForm(prev => ({ 
      ...prev, 
      gender: selectedGender.genderName
    }));
    setIsNextOfKinGenderModalOpen(false);
  };

  // Photo and Signature handlers
  const handleFileSelect = (file, type) => {
    if (file && file.type.startsWith('image/')) {
      if (type === 'photo') {
        setPhoto(file);
      } else {
        setSignature(file);
      }
      showMessage(`${type === 'photo' ? 'Photo' : 'Signature'} selected successfully`, "success");
    } else {
      showMessage("Please select a valid image file", "error");
    }
  };

  const handleFileInputChange = (event, type) => {
    const file = event.target.files[0];
    if (file) {
      handleFileSelect(file, type);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (event, type) => {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file, type);
    }
  };

  const closeModal = (type) => {
    if (type === 'photo') {
      setShowPhotoModal(false);
    } else if (type === 'signature') {
      setShowSignatureModal(false);
    } else if (type === 'nextOfKinGender') {
      setIsNextOfKinGenderModalOpen(false);
    }
    setDragOver(false);
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      // Convert files to base64 if they exist
      let photoBase64 = null;
      let signatureBase64 = null;
      
      if (photo instanceof File) {
        photoBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(photo);
        });
      } else if (photo && typeof photo === 'string' && photo.startsWith('data:')) {
        // Already base64 encoded
        photoBase64 = photo;
      } else if (photo && photo.isBase64 && photo.data) {
        // Photo object with base64 data from database
        photoBase64 = photo.data;
      } else if (photo) {
        // Just filename from database
        photoBase64 = photo.name;
      }
      
      if (signature instanceof File) {
        signatureBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(signature);
        });
      } else if (signature && typeof signature === 'string' && signature.startsWith('data:')) {
        // Already base64 encoded
        signatureBase64 = signature;
      } else if (signature && signature.isBase64 && signature.data) {
        // Signature object with base64 data from database
        signatureBase64 = signature.data;
      } else if (signature) {
        // Just filename from database
        signatureBase64 = signature.name;
      }

      const payload = { 
        ...form, 
        nextOfKin,
        photo: photoBase64,
        signature: signatureBase64
      };
    if (isCreate) {
        await axios.post("http://localhost:3001/members", payload, { headers: { accessToken: localStorage.getItem("accessToken") } });
        showMessage("Member created successfully", "success");
    } else {
        await axios.put(`http://localhost:3001/members/${id}`, payload, { headers: { accessToken: localStorage.getItem("accessToken") } });
        showMessage("Member updated successfully", "success");
    }
    history.push("/member-maintenance");
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to save member";
      showMessage(msg, "error");
    }
  };

  return (
    <DashboardWrapper>
      <header className="header">
        <div className="header__left">
          <button className="iconBtn" onClick={() => history.push("/member-maintenance")} title="Back" aria-label="Back" style={{ marginRight: 8 }}>
            <FiArrowLeft className="icon" style={{ fontWeight: "bolder" }}/>
          </button>
          {/* <div className="brand">
            <span className="brand__logo">S</span>
            <span className="brand__name">SACCOFLOW</span>
          </div> */}
          <div className="greeting">{isCreate ? "Add Member" : (isEdit ? "Update Member Details" : "View Member Details")}</div>
        </div>
      </header>

      <main className="dashboard__content">
        <form className="card" onSubmit={save} style={{ display: "grid", gap: 12, padding: 16 }}>
          {/* Member No and Member Name at the top */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "1fr auto", 
            gap: "20px",
            marginBottom: "12px",
            alignItems: "start"
          }}>
            <div style={{ display: "grid", gap: "12px" }}>
              <label>
                Member No
                <input className="inputa"
                  value={form.memberNo}
                  onChange={e => setForm({ ...form, memberNo: e.target.value })}
                  required
                  disabled={true}
                />
              </label>
              <label>
                Member Name
                <input
                  className="inputa"
                  value={`${form.firstName} ${form.lastName}`.trim()}
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
                    border: `1px solid ${
                      form.status === "Approved" ? "rgba(16, 185, 129, 0.3)" :
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
            
            {/* Member Photo Display */}
            <div style={{
              width: "120px",
              height: "120px",
              borderRadius: "12px",
              border: "2px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "var(--surface-2)",
              overflow: "hidden",
              position: "relative"
            }}>
              {photo instanceof File ? (
                <img
                  src={URL.createObjectURL(photo)}
                  alt="Member"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "10px"
                  }}
                />
              ) : photo && photo.isBase64 ? (
                <img
                  src={photo.data}
                  alt="Member"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "10px"
                  }}
                />
              ) : photo ? (
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--muted-text)",
                  textAlign: "center",
                  padding: "8px"
                }}>
                  <div style={{ fontSize: "24px", marginBottom: "4px" }}>📷</div>
                  <div style={{ fontSize: "10px", fontWeight: "600" }}>
                    {photo.name}
                  </div>
                </div>
              ) : (
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--muted-text)",
                  textAlign: "center"
                }}>
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>👤</div>
                  <div style={{ fontSize: "12px", fontWeight: "600" }}>
                    No Photo
                  </div>
                </div>
              )}
            </div>          
          </div> 


          {/* Tab Navigation */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            marginBottom: "16px",
            backgroundColor: "#f8f9fa",
            padding: "4px"
          }}>
            <div
              onClick={() => setActiveTab("personal")}
              style={{
                padding: "12px 24px",
                color: activeTab === "personal" ? "#007bff" : "#666",
                cursor: "pointer",
                fontWeight: activeTab === "personal" ? "600" : "400",
                background: activeTab === "personal" ? "#e3f2fd" : "transparent",
                border: "1px solid transparent",
                borderRadius: "6px",
                fontSize: "14px",
                transition: "all 0.2s ease",
                margin: "0 2px"
              }}
            >
              Personal Info
            </div>
            <div
              onClick={() => setActiveTab("address")}
              style={{
                padding: "12px 24px",
                color: activeTab === "address" ? "#007bff" : "#666",
                cursor: "pointer",
                fontWeight: activeTab === "address" ? "600" : "400",
                background: activeTab === "address" ? "#e3f2fd" : "transparent",
                border: "1px solid transparent",
                borderRadius: "6px",
                fontSize: "14px",
                transition: "all 0.2s ease",
                margin: "0 2px"
              }}
            >
              Address
            </div>
            <div
              onClick={() => setActiveTab("nextOfKin")}
              style={{
                padding: "12px 24px",
                color: activeTab === "nextOfKin" ? "#007bff" : "#666",
                cursor: "pointer",
                fontWeight: activeTab === "nextOfKin" ? "600" : "400",
                background: activeTab === "nextOfKin" ? "#e3f2fd" : "transparent",
                border: "1px solid transparent",
                borderRadius: "6px",
                fontSize: "14px",
                transition: "all 0.2s ease",
                margin: "0 2px"
              }}
            >
              Next of Kin
            </div>
            <div
              onClick={() => setActiveTab("photo")}
              style={{
                padding: "12px 24px",
                color: activeTab === "photo" ? "#007bff" : "#666",
                cursor: "pointer",
                fontWeight: activeTab === "photo" ? "600" : "400",
                background: activeTab === "photo" ? "#e3f2fd" : "transparent",
                border: "1px solid transparent",
                borderRadius: "6px",
                fontSize: "14px",
                transition: "all 0.2s ease",
                margin: "0 2px"
              }}
            >
              Photo & Signature
            </div>
            <div
              onClick={() => setActiveTab("accounts")}
              style={{
                padding: "12px 24px",
                color: activeTab === "accounts" ? "#007bff" : "#666",
                cursor: "pointer",
                fontWeight: activeTab === "accounts" ? "600" : "400",
                background: activeTab === "accounts" ? "#e3f2fd" : "transparent",
                border: "1px solid transparent",
                borderRadius: "6px",
                fontSize: "14px",
                transition: "all 0.2s ease",
                margin: "0 2px"
              }}
            >
              Accounts
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "personal" && (
            <div>
            <div className="grid2">
                <label>Title
                  <select className="inputz" value={form.title || ""} onChange={e => setForm({ ...form, title: e.target.value })} disabled={!isCreate && !isEdit} required>
                    <option value="">Select Title</option>
                    <option>Mr.</option>
                    <option>Mrs</option>
                    <option>Doctor</option>
                    <option>Miss</option>
                    <option>Ms.</option>
                    <option>Professor</option>
                    <option>Priest</option>
                    <option>Group</option>
                  </select>
                </label>
                <label>Sacco
                  <div className="role-input-wrapper">
                    <input 
                      type="text"
                      className="input" 
                      value={form.saccoId} 
                      onChange={e => setForm({ ...form, saccoId: e.target.value })} 
                      disabled={true}
                      placeholder="Select a sacco"
                      readOnly={true}
                      required
                    />
                    {(isCreate || isEdit) && (
                      <button
                        type="button"
                        className="role-search-btn"
                        onClick={() => setIsSaccoModalOpen(true)}
                        title="Search saccos"
                      >
                        <FiSearch />
                      </button>
                    )}
                  </div>
                </label>
                <label>First Name<input className="input" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} required disabled={!isCreate && !isEdit} /></label>
                <label>Last Name<input className="input" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} required disabled={!isCreate && !isEdit} /></label>
                <label>Gender
                  <div className="role-input-wrapper">
                    <input
                      className="input"
                      value={form.gender || ""}
                      onChange={e => setForm({ ...form, gender: e.target.value })}
                      disabled={true}
                      placeholder="Select a gender"
                      readOnly={true}
                      required
                    />
                    {(isCreate || isEdit) && (
                      <button
                        type="button"
                        className="role-search-btn"
                        onClick={handleOpenGenderModal}
                        title="Search genders"
                      >
                        <FiSearch />
                      </button>
                    )}
                  </div>
                </label>
                <label>Date of Birth<input type="date" className="input" value={form.dateOfBirth || ""} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} required disabled={!isCreate && !isEdit} /></label>
                <label>Nationality<input className="input" value={form.nationality || ""} onChange={e => setForm({ ...form, nationality: e.target.value })} disabled={!isCreate && !isEdit} /></label>
                <label>Identification Type
                  <div className="role-input-wrapper">
                    <input
                      className="input"
                      value={form.identificationType || ""}
                      onChange={e => setForm({ ...form, identificationType: e.target.value })}
                      disabled={true}
                      placeholder="Select an identification type"
                      readOnly={true}
                    />
                    {(isCreate || isEdit) && (
                      <button
                        type="button"
                        className="role-search-btn"
                        onClick={handleOpenIdentificationTypeModal}
                        title="Search identification types"
                      >
                        <FiSearch />
                      </button>
                    )}
                  </div>
                </label>
                <label>Identification Number<input className="input" value={form.identificationNumber || ""} onChange={e => setForm({ ...form, identificationNumber: e.target.value })} disabled={!isCreate && !isEdit} /></label>
                <label>Identification Expiry Date<input type="date" className="input" value={form.identificationExpiryDate || ""} onChange={e => setForm({ ...form, identificationExpiryDate: e.target.value })} disabled={!isCreate && !isEdit} /></label>
                <label>KRA Pin<input className="input" value={form.kraPin || ""} onChange={e => setForm({ ...form, kraPin: e.target.value })} disabled={!isCreate && !isEdit} /></label>
                <label>Category
                  <div className="role-input-wrapper">
                    <input
                      className="input"
                      value={form.category || ""}
                      onChange={e => setForm({ ...form, category: e.target.value })}
                      disabled={true}
                      placeholder="Select a member category"
                      readOnly={true}
                    />
                    {(isCreate || isEdit) && (
                      <button
                        type="button"
                        className="role-search-btn"
                        onClick={handleOpenMemberCategoryModal}
                        title="Search member categories"
                      >
                        <FiSearch />
                      </button>
                    )}
                  </div>
                </label>
                <label>Marital Status<input className="input" value={form.maritalStatus || ""} onChange={e => setForm({ ...form, maritalStatus: e.target.value })} disabled={!isCreate && !isEdit} /></label>
              </div>
              
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
                <button
                  type="button"
                  className="pill"
                  onClick={() => setActiveTab("address")}
                  style={{
                    padding: "8px 16px",
                    fontSize: "14px",
                    minWidth: "auto"
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {activeTab === "address" && (
            <div>
            <div className="grid2">
                <label>Country<input className="input" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} disabled={!isCreate && !isEdit} /></label>
                <label>County<input className="input" value={form.county} onChange={e => setForm({ ...form, county: e.target.value })} disabled={!isCreate && !isEdit} /></label>
                <label>Email<input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} disabled={!isCreate && !isEdit} /></label>
                <label>Personal Phone Number<input className="input" type="tel" value={form.personalPhone} onChange={e => setForm({ ...form, personalPhone: e.target.value })} required disabled={!isCreate && !isEdit} /></label>
                <label>Alternative Phone Number<input className="input" type="tel" value={form.alternativePhone} onChange={e => setForm({ ...form, alternativePhone: e.target.value })} disabled={!isCreate && !isEdit} /></label>
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px" }}>
                <button
                  type="button"
                  className="pill"
                  onClick={() => setActiveTab("personal")}
                  style={{
                    padding: "8px 16px",
                    fontSize: "14px",
                    minWidth: "auto"
                  }}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="pill"
                  onClick={() => setActiveTab("nextOfKin")}
                  style={{
                    padding: "8px 16px",
                    fontSize: "14px",
                    minWidth: "auto"
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {activeTab === "nextOfKin" && (
            <div>
              <div className="grid2" style={{ marginBottom: "20px" }}>
                <label>Title
                  <select className="inputz" value={nextOfKinForm.title || ""} onChange={e => setNextOfKinForm({ ...nextOfKinForm, title: e.target.value })} disabled={!isCreate && !isEdit}>
                    <option value="">Select Title</option>
                    <option>Mr.</option>
                    <option>Mrs</option>
                    <option>Doctor</option>
                    <option>Miss</option>
                    <option>Ms.</option>
                    <option>Professor</option>
                    <option>Priest</option>
                    <option>Group</option>
                  </select>
                </label>
                <label>First Name<input className="input" value={nextOfKinForm.firstName || ""} onChange={e => setNextOfKinForm({ ...nextOfKinForm, firstName: e.target.value })} required disabled={!isCreate && !isEdit} /></label>
                <label>Last Name<input className="input" value={nextOfKinForm.lastName || ""} onChange={e => setNextOfKinForm({ ...nextOfKinForm, lastName: e.target.value })} required disabled={!isCreate && !isEdit} /></label>
                <label>Phone Number<input className="input" type="tel" value={nextOfKinForm.phoneNumber || ""} onChange={e => setNextOfKinForm({ ...nextOfKinForm, phoneNumber: e.target.value })} required disabled={!isCreate && !isEdit} /></label>
                <label>Relation Type
                  <div className="role-input-wrapper">
                    <input
                      className="input"
                      value={nextOfKinForm.relationType || ""}
                      onChange={e => setNextOfKinForm({ ...nextOfKinForm, relationType: e.target.value })}
                      disabled={true}
                      placeholder="Select a relation type"
                      readOnly={true}
                    />
                    {(isCreate || isEdit) && (
                      <button
                        type="button"
                        className="role-search-btn"
                        onClick={handleOpenNextOfKinRelationTypeModal}
                        title="Search next of kin relation types"
                      >
                        <FiSearch />
                      </button>
                    )}
                  </div>
                </label>
                <label>Gender
                  <div className="role-input-wrapper">
                    <input
                      className="input"
                      value={nextOfKinForm.gender || ""}
                      onChange={e => setNextOfKinForm({ ...nextOfKinForm, gender: e.target.value })}
                      disabled={true}
                      placeholder="Select a gender"
                      readOnly={true}
                    />
                    {(isCreate || isEdit) && (
                      <button
                        type="button"
                        className="role-search-btn"
                        onClick={handleOpenNextOfKinGenderModal}
                        title="Search genders"
                      >
                        <FiSearch />
                      </button>
                    )}
                  </div>
                </label>
              </div>
              
              {(isCreate || isEdit) && (
                <div style={{ marginBottom: "20px" }}>
                  <button
                    type="button"
                    className="pill"
                    onClick={addNextOfKin}
                    style={{
                      padding: "8px 16px",
                      fontSize: "14px",
                      minWidth: "auto"
                    }}
                  >
                    {editingNextOfKinIndex >= 0 ? "Update Next of Kin" : "Add Next of Kin"}
                  </button>
                </div>
              )}

              {nextOfKin.length > 0 && (
                <div className="tableContainer">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>First Name</th>
                        <th>Last Name</th>
                        <th>Phone Number</th>
                        <th>Relation Type</th>
                        <th>Gender</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nextOfKin.map((kin, index) => (
                        <tr key={index}>
                          <td>{kin.title}</td>
                          <td>{kin.firstName}</td>
                          <td>{kin.lastName}</td>
                          <td>{kin.phoneNumber}</td>
                          <td>{kin.relationType}</td>
                          <td>{kin.gender}</td>
                          <td className="actions">
                            {(isCreate || isEdit) && (
                              <>
                                <button className="action-btn action-btn--edit" onClick={(e) => { e.preventDefault(); editNextOfKin(index); }} title="Edit">
                                  <FiEdit3 />
                                </button>
                                <button className="action-btn action-btn--delete" onClick={(e) => { e.preventDefault(); deleteNextOfKin(index); }} title="Delete">
                                  <FiTrash2 />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px" }}>
                <button
                  type="button"
                  className="pill"
                  onClick={() => setActiveTab("address")}
                  style={{
                    padding: "8px 16px",
                    fontSize: "14px",
                    minWidth: "auto"
                  }}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="pill"
                  onClick={() => setActiveTab("photo")}
                  style={{
                    padding: "8px 16px",
                    fontSize: "14px",
                    minWidth: "auto"
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {activeTab === "photo" && (
            <div>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "20px" }}>
                {/* Photo Section */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <label style={{ fontWeight: "600", color: "var(--primary-700)", minWidth: "80px" }}>
                    Photo:
                  </label>
                  {(isCreate || isEdit) ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      {photo ? (
                        <>
                          <span style={{ color: "var(--primary-700)", fontWeight: "500" }}>
                            {photo.name}
                          </span>
                          {(photo instanceof File || (photo && photo.isBase64)) && (
                            <button
                              type="button"
                              className="pill"
                              onClick={() => setShowPhotoViewModal(true)}
                              style={{
                                padding: "8px 16px",
                                fontSize: "14px",
                                minWidth: "auto",
                                backgroundColor: "var(--primary-100)",
                                color: "var(--primary-700)"
                              }}
                            >
                              View
                            </button>
                          )}
                          <button
                            type="button"
                            className="pill"
                            onClick={() => setShowPhotoModal(true)}
                            style={{
                              padding: "8px 16px",
                              fontSize: "14px",
                              minWidth: "auto"
                            }}
                          >
                            Replace
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="pill"
                          onClick={() => setShowPhotoModal(true)}
                          style={{
                            padding: "8px 16px",
                            fontSize: "14px",
                            minWidth: "auto"
                          }}
                        >
                          Add
                        </button>
                      )}
                    </div>
                  ) : (
                    <span style={{ color: "var(--muted-text)" }}>
                      {photo ? photo.name : "No photo selected"}
                    </span>
                  )}
                </div>

                {/* Signature Section */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <label style={{ fontWeight: "600", color: "var(--primary-700)", minWidth: "80px" }}>
                    Signature:
                  </label>
                  {(isCreate || isEdit) ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      {signature ? (
                        <>
                          <span style={{ color: "var(--primary-700)", fontWeight: "500" }}>
                            {signature.name}
                          </span>
                          {(signature instanceof File || (signature && signature.isBase64)) && (
                            <button
                              type="button"
                              className="pill"
                              onClick={() => setShowSignatureViewModal(true)}
                              style={{
                                padding: "8px 16px",
                                fontSize: "14px",
                                minWidth: "auto",
                                backgroundColor: "var(--primary-100)",
                                color: "var(--primary-700)"
                              }}
                            >
                              View
                            </button>
                          )}
                          <button
                            type="button"
                            className="pill"
                            onClick={() => setShowSignatureModal(true)}
                            style={{
                              padding: "8px 16px",
                              fontSize: "14px",
                              minWidth: "auto"
                            }}
                          >
                            Replace
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="pill"
                          onClick={() => setShowSignatureModal(true)}
                          style={{
                            padding: "8px 16px",
                            fontSize: "14px",
                            minWidth: "auto"
                          }}
                        >
                          Add
                        </button>
                      )}
                    </div>
                  ) : (
                    <span style={{ color: "var(--muted-text)" }}>
                      {signature ? signature.name : "No signature selected"}
                    </span>
                  )}
                </div>
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px" }}>
                <button
                  type="button"
                  className="pill"
                  onClick={() => setActiveTab("nextOfKin")}
                  style={{
                    padding: "8px 16px",
                    fontSize: "14px",
                    minWidth: "auto"
                  }}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="pill"
                  onClick={() => setActiveTab("accounts")}
                  style={{
                    padding: "8px 16px",
                    fontSize: "14px",
                    minWidth: "auto"
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {activeTab === "accounts" && (
            <div>
              {/* Accounts Linked Section */}
              {!isCreate && (
                <div>
                  <h3 style={{ 
                    marginBottom: "16px", 
                    color: "var(--primary-700)",
                    fontSize: "18px",
                    fontWeight: "600"
                  }}>
                    Accounts Linked
                  </h3>
                  
                  {accountsLoading && (
                    <div style={{ 
                      padding: "20px", 
                      textAlign: "center",
                      color: "var(--primary-700)",
                      backgroundColor: "var(--surface-2)",
                      borderRadius: "8px",
                      border: "1px solid var(--border)"
                    }}>
                      <div style={{ fontSize: "16px", marginBottom: "8px" }}>⏳</div>
                      <p>Loading accounts...</p>
                    </div>
                  )}
                  
                  {accountsError && (
                    <div style={{ 
                      padding: "20px", 
                      textAlign: "center",
                      color: "#dc2626",
                      backgroundColor: "rgba(239, 68, 68, 0.1)",
                      borderRadius: "8px",
                      margin: "16px 0",
                      border: "1px solid rgba(239, 68, 68, 0.2)"
                    }}>
                      <div style={{ fontSize: "16px", marginBottom: "8px" }}>⚠️</div>
                      <p style={{ fontSize: "14px" }}>{accountsError}</p>
                    </div>
                  )}
                  
                  {!accountsLoading && !accountsError && accounts.length === 0 && (
                    <div style={{ 
                      padding: "20px", 
                      textAlign: "center",
                      color: "var(--muted-text)",
                      backgroundColor: "var(--surface-2)",
                      borderRadius: "8px",
                      border: "1px solid var(--border)"
                    }}>
                      <div style={{ fontSize: "32px", marginBottom: "12px" }}>🏦</div>
                      <p style={{ fontSize: "14px" }}>
                        No accounts linked to this member yet.
                      </p>
                      <p style={{ fontSize: "12px", marginTop: "8px", fontStyle: "italic" }}>
                        Accounts will appear here once they are created for this member.
                      </p>
                    </div>
                  )}
                  
                  {!accountsLoading && !accountsError && accounts.length > 0 && (
                    <div className="tableContainer">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Account ID</th>
                            <th>Account Name</th>
                            <th>Product</th>
                            <th>Available Balance</th>
                            <th>Status</th>
                            <th>Created On</th>
                            <th>Created By</th>
                          </tr>
                        </thead>
                        <tbody>
                          {accounts.map((account, index) => (
                            <tr key={account.id || index}>
                              <td 
                                style={{ 
                                  fontFamily: "monospace", 
                                  fontWeight: "600",
                                  cursor: "pointer",
                                  color: "var(--primary-600)",
                                  transition: "color 0.2s ease"
                                }}
                                onClick={() => {
                                  history.push(`/account-form/${account.id}`);
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.color = "var(--primary-700)";
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.color = "var(--primary-600)";
                                }}
                                title="Click to view Account Details"
                              >
                                {account.accountId}
                              </td>
                              <td style={{ fontWeight: "500" }}>
                                {account.accountName}
                              </td>
                              <td>
                                {account.product ? (
                                  <div>
                                    <div style={{ fontWeight: "500" }}>
                                      {account.product.productName}
                                    </div>
                                    <div style={{ fontSize: "12px", color: "var(--muted-text)" }}>
                                      {account.product.productId}
                                    </div>
                                  </div>
                                ) : (
                                  <span style={{ color: "var(--muted-text)" }}>N/A</span>
                                )}
                              </td>
                              <td style={{ 
                                fontFamily: "monospace", 
                                fontWeight: "600",
                                color: account.availableBalance >= 0 ? "var(--success-700)" : "var(--error-700)"
                              }}>
                                KES {parseFloat(account.availableBalance || 0).toLocaleString('en-KE', { 
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2 
                                })}
                              </td>
                              <td>
                                <div 
                                  style={{
                                    display: "inline-block",
                                    padding: "4px 8px",
                                    borderRadius: "12px",
                                    fontSize: "11px",
                                    fontWeight: "600",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                    backgroundColor: 
                                      account.status === "Active" ? "rgba(16, 185, 129, 0.2)" :
                                      account.status === "Inactive" ? "rgba(107, 114, 128, 0.2)" :
                                      account.status === "Suspended" ? "rgba(249, 115, 22, 0.2)" :
                                      account.status === "Closed" ? "rgba(239, 68, 68, 0.2)" :
                                      "rgba(107, 114, 128, 0.2)",
                                    color: 
                                      account.status === "Active" ? "#059669" :
                                      account.status === "Inactive" ? "#6b7280" :
                                      account.status === "Suspended" ? "#ea580c" :
                                      account.status === "Closed" ? "#dc2626" :
                                      "#6b7280",
                                    border: `1px solid ${
                                      account.status === "Active" ? "rgba(16, 185, 129, 0.3)" :
                                      account.status === "Inactive" ? "rgba(107, 114, 128, 0.3)" :
                                      account.status === "Suspended" ? "rgba(249, 115, 22, 0.3)" :
                                      account.status === "Closed" ? "rgba(239, 68, 68, 0.3)" :
                                      "rgba(107, 114, 128, 0.3)"
                                    }`
                                  }}
                                >
                                  {account.status || "Unknown"}
                                </div>
                              </td>
                              <td style={{ fontSize: "13px" }}>
                                {account.createdOn ? new Date(account.createdOn).toLocaleDateString('en-KE') : "N/A"}
                              </td>
                              <td style={{ fontSize: "13px" }}>
                                {account.createdBy || "System"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px" }}>
                <button
                  type="button"
                  className="pill"
                  onClick={() => setActiveTab("photo")}
                  style={{
                    padding: "8px 16px",
                    fontSize: "14px",
                    minWidth: "auto"
                  }}
                >
                  Back
                </button>
                {(isCreate || isEdit) && (
                  <button
                    className="pill"
                    type="submit"
                    style={{
                      padding: "8px 16px",
                      fontSize: "14px",
                      minWidth: "auto"
                    }}
                  >
                    {isCreate ? "Add Member" : "Update Member"}
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

      {/* Photo Upload Modal */}
      {showPhotoModal && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000
          }}
          onClick={() => closeModal('photo')}
        >
          <div 
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "24px",
              width: "90%",
              maxWidth: "500px",
              maxHeight: "80vh",
              overflow: "auto"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 20px 0", color: "var(--primary-700)" }}>Upload Photo</h3>
            
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileInputChange(e, 'photo')}
              style={{ display: "none" }}
              id="photo-input"
            />
            
            <button
              type="button"
              className="pill"
              onClick={() => document.getElementById('photo-input').click()}
              style={{
                width: "100%",
                padding: "12px",
                marginBottom: "20px",
                fontSize: "16px"
              }}
            >
              Choose Photo
            </button>

            <div
              style={{
                width: "100%",
                height: "200px",
                border: `2px dashed ${dragOver ? "#1f9d55" : "#ccc"}`,
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: dragOver ? "#f0f9f0" : "#f9f9f9",
                marginBottom: "20px",
                transition: "all 0.3s ease"
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 'photo')}
            >
              <p style={{ color: "#666", textAlign: "center", margin: 0 }}>
                Drag and drop a photo here
              </p>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <strong>Selected:</strong> {photo ? photo.name : "None"}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button
                type="button"
                className="pill"
                onClick={() => closeModal('photo')}
                style={{
                  padding: "8px 16px",
                  fontSize: "14px"
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="pill"
                onClick={() => closeModal('photo')}
                style={{
                  padding: "8px 16px",
                  fontSize: "14px",
                  backgroundColor: "var(--primary-500)",
                  color: "white"
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signature Upload Modal */}
      {showSignatureModal && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000
          }}
          onClick={() => closeModal('signature')}
        >
          <div 
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "24px",
              width: "90%",
              maxWidth: "500px",
              maxHeight: "80vh",
              overflow: "auto"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 20px 0", color: "var(--primary-700)" }}>Upload Signature</h3>
            
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileInputChange(e, 'signature')}
              style={{ display: "none" }}
              id="signature-input"
            />
            
            <button
              type="button"
              className="pill"
              onClick={() => document.getElementById('signature-input').click()}
              style={{
                width: "100%",
                padding: "12px",
                marginBottom: "20px",
                fontSize: "16px"
              }}
            >
              Choose Signature
            </button>

            <div
              style={{
                width: "100%",
                height: "200px",
                border: `2px dashed ${dragOver ? "#1f9d55" : "#ccc"}`,
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: dragOver ? "#f0f9f0" : "#f9f9f9",
                marginBottom: "20px",
                transition: "all 0.3s ease"
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 'signature')}
            >
              <p style={{ color: "#666", textAlign: "center", margin: 0 }}>
                Drag and drop a signature here
              </p>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <strong>Selected:</strong> {signature ? signature.name : "None"}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button
                type="button"
                className="pill"
                onClick={() => closeModal('signature')}
                style={{
                  padding: "8px 16px",
                  fontSize: "14px"
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="pill"
                onClick={() => closeModal('signature')}
                style={{
                  padding: "8px 16px",
                  fontSize: "14px",
                  backgroundColor: "var(--primary-500)",
                  color: "white"
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo View Modal */}
      {showPhotoViewModal && photo && (photo instanceof File || photo.isBase64) && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10001
          }}
          onClick={() => setShowPhotoViewModal(false)}
        >
          <div 
            style={{
              position: "relative",
              maxWidth: "90vw",
              maxHeight: "90vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowPhotoViewModal(false)}
              style={{
                position: "absolute",
                top: "-40px",
                right: "0",
                background: "none",
                border: "none",
                color: "#ff4444",
                fontSize: "24px",
                cursor: "pointer",
                padding: "8px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "40px",
                height: "40px",
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)"
              }}
            >
              <FiX />
            </button>
            <img
              src={photo instanceof File ? URL.createObjectURL(photo) : photo.data}
              alt="Selected"
              style={{
                width: "90%",
                height: "90%",
                objectFit: "contain",
                borderRadius: "8px",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)"
              }}
            />
          </div>
        </div>
      )}

      {/* Signature View Modal */}
      {showSignatureViewModal && signature && (signature instanceof File || signature.isBase64) && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10001
          }}
          onClick={() => setShowSignatureViewModal(false)}
        >
          <div 
            style={{
              position: "relative",
              maxWidth: "90vw",
              maxHeight: "90vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowSignatureViewModal(false)}
              style={{
                position: "absolute",
                top: "-40px",
                right: "0",
                background: "none",
                border: "none",
                color: "#ff4444",
                fontSize: "24px",
                cursor: "pointer",
                padding: "8px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "40px",
                height: "40px",
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)"
              }}
            >
              <FiX />
            </button>
            <img
              src={signature instanceof File ? URL.createObjectURL(signature) : signature.data}
              alt="Selected signature"
              style={{
                width: "90%",
                height: "90%",
                objectFit: "contain",
                borderRadius: "8px",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)"
              }}
            />
          </div>
        </div>
      )}

      {/* Lookup Modals */}
      <SaccoLookupModal
        isOpen={isSaccoModalOpen}
        onClose={() => setIsSaccoModalOpen(false)}
        onSelectSacco={handleSaccoSelect}
      />

      <GenderLookupModal
        isOpen={isGenderModalOpen}
        onClose={handleCloseGenderModal}
        onSelectGender={handleSelectGender}
      />

      <IdentificationTypesLookupModal
        isOpen={isIdentificationTypeModalOpen}
        onClose={handleCloseIdentificationTypeModal}
        onSelectIdentificationType={handleSelectIdentificationType}
      />

      <NextOfKinRelationTypesLookupModal
        isOpen={isNextOfKinRelationTypeModalOpen}
        onClose={handleCloseNextOfKinRelationTypeModal}
        onSelectRelationType={handleSelectNextOfKinRelationType}
      />

      <MemberCategoriesLookupModal
        isOpen={isMemberCategoryModalOpen}
        onClose={handleCloseMemberCategoryModal}
        onSelectMemberCategory={handleSelectMemberCategory}
      />

      <GenderLookupModal
        isOpen={isNextOfKinGenderModalOpen}
        onClose={handleCloseNextOfKinGenderModal}
        onSelectGender={handleSelectNextOfKinGender}
      />

    </DashboardWrapper>
  );
}

export default MemberForm;


