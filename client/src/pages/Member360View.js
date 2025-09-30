import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import axios from "axios";
import { FiUser, FiCreditCard, FiShield, FiDollarSign, FiFileText, FiChevronDown, FiChevronRight, FiSearch, FiRefreshCw, FiBell } from "react-icons/fi";
import DashboardWrapper from '../components/DashboardWrapper';
import MemberLookupModal from '../components/MemberLookupModal';
import { useSnackbar } from "../helpers/SnackbarContext";
import { AuthContext } from "../helpers/AuthContext";
import frontendLoggingService from "../services/frontendLoggingService";

function Member360View({ isWindowMode = false }) {
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
    guarantors: false,
    transactions: false,
    notifications: false
  });

  // Data states
  const [memberData, setMemberData] = useState({
    personalInfo: null,
    accounts: [],
    collaterals: [],
    loanApplications: [],
    guarantors: [],
    transactions: [],
    notifications: []
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
        guarantorsRes,
        transactionsRes,
        notificationsRes
      ] = await Promise.allSettled([
        axios.get(`http://localhost:3001/members/${memberId}`, { headers }),
        axios.get(`http://localhost:3001/accounts/member/${memberId}`, { headers }),
        axios.get(`http://localhost:3001/collateral/member/${memberId}`, { headers }),
        axios.get(`http://localhost:3001/loan-applications/member/${memberId}`, { headers }),
        axios.get(`http://localhost:3001/loan-applications/guarantors/member/${memberId}`, { headers }),
        axios.get(`http://localhost:3001/transactions/member/${memberId}`, { headers }),
        axios.get(`http://localhost:3001/notifications/member/${memberId}`, { headers })
      ]);

      setMemberData({
        personalInfo: personalInfoRes.status === 'fulfilled' ? personalInfoRes.value.data.entity : null,
        accounts: accountsRes.status === 'fulfilled' ? accountsRes.value.data.entity : [],
        collaterals: collateralsRes.status === 'fulfilled' ? collateralsRes.value.data.entity : [],
        loanApplications: loanApplicationsRes.status === 'fulfilled' ? loanApplicationsRes.value.data.entity : [],
        guarantors: guarantorsRes.status === 'fulfilled' ? guarantorsRes.value.data.entity : [],
        transactions: transactionsRes.status === 'fulfilled' ? transactionsRes.value.data.entity : [],
        notifications: notificationsRes.status === 'fulfilled' ? notificationsRes.value.data.entity : []
      });

      // Log any failed requests
      [personalInfoRes, accountsRes, collateralsRes, loanApplicationsRes, guarantorsRes, transactionsRes, notificationsRes].forEach((result, index) => {
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

  const calculateAccountsTotal = () => {
    if (!memberData.accounts.length) return 0;
    return memberData.accounts.reduce((total, account) => total + (parseFloat(account.balance) || 0), 0);
  };

  const calculateGuarantorsTotal = () => {
    if (!memberData.guarantors.length) return 0;
    return memberData.guarantors.reduce((total, guarantor) => total + (parseFloat(guarantor.guaranteedAmount) || 0), 0);
  };

  const calculateCollateralsTotal = () => {
    if (!memberData.collaterals.length) return 0;
    return memberData.collaterals.reduce((total, collateral) => total + (parseFloat(collateral.value) || 0), 0);
  };

  const calculateLoanApplicationsTotal = () => {
    if (!memberData.loanApplications.length) return 0;
    return memberData.loanApplications.reduce((total, application) => total + (parseFloat(application.loanAmount) || 0), 0);
  };

  const calculateTransactionsTotal = () => {
    if (!memberData.transactions.length) return 0;
    return memberData.transactions.reduce((total, transaction) => total + (parseFloat(transaction.amount) || 0), 0);
  };

  const renderPersonalInfo = () => {
    if (!memberData.personalInfo) {
      return (
        <div className="no-data">
          <FiUser className="placeholder-icon" />
          <p>Select a member to view personal information</p>
        </div>
      );
    }

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
            <span className="value">
              {member.category === 'Joint' && member.jointMembershipName 
                ? member.jointMembershipName 
                : `${member.firstName} ${member.lastName}`}
            </span>
          </div>
          <div className="info-row">
            <span className="label">Category:</span>
            <span className="value">{member.category}</span>
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
            <span className="label">Marital Status:</span>
            <span className="value">{member.maritalStatus || 'N/A'}</span>
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
            <span className="label">Country:</span>
            <span className="value">{member.country || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="label">County:</span>
            <span className="value">{member.county || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="label">Sub County:</span>
            <span className="value">{member.subCounty || 'N/A'}</span>
          </div>
        </div>

        <div className="info-section">
          <h4>Identification</h4>
          <div className="info-row">
            <span className="label">Nationality:</span>
            <span className="value">{member.nationality || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="label">ID Type:</span>
            <span className="value">{member.identificationType || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="label">ID Number:</span>
            <span className="value">{member.identificationNumber || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="label">ID Expiry:</span>
            <span className="value">{member.identificationExpiryDate ? formatDate(member.identificationExpiryDate) : 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="label">KRA PIN:</span>
            <span className="value">{member.kraPin || 'N/A'}</span>
          </div>
        </div>

        {/* Next of Kin Section */}
        {member.nextOfKin && member.nextOfKin.length > 0 && (
          <div className="info-section">
            <h4>Next of Kin</h4>
            {member.nextOfKin.map((kin, index) => (
              <div key={index} className="kin-item">
                <div className="info-row">
                  <span className="label">Name:</span>
                  <span className="value">{kin.title} {kin.firstName} {kin.lastName}</span>
                </div>
                <div className="info-row">
                  <span className="label">Relationship:</span>
                  <span className="value">{kin.relationType}</span>
                </div>
                <div className="info-row">
                  <span className="label">Phone:</span>
                  <span className="value">{kin.phoneNumber}</span>
                </div>
                <div className="info-row">
                  <span className="label">Gender:</span>
                  <span className="value">{kin.gender}</span>
                </div>
                {index < member.nextOfKin.length - 1 && <hr className="kin-separator" />}
              </div>
            ))}
          </div>
        )}

        {/* Corporate Information Section */}
        {member.category === 'Corporate' && (
          <div className="info-section">
            <h4>Corporate Information</h4>
            <div className="info-row">
              <span className="label">Company Name:</span>
              <span className="value">{member.companyName || 'N/A'}</span>
            </div>
            <div className="info-row">
              <span className="label">Registration Number:</span>
              <span className="value">{member.registrationNumber || 'N/A'}</span>
            </div>
            <div className="info-row">
              <span className="label">Company KRA PIN:</span>
              <span className="value">{member.companyKraPin || 'N/A'}</span>
            </div>
            <div className="info-row">
              <span className="label">Business Type:</span>
              <span className="value">{member.businessType || 'N/A'}</span>
            </div>
            <div className="info-row">
              <span className="label">Business Address:</span>
              <span className="value">{member.businessAddress || 'N/A'}</span>
            </div>
          </div>
        )}

        {/* Chama Information Section */}
        {member.category === 'Chama' && (
          <div className="info-section">
            <h4>Chama Information</h4>
            <div className="info-row">
              <span className="label">Chama Name:</span>
              <span className="value">{member.chamaName || 'N/A'}</span>
            </div>
            <div className="info-row">
              <span className="label">Registration Number:</span>
              <span className="value">{member.chamaRegistrationNumber || 'N/A'}</span>
            </div>
            <div className="info-row">
              <span className="label">Constitution:</span>
              <span className="value">{member.chamaConstitution ? 'Available' : 'N/A'}</span>
            </div>
          </div>
        )}

        {/* Guardian Information Section */}
        {member.category === 'Minor' && member.guardianName && (
          <div className="info-section">
            <h4>Guardian Information</h4>
            <div className="info-row">
              <span className="label">Guardian Name:</span>
              <span className="value">{member.guardianName}</span>
            </div>
            <div className="info-row">
              <span className="label">ID Number:</span>
              <span className="value">{member.guardianIdNumber}</span>
            </div>
            <div className="info-row">
              <span className="label">KRA PIN:</span>
              <span className="value">{member.guardianKraPin}</span>
            </div>
            <div className="info-row">
              <span className="label">Phone:</span>
              <span className="value">{member.guardianPhone}</span>
            </div>
            <div className="info-row">
              <span className="label">Email:</span>
              <span className="value">{member.guardianEmail}</span>
            </div>
            <div className="info-row">
              <span className="label">Address:</span>
              <span className="value">{member.guardianAddress}</span>
            </div>
            <div className="info-row">
              <span className="label">Relationship:</span>
              <span className="value">{member.guardianRelationship}</span>
            </div>
          </div>
        )}

        {/* Chama Members Section */}
        {member.chamaMembers && member.chamaMembers.length > 0 && (
          <div className="info-section">
            <h4>Chama Members</h4>
            {member.chamaMembers.map((chamaMember, index) => (
              <div key={index} className="chama-member-item">
                <div className="info-row">
                  <span className="label">Name:</span>
                  <span className="value">{chamaMember.title} {chamaMember.firstName} {chamaMember.lastName}</span>
                </div>
                <div className="info-row">
                  <span className="label">ID Type:</span>
                  <span className="value">{chamaMember.identificationType}</span>
                </div>
                <div className="info-row">
                  <span className="label">ID Number:</span>
                  <span className="value">{chamaMember.identificationNumber}</span>
                </div>
                <div className="info-row">
                  <span className="label">KRA PIN:</span>
                  <span className="value">{chamaMember.kraPin}</span>
                </div>
                <div className="info-row">
                  <span className="label">Phone:</span>
                  <span className="value">{chamaMember.phoneNumber}</span>
                </div>
                <div className="info-row">
                  <span className="label">Email:</span>
                  <span className="value">{chamaMember.email}</span>
                </div>
                <div className="info-row">
                  <span className="label">Address:</span>
                  <span className="value">{chamaMember.address}</span>
                </div>
                {index < member.chamaMembers.length - 1 && <hr className="chama-member-separator" />}
              </div>
            ))}
          </div>
        )}

        {/* Authorized Signatories Section */}
        {member.authorizedSignatories && member.authorizedSignatories.length > 0 && (
          <div className="info-section">
            <h4>Authorized Signatories</h4>
            {member.authorizedSignatories.map((signatory, index) => (
              <div key={index} className="signatory-item">
                <div className="info-row">
                  <span className="label">Name:</span>
                  <span className="value">{signatory.title} {signatory.firstName} {signatory.lastName}</span>
                </div>
                <div className="info-row">
                  <span className="label">Position:</span>
                  <span className="value">{signatory.position}</span>
                </div>
                <div className="info-row">
                  <span className="label">ID Type:</span>
                  <span className="value">{signatory.identificationType}</span>
                </div>
                <div className="info-row">
                  <span className="label">ID Number:</span>
                  <span className="value">{signatory.identificationNumber}</span>
                </div>
                <div className="info-row">
                  <span className="label">KRA PIN:</span>
                  <span className="value">{signatory.kraPin}</span>
                </div>
                <div className="info-row">
                  <span className="label">Phone:</span>
                  <span className="value">{signatory.phoneNumber}</span>
                </div>
                <div className="info-row">
                  <span className="label">Email:</span>
                  <span className="value">{signatory.email}</span>
                </div>
                {index < member.authorizedSignatories.length - 1 && <hr className="signatory-separator" />}
              </div>
            ))}
          </div>
        )}

        {/* Joint Members Section */}
        {member.jointMembers && member.jointMembers.length > 0 && (
          <div className="info-section">
            <h4>Joint Members</h4>
            {member.jointMembers.map((jointMember, index) => (
              <div key={index} className="joint-member-item">
                <div className="info-row">
                  <span className="label">Name:</span>
                  <span className="value">{jointMember.title} {jointMember.firstName} {jointMember.lastName}</span>
                </div>
                <div className="info-row">
                  <span className="label">ID Type:</span>
                  <span className="value">{jointMember.identificationType}</span>
                </div>
                <div className="info-row">
                  <span className="label">ID Number:</span>
                  <span className="value">{jointMember.identificationNumber}</span>
                </div>
                <div className="info-row">
                  <span className="label">KRA PIN:</span>
                  <span className="value">{jointMember.kraPin}</span>
                </div>
                <div className="info-row">
                  <span className="label">Phone:</span>
                  <span className="value">{jointMember.phoneNumber}</span>
                </div>
                <div className="info-row">
                  <span className="label">Email:</span>
                  <span className="value">{jointMember.email}</span>
                </div>
                <div className="info-row">
                  <span className="label">Address:</span>
                  <span className="value">{jointMember.address}</span>
                </div>
                {index < member.jointMembers.length - 1 && <hr className="joint-member-separator" />}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderAccounts = () => {
    if (!selectedMember) {
      return (
        <div className="no-data">
          <FiCreditCard className="placeholder-icon" />
          <p>Select a member to view their accounts</p>
        </div>
      );
    }
    
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
    if (!selectedMember) {
      return (
        <div className="no-data">
          <FiShield className="placeholder-icon" />
          <p>Select a member to view their collaterals</p>
        </div>
      );
    }
    
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
    if (!selectedMember) {
      return (
        <div className="no-data">
          <FiFileText className="placeholder-icon" />
          <p>Select a member to view their loan applications</p>
        </div>
      );
    }
    
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

  const renderGuarantors = () => {
    if (!selectedMember) {
      return (
        <div className="no-data">
          <FiShield className="placeholder-icon" />
          <p>Select a member to view their guarantor obligations</p>
        </div>
      );
    }
    
    if (!memberData.guarantors.length) {
      return <div className="no-data">No guarantor obligations found for this member.</div>;
    }

    return (
      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>Loan Application</th>
              <th>Borrower</th>
              <th>Product</th>
              <th>Loan Amount</th>
              <th>Guarantee %</th>
              <th>Guaranteed Amount</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {memberData.guarantors.map((guarantor, index) => (
              <tr key={index}>
                <td>{guarantor.loanApplicationId}</td>
                <td>
                  <div>
                    <div style={{ fontWeight: "500" }}>{guarantor.borrower}</div>
                    <div style={{ fontSize: "12px", color: "var(--muted-text)" }}>
                      {guarantor.borrowerMemberNo}
                    </div>
                  </div>
                </td>
                <td>{guarantor.product}</td>
                <td>{formatCurrency(guarantor.loanAmount)}</td>
                <td>{guarantor.percentage}%</td>
                <td>{formatCurrency(guarantor.guaranteedAmount)}</td>
                <td>{getStatusBadge(guarantor.status)}</td>
                <td>{formatDate(guarantor.createdOn)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderTransactions = () => {
    if (!selectedMember) {
      return (
        <div className="no-data">
          <FiDollarSign className="placeholder-icon" />
          <p>Select a member to view their transactions</p>
        </div>
      );
    }
    
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

  const renderNotifications = () => {
    if (!selectedMember) {
      return (
        <div className="no-data">
          <FiBell className="placeholder-icon" />
          <p>Select a member to view their notifications</p>
        </div>
      );
    }
    
    if (!memberData.notifications.length) {
      return <div className="no-data">No notifications found for this member.</div>;
    }

    return (
      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>Notification ID</th>
              <th>Title</th>
              <th>Message</th>
              <th>Type</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {memberData.notifications.map((notification) => (
              <tr key={notification.id}>
                <td>{notification.notificationId || notification.id}</td>
                <td>{notification.title}</td>
                <td>{notification.message}</td>
                <td>{notification.type || 'General'}</td>
                <td>{getStatusBadge(notification.status || 'Unread')}</td>
                <td>{formatDate(notification.createdOn || notification.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const viewContent = (
    <>
      <header className="header">
        <div className="header__left">
          <div className="greeting">Member 360 View</div>
        </div>
        <div className="header__right">
          <button 
            className="btn btn--primary"
            onClick={() => setIsMemberModalOpen(true)}
          >
            <FiSearch />
            {selectedMember ? 'Change Member' : 'Select Member'}
          </button>
          {/* {selectedMember && (
            <button 
              className="btn btn--secondary"
              onClick={() => fetchMemberData(selectedMember.id)}
              disabled={loading}
            >
              <FiRefreshCw className={loading ? "spinning" : ""} />
              Refresh Data
            </button>
          )} */}
        </div>
      </header>

      <main className="dashboard__content">
        {/* Selected Member Info */}
        {selectedMember && (
          <section className="card">
            <div className="card__header">
              <h3>Selected Member</h3>
            </div>
            <div className="card__content">
              <div className="selected-member">
                <div className="member-info">
                  <FiUser className="member-icon" />
                  <div>
                    <h4>
                      {selectedMember.category === 'Joint' && selectedMember.jointMembershipName 
                        ? selectedMember.jointMembershipName 
                        : `${selectedMember.firstName} ${selectedMember.lastName}`}
                    </h4>
                    <p>Member No: {selectedMember.memberNo}</p>
                  </div>
                </div>
                <div className="member-media">
                  {/* Display latest photo from photos array or fallback to legacy photo */}
                  {(memberData.personalInfo?.photos && memberData.personalInfo.photos.length > 0) ? (
                    <div className="member-photo">
                      <img 
                        src={memberData.personalInfo.photos[0].isBase64 ? memberData.personalInfo.photos[0].data : memberData.personalInfo.photos[0].name} 
                        alt={selectedMember.category === 'Joint' && selectedMember.jointMembershipName 
                          ? selectedMember.jointMembershipName 
                          : `${selectedMember.firstName} ${selectedMember.lastName}`}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                      <div className="photo-placeholder" style={{ display: 'none' }}>
                        <FiUser />
                        <span>No Photo</span>
                      </div>
                    </div>
                  ) : memberData.personalInfo?.photo ? (
                    <div className="member-photo">
                      <img 
                        src={memberData.personalInfo.photo} 
                        alt={selectedMember.category === 'Joint' && selectedMember.jointMembershipName 
                          ? selectedMember.jointMembershipName 
                          : `${selectedMember.firstName} ${selectedMember.lastName}`}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                      <div className="photo-placeholder" style={{ display: 'none' }}>
                        <FiUser />
                        <span>No Photo</span>
                      </div>
                    </div>
                  ) : null}
                  
                  {/* Display latest signature from signatures array or fallback to legacy signature */}
                  {(memberData.personalInfo?.signatures && memberData.personalInfo.signatures.length > 0) ? (
                    <div className="member-signature">
                      <img 
                        src={memberData.personalInfo.signatures[0].isBase64 ? memberData.personalInfo.signatures[0].data : memberData.personalInfo.signatures[0].name} 
                        alt={`${selectedMember.category === 'Joint' && selectedMember.jointMembershipName 
                          ? selectedMember.jointMembershipName 
                          : `${selectedMember.firstName} ${selectedMember.lastName}`} Signature`}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                      <div className="signature-placeholder" style={{ display: 'none' }}>
                        <span>No Signature</span>
                      </div>
                    </div>
                  ) : memberData.personalInfo?.signature ? (
                    <div className="member-signature">
                      <img 
                        src={memberData.personalInfo.signature} 
                        alt={`${selectedMember.category === 'Joint' && selectedMember.jointMembershipName 
                          ? selectedMember.jointMembershipName 
                          : `${selectedMember.firstName} ${selectedMember.lastName}`} Signature`}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                      <div className="signature-placeholder" style={{ display: 'none' }}>
                        <span>No Signature</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Member Data Sections */}
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
                  {loading && selectedMember ? (
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
                  <h3>Accounts ({selectedMember ? memberData.accounts.length : 0})</h3>
                  <span className="total-amount">Amount: {formatCurrency(selectedMember ? calculateAccountsTotal() : 0)}</span>
                </div>
                {expandedSections.accounts ? <FiChevronDown /> : <FiChevronRight />}
              </div>
              {expandedSections.accounts && (
                <div className="card__content">
                  {loading && selectedMember ? (
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
                  <h3>Collaterals ({selectedMember ? memberData.collaterals.length : 0})</h3>
                  <span className="total-amount">Amount: {formatCurrency(selectedMember ? calculateCollateralsTotal() : 0)}</span>
                </div>
                {expandedSections.collaterals ? <FiChevronDown /> : <FiChevronRight />}
              </div>
              {expandedSections.collaterals && (
                <div className="card__content">
                  {loading && selectedMember ? (
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
                  <h3>Loan Applications ({selectedMember ? memberData.loanApplications.length : 0})</h3>
                  <span className="total-amount">Amount: {formatCurrency(selectedMember ? calculateLoanApplicationsTotal() : 0)}</span>
                </div>
                {expandedSections.loanApplications ? <FiChevronDown /> : <FiChevronRight />}
              </div>
              {expandedSections.loanApplications && (
                <div className="card__content">
                  {loading && selectedMember ? (
                    <div className="loading">Loading loan applications...</div>
                  ) : (
                    renderLoanApplications()
                  )}
                </div>
              )}
            </section>

            {/* Guarantors */}
            <section className="card accordion-section">
              <div 
                className="card__header accordion-header"
                onClick={() => toggleSection('guarantors')}
              >
                <div className="accordion-title">
                  <FiShield />
                  <h3>Guarantor Obligations ({selectedMember ? memberData.guarantors.length : 0})</h3>
                  <span className="total-amount">Amount: {formatCurrency(selectedMember ? calculateGuarantorsTotal() : 0)}</span>
                </div>
                {expandedSections.guarantors ? <FiChevronDown /> : <FiChevronRight />}
              </div>
              {expandedSections.guarantors && (
                <div className="card__content">
                  {loading && selectedMember ? (
                    <div className="loading">Loading guarantor obligations...</div>
                  ) : (
                    renderGuarantors()
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
                  <h3>Transactions ({selectedMember ? memberData.transactions.length : 0})</h3>
                  <span className="total-amount">Amount: {formatCurrency(selectedMember ? calculateTransactionsTotal() : 0)}</span>
                </div>
                {expandedSections.transactions ? <FiChevronDown /> : <FiChevronRight />}
              </div>
              {expandedSections.transactions && (
                <div className="card__content">
                  {loading && selectedMember ? (
                    <div className="loading">Loading transactions...</div>
                  ) : (
                    renderTransactions()
                  )}
                </div>
              )}
            </section>

            {/* Notifications */}
            <section className="card accordion-section">
              <div 
                className="card__header accordion-header"
                onClick={() => toggleSection('notifications')}
              >
                <div className="accordion-title">
                  <FiBell />
                  <h3>Notifications ({selectedMember ? memberData.notifications.length : 0})</h3>
                </div>
                {expandedSections.notifications ? <FiChevronDown /> : <FiChevronRight />}
              </div>
              {expandedSections.notifications && (
                <div className="card__content">
                  {loading && selectedMember ? (
                    <div className="loading">Loading notifications...</div>
                  ) : (
                    renderNotifications()
                  )}
                </div>
              )}
            </section>
          </div>

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

        .member-media {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .member-photo {
          position: relative;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          overflow: hidden;
          border: 2px solid var(--border-color);
          background: var(--surface-2);
        }

        .member-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .photo-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          color: var(--text-tertiary);
          font-size: 12px;
        }

        .photo-placeholder svg {
          font-size: 20px;
          margin-bottom: 4px;
        }

        .member-signature {
          position: relative;
          width: 120px;
          height: 40px;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          background: var(--surface-2);
          overflow: hidden;
        }

        .member-signature img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .signature-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          color: var(--text-tertiary);
          font-size: 11px;
          font-style: italic;
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
          font-size: 18px;
          font-weight: 700;
          color: var(--primary-700);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .total-amount {
          font-size: 14px;
          font-weight: 600;
          color: var(--primary-600);
          background: var(--primary-50);
          padding: 4px 8px;
          border-radius: 4px;
          margin-left: auto;
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
          font-weight: bold;
          color: #0066cc;
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
          font-weight: bold;
          color: #0066cc;
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

        .placeholder-icon {
          font-size: 48px;
          color: var(--text-tertiary);
          margin-bottom: 16px;
          display: block;
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

        .kin-item,
        .chama-member-item,
        .signatory-item,
        .joint-member-item {
          background: var(--surface-1);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 12px;
        }

        .kin-item:last-child,
        .chama-member-item:last-child,
        .signatory-item:last-child,
        .joint-member-item:last-child {
          margin-bottom: 0;
        }

        .kin-separator,
        .chama-member-separator,
        .signatory-separator,
        .joint-member-separator {
          border: none;
          border-top: 1px solid var(--border-color);
          margin: 12px 0;
        }
      `}</style>
    </>
  );

  // If in window mode, return content directly, otherwise wrap with DashboardWrapper
  if (isWindowMode) {
    return viewContent;
  }

  return (
    <DashboardWrapper>
      {viewContent}
    </DashboardWrapper>
  );
}

export default Member360View;
