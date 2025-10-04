import React, { useState } from "react";
import { Link, useLocation, useHistory } from "react-router-dom";
import { FiHome, FiSettings, FiChevronLeft, FiChevronRight, FiChevronDown, FiChevronUp, FiUsers, FiDollarSign, FiCreditCard, FiDatabase, FiFileText, FiTrendingUp } from "react-icons/fi";
import { AuthContext } from "../helpers/AuthContext";
import { useSidebar } from "../helpers/SidebarContext";
import { useWindow } from "../helpers/WindowContext";
import { usePermissions } from "../hooks/usePermissions";
import { PERMISSIONS } from "../helpers/PermissionUtils";
import frontendLoggingService from "../services/frontendLoggingService";
import MemberForm from "../pages/MemberForm";
import Member360View from "../pages/Member360View";
import SavingsAccountsForm from "../pages/SavingsAccountsForm";
import LoansAccountsForm from "../pages/LoansAccountsForm";
import FixedDepositsForm from "../pages/FixedDepositsForm";
import AccountOfficerForm from "../pages/AccountOfficerForm";
import SavingsProductsForm from "../pages/SavingsProductsForm";
import TransferTransactionForm from "../pages/TransferTransactionForm";
import LoansProductsForm from "../pages/LoansProductsForm";
import TransactionMaintenance from "../pages/TransactionMaintenance";
import CashTransactionForm from "../pages/CashTransactionForm";
import BranchForm from "../pages/BranchForm";
import TillForm from "../pages/TillForm";
import ChargesForm from "../pages/ChargesForm";
import GLAccountForm from "../pages/GLAccountForm";
import SmartTeller from "../pages/SmartTeller";

function Sidebar() {
  const { isOpen, setIsOpen, isAuthenticated } = useSidebar();
  const { openWindow, isWindowOpen, getWindowByType, restoreWindow, bringToFront } = useWindow();
  const [membersOpen, setMembersOpen] = useState(false);
  const [accountsOpen, setAccountsOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [transactionsOpen, setTransactionsOpen] = useState(false);
  const [staticDataOpen, setStaticDataOpen] = useState(false);
  const [loansOpen, setLoansOpen] = useState(false);
  const [payoutsOpen, setPayoutsOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const location = useLocation();
  const history = useHistory();
  const { authState } = React.useContext(AuthContext);
  const { canView } = usePermissions();
  
  // Hide sidebar completely on login page
  const isLoginPage = location.pathname === '/login';
  if (isLoginPage) {
    return null;
  }
  
  // Debug: Check permissions
  // console.log('ACCOUNTS_MANAGEMENT permission:', canView(PERMISSIONS.ACCOUNTS_MANAGEMENT));
  
  // Helper function to open member maintenance window
  const openMemberMaintenanceWindow = () => {
    const existingWindow = getWindowByType('member-maintenance');
    if (existingWindow) {
      // If window exists but is minimized, restore it
      if (existingWindow.isMinimized) {
        restoreWindow(existingWindow.id);
      } else {
        // If window is already open, bring it to front
        bringToFront(existingWindow.id);
      }
    } else {
      const windowId = openWindow({
        type: 'member-maintenance',
        title: 'Member Maintenance',
        icon: '👤',
        component: MemberForm,
        props: { id: 'new', isWindowMode: true }
      });
      // Automatically restore the newly opened window
      setTimeout(() => restoreWindow(windowId), 0);
    }
    frontendLoggingService.logMenuClick("Members", "Member Maintenance");
  };

  // Helper function to open member 360 view window
  const openMember360Window = () => {
    const existingWindow = getWindowByType('member-360-view');
    if (existingWindow) {
      // If window exists but is minimized, restore it
      if (existingWindow.isMinimized) {
        restoreWindow(existingWindow.id);
      } else {
        // If window is already open, bring it to front
        bringToFront(existingWindow.id);
      }
    } else {
      const windowId = openWindow({
        type: 'member-360-view',
        title: 'Member 360 View',
        icon: '🔍',
        component: Member360View,
        props: { isWindowMode: true }
      });
      // Automatically restore the newly opened window
      setTimeout(() => restoreWindow(windowId), 0);
    }
    frontendLoggingService.logMenuClick("Members", "Member 360 View");
  };

  // Helper function to open savings accounts window
  const openSavingsAccountsWindow = () => {
    const existingWindow = getWindowByType('savings-accounts');
    if (existingWindow) {
      // If window exists but is minimized, restore it
      if (existingWindow.isMinimized) {
        restoreWindow(existingWindow.id);
      } else {
        // If window is already open, bring it to front
        bringToFront(existingWindow.id);
      }
    } else {
      const windowId = openWindow({
        type: 'savings-accounts',
        title: 'Savings Accounts',
        icon: '💰',
        component: SavingsAccountsForm,
        props: { id: 'new', isWindowMode: true }
      });
      // Automatically restore the newly opened window
      setTimeout(() => restoreWindow(windowId), 0);
    }
    frontendLoggingService.logMenuClick("Accounts", "Savings Accounts");
  };

  // Helper function to open loans accounts window
  const openLoansAccountsWindow = () => {
    const existingWindow = getWindowByType('loans-accounts');
    if (existingWindow) {
      // If window exists but is minimized, restore it
      if (existingWindow.isMinimized) {
        restoreWindow(existingWindow.id);
      } else {
        // If window is already open, bring it to front
        bringToFront(existingWindow.id);
      }
    } else {
      const windowId = openWindow({
        type: 'loans-accounts',
        title: 'Loans Accounts',
        icon: '🏦',
        component: LoansAccountsForm,
        props: { id: 'new', isWindowMode: true }
      });
      // Automatically restore the newly opened window
      setTimeout(() => restoreWindow(windowId), 0);
    }
    frontendLoggingService.logMenuClick("Accounts", "Loans Accounts");
  };

  // Helper function to open fixed deposits window
  const openFixedDepositsWindow = () => {
    const existingWindow = getWindowByType('fixed-deposits');
    if (existingWindow) {
      // If window exists but is minimized, restore it
      if (existingWindow.isMinimized) {
        restoreWindow(existingWindow.id);
      } else {
        // If window is already open, bring it to front
        bringToFront(existingWindow.id);
      }
    } else {
      const windowId = openWindow({
        type: 'fixed-deposits',
        title: 'Fixed Deposits',
        icon: '💎',
        component: FixedDepositsForm,
        props: { id: 'new', isWindowMode: true }
      });
      // Automatically restore the newly opened window
      setTimeout(() => restoreWindow(windowId), 0);
    }
    frontendLoggingService.logMenuClick("Accounts", "Fixed Deposits");
  };

  // Helper function to open savings products window
  const openSavingsProductsWindow = () => {
    const existingWindow = getWindowByType('savings-products');
    if (existingWindow) {
      // If window exists but is minimized, restore it
      if (existingWindow.isMinimized) {
        restoreWindow(existingWindow.id);
      } else {
        // If window is already open, bring it to front
        bringToFront(existingWindow.id);
      }
    } else {
      const windowId = openWindow({
        type: 'savings-products',
        title: 'Savings Products',
        icon: '💰',
        component: SavingsProductsForm,
        props: { id: 'new', isWindowMode: true }
      });
      // Automatically restore the newly opened window
      setTimeout(() => restoreWindow(windowId), 0);
    }
    frontendLoggingService.logMenuClick("Products", "Savings Products");
  };

  // Helper function to open transfer transaction window
  const openTransferTransactionWindow = () => {
    const existingWindow = getWindowByType('transfer-transaction');
    if (existingWindow) {
      // If window exists but is minimized, restore it
      if (existingWindow.isMinimized) {
        restoreWindow(existingWindow.id);
      } else {
        // If window is already open, bring it to front
        bringToFront(existingWindow.id);
      }
    } else {
      const windowId = openWindow({
        type: 'transfer-transaction',
        title: 'Transfer Transaction',
        icon: '💸',
        component: TransferTransactionForm,
        props: { id: 'new', isWindowMode: true }
      });
      // Automatically restore the newly opened window
      setTimeout(() => restoreWindow(windowId), 0);
    }
    frontendLoggingService.logMenuClick("Transactions", "Transfer Transaction");
  };

  const openLoansProductsWindow = () => {
    const existingWindow = getWindowByType('loans-products');
    if (existingWindow) {
      if (existingWindow.isMinimized) {
        restoreWindow(existingWindow.id);
      } else {
        bringToFront(existingWindow.id);
      }
    } else {
      const windowId = openWindow({
        type: 'loans-products',
        title: 'Loans Products',
        icon: '🏦',
        component: LoansProductsForm,
        props: { id: 'new', isWindowMode: true }
      });
      setTimeout(() => restoreWindow(windowId), 0);
    }
    frontendLoggingService.logMenuClick("Products", "Loans Products");
  };

  // Helper function to open general ledger window
  const openGeneralLedgerWindow = () => {
    const existingWindow = getWindowByType('general-ledger');
    if (existingWindow) {
      // If window exists but is minimized, restore it
      if (existingWindow.isMinimized) {
        restoreWindow(existingWindow.id);
      } else {
        // If window is already open, bring it to front
        bringToFront(existingWindow.id);
      }
    } else {
      const windowId = openWindow({
        type: 'general-ledger',
        title: 'General Ledger Maintenance',
        icon: '📒',
        component: TransactionMaintenance,
        props: { isWindowMode: true }
      });
      // Automatically restore the newly opened window
      setTimeout(() => restoreWindow(windowId), 0);
    }
    frontendLoggingService.logMenuClick("Transactions", "General Ledger");
  };

  // Helper function to open smart teller window
  const openSmartTellerWindow = () => {
    const existingWindow = getWindowByType('smart-teller');
    if (existingWindow) {
      // If window exists but is minimized, restore it
      if (existingWindow.isMinimized) {
        restoreWindow(existingWindow.id);
      } else {
        // If window is already open, bring it to front
        bringToFront(existingWindow.id);
      }
    } else {
      const windowId = openWindow({
        type: 'smart-teller',
        title: 'Smart Teller - Multi-Entry Transaction',
        icon: '💰',
        component: SmartTeller,
        props: { isWindowMode: true }
      });
      // Automatically restore the newly opened window
      setTimeout(() => restoreWindow(windowId), 0);
    }
    frontendLoggingService.logMenuClick("Transactions", "Smart Teller");
  };

  // Helper function to open charges form window
  const openChargesFormWindow = () => {
    const existingWindow = getWindowByType('charges-form');
    if (existingWindow) {
      // If window exists but is minimized, restore it
      if (existingWindow.isMinimized) {
        restoreWindow(existingWindow.id);
      } else {
        // If window is already open, bring it to front
        bringToFront(existingWindow.id);
      }
    } else {
      const windowId = openWindow({
        type: 'charges-form',
        title: 'Charges Maintenance',
        icon: '💳',
        component: ChargesForm,
        props: { id: 'new', isWindowMode: true }
      });
      // Automatically restore the newly opened window
      setTimeout(() => restoreWindow(windowId), 0);
    }
    frontendLoggingService.logMenuClick("Configurations", "Charges Maintenance");
  };

  // Helper function to open cash transaction form window
  const openCashTransactionWindow = () => {
    const existingWindow = getWindowByType('cash-transaction-form');
    if (existingWindow) {
      // If window exists but is minimized, restore it
      if (existingWindow.isMinimized) {
        restoreWindow(existingWindow.id);
      } else {
        // If window is already open, bring it to front
        bringToFront(existingWindow.id);
      }
    } else {
      const windowId = openWindow({
        type: 'cash-transaction-form',
        title: 'Cash Transaction',
        icon: '💵',
        component: CashTransactionForm,
        props: { isWindowMode: true }
      });
      // Automatically restore the newly opened window
      setTimeout(() => restoreWindow(windowId), 0);
    }
    frontendLoggingService.logMenuClick("Transactions", "Cash Transaction");
  };

  // Helper function to open branch maintenance window
  const openBranchMaintenanceWindow = () => {
    const existingWindow = getWindowByType('branch-maintenance');
    if (existingWindow) {
      // If window exists but is minimized, restore it
      if (existingWindow.isMinimized) {
        restoreWindow(existingWindow.id);
      } else {
        // If window is already open, bring it to front
        bringToFront(existingWindow.id);
      }
    } else {
      const windowId = openWindow({
        type: 'branch-maintenance',
        title: 'Branch Maintenance',
        icon: '🏢',
        component: BranchForm,
        props: { id: 'new', isWindowMode: true }
      });
      // Automatically restore the newly opened window
      setTimeout(() => restoreWindow(windowId), 0);
    }
    frontendLoggingService.logMenuClick("Configurations", "Branch Maintenance");
  };

  // Helper function to open till maintenance window
  const openTillMaintenanceWindow = () => {
    const existingWindow = getWindowByType('till-maintenance');
    if (existingWindow) {
      // If window exists but is minimized, restore it
      if (existingWindow.isMinimized) {
        restoreWindow(existingWindow.id);
      } else {
        // If window is already open, bring it to front
        bringToFront(existingWindow.id);
      }
    } else {
      const windowId = openWindow({
        type: 'till-maintenance',
        title: 'Till Maintenance',
        icon: '💰',
        component: TillForm,
        props: { id: 'new', isWindowMode: true }
      });
      // Automatically restore the newly opened window
      setTimeout(() => restoreWindow(windowId), 0);
    }
    frontendLoggingService.logMenuClick("Configurations", "Till Maintenance");
  };

  // Helper function to open GL Accounts window
  const openGLAccountsWindow = () => {
    const existingWindow = getWindowByType('gl-accounts');
    if (existingWindow) {
      // If window exists but is minimized, restore it
      if (existingWindow.isMinimized) {
        restoreWindow(existingWindow.id);
      } else {
        // If window is already open, bring it to front
        bringToFront(existingWindow.id);
      }
    } else {
      const windowId = openWindow({
        type: 'gl-accounts',
        title: 'GL Accounts',
        icon: '📒',
        component: GLAccountForm,
        props: { id: 'new', isWindowMode: true }
      });
      // Automatically restore the newly opened window
      setTimeout(() => restoreWindow(windowId), 0);
    }
    frontendLoggingService.logMenuClick("Accounts", "GL Accounts");
  };

  return (
    <>
      <aside className={`o-sidebar ${isOpen ? "open" : ""}`}>
        {/* Sacco Lite Brand Section - At the very top */}
        <div className="sidebar-brand-section">
          <div className="sidebar-brand-logo">
            <img src="/craftLogo2.png" alt="Craft Silicon" className="sidebar-brand-img" />
          </div>
          <div className="sidebar-brand-title">
            <span className="sidebar-brand-text">Sacco Lite</span>
          </div>
        </div>
        
        <div className="o-sidebar__brand">
          {/* User Profile Section */}
          {authState.status && (
            <div className="sidebar-user-section">
              <div 
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  backgroundColor: "#fff",
                  color: "var(--primary-700)",
                  fontWeight: "700",
                  fontSize: "24px",
                  marginBottom: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                }}
              >
                {authState?.username?.[0]?.toUpperCase() || "U"}
              </div>
              <div style={{ 
                color: "var(--primary-700)", 
                fontWeight: "600", 
                fontSize: "16px",
                textAlign: "center"
              }}>
                {authState?.username || "User"}
              </div>
              <div style={{ 
                color: "var(--muted-text)", 
                fontWeight: "500", 
                fontSize: "12px",
                textAlign: "center",
                marginTop: "4px",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                {authState?.role || "User"}
              </div>
            </div>
          )}
        </div>

        <hr style={{ margin: "0 16px", border: "none", borderTop: "1px solid var(--border)" }} />

        <div className="o-sidebar__content">
          <nav className="o-menu">
          <button className={`o-menu__item ${location.pathname === "/" ? "active" : ""}`} type="button" onClick={() => {
            frontendLoggingService.logMenuClick("Home");
            history.push("/");
          }}>
            <span className="o-menu__icon"><FiHome /></span>
            <span className="o-menu__label">Home</span>
          </button>
          

          {/* Members Section - Only show if user has permission to view member maintenance */}
          {canView(PERMISSIONS.MEMBER_MAINTENANCE) && (
            <>
              <button className={`o-menu__item`} type="button" onClick={() => {
                frontendLoggingService.logMenuClick("Members", membersOpen ? "Close" : "Open");
                setMembersOpen(v => !v);
                setAdminOpen(false);
                setConfigOpen(false);
                setTransactionsOpen(false);
                setStaticDataOpen(false);
                setLoansOpen(false);
                setPayoutsOpen(false);
              }}>
                <span className="o-menu__icon"><FiUsers /></span>
                <span className="o-menu__label">Members</span>
                <span className={`o-menu__arrow ${membersOpen ? "up" : "down"}`}>{membersOpen ? <FiChevronUp /> : <FiChevronDown />}</span>
              </button>

              {membersOpen && (
                <div className="o-submenu">
                  <button 
                    className={`o-submenu__item ${isWindowOpen('member-maintenance') ? "active" : ""}`} 
                    onClick={openMemberMaintenanceWindow}
                  >
                    Member Maintenance
                  </button>
                  <button 
                    className={`o-submenu__item ${isWindowOpen('member-360-view') ? "active" : ""}`} 
                    onClick={openMember360Window}
                  >
                    Member 360 View
                  </button>
                </div>
              )}
            </>
          )}

          {/* Accounts Section - Only show if user has permission to view accounts management */}
          {canView(PERMISSIONS.ACCOUNTS_MANAGEMENT) && (
            <>
              <button className={`o-menu__item`} type="button" onClick={() => {
                frontendLoggingService.logMenuClick("Accounts", accountsOpen ? "Close" : "Open");
                setAccountsOpen(v => !v);
                setMembersOpen(false);
                setAdminOpen(false);
                setConfigOpen(false);
                setTransactionsOpen(false);
                setStaticDataOpen(false);
                setLoansOpen(false);
                setPayoutsOpen(false);
                setProductsOpen(false);
              }}>
                <span className="o-menu__icon"><FiCreditCard /></span>
                <span className="o-menu__label">Accounts</span>
                <span className={`o-menu__arrow ${accountsOpen ? "up" : "down"}`}>{accountsOpen ? <FiChevronUp /> : <FiChevronDown />}</span>
              </button>

              {accountsOpen && (
                <div className="o-submenu">
                  <button 
                    className={`o-submenu__item ${isWindowOpen('savings-accounts') ? "active" : ""}`} 
                    onClick={openSavingsAccountsWindow}
                  >
                    Savings Accounts
                  </button>
                  <button 
                    className={`o-submenu__item ${isWindowOpen('loans-accounts') ? "active" : ""}`} 
                    onClick={openLoansAccountsWindow}
                  >
                    Loans Accounts
                  </button>
                  <button 
                    className={`o-submenu__item ${isWindowOpen('fixed-deposits') ? "active" : ""}`} 
                    onClick={openFixedDepositsWindow}
                  >
                    Fixed Deposits
                  </button>
                  <button 
                    className={`o-submenu__item ${isWindowOpen('gl-accounts') ? "active" : ""}`} 
                    onClick={openGLAccountsWindow}
                  >
                    GL Accounts
                  </button>
                </div>
              )}
            </>
          )}

          {/* Products Section - Only show if user has permission to view product maintenance */}
          {canView(PERMISSIONS.PRODUCT_MAINTENANCE) && (
            <>
              <button className={`o-menu__item`} type="button" onClick={() => {
                frontendLoggingService.logMenuClick("Products", productsOpen ? "Close" : "Open");
                setProductsOpen(v => !v);
                setMembersOpen(false);
                setAccountsOpen(false);
                setAdminOpen(false);
                setConfigOpen(false);
                setTransactionsOpen(false);
                setStaticDataOpen(false);
                setLoansOpen(false);
                setPayoutsOpen(false);
              }}>
                <span className="o-menu__icon"><FiDollarSign /></span>
                <span className="o-menu__label">Products</span>
                <span className={`o-menu__arrow ${productsOpen ? "up" : "down"}`}>{productsOpen ? <FiChevronUp /> : <FiChevronDown />}</span>
              </button>

              {productsOpen && (
                <div className="o-submenu">
                  <button 
                    className={`o-submenu__item ${isWindowOpen('savings-products') ? "active" : ""}`} 
                    onClick={openSavingsProductsWindow}
                  >
                    Savings Products
                  </button>
                  <button 
                    className={`o-submenu__item ${isWindowOpen('loans-products') ? "active" : ""}`} 
                    onClick={openLoansProductsWindow}
                  >
                    Loans Products
                  </button>
                </div>
              )}
            </>
          )}

          {/* Transactions Section - Moved after Products - Only show if user has permission to view transactions module */}
          {canView(PERMISSIONS.TRANSACTION_MAINTENANCE) && (
            <>
              <button className={`o-menu__item`} type="button" onClick={() => {
                frontendLoggingService.logMenuClick("Transactions", transactionsOpen ? "Close" : "Open");
                setTransactionsOpen(v => !v);
                setMembersOpen(false);
                setAccountsOpen(false);
                setAdminOpen(false);
                setConfigOpen(false);
                setStaticDataOpen(false);
                setLoansOpen(false);
                setPayoutsOpen(false);
                setProductsOpen(false);
              }}>
                <span className="o-menu__icon"><FiCreditCard /></span>
                <span className="o-menu__label">Transactions</span>
                <span className={`o-menu__arrow ${transactionsOpen ? "up" : "down"}`}>{transactionsOpen ? <FiChevronUp /> : <FiChevronDown />}</span>
              </button>

              {transactionsOpen && (
                <div className="o-submenu">
                  <button 
                    className={`o-submenu__item ${isWindowOpen('transfer-transaction') ? "active" : ""}`} 
                    onClick={openTransferTransactionWindow}
                    style={{
                      cursor: 'pointer',
                      fontSize: 'inherit',
                      fontFamily: 'inherit',
                      fontWeight: 'inherit'
                    }}
                  >
                    Transfer Transaction
                  </button>
                  <button 
                    className={`o-submenu__item ${isWindowOpen('general-ledger') ? "active" : ""}`} 
                    onClick={openGeneralLedgerWindow}
                    style={{
                      cursor: 'pointer',
                      fontSize: 'inherit',
                      fontFamily: 'inherit',
                      fontWeight: 'inherit'
                    }}
                  >
                    General Ledger
                  </button>
                  <button 
                    className={`o-submenu__item ${isWindowOpen('cash-transaction-form') ? "active" : ""}`} 
                    onClick={openCashTransactionWindow}
                    style={{
                      cursor: 'pointer',
                      fontSize: 'inherit',
                      fontFamily: 'inherit',
                      fontWeight: 'inherit'
                    }}
                  >
                    Cash Transaction
                  </button>
                  <button 
                    className={`o-submenu__item ${isWindowOpen('smart-teller') ? "active" : ""}`} 
                    onClick={openSmartTellerWindow}
                    style={{
                      cursor: 'pointer',
                      fontSize: 'inherit',
                      fontFamily: 'inherit',
                      fontWeight: 'inherit'
                    }}
                  >
                    Smart Teller
                  </button>
                </div>
              )}
            </>
          )}

          {/* Admin Section - Only show if user has permission to view any admin module */}
          {(canView(PERMISSIONS.USER_MAINTENANCE) ||
            canView(PERMISSIONS.ROLE_MAINTENANCE) ||
            canView(PERMISSIONS.LOGS_MAINTENANCE)) && (
            <>
              <button className={`o-menu__item`} type="button" onClick={() => {
                frontendLoggingService.logMenuClick("Admin", adminOpen ? "Close" : "Open");
                setAdminOpen(v => !v);
                setMembersOpen(false);
                setAccountsOpen(false);
                setConfigOpen(false);
                setTransactionsOpen(false);
                setStaticDataOpen(false);
                setLoansOpen(false);
                setPayoutsOpen(false);
                setProductsOpen(false);
              }}>
                <span className="o-menu__icon"><FiUsers /></span>
                <span className="o-menu__label">Admin</span>
                <span className={`o-menu__arrow ${adminOpen ? "up" : "down"}`}>{adminOpen ? <FiChevronUp /> : <FiChevronDown />}</span>
              </button>

              {adminOpen && (
                <div className="o-submenu">
                  {canView(PERMISSIONS.USER_MAINTENANCE) && (
                    <Link 
                      className={`o-submenu__item ${location.pathname === "/user-maintenance" ? "active" : ""}`} 
                      to="/user-maintenance"
                      onClick={() => frontendLoggingService.logMenuClick("Admin", "User Maintenance")}
                    >
                      User Maintenance
                    </Link>
                  )}
                  {canView(PERMISSIONS.ROLE_MAINTENANCE) && (
                    <Link 
                      className={`o-submenu__item ${location.pathname === "/role-maintenance" ? "active" : ""}`} 
                      to="/role-maintenance"
                      onClick={() => frontendLoggingService.logMenuClick("Admin", "Role Maintenance")}
                    >
                      Role Maintenance
                    </Link>
                  )}
                  {canView(PERMISSIONS.LOGS_MAINTENANCE) && (
                    <Link 
                      className={`o-submenu__item ${location.pathname === "/logs-management" ? "active" : ""}`} 
                      to="/logs-management"
                      onClick={() => frontendLoggingService.logMenuClick("Admin", "Logs")}
                    >
                      Logs
                    </Link>
                  )}
                </div>
              )}
            </>
          )}

          {/* Configurations Section - Only show if user has permission to view any config module */}
          {(canView(PERMISSIONS.PRODUCT_MAINTENANCE) ||
            canView(PERMISSIONS.SACCO_MAINTENANCE) ||
            canView(PERMISSIONS.BRANCH_MAINTENANCE) ||
            canView(PERMISSIONS.CHARGES_MANAGEMENT) ||
            canView(PERMISSIONS.TILL_MAINTENANCE)) && (
            <>
              <button className={`o-menu__item`} type="button" onClick={() => {
                frontendLoggingService.logMenuClick("Configurations", configOpen ? "Close" : "Open");
                setConfigOpen(v => !v);
                setMembersOpen(false);
                setAccountsOpen(false);
                setAdminOpen(false);
                setTransactionsOpen(false);
                setStaticDataOpen(false);
                setLoansOpen(false);
                setPayoutsOpen(false);
                setProductsOpen(false);
              }}>
                <span className="o-menu__icon"><FiSettings /></span>
                <span className="o-menu__label">Configurations</span>
                <span className={`o-menu__arrow ${configOpen ? "up" : "down"}`}>{configOpen ? <FiChevronUp /> : <FiChevronDown />}</span>
              </button>

              {configOpen && (
                <div className="o-submenu">
                  {canView(PERMISSIONS.BRANCH_MAINTENANCE) && (
                    <button 
                      className={`o-submenu__item ${isWindowOpen('branch-maintenance') ? "active" : ""}`} 
                      onClick={openBranchMaintenanceWindow}
                    >
                      Branch Maintenance
                    </button>
                  )}
                  {canView(PERMISSIONS.CHARGES_MANAGEMENT) && (
                    <button 
                      className={`o-submenu__item ${isWindowOpen('charges-form') ? "active" : ""}`} 
                      onClick={openChargesFormWindow}
                      style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
                    >
                      Charges Maintenance
                    </button>
                  )}
                  {canView(PERMISSIONS.TILL_MAINTENANCE) && (
                    <button 
                      className={`o-submenu__item ${isWindowOpen('till-maintenance') ? "active" : ""}`} 
                      onClick={openTillMaintenanceWindow}
                      style={{
                        cursor: 'pointer',
                        fontSize: 'inherit',
                        fontFamily: 'inherit',
                        fontWeight: 'inherit'
                      }}
                    >
                      Till Maintenance
                    </button>
                  )}
                  {canView(PERMISSIONS.ID_MAINTENANCE) && (
                    <Link 
                      className={`o-submenu__item ${location.pathname === "/id-maintenance" ? "active" : ""}`} 
                      to="/id-maintenance"
                      onClick={() => frontendLoggingService.logMenuClick("Configurations", "Identification Numbers Maintenance")}
                    >
                      Identification Numbers Maintenance
                    </Link>
                  )}
                </div>
              )}
            </>
          )}

          {/* Static Data Section - Only show if user has permission to view static data module */}
          {(canView(PERMISSIONS.GENDER_MAINTENANCE) ||
            canView(PERMISSIONS.CURRENCY_MAINTENANCE) ||
            canView(PERMISSIONS.NATIONALITY_MAINTENANCE) ||
            canView(PERMISSIONS.MARITAL_STATUS_MAINTENANCE) ||
            canView(PERMISSIONS.IDENTIFICATION_TYPES_MAINTENANCE) ||
            canView(PERMISSIONS.MEMBER_CATEGORIES_MAINTENANCE) ||
            canView(PERMISSIONS.INTEREST_FREQUENCY_MAINTENANCE) ||
            canView(PERMISSIONS.USER_MAINTENANCE)) && (
            <>
              <button className={`o-menu__item`} type="button" onClick={() => {
                frontendLoggingService.logMenuClick("Static Data", staticDataOpen ? "Close" : "Open");
                setStaticDataOpen(v => !v);
                setMembersOpen(false);
                setAccountsOpen(false);
                setAdminOpen(false);
                setConfigOpen(false);
                setTransactionsOpen(false);
                setLoansOpen(false);
                setPayoutsOpen(false);
                setProductsOpen(false);
              }}>
                <span className="o-menu__icon"><FiDatabase /></span>
                <span className="o-menu__label">Static Data</span>
                <span className={`o-menu__arrow ${staticDataOpen ? "up" : "down"}`}>{staticDataOpen ? <FiChevronUp /> : <FiChevronDown />}</span>
              </button>

              {staticDataOpen && (
                <div className="o-submenu">
                  {canView(PERMISSIONS.USER_MAINTENANCE) && (
                    <button 
                      className="o-submenu__item"
                      onClick={() => {
                        const existingWindow = getWindowByType('account-officer-maintenance');
                        if (existingWindow) {
                          if (existingWindow.isMinimized) {
                            restoreWindow(existingWindow.id);
                          } else {
                            bringToFront(existingWindow.id);
                          }
                        } else {
                          const windowId = openWindow({
                            type: 'account-officer-maintenance',
                            title: 'Account Officer Maintenance',
                            icon: '👤',
                            component: AccountOfficerForm,
                            props: { id: 'new', isWindowMode: true }
                          });
                          setTimeout(() => restoreWindow(windowId), 0);
                        }
                        frontendLoggingService.logMenuClick("Static Data", "Account Officer Maintenance");
                      }}
                    >
                      Account Officer Maintenance
                    </button>
                  )}
                  {canView(PERMISSIONS.CURRENCY_MAINTENANCE) && (
                    <Link 
                      className={`o-submenu__item ${location.pathname === "/currency-maintenance" ? "active" : ""}`} 
                      to="/currency-maintenance"
                      onClick={() => frontendLoggingService.logMenuClick("Static Data", "Currency Maintenance")}
                    >
                      Currency Maintenance
                    </Link>
                  )}
                  {canView(PERMISSIONS.GENDER_MAINTENANCE) && (
                    <Link 
                      className={`o-submenu__item ${location.pathname === "/gender-maintenance" ? "active" : ""}`} 
                      to="/gender-maintenance"
                      onClick={() => frontendLoggingService.logMenuClick("Static Data", "Gender Maintenance")}
                    >
                      Gender Maintenance
                    </Link>
                  )}
                  {canView(PERMISSIONS.NATIONALITY_MAINTENANCE) && (
                    <Link 
                      className={`o-submenu__item ${location.pathname === "/nationality-maintenance" ? "active" : ""}`} 
                      to="/nationality-maintenance"
                      onClick={() => frontendLoggingService.logMenuClick("Static Data", "Nationality Maintenance")}
                    >
                      Nationality Maintenance
                    </Link>
                  )}
                  {canView(PERMISSIONS.MARITAL_STATUS_MAINTENANCE) && (
                    <Link 
                      className={`o-submenu__item ${location.pathname === "/marital-status-maintenance" ? "active" : ""}`} 
                      to="/marital-status-maintenance"
                      onClick={() => frontendLoggingService.logMenuClick("Static Data", "Marital Status Maintenance")}
                    >
                      Marital Status Maintenance
                    </Link>
                  )}
                  {canView(PERMISSIONS.IDENTIFICATION_TYPES_MAINTENANCE) && (
                    <Link 
                      className={`o-submenu__item ${location.pathname === "/identification-types-maintenance" ? "active" : ""}`} 
                      to="/identification-types-maintenance"
                      onClick={() => frontendLoggingService.logMenuClick("Static Data", "Identification Types")}
                    >
                      Identification Types
                    </Link>
                  )}
                  {canView(PERMISSIONS.MEMBER_CATEGORIES_MAINTENANCE) && (
                    <Link 
                      className={`o-submenu__item ${location.pathname === "/member-categories-maintenance" ? "active" : ""}`} 
                      to="/member-categories-maintenance"
                      onClick={() => frontendLoggingService.logMenuClick("Static Data", "Member Categories")}
                    >
                      Member Categories
                    </Link>
                  )}
                  {canView(PERMISSIONS.NEXT_OF_KIN_RELATION_TYPES_MAINTENANCE) && (
                    <Link 
                      className={`o-submenu__item ${location.pathname === "/next-of-kin-relation-types-maintenance" ? "active" : ""}`} 
                      to="/next-of-kin-relation-types-maintenance"
                      onClick={() => frontendLoggingService.logMenuClick("Static Data", "Next of Kin Relation Types")}
                    >
                      Next of Kin Relation Types
                    </Link>
                  )}
                  {canView(PERMISSIONS.INTEREST_CALCULATION_RULES_MAINTENANCE) && (
                    <Link 
                      className={`o-submenu__item ${location.pathname === "/interest-calculation-rules-maintenance" ? "active" : ""}`} 
                      to="/interest-calculation-rules-maintenance"
                      onClick={() => frontendLoggingService.logMenuClick("Static Data", "Interest Calculation Rules")}
                    >
                      Interest Calculation Rules
                    </Link>
                  )}
                  {canView(PERMISSIONS.INTEREST_TYPES_MAINTENANCE) && (
                    <Link 
                      className={`o-submenu__item ${location.pathname === "/interest-types-maintenance" ? "active" : ""}`} 
                      to="/interest-types-maintenance"
                      onClick={() => frontendLoggingService.logMenuClick("Static Data", "Interest Types")}
                    >
                      Interest Types
                    </Link>
                  )}
                  {canView(PERMISSIONS.INTEREST_FREQUENCY_MAINTENANCE) && (
                    <Link 
                      className={`o-submenu__item ${location.pathname === "/interest-frequency-maintenance" ? "active" : ""}`} 
                      to="/interest-frequency-maintenance"
                      onClick={() => frontendLoggingService.logMenuClick("Static Data", "Interest Frequency")}
                    >
                      Interest Frequency
                    </Link>
                  )}
                </div>
              )}
            </>
          )}

          {/* Loans Section - Only show if user has permission to view loan products, collateral module, or loan calculator */}
          {(canView(PERMISSIONS.LOAN_PRODUCTS_MAINTENANCE) || canView(PERMISSIONS.COLLATERAL_MAINTENANCE) || canView(PERMISSIONS.LOAN_CALCULATOR)) && (
            <>
              <button className={`o-menu__item`} type="button" onClick={() => {
                frontendLoggingService.logMenuClick("Loans", loansOpen ? "Close" : "Open");
                setLoansOpen(v => !v);
                setMembersOpen(false);
                setAccountsOpen(false);
                setAdminOpen(false);
                setConfigOpen(false);
                setTransactionsOpen(false);
                setStaticDataOpen(false);
                setPayoutsOpen(false);
                setProductsOpen(false);
              }}>
                <span className="o-menu__icon"><FiFileText /></span>
                <span className="o-menu__label">Loans</span>
                <span className={`o-menu__arrow ${loansOpen ? "up" : "down"}`}>{loansOpen ? <FiChevronUp /> : <FiChevronDown />}</span>
              </button>

              {loansOpen && (
                <div className="o-submenu">
                  {canView(PERMISSIONS.LOAN_PRODUCTS_MAINTENANCE) && (
                    <Link 
                      className={`o-submenu__item ${location.pathname === "/loan-products-maintenance" ? "active" : ""}`} 
                      to="/loan-products-maintenance"
                      onClick={() => frontendLoggingService.logMenuClick("Loans", "Loan Products")}
                    >
                      Loan Products
                    </Link>
                  )}
                  {canView(PERMISSIONS.LOAN_PRODUCTS_MAINTENANCE) && (
                    <Link 
                      className={`o-submenu__item ${location.pathname === "/loan-application" ? "active" : ""}`} 
                      to="/loan-application"
                      onClick={() => frontendLoggingService.logMenuClick("Loans", "Loan Application")}
                    >
                      Loan Application
                    </Link>
                  )}
                  {canView(PERMISSIONS.LOAN_PRODUCTS_MAINTENANCE) && (
                    <Link 
                      className={`o-submenu__item ${location.pathname === "/loan-appraisal-maintenance" ? "active" : ""}`} 
                      to="/loan-appraisal-maintenance"
                      onClick={() => frontendLoggingService.logMenuClick("Loans", "Loan Appraisal")}
                    >
                      Loan Appraisal
                    </Link>
                  )}
                  {canView(PERMISSIONS.LOAN_PRODUCTS_MAINTENANCE) && (
                    <Link 
                      className={`o-submenu__item ${location.pathname === "/loan-disbursement-maintenance" ? "active" : ""}`} 
                      to="/loan-disbursement-maintenance"
                      onClick={() => frontendLoggingService.logMenuClick("Loans", "Loan Disbursement")}
                    >
                      Loan Disbursement
                    </Link>
                  )}
                  {canView(PERMISSIONS.COLLATERAL_MAINTENANCE) && (
                    <Link 
                      className={`o-submenu__item ${location.pathname === "/collateral" ? "active" : ""}`} 
                      to="/collateral"
                      onClick={() => frontendLoggingService.logMenuClick("Loans", "Collateral Maintenance")}
                    >
                      Collateral Maintenance
                    </Link>
                  )}
                  {canView(PERMISSIONS.LOAN_CALCULATOR) && (
                    <Link 
                      className={`o-submenu__item ${location.pathname === "/loan-calculator" ? "active" : ""}`} 
                      to="/loan-calculator"
                      onClick={() => frontendLoggingService.logMenuClick("Loans", "Loan Calculator")}
                    >
                      Loan Calculator
                    </Link>
                  )}
                </div>
              )}
            </>
          )}

          {/* Payouts Section - Only show if user has permission to view payouts module */}
          {canView(PERMISSIONS.TRANSACTION_MAINTENANCE) && (
            <>
              <button className={`o-menu__item`} type="button" onClick={() => {
                frontendLoggingService.logMenuClick("Payouts", payoutsOpen ? "Close" : "Open");
                setPayoutsOpen(v => !v);
                setMembersOpen(false);
                setAccountsOpen(false);
                setAdminOpen(false);
                setConfigOpen(false);
                setTransactionsOpen(false);
                setStaticDataOpen(false);
                setLoansOpen(false);
                setProductsOpen(false);
              }}>
                <span className="o-menu__icon"><FiTrendingUp /></span>
                <span className="o-menu__label">Payouts</span>
                <span className={`o-menu__arrow ${payoutsOpen ? "up" : "down"}`}>{payoutsOpen ? <FiChevronUp /> : <FiChevronDown />}</span>
              </button>

              {payoutsOpen && (
                <div className="o-submenu">
                  <Link 
                    className={`o-submenu__item ${location.pathname === "/payouts-management" ? "active" : ""}`} 
                    to="/payouts-management"
                    onClick={() => frontendLoggingService.logMenuClick("Payouts", "Payouts Management")}
                  >
                    Payouts Management
                  </Link>
                </div>
              )}
            </>
          )}
          </nav>
        </div>

        <button 
          className="o-handle" 
          onClick={() => setIsOpen(v => !v)} 
          aria-label="Toggle sidebar"
          disabled={!isAuthenticated}
          style={{
            opacity: !isAuthenticated ? 0.5 : 1,
            cursor: !isAuthenticated ? 'not-allowed' : 'pointer'
          }}
        >
          <span className="o-handle__arrow">{isOpen ? <FiChevronLeft /> : <FiChevronRight />}</span>
        </button>
      </aside>
    </>
  );
}

export default Sidebar;


