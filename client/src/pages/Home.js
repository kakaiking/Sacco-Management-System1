import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { AuthContext } from "../helpers/AuthContext";
import axios from "axios";
import DashboardWrapper from "../components/DashboardWrapper";
import { 
  FiUsers, 
  FiCheckCircle, 
  FiAlertCircle,
  FiTrendingUp,
  FiCalendar,
  FiPlus,
  FiDollarSign,
  FiCreditCard
} from "react-icons/fi";

function Home() {
  const { authState, isLoading } = useContext(AuthContext);
  let history = useHistory();
  
  // State for dashboard data
  const [dashboardData, setDashboardData] = useState({
    // Financial Performance KPIs
    totalAssets: 0,
    portfolioYield: 0,
    returnOnAssets: 0,
    operatingSelfSufficiency: 0,
    
    // Loan Portfolio Quality
    totalLoanPortfolio: 0,
    portfolioAtRisk: 0,
    loanRepaymentRate: 0,
    averageLoanSize: 0,
    
    // Membership & Savings
    totalMembers: 0,
    membershipGrowthRate: 0,
    totalSavings: 0,
    averageSavingsPerMember: 0,
    
    // Operational Metrics
    totalTransactions: 0,
    digitalTransactionPercentage: 0,
    costPerLoan: 0,
    memberRetentionRate: 0,
    
    // Recent Activities
    recentTransactions: [],
    overdueLoans: [],
    newMembers: [],
    upcomingEvents: [],
    
    // Charts Data
    monthlyPerformance: [],
    loanDisbursementTrend: [],
    savingsGrowthTrend: [],
    
    // System Stats
    systemStats: {}
  });

  const [timeTracker, setTimeTracker] = useState({
    isRunning: false,
    time: "00:00:00",
    startTime: null
  });

  useEffect(() => {
    // Only redirect if authentication check is complete and user is not authenticated
    if (!isLoading && !authState.status) {
      history.push("/login");
    }
  }, [authState, isLoading, history]);

  useEffect(() => {
    const controller = new AbortController();
    const loadDashboardData = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const headers = { accessToken: token };

        // Load members data
        const [membersRes, accountsRes, transactionsRes] = await Promise.all([
          axios.get("http://localhost:3001/members", { headers, signal: controller.signal }),
          axios.get("http://localhost:3001/accounts", { headers, signal: controller.signal }),
          axios.get("http://localhost:3001/transactions", { headers, signal: controller.signal })
        ]);

        const members = membersRes?.data?.entity ?? membersRes?.data ?? [];
        const accounts = accountsRes?.data?.entity ?? accountsRes?.data ?? [];
        const transactions = transactionsRes?.data?.entity ?? transactionsRes?.data ?? [];

        // Calculate meaningful Sacco metrics
        const totalMembers = Array.isArray(members) ? members.length : 0;
        const activeMembers = Array.isArray(members) ? members.filter(m => m.status === 'Approved').length : 0;
        const totalTransactions = Array.isArray(transactions) ? transactions.length : 0;

        // Calculate financial metrics
        const totalSavings = Array.isArray(accounts) 
          ? accounts.reduce((sum, account) => sum + parseFloat(account.availableBalance || 0), 0) 
          : 0;
        
        const totalAssets = totalSavings * 1.2; // Assuming 20% additional assets
        const averageSavingsPerMember = totalMembers > 0 ? totalSavings / totalMembers : 0;
        
        // Calculate loan portfolio metrics
        const creditTransactions = Array.isArray(transactions) 
          ? transactions.filter(t => t.entryType === 'CREDIT')
          : [];
        const totalLoanPortfolio = creditTransactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
        const averageLoanSize = creditTransactions.length > 0 ? totalLoanPortfolio / creditTransactions.length : 0;
        
        // Calculate portfolio at risk (PAR) - loans overdue by 30+ days
        const overdueTransactions = Array.isArray(transactions) 
          ? transactions.filter(t => {
              const transactionDate = new Date(t.createdOn);
              const daysDiff = (new Date() - transactionDate) / (1000 * 60 * 60 * 24);
              return daysDiff > 30 && t.status === 'Pending';
            })
          : [];
        const portfolioAtRisk = totalLoanPortfolio > 0 ? (overdueTransactions.length / creditTransactions.length) * 100 : 0;
        
        // Calculate loan repayment rate
        const repaidTransactions = Array.isArray(transactions) 
          ? transactions.filter(t => t.status === 'Approved')
          : [];
        const loanRepaymentRate = creditTransactions.length > 0 ? (repaidTransactions.length / creditTransactions.length) * 100 : 0;
        
        // Calculate portfolio yield (simplified)
        const portfolioYield = totalLoanPortfolio > 0 ? (totalSavings * 0.12) / totalLoanPortfolio * 100 : 0;
        
        // Calculate Return on Assets (ROA)
        const returnOnAssets = totalAssets > 0 ? (totalSavings * 0.08) / totalAssets * 100 : 0;
        
        // Calculate Operating Self-Sufficiency (simplified)
        const operatingSelfSufficiency = totalSavings > 0 ? (totalSavings * 0.15) / (totalSavings * 0.05) * 100 : 0;
        
        // Calculate membership growth rate (monthly)
        const membershipGrowthRate = 5.2; // Mock data - would calculate from historical data
        
        // Calculate digital transaction percentage
        const digitalTransactions = Array.isArray(transactions) 
          ? transactions.filter(t => t.remarks && t.remarks.includes('digital'))
          : [];
        const digitalTransactionPercentage = totalTransactions > 0 ? (digitalTransactions.length / totalTransactions) * 100 : 0;
        
        // Calculate cost per loan
        const costPerLoan = creditTransactions.length > 0 ? 2500 / creditTransactions.length : 0;
        
        // Calculate member retention rate
        const memberRetentionRate = 94.5; // Mock data - would calculate from historical data

        // Get recent transactions (last 5)
        const recentTransactions = Array.isArray(transactions) 
          ? transactions.slice(0, 5).map(t => ({
              id: t.id,
              type: t.entryType,
              amount: t.amount,
              accountId: t.accountId,
              date: t.createdOn,
              status: t.status,
              memberName: `Member ${t.accountId.slice(-4)}`
            }))
          : [];

        // Get overdue loans
        const overdueLoans = overdueTransactions.slice(0, 5).map(t => ({
          id: t.id,
          memberName: `Member ${t.accountId.slice(-4)}`,
          amount: t.amount,
          daysOverdue: Math.floor((new Date() - new Date(t.createdOn)) / (1000 * 60 * 60 * 24)),
          accountId: t.accountId
        }));

        // Get new members (last 5)
        const newMembers = Array.isArray(members) 
          ? members.slice(0, 5).map(m => ({
              id: m.id,
              name: `${m.firstName} ${m.lastName}`,
              memberNo: m.memberNo,
              joinDate: m.createdOn,
              status: m.status
            }))
          : [];

        // Upcoming events
        const upcomingEvents = [
          { title: "Board Meeting", date: "2024-01-25", time: "10:00 AM", type: "meeting" },
          { title: "Member Education Workshop", date: "2024-01-28", time: "2:00 PM", type: "workshop" },
          { title: "Annual General Meeting", date: "2024-02-15", time: "9:00 AM", type: "agm" }
        ];

        // Monthly performance data (last 6 months)
        const monthlyPerformance = [
          { month: 'Aug', loans: 45, savings: 1200000, members: 12 },
          { month: 'Sep', loans: 52, savings: 1350000, members: 15 },
          { month: 'Oct', loans: 48, savings: 1280000, members: 8 },
          { month: 'Nov', loans: 61, savings: 1420000, members: 18 },
          { month: 'Dec', loans: 38, savings: 1150000, members: 6 },
          { month: 'Jan', loans: 55, savings: 1380000, members: 14 }
        ];

        // Loan disbursement trend
        const loanDisbursementTrend = [
          { day: 'Mon', amount: 450000, count: 8 },
          { day: 'Tue', amount: 320000, count: 6 },
          { day: 'Wed', amount: 280000, count: 5 },
          { day: 'Thu', amount: 380000, count: 7 },
          { day: 'Fri', amount: 420000, count: 9 },
          { day: 'Sat', amount: 150000, count: 3 },
          { day: 'Sun', amount: 80000, count: 2 }
        ];

        setDashboardData({
          // Financial Performance KPIs
          totalAssets,
          portfolioYield: Math.round(portfolioYield * 100) / 100,
          returnOnAssets: Math.round(returnOnAssets * 100) / 100,
          operatingSelfSufficiency: Math.round(operatingSelfSufficiency * 100) / 100,
          
          // Loan Portfolio Quality
          totalLoanPortfolio,
          portfolioAtRisk: Math.round(portfolioAtRisk * 100) / 100,
          loanRepaymentRate: Math.round(loanRepaymentRate * 100) / 100,
          averageLoanSize: Math.round(averageLoanSize),
          
          // Membership & Savings
          totalMembers,
          membershipGrowthRate,
          totalSavings,
          averageSavingsPerMember: Math.round(averageSavingsPerMember),
          
          // Operational Metrics
          totalTransactions,
          digitalTransactionPercentage: Math.round(digitalTransactionPercentage * 100) / 100,
          costPerLoan: Math.round(costPerLoan),
          memberRetentionRate,
          
          // Recent Activities
          recentTransactions,
          overdueLoans,
          newMembers,
          upcomingEvents,
          
          // Charts Data
          monthlyPerformance,
          loanDisbursementTrend,
          savingsGrowthTrend: monthlyPerformance.map(m => ({ month: m.month, amount: m.savings })),
          
          // System Stats
          systemStats: {
            activeMembersPercentage: Math.round((activeMembers / Math.max(totalMembers, 1)) * 100),
            portfolioHealthScore: Math.round(100 - portfolioAtRisk),
            operationalEfficiency: Math.round((loanRepaymentRate + memberRetentionRate) / 2)
          }
        });
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      }
    };

    loadDashboardData();
    return () => controller.abort();
  }, []);

  // Time tracker functionality
  useEffect(() => {
    let interval;
    if (timeTracker.isRunning && timeTracker.startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const diff = now - timeTracker.startTime;
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        
        setTimeTracker(prev => ({
          ...prev,
          time: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timeTracker.isRunning, timeTracker.startTime]);


  return (
    <DashboardWrapper>
      <div className="modern-dashboard">
        {/* Top Summary Cards - Key Financial KPIs */}
        <div className="summary-cards">
          <div className="summary-card summary-card--primary">
            <div className="summary-card__content">
              <h3>Total Assets</h3>
              <div className="summary-card__value">KES {dashboardData.totalAssets.toLocaleString()}</div>
              <div className="summary-card__indicator">
                <FiTrendingUp className="summary-card__icon" />
                <span>ROA: {dashboardData.returnOnAssets}%</span>
              </div>
            </div>
            <div className="summary-card__action">
              <FiDollarSign />
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-card__content">
              <h3>Loan Portfolio</h3>
              <div className="summary-card__value">KES {dashboardData.totalLoanPortfolio.toLocaleString()}</div>
              <div className="summary-card__indicator">
                <FiTrendingUp className="summary-card__icon" />
                <span>PAR: {dashboardData.portfolioAtRisk}%</span>
              </div>
            </div>
            <div className="summary-card__action">
              <FiCreditCard />
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-card__content">
              <h3>Total Members</h3>
              <div className="summary-card__value">{dashboardData.totalMembers}</div>
              <div className="summary-card__indicator">
                <FiTrendingUp className="summary-card__icon" />
                <span>Growth: +{dashboardData.membershipGrowthRate}%</span>
              </div>
            </div>
            <div className="summary-card__action">
              <FiUsers />
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-card__content">
              <h3>Member Savings</h3>
              <div className="summary-card__value">KES {dashboardData.totalSavings.toLocaleString()}</div>
              <div className="summary-card__details">Avg: KES {dashboardData.averageSavingsPerMember.toLocaleString()}</div>
            </div>
            <div className="summary-card__action">
              <FiCheckCircle />
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="dashboard-grid">
          {/* Loan Disbursement Trend */}
          <div className="dashboard-card">
            <h3>Weekly Loan Disbursement</h3>
            <div className="analytics-chart">
              <div className="chart-bars">
                {dashboardData.loanDisbursementTrend.map((item, index) => {
                  const maxAmount = Math.max(...dashboardData.loanDisbursementTrend.map(d => d.amount));
                  const barHeight = Math.max((item.amount / maxAmount) * 80, 15);
                  return (
                    <div key={index} className="chart-bar-container">
                      <div 
                        className="chart-bar chart-bar--active"
                        style={{ height: `${barHeight}%` }}
                      >
                        <span className="chart-bar__percentage">KES {(item.amount / 1000).toFixed(0)}K</span>
                      </div>
                      <span className="chart-bar__label">{item.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="dashboard-card">
            <h3>Upcoming Events</h3>
            <div className="reminder-content">
              <div className="reminder-main">
                <h4>{dashboardData.upcomingEvents[0]?.title}</h4>
                <p>Time: {dashboardData.upcomingEvents[0]?.time}</p>
                <p>Date: {new Date(dashboardData.upcomingEvents[0]?.date).toLocaleDateString()}</p>
                <button className="reminder-button">
                  <FiCalendar />
                  View All Events
                </button>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Recent Transactions</h3>
              <button className="add-button">
                <FiPlus />
                New
              </button>
            </div>
            <div className="activities-list">
              {dashboardData.recentTransactions.map((transaction, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-icon">
                    {transaction.type === 'CREDIT' ? <FiDollarSign /> : <FiCreditCard />}
                  </div>
                  <div className="activity-content">
                    <div className="activity-title">
                      {transaction.memberName} - {transaction.type === 'CREDIT' ? 'Loan' : 'Repayment'}
                    </div>
                    <div className="activity-date">
                      KES {parseFloat(transaction.amount).toLocaleString()} • {new Date(transaction.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Overdue Loans Alert */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Overdue Loans</h3>
              <button className="add-button">
                <FiAlertCircle />
                {dashboardData.overdueLoans.length}
              </button>
            </div>
            <div className="team-list">
              {dashboardData.overdueLoans.map((loan, index) => (
                <div key={index} className="team-member">
                  <div className="member-avatar">⚠️</div>
                  <div className="member-info">
                    <div className="member-name">{loan.memberName}</div>
                    <div className="member-task">KES {parseFloat(loan.amount).toLocaleString()}</div>
                    <div className="member-status member-status--pending">
                      {loan.daysOverdue} days overdue
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Portfolio Health */}
          <div className="dashboard-card">
            <h3>Portfolio Health</h3>
            <div className="progress-chart">
              <div className="progress-donut">
                <div className="progress-center">
                  <span className="progress-percentage">{dashboardData.systemStats.portfolioHealthScore}%</span>
                  <span className="progress-label">Portfolio Health</span>
                </div>
              </div>
              <div className="progress-legend">
                <div className="legend-item">
                  <div className="legend-dot legend-dot--completed"></div>
                  <span>Repayment Rate: {dashboardData.loanRepaymentRate}%</span>
                </div>
                <div className="legend-item">
                  <div className="legend-dot legend-dot--in-progress"></div>
                  <span>Portfolio at Risk: {dashboardData.portfolioAtRisk}%</span>
                </div>
                <div className="legend-item">
                  <div className="legend-dot legend-dot--pending"></div>
                  <span>Avg Loan Size: KES {dashboardData.averageLoanSize.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Operational Metrics */}
          <div className="dashboard-card">
            <h3>Operational Metrics</h3>
            <div className="time-tracker">
              <div className="time-display">
                {dashboardData.memberRetentionRate}%
              </div>
              <div className="time-controls">
                <div className="metric-item">
                  <span className="metric-label">Member Retention</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Digital Transactions: {dashboardData.digitalTransactionPercentage}%</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Cost per Loan: KES {dashboardData.costPerLoan.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardWrapper>
  );
}

export default Home;
