import React, { useContext, useEffect, useState, useMemo } from "react";
import { AuthContext } from "../helpers/AuthContext";
import { useHistory, useParams, useLocation } from "react-router-dom";
import { FiArrowLeft, FiEdit3, FiTrash2, FiX, FiSearch, FiMoreVertical, FiCheck, FiUserMinus, FiHeart, FiRefreshCw } from "react-icons/fi";
import axios from "axios";
import { useSnackbar } from "../helpers/SnackbarContext";
import DashboardWrapper from '../components/DashboardWrapper';
import GenderLookupModal from '../components/GenderLookupModal';
import IdentificationTypesLookupModal from '../components/IdentificationTypesLookupModal';
import NextOfKinRelationTypesLookupModal from '../components/NextOfKinRelationTypesLookupModal';
import MemberCategoriesLookupModal from '../components/MemberCategoriesLookupModal';
import MemberLookupModal from '../components/MemberLookupModal';
import NationalityLookupModal from '../components/NationalityLookupModal';
import MaritalStatusLookupModal from '../components/MaritalStatusLookupModal';
import PhotoUploadModal from '../components/PhotoUploadModal';
import SignatureUploadModal from '../components/SignatureUploadModal';
import BiometricsUploadModal from '../components/BiometricsUploadModal';
import Pagination from '../components/Pagination';

function MemberForm({ id: propId, isWindowMode = false }) {
  const history = useHistory();
  const { authState, isLoading } = useContext(AuthContext);
  const { id: paramId } = useParams();
  const { search } = useLocation();
  const { showMessage } = useSnackbar();
  
  // Use prop id if in window mode, otherwise use param id
  const id = isWindowMode ? propId : paramId;
  
  const isEdit = new URLSearchParams(search).get("edit") === "1";
  const isCreate = id === "new";
  const isViewingSpecificMember = id && id !== "new";

  // Form mode state: 'create', 'view', 'edit'
  // Default to create mode unless we're viewing a specific member or editing
  const [formMode, setFormMode] = useState(
    isCreate ? 'create' : 
    (isEdit ? 'edit' : 
    (isViewingSpecificMember ? 'view' : 'create'))
  );
  
  // Update form mode when URL parameters change
  useEffect(() => {
    const newIsCreate = id === "new";
    const newIsEdit = new URLSearchParams(search).get("edit") === "1";
    const newIsViewingSpecificMember = id && id !== "new";
    const newFormMode = newIsCreate ? 'create' : 
                       (newIsEdit ? 'edit' : 
                       (newIsViewingSpecificMember ? 'view' : 'create'));
    setFormMode(newFormMode);
  }, [id, search]);
  
  // Actions dropdown state
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [verifierRemarks, setVerifierRemarks] = useState("");
  
  // Audit fields visibility state
  const [showAuditFields, setShowAuditFields] = useState(false);

  const [form, setForm] = useState({
    id: "",
    firstName: "",
    lastName: "",
    title: "",
    category: "",
    gender: "",
    dateOfBirth: "",
    age: "",
    nationality: "",
    identificationType: "",
    identificationNumber: "",
    identificationExpiryDate: "",
    kraPin: "",
    maritalStatus: "",
    country: "",
    county: "",
    subCounty: "",
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
    
    // Corporate-specific fields
    companyName: "",
    registrationNumber: "",
    companyKraPin: "",
    businessType: "",
    businessAddress: "",
    
    // Joint member fields
    jointMembers: [],
    jointMembershipName: "",
    
    // Minor-specific fields
    guardianName: "",
    guardianIdNumber: "",
    guardianKraPin: "",
    guardianPhone: "",
    guardianEmail: "",
    guardianAddress: "",
    guardianRelationship: "",
    
    // Chama-specific fields
    chamaName: "",
    chamaRegistrationNumber: "",
    chamaMembers: [],
    chamaConstitution: "",
    
    // Authorized signatories for corporate and chama
    authorizedSignatories: [],
    
    // Special offers fields
    canSendAssociateSpecialOffer: false,
    canSendOurSpecialOffers: false,
    statementOnline: false,
    mobileAlert: false,
    mobileBanking: false,
    internetBanking: false,
  });

  // Separate state for generated member number (not shown in form)
  const [generatedMemberNo, setGeneratedMemberNo] = useState("");

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
  
  // Joint member form state
  const [jointMemberForm, setJointMemberForm] = useState({
    title: "",
    firstName: "",
    lastName: "",
    identificationType: "",
    identificationNumber: "",
    kraPin: "",
    phoneNumber: "",
    email: "",
    address: "",
  });
  const [editingJointMemberIndex, setEditingJointMemberIndex] = useState(-1);
  
  // Chama member form state
  const [chamaMemberForm, setChamaMemberForm] = useState({
    title: "",
    firstName: "",
    lastName: "",
    identificationType: "",
    identificationNumber: "",
    kraPin: "",
    phoneNumber: "",
    email: "",
    address: "",
  });
  const [editingChamaMemberIndex, setEditingChamaMemberIndex] = useState(-1);
  
  // Authorized signatory form state
  const [signatoryForm, setSignatoryForm] = useState({
    title: "",
    firstName: "",
    lastName: "",
    identificationType: "",
    identificationNumber: "",
    kraPin: "",
    phoneNumber: "",
    email: "",
    position: "",
  });
  const [editingSignatoryIndex, setEditingSignatoryIndex] = useState(-1);
  
  // Field errors state
  const [fieldErrors, setFieldErrors] = useState({});
  
  // Helper function to determine which fields to show based on member category
  const getFieldsForMemberType = (category) => {
    const baseFields = ['title', 'firstName', 'lastName', 'gender', 'dateOfBirth', 'nationality', 'identificationType', 'identificationNumber', 'identificationExpiryDate', 'kraPin', 'maritalStatus', 'country', 'county', 'subCounty', 'email', 'personalPhone', 'alternativePhone'];
    
    switch (category) {
      case 'Individual':
        return baseFields;
      case 'Corporate':
        return [...baseFields, 'companyName', 'registrationNumber', 'companyKraPin', 'businessType', 'businessAddress', 'authorizedSignatories'];
      case 'Joint':
        return [...baseFields, 'jointMembers', 'jointMembershipName'];
      case 'Minor':
        return [...baseFields, 'guardianName', 'guardianIdNumber', 'guardianKraPin', 'guardianPhone', 'guardianEmail', 'guardianAddress', 'guardianRelationship'];
      case 'Chama':
        return [...baseFields, 'chamaName', 'chamaRegistrationNumber', 'chamaMembers', 'chamaConstitution', 'authorizedSignatories'];
      default:
        return baseFields;
    }
  };
  
  // Helper function to check if a field is required
  const isFieldRequired = (fieldName) => {
    const requiredFields = getFieldsForMemberType(form.category);
    return requiredFields.includes(fieldName);
  };
  
  // Photo, Signature, and Biometrics states - now arrays of objects with details
  const [photos, setPhotos] = useState([]);
  const [signatures, setSignatures] = useState([]);
  const [biometrics, setBiometrics] = useState([]);
  
  // Guardian Photo, Signature, and Biometrics states for Minor members
  const [guardianPhotos, setGuardianPhotos] = useState([]);
  const [guardianSignatures, setGuardianSignatures] = useState([]);
  const [guardianBiometrics, setGuardianBiometrics] = useState([]);

  // Product charges states
  const [productCharges, setProductCharges] = useState({});
  const [chargesLoading, setChargesLoading] = useState(false);
  const [chargesError, setChargesError] = useState(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showBiometricsModal, setShowBiometricsModal] = useState(false);
  
  // Guardian modal states
  const [showGuardianPhotoModal, setShowGuardianPhotoModal] = useState(false);
  const [showGuardianSignatureModal, setShowGuardianSignatureModal] = useState(false);
  const [showGuardianBiometricsModal, setShowGuardianBiometricsModal] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [activeTab, setActiveTab] = useState("personal");
  const [completedTabs, setCompletedTabs] = useState(new Set());
  const [currentAllowedTab, setCurrentAllowedTab] = useState("personal");
  
  // Lookup modal states
  const [isGenderModalOpen, setIsGenderModalOpen] = useState(false);
  const [isIdentificationTypeModalOpen, setIsIdentificationTypeModalOpen] = useState(false);
  const [isNextOfKinRelationTypeModalOpen, setIsNextOfKinRelationTypeModalOpen] = useState(false);
  const [isMemberCategoryModalOpen, setIsMemberCategoryModalOpen] = useState(false);
  const [isNextOfKinGenderModalOpen, setIsNextOfKinGenderModalOpen] = useState(false);
  const [isMemberLookupModalOpen, setIsMemberLookupModalOpen] = useState(false);
  const [isChamaMemberLookupModalOpen, setIsChamaMemberLookupModalOpen] = useState(false);
  const [isNationalityModalOpen, setIsNationalityModalOpen] = useState(false);
  const [isMaritalStatusModalOpen, setIsMaritalStatusModalOpen] = useState(false);
  
  // Selected member for lookup
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedChamaMember, setSelectedChamaMember] = useState(null);
  
  // Pagination state for chama members
  const [chamaMembersCurrentPage, setChamaMembersCurrentPage] = useState(1);
  const [chamaMembersItemsPerPage, setChamaMembersItemsPerPage] = useState(10);
  
  // Accounts state
  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState(null);
  
  // Products state for accounts tab
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [creatingAccount, setCreatingAccount] = useState(false);

  useEffect(() => {
    // Only redirect if authentication check is complete and user is not authenticated
    if (!isLoading && !authState.status) {
      history.push("/login");
    }
  }, [authState, isLoading, history]);

  // Close Actions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showActionsDropdown && !event.target.closest('[data-actions-dropdown]')) {
        setShowActionsDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showActionsDropdown]);

  // Generate member number for new members
  const generateMemberNo = () => {
    const randomNum = Math.floor(1000000 + Math.random() * 9000000); // 7 digits
    return `M-${randomNum}`;
  };

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return "";
    
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    
    // Check if the date is valid
    if (isNaN(birthDate.getTime())) return "";
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // If birthday hasn't occurred this year, subtract 1
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age >= 0 ? age.toString() : "";
  };

  // Validate KRA PIN format: A########X (11 characters total)
  const validateKRAPin = (pin) => {
    if (!pin) return true; // Allow empty for optional fields
    
    const kraPinRegex = /^[A-Z]\d{8}[A-Z]$/;
    return kraPinRegex.test(pin);
  };

  // Tab validation functions
  const validatePersonalTab = () => {
    // Base required fields for all member types
    const baseRequiredFields = [
      'identificationType', 'identificationNumber', 
      'identificationExpiryDate', 'category'
    ];
    
    // Add dateOfBirth only for Individual and Minor members
    if (form.category === 'Individual' || form.category === 'Minor') {
      baseRequiredFields.push('dateOfBirth');
    }
    
    // Add personal fields only for Individual and Minor member types
    const personalFields = ['title', 'firstName', 'lastName', 'gender'];
    
    // Add corporate-specific fields for Corporate member type
    const corporateFields = ['companyName', 'registrationNumber', 'companyKraPin', 'businessType', 'businessAddress'];
    
    // Add chama-specific fields for Chama member type
    const chamaFields = ['chamaName', 'chamaConstitution'];
    
    let requiredFields = baseRequiredFields;
    
    if (form.category === 'Individual' || form.category === 'Minor') {
      requiredFields = [...baseRequiredFields, ...personalFields];
    } else if (form.category === 'Corporate') {
      requiredFields = [...baseRequiredFields, ...corporateFields];
    } else if (form.category === 'Chama') {
      requiredFields = [...baseRequiredFields, ...chamaFields];
    }
    
    for (const field of requiredFields) {
      if (!form[field] || form[field].trim() === '') {
        return { isValid: false, message: `Please fill in all required fields in Personal Info tab. Missing: ${field}` };
      }
    }
    
    // Additional validation for marital status (only for Individual members)
    if (form.category === 'Individual' && (!form.maritalStatus || form.maritalStatus.trim() === '')) {
      return { isValid: false, message: 'Please fill in all required fields in Personal Info tab. Missing: maritalStatus' };
    }
    
    // Validate KRA PIN format if provided
    if (form.kraPin && !validateKRAPin(form.kraPin)) {
      return { isValid: false, message: "Please enter a valid KRA PIN format: A########X (11 characters: Letter + 8 digits + Letter)" };
    }
    
    // Validate Company KRA PIN format if provided (for Corporate members)
    if (form.category === 'Corporate' && form.companyKraPin && !validateKRAPin(form.companyKraPin)) {
      return { isValid: false, message: "Please enter a valid Company KRA PIN format: A########X (11 characters: Letter + 8 digits + Letter)" };
    }
    
    return { isValid: true };
  };

  const validateAddressTab = () => {
    const requiredFields = ['personalPhone'];
    
    for (const field of requiredFields) {
      if (!form[field] || form[field].trim() === '') {
        return { isValid: false, message: `Please fill in all required fields in Address tab. Missing: ${field}` };
      }
    }
    
    return { isValid: true };
  };

  const validateNextOfKinTab = () => {
    if (nextOfKin.length === 0) {
      return { isValid: false, message: "Please add at least one next of kin" };
    }
    
    // Validate each next of kin entry
    for (let i = 0; i < nextOfKin.length; i++) {
      const kin = nextOfKin[i];
      const requiredFields = ['firstName', 'lastName', 'phoneNumber'];
      
      for (const field of requiredFields) {
        if (!kin[field] || kin[field].trim() === '') {
          return { isValid: false, message: `Next of kin ${i + 1} is missing required field: ${field}` };
        }
      }
    }
    
    return { isValid: true };
  };

  const validatePhotoTab = () => {
    // For Minor members, require all three uploads for both minor and guardian
    if (form.category === 'Minor') {
      // Check minor's uploads
      if (photos.length === 0) {
        return { isValid: false, message: "Please add a photo for the minor" };
      }
      if (signatures.length === 0) {
        return { isValid: false, message: "Please add a signature for the minor" };
      }
      if (biometrics.length === 0) {
        return { isValid: false, message: "Please add biometrics for the minor" };
      }
      
      // Check guardian's uploads
      if (guardianPhotos.length === 0) {
        return { isValid: false, message: "Please add a photo for the guardian" };
      }
      if (guardianSignatures.length === 0) {
        return { isValid: false, message: "Please add a signature for the guardian" };
      }
      if (guardianBiometrics.length === 0) {
        return { isValid: false, message: "Please add biometrics for the guardian" };
      }
    } else {
      // For other member types, require all three: photo, signature, and biometrics
      if (photos.length === 0) {
        return { isValid: false, message: "Please add a photo" };
      }
      if (signatures.length === 0) {
        return { isValid: false, message: "Please add a signature" };
      }
      if (biometrics.length === 0) {
        return { isValid: false, message: "Please add biometrics" };
      }
    }
    return { isValid: true };
  };

  const validateAccountsTab = () => {
    // Require at least one account to be created
    if (accounts.length === 0) {
      return { isValid: false, message: "Please create at least one account" };
    }
    return { isValid: true };
  };

  const validateChargesTab = () => {
    // Charges tab validation - check if any charges are selected
    if (!form.charges || form.charges.length === 0) {
      return { isValid: false, message: "Please select at least one charge" };
    }
    
    // Validate each selected charge
    for (let i = 0; i < form.charges.length; i++) {
      const charge = form.charges[i];
      if (!charge.chargeId || !charge.name) {
        return { isValid: false, message: `Charge ${i + 1} is missing required information` };
      }
    }
    
    return { isValid: true };
  };

  const validateSpecialOffersTab = () => {
    // Special offers tab validation - all fields are optional, so always valid
    return { isValid: true };
  };

  const validateJointMembersTab = () => {
    if (form.category !== 'Joint') {
      return { isValid: true };
    }
    
    if (!form.jointMembershipName || form.jointMembershipName.trim() === '') {
      return { isValid: false, message: "Joint membership name is required" };
    }
    
    if (!form.jointMembers || form.jointMembers.length === 0) {
      return { isValid: false, message: "Please add at least one joint member" };
    }
    
    // Validate each joint member entry
    for (let i = 0; i < form.jointMembers.length; i++) {
      const member = form.jointMembers[i];
      const requiredFields = ['firstName', 'lastName', 'identificationNumber'];
      
      for (const field of requiredFields) {
        if (!member[field] || member[field].trim() === '') {
          return { isValid: false, message: `Joint member ${i + 1} is missing required field: ${field}` };
        }
      }
    }
    
    return { isValid: true };
  };

  const validateChamaMembersTab = () => {
    if (form.category !== 'Chama') {
      return { isValid: true };
    }
    
    if (!form.chamaMembers || form.chamaMembers.length === 0) {
      return { isValid: false, message: "Please add at least one chama member" };
    }
    
    // Validate each chama member entry
    for (let i = 0; i < form.chamaMembers.length; i++) {
      const member = form.chamaMembers[i];
      const requiredFields = ['firstName', 'lastName', 'identificationNumber'];
      
      for (const field of requiredFields) {
        if (!member[field] || member[field].trim() === '') {
          return { isValid: false, message: `Chama member ${i + 1} is missing required field: ${field}` };
        }
      }
    }
    
    return { isValid: true };
  };

  const validateSignatoriesTab = () => {
    if (form.category !== 'Corporate' && form.category !== 'Chama') {
      return { isValid: true };
    }
    
    if (!form.authorizedSignatories || form.authorizedSignatories.length === 0) {
      return { isValid: false, message: "Please add at least one authorized signatory" };
    }
    
    // Validate each signatory entry
    for (let i = 0; i < form.authorizedSignatories.length; i++) {
      const signatory = form.authorizedSignatories[i];
      const requiredFields = ['firstName', 'lastName', 'identificationNumber'];
      
      for (const field of requiredFields) {
        if (!signatory[field] || signatory[field].trim() === '') {
          return { isValid: false, message: `Authorized signatory ${i + 1} is missing required field: ${field}` };
        }
      }
    }
    
    return { isValid: true };
  };

  // Load products for accounts tab
  const loadProducts = async () => {
    if (productsLoading) return;
    
    setProductsLoading(true);
    setProductsError(null);
    
    try {
      const response = await axios.get("http://localhost:3001/products", {
        headers: { accessToken: localStorage.getItem("accessToken") }
      });
      
      const productsData = response?.data?.entity ?? response?.data;
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (error) {
      console.error("Error loading products:", error);
      setProductsError("Failed to load products");
    } finally {
      setProductsLoading(false);
    }
  };

  // Create account from product
  const createAccountFromProduct = async (product) => {
    if (!form.id || creatingAccount) return;
    
    setCreatingAccount(true);
    
    try {
      const response = await axios.post("http://localhost:3001/accounts/from-product", {
        memberId: form.id,
        productId: product.id,
        remarks: `Account created for ${product.productName}`
      }, {
        headers: { accessToken: localStorage.getItem("accessToken") }
      });
      
      if (response.status === 201) {
        showMessage("Account created successfully", "success");
        // Reload accounts
        const memberId = selectedMember ? selectedMember.id : id;
        if (memberId && memberId !== "new") {
          fetchMemberAccounts(memberId);
        }
        setSelectedProduct(null);
      } else {
        showMessage(response.data?.message || "Failed to create account", "error");
      }
    } catch (error) {
      console.error("Error creating account:", error);
      const errorMessage = error.response?.data?.message || "Failed to create account";
      showMessage(errorMessage, "error");
    } finally {
      setCreatingAccount(false);
    }
  };

  // Get validation function for current tab
  const getTabValidation = (tabName) => {
    switch (tabName) {
      case 'personal': return validatePersonalTab();
      case 'address': return validateAddressTab();
      case 'nextOfKin': return validateNextOfKinTab();
      case 'jointMembers': return validateJointMembersTab();
      case 'chamaMembers': return validateChamaMembersTab();
      case 'signatories': return validateSignatoriesTab();
      case 'photo': return validatePhotoTab();
      case 'accounts': return validateAccountsTab();
      case 'specialOffers': return validateSpecialOffersTab();
      default: return { isValid: true };
    }
  };

  // Define tab order based on member category
  const getTabOrder = () => {
    const baseTabs = ['personal', 'address'];
    
    // Add conditional tabs based on member category
    if (form.category !== 'Corporate') {
      baseTabs.push('nextOfKin');
    }
    
    baseTabs.push('photo');
    
    // Add category-specific tabs
    if (form.category === 'Joint') {
      baseTabs.push('jointMembers');
    } else if (form.category === 'Chama') {
      baseTabs.push('chamaMembers');
    }
    
    if (form.category === 'Corporate' || form.category === 'Chama') {
      baseTabs.push('signatories');
    }
    
    // Always add accounts and special offers at the end
    baseTabs.push('accounts', 'specialOffers');
    
    return baseTabs;
  };
  
  // Get next tab in sequence
  const getNextTab = (currentTab) => {
    const tabOrder = getTabOrder();
    const currentIndex = tabOrder.indexOf(currentTab);
    if (currentIndex !== -1 && currentIndex < tabOrder.length - 1) {
      return tabOrder[currentIndex + 1];
    }
    return null;
  };

  // Check if a tab is accessible (can be navigated to)
  const isTabAccessible = (tabName) => {
    if (formMode === 'view' || formMode === 'edit') return true; // All tabs accessible in view and edit modes
    
    const tabOrder = getTabOrder();
    const currentIndex = tabOrder.indexOf(activeTab);
    const targetIndex = tabOrder.indexOf(tabName);
    
    // Can always go to previous tabs or current tab
    if (targetIndex <= currentIndex) return true;
    
    // Can only go to next tab if current tab is completed
    if (targetIndex === currentIndex + 1) {
      return completedTabs.has(activeTab);
    }
    
    // Cannot skip ahead
    return false;
  };

  // Check if a tab is completed (for green dot indicator)
  const isTabCompleted = (tabName) => {
    if (formMode === 'view' || formMode === 'edit') return true; // All tabs are completed in view and edit modes
    return completedTabs.has(tabName);
  };

  // Check if a tab should show red dot (incomplete)
  const isTabIncomplete = (tabName) => {
    if (formMode === 'view' || formMode === 'edit') return false; // No red dots in view and edit modes
    return !completedTabs.has(tabName);
  };

  // Handle tab change with validation
  const handleTabChange = (newTab) => {
    // Skip validation if in view mode, edit mode, or if going to the same tab
    if (formMode === 'view' || formMode === 'edit' || newTab === activeTab) {
      setActiveTab(newTab);
      return;
    }

    // Redirect Corporate members away from Next of Kin tab
    if (form.category === 'Corporate' && newTab === 'nextOfKin') {
      const tabOrder = getTabOrder();
      const currentIndex = tabOrder.indexOf(activeTab);
      const nextTab = tabOrder[currentIndex + 1] || 'photo';
      setActiveTab(nextTab);
      return;
    }

    // Check if the tab is accessible
    if (!isTabAccessible(newTab)) {
      showMessage("Please complete the current tab before proceeding to the next one", "error");
      return;
    }

    // If going to a previous tab, allow it without validation
    const tabOrder = getTabOrder();
    const currentIndex = tabOrder.indexOf(activeTab);
    const targetIndex = tabOrder.indexOf(newTab);
    
    if (targetIndex < currentIndex) {
      setActiveTab(newTab);
      return;
    }

    // If going to next tab, validate current tab first
    if (targetIndex === currentIndex + 1) {
      const validation = getTabValidation(activeTab);
      if (!validation.isValid) {
        showMessage(validation.message, "error");
        return;
      }
      
      // Mark current tab as completed and allow navigation
      setCompletedTabs(prev => new Set([...prev, activeTab]));
      setCurrentAllowedTab(newTab);
      setActiveTab(newTab);
    }
  };

  // Check if a tab is valid (for visual indicators)
  const isTabValid = (tabName) => {
    if (formMode === 'view') return true; // All tabs are valid in view mode
    return getTabValidation(tabName).isValid;
  };

  // Format KRA PIN input (auto-uppercase and limit length)
  const handleKRAPinChange = (e) => {
    let value = e.target.value.toUpperCase();
    
    // Remove any non-alphanumeric characters
    value = value.replace(/[^A-Z0-9]/g, '');
    
    // Limit to 11 characters
    if (value.length > 11) {
      value = value.substring(0, 11);
    }
    
    setForm({ ...form, kraPin: value });
  };

  // Handle member selection from lookup
  const handleMemberSelect = (member) => {
    setSelectedMember(member);
    setGeneratedMemberNo(member.memberNo);
    
    // Switch to view mode when a member is selected
    setFormMode('view');
    
    // Populate the entire form with the selected member's data
    setForm({
      id: member.id || "",
      firstName: member.firstName || "",
      lastName: member.lastName || "",
      title: member.title || "",
      category: member.category || "",
      gender: member.gender || "",
      dateOfBirth: member.dateOfBirth || "",
      age: calculateAge(member.dateOfBirth || ""),
      nationality: member.nationality || "",
      identificationType: member.identificationType || "",
      identificationNumber: member.identificationNumber || "",
      identificationExpiryDate: member.identificationExpiryDate || "",
      kraPin: member.kraPin || "",
      maritalStatus: member.maritalStatus || "",
      country: member.country || "",
      county: member.county || "",
      subCounty: member.subCounty || "",
      email: member.email || "",
      personalPhone: member.personalPhone || "",
      alternativePhone: member.alternativePhone || "",
      createdBy: member.createdBy || "",
      createdOn: member.createdOn || "",
      modifiedBy: member.modifiedBy || "",
      modifiedOn: member.modifiedOn || "",
      approvedBy: member.approvedBy || "",
      approvedOn: member.approvedOn || "",
      status: member.status || "Pending",
      
      // Corporate-specific fields
      companyName: member.companyName || "",
      registrationNumber: member.registrationNumber || "",
      companyKraPin: member.companyKraPin || "",
      businessType: member.businessType || "",
      businessAddress: member.businessAddress || "",
      
      // Joint member fields
      jointMembers: typeof member.jointMembers === 'string' ? JSON.parse(member.jointMembers || '[]') : (member.jointMembers || []),
      jointMembershipName: member.jointMembershipName || "",
      
      // Minor-specific fields
      guardianName: member.guardianName || "",
      guardianIdNumber: member.guardianIdNumber || "",
      guardianKraPin: member.guardianKraPin || "",
      guardianPhone: member.guardianPhone || "",
      guardianEmail: member.guardianEmail || "",
      guardianAddress: member.guardianAddress || "",
      guardianRelationship: member.guardianRelationship || "",
      
      // Chama-specific fields
      chamaName: member.chamaName || "",
      chamaRegistrationNumber: member.chamaRegistrationNumber || "",
      chamaMembers: typeof member.chamaMembers === 'string' ? JSON.parse(member.chamaMembers || '[]') : (member.chamaMembers || []),
      chamaConstitution: member.chamaConstitution || "",
      
      // Authorized signatories for corporate and chama
      authorizedSignatories: typeof member.authorizedSignatories === 'string' ? JSON.parse(member.authorizedSignatories || '[]') : (member.authorizedSignatories || []),
    });
    
    // Load next of kin data if available
    setNextOfKin(typeof member.nextOfKin === 'string' ? JSON.parse(member.nextOfKin || '[]') : (member.nextOfKin || []));
    
    // Load photo, signature, and biometrics data if available
    // Handle legacy single photo/signature/biometrics or new array format
    if (member.photos && Array.isArray(member.photos)) {
      setPhotos(member.photos);
    } else if (member.photo) {
      // Legacy single photo - convert to array format
      const photoObj = typeof member.photo === 'string' && member.photo.startsWith('data:') 
        ? { name: 'member-photo.jpg', data: member.photo, isBase64: true, createdAt: new Date().toISOString() }
        : member.photo.isBase64 && member.photo.data 
        ? { data: member.photo.data, name: member.photo.name, isBase64: true, createdAt: new Date().toISOString() }
        : { name: member.photo, isBase64: false, createdAt: new Date().toISOString() };
      setPhotos([photoObj]);
      } else {
      setPhotos([]);
    }
    
    if (member.signatures && Array.isArray(member.signatures)) {
      setSignatures(member.signatures);
    } else if (member.signature) {
      // Legacy single signature - convert to array format
      const signatureObj = typeof member.signature === 'string' && member.signature.startsWith('data:') 
        ? { name: 'member-signature.jpg', data: member.signature, isBase64: true, createdAt: new Date().toISOString() }
        : member.signature.isBase64 && member.signature.data 
        ? { data: member.signature.data, name: member.signature.name, isBase64: true, createdAt: new Date().toISOString() }
        : { name: member.signature, isBase64: false, createdAt: new Date().toISOString() };
      setSignatures([signatureObj]);
      } else {
      setSignatures([]);
    }
    
    if (member.biometrics && Array.isArray(member.biometrics)) {
      setBiometrics(member.biometrics);
    } else if (member.biometrics) {
      // Legacy single biometrics - convert to array format
      const biometricsObj = typeof member.biometrics === 'string' && member.biometrics.startsWith('data:') 
        ? { name: 'member-biometrics.jpg', data: member.biometrics, isBase64: true, createdAt: new Date().toISOString() }
        : member.biometrics.isBase64 && member.biometrics.data 
        ? { data: member.biometrics.data, name: member.biometrics.name, isBase64: true, createdAt: new Date().toISOString() }
        : { name: member.biometrics, isBase64: false, createdAt: new Date().toISOString() };
      setBiometrics([biometricsObj]);
      } else {
      setBiometrics([]);
    }
    
    // Load guardian photo, signature, and biometrics data if available (for Minor members)
    if (member.guardianPhotos && Array.isArray(member.guardianPhotos)) {
      setGuardianPhotos(member.guardianPhotos);
    } else {
      setGuardianPhotos([]);
    }
    
    if (member.guardianSignatures && Array.isArray(member.guardianSignatures)) {
      setGuardianSignatures(member.guardianSignatures);
    } else {
      setGuardianSignatures([]);
    }
    
    if (member.guardianBiometrics && Array.isArray(member.guardianBiometrics)) {
      setGuardianBiometrics(member.guardianBiometrics);
    } else {
      setGuardianBiometrics([]);
    }
    
    // Fetch accounts for this member
    if (member.id) {
      fetchMemberAccounts(member.id);
    }
  };

  // Handle chama member selection from lookup
  const handleChamaMemberSelect = (member) => {
    setSelectedChamaMember(member);
    
    // Populate the chama member form with the selected member's data
    setChamaMemberForm({
      title: member.title || "",
      firstName: member.firstName || "",
      lastName: member.lastName || "",
      identificationType: member.identificationType || "",
      identificationNumber: member.identificationNumber || "",
      kraPin: member.kraPin || "",
      phoneNumber: member.personalPhone || member.phoneNumber || "",
      email: member.email || "",
      address: member.address || "",
    });
    
    setIsChamaMemberLookupModalOpen(false);
    showMessage("Member data populated successfully", "success");
  };

  // Fetch accounts for the member
  const fetchMemberAccounts = async (memberId) => {
    if (!memberId || memberId === "new") {
      console.log("Skipping fetchMemberAccounts - invalid memberId:", memberId);
      return;
    }
    
    console.log("Fetching accounts for member ID:", memberId);
    setAccountsLoading(true);
    setAccountsError(null);
    
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("No access token found");
      }
      
      const res = await axios.get(`http://localhost:3001/accounts/member/${memberId}`, {
        headers: { accessToken: token },
      });
      console.log("Accounts response:", res.data);
      
      // Use the same data processing pattern as Member360View
      const data = res.data?.entity || res.data;
      console.log("Processed accounts data:", data);
      console.log("Is array:", Array.isArray(data));
      console.log("Data length:", Array.isArray(data) ? data.length : 'not array');
      
      // Ensure we're setting an array
      const accountsArray = Array.isArray(data) ? data : [];
      console.log("Setting accounts array:", accountsArray);
      setAccounts(accountsArray);
      
      if (accountsArray.length === 0) {
        console.log("No accounts found for member:", memberId);
      }
    } catch (err) {
      console.error("Error fetching member accounts:", err);
      console.error("Error response:", err.response?.data);
      console.error("Error status:", err.response?.status);
      console.error("Error headers:", err.response?.headers);
      
      const errorMessage = err?.response?.data?.message || 
                          err?.response?.data?.error || 
                          err?.message || 
                          "Failed to fetch accounts";
      setAccountsError(errorMessage);
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
        const responseData = res.data?.entity || res.data;
        // Handle both direct member data and nested member data
        const data = responseData.member || responseData;
        setForm({
          id: data.id || "",
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
          subCounty: data.subCounty || "",
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
          
          // Corporate-specific fields
          companyName: data.companyName || "",
          registrationNumber: data.registrationNumber || "",
          companyKraPin: data.companyKraPin || "",
          businessType: data.businessType || "",
          businessAddress: data.businessAddress || "",
          
          // Joint member fields
          jointMembers: typeof data.jointMembers === 'string' ? JSON.parse(data.jointMembers || '[]') : (data.jointMembers || []),
          jointMembershipName: data.jointMembershipName || "",
          
          // Minor-specific fields
          guardianName: data.guardianName || "",
          guardianIdNumber: data.guardianIdNumber || "",
          guardianKraPin: data.guardianKraPin || "",
          guardianPhone: data.guardianPhone || "",
          guardianEmail: data.guardianEmail || "",
          guardianAddress: data.guardianAddress || "",
          guardianRelationship: data.guardianRelationship || "",
          
          // Chama-specific fields
          chamaName: data.chamaName || "",
          chamaRegistrationNumber: data.chamaRegistrationNumber || "",
          chamaMembers: typeof data.chamaMembers === 'string' ? JSON.parse(data.chamaMembers || '[]') : (data.chamaMembers || []),
          chamaConstitution: data.chamaConstitution || "",
          
          // Authorized signatories for corporate and chama
          authorizedSignatories: typeof data.authorizedSignatories === 'string' ? JSON.parse(data.authorizedSignatories || '[]') : (data.authorizedSignatories || []),
        });
        
        // Set the member number for existing members (for display purposes)
        setGeneratedMemberNo(data.memberNo || "");
        
        // Set the selected member for accounts tab functionality
        setSelectedMember(data);
        
        // Load next of kin data if available
        setNextOfKin(typeof data.nextOfKin === 'string' ? JSON.parse(data.nextOfKin || '[]') : (data.nextOfKin || []));
        
        // Load photo, signature, and biometrics data if available
        // Handle legacy single photo/signature/biometrics or new array format
        if (data.photos && Array.isArray(data.photos)) {
          setPhotos(data.photos);
        } else if (data.photo) {
          // Legacy single photo - convert to array format
          const photoObj = typeof data.photo === 'string' && data.photo.startsWith('data:') 
            ? { name: 'member-photo.jpg', data: data.photo, isBase64: true, createdAt: new Date().toISOString() }
            : { name: data.photo, isBase64: false, createdAt: new Date().toISOString() };
          setPhotos([photoObj]);
          } else {
          setPhotos([]);
        }
        
        if (data.signatures && Array.isArray(data.signatures)) {
          setSignatures(data.signatures);
        } else if (data.signature) {
          // Legacy single signature - convert to array format
          const signatureObj = typeof data.signature === 'string' && data.signature.startsWith('data:') 
            ? { name: 'member-signature.jpg', data: data.signature, isBase64: true, createdAt: new Date().toISOString() }
            : { name: data.signature, isBase64: false, createdAt: new Date().toISOString() };
          setSignatures([signatureObj]);
          } else {
          setSignatures([]);
        }
        
        if (data.biometrics && Array.isArray(data.biometrics)) {
          setBiometrics(data.biometrics);
        } else if (data.biometrics) {
          // Legacy single biometrics - convert to array format
          const biometricsObj = typeof data.biometrics === 'string' && data.biometrics.startsWith('data:') 
            ? { name: 'member-biometrics.jpg', data: data.biometrics, isBase64: true, createdAt: new Date().toISOString() }
            : { name: data.biometrics, isBase64: false, createdAt: new Date().toISOString() };
          setBiometrics([biometricsObj]);
          } else {
          setBiometrics([]);
        }
        
        // Load guardian photo, signature, and biometrics data if available (for Minor members)
        if (data.guardianPhotos && Array.isArray(data.guardianPhotos)) {
          setGuardianPhotos(data.guardianPhotos);
        } else {
          setGuardianPhotos([]);
        }
        
        if (data.guardianSignatures && Array.isArray(data.guardianSignatures)) {
          setGuardianSignatures(data.guardianSignatures);
        } else {
          setGuardianSignatures([]);
        }
        
        if (data.guardianBiometrics && Array.isArray(data.guardianBiometrics)) {
          setGuardianBiometrics(data.guardianBiometrics);
        } else {
          setGuardianBiometrics([]);
        }
        
        // Fetch accounts for this member
        await fetchMemberAccounts(id);
      } else {
        // Generate member number for new members
        setGeneratedMemberNo(generateMemberNo());
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isCreate]);

  // Load products when accounts tab is active
  useEffect(() => {
    if (activeTab === "accounts") {
      loadProducts();
    }
  }, [activeTab]);

  // Fetch accounts when accounts tab is activated and member is selected
  useEffect(() => {
    if (activeTab === "accounts" && !isCreate) {
      const memberId = selectedMember?.id || form.id || id;
      if (memberId && memberId !== "new") {
        console.log("Accounts tab activated, fetching accounts for member:", memberId);
        fetchMemberAccounts(memberId);
      }
    }
  }, [activeTab, isCreate, selectedMember, form.id, id]);

  // Fetch charges when accounts tab is activated and accounts are available
  useEffect(() => {
    if (activeTab === "accounts" && !isCreate && accounts.length > 0) {
      console.log("Accounts tab activated, fetching charges for member accounts");
      fetchProductCharges();
    }
  }, [activeTab, isCreate, accounts]);

  // Auto-advance to next tab when current tab is completed
  const checkAndAdvanceTab = () => {
    if (formMode === 'view' || formMode === 'edit') return; // Don't auto-advance in view or edit modes
    
    const currentValidation = getTabValidation(activeTab);
    if (currentValidation.isValid && !completedTabs.has(activeTab)) {
      // Mark current tab as completed
      setCompletedTabs(prev => new Set([...prev, activeTab]));
      
      const nextTab = getNextTab(activeTab);
      if (nextTab) {
        // Update allowed tab to include the next tab
        setCurrentAllowedTab(nextTab);
        
        // Small delay to allow user to see the validation success
        setTimeout(() => {
          setActiveTab(nextTab);
        }, 500);
      }
    }
  };

  // Reset completed tabs when form mode changes or starting new form
  useEffect(() => {
    if (formMode === 'create' && id === 'new') {
      setCompletedTabs(new Set());
      setCurrentAllowedTab('personal');
    }
  }, [formMode, id]);

  // Auto-advance tabs when validation passes
  useEffect(() => {
    // Only auto-advance in create mode and when form has been initialized
    if (formMode === 'create' && form.category) {
      checkAndAdvanceTab();
    }
  }, [form, nextOfKin, form.jointMembers, form.chamaMembers, form.authorizedSignatories, photos, signatures, biometrics, guardianPhotos, guardianSignatures, guardianBiometrics, accounts, activeTab, formMode]);

  // Redirect Corporate members away from Next of Kin tab
  useEffect(() => {
    if (form.category === 'Corporate' && activeTab === 'nextOfKin') {
      const tabOrder = getTabOrder();
      const currentIndex = tabOrder.indexOf(activeTab);
      const nextTab = tabOrder[currentIndex + 1] || 'photo';
      setActiveTab(nextTab);
    }
  }, [form.category, activeTab]);

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

  // Joint member handlers
  const addJointMember = (e) => {
    e.preventDefault();
    if (!jointMemberForm.firstName || !jointMemberForm.lastName || !jointMemberForm.identificationNumber) {
      showMessage("Please fill in all required joint member fields", "error");
      return;
    }
    
    // Ensure jointMembers is always an array
    const currentJointMembers = Array.isArray(form.jointMembers) ? form.jointMembers : [];
    
    if (editingJointMemberIndex >= 0) {
      const updated = [...currentJointMembers];
      updated[editingJointMemberIndex] = { ...jointMemberForm };
      setForm({ ...form, jointMembers: updated });
      setEditingJointMemberIndex(-1);
      showMessage("Joint member updated successfully", "success");
    } else {
      setForm({ ...form, jointMembers: [...currentJointMembers, { ...jointMemberForm }] });
      showMessage("Joint member added successfully", "success");
    }
    
    setJointMemberForm({
      title: "",
      firstName: "",
      lastName: "",
      identificationType: "",
      identificationNumber: "",
      kraPin: "",
      phoneNumber: "",
      email: "",
      address: "",
    });
  };

  const editJointMember = (index) => {
    const currentJointMembers = Array.isArray(form.jointMembers) ? form.jointMembers : [];
    const member = currentJointMembers[index];
    setJointMemberForm({ ...member });
    setEditingJointMemberIndex(index);
  };

  const deleteJointMember = (index) => {
    const currentJointMembers = Array.isArray(form.jointMembers) ? form.jointMembers : [];
    setForm({ ...form, jointMembers: currentJointMembers.filter((_, i) => i !== index) });
    showMessage("Joint member deleted successfully", "success");
  };

  // Chama member handlers
  const addChamaMember = (e) => {
    e.preventDefault();
    if (!chamaMemberForm.firstName || !chamaMemberForm.lastName || !chamaMemberForm.identificationNumber) {
      showMessage("Please fill in all required chama member fields", "error");
      return;
    }
    
    // Ensure chamaMembers is always an array
    const currentChamaMembers = Array.isArray(form.chamaMembers) ? form.chamaMembers : [];
    
    if (editingChamaMemberIndex >= 0) {
      const updated = [...currentChamaMembers];
      updated[editingChamaMemberIndex] = { ...chamaMemberForm };
      setForm({ ...form, chamaMembers: updated });
      setEditingChamaMemberIndex(-1);
      showMessage("Chama member updated successfully", "success");
    } else {
      setForm({ ...form, chamaMembers: [...currentChamaMembers, { ...chamaMemberForm }] });
      showMessage("Chama member added successfully", "success");
      // Reset to first page when adding new member
      setChamaMembersCurrentPage(1);
    }
    
    setChamaMemberForm({
      title: "",
      firstName: "",
      lastName: "",
      identificationType: "",
      identificationNumber: "",
      kraPin: "",
      phoneNumber: "",
      email: "",
      address: "",
    });
  };

  const editChamaMember = (index) => {
    const currentChamaMembers = Array.isArray(form.chamaMembers) ? form.chamaMembers : [];
    const member = currentChamaMembers[index];
    setChamaMemberForm({ ...member });
    setEditingChamaMemberIndex(index);
  };

  const deleteChamaMember = (index) => {
    const currentChamaMembers = Array.isArray(form.chamaMembers) ? form.chamaMembers : [];
    const newChamaMembers = currentChamaMembers.filter((_, i) => i !== index);
    setForm({ ...form, chamaMembers: newChamaMembers });
    
    // Adjust pagination if needed
    const totalPages = Math.ceil(newChamaMembers.length / chamaMembersItemsPerPage);
    if (chamaMembersCurrentPage > totalPages && totalPages > 0) {
      setChamaMembersCurrentPage(totalPages);
    }
    
    showMessage("Chama member deleted successfully", "success");
  };

  // Pagination logic for chama members
  const paginatedChamaMembers = useMemo(() => {
    const chamaMembers = Array.isArray(form.chamaMembers) ? form.chamaMembers : [];
    const startIndex = (chamaMembersCurrentPage - 1) * chamaMembersItemsPerPage;
    const endIndex = startIndex + chamaMembersItemsPerPage;
    return chamaMembers.slice(startIndex, endIndex);
  }, [form.chamaMembers, chamaMembersCurrentPage, chamaMembersItemsPerPage]);

  // Pagination handlers for chama members
  const handleChamaMembersPageChange = (page) => {
    setChamaMembersCurrentPage(page);
  };

  const handleChamaMembersItemsPerPageChange = (newItemsPerPage) => {
    setChamaMembersItemsPerPage(newItemsPerPage);
    setChamaMembersCurrentPage(1); // Reset to first page when changing items per page
  };

  // Authorized signatory handlers
  const addSignatory = (e) => {
    e.preventDefault();
    if (!signatoryForm.firstName || !signatoryForm.lastName || !signatoryForm.identificationNumber) {
      showMessage("Please fill in all required signatory fields", "error");
      return;
    }
    
    // Ensure authorizedSignatories is always an array
    const currentAuthorizedSignatories = Array.isArray(form.authorizedSignatories) ? form.authorizedSignatories : [];
    
    if (editingSignatoryIndex >= 0) {
      const updated = [...currentAuthorizedSignatories];
      updated[editingSignatoryIndex] = { ...signatoryForm };
      setForm({ ...form, authorizedSignatories: updated });
      setEditingSignatoryIndex(-1);
      showMessage("Authorized signatory updated successfully", "success");
    } else {
      setForm({ ...form, authorizedSignatories: [...currentAuthorizedSignatories, { ...signatoryForm }] });
      showMessage("Authorized signatory added successfully", "success");
    }
    
    setSignatoryForm({
      title: "",
      firstName: "",
      lastName: "",
      identificationType: "",
      identificationNumber: "",
      kraPin: "",
      phoneNumber: "",
      email: "",
      position: "",
    });
  };

  const editSignatory = (index) => {
    const currentAuthorizedSignatories = Array.isArray(form.authorizedSignatories) ? form.authorizedSignatories : [];
    const signatory = currentAuthorizedSignatories[index];
    setSignatoryForm({ ...signatory });
    setEditingSignatoryIndex(index);
  };

  const deleteSignatory = (index) => {
    const currentAuthorizedSignatories = Array.isArray(form.authorizedSignatories) ? form.authorizedSignatories : [];
    setForm({ ...form, authorizedSignatories: currentAuthorizedSignatories.filter((_, i) => i !== index) });
    showMessage("Authorized signatory deleted successfully", "success");
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

  // Nationality lookup modal handlers
  const handleOpenNationalityModal = () => setIsNationalityModalOpen(true);
  const handleCloseNationalityModal = () => setIsNationalityModalOpen(false);
  const handleSelectNationality = (selectedNationality) => {
    setForm(prev => ({ 
      ...prev, 
      nationality: selectedNationality.nationalityName
    }));
    setIsNationalityModalOpen(false);
  };

  // Marital Status lookup modal handlers
  const handleOpenMaritalStatusModal = () => setIsMaritalStatusModalOpen(true);
  const handleCloseMaritalStatusModal = () => setIsMaritalStatusModalOpen(false);
  const handleSelectMaritalStatus = (selectedMaritalStatus) => {
    setForm(prev => ({ 
      ...prev, 
      maritalStatus: selectedMaritalStatus.maritalStatusName
    }));
    setIsMaritalStatusModalOpen(false);
  };

  // Actions dropdown handlers
  const handleApprove = () => {
    setShowApprovalModal(true);
    setShowActionsDropdown(false);
  };

  const confirmApproval = async () => {
    try {
      const memberId = selectedMember ? selectedMember.id : id;
      await axios.put(`http://localhost:3001/members/${memberId}/approve`, {
        verifierRemarks: verifierRemarks
      }, { 
        headers: { accessToken: localStorage.getItem("accessToken") } 
      });
      setForm(prev => ({ ...prev, status: "Approved" }));
      showMessage("Member approved successfully", "success");
      setShowApprovalModal(false);
      setVerifierRemarks("");
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to approve member";
      showMessage(msg, "error");
    }
  };

  const handleEdit = () => {
    setFormMode('edit');
    setShowActionsDropdown(false);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
    setShowActionsDropdown(false);
  };

  const confirmDelete = async () => {
    try {
      const memberId = selectedMember ? selectedMember.id : id;
      await axios.delete(`http://localhost:3001/members/${memberId}`, { 
        headers: { accessToken: localStorage.getItem("accessToken") } 
      });
      showMessage("Member deleted successfully", "success");
      setShowDeleteModal(false);
      
      // Reset form state to ensure clean create mode
      setForm({
        id: "",
        firstName: "",
        lastName: "",
        title: "",
        category: "",
        gender: "",
        dateOfBirth: "",
        age: "",
        nationality: "",
        identificationType: "",
        identificationNumber: "",
        identificationExpiryDate: "",
        kraPin: "",
        maritalStatus: "",
        country: "",
        county: "",
        subCounty: "",
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
      
      // Reset other form states
      setNextOfKin([]);
      setNextOfKinForm({
        title: "",
        firstName: "",
        lastName: "",
        phoneNumber: "",
        relationType: "",
        gender: "",
      });
      setPhotos([]);
      setSignatures([]);
      setBiometrics([]);
      setGuardianPhotos([]);
      setGuardianSignatures([]);
      setGuardianBiometrics([]);
      setSelectedMember(null);
      setAccounts([]);
      setActiveTab("personal");
      
      // Generate new member number for create mode
      setGeneratedMemberNo(generateMemberNo());
      
      // Explicitly set form mode to create
      setFormMode('create');
      
      // Redirect to create mode
      history.push("/member-form/new");
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to delete member";
      showMessage(msg, "error");
    }
  };

  const handleMemberWithdrawal = async () => {
    try {
      const memberId = selectedMember ? selectedMember.id : id;
      await axios.put(`http://localhost:3001/members/${memberId}/withdraw`, {}, { 
        headers: { accessToken: localStorage.getItem("accessToken") } 
      });
      setForm(prev => ({ ...prev, status: "Withdrawn" }));
      showMessage("Member withdrawal processed successfully", "success");
      setShowActionsDropdown(false);
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to process member withdrawal";
      showMessage(msg, "error");
    }
  };

  const handleDiseasedMember = async () => {
    try {
      const memberId = selectedMember ? selectedMember.id : id;
      await axios.put(`http://localhost:3001/members/${memberId}/diseased`, {}, { 
        headers: { accessToken: localStorage.getItem("accessToken") } 
      });
      setForm(prev => ({ ...prev, status: "Diseased" }));
      showMessage("Member status updated to diseased", "success");
      setShowActionsDropdown(false);
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to update member status";
      showMessage(msg, "error");
    }
  };

  const handleClearForm = () => {
    // Reset form to initial state
    setForm({
      id: "",
      firstName: "",
      lastName: "",
      title: "",
      category: "",
      gender: "",
      dateOfBirth: "",
      age: "",
      nationality: "",
      identificationType: "",
      identificationNumber: "",
      identificationExpiryDate: "",
      kraPin: "",
      maritalStatus: "",
      country: "",
      county: "",
      subCounty: "",
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
      
      // Corporate-specific fields
      companyName: "",
      registrationNumber: "",
      companyKraPin: "",
      businessType: "",
      businessAddress: "",
      
      // Joint member fields
      jointMembers: [],
      jointMembershipName: "",
      
      // Minor-specific fields
      guardianName: "",
      guardianIdNumber: "",
      guardianKraPin: "",
      guardianPhone: "",
      guardianEmail: "",
      guardianAddress: "",
      guardianRelationship: "",
      
      // Chama-specific fields
      chamaName: "",
      chamaRegistrationNumber: "",
      chamaMembers: [],
      chamaConstitution: "",
      
      // Authorized signatories for corporate and chama
      authorizedSignatories: [],
      
      // Special offers fields
      canSendAssociateSpecialOffer: false,
      canSendOurSpecialOffers: false,
      statementOnline: false,
      mobileAlert: false,
      mobileBanking: false,
      internetBanking: false,
    });

    // Reset other form states
    setNextOfKin([]);
    setNextOfKinForm({
      title: "",
      firstName: "",
      lastName: "",
      phoneNumber: "",
      relationType: "",
      gender: "",
    });
    setEditingNextOfKinIndex(-1);
    
    setJointMemberForm({
      title: "",
      firstName: "",
      lastName: "",
      identificationType: "",
      identificationNumber: "",
      kraPin: "",
      phoneNumber: "",
      email: "",
      address: "",
    });
    setEditingJointMemberIndex(-1);
    
    setChamaMemberForm({
      title: "",
      firstName: "",
      lastName: "",
      identificationType: "",
      identificationNumber: "",
      kraPin: "",
      phoneNumber: "",
      email: "",
      address: "",
    });
    setEditingChamaMemberIndex(-1);
    
    setSignatoryForm({
      title: "",
      firstName: "",
      lastName: "",
      identificationType: "",
      identificationNumber: "",
      kraPin: "",
      phoneNumber: "",
      email: "",
      address: "",
      designation: "",
    });
    setEditingSignatoryIndex(-1);

    // Reset generated member number
    setGeneratedMemberNo("");
    
    // Reset selected member
    setSelectedMember(null);
    
    // Reset completed tabs
    setCompletedTabs(new Set());
    
    // Reset to first tab
    setActiveTab("personal");
    setCurrentAllowedTab("personal");
    
    // Switch to create mode
    setFormMode('create');
    
    // Navigate to new member form
    history.push('/member-form/new');
    
    // Close actions dropdown
    setShowActionsDropdown(false);
    
    showMessage("Form cleared successfully", "success");
  };

  // Photo, Signature, and Biometrics handlers with version tracking
  const handleFileSelect = (file, type) => {
    if (file && file.type.startsWith('image/')) {
      const timestamp = new Date().toISOString();
      const newItem = {
        file: file,
        name: file.name || `${type}_${timestamp.replace(/[:.]/g, '-')}`,
        createdAt: timestamp,
        size: file.size,
        type: file.type,
        isBase64: false
      };

      if (type === 'photo') {
        setPhotos(prev => [newItem, ...prev]);
      } else if (type === 'signature') {
        setSignatures(prev => [newItem, ...prev]);
      } else if (type === 'biometrics') {
        setBiometrics(prev => [newItem, ...prev]);
      }
      showMessage(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully`, "success");
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
    } else if (type === 'biometrics') {
      setShowBiometricsModal(false);
    } else if (type === 'guardianPhoto') {
      setShowGuardianPhotoModal(false);
    } else if (type === 'guardianSignature') {
      setShowGuardianSignatureModal(false);
    } else if (type === 'guardianBiometrics') {
      setShowGuardianBiometricsModal(false);
    } else if (type === 'nextOfKinGender') {
      setIsNextOfKinGenderModalOpen(false);
    }
    setDragOver(false);
  };

  // Guardian-specific file handlers
  const handleGuardianFileSelect = (file, type) => {
    if (file && file.type.startsWith('image/')) {
      const timestamp = new Date().toISOString();
      const newItem = {
        file: file,
        name: file.name || `guardian_${type}_${timestamp.replace(/[:.]/g, '-')}`,
        createdAt: timestamp,
        size: file.size,
        type: file.type,
        isBase64: false
      };

      if (type === 'photo') {
        setGuardianPhotos(prev => [newItem, ...prev]);
      } else if (type === 'signature') {
        setGuardianSignatures(prev => [newItem, ...prev]);
      } else if (type === 'biometrics') {
        setGuardianBiometrics(prev => [newItem, ...prev]);
      }
      showMessage(`Guardian ${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully`, "success");
    } else {
      showMessage("Please select a valid image file", "error");
    }
  };

  // Fetch product charges for member accounts
  const fetchProductCharges = async () => {
    if (!accounts || accounts.length === 0) {
      console.log("No accounts available to fetch charges for");
      return;
    }

    setChargesLoading(true);
    setChargesError(null);

    try {
      const chargesData = {};
      
      // Fetch charges for each account's product
      for (const account of accounts) {
        if (account.productId) {
          try {
            const response = await axios.get(`http://localhost:3001/charges/product/${account.productId}`, {
              headers: { accessToken: localStorage.getItem('accessToken') }
            });
            
            chargesData[account.productId] = {
              product: account.product || { productName: account.productName || 'Unknown Product' },
              charges: response.data || []
            };
          } catch (error) {
            console.error(`Error fetching charges for product ${account.productId}:`, error);
            chargesData[account.productId] = {
              product: account.product || { productName: account.productName || 'Unknown Product' },
              charges: []
            };
          }
        }
      }
      
      setProductCharges(chargesData);
      console.log("Product charges fetched successfully:", chargesData);
    } catch (error) {
      console.error("Error fetching product charges:", error);
      setChargesError("Failed to fetch product charges. Please try again.");
    } finally {
      setChargesLoading(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    
    // Validate KRA PIN format before saving
    if (form.kraPin && !validateKRAPin(form.kraPin)) {
      showMessage("Please enter a valid KRA PIN format: A########X (11 characters: Letter + 8 digits + Letter)", "error");
      return;
    }
    
    // Validate Company KRA PIN format before saving (for Corporate members)
    if (form.category === 'Corporate' && form.companyKraPin && !validateKRAPin(form.companyKraPin)) {
      showMessage("Please enter a valid Company KRA PIN format: A########X (11 characters: Letter + 8 digits + Letter)", "error");
      return;
    }
    
    try {
      // Convert files to base64 if they exist (handle array of files)
      const processPhotos = async () => {
        const processedPhotos = [];
        for (const photo of photos) {
          if (photo.file instanceof File) {
            const base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(photo.file);
        });
            processedPhotos.push({
              name: photo.name,
              data: base64,
              createdAt: photo.createdAt,
              size: photo.size,
              type: photo.type,
              isBase64: true
            });
          } else if (photo.isBase64 && photo.data) {
            processedPhotos.push(photo);
          } else if (photo.name) {
            processedPhotos.push({
              name: photo.name,
              isBase64: false,
              createdAt: photo.createdAt || new Date().toISOString()
            });
          }
        }
        return processedPhotos;
      };

      const processSignatures = async () => {
        const processedSignatures = [];
        for (const signature of signatures) {
          if (signature.file instanceof File) {
            const base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(signature.file);
        });
            processedSignatures.push({
              name: signature.name,
              data: base64,
              createdAt: signature.createdAt,
              size: signature.size,
              type: signature.type,
              isBase64: true
            });
          } else if (signature.isBase64 && signature.data) {
            processedSignatures.push(signature);
          } else if (signature.name) {
            processedSignatures.push({
              name: signature.name,
              isBase64: false,
              createdAt: signature.createdAt || new Date().toISOString()
            });
          }
        }
        return processedSignatures;
      };

      const processBiometrics = async () => {
        const processedBiometrics = [];
        for (const biometric of biometrics) {
          if (biometric.file instanceof File) {
            const base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
              reader.readAsDataURL(biometric.file);
            });
            processedBiometrics.push({
              name: biometric.name,
              data: base64,
              createdAt: biometric.createdAt,
              size: biometric.size,
              type: biometric.type,
              isBase64: true
            });
          } else if (biometric.isBase64 && biometric.data) {
            processedBiometrics.push(biometric);
          } else if (biometric.name) {
            processedBiometrics.push({
              name: biometric.name,
              isBase64: false,
              createdAt: biometric.createdAt || new Date().toISOString()
            });
          }
        }
        return processedBiometrics;
      };

      const processedPhotos = await processPhotos();
      const processedSignatures = await processSignatures();
      const processedBiometrics = await processBiometrics();

      // Process guardian uploads for Minor members
      const processGuardianPhotos = async () => {
        const processedGuardianPhotos = [];
        for (const photo of guardianPhotos) {
          if (photo.file instanceof File) {
            const base64 = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.readAsDataURL(photo.file);
            });
            processedGuardianPhotos.push({
              name: photo.name,
              data: base64,
              isBase64: true,
              createdAt: photo.createdAt
            });
          } else {
            processedGuardianPhotos.push(photo);
          }
        }
        return processedGuardianPhotos;
      };

      const processGuardianSignatures = async () => {
        const processedGuardianSignatures = [];
        for (const signature of guardianSignatures) {
          if (signature.file instanceof File) {
            const base64 = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.readAsDataURL(signature.file);
            });
            processedGuardianSignatures.push({
              name: signature.name,
              data: base64,
              isBase64: true,
              createdAt: signature.createdAt
            });
          } else {
            processedGuardianSignatures.push(signature);
          }
        }
        return processedGuardianSignatures;
      };

      const processGuardianBiometrics = async () => {
        const processedGuardianBiometrics = [];
        for (const biometric of guardianBiometrics) {
          if (biometric.file instanceof File) {
            const base64 = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.readAsDataURL(biometric.file);
            });
            processedGuardianBiometrics.push({
              name: biometric.name,
              data: base64,
              isBase64: true,
              createdAt: biometric.createdAt
            });
          } else {
            processedGuardianBiometrics.push(biometric);
          }
        }
        return processedGuardianBiometrics;
      };

      const processedGuardianPhotos = await processGuardianPhotos();
      const processedGuardianSignatures = await processGuardianSignatures();
      const processedGuardianBiometrics = await processGuardianBiometrics();

      const payload = { 
        ...form, 
        saccoId: authState.saccoId, // Include saccoId from auth state
        memberNo: generatedMemberNo, // Include the generated member number
        nextOfKin,
        photos: processedPhotos,
        signatures: processedSignatures,
        biometrics: processedBiometrics,
        // Add guardian data for Minor members
        ...(form.category === 'Minor' && {
          guardianPhotos: processedGuardianPhotos,
          guardianSignatures: processedGuardianSignatures,
          guardianBiometrics: processedGuardianBiometrics
        })
      };
      
      if (formMode === 'create') {
        // Creating a new member
        const response = await axios.post("http://localhost:3001/members", payload, { headers: { accessToken: localStorage.getItem("accessToken") } });
        showMessage("Member created successfully", "success");
        
        // Get the newly created member ID from the response
        const createdMember = response.data?.entity?.member || response.data?.entity;
        const newMemberId = createdMember?.id;
        
        if (newMemberId) {
          // Create accounts for any pending accounts that were selected
          const pendingAccounts = accounts.filter(account => account.isPending);
          if (pendingAccounts.length > 0) {
            try {
              for (const pendingAccount of pendingAccounts) {
                await axios.post("http://localhost:3001/accounts/from-product", {
                  memberId: newMemberId,
                  productId: pendingAccount.productId,
                  remarks: `Account created during member onboarding for ${pendingAccount.productName}`
                }, {
                  headers: { accessToken: localStorage.getItem("accessToken") }
                });
              }
              showMessage(`Member and ${pendingAccounts.length} account(s) created successfully`, "success");
            } catch (accountError) {
              console.error("Error creating accounts:", accountError);
              showMessage("Member created but some accounts failed to create", "warning");
            }
          }
          
          // Redirect to view mode of the newly created member
          history.push(`/member-form/${newMemberId}`);
        } else {
          // Fallback to member maintenance if we can't get the ID
          history.push("/member-maintenance");
        }
      } else if (formMode === 'edit') {
        // Updating an existing member
        const memberId = selectedMember ? selectedMember.id : id;
        await axios.put(`http://localhost:3001/members/${memberId}`, payload, { headers: { accessToken: localStorage.getItem("accessToken") } });
        showMessage("Member updated successfully", "success");
        setFormMode('view'); // Switch back to view mode after successful update
        
        // Refresh the member data to show updated information
        try {
          const res = await axios.get(`http://localhost:3001/members/${memberId}`, {
            headers: { accessToken: localStorage.getItem("accessToken") },
          });
          const responseData = res.data?.entity || res.data;
          setForm(responseData);
          setSelectedMember(responseData);
        } catch (refreshError) {
          console.error("Error refreshing member data after update:", refreshError);
        }
      }
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to save member";
      showMessage(msg, "error");
    }
  };

  const formContent = (
    <>
      

      <main className="dashboard__content">
        <section className="card" style={{ padding: "24px" }}>
          <form onSubmit={save} >
          {/* Member Lookup - Topmost Element */}
          <div style={{ 
            marginBottom: "24px"
          }}>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: formMode === 'create' ? "1fr auto" : "1fr auto auto", 
              gap: "20px",
              marginBottom: "12px",
              alignItems: "center"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <label style={{ fontWeight: "600", color: "var(--primary-700)", minWidth: "80px" }}>
                  Member
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                  <div className="combined-member-input" style={{ flex: 1 }}>
                    <div className="member-no-section">
                      {selectedMember ? selectedMember.memberNo : "Select a member"}
                    </div>
                    <div className="member-name-section">
                      {selectedMember ? (
                        selectedMember.category === 'Corporate' ? selectedMember.companyName || "" :
                        selectedMember.category === 'Chama' ? selectedMember.chamaName || "" :
                        `${selectedMember.title || ''} ${selectedMember.firstName || ''} ${selectedMember.lastName || ''}`.trim()
                      ) : ""}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="search-icon-external"
                    onClick={() => setIsMemberLookupModalOpen(true)}
                    title="Search members"
                    disabled={formMode === 'view'}
                  >
                    <FiSearch />
                  </button>
                </div>
              </div>
              
              {/* Status Badge - Only show in view and edit modes */}
              {(formMode === 'view' || formMode === 'edit') && (
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
              )}
              
              {/* Actions Button */}
              {formMode !== 'create' && (
                <div style={{ position: "relative" }} data-actions-dropdown>
                <button
                  type="button"
                  className="pill"
                  onClick={() => setShowActionsDropdown(!showActionsDropdown)}
                  style={{
                    padding: "12px 16px",
                    fontSize: "14px",
                    fontWeight: "600",
                    backgroundColor: "var(--primary-500)",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    minWidth: "120px",
                    justifyContent: "center"
                  }}
                >
                  <FiMoreVertical />
                  Actions
                </button>
                
                {/* Actions Dropdown */}
                {showActionsDropdown && (
                  <div style={{
                    position: "absolute",
                    top: "100%",
                    right: "0",
                    marginTop: "8px",
                    backgroundColor: "white",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                    zIndex: 1000,
                    minWidth: "200px",
                    overflow: "hidden"
                  }}>
                    <button
                      type="button"
                      onClick={handleClearForm}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: "none",
                        backgroundColor: "transparent",
                        textAlign: "left",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        fontSize: "14px",
                        color: "var(--text-primary)",
                        transition: "background-color 0.2s ease"
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = "var(--surface-2)"}
                      onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                    >
                      <FiRefreshCw style={{ color: "var(--primary-600)" }} />
                      Clear Form
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleApprove}
                      disabled={form.status === "Approved"}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: "none",
                        backgroundColor: "transparent",
                        textAlign: "left",
                        cursor: form.status === "Approved" ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        fontSize: "14px",
                        color: form.status === "Approved" ? "var(--text-disabled)" : "var(--text-primary)",
                        transition: "background-color 0.2s ease",
                        opacity: form.status === "Approved" ? 0.5 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (form.status !== "Approved") {
                          e.target.style.backgroundColor = "var(--surface-2)";
                        }
                      }}
                      onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                    >
                      <FiCheck style={{ color: form.status === "Approved" ? "var(--text-disabled)" : "var(--success-600)" }} />
                      Approve
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleEdit}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: "none",
                        backgroundColor: "transparent",
                        textAlign: "left",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        fontSize: "14px",
                        color: "var(--text-primary)",
                        transition: "background-color 0.2s ease"
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = "var(--surface-2)"}
                      onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                    >
                      <FiEdit3 style={{ color: "var(--primary-600)" }} />
                      Edit
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleDelete}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: "none",
                        backgroundColor: "transparent",
                        textAlign: "left",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        fontSize: "14px",
                        color: "var(--text-primary)",
                        transition: "background-color 0.2s ease"
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = "var(--surface-2)"}
                      onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                    >
                      <FiTrash2 style={{ color: "var(--error-600)" }} />
                      Delete
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleMemberWithdrawal}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: "none",
                        backgroundColor: "transparent",
                        textAlign: "left",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        fontSize: "14px",
                        color: "var(--text-primary)",
                        transition: "background-color 0.2s ease"
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = "var(--surface-2)"}
                      onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                    >
                      <FiUserMinus style={{ color: "var(--warning-600)" }} />
                      Member Withdrawal
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleDiseasedMember}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: "none",
                        backgroundColor: "transparent",
                        textAlign: "left",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        fontSize: "14px",
                        color: "var(--text-primary)",
                        transition: "background-color 0.2s ease"
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = "var(--surface-2)"}
                      onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                    >
                      <FiHeart style={{ color: "var(--error-600)" }} />
                      Diseased Member
                    </button>
                  </div>
                )}
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
            background: "#e3f2fd",
            padding: "4px"
          }}>
            <div
              onClick={() => handleTabChange("personal")}
              style={{
                padding: "12px 24px",
                color: activeTab === "personal" ? "#007bff" : "#666",
                cursor: "pointer",
                fontWeight: activeTab === "personal" ? "600" : "400",
                background: activeTab === "personal" ? "#fff" : "transparent",
                border: "1px solid transparent",
                borderRadius: "6px",
                fontSize: "14px",
                transition: "all 0.2s ease",
                margin: "0 2px",
                position: "relative"
              }}
            >
              Personal Info
              {isTabIncomplete("personal") && (
                <span style={{
                  position: "absolute",
                  top: "4px",
                  right: "4px",
                  width: "8px",
                  height: "8px",
                  backgroundColor: "#ef4444",
                  borderRadius: "50%",
                  display: "inline-block"
                }} title="Incomplete tab"></span>
              )}
              {isTabCompleted("personal") && (
                <span style={{
                  position: "absolute",
                  top: "4px",
                  right: "4px",
                  width: "8px",
                  height: "8px",
                  backgroundColor: "#10b981",
                  borderRadius: "50%",
                  display: "inline-block"
                }} title="Tab completed"></span>
              )}
            </div>
            <div
              onClick={() => handleTabChange("address")}
              style={{
                padding: "12px 24px",
                color: activeTab === "address" ? "#007bff" : "#666",
                cursor: "pointer",
                fontWeight: activeTab === "address" ? "600" : "400",
                background: activeTab === "address" ? "#fff" : "transparent",
                border: "1px solid transparent",
                borderRadius: "6px",
                fontSize: "14px",
                transition: "all 0.2s ease",
                margin: "0 2px",
                position: "relative"
              }}
            >
              Address
              {isTabIncomplete("address") && (
                <span style={{
                  position: "absolute",
                  top: "4px",
                  right: "4px",
                  width: "8px",
                  height: "8px",
                  backgroundColor: "#ef4444",
                  borderRadius: "50%",
                  display: "inline-block"
                }} title="Incomplete tab"></span>
              )}
              {isTabCompleted("address") && (
                <span style={{
                  position: "absolute",
                  top: "4px",
                  right: "4px",
                  width: "8px",
                  height: "8px",
                  backgroundColor: "#10b981",
                  borderRadius: "50%",
                  display: "inline-block"
                }} title="Tab completed"></span>
              )}
            </div>
            {form.category !== 'Corporate' && (
              <div
                onClick={() => handleTabChange("nextOfKin")}
                style={{
                  padding: "12px 24px",
                  color: activeTab === "nextOfKin" ? "#007bff" : "#666",
                  cursor: "pointer",
                  fontWeight: activeTab === "nextOfKin" ? "600" : "400",
                  background: activeTab === "nextOfKin" ? "#fff" : "transparent",
                  border: "1px solid transparent",
                  borderRadius: "6px",
                  fontSize: "14px",
                  transition: "all 0.2s ease",
                  margin: "0 2px",
                  position: "relative"
                }}
              >
                Next of Kin
                {isTabIncomplete("nextOfKin") && (
                  <span style={{
                    position: "absolute",
                    top: "4px",
                    right: "4px",
                    width: "8px",
                    height: "8px",
                    backgroundColor: "#ef4444",
                    borderRadius: "50%",
                    display: "inline-block"
                  }} title="Incomplete tab"></span>
                )}
                {isTabCompleted("nextOfKin") && (
                  <span style={{
                    position: "absolute",
                    top: "4px",
                    right: "4px",
                    width: "8px",
                    height: "8px",
                    backgroundColor: "#10b981",
                    borderRadius: "50%",
                    display: "inline-block"
                  }} title="Tab completed"></span>
                )}
              </div>
            )}
            <div
              onClick={() => handleTabChange("photo")}
              style={{
                padding: "12px 24px",
                color: activeTab === "photo" ? "#007bff" : "#666",
                cursor: "pointer",
                fontWeight: activeTab === "photo" ? "600" : "400",
                background: activeTab === "photo" ? "#fff" : "transparent",
                border: "1px solid transparent",
                borderRadius: "6px",
                fontSize: "14px",
                transition: "all 0.2s ease",
                margin: "0 2px",
                position: "relative"
              }}
            >
              Photo, Signature & Biometrics
              {isTabIncomplete("photo") && (
                <span style={{
                  position: "absolute",
                  top: "4px",
                  right: "4px",
                  width: "8px",
                  height: "8px",
                  backgroundColor: "#ef4444",
                  borderRadius: "50%",
                  display: "inline-block"
                }} title="Incomplete tab"></span>
              )}
              {isTabCompleted("photo") && (
                <span style={{
                  position: "absolute",
                  top: "4px",
                  right: "4px",
                  width: "8px",
                  height: "8px",
                  backgroundColor: "#10b981",
                  borderRadius: "50%",
                  display: "inline-block"
                }} title="Tab completed"></span>
              )}
            </div>
            
            {/* Dynamic tabs based on member category */}
            {form.category === 'Joint' && (
              <div
                onClick={() => handleTabChange("jointMembers")}
                style={{
                  padding: "12px 24px",
                  color: activeTab === "jointMembers" ? "#007bff" : "#666",
                  cursor: "pointer",
                  fontWeight: activeTab === "jointMembers" ? "600" : "400",
                  background: activeTab === "jointMembers" ? "#fff" : "transparent",
                  border: "1px solid transparent",
                  borderRadius: "6px",
                  fontSize: "14px",
                  transition: "all 0.2s ease",
                  margin: "0 2px",
                  position: "relative"
                }}
              >
                Joint Members
                {isTabIncomplete("jointMembers") && (
                  <span style={{
                    position: "absolute",
                    top: "4px",
                    right: "4px",
                    width: "8px",
                    height: "8px",
                    backgroundColor: "#ef4444",
                    borderRadius: "50%",
                    display: "inline-block"
                  }} title="Incomplete tab"></span>
                )}
                {isTabCompleted("jointMembers") && (
                  <span style={{
                    position: "absolute",
                    top: "4px",
                    right: "4px",
                    width: "8px",
                    height: "8px",
                    backgroundColor: "#10b981",
                    borderRadius: "50%",
                    display: "inline-block"
                  }} title="Tab completed"></span>
                )}
              </div>
            )}
            
            {form.category === 'Chama' && (
              <div
                onClick={() => handleTabChange("chamaMembers")}
                style={{
                  padding: "12px 24px",
                  color: activeTab === "chamaMembers" ? "#007bff" : "#666",
                  cursor: "pointer",
                  fontWeight: activeTab === "chamaMembers" ? "600" : "400",
                  background: activeTab === "chamaMembers" ? "#fff" : "transparent",
                  border: "1px solid transparent",
                  borderRadius: "6px",
                  fontSize: "14px",
                  transition: "all 0.2s ease",
                  margin: "0 2px",
                  position: "relative"
                }}
              >
                Chama Members
                {isTabIncomplete("chamaMembers") && (
                  <span style={{
                    position: "absolute",
                    top: "4px",
                    right: "4px",
                    width: "8px",
                    height: "8px",
                    backgroundColor: "#ef4444",
                    borderRadius: "50%",
                    display: "inline-block"
                  }} title="Incomplete tab"></span>
                )}
                {isTabCompleted("chamaMembers") && (
                  <span style={{
                    position: "absolute",
                    top: "4px",
                    right: "4px",
                    width: "8px",
                    height: "8px",
                    backgroundColor: "#10b981",
                    borderRadius: "50%",
                    display: "inline-block"
                  }} title="Tab completed"></span>
                )}
              </div>
            )}
            
            {(form.category === 'Corporate' || form.category === 'Chama') && (
              <div
                onClick={() => handleTabChange("signatories")}
                style={{
                  padding: "12px 24px",
                  color: activeTab === "signatories" ? "#007bff" : "#666",
                  cursor: "pointer",
                  fontWeight: activeTab === "signatories" ? "600" : "400",
                  background: activeTab === "signatories" ? "#fff" : "transparent",
                  border: "1px solid transparent",
                  borderRadius: "6px",
                  fontSize: "14px",
                  transition: "all 0.2s ease",
                  margin: "0 2px",
                  position: "relative"
                }}
              >
                Signatories
                {isTabIncomplete("signatories") && (
                  <span style={{
                    position: "absolute",
                    top: "4px",
                    right: "4px",
                    width: "8px",
                    height: "8px",
                    backgroundColor: "#ef4444",
                    borderRadius: "50%",
                    display: "inline-block"
                  }} title="Incomplete tab"></span>
                )}
                {isTabCompleted("signatories") && (
                  <span style={{
                    position: "absolute",
                    top: "4px",
                    right: "4px",
                    width: "8px",
                    height: "8px",
                    backgroundColor: "#10b981",
                    borderRadius: "50%",
                    display: "inline-block"
                  }} title="Tab completed"></span>
                )}
              </div>
            )}
            
            <div
              onClick={() => handleTabChange("accounts")}
              style={{
                padding: "12px 24px",
                color: activeTab === "accounts" ? "#007bff" : "#666",
                cursor: "pointer",
                fontWeight: activeTab === "accounts" ? "600" : "400",
                background: activeTab === "accounts" ? "#fff" : "transparent",
                border: "1px solid transparent",
                borderRadius: "6px",
                fontSize: "14px",
                transition: "all 0.2s ease",
                margin: "0 2px",
                position: "relative"
              }}
            >
              Accounts
              {isTabIncomplete("accounts") && (
                <span style={{
                  position: "absolute",
                  top: "4px",
                  right: "4px",
                  width: "8px",
                  height: "8px",
                  backgroundColor: "#ef4444",
                  borderRadius: "50%",
                  display: "inline-block"
                }} title="Incomplete tab"></span>
              )}
              {isTabCompleted("accounts") && (
                <span style={{
                  position: "absolute",
                  top: "4px",
                  right: "4px",
                  width: "8px",
                  height: "8px",
                  backgroundColor: "#10b981",
                  borderRadius: "50%",
                  display: "inline-block"
                }} title="Tab completed"></span>
              )}
            </div>
            <div
              onClick={() => handleTabChange("specialOffers")}
              style={{
                padding: "12px 24px",
                color: activeTab === "specialOffers" ? "#007bff" : "#666",
                cursor: "pointer",
                fontWeight: activeTab === "specialOffers" ? "600" : "400",
                background: activeTab === "specialOffers" ? "#fff" : "transparent",
                border: "1px solid transparent",
                borderRadius: "6px",
                fontSize: "14px",
                transition: "all 0.2s ease",
                margin: "0 2px",
                position: "relative"
              }}
            >
              Special Offers
              {isTabIncomplete("specialOffers") && (
                <span style={{
                  position: "absolute",
                  top: "4px",
                  right: "4px",
                  width: "8px",
                  height: "8px",
                  backgroundColor: "#ef4444",
                  borderRadius: "50%",
                  display: "inline-block"
                }} title="Incomplete tab"></span>
              )}
              {isTabCompleted("specialOffers") && (
                <span style={{
                  position: "absolute",
                  top: "4px",
                  right: "4px",
                  width: "8px",
                  height: "8px",
                  backgroundColor: "#10b981",
                  borderRadius: "50%",
                  display: "inline-block"
                }} title="Tab completed"></span>
              )}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "personal" && (
            <div>
            <div className="grid4">
                <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                  <span style={{ whiteSpace: 'nowrap' }}>
                    <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Member Type</span> <span style={{ color: '#ef4444' }}>*</span>
                  </span>
                  <div className="role-input-wrapper">
                    <input
                      className="input"
                      value={form.category || ""}
                      onChange={e => setForm({ ...form, category: e.target.value })}
                      disabled={true}
                      placeholder="Select a member Type"
                      readOnly={true}
                    />
                    {formMode !== 'view' && (
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
                {/* Personal fields - only show for Individual and Minor members */}
                {(form.category === 'Individual' || form.category === 'Minor') && (
                  <>
                    <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                      <span style={{ whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Title</span>{isFieldRequired('title') && <span style={{ color: '#ef4444' }}>*</span>}
                      </span>
                      <select className="inputz" value={form.title || ""} onChange={e => setForm({ ...form, title: e.target.value })} disabled={formMode === 'view'} required>
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
                    <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                      <span style={{ whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>First Name</span>{isFieldRequired('firstName') && <span style={{ color: '#ef4444' }}>*</span>}
                      </span>
                      <input className="input" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} required disabled={formMode === 'view'} />
                    </label>
                    <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                      <span style={{ whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Last Name</span>{isFieldRequired('lastName') && <span style={{ color: '#ef4444' }}>*</span>}
                      </span>
                      <input className="input" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} required disabled={formMode === 'view'} />
                    </label>
                    <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                      <span style={{ whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Gender</span>{isFieldRequired('gender') && <span style={{ color: '#ef4444' }}>*</span>}
                      </span>
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
                        {formMode !== 'view' && (
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
                    <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                      <span style={{ whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Date of Birth</span>{isFieldRequired('dateOfBirth') && <span style={{ color: '#ef4444' }}>*</span>}
                      </span>
                      <input type="date" className="input" value={form.dateOfBirth || ""} onChange={e => setForm({ ...form, dateOfBirth: e.target.value, age: calculateAge(e.target.value) })} required disabled={formMode === 'view'} />
                    </label>
                    <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                      <span style={{ whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Age</span>
                      </span>
                      <input type="text" className="input" value={form.age || ""} disabled placeholder="Auto-calculated" />
                    </label>
                  </>
                )}
                <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                  <span style={{ whiteSpace: 'nowrap' }}>
                    <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Nationality</span>{isFieldRequired('nationality') && <span style={{ color: '#ef4444' }}>*</span>}
                  </span>
                  <div className="role-input-wrapper">
                    <input
                      className="input"
                      value={form.nationality || ""}
                      onChange={e => setForm({ ...form, nationality: e.target.value })}
                      disabled={true}
                      placeholder="Select a nationality"
                      readOnly={true}
                    />
                    {formMode !== 'view' && (
                      <button
                        type="button"
                        className="role-search-btn"
                        onClick={handleOpenNationalityModal}
                        title="Search nationalities"
                      >
                        <FiSearch />
                      </button>
                    )}
                  </div>
                </label>
                <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                  <span style={{ whiteSpace: 'nowrap' }}>
                    <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Identification Type</span>{isFieldRequired('identificationType') && <span style={{ color: '#ef4444' }}>*</span>}
                  </span>
                  <div className="role-input-wrapper">
                    <input
                      className="input"
                      value={form.identificationType || ""}
                      onChange={e => setForm({ ...form, identificationType: e.target.value })}
                      disabled={true}
                      placeholder="Select an identification type"
                      readOnly={true}
                    />
                    {formMode !== 'view' && (
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
                <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                  <span style={{ whiteSpace: 'nowrap' }}>
                    <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Identification Number</span>{isFieldRequired('identificationNumber') && <span style={{ color: '#ef4444' }}>*</span>}
                  </span>
                  <input className="input" value={form.identificationNumber || ""} onChange={e => setForm({ ...form, identificationNumber: e.target.value })} disabled={formMode === 'view'} />
                </label>
                <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                  <span style={{ whiteSpace: 'nowrap' }}>
                    <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Identification Expiry Date</span>{isFieldRequired('identificationExpiryDate') && <span style={{ color: '#ef4444' }}>*</span>}
                  </span>
                  <input type="date" className="input" value={form.identificationExpiryDate || ""} onChange={e => setForm({ ...form, identificationExpiryDate: e.target.value })} disabled={formMode === 'view'} />
                </label>
                <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                  KRA Pin
                  <input 
                    className="input" 
                    value={form.kraPin || ""} 
                    onChange={handleKRAPinChange}
                    disabled={formMode === 'view'}
                    placeholder="E.g. A12345678X"
                    maxLength={11}
                    style={{
                      borderColor: form.kraPin && !validateKRAPin(form.kraPin) ? "var(--error-500)" : undefined,
                      backgroundColor: form.kraPin && !validateKRAPin(form.kraPin) ? "rgba(239, 68, 68, 0.05)" : undefined
                    }}
                  />
                  {form.kraPin && !validateKRAPin(form.kraPin) && (
                    <div style={{
                      fontSize: "12px",
                      color: "var(--error-600)",
                      marginTop: "4px",
                      fontWeight: "500"
                    }}>
                      Format: A########X (11 characters: Letter + 8 digits + Letter)
                    </div>
                  )}
                </label>
                {/* Marital Status - only show for Individual member type */}
                {form.category === 'Individual' && (
                  <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                    <span style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Marital Status</span>{isFieldRequired('maritalStatus') && <span style={{ color: '#ef4444' }}>*</span>}
                    </span>
                    <div className="role-input-wrapper">
                      <input
                        className="input"
                        value={form.maritalStatus || ""}
                        onChange={e => setForm({ ...form, maritalStatus: e.target.value })}
                        disabled={true}
                        placeholder="Select a marital status"
                        readOnly={true}
                      />
                      {formMode !== 'view' && (
                        <button
                          type="button"
                          className="role-search-btn"
                          onClick={handleOpenMaritalStatusModal}
                          title="Search marital statuses"
                        >
                          <FiSearch />
                        </button>
                      )}
                    </div>
                  </label>
                )}
              </div>

              {/* Dynamic fields based on member category */}
              {form.category === 'Corporate' && (
                <div style={{ marginTop: "30px", padding: "20px", border: "1px solid #e5e7eb", borderRadius: "8px", backgroundColor: "#f9fafb" }}>
                  <h3 style={{ color: "var(--primary-700)", marginBottom: "20px", fontSize: "18px", fontWeight: "600" }}>Corporate Information</h3>
                  <div className="grid4">
                    <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                      <span style={{ whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Company Name</span>{isFieldRequired('companyName') && <span style={{ color: '#ef4444' }}>*</span>}
                      </span>
                      <input className="input" value={form.companyName || ""} onChange={e => setForm({ ...form, companyName: e.target.value })} disabled={formMode === 'view'} required />
                    </label>
                    <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                      <span style={{ whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Registration Number</span>{isFieldRequired('registrationNumber') && <span style={{ color: '#ef4444' }}>*</span>}
                      </span>
                      <input className="input" value={form.registrationNumber || ""} onChange={e => setForm({ ...form, registrationNumber: e.target.value })} disabled={formMode === 'view'} required />
                    </label>
                    <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                      <span style={{ whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Company KRA PIN</span>{isFieldRequired('companyKraPin') && <span style={{ color: '#ef4444' }}>*</span>}
                      </span>
                      <input 
                        className="input" 
                        value={form.companyKraPin || ""} 
                        onChange={e => setForm({ ...form, companyKraPin: e.target.value })} 
                        disabled={formMode === 'view'} 
                        placeholder="E.g. A12345678X"
                        maxLength={11}
                        style={{
                          borderColor: form.companyKraPin && !validateKRAPin(form.companyKraPin) ? "var(--error-500)" : undefined,
                          backgroundColor: form.companyKraPin && !validateKRAPin(form.companyKraPin) ? "rgba(239, 68, 68, 0.05)" : undefined
                        }}
                      />
                      {form.companyKraPin && !validateKRAPin(form.companyKraPin) && (
                        <div style={{
                          fontSize: "12px",
                          color: "var(--error-600)",
                          marginTop: "4px",
                          fontWeight: "500"
                        }}>
                          Invalid KRA PIN format. Use: A########X (11 characters: Letter + 8 digits + Letter)
                        </div>
                      )}
                    </label>
                    <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                      <span style={{ whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Business Type</span>{isFieldRequired('businessType') && <span style={{ color: '#ef4444' }}>*</span>}
                      </span>
                      <input className="input" value={form.businessType || ""} onChange={e => setForm({ ...form, businessType: e.target.value })} disabled={formMode === 'view'} />
                    </label>
                    <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                      <span style={{ whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Business Address</span>{isFieldRequired('businessAddress') && <span style={{ color: '#ef4444' }}>*</span>}
                      </span>
                      <textarea className="input" value={form.businessAddress || ""} onChange={e => setForm({ ...form, businessAddress: e.target.value })} disabled={formMode === 'view'} rows="3" />
                    </label>
                  </div>
                </div>
              )}

              {form.category === 'Minor' && (
                <div style={{ marginTop: "30px", padding: "20px", border: "1px solid #e5e7eb", borderRadius: "8px", backgroundColor: "#f9fafb" }}>
                  <h3 style={{ color: "var(--primary-700)", marginBottom: "20px", fontSize: "18px", fontWeight: "600" }}>Guardian Information</h3>
                  <div className="grid4">
                    <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                      <span style={{ whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Guardian Name</span>{isFieldRequired('guardianName') && <span style={{ color: '#ef4444' }}>*</span>}
                      </span>
                      <input className="input" value={form.guardianName || ""} onChange={e => setForm({ ...form, guardianName: e.target.value })} disabled={formMode === 'view'} required />
                    </label>
                    <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                      <span style={{ whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Guardian ID Number</span>{isFieldRequired('guardianIdNumber') && <span style={{ color: '#ef4444' }}>*</span>}
                      </span>
                      <input className="input" value={form.guardianIdNumber || ""} onChange={e => setForm({ ...form, guardianIdNumber: e.target.value })} disabled={formMode === 'view'} required />
                    </label>
                    <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                      <span style={{ whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Guardian KRA PIN</span>{isFieldRequired('guardianKraPin') && <span style={{ color: '#ef4444' }}>*</span>}
                      </span>
                      <input className="input" value={form.guardianKraPin || ""} onChange={e => setForm({ ...form, guardianKraPin: e.target.value })} disabled={formMode === 'view'} />
                    </label>
                    <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                      <span style={{ whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Guardian Phone</span>{isFieldRequired('guardianPhone') && <span style={{ color: '#ef4444' }}>*</span>}
                      </span>
                      <input className="input" value={form.guardianPhone || ""} onChange={e => setForm({ ...form, guardianPhone: e.target.value })} disabled={formMode === 'view'} required />
                    </label>
                    <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                      <span style={{ whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Guardian Email</span>{isFieldRequired('guardianEmail') && <span style={{ color: '#ef4444' }}>*</span>}
                      </span>
                      <input className="input" type="email" value={form.guardianEmail || ""} onChange={e => setForm({ ...form, guardianEmail: e.target.value })} disabled={formMode === 'view'} />
                    </label>
                    <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                      <span style={{ whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Relationship</span>{isFieldRequired('guardianRelationship') && <span style={{ color: '#ef4444' }}>*</span>}
                      </span>
                      <input className="input" value={form.guardianRelationship || ""} onChange={e => setForm({ ...form, guardianRelationship: e.target.value })} disabled={formMode === 'view'} placeholder="e.g., Father, Mother, Guardian" />
                    </label>
                    <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                      <span style={{ whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Guardian Address</span>{isFieldRequired('guardianAddress') && <span style={{ color: '#ef4444' }}>*</span>}
                      </span>
                      <textarea className="input" value={form.guardianAddress || ""} onChange={e => setForm({ ...form, guardianAddress: e.target.value })} disabled={formMode === 'view'} rows="3" />
                    </label>
                  </div>
                </div>
              )}

              {form.category === 'Chama' && (
                <div style={{ marginTop: "30px", padding: "20px", border: "1px solid #e5e7eb", borderRadius: "8px", backgroundColor: "#f9fafb" }}>
                  <h3 style={{ color: "var(--primary-700)", marginBottom: "20px", fontSize: "18px", fontWeight: "600" }}>Chama Information</h3>
                  <div className="grid4">
                    <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                      <span style={{ whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Chama Name</span>{isFieldRequired('chamaName') && <span style={{ color: '#ef4444' }}>*</span>}
                      </span>
                      <input className="input" value={form.chamaName || ""} onChange={e => setForm({ ...form, chamaName: e.target.value })} disabled={formMode === 'view'} required />
                    </label>
                    <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                      <span style={{ whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Registration Number</span>{isFieldRequired('chamaRegistrationNumber') && <span style={{ color: '#ef4444' }}>*</span>}
                      </span>
                      <input className="input" value={form.chamaRegistrationNumber || ""} onChange={e => setForm({ ...form, chamaRegistrationNumber: e.target.value })} disabled={formMode === 'view'} />
                    </label>
                    <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                      <span style={{ whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Constitution</span>{isFieldRequired('chamaConstitution') && <span style={{ color: '#ef4444' }}>*</span>}
                      </span>
                      <textarea className="input" value={form.chamaConstitution || ""} onChange={e => setForm({ ...form, chamaConstitution: e.target.value })} disabled={formMode === 'view'} rows="3" placeholder="Brief description of chama constitution" />
                    </label>
                  </div>
                </div>
              )}
              
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
                <button
                  type="button"
                  className="pill"
                  onClick={() => handleTabChange("address")}
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
            <div className="grid4">
                <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                  <span style={{ whiteSpace: 'nowrap' }}>
                    <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Country</span>{isFieldRequired('country') && <span style={{ color: '#ef4444' }}>*</span>}
                  </span>
                  <input className="input" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} disabled={formMode === 'view'} />
                </label>
                <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                  <span style={{ whiteSpace: 'nowrap' }}>
                    <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>County</span>{isFieldRequired('county') && <span style={{ color: '#ef4444' }}>*</span>}
                  </span>
                  <input className="input" value={form.county} onChange={e => setForm({ ...form, county: e.target.value })} disabled={formMode === 'view'} />
                </label>
                <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                  <span style={{ whiteSpace: 'nowrap' }}>
                    <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Sub County</span>{isFieldRequired('subCounty') && <span style={{ color: '#ef4444' }}>*</span>}
                  </span>
                  <input className="input" value={form.subCounty} onChange={e => setForm({ ...form, subCounty: e.target.value })} disabled={formMode === 'view'} />
                </label>
                <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                  <span style={{ whiteSpace: 'nowrap' }}>
                    <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Email</span>{isFieldRequired('email') && <span style={{ color: '#ef4444' }}>*</span>}
                  </span>
                  <input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} disabled={formMode === 'view'} />
                </label>
                <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                  <span style={{ whiteSpace: 'nowrap' }}>
                    <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Personal Phone Number</span>{isFieldRequired('personalPhone') && <span style={{ color: '#ef4444' }}>*</span>}
                  </span>
                  <input className="input" type="tel" value={form.personalPhone} onChange={e => setForm({ ...form, personalPhone: e.target.value })} required disabled={formMode === 'view'} />
                </label>
                <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                  <span style={{ whiteSpace: 'nowrap' }}>
                    <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Alternative Phone Number</span>{isFieldRequired('alternativePhone') && <span style={{ color: '#ef4444' }}>*</span>}
                  </span>
                  <input className="input" type="tel" value={form.alternativePhone} onChange={e => setForm({ ...form, alternativePhone: e.target.value })} disabled={formMode === 'view'} />
                </label>
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px" }}>
                <button
                  type="button"
                  className="pill"
                  onClick={() => handleTabChange("personal")}
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
                  onClick={() => handleTabChange("nextOfKin")}
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

          {activeTab === "nextOfKin" && form.category !== 'Corporate' && (
            <div>
              <div className="grid2" style={{ marginBottom: "20px" }}>
                <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                  <span style={{ whiteSpace: 'nowrap' }}>
                    <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Title</span>
                  </span>
                  <select className="inputz" value={nextOfKinForm.title || ""} onChange={e => setNextOfKinForm({ ...nextOfKinForm, title: e.target.value })} disabled={formMode === 'view'}>
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
                <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>First Name
                  <input className="input" value={nextOfKinForm.firstName || ""} onChange={e => setNextOfKinForm({ ...nextOfKinForm, firstName: e.target.value })} required disabled={formMode === 'view'} />
                  {fieldErrors.nextOfKin_0_firstName && (
                    <div style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>
                      {fieldErrors.nextOfKin_0_firstName}
                    </div>
                  )}
                </label>
                <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>Last Name
                  <input className="input" value={nextOfKinForm.lastName || ""} onChange={e => setNextOfKinForm({ ...nextOfKinForm, lastName: e.target.value })} required disabled={formMode === 'view'} />
                  {fieldErrors.nextOfKin_0_lastName && (
                    <div style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>
                      {fieldErrors.nextOfKin_0_lastName}
                    </div>
                  )}
                </label>
                <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>Phone Number
                  <input className="input" type="tel" value={nextOfKinForm.phoneNumber || ""} onChange={e => setNextOfKinForm({ ...nextOfKinForm, phoneNumber: e.target.value })} required disabled={formMode === 'view'} />
                  {fieldErrors.nextOfKin_0_phoneNumber && (
                    <div style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>
                      {fieldErrors.nextOfKin_0_phoneNumber}
                    </div>
                  )}
                </label>
                <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>Relation Type
                  <div className="role-input-wrapper">
                    <input
                      className="input"
                      value={nextOfKinForm.relationType || ""}
                      onChange={e => setNextOfKinForm({ ...nextOfKinForm, relationType: e.target.value })}
                      disabled={true}
                      placeholder="Select a relation type"
                      readOnly={true}
                    />
                    {formMode !== 'view' && (
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
                <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>Gender
                  <div className="role-input-wrapper">
                    <input
                      className="input"
                      value={nextOfKinForm.gender || ""}
                      onChange={e => setNextOfKinForm({ ...nextOfKinForm, gender: e.target.value })}
                      disabled={true}
                      placeholder="Select a gender"
                      readOnly={true}
                    />
                    {formMode !== 'view' && (
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
              
              {formMode !== 'view' && (
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
                  {fieldErrors.nextOfKin && (
                    <div style={{ color: "#ef4444", fontSize: "12px", marginTop: "8px" }}>
                      {fieldErrors.nextOfKin}
                    </div>
                  )}
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
                            {formMode !== 'view' && (
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
                  onClick={() => handleTabChange("address")}
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
                  onClick={() => handleTabChange("photo")}
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
              {form.category === 'Minor' ? (
                // Minor member layout - two sets of uploads
                <div style={{ display: "flex", flexDirection: "column", gap: "30px", padding: "20px" }}>
                  {/* Minor's uploads */}
                  <div>
                    <h2 style={{ color: "var(--primary-700)", marginBottom: "20px", fontSize: "20px", fontWeight: "600" }}>
                      Minor's Photos, Signatures & Biometrics
                    </h2>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
                {/* Photo Section */}
                <div style={{ 
                  display: "flex", 
                  flexDirection: "column", 
                  gap: "12px",
                  padding: "20px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  backgroundColor: "#f9fafb"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ fontWeight: "600", color: "var(--primary-700)", margin: "0", fontSize: "16px" }}>
                      Photos ({photos.length})
                  </h3>
                    {formMode !== 'view' && (
                          <button
                            type="button"
                            className="pill"
                            onClick={() => setShowPhotoModal(true)}
                            style={{
                          padding: "6px 12px",
                          fontSize: "12px",
                            minWidth: "auto"
                          }}
                        >
                          Add Photo
                        </button>
                      )}
                    </div>
                  
                  {photos.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "300px", overflowY: "auto" }}>
                      {photos.map((photo, index) => (
                        <div key={index} style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          gap: "12px",
                          padding: "8px",
                          border: "1px solid #e5e7eb",
                          borderRadius: "6px",
                          backgroundColor: "#ffffff"
                        }}>
                        <div style={{ 
                            width: "60px", 
                            height: "60px", 
                            border: "1px solid #e5e7eb", 
                            borderRadius: "4px", 
                          overflow: "hidden",
                          backgroundColor: "#f9fafb",
                          display: "flex",
                          alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0
                        }}>
                          <img 
                              src={photo.file instanceof File ? URL.createObjectURL(photo.file) : (photo.isBase64 ? photo.data : photo)} 
                            alt="Photo preview" 
                            style={{ 
                              width: "100%", 
                              height: "100%", 
                              objectFit: "cover" 
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'block';
                            }}
                          />
                          <div style={{ 
                            display: 'none',
                            color: "#6b7280", 
                              fontSize: "10px", 
                            textAlign: "center",
                              padding: "4px"
                          }}>
                              No Image
                          </div>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ 
                              fontSize: "14px", 
                              fontWeight: "500", 
                              color: "#374151",
                              marginBottom: "2px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap"
                            }}>
                              {photo.name}
                            </div>
                            <div style={{ 
                              fontSize: "12px", 
                              color: "#6b7280"
                            }}>
                              {new Date(photo.createdAt).toLocaleDateString()} {new Date(photo.createdAt).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      ))}
                        </div>
                      ) : (
                    <div style={{ 
                      textAlign: "center", 
                      color: "var(--muted-text)", 
                      padding: "20px",
                      fontSize: "14px"
                    }}>
                      No photos uploaded yet
                    </div>
                  )}
                </div>

                {/* Signature Section */}
                <div style={{ 
                  display: "flex", 
                  flexDirection: "column", 
                  gap: "12px",
                  padding: "20px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  backgroundColor: "#f9fafb"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ fontWeight: "600", color: "var(--primary-700)", margin: "0", fontSize: "16px" }}>
                      Signatures ({signatures.length})
                  </h3>
                    {formMode !== 'view' && (
                          <button
                            type="button"
                            className="pill"
                            onClick={() => setShowSignatureModal(true)}
                            style={{
                          padding: "6px 12px",
                          fontSize: "12px",
                            minWidth: "auto"
                          }}
                        >
                          Add Signature
                        </button>
                      )}
                    </div>
                  
                  {signatures.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "300px", overflowY: "auto" }}>
                      {signatures.map((signature, index) => (
                        <div key={index} style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          gap: "12px",
                          padding: "8px",
                          border: "1px solid #e5e7eb",
                          borderRadius: "6px",
                          backgroundColor: "#ffffff"
                        }}>
                        <div style={{ 
                            width: "60px", 
                            height: "60px", 
                            border: "1px solid #e5e7eb", 
                            borderRadius: "4px", 
                          overflow: "hidden",
                          backgroundColor: "#f9fafb",
                          display: "flex",
                          alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0
                        }}>
                          <img 
                              src={signature.file instanceof File ? URL.createObjectURL(signature.file) : (signature.isBase64 ? signature.data : signature)} 
                            alt="Signature preview" 
                            style={{ 
                              width: "100%", 
                              height: "100%", 
                              objectFit: "cover" 
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'block';
                            }}
                          />
                          <div style={{ 
                            display: 'none',
                            color: "#6b7280", 
                              fontSize: "10px", 
                            textAlign: "center",
                              padding: "4px"
                          }}>
                              No Image
                          </div>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ 
                              fontSize: "14px", 
                              fontWeight: "500", 
                              color: "#374151",
                              marginBottom: "2px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap"
                            }}>
                              {signature.name}
                            </div>
                            <div style={{ 
                              fontSize: "12px", 
                              color: "#6b7280"
                            }}>
                              {new Date(signature.createdAt).toLocaleDateString()} {new Date(signature.createdAt).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      ))}
                        </div>
                      ) : (
                    <div style={{ 
                      textAlign: "center", 
                      color: "var(--muted-text)", 
                      padding: "20px",
                      fontSize: "14px"
                    }}>
                      No signatures uploaded yet
                    </div>
                  )}
                </div>

                {/* Biometrics Section */}
                <div style={{ 
                  display: "flex", 
                  flexDirection: "column", 
                  gap: "12px",
                  padding: "20px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  backgroundColor: "#f9fafb"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ fontWeight: "600", color: "var(--primary-700)", margin: "0", fontSize: "16px" }}>
                      Biometrics ({biometrics.length})
                  </h3>
                    {formMode !== 'view' && (
                          <button
                            type="button"
                            className="pill"
                            onClick={() => setShowBiometricsModal(true)}
                            style={{
                          padding: "6px 12px",
                          fontSize: "12px",
                            minWidth: "auto"
                          }}
                        >
                          Add Biometrics
                        </button>
                      )}
                    </div>
                  
                  {biometrics.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "300px", overflowY: "auto" }}>
                      {biometrics.map((biometric, index) => (
                        <div key={index} style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          gap: "12px",
                          padding: "8px",
                          border: "1px solid #e5e7eb",
                          borderRadius: "6px",
                          backgroundColor: "#ffffff"
                        }}>
                        <div style={{ 
                            width: "60px", 
                            height: "60px", 
                            border: "1px solid #e5e7eb", 
                            borderRadius: "4px", 
                          overflow: "hidden",
                          backgroundColor: "#f9fafb",
                          display: "flex",
                          alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0
                        }}>
                          <img 
                              src={biometric.file instanceof File ? URL.createObjectURL(biometric.file) : (biometric.isBase64 ? biometric.data : biometric)} 
                            alt="Biometrics preview" 
                            style={{ 
                              width: "100%", 
                              height: "100%", 
                              objectFit: "cover" 
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'block';
                            }}
                          />
                          <div style={{ 
                            display: 'none',
                            color: "#6b7280", 
                              fontSize: "10px", 
                            textAlign: "center",
                              padding: "4px"
                          }}>
                              No Image
                          </div>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ 
                              fontSize: "14px", 
                              fontWeight: "500", 
                              color: "#374151",
                              marginBottom: "2px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap"
                            }}>
                              {biometric.name}
                            </div>
                            <div style={{ 
                              fontSize: "12px", 
                              color: "#6b7280"
                            }}>
                              {new Date(biometric.createdAt).toLocaleDateString()} {new Date(biometric.createdAt).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      ))}
                        </div>
                      ) : (
                    <div style={{ 
                      textAlign: "center", 
                      color: "var(--muted-text)", 
                      padding: "20px",
                      fontSize: "14px"
                    }}>
                      No biometrics uploaded yet
                    </div>
                  )}
                </div>
                    </div>
                  </div>
                  
                  {/* Guardian's uploads */}
                  <div>
                    <h2 style={{ color: "var(--primary-700)", marginBottom: "20px", fontSize: "20px", fontWeight: "600" }}>
                      Guardian's Photos, Signatures & Biometrics
                    </h2>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
                      {/* Guardian Photo Section */}
                      <div style={{ 
                        display: "flex", 
                        flexDirection: "column", 
                        gap: "12px",
                        padding: "20px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        backgroundColor: "#f9fafb"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <h3 style={{ fontWeight: "600", color: "var(--primary-700)", margin: "0", fontSize: "16px" }}>
                            Guardian Photos ({guardianPhotos.length})
                          </h3>
                          {formMode !== 'view' && (
                            <button
                              type="button"
                              className="pill"
                              onClick={() => setShowGuardianPhotoModal(true)}
                              style={{
                                padding: "6px 12px",
                                fontSize: "12px",
                                minWidth: "auto"
                              }}
                            >
                              Add Photo
                            </button>
                          )}
                        </div>
                        
                        {guardianPhotos.length > 0 ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "300px", overflowY: "auto" }}>
                            {guardianPhotos.map((photo, index) => (
                              <div key={index} style={{ 
                                display: "flex", 
                                alignItems: "center", 
                                gap: "12px",
                                padding: "8px",
                                border: "1px solid #e5e7eb",
                                borderRadius: "6px",
                                backgroundColor: "#ffffff"
                              }}>
                                <div style={{ 
                                  width: "60px", 
                                  height: "60px", 
                                  border: "1px solid #e5e7eb", 
                                  borderRadius: "4px", 
                                  overflow: "hidden",
                                  backgroundColor: "#f9fafb",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0
                                }}>
                                  <img 
                                    src={photo.file instanceof File ? URL.createObjectURL(photo.file) : (photo.isBase64 ? photo.data : photo)} 
                                    alt="Guardian photo preview" 
                                    style={{ 
                                      width: "100%", 
                                      height: "100%", 
                                      objectFit: "cover" 
                                    }}
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'block';
                                    }}
                                  />
                                  <div style={{ 
                                    display: 'none',
                                    color: "#6b7280", 
                                    fontSize: "10px", 
                                    textAlign: "center",
                                    padding: "4px"
                                  }}>
                                    No Image
                                  </div>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ 
                                    fontSize: "14px", 
                                    fontWeight: "500", 
                                    color: "#374151",
                                    marginBottom: "2px",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap"
                                  }}>
                                    {photo.name}
                                  </div>
                                  <div style={{ 
                                    fontSize: "12px", 
                                    color: "#6b7280"
                                  }}>
                                    {new Date(photo.createdAt).toLocaleDateString()} {new Date(photo.createdAt).toLocaleTimeString()}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ 
                            textAlign: "center", 
                            color: "var(--muted-text)", 
                            padding: "20px",
                            fontSize: "14px"
                          }}>
                            No guardian photos uploaded yet
                          </div>
                        )}
                      </div>

                      {/* Guardian Signature Section */}
                      <div style={{ 
                        display: "flex", 
                        flexDirection: "column", 
                        gap: "12px",
                        padding: "20px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        backgroundColor: "#f9fafb"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <h3 style={{ fontWeight: "600", color: "var(--primary-700)", margin: "0", fontSize: "16px" }}>
                            Guardian Signatures ({guardianSignatures.length})
                          </h3>
                          {formMode !== 'view' && (
                            <button
                              type="button"
                              className="pill"
                              onClick={() => setShowGuardianSignatureModal(true)}
                              style={{
                                padding: "6px 12px",
                                fontSize: "12px",
                                minWidth: "auto"
                              }}
                            >
                              Add Signature
                            </button>
                          )}
                        </div>
                        
                        {guardianSignatures.length > 0 ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "300px", overflowY: "auto" }}>
                            {guardianSignatures.map((signature, index) => (
                              <div key={index} style={{ 
                                display: "flex", 
                                alignItems: "center", 
                                gap: "12px",
                                padding: "8px",
                                border: "1px solid #e5e7eb",
                                borderRadius: "6px",
                                backgroundColor: "#ffffff"
                              }}>
                                <div style={{ 
                                  width: "60px", 
                                  height: "60px", 
                                  border: "1px solid #e5e7eb", 
                                  borderRadius: "4px", 
                                  overflow: "hidden",
                                  backgroundColor: "#f9fafb",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0
                                }}>
                                  <img 
                                    src={signature.file instanceof File ? URL.createObjectURL(signature.file) : (signature.isBase64 ? signature.data : signature)} 
                                    alt="Guardian signature preview" 
                                    style={{ 
                                      width: "100%", 
                                      height: "100%", 
                                      objectFit: "cover" 
                                    }}
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'block';
                                    }}
                                  />
                                  <div style={{ 
                                    display: 'none',
                                    color: "#6b7280", 
                                    fontSize: "10px", 
                                    textAlign: "center",
                                    padding: "4px"
                                  }}>
                                    No Image
                                  </div>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ 
                                    fontSize: "14px", 
                                    fontWeight: "500", 
                                    color: "#374151",
                                    marginBottom: "2px",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap"
                                  }}>
                                    {signature.name}
                                  </div>
                                  <div style={{ 
                                    fontSize: "12px", 
                                    color: "#6b7280"
                                  }}>
                                    {new Date(signature.createdAt).toLocaleDateString()} {new Date(signature.createdAt).toLocaleTimeString()}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ 
                            textAlign: "center", 
                            color: "var(--muted-text)", 
                            padding: "20px",
                            fontSize: "14px"
                          }}>
                            No guardian signatures uploaded yet
                          </div>
                        )}
                      </div>

                      {/* Guardian Biometrics Section */}
                      <div style={{ 
                        display: "flex", 
                        flexDirection: "column", 
                        gap: "12px",
                        padding: "20px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        backgroundColor: "#f9fafb"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <h3 style={{ fontWeight: "600", color: "var(--primary-700)", margin: "0", fontSize: "16px" }}>
                            Guardian Biometrics ({guardianBiometrics.length})
                          </h3>
                          {formMode !== 'view' && (
                            <button
                              type="button"
                              className="pill"
                              onClick={() => setShowGuardianBiometricsModal(true)}
                              style={{
                                padding: "6px 12px",
                                fontSize: "12px",
                                minWidth: "auto"
                              }}
                            >
                              Add Biometrics
                            </button>
                          )}
                        </div>
                        
                        {guardianBiometrics.length > 0 ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "300px", overflowY: "auto" }}>
                            {guardianBiometrics.map((biometric, index) => (
                              <div key={index} style={{ 
                                display: "flex", 
                                alignItems: "center", 
                                gap: "12px",
                                padding: "8px",
                                border: "1px solid #e5e7eb",
                                borderRadius: "6px",
                                backgroundColor: "#ffffff"
                              }}>
                                <div style={{ 
                                  width: "60px", 
                                  height: "60px", 
                                  border: "1px solid #e5e7eb", 
                                  borderRadius: "4px", 
                                  overflow: "hidden",
                                  backgroundColor: "#f9fafb",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0
                                }}>
                                  <img 
                                    src={biometric.file instanceof File ? URL.createObjectURL(biometric.file) : (biometric.isBase64 ? biometric.data : biometric)} 
                                    alt="Guardian biometrics preview" 
                                    style={{ 
                                      width: "100%", 
                                      height: "100%", 
                                      objectFit: "cover" 
                                    }}
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'block';
                                    }}
                                  />
                                  <div style={{ 
                                    display: 'none',
                                    color: "#6b7280", 
                                    fontSize: "10px", 
                                    textAlign: "center",
                                    padding: "4px"
                                  }}>
                                    No Image
                                  </div>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ 
                                    fontSize: "14px", 
                                    fontWeight: "500", 
                                    color: "#374151",
                                    marginBottom: "2px",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap"
                                  }}>
                                    {biometric.name}
                                  </div>
                                  <div style={{ 
                                    fontSize: "12px", 
                                    color: "#6b7280"
                                  }}>
                                    {new Date(biometric.createdAt).toLocaleDateString()} {new Date(biometric.createdAt).toLocaleTimeString()}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ 
                            textAlign: "center", 
                            color: "var(--muted-text)", 
                            padding: "20px",
                            fontSize: "14px"
                          }}>
                            No guardian biometrics uploaded yet
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Regular member layout - single set of uploads
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", padding: "20px" }}>
                  {/* Photo Section */}
                  <div style={{ 
                    display: "flex", 
                    flexDirection: "column", 
                    gap: "12px",
                    padding: "20px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    backgroundColor: "#f9fafb"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h3 style={{ fontWeight: "600", color: "var(--primary-700)", margin: "0", fontSize: "16px" }}>
                        Photos ({photos.length})
                      </h3>
                      {formMode !== 'view' && (
                        <button
                          type="button"
                          className="pill"
                          onClick={() => setShowPhotoModal(true)}
                          style={{
                            padding: "6px 12px",
                            fontSize: "12px",
                            minWidth: "auto"
                          }}
                        >
                          Add Photo
                        </button>
                      )}
                    </div>
                    
                    {photos.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "300px", overflowY: "auto" }}>
                        {photos.map((photo, index) => (
                          <div key={index} style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            gap: "12px",
                            padding: "8px",
                            border: "1px solid #e5e7eb",
                            borderRadius: "6px",
                            backgroundColor: "#ffffff"
                          }}>
                            <div style={{ 
                              width: "60px", 
                              height: "60px", 
                              border: "1px solid #e5e7eb", 
                              borderRadius: "4px", 
                              overflow: "hidden",
                              backgroundColor: "#f9fafb",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0
                            }}>
                              <img 
                                src={photo.file instanceof File ? URL.createObjectURL(photo.file) : (photo.isBase64 ? photo.data : photo)} 
                                alt="Photo preview" 
                                style={{ 
                                  width: "100%", 
                                  height: "100%", 
                                  objectFit: "cover" 
                                }}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'block';
                                }}
                              />
                              <div style={{ 
                                display: 'none',
                                color: "#6b7280", 
                                fontSize: "10px", 
                                textAlign: "center",
                                padding: "4px"
                              }}>
                                No Image
                              </div>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ 
                                fontSize: "14px", 
                                fontWeight: "500", 
                                color: "#374151",
                                marginBottom: "2px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap"
                              }}>
                                {photo.name}
                              </div>
                              <div style={{ 
                                fontSize: "12px", 
                                color: "#6b7280"
                              }}>
                                {new Date(photo.createdAt).toLocaleDateString()} {new Date(photo.createdAt).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ 
                        textAlign: "center", 
                        color: "var(--muted-text)", 
                        padding: "20px",
                        fontSize: "14px"
                      }}>
                        No photos uploaded yet
                      </div>
                    )}
                  </div>

                  {/* Signature Section */}
                  <div style={{ 
                    display: "flex", 
                    flexDirection: "column", 
                    gap: "12px",
                    padding: "20px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    backgroundColor: "#f9fafb"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h3 style={{ fontWeight: "600", color: "var(--primary-700)", margin: "0", fontSize: "16px" }}>
                        Signatures ({signatures.length})
                      </h3>
                      {formMode !== 'view' && (
                        <button
                          type="button"
                          className="pill"
                          onClick={() => setShowSignatureModal(true)}
                          style={{
                            padding: "6px 12px",
                            fontSize: "12px",
                            minWidth: "auto"
                          }}
                        >
                          Add Signature
                        </button>
                      )}
                    </div>
                    
                    {signatures.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "300px", overflowY: "auto" }}>
                        {signatures.map((signature, index) => (
                          <div key={index} style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            gap: "12px",
                            padding: "8px",
                            border: "1px solid #e5e7eb",
                            borderRadius: "6px",
                            backgroundColor: "#ffffff"
                          }}>
                            <div style={{ 
                              width: "60px", 
                              height: "60px", 
                              border: "1px solid #e5e7eb", 
                              borderRadius: "4px", 
                              overflow: "hidden",
                              backgroundColor: "#f9fafb",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0
                            }}>
                              <img 
                                src={signature.file instanceof File ? URL.createObjectURL(signature.file) : (signature.isBase64 ? signature.data : signature)} 
                                alt="Signature preview" 
                                style={{ 
                                  width: "100%", 
                                  height: "100%", 
                                  objectFit: "cover" 
                                }}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'block';
                                }}
                              />
                              <div style={{ 
                                display: 'none',
                                color: "#6b7280", 
                                fontSize: "10px", 
                                textAlign: "center",
                                padding: "4px"
                              }}>
                                No Image
                              </div>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ 
                                fontSize: "14px", 
                                fontWeight: "500", 
                                color: "#374151",
                                marginBottom: "2px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap"
                              }}>
                                {signature.name}
                              </div>
                              <div style={{ 
                                fontSize: "12px", 
                                color: "#6b7280"
                              }}>
                                {new Date(signature.createdAt).toLocaleDateString()} {new Date(signature.createdAt).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ 
                        textAlign: "center", 
                        color: "var(--muted-text)", 
                        padding: "20px",
                        fontSize: "14px"
                      }}>
                        No signatures uploaded yet
                      </div>
                    )}
                  </div>

                  {/* Biometrics Section */}
                  <div style={{ 
                    display: "flex", 
                    flexDirection: "column", 
                    gap: "12px",
                    padding: "20px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    backgroundColor: "#f9fafb"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h3 style={{ fontWeight: "600", color: "var(--primary-700)", margin: "0", fontSize: "16px" }}>
                        Biometrics ({biometrics.length})
                      </h3>
                      {formMode !== 'view' && (
                        <button
                          type="button"
                          className="pill"
                          onClick={() => setShowBiometricsModal(true)}
                          style={{
                            padding: "6px 12px",
                            fontSize: "12px",
                            minWidth: "auto"
                          }}
                        >
                          Add Biometrics
                        </button>
                      )}
                    </div>
                    
                    {biometrics.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "300px", overflowY: "auto" }}>
                        {biometrics.map((biometric, index) => (
                          <div key={index} style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            gap: "12px",
                            padding: "8px",
                            border: "1px solid #e5e7eb",
                            borderRadius: "6px",
                            backgroundColor: "#ffffff"
                          }}>
                            <div style={{ 
                              width: "60px", 
                              height: "60px", 
                              border: "1px solid #e5e7eb", 
                              borderRadius: "4px", 
                              overflow: "hidden",
                              backgroundColor: "#f9fafb",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0
                            }}>
                              <img 
                                src={biometric.file instanceof File ? URL.createObjectURL(biometric.file) : (biometric.isBase64 ? biometric.data : biometric)} 
                                alt="Biometric preview" 
                                style={{ 
                                  width: "100%", 
                                  height: "100%", 
                                  objectFit: "cover" 
                                }}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'block';
                                }}
                              />
                              <div style={{ 
                                display: 'none',
                                color: "#6b7280", 
                                fontSize: "10px", 
                                textAlign: "center",
                                padding: "4px"
                              }}>
                                No Image
                              </div>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ 
                                fontSize: "14px", 
                                fontWeight: "500", 
                                color: "#374151",
                                marginBottom: "2px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap"
                              }}>
                                {biometric.name}
                              </div>
                              <div style={{ 
                                fontSize: "12px", 
                                color: "#6b7280"
                              }}>
                                {new Date(biometric.createdAt).toLocaleDateString()} {new Date(biometric.createdAt).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ 
                        textAlign: "center", 
                        color: "var(--muted-text)", 
                        padding: "20px",
                        fontSize: "14px"
                      }}>
                        No biometrics uploaded yet
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px" }}>
                <button
                  type="button"
                  className="pill"
                  onClick={() => handleTabChange("nextOfKin")}
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
                  onClick={() => handleTabChange("accounts")}
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

          {/* Joint Members Tab */}
          {activeTab === "jointMembers" && form.category === 'Joint' && (
            <div>
              <h3 style={{ color: "var(--primary-700)", marginBottom: "20px", fontSize: "18px", fontWeight: "600" }}>Joint Members</h3>
              
              {/* Joint Membership Name */}
              <div style={{ marginBottom: "20px", padding: "15px", border: "1px solid #e5e7eb", borderRadius: "8px", backgroundColor: "white" }}>
                <label style={{ color: "var(--primary-700)", fontWeight: "600", display: "block", marginBottom: "8px" }}>
                  Joint Membership Name *
                </label>
                <input 
                  className="input" 
                  value={form.jointMembershipName || ""} 
                  onChange={e => setForm({ ...form, jointMembershipName: e.target.value })} 
                  placeholder="Enter joint membership name (e.g., John & Jane Smith)"
                  required 
                  disabled={formMode === 'view'}
                  style={{ width: "100%", maxWidth: "400px" }}
                />
                {fieldErrors.jointMembershipName && (
                  <div style={{ color: "#dc2626", fontSize: "14px", marginTop: "5px" }}>
                    {fieldErrors.jointMembershipName}
                  </div>
                )}
              </div>
              
              {/* Joint Member Form */}
              <div style={{ marginBottom: "30px", padding: "20px", border: "1px solid #e5e7eb", borderRadius: "8px", backgroundColor: "#f9fafb" }}>
                <h4 style={{ color: "var(--primary-600)", marginBottom: "15px", fontSize: "16px", fontWeight: "600" }}>
                  {editingJointMemberIndex >= 0 ? "Edit Joint Member" : "Add Joint Member"}
                </h4>
                <div className="grid4">
                  <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>Title
                    <select className="inputz" value={jointMemberForm.title || ""} onChange={e => setJointMemberForm({ ...jointMemberForm, title: e.target.value })} disabled={formMode === 'view'}>
                      <option value="">Select Title</option>
                      <option>Mr.</option>
                      <option>Mrs</option>
                      <option>Doctor</option>
                      <option>Miss</option>
                      <option>Ms.</option>
                    </select>
                  </label>
                  <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>First Name<input className="input" value={jointMemberForm.firstName || ""} onChange={e => setJointMemberForm({ ...jointMemberForm, firstName: e.target.value })} required disabled={formMode === 'view'} /></label>
                  <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>Last Name<input className="input" value={jointMemberForm.lastName || ""} onChange={e => setJointMemberForm({ ...jointMemberForm, lastName: e.target.value })} required disabled={formMode === 'view'} /></label>
                  <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>ID Type<input className="input" value={jointMemberForm.identificationType || ""} onChange={e => setJointMemberForm({ ...jointMemberForm, identificationType: e.target.value })} disabled={formMode === 'view'} /></label>
                  <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>ID Number<input className="input" value={jointMemberForm.identificationNumber || ""} onChange={e => setJointMemberForm({ ...jointMemberForm, identificationNumber: e.target.value })} required disabled={formMode === 'view'} /></label>
                  <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>KRA PIN<input className="input" value={jointMemberForm.kraPin || ""} onChange={e => setJointMemberForm({ ...jointMemberForm, kraPin: e.target.value })} disabled={formMode === 'view'} /></label>
                  <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>Phone<input className="input" value={jointMemberForm.phoneNumber || ""} onChange={e => setJointMemberForm({ ...jointMemberForm, phoneNumber: e.target.value })} disabled={formMode === 'view'} /></label>
                  <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>Email<input className="input" type="email" value={jointMemberForm.email || ""} onChange={e => setJointMemberForm({ ...jointMemberForm, email: e.target.value })} disabled={formMode === 'view'} /></label>
                  <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>Address<textarea className="input" value={jointMemberForm.address || ""} onChange={e => setJointMemberForm({ ...jointMemberForm, address: e.target.value })} disabled={formMode === 'view'} rows="2" /></label>
                </div>
                {formMode !== 'view' && (
                  <div style={{ marginTop: "15px" }}>
                    <button type="button" className="pill" onClick={addJointMember} style={{ padding: "8px 16px", fontSize: "14px", minWidth: "auto" }}>
                      {editingJointMemberIndex >= 0 ? "Update Joint Member" : "Add Joint Member"}
                    </button>
                    {editingJointMemberIndex >= 0 && (
                      <button type="button" className="pill" onClick={() => { setEditingJointMemberIndex(-1); setJointMemberForm({ title: "", firstName: "", lastName: "", identificationType: "", identificationNumber: "", kraPin: "", phoneNumber: "", email: "", address: "" }); }} style={{ padding: "8px 16px", fontSize: "14px", minWidth: "auto", marginLeft: "10px", backgroundColor: "#6b7280", color: "white" }}>
                        Cancel
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Joint Members List */}
              {form.jointMembers && form.jointMembers.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <h4 style={{ color: "var(--primary-600)", marginBottom: "15px", fontSize: "16px", fontWeight: "600" }}>Joint Members ({form.jointMembers.length})</h4>
                  <div style={{ display: "grid", gap: "10px" }}>
                    {form.jointMembers.map((member, index) => (
                      <div key={index} style={{ padding: "15px", border: "1px solid #e5e7eb", borderRadius: "6px", backgroundColor: "white" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <strong>{member.title} {member.firstName} {member.lastName}</strong>
                            <div style={{ fontSize: "14px", color: "#6b7280", marginTop: "4px" }}>
                              ID: {member.identificationNumber} | Phone: {member.phoneNumber}
                            </div>
                          </div>
                          {formMode !== 'view' && (
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button type="button" className="pill" onClick={() => editJointMember(index)} style={{ padding: "6px 12px", fontSize: "12px", minWidth: "auto", backgroundColor: "var(--primary-100)", color: "var(--primary-700)" }}>
                                Edit
                              </button>
                              <button type="button" className="pill" onClick={() => deleteJointMember(index)} style={{ padding: "6px 12px", fontSize: "12px", minWidth: "auto", backgroundColor: "#ef4444", color: "white" }}>
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px" }}>
                <button type="button" className="pill" onClick={() => handleTabChange("nextOfKin")} style={{ padding: "8px 16px", fontSize: "14px", minWidth: "auto" }}>
                  Back
                </button>
                <button type="button" className="pill" onClick={() => handleTabChange("accounts")} style={{ padding: "8px 16px", fontSize: "14px", minWidth: "auto" }}>
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Chama Members Tab */}
          {activeTab === "chamaMembers" && form.category === 'Chama' && (
            <div>
              <h3 style={{ color: "var(--primary-700)", marginBottom: "20px", fontSize: "18px", fontWeight: "600" }}>Chama Members</h3>
              
              {/* Chama Member Form */}
              <div style={{ marginBottom: "30px", padding: "20px", border: "1px solid #e5e7eb", borderRadius: "8px", backgroundColor: "#f9fafb" }}>
                <h4 style={{ color: "var(--primary-600)", marginBottom: "15px", fontSize: "16px", fontWeight: "600" }}>
                  {editingChamaMemberIndex >= 0 ? "Edit Chama Member" : "Add Chama Member"}
                </h4>
                <div className="grid4">
                  <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                    <span style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Select Existing Member</span>
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <input 
                        className="input" 
                        value={selectedChamaMember ? `${selectedChamaMember.firstName} ${selectedChamaMember.lastName} (${selectedChamaMember.memberNo || selectedChamaMember.identificationNumber})` : ""} 
                        placeholder="Click search to select existing member" 
                        readOnly 
                        disabled={formMode === 'view'}
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        className="search-icon-external"
                        onClick={() => setIsChamaMemberLookupModalOpen(true)}
                        title="Search existing members"
                        disabled={formMode === 'view'}
                        style={{ padding: "8px", minWidth: "auto" }}
                      >
                        <FiSearch />
                      </button>
                      {selectedChamaMember && formMode !== 'view' && (
                        <button
                          type="button"
                          className="pill"
                          onClick={() => {
                            setSelectedChamaMember(null);
                            setChamaMemberForm({
                              title: "",
                              firstName: "",
                              lastName: "",
                              identificationType: "",
                              identificationNumber: "",
                              kraPin: "",
                              phoneNumber: "",
                              email: "",
                              address: "",
                            });
                          }}
                          style={{ padding: "8px 12px", fontSize: "12px", minWidth: "auto", backgroundColor: "#6b7280", color: "white" }}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </label>
                  <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                    <span style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Title</span>
                    </span>
                    <select className="inputz" value={chamaMemberForm.title || ""} onChange={e => setChamaMemberForm({ ...chamaMemberForm, title: e.target.value })} disabled={formMode === 'view'}>
                      <option value="">Select Title</option>
                      <option>Mr.</option>
                      <option>Mrs</option>
                      <option>Doctor</option>
                      <option>Miss</option>
                      <option>Ms.</option>
                    </select>
                  </label>
                  <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                    <span style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>First Name</span>
                    </span>
                    <input className="input" value={chamaMemberForm.firstName || ""} onChange={e => setChamaMemberForm({ ...chamaMemberForm, firstName: e.target.value })} required disabled={formMode === 'view'} />
                  </label>
                  <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                    <span style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Last Name</span>
                    </span>
                    <input className="input" value={chamaMemberForm.lastName || ""} onChange={e => setChamaMemberForm({ ...chamaMemberForm, lastName: e.target.value })} required disabled={formMode === 'view'} />
                  </label>
                  <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                    <span style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>ID Type</span>
                    </span>
                    <input className="input" value={chamaMemberForm.identificationType || ""} onChange={e => setChamaMemberForm({ ...chamaMemberForm, identificationType: e.target.value })} disabled={formMode === 'view'} />
                  </label>
                  <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                    <span style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>ID Number</span>
                    </span>
                    <input className="input" value={chamaMemberForm.identificationNumber || ""} onChange={e => setChamaMemberForm({ ...chamaMemberForm, identificationNumber: e.target.value })} required disabled={formMode === 'view'} />
                  </label>
                  <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                    <span style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>KRA PIN</span>
                    </span>
                    <input className="input" value={chamaMemberForm.kraPin || ""} onChange={e => setChamaMemberForm({ ...chamaMemberForm, kraPin: e.target.value })} disabled={formMode === 'view'} />
                  </label>
                  <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                    <span style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Phone</span>
                    </span>
                    <input className="input" value={chamaMemberForm.phoneNumber || ""} onChange={e => setChamaMemberForm({ ...chamaMemberForm, phoneNumber: e.target.value })} disabled={formMode === 'view'} />
                  </label>
                  <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                    <span style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Email</span>
                    </span>
                    <input className="input" type="email" value={chamaMemberForm.email || ""} onChange={e => setChamaMemberForm({ ...chamaMemberForm, email: e.target.value })} disabled={formMode === 'view'} />
                  </label>
                  <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                    <span style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Address</span>
                    </span>
                    <textarea className="input" value={chamaMemberForm.address || ""} onChange={e => setChamaMemberForm({ ...chamaMemberForm, address: e.target.value })} disabled={formMode === 'view'} rows="2" />
                  </label>
                </div>
                {formMode !== 'view' && (
                  <div style={{ marginTop: "15px" }}>
                    <button type="button" className="pill" onClick={addChamaMember} style={{ padding: "8px 16px", fontSize: "14px", minWidth: "auto" }}>
                      {editingChamaMemberIndex >= 0 ? "Update Chama Member" : "Add Chama Member"}
                    </button>
                    {editingChamaMemberIndex >= 0 && (
                      <button type="button" className="pill" onClick={() => { setEditingChamaMemberIndex(-1); setChamaMemberForm({ title: "", firstName: "", lastName: "", identificationType: "", identificationNumber: "", kraPin: "", phoneNumber: "", email: "", address: "" }); }} style={{ padding: "8px 16px", fontSize: "14px", minWidth: "auto", marginLeft: "10px", backgroundColor: "#6b7280", color: "white" }}>
                        Cancel
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Chama Members List */}
              {form.chamaMembers && form.chamaMembers.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <h4 style={{ color: "var(--primary-600)", marginBottom: "15px", fontSize: "16px", fontWeight: "600" }}>Chama Members ({form.chamaMembers.length})</h4>
                  <div className="tableContainer">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>First Name</th>
                          <th>Last Name</th>
                          <th>ID Type</th>
                          <th>ID Number</th>
                          <th>KRA PIN</th>
                          <th>Phone</th>
                          <th>Email</th>
                          <th>Address</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedChamaMembers.map((member, index) => {
                          // Calculate the actual index in the full array for edit/delete operations
                          const actualIndex = (chamaMembersCurrentPage - 1) * chamaMembersItemsPerPage + index;
                          return (
                            <tr key={actualIndex}>
                              <td>{member.title}</td>
                              <td>{member.firstName}</td>
                              <td>{member.lastName}</td>
                              <td>{member.identificationType}</td>
                              <td>{member.identificationNumber}</td>
                              <td>{member.kraPin}</td>
                              <td>{member.phoneNumber}</td>
                              <td>{member.email}</td>
                              <td>{member.address}</td>
                              <td className="actions">
                                {formMode !== 'view' && (
                                  <>
                                    <button className="action-btn action-btn--edit" onClick={(e) => { e.preventDefault(); editChamaMember(actualIndex); }} title="Edit">
                                      <FiEdit3 />
                                    </button>
                                    <button className="action-btn action-btn--delete" onClick={(e) => { e.preventDefault(); deleteChamaMember(actualIndex); }} title="Delete">
                                      <FiTrash2 />
                                    </button>
                                  </>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination for chama members */}
                  {form.chamaMembers && form.chamaMembers.length > 0 && (
                    <Pagination
                      currentPage={chamaMembersCurrentPage}
                      totalItems={form.chamaMembers.length}
                      itemsPerPage={chamaMembersItemsPerPage}
                      onPageChange={handleChamaMembersPageChange}
                      onItemsPerPageChange={handleChamaMembersItemsPerPageChange}
                    />
                  )}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px" }}>
                <button type="button" className="pill" onClick={() => handleTabChange("nextOfKin")} style={{ padding: "8px 16px", fontSize: "14px", minWidth: "auto" }}>
                  Back
                </button>
                <button type="button" className="pill" onClick={() => handleTabChange("accounts")} style={{ padding: "8px 16px", fontSize: "14px", minWidth: "auto" }}>
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Authorized Signatories Tab */}
          {activeTab === "signatories" && (form.category === 'Corporate' || form.category === 'Chama') && (
            <div>
              <h3 style={{ color: "var(--primary-700)", marginBottom: "20px", fontSize: "18px", fontWeight: "600" }}>Authorized Signatories</h3>
              
              {/* Signatory Form */}
              <div style={{ marginBottom: "30px", padding: "20px", border: "1px solid #e5e7eb", borderRadius: "8px", backgroundColor: "#f9fafb" }}>
                <h4 style={{ color: "var(--primary-600)", marginBottom: "15px", fontSize: "16px", fontWeight: "600" }}>
                  {editingSignatoryIndex >= 0 ? "Edit Authorized Signatory" : "Add Authorized Signatory"}
                </h4>
                <div className="grid4">
                  <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>Title
                    <select className="inputz" value={signatoryForm.title || ""} onChange={e => setSignatoryForm({ ...signatoryForm, title: e.target.value })} disabled={formMode === 'view'}>
                      <option value="">Select Title</option>
                      <option>Mr.</option>
                      <option>Mrs</option>
                      <option>Doctor</option>
                      <option>Miss</option>
                      <option>Ms.</option>
                    </select>
                  </label>
                  <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>First Name<input className="input" value={signatoryForm.firstName || ""} onChange={e => setSignatoryForm({ ...signatoryForm, firstName: e.target.value })} required disabled={formMode === 'view'} /></label>
                  <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>Last Name<input className="input" value={signatoryForm.lastName || ""} onChange={e => setSignatoryForm({ ...signatoryForm, lastName: e.target.value })} required disabled={formMode === 'view'} /></label>
                  <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>Position<input className="input" value={signatoryForm.position || ""} onChange={e => setSignatoryForm({ ...signatoryForm, position: e.target.value })} placeholder="e.g., Director, Secretary" disabled={formMode === 'view'} /></label>
                  <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                    <span style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>ID Type</span>
                    </span>
                    <input className="input" value={signatoryForm.identificationType || ""} onChange={e => setSignatoryForm({ ...signatoryForm, identificationType: e.target.value })} disabled={formMode === 'view'} />
                  </label>
                  <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                    <span style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>ID Number</span>
                    </span>
                    <input className="input" value={signatoryForm.identificationNumber || ""} onChange={e => setSignatoryForm({ ...signatoryForm, identificationNumber: e.target.value })} required disabled={formMode === 'view'} />
                  </label>
                  <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                    <span style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>KRA PIN</span>
                    </span>
                    <input className="input" value={signatoryForm.kraPin || ""} onChange={e => setSignatoryForm({ ...signatoryForm, kraPin: e.target.value })} disabled={formMode === 'view'} />
                  </label>
                  <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                    <span style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Phone</span>
                    </span>
                    <input className="input" value={signatoryForm.phoneNumber || ""} onChange={e => setSignatoryForm({ ...signatoryForm, phoneNumber: e.target.value })} disabled={formMode === 'view'} />
                  </label>
                  <label style={{ color: "var(--primary-700)", fontWeight: "600" }}>
                    <span style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: "bold", color: "var(--primary-700)" }}>Email</span>
                    </span>
                    <input className="input" type="email" value={signatoryForm.email || ""} onChange={e => setSignatoryForm({ ...signatoryForm, email: e.target.value })} disabled={formMode === 'view'} />
                  </label>
                </div>
                {formMode !== 'view' && (
                  <div style={{ marginTop: "15px" }}>
                    <button type="button" className="pill" onClick={addSignatory} style={{ padding: "8px 16px", fontSize: "14px", minWidth: "auto" }}>
                      {editingSignatoryIndex >= 0 ? "Update Signatory" : "Add Signatory"}
                    </button>
                    {editingSignatoryIndex >= 0 && (
                      <button type="button" className="pill" onClick={() => { setEditingSignatoryIndex(-1); setSignatoryForm({ title: "", firstName: "", lastName: "", identificationType: "", identificationNumber: "", kraPin: "", phoneNumber: "", email: "", position: "" }); }} style={{ padding: "8px 16px", fontSize: "14px", minWidth: "auto", marginLeft: "10px", backgroundColor: "#6b7280", color: "white" }}>
                        Cancel
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Signatories List */}
              {form.authorizedSignatories && form.authorizedSignatories.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <h4 style={{ color: "var(--primary-600)", marginBottom: "15px", fontSize: "16px", fontWeight: "600" }}>Authorized Signatories ({form.authorizedSignatories.length})</h4>
                  <div style={{ display: "grid", gap: "10px" }}>
                    {form.authorizedSignatories.map((signatory, index) => (
                      <div key={index} style={{ padding: "15px", border: "1px solid #e5e7eb", borderRadius: "6px", backgroundColor: "white" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <strong>{signatory.title} {signatory.firstName} {signatory.lastName}</strong>
                            <div style={{ fontSize: "14px", color: "#6b7280", marginTop: "4px" }}>
                              {signatory.position} | ID: {signatory.identificationNumber} | Phone: {signatory.phoneNumber}
                            </div>
                          </div>
                          {formMode !== 'view' && (
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button type="button" className="pill" onClick={() => editSignatory(index)} style={{ padding: "6px 12px", fontSize: "12px", minWidth: "auto", backgroundColor: "var(--primary-100)", color: "var(--primary-700)" }}>
                                Edit
                              </button>
                              <button type="button" className="pill" onClick={() => deleteSignatory(index)} style={{ padding: "6px 12px", fontSize: "12px", minWidth: "auto", backgroundColor: "#ef4444", color: "white" }}>
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px" }}>
                <button type="button" className="pill" onClick={() => handleTabChange("nextOfKin")} style={{ padding: "8px 16px", fontSize: "14px", minWidth: "auto" }}>
                  Back
                </button>
                <button type="button" className="pill" onClick={() => handleTabChange("accounts")} style={{ padding: "8px 16px", fontSize: "14px", minWidth: "auto" }}>
                  Next
                </button>
              </div>
            </div>
          )}

          {activeTab === "accounts" && (
            <div>
              {/* Split Screen Accounts Management */}
              <div style={{ display: "flex", gap: "20px", height: "600px" }}>
                {/* Left Side - Products */}
                <div style={{ 
                  flex: "1", 
                  border: "1px solid var(--border)", 
                  borderRadius: "8px",
                  padding: "16px",
                  backgroundColor: "var(--surface-1)"
                }}>
                  <h3 style={{ 
                    marginBottom: "16px", 
                    color: "var(--primary-700)",
                    fontSize: "16px",
                    fontWeight: "600"
                  }}>
                    Available Products
                  </h3>
                
                  {productsLoading && (
                    <div style={{ 
                      padding: "20px", 
                      textAlign: "center",
                      color: "var(--primary-700)"
                    }}>
                      <div style={{ fontSize: "16px", marginBottom: "8px" }}>â³</div>
                      <p>Loading products...</p>
                    </div>
                  )}
                  
                  {productsError && (
                    <div style={{ 
                      padding: "16px", 
                      textAlign: "center",
                      color: "#dc2626",
                      backgroundColor: "rgba(239, 68, 68, 0.1)",
                      borderRadius: "8px",
                      border: "1px solid rgba(239, 68, 68, 0.2)"
                    }}>
                      <div style={{ fontSize: "16px", marginBottom: "8px" }}>âš ï¸</div>
                      <p style={{ fontSize: "14px" }}>{productsError}</p>
                    </div>
                  )}
                
                  {!productsLoading && !productsError && products.length === 0 && (
                    <div style={{ 
                      padding: "20px", 
                      textAlign: "center",
                      color: "var(--muted-text)"
                    }}>
                      <div style={{ fontSize: "32px", marginBottom: "12px" }}>ðŸ“¦</div>
                      <p style={{ fontSize: "14px" }}>No products available</p>
                    </div>
                  )}
                  
                  {!productsLoading && !productsError && products.length > 0 && (
                    <div style={{ 
                      display: "flex", 
                      flexDirection: "column", 
                      gap: "8px",
                      maxHeight: "500px",
                      overflowY: "auto"
                    }}>
                      {products.map((product) => (
                        <div
                          key={product.id}
                          style={{
                            padding: "12px",
                            border: "1px solid var(--border)",
                            borderRadius: "6px",
                            cursor: "pointer",
                            backgroundColor: selectedProduct?.id === product.id ? "var(--primary-50)" : "var(--surface-2)",
                            borderColor: selectedProduct?.id === product.id ? "var(--primary-300)" : "var(--border)",
                            transition: "all 0.2s ease"
                          }}
                          onClick={() => setSelectedProduct(product)}
                          onMouseEnter={(e) => {
                            if (selectedProduct?.id !== product.id) {
                              e.target.style.backgroundColor = "var(--surface-3)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedProduct?.id !== product.id) {
                              e.target.style.backgroundColor = "var(--surface-2)";
                            }
                          }}
                        >
                          <div style={{ 
                            fontWeight: "600", 
                            color: "var(--primary-700)",
                            marginBottom: "4px"
                          }}>
                            {product.productName}
                          </div>
                          <div style={{ 
                            fontSize: "12px", 
                            color: "var(--muted-text)",
                            marginBottom: "4px"
                          }}>
                            {product.productType} â€¢ {product.accountType}
                          </div>
                          {product.interestRate && (
                            <div style={{ 
                              fontSize: "12px", 
                              color: "var(--success-600)",
                              fontWeight: "500"
                            }}>
                              Interest: {product.interestRate}%
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Side - Accounts */}
                <div style={{ 
                  flex: "1", 
                  border: "1px solid var(--border)", 
                  borderRadius: "8px",
                  padding: "16px",
                  backgroundColor: "var(--surface-1)"
                }}>
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    marginBottom: "16px" 
                  }}>
                    <h3 style={{ 
                      color: "var(--primary-700)",
                      fontSize: "16px",
                      fontWeight: "600",
                      margin: 0
                    }}>
                      {isCreate ? "Selected Accounts" : "Member Accounts"}
                    </h3>
                    {!isCreate && (
                      <button
                        type="button"
                        onClick={() => {
                          const memberId = selectedMember?.id || form.id || id;
                          if (memberId && memberId !== "new") {
                            console.log("Manual refresh - fetching accounts for member:", memberId);
                            fetchMemberAccounts(memberId);
                          }
                        }}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "var(--primary-100)",
                          color: "var(--primary-700)",
                          border: "1px solid var(--primary-300)",
                          borderRadius: "4px",
                          fontSize: "12px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                        title="Refresh accounts"
                      >
                        🔄 Refresh
                      </button>
                    )}
                  </div>
                  
                  {selectedProduct && (
                    <div style={{ 
                      marginBottom: "16px",
                      padding: "12px",
                      backgroundColor: "var(--primary-50)",
                      border: "1px solid var(--primary-200)",
                      borderRadius: "6px"
                    }}>
                      <div style={{ 
                        fontSize: "14px", 
                        fontWeight: "600",
                        color: "var(--primary-700)",
                        marginBottom: "4px"
                      }}>
                        Selected: {selectedProduct.productName}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault(); // Prevent form submission
                          if (isCreate) {
                            // For create mode, add to pending accounts
                            const newAccount = {
                              id: `temp-${Date.now()}`,
                              productId: selectedProduct.id,
                              productName: selectedProduct.productName,
                              accountName: form.category === 'Corporate' ? `${form.companyName} - ${selectedProduct.productName}` :
                                           form.category === 'Chama' ? `${form.chamaName} - ${selectedProduct.productName}` :
                                           `${form.firstName} ${form.lastName} - ${selectedProduct.productName}`,
                              availableBalance: 0,
                              status: "Pending",
                              isPending: true
                            };
                            setAccounts(prev => [...prev, newAccount]);
                            setSelectedProduct(null);
                            showMessage("Account added to pending list", "success");
                          } else {
                            createAccountFromProduct(selectedProduct);
                          }
                        }}
                        disabled={creatingAccount}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "var(--primary-600)",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          fontSize: "12px",
                          cursor: creatingAccount ? "not-allowed" : "pointer",
                          opacity: creatingAccount ? 0.6 : 1
                        }}
                      >
                        {isCreate ? "Add Account" : (creatingAccount ? "Creating..." : "Create Account")}
                      </button>
                    </div>
                  )}
                  
                  {!isCreate && accountsLoading && (
                    <div style={{ 
                      padding: "20px", 
                      textAlign: "center",
                      color: "var(--primary-700)"
                    }}>
                      <div style={{ fontSize: "16px", marginBottom: "8px" }}>â³</div>
                      <p>Loading accounts...</p>
                    </div>
                  )}
                  
                  {!isCreate && accountsError && (
                    <div style={{ 
                      padding: "16px", 
                      textAlign: "center",
                      color: "#dc2626",
                      backgroundColor: "rgba(239, 68, 68, 0.1)",
                      borderRadius: "8px",
                      border: "1px solid rgba(239, 68, 68, 0.2)"
                    }}>
                      <div style={{ fontSize: "16px", marginBottom: "8px" }}>âš ï¸</div>
                      <p style={{ fontSize: "14px" }}>{accountsError}</p>
                    </div>
                  )}
                  
                  {accounts.length === 0 && (
                    <div style={{ 
                      padding: "20px", 
                      textAlign: "center",
                      color: "var(--muted-text)"
                    }}>
                      <div style={{ fontSize: "32px", marginBottom: "12px" }}>ðŸ¦</div>
                      <p style={{ fontSize: "14px" }}>
                        {isCreate ? "No accounts selected yet" : "No accounts created yet"}
                      </p>
                      <p style={{ fontSize: "12px", marginTop: "8px", fontStyle: "italic" }}>
                        Select a product from the left to {isCreate ? "add an account" : "create an account"}
                      </p>
                    </div>
                  )}
                
                  {accounts.length > 0 && (
                    <div style={{ 
                      display: "flex", 
                      flexDirection: "column", 
                      gap: "8px",
                      maxHeight: "400px",
                      overflowY: "auto"
                    }}>
                      {accounts.map((account, index) => (
                        <div
                          key={account.id || index}
                          style={{
                            padding: "12px",
                            border: "1px solid var(--border)",
                            borderRadius: "6px",
                            backgroundColor: account.isPending ? "var(--warning-50)" : "var(--surface-2)",
                            borderColor: account.isPending ? "var(--warning-300)" : "var(--border)",
                            cursor: account.isPending ? "default" : "pointer",
                            transition: "all 0.2s ease"
                          }}
                          onClick={() => {
                            if (!account.isPending && !isCreate) {
                              history.push(`/account-form/${account.id}`);
                            }
                          }}
                          onMouseEnter={(e) => {
                            if (!account.isPending && !isCreate) {
                              e.target.style.backgroundColor = "var(--surface-3)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!account.isPending && !isCreate) {
                              e.target.style.backgroundColor = "var(--surface-2)";
                            }
                          }}
                        >
                          <div style={{ 
                            fontWeight: "600", 
                            color: "var(--primary-700)",
                            marginBottom: "4px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                          }}>
                            <span>{account.accountName}</span>
                            {account.isPending && (
                              <span style={{
                                fontSize: "10px",
                                backgroundColor: "var(--warning-200)",
                                color: "var(--warning-800)",
                                padding: "2px 6px",
                                borderRadius: "4px"
                              }}>
                                PENDING
                              </span>
                            )}
                            {isCreate && account.isPending && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAccounts(prev => prev.filter((_, i) => i !== index));
                                  showMessage("Account removed from pending list", "success");
                                }}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "#dc2626",
                                  cursor: "pointer",
                                  fontSize: "14px",
                                  padding: "2px"
                                }}
                                title="Remove account"
                              >
                                Ã—
                              </button>
                            )}
                          </div>
                          <div style={{ 
                            fontSize: "12px", 
                            color: "var(--muted-text)",
                            marginBottom: "4px"
                          }}>
                            {account.productName}
                          </div>
                          <div style={{ 
                            fontSize: "12px", 
                            color: "var(--muted-text)"
                          }}>
                            Balance: 
                            <span style={{ 
                              fontSize: "12px",
                              fontWeight: "600",
                              color: account.availableBalance >= 0 ? "var(--success-600)" : "var(--error-600)"
                            }}>
                              KES {parseFloat(account.availableBalance || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Product Charges Section */}
              {!isCreate && accounts.length > 0 && (
                <div style={{ 
                  marginTop: "20px",
                  border: "1px solid var(--border)", 
                  borderRadius: "8px",
                  padding: "16px",
                  backgroundColor: "var(--surface-1)"
                }}>
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    marginBottom: "16px" 
                  }}>
                    <h3 style={{ 
                      color: "var(--primary-700)",
                      fontSize: "16px",
                      fontWeight: "600",
                      margin: 0
                    }}>
                      Product Charges
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        if (accounts.length > 0) {
                          console.log("Manual refresh - fetching charges for member accounts");
                          fetchProductCharges();
                        }
                      }}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "var(--primary-100)",
                        color: "var(--primary-700)",
                        border: "1px solid var(--primary-300)",
                        borderRadius: "4px",
                        fontSize: "12px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                      title="Refresh charges"
                    >
                      🔄 Refresh Charges
                    </button>
                  </div>
                  
                  {chargesLoading ? (
                    <div style={{ 
                      padding: "20px", 
                      textAlign: "center",
                      color: "var(--primary-700)"
                    }}>
                      <div style={{ fontSize: "16px", marginBottom: "8px" }}>⏳</div>
                      <p>Loading charges...</p>
                    </div>
                  ) : chargesError ? (
                    <div style={{ 
                      padding: "16px", 
                      textAlign: "center",
                      color: "#dc2626",
                      backgroundColor: "rgba(239, 68, 68, 0.1)",
                      borderRadius: "8px",
                      border: "1px solid rgba(239, 68, 68, 0.2)"
                    }}>
                      <div style={{ fontSize: "16px", marginBottom: "8px" }}>⚠️</div>
                      <p style={{ fontSize: "14px" }}>{chargesError}</p>
                    </div>
                  ) : Object.keys(productCharges).length === 0 ? (
                    <div style={{ 
                      padding: "20px", 
                      textAlign: "center",
                      color: "var(--muted-text)"
                    }}>
                      <div style={{ fontSize: "32px", marginBottom: "12px" }}>💳</div>
                      <p style={{ fontSize: "14px" }}>No charges found for selected products</p>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: "12px" }}>
                      {Object.entries(productCharges).map(([productId, { product, charges }]) => (
                        <div key={productId} style={{
                          padding: "12px",
                          backgroundColor: "var(--surface-2)",
                          border: "1px solid var(--border)",
                          borderRadius: "6px"
                        }}>
                          <div style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "var(--primary-700)",
                            marginBottom: "8px"
                          }}>
                            {product.productName}
                          </div>
                          {charges.length === 0 ? (
                            <p style={{
                              margin: 0,
                              color: "var(--muted-text)",
                              fontSize: "12px",
                              fontStyle: "italic"
                            }}>
                              No charges configured for this product
                            </p>
                          ) : (
                            <div style={{ display: "grid", gap: "8px" }}>
                              {charges.map((charge) => (
                                <div key={charge.chargeId} style={{
                                  padding: "8px",
                                  backgroundColor: "var(--surface-3)",
                                  border: "1px solid var(--border)",
                                  borderRadius: "4px",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center"
                                }}>
                                  <div>
                                    <div style={{
                                      fontSize: "12px",
                                      fontWeight: "600",
                                      color: "var(--text-primary)",
                                      marginBottom: "2px"
                                    }}>
                                      {charge.name}
                                    </div>
                                    <div style={{
                                      fontSize: "10px",
                                      color: "var(--muted-text)"
                                    }}>
                                      ID: {charge.chargeId}
                                    </div>
                                  </div>
                                  <div style={{ textAlign: "right" }}>
                                    <div style={{
                                      fontSize: "14px",
                                      fontWeight: "600",
                                      color: "var(--success-600)"
                                    }}>
                                      {charge.currency} {parseFloat(charge.amount).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                                    </div>
                                    <div style={{
                                      fontSize: "10px",
                                      color: charge.status === 'Active' ? "var(--success-600)" : "var(--warning-600)",
                                      fontWeight: "500"
                                    }}>
                                      {charge.status}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px" }}>
                <button
                  type="button"
                  className="pill"
                  onClick={() => handleTabChange("photo")}
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
                  onClick={() => handleTabChange("specialOffers")}
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

          {/* Special Offers Tab */}
          {activeTab === "specialOffers" && (
            <div>
              <div style={{ 
                padding: "20px",
                backgroundColor: "#fff",
                borderRadius: "8px",
                border: "1px solid var(--border)"
              }}>
                <h3 style={{ 
                  color: "var(--primary-700)", 
                  marginBottom: "20px", 
                  fontSize: "18px", 
                  fontWeight: "600" 
                }}>
                  Special Offers Preferences
                </h3>
                
                <div style={{ 
                  display: "grid", 
                  gap: "16px",
                  maxWidth: "600px"
                }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "12px 16px",
                    backgroundColor: "#fef3c7",
                    borderRadius: "8px",
                    border: "1px solid #f59e0b"
                  }}>
                    <input
                      type="checkbox"
                      id="canSendAssociateSpecialOffer"
                      checked={form.canSendAssociateSpecialOffer}
                      onChange={(e) => setForm({ ...form, canSendAssociateSpecialOffer: e.target.checked })}
                      disabled={formMode === 'view'}
                      style={{
                        marginRight: "12px",
                        width: "16px",
                        height: "16px",
                        cursor: formMode === 'view' ? 'not-allowed' : 'pointer'
                      }}
                    />
                    <label 
                      htmlFor="canSendAssociateSpecialOffer"
                      style={{
                        color: "#92400e",
                        fontWeight: "500",
                        cursor: formMode === 'view' ? 'not-allowed' : 'pointer',
                        flex: 1
                      }}
                    >
                      Can Send Associate Special Offer
                    </label>
                  </div>

                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "12px 16px",
                    backgroundColor: "#fef3c7",
                    borderRadius: "8px",
                    border: "1px solid #f59e0b"
                  }}>
                    <input
                      type="checkbox"
                      id="canSendOurSpecialOffers"
                      checked={form.canSendOurSpecialOffers}
                      onChange={(e) => setForm({ ...form, canSendOurSpecialOffers: e.target.checked })}
                      disabled={formMode === 'view'}
                      style={{
                        marginRight: "12px",
                        width: "16px",
                        height: "16px",
                        cursor: formMode === 'view' ? 'not-allowed' : 'pointer'
                      }}
                    />
                    <label 
                      htmlFor="canSendOurSpecialOffers"
                      style={{
                        color: "#92400e",
                        fontWeight: "500",
                        cursor: formMode === 'view' ? 'not-allowed' : 'pointer',
                        flex: 1
                      }}
                    >
                      Can Send Our Special Offers
                    </label>
                  </div>

                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "12px 16px",
                    backgroundColor: "#fef3c7",
                    borderRadius: "8px",
                    border: "1px solid #f59e0b"
                  }}>
                    <input
                      type="checkbox"
                      id="statementOnline"
                      checked={form.statementOnline}
                      onChange={(e) => setForm({ ...form, statementOnline: e.target.checked })}
                      disabled={formMode === 'view'}
                      style={{
                        marginRight: "12px",
                        width: "16px",
                        height: "16px",
                        cursor: formMode === 'view' ? 'not-allowed' : 'pointer'
                      }}
                    />
                    <label 
                      htmlFor="statementOnline"
                      style={{
                        color: "#92400e",
                        fontWeight: "500",
                        cursor: formMode === 'view' ? 'not-allowed' : 'pointer',
                        flex: 1
                      }}
                    >
                      Statement Online
                    </label>
                  </div>

                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "12px 16px",
                    backgroundColor: "#fef3c7",
                    borderRadius: "8px",
                    border: "1px solid #f59e0b"
                  }}>
                    <input
                      type="checkbox"
                      id="mobileAlert"
                      checked={form.mobileAlert}
                      onChange={(e) => setForm({ ...form, mobileAlert: e.target.checked })}
                      disabled={formMode === 'view'}
                      style={{
                        marginRight: "12px",
                        width: "16px",
                        height: "16px",
                        cursor: formMode === 'view' ? 'not-allowed' : 'pointer'
                      }}
                    />
                    <label 
                      htmlFor="mobileAlert"
                      style={{
                        color: "#92400e",
                        fontWeight: "500",
                        cursor: formMode === 'view' ? 'not-allowed' : 'pointer',
                        flex: 1
                      }}
                    >
                      Mobile Alert
                    </label>
                  </div>

                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "12px 16px",
                    backgroundColor: "#fef3c7",
                    borderRadius: "8px",
                    border: "1px solid #f59e0b"
                  }}>
                    <input
                      type="checkbox"
                      id="mobileBanking"
                      checked={form.mobileBanking}
                      onChange={(e) => setForm({ ...form, mobileBanking: e.target.checked })}
                      disabled={formMode === 'view'}
                      style={{
                        marginRight: "12px",
                        width: "16px",
                        height: "16px",
                        cursor: formMode === 'view' ? 'not-allowed' : 'pointer'
                      }}
                    />
                    <label 
                      htmlFor="mobileBanking"
                      style={{
                        color: "#92400e",
                        fontWeight: "500",
                        cursor: formMode === 'view' ? 'not-allowed' : 'pointer',
                        flex: 1
                      }}
                    >
                      Mobile Banking
                    </label>
                  </div>

                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "12px 16px",
                    backgroundColor: "#fef3c7",
                    borderRadius: "8px",
                    border: "1px solid #f59e0b"
                  }}>
                    <input
                      type="checkbox"
                      id="internetBanking"
                      checked={form.internetBanking}
                      onChange={(e) => setForm({ ...form, internetBanking: e.target.checked })}
                      disabled={formMode === 'view'}
                      style={{
                        marginRight: "12px",
                        width: "16px",
                        height: "16px",
                        cursor: formMode === 'view' ? 'not-allowed' : 'pointer'
                      }}
                    />
                    <label 
                      htmlFor="internetBanking"
                      style={{
                        color: "#92400e",
                        fontWeight: "500",
                        cursor: formMode === 'view' ? 'not-allowed' : 'pointer',
                        flex: 1
                      }}
                    >
                      Internet Banking
                    </label>
                  </div>
                </div>
                
                {/* Submit Button Section */}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px" }}>
                  <button
                    type="button"
                    className="pill"
                    onClick={() => handleTabChange("accounts")}
                    style={{
                      padding: "8px 16px",
                      fontSize: "14px",
                      minWidth: "auto"
                    }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="pill"
                    style={{
                      padding: "8px 16px",
                      fontSize: "14px",
                      minWidth: "auto"
                    }}
                  >
                    Save Member
                  </button>
                </div>
              </div>
            </div>
          )}

        </form>

        {/* Audit Fields Section */}
        <hr style={{ margin: "24px 0", border: "none", borderTop: "1px solid #e0e0e0" }} />

        {/* Collapsible Audit Fields Header */}
        <div 
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            backgroundColor: "#f8f9fa",
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            cursor: "pointer",
            marginBottom: showAuditFields ? "16px" : "0",
            transition: "all 0.3s ease"
          }}
          onClick={() => setShowAuditFields(!showAuditFields)}
        >
          <h3 style={{ 
            margin: 0, 
            fontSize: "16px", 
            fontWeight: "600", 
            color: "#333",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <span>📋</span>
            Audit Information
          </h3>
          <span style={{
            fontSize: "18px",
            fontWeight: "bold",
            color: "#666",
            transform: showAuditFields ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.3s ease"
          }}>
            ▼
          </span>
        </div>

        {/* Collapsible Audit Fields Content */}
        {showAuditFields && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "12px",
            marginTop: "16px",
            padding: "16px",
            backgroundColor: "#fafafa",
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            animation: "fadeIn 0.3s ease"
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
        )}
      </section>
    </main>
    
    {/* Lookup Modals */}
    
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
    
    <NationalityLookupModal
      isOpen={isNationalityModalOpen}
      onClose={handleCloseNationalityModal}
      onSelectNationality={handleSelectNationality}
    />
    
    <MaritalStatusLookupModal
      isOpen={isMaritalStatusModalOpen}
      onClose={handleCloseMaritalStatusModal}
      onSelectMaritalStatus={handleSelectMaritalStatus}
    />
    
    <MemberLookupModal
      isOpen={isMemberLookupModalOpen}
      onClose={() => setIsMemberLookupModalOpen(false)}
      onSelectMember={handleMemberSelect}
    />
    
    <MemberLookupModal
      isOpen={isChamaMemberLookupModalOpen}
      onClose={() => setIsChamaMemberLookupModalOpen(false)}
      onSelectMember={handleChamaMemberSelect}
    />
    
    <PhotoUploadModal
      isOpen={showPhotoModal}
      onClose={() => setShowPhotoModal(false)}
      onFileSelect={(file) => handleFileSelect(file, 'photo')}
      title="Upload Member Photo"
    />
    
    <SignatureUploadModal
      isOpen={showSignatureModal}
      onClose={() => setShowSignatureModal(false)}
      onFileSelect={(file) => handleFileSelect(file, 'signature')}
      title="Upload Member Signature"
    />
    
    <BiometricsUploadModal
      isOpen={showBiometricsModal}
      onClose={() => setShowBiometricsModal(false)}
      onFileSelect={(file) => handleFileSelect(file, 'biometrics')}
      title="Upload Member Biometrics"
    />
    
    {/* Guardian Upload Modals */}
    <PhotoUploadModal
      isOpen={showGuardianPhotoModal}
      onClose={() => setShowGuardianPhotoModal(false)}
      onFileSelect={(file) => handleGuardianFileSelect(file, 'photo')}
      title="Upload Guardian Photo"
    />
    
    <SignatureUploadModal
      isOpen={showGuardianSignatureModal}
      onClose={() => setShowGuardianSignatureModal(false)}
      onFileSelect={(file) => handleGuardianFileSelect(file, 'signature')}
      title="Upload Guardian Signature"
    />
    
    <BiometricsUploadModal
      isOpen={showGuardianBiometricsModal}
      onClose={() => setShowGuardianBiometricsModal(false)}
      onFileSelect={(file) => handleGuardianFileSelect(file, 'biometrics')}
      title="Upload Guardian Biometrics"
    />

    {/* Delete Confirmation Modal */}
    {showDeleteModal && (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '400px',
          width: '90%',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}>
          <h3 style={{
            margin: '0 0 16px 0',
            fontSize: '18px',
            fontWeight: '600',
            color: '#1f2937'
          }}>
            Delete Member
          </h3>
          <p style={{
            margin: '0 0 24px 0',
            fontSize: '14px',
            color: '#6b7280',
            lineHeight: '1.5'
          }}>
            Are you sure you want to delete this member? This action cannot be undone.
          </p>
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={() => setShowDeleteModal(false)}
              style={{
                padding: '8px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: 'white',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f9fafb';
                e.target.style.borderColor = '#9ca3af';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'white';
                e.target.style.borderColor = '#d1d5db';
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: '#dc2626',
                color: 'white',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#b91c1c';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#dc2626';
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Approval Confirmation Modal */}
    {showApprovalModal && (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}>
          <h3 style={{
            margin: '0 0 16px 0',
            fontSize: '18px',
            fontWeight: '600',
            color: '#1f2937'
          }}>
            Approve Member
          </h3>
          <p style={{
            margin: '0 0 16px 0',
            fontSize: '14px',
            color: '#6b7280',
            lineHeight: '1.5'
          }}>
            Are you sure you want to approve this member? Please add any verification remarks below.
          </p>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151'
            }}>
              Verification Remarks (Optional)
            </label>
            <textarea
              value={verifierRemarks}
              onChange={(e) => setVerifierRemarks(e.target.value)}
              placeholder="Enter any verification remarks or notes..."
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>
          
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={() => {
                setShowApprovalModal(false);
                setVerifierRemarks("");
              }}
              style={{
                padding: '8px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: 'white',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f9fafb';
                e.target.style.borderColor = '#9ca3af';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'white';
                e.target.style.borderColor = '#d1d5db';
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmApproval}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: '#10b981',
                color: 'white',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#059669';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#10b981';
              }}
            >
              Approve
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );

  // If in window mode, return content directly, otherwise wrap with DashboardWrapper
  if (isWindowMode) {
    return formContent;
  }

  return (
    <DashboardWrapper>
      {formContent}
    </DashboardWrapper>
  );
}

export default MemberForm;
