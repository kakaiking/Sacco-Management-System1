import "./App.css";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import axios from "axios";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import MemberMaintenance from "./pages/MemberMaintenance";
import MemberForm from "./pages/MemberForm";
import ProductMaintenance from "./pages/ProductMaintenance";
import ProductForm from "./pages/ProductForm";
import CurrencyMaintenance from "./pages/CurrencyMaintenance";
import CurrencyForm from "./pages/CurrencyForm";
import ChargesManagement from "./pages/ChargesManagement";
import ChargesForm from "./pages/ChargesForm";
import AccountsManagement from "./pages/AccountsManagement";
import AccountForm from "./pages/AccountForm";
import RoleMaintenance from "./pages/RoleMaintenance";
import RoleForm from "./pages/RoleForm";
import SaccoMaintenance from "./pages/SaccoMaintenance";
import SaccoForm from "./pages/SaccoForm";
import BranchMaintenance from "./pages/BranchMaintenance";
import BranchForm from "./pages/BranchForm";
import Admin from "./pages/Admin";
import LoanCalculator from "./pages/LoanCalculator";
import Registration from "./pages/Registration";
import Login from "./pages/Login";
import PageNotFound from "./pages/PageNotFound";
import Profile from "./pages/Profile";
import ChangePassword from "./pages/ChangePassword";
import UserMaintenance from "./pages/UserMaintenance";
import UserForm from "./pages/UserForm";
import AccountOfficers from "./pages/AccountOfficers";
import AccountOfficerForm from "./pages/AccountOfficerForm";
import SetupPassword from "./pages/SetupPassword";
import LogsManagement from "./pages/LogsManagement";
import TransactionMaintenance from "./pages/TransactionMaintenance";
import TransactionForm from "./pages/TransactionForm";
import CashTransactions from "./pages/CashTransactions";
import CashTransactionForm from "./pages/CashTransactionForm";
import SmartTeller from "./pages/SmartTeller";
import GenderMaintenance from "./pages/GenderMaintenance";
import GenderForm from "./pages/GenderForm";
import NationalityMaintenance from "./pages/NationalityMaintenance";
import NationalityForm from "./pages/NationalityForm";
import MaritalStatusMaintenance from "./pages/MaritalStatusMaintenance";
import MaritalStatusForm from "./pages/MaritalStatusForm";
import IdentificationTypesMaintenance from "./pages/IdentificationTypesMaintenance";
import IdentificationTypesForm from "./pages/IdentificationTypesForm";
import MemberCategoriesMaintenance from "./pages/MemberCategoriesMaintenance";
import MemberCategoriesForm from "./pages/MemberCategoriesForm";
import NextOfKinRelationTypesMaintenance from "./pages/NextOfKinRelationTypesMaintenance";
import NextOfKinRelationTypesForm from "./pages/NextOfKinRelationTypesForm";
import InterestCalculationRulesMaintenance from "./pages/InterestCalculationRulesMaintenance";
import InterestCalculationRulesForm from "./pages/InterestCalculationRulesForm";
import InterestTypesMaintenance from "./pages/InterestTypesMaintenance";
import InterestTypesForm from "./pages/InterestTypesForm";
import InterestFrequencyMaintenance from "./pages/InterestFrequencyMaintenance";
import InterestFrequencyForm from "./pages/InterestFrequencyForm";
import GLAccountsManagement from "./pages/GLAccountsManagement";
import GLAccountForm from "./pages/GLAccountForm";
import AccountTypesMaintenance from "./pages/AccountTypesMaintenance";
import AccountTypesForm from "./pages/AccountTypesForm";
import TillMaintenance from "./pages/TillMaintenance";
import TillForm from "./pages/TillForm";
import LoanProductsMaintenance from "./pages/LoanProductsMaintenance";
import LoanProductForm from "./pages/LoanProductForm";
import LoanApplicationForm from "./pages/LoanApplicationForm";
import LoanAppraisalMaintenance from "./pages/LoanAppraisalMaintenance";
import LoanDisbursementMaintenance from "./pages/LoanDisbursementMaintenance";
import CollateralMaintenance from "./pages/CollateralMaintenance";
import CollateralForm from "./pages/CollateralForm";
import Member360View from "./pages/Member360View";
import PayoutsManagement from "./pages/PayoutsManagement";
import PayoutsForm from "./pages/PayoutsForm";
import IdMaintenance from "./pages/IdMaintenance";
import IdForm from "./pages/IdForm";

import { AuthContext } from "./helpers/AuthContext";
import { SidebarProvider } from "./helpers/SidebarContext";
import { WindowProvider, useWindow } from "./helpers/WindowContext";
import NavbarWrapper from "./components/NavbarWrapper";
import WindowManager from "./components/WindowManager";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { FiMaximize, FiMinimize } from "react-icons/fi";
import { getUserPermissions } from "./helpers/PermissionUtils";
import { fetchRolePermissions } from "./services/roleService";
import OrganizationService from "./services/organizationService";

// Component to conditionally render main content based on window state
const MainContent = ({ children }) => {
  const { windows } = useWindow();
  const hasOpenWindows = windows.some(window => !window.isMinimized);
  
  return (
    <div style={{ display: hasOpenWindows ? 'none' : 'block' }}>
      {children}
    </div>
  );
};

function App() {
  const [authState, setAuthState] = useState({
    username: "",
    id: 0,
    userId: "",
    role: "",
    saccoId: "",
    branchId: "",
    permissions: {},
    status: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [organizationInfo, setOrganizationInfo] = useState({
    sacco: { saccoId: '', saccoName: '' },
    branch: { branchId: '', branchName: '' }
  });
  const [isOrgInfoLoading, setIsOrgInfoLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Memoized function to load organization info
  const loadOrganizationInfo = useCallback(async (saccoId, branchId, tokenPayload = null) => {
    if (!saccoId && !branchId) return;
    
    setIsOrgInfoLoading(true);
    try {
      const orgInfo = await OrganizationService.getOrganizationInfo(saccoId, branchId, tokenPayload);
      setOrganizationInfo(orgInfo);
    } catch (error) {
      console.error('Error loading organization info:', error);
    } finally {
      setIsOrgInfoLoading(false);
    }
  }, []);

  // Memoized organization display component
  const organizationDisplay = useMemo(() => {
    if (!authState.status) return null;
    
    return (
      <div className="organization-info">
        <div className="organization-badge">
          <div className="organization-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="organization-details">
            <div className="sacco-name">{organizationInfo.sacco.saccoName || 'Loading...'}</div>
            {organizationInfo.branch.branchName && organizationInfo.branch.branchName !== 'No Branch' && (
              <>
                <span className="organization-separator">,</span>
                <div className="branch-name">{organizationInfo.branch.branchName}</div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }, [authState.status, organizationInfo]);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("accessToken");
      
      
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await axios.get("http://localhost:3001/users/auth", {
          headers: {
            accessToken: token,
          },
        });
        
        if (response.data.error) {
          // Clear invalid token
          localStorage.removeItem("accessToken");
          setAuthState({ username: "", id: 0, userId: "", role: "", saccoId: "", branchId: "", permissions: {}, status: false });
        } else {
          
          // Fetch role permissions
          const rolePermissions = await fetchRolePermissions(response.data.role);
          const userPermissions = getUserPermissions(response.data.role, rolePermissions);
          
          const authStateData = {
            username: response.data.username,
            id: response.data.id,
            userId: response.data.userId,
            role: response.data.role,
            saccoId: response.data.saccoId || 'SYSTEM',
            branchId: response.data.branchId || '',
            permissions: userPermissions,
            status: true,
          };
          
          // Console log the user state on app initialization with existing token
          console.log("=== APP INITIALIZATION - USER STATE DATA ===");
          console.log("Username:", authStateData.username);
          console.log("User ID:", authStateData.id);
          console.log("User ID (userId):", authStateData.userId);
          console.log("Role:", authStateData.role);
          console.log("Sacco ID:", authStateData.saccoId);
          console.log("Branch ID:", authStateData.branchId);
          console.log("Status:", authStateData.status);
          console.log("Permissions:", authStateData.permissions);
          console.log("Full auth state:", JSON.stringify(authStateData, null, 2));
          
          setAuthState(authStateData);
          
          // Load organization info with token payload for immediate display
          const tokenPayload = response.data;
          await loadOrganizationInfo(authStateData.saccoId, authStateData.branchId, tokenPayload);
        }
      } catch (error) {
        // Clear token only for authentication errors (401/403)
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          localStorage.removeItem("accessToken");
          setAuthState({ username: "", id: 0, userId: "", role: "", saccoId: "", branchId: "", permissions: {}, status: false });
        } else {
          // For any other error, fall back to client-side token decoding
          try {
            const tokenPayload = JSON.parse(atob(token.split('.')[1]));
            // For fallback, we'll use default permissions (no role-specific permissions)
            const userPermissions = getUserPermissions(tokenPayload.role, {});
            
            // Log the state data for fallback authentication
            console.log("=== PAGE REFRESH - FALLBACK AUTH STATE DATA ===");
            console.log("User ID:", tokenPayload.id);
            console.log("User ID (userId):", tokenPayload.userId || "Not available in token");
            console.log("Username:", tokenPayload.username);
            console.log("Role:", tokenPayload.role);
            console.log("Token payload:", JSON.stringify(tokenPayload, null, 2));
            console.log("User permissions (fallback):", JSON.stringify(userPermissions, null, 2));
            console.log("=== END FALLBACK AUTH STATE DATA ===");
            
            const fallbackAuthState = {
              username: tokenPayload.username,
              id: tokenPayload.id,
              userId: tokenPayload.userId || tokenPayload.id, // Fallback to id if userId not available
              role: tokenPayload.role,
              saccoId: tokenPayload.saccoId || 'SYSTEM',
              branchId: tokenPayload.branchId || '',
              permissions: userPermissions,
              status: true,
            };
            
            setAuthState(fallbackAuthState);
            
            // Load organization info for fallback auth with token payload
            await loadOrganizationInfo(fallbackAuthState.saccoId, fallbackAuthState.branchId, tokenPayload);
          } catch (decodeError) {
            localStorage.removeItem("accessToken");
            setAuthState({ username: "", id: 0, userId: "", role: "", saccoId: "", branchId: "", permissions: {}, status: false });
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Load organization info when auth state changes
  useEffect(() => {
    if (authState.status && (authState.saccoId || authState.branchId)) {
      loadOrganizationInfo(authState.saccoId, authState.branchId);
    }
  }, [authState.status, authState.saccoId, authState.branchId, loadOrganizationInfo]);



  const logout = async () => {
    try {
      // Call logout API to log the logout event
      await axios.post("http://localhost:3001/auth/logout", {}, {
        headers: { accessToken: localStorage.getItem("accessToken") }
      });
    } catch (error) {
      console.error("Logout API error:", error);
      // Continue with logout even if API call fails
    }
    
    localStorage.removeItem("accessToken");
    localStorage.removeItem("organizationInfo"); // Clear organization cache
    setAuthState({ username: "", id: 0, userId: "", role: "", saccoId: "", branchId: "", permissions: {}, status: false });
    setOrganizationInfo({ sacco: { saccoId: '', saccoName: '' }, branch: { branchId: '', branchName: '' } });
    window.location.href = "/login";
  };

  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const avatarMenuRef = useRef(null);
  useEffect(() => {
    function handleClickOutside(event) {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(event.target)) {
        setIsAvatarMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fullscreen functionality
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(err => {
        console.error('Error attempting to exit fullscreen:', err);
      });
    }
  };

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="App">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          fontSize: '18px',
          color: '#666'
        }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
        <div className="App">
          <AuthContext.Provider value={{ authState, setAuthState, logout, isLoading }}>
            <SidebarProvider isAuthenticated={authState.status}>
              <WindowProvider>
                <Router>
                  <Sidebar />
                <NavbarWrapper>
                <div className="links">
                  {!authState.status ? (
                    <>
                      {/* <Link to="/login"> Login</Link>
                      <Link to="/registration"> Registration</Link> */}
                    </>
                  ) : (
                    <>
                      {/* Organization Info Display */}
                      {organizationDisplay}
                    </>
                  )}
                </div>
                <div className="loggedInContainer">
                  {authState.status && (
                    <>
                      {/* Current Time Display */}
                      <div className="current-time">
                        {currentTime.toLocaleDateString('en-GB', {
                          weekday: 'short',
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        }).replace(/\//g, '-')} {currentTime.toLocaleTimeString('en-GB', {
                          hour12: false
                        })}
                      </div>
                      <button 
                        className="fullscreenButton"
                        onClick={toggleFullscreen}
                        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--primary-700)",
                          cursor: "pointer",
                          padding: "8px",
                          borderRadius: "4px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "18px",
                          transition: "all 0.2s ease",
                          marginRight: "15px",
                          width: "auto"
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = "var(--surface-2)";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = "transparent";
                        }}
                      >
                        {isFullscreen ? <FiMinimize /> : <FiMaximize />}
                      </button>
                      <div className="avatarMenu" ref={avatarMenuRef}>
                        {/* <button className="avatarButton" > */}
                          <div className="avatar" onClick={() => setIsAvatarMenuOpen(v => !v)} aria-haspopup="true" aria-expanded={isAvatarMenuOpen}>{authState?.username?.[0]?.toUpperCase() || "U"}</div>
                        {/* </button> */}
                        {isAvatarMenuOpen && (
                          <div className="avatarDropdown" role="menu">
                            <button className="dropdownItem" onClick={logout}>Logout</button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </NavbarWrapper>
              
              {/* Window Manager for window-based modules */}
              <WindowManager />
              
              {/* Main content - hidden when windows are open */}
              <MainContent>
                <Switch>
                <Route path="/" exact component={Home} />
                <Route path="/admin" exact component={Admin} />
                <Route path="/member-maintenance" exact component={MemberMaintenance} />
                <Route path="/member-form/new" exact component={MemberForm} />
                <Route path="/member-form/:id" exact component={MemberForm} />
                <Route path="/product-maintenance" exact component={ProductMaintenance} />
                <Route path="/product/:id" exact component={ProductForm} />
                <Route path="/currency-maintenance" exact component={CurrencyMaintenance} />
                <Route path="/currency/:id" exact component={CurrencyForm} />
                <Route path="/charges-management" exact component={ChargesManagement} />
                <Route path="/charges-form/:id" exact component={ChargesForm} />
                <Route path="/accounts-management" exact component={AccountsManagement} />
                <Route path="/account-form/:id" exact component={AccountForm} />
                <Route path="/role-maintenance" exact component={RoleMaintenance} />
                <Route path="/role-form/:id" exact component={RoleForm} />
                <Route path="/sacco-maintenance" exact component={SaccoMaintenance} />
                <Route path="/sacco/:id" exact component={SaccoForm} />
                <Route path="/branch-maintenance" exact component={BranchMaintenance} />
                <Route path="/branch-form/:id" exact component={BranchForm} />
                <Route path="/loan-calculator" exact component={LoanCalculator} />
                <Route path="/registration" exact component={Registration} />
                <Route path="/login" exact component={Login} />
                <Route path="/profile/:id" exact component={Profile} />
                <Route path="/changepassword" exact component={ChangePassword} />
                <Route path="/user-maintenance" exact component={UserMaintenance} />
                <Route path="/user-form/:id" exact component={UserForm} />
                <Route path="/account-officers" exact component={AccountOfficers} />
                <Route path="/account-officers/new" exact component={AccountOfficerForm} />
                <Route path="/account-officers/:id" exact component={AccountOfficerForm} />
                <Route path="/setup-password" exact component={SetupPassword} />
                <Route path="/logs-management" exact component={LogsManagement} />
                <Route path="/transactions" exact component={TransactionMaintenance} />
                <Route path="/transaction/:id" exact component={TransactionForm} />
                <Route path="/transfer-transaction" exact component={TransactionForm} />
                <Route path="/smart-teller" exact component={SmartTeller} />
                <Route path="/cash-transactions" exact component={CashTransactionForm} />
                <Route path="/cash-transaction/:id" exact component={CashTransactionForm} />
                <Route path="/gender-maintenance" exact component={GenderMaintenance} />
                <Route path="/gender/:id" exact component={GenderForm} />
                <Route path="/nationality-maintenance" exact component={NationalityMaintenance} />
                <Route path="/nationality/:id" exact component={NationalityForm} />
                <Route path="/marital-status-maintenance" exact component={MaritalStatusMaintenance} />
                <Route path="/marital-status-form/:id" exact component={MaritalStatusForm} />
                <Route path="/identification-types-maintenance" exact component={IdentificationTypesMaintenance} />
                <Route path="/identification-type/:id" exact component={IdentificationTypesForm} />
                <Route path="/member-categories-maintenance" exact component={MemberCategoriesMaintenance} />
                <Route path="/member-categories/:id" exact component={MemberCategoriesForm} />
                <Route path="/next-of-kin-relation-types-maintenance" exact component={NextOfKinRelationTypesMaintenance} />
                <Route path="/next-of-kin-relation-types/:id" exact component={NextOfKinRelationTypesForm} />
                <Route path="/interest-calculation-rules-maintenance" exact component={InterestCalculationRulesMaintenance} />
                <Route path="/interest-calculation-rules/:id" exact component={InterestCalculationRulesForm} />
                <Route path="/interest-types-maintenance" exact component={InterestTypesMaintenance} />
                <Route path="/interest-types/:id" exact component={InterestTypesForm} />
                <Route path="/interest-frequency-maintenance" exact component={InterestFrequencyMaintenance} />
                <Route path="/interest-frequency/:id" exact component={InterestFrequencyForm} />
                <Route path="/gl-accounts-management" exact component={GLAccountsManagement} />
                <Route path="/account-types-maintenance" exact component={AccountTypesMaintenance} />
                <Route path="/account-types/:id" exact component={AccountTypesForm} />
                <Route path="/gl-account-form/:id" exact component={GLAccountForm} />
                <Route path="/till-maintenance" exact component={TillMaintenance} />
                <Route path="/till-form/:id" exact component={TillForm} />
                <Route path="/loan-products-maintenance" exact component={LoanProductsMaintenance} />
                <Route path="/loan-product/:id" exact component={LoanProductForm} />
                <Route path="/loan-application" exact component={LoanApplicationForm} />
                <Route path="/loan-application/:id" exact component={LoanApplicationForm} />
                <Route path="/loan-appraisal-maintenance" exact component={LoanAppraisalMaintenance} />
                <Route path="/loan-disbursement-maintenance" exact component={LoanDisbursementMaintenance} />
                <Route path="/collateral" exact component={CollateralMaintenance} />
                <Route path="/collateral/new" exact component={CollateralForm} />
                <Route path="/collateral/:id" exact component={CollateralForm} />
                <Route path="/member-360-view" exact component={Member360View} />
                <Route path="/payouts-management" exact component={PayoutsManagement} />
                <Route path="/payouts/:id" exact component={PayoutsForm} />
                <Route path="/id-maintenance" exact component={IdMaintenance} />
                <Route path="/id-format/:id" exact component={IdForm} />
                <Route path="*" exact component={PageNotFound} />
                </Switch>
              </MainContent>
                </Router>
              </WindowProvider>
            </SidebarProvider>
          </AuthContext.Provider>
        </div>
  );
}

export default App;
