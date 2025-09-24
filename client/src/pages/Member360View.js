import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import axios from "axios";
import { FiUser, FiCreditCard, FiShield, FiDollarSign, FiFileText, FiChevronDown, FiChevronRight, FiSearch, FiRefreshCw } from "react-icons/fi";
import DashboardWrapper from '../components/DashboardWrapper';
import MemberLookupModal from '../components/MemberLookupModal';
import { useSnackbar } from "../helpers/SnackbarContext";
import { AuthContext } from "../helpers/AuthContext";
import frontendLoggingService from "../services/frontendLoggingService";

function Member360View() {
  const history = useHistory();
  const { showMessage } = useSnackbar();
  const { authState, isLoading } = useContext(AuthContext);

  const [selectedMember, setSelectedMember] = useState(null);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    personalInfo: true,
    accounts: false,
    collaterals: false,
    loanApplications: false,
    transactions: false
  });

  // Data states
  const [memberData, setMemberData] = useState({
    personalInfo: null,
    accounts: [],
    collaterals: [],
    loanApplications: [],
    transactions: []
  });

  useEffect(() => {
    if (!isLoading && !authState.status) {
      history.push("/login");
    } else if (!isLoading && authState.status) {
      frontendLoggingService.logView("Member360View", null, null, "Viewed Member 360 View page");
    }
  }, [authState, isLoading, history]);

  const handleMemberSelect = (member) => {
    setSelectedMember(member);
    setIsMemberModalOpen(false);
    fetchMemberData(member.id);
  };

  const fetchMemberData = async (memberId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const headers = { accessToken: token };

      // Fetch all member-related data in parallel
      const [
        personalInfoRes,
        accountsRes,
        collateralsRes,
        loanApplicationsRes,
        transactionsRes
      ] = await Promise.allSettled([
        axios.get(`http://localhost:3001/members/${memberId}`, { headers }),
        axios.get(`http://localhost:3001/accounts/member/${memberId}`, { headers }),
        axios.get(`http://localhost:3001/collateral/member/${memberId}`, { headers }),
        axios.get(`http://localhost:3001/loan-applications/member/${memberId}`, { headers }),
        axios.get(`http://localhost:3001/transactions/member/${memberId}`, { headers })
      ]);

      setMemberData({
        personalInfo: personalInfoRes.status === 'fulfilled' ? personalInfoRes.value.data.entity : null,
        accounts: accountsRes.status === 'fulfilled' ? accountsRes.value.data.entity : [],
        collaterals: collateralsRes.status === 'fulfilled' ? collateralsRes.value.data.entity : [],
        loanApplications: loanApplicationsRes.status === 'fulfilled' ? loanApplicationsRes.value.data.entity : [],
        transactions: transactionsRes.status === 'fulfilled' ? transactionsRes.value.data.entity : []
      });

      // Log any failed requests
      [personalInfoRes, accountsRes, collateralsRes, loanApplicationsRes, transactionsRes].forEach((result, index) => {
        if (result.status === 'rejected') {
          console.warn(`Failed to fetch data for section ${index}:`, result.reason);
        }
      });

    } catch (error) {
      console.error("Error fetching member data:", error);
      showMessage("Failed to fetch member data", "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-KE');
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'Active': 'success',
      'Pending': 'warning',
      'Approved': 'success',
      'Rejected': 'error',
      'Suspended': 'warning',
      'Closed': 'error',
      'Inactive': 'warning'
    };
    
    const color = statusColors[status] || 'default';
    return <span className={`badge badge--${color}`}>{status}</span>;
  };

  const renderPersonalInfo = () => {
    if (!memberData.personalInfo) return null;

    const member = memberData.personalInfo;
    return (
      <div className="member-info-grid">
        <div className="info-section">
          <h4>Basic Information</h4>
          <div className="info-row">
            <span className="label">Member Number:</span>
            <span className="value">{member.memberNo}</span>
          </div>
          <div className="info-row">
            <span className="label">Name:</span>
            <span className="value">{member.firstName} {member.lastName}</span>
          </div>
          <div className="info-row">
            <span className="label">Gender:</span>
            <span className="value">{member.gender}</span>
          </div>
          <div className="info-row">
            <span className="label">Date of Birth:</span>
            <span className="value">{formatDate(member.dateOfBirth)}</span>
          </div>
          <div className="info-row">
            <span className="label">Status:</span>
            <span className="value">{getStatusBadge(member.status)}</span>
          </div>
        </div>

        <div className="info-section">
          <h4>Contact Information</h4>
          <div className="info-row">
            <span className="label">Email:</span>
            <span className="value">{member.email || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="label">Phone:</span>
            <span className="value">{member.personalPhone || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="label">Alternative Phone:</span>
            <span className="value">{member.alternativePhone || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="label">County:</span>
            <span className="value">{member.county || 'N/A'}</span>
          </div>
        </div>

        <div className="info-section">
          <h4>Identification</h4>
          <div className="info-row">
            <span className="label">ID Type:</span>
            <span className="value">{member.identificationType || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="label">ID Number:</span>
            <span className="value">{member.identificationNumber || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="label">KRA PIN:</span>
            <span className="value">{member.kraPin || 'N/A'}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderAccounts = () => {
    if (!memberData.accounts.length) {
      return <div className="no-data">No accounts found for this member.</div>;
    }

    return (
      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>Account ID</th>
              <th>Account Name</th>
              <th>Product</th>
              <th>Account Type</th>
              <th>Balance</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {memberData.accounts.map((account) => (
              <tr key={account.id}>
                <td>{account.accountId}</td>
                <td>{account.accountName}</td>
                <td>{account.product?.productName || 'N/A'}</td>
                <td>{account.accountTypeDefinition?.accountTypeName || 'N/A'}</td>
                <td>{formatCurrency(account.balance)}</td>
                <td>{getStatusBadge(account.status)}</td>
                <td>{formatDate(account.createdOn)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderCollaterals = () => {
    if (!memberData.collaterals.length) {
      return <div className="no-data">No collaterals found for this member.</div>;
    }

    return (
      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>Collateral ID</th>
              <th>Description</th>
              <th>Type</th>
              <th>Value</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {memberData.collaterals.map((collateral) => (
              <tr key={collateral.id}>
                <td>{collateral.collateralId}</td>
                <td>{collateral.description}</td>
                <td>{collateral.collateralType}</td>
                <td>{formatCurrency(collateral.value)}</td>
                <td>{getStatusBadge(collateral.status)}</td>
                <td>{formatDate(collateral.createdOn)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderLoanApplications = () => {
    if (!memberData.loanApplications.length) {
      return <div className="no-data">No loan applications found for this member.</div>;
    }

    return (
      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>Application ID</th>
              <th>Loan Name</th>
              <th>Product</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {memberData.loanApplications.map((application) => (
              <tr key={application.id}>
                <td>{application.loanApplicationId}</td>
                <td>{application.loanName}</td>
                <td>{application.product?.loanProductName || 'N/A'}</td>
                <td>{formatCurrency(application.loanAmount)}</td>
                <td>{getStatusBadge(application.status)}</td>
                <td>{formatDate(application.createdOn)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderTransactions = () => {
    if (!memberData.transactions.length) {
      return <div className="no-data">No transactions found for this member.</div>;
    }

    return (
      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Reference</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Account</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {memberData.transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td>{transaction.transactionId}</td>
                <td>{transaction.referenceNumber}</td>
                <td>{transaction.type}</td>
                <td>{formatCurrency(transaction.amount)}</td>
                <td>{transaction.memberAccount?.accountName || 'N/A'}</td>
                <td>{getStatusBadge(transaction.status)}</td>
                <td>{formatDate(transaction.createdOn)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <DashboardWrapper>
      <header className="header">
        <div className="header__left">
          <div className="greeting">Member 360 View</div>
        </div>
        <div className="header__right">
          {selectedMember && (
            <button 
              className="btn btn--secondary"
              onClick={() => fetchMemberData(selectedMember.id)}
              disabled={loading}
            >
              <FiRefreshCw className={loading ? "spinning" : ""} />
              Refresh Data
            </button>
          )}
        </div>
      </header>

      <main className="dashboard__content">
        {/* Member Selection */}
        <section className="card">
          <div className="card__header">
            <h3>Select Member</h3>
          </div>
          <div className="card__content">
            <div className="member-selection">
              {selectedMember ? (
                <div className="selected-member">
                  <div className="member-info">
                    <FiUser className="member-icon" />
                    <div>
                      <h4>{selectedMember.firstName} {selectedMember.lastName}</h4>
                      <p>Member No: {selectedMember.memberNo}</p>
                    </div>
                  </div>
                  <button 
                    className="btn btn--secondary"
                    onClick={() => setIsMemberModalOpen(true)}
                  >
                    <FiSearch />
                    Change Member
                  </button>
                </div>
              ) : (
                <button 
                  className="btn btn--primary btn--large"
                  onClick={() => setIsMemberModalOpen(true)}
                >
                  <FiSearch />
                  Select Member
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Member Data Sections */}
        {selectedMember && (
          <div className="member-360-sections">
            {/* Personal Information */}
            <section className="card accordion-section">
              <div 
                className="card__header accordion-header"
                onClick={() => toggleSection('personalInfo')}
              >
                <div className="accordion-title">
                  <FiUser />
                  <h3>Personal Information</h3>
                </div>
                {expandedSections.personalInfo ? <FiChevronDown /> : <FiChevronRight />}
              </div>
              {expandedSections.personalInfo && (
                <div className="card__content">
                  {loading ? (
                    <div className="loading">Loading personal information...</div>
                  ) : (
                    renderPersonalInfo()
                  )}
                </div>
              )}
            </section>

            {/* Accounts */}
            <section className="card accordion-section">
              <div 
                className="card__header accordion-header"
                onClick={() => toggleSection('accounts')}
              >
                <div className="accordion-title">
                  <FiCreditCard />
                  <h3>Accounts ({memberData.accounts.length})</h3>
                </div>
                {expandedSections.accounts ? <FiChevronDown /> : <FiChevronRight />}
              </div>
              {expandedSections.accounts && (
                <div className="card__content">
                  {loading ? (
                    <div className="loading">Loading accounts...</div>
                  ) : (
                    renderAccounts()
                  )}
                </div>
              )}
            </section>

            {/* Collaterals */}
            <section className="card accordion-section">
              <div 
                className="card__header accordion-header"
                onClick={() => toggleSection('collaterals')}
              >
                <div className="accordion-title">
                  <FiShield />
                  <h3>Collaterals ({memberData.collaterals.length})</h3>
                </div>
                {expandedSections.collaterals ? <FiChevronDown /> : <FiChevronRight />}
              </div>
              {expandedSections.collaterals && (
                <div className="card__content">
                  {loading ? (
                    <div className="loading">Loading collaterals...</div>
                  ) : (
                    renderCollaterals()
                  )}
                </div>
              )}
            </section>

            {/* Loan Applications */}
            <section className="card accordion-section">
              <div 
                className="card__header accordion-header"
                onClick={() => toggleSection('loanApplications')}
              >
                <div className="accordion-title">
                  <FiFileText />
                  <h3>Loan Applications ({memberData.loanApplications.length})</h3>
                </div>
                {expandedSections.loanApplications ? <FiChevronDown /> : <FiChevronRight />}
              </div>
              {expandedSections.loanApplications && (
                <div className="card__content">
                  {loading ? (
                    <div className="loading">Loading loan applications...</div>
                  ) : (
                    renderLoanApplications()
                  )}
                </div>
              )}
            </section>

            {/* Transactions */}
            <section className="card accordion-section">
              <div 
                className="card__header accordion-header"
                onClick={() => toggleSection('transactions')}
              >
                <div className="accordion-title">
                  <FiDollarSign />
                  <h3>Transactions ({memberData.transactions.length})</h3>
                </div>
                {expandedSections.transactions ? <FiChevronDown /> : <FiChevronRight />}
              </div>
              {expandedSections.transactions && (
                <div className="card__content">
                  {loading ? (
                    <div className="loading">Loading transactions...</div>
                  ) : (
                    renderTransactions()
                  )}
                </div>
              )}
            </section>
          </div>
        )}

        {/* Member Lookup Modal */}
        {isMemberModalOpen && (
          <MemberLookupModal
            isOpen={isMemberModalOpen}
            onClose={() => setIsMemberModalOpen(false)}
            onSelectMember={handleMemberSelect}
          />
        )}
      </main>

      <style jsx>{`
        .member-selection {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100px;
        }

        .selected-member {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 16px;
          background: var(--surface-1);
          border-radius: 8px;
          border: 1px solid var(--border-color);
        }

        .member-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .member-icon {
          font-size: 24px;
          color: var(--primary-600);
        }

        .member-360-sections {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .accordion-section {
          border: 1px solid var(--border-color);
        }

        .accordion-header {
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: var(--surface-1);
          border-bottom: 1px solid var(--border-color);
          transition: background-color 0.2s ease;
        }

        .accordion-header:hover {
          background: var(--surface-2);
        }

        .accordion-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .accordion-title h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }

        .member-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
        }

        .info-section h4 {
          margin: 0 0 16px 0;
          color: var(--primary-600);
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid var(--border-color);
        }

        .info-row:last-child {
          border-bottom: none;
        }

        .label {
          font-weight: 500;
          color: var(--text-secondary);
        }

        .value {
          font-weight: 600;
          color: var(--text-primary);
        }

        .data-table {
          overflow-x: auto;
        }

        .data-table table {
          width: 100%;
          border-collapse: collapse;
        }

        .data-table th,
        .data-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid var(--border-color);
        }

        .data-table th {
          background: var(--surface-1);
          font-weight: 600;
          color: var(--text-secondary);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .data-table tr:hover {
          background: var(--surface-1);
        }

        .no-data {
          text-align: center;
          padding: 40px;
          color: var(--text-secondary);
          font-style: italic;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: var(--text-secondary);
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .badge--success {
          background: var(--success-100);
          color: var(--success-700);
        }

        .badge--warning {
          background: var(--warning-100);
          color: var(--warning-700);
        }

        .badge--error {
          background: var(--error-100);
          color: var(--error-700);
        }

        .badge--default {
          background: var(--surface-2);
          color: var(--text-secondary);
        }
      `}</style>
    </DashboardWrapper>
  );
}

export default Member360View;
