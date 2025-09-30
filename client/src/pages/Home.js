import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { AuthContext } from "../helpers/AuthContext";
import axios from "axios";
import DashboardWrapper from "../components/DashboardWrapper";
import { 
  FiHome, 
  FiUser,
  FiTrendingUp,
  FiShield,
  FiHeart,
  FiStar,
  FiArrowRight,
  FiUsers,
  FiPackage,
  FiCreditCard,
  FiBarChart,
  FiActivity,
  FiZap,
  FiCheckCircle,
  FiGlobe,
  FiTarget,
  FiAward,
  FiClock,
  FiDollarSign,
  FiPieChart,
  FiSettings
} from "react-icons/fi";

function Home() {
  const { authState, isLoading } = useContext(AuthContext);
  let history = useHistory();
  
  // State for Sacco information (simplified)
  const [saccoInfo, setSaccoInfo] = useState({
    saccoName: "Loading...",
    status: "Active"
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only redirect if authentication check is complete and user is not authenticated
    if (!isLoading && !authState.status) {
      history.push("/login");
    }
  }, [authState, isLoading, history]);

  useEffect(() => {
    const loadSaccoInfo = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const headers = { accessToken: token };

        // Load Sacco information
        const response = await axios.get("http://localhost:3001/saccos", { headers });
        const saccos = response?.data?.entity ?? response?.data ?? [];
        
        if (Array.isArray(saccos) && saccos.length > 0) {
          // Get the first active Sacco
          const activeSacco = saccos.find(s => s.status === 'Active') || saccos[0];
          setSaccoInfo({
            saccoName: activeSacco.saccoName || "Sacco Management System",
            status: activeSacco.status || "Active"
          });
        } else {
          // Default values if no Sacco data found
          setSaccoInfo({
            saccoName: "Sacco Management System",
            status: "Active"
          });
        }
      } catch (error) {
        console.error("Error loading Sacco information:", error);
        // Set default values on error
        setSaccoInfo({
          saccoName: "Sacco Management System",
          status: "Active"
        });
      } finally {
        setLoading(false);
      }
    };

    if (!isLoading && authState.status) {
      loadSaccoInfo();
    }
  }, [isLoading, authState.status]);

  if (loading) {
    return (
      <DashboardWrapper>
        <div className="welcome-page">
          <div className="welcome-content">
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading Sacco information...</p>
            </div>
          </div>
        </div>
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper>
      <div className="modern-home-page">
        {/* Animated Background Elements */}
        <div className="home-orbs">
          <div className="orb one"></div>
          <div className="orb two"></div>
          <div className="orb three"></div>
        </div>

        <div className="home-container">
          {/* Hero Section */}
          <div className="hero-section">
            <div className="hero-content">
              <div className="welcome-badge">
                <div className="badge-icon">
                  <FiZap />
                </div>
                <span>Welcome to {saccoInfo.saccoName}</span>
              </div>
              
              <h1 className="hero-title">
                <span className="title-main">Hello, {authState.username}!</span>
                <div className="title-underline"></div>
              </h1>
              
              <p className="hero-subtitle">
                Your <span className="highlight">financial command center</span> is ready. 
                Manage, monitor, and grow your cooperative with our 
                <span className="highlight"> cutting-edge platform</span>.
              </p>
            </div>
          </div>

          {/* Dashboard Stats */}
          <div className="dashboard-stats">
            <div className="stat-card">
              <div className="stat-icon">
                <FiUsers />
              </div>
              <div className="stat-content">
                <div className="stat-number">1,247</div>
                <div className="stat-label">Active Members</div>
              </div>
              <div className="stat-trend positive">
                <FiTrendingUp />
                <span>+12%</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FiDollarSign />
              </div>
              <div className="stat-content">
                <div className="stat-number">$2.4M</div>
                <div className="stat-label">Total Assets</div>
              </div>
              <div className="stat-trend positive">
                <FiTrendingUp />
                <span>+8%</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FiActivity />
              </div>
              <div className="stat-content">
                <div className="stat-number">156</div>
                <div className="stat-label">Transactions Today</div>
              </div>
              <div className="stat-trend neutral">
                <FiClock />
                <span>Live</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FiPieChart />
              </div>
              <div className="stat-content">
                <div className="stat-number">98.7%</div>
                <div className="stat-label">System Uptime</div>
              </div>
              <div className="stat-trend positive">
                <FiCheckCircle />
                <span>Optimal</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions-section">
            <div className="section-header">
              <h2>Quick Actions</h2>
              <p>Access your most used features instantly</p>
            </div>
            
            <div className="action-grid">
              <div className="action-card modern" onClick={() => history.push('/member-maintenance')}>
                <div className="action-icon">
                  <FiUsers />
                </div>
                <div className="action-content">
                  <h3>Member Management</h3>
                  <p>Manage member accounts and profiles</p>
                </div>
                <div className="action-arrow">
                  <FiArrowRight />
                </div>
                <div className="action-glow"></div>
              </div>

              <div className="action-card modern" onClick={() => history.push('/product-maintenance')}>
                <div className="action-icon">
                  <FiPackage />
                </div>
                <div className="action-content">
                  <h3>Products & Services</h3>
                  <p>Configure financial products</p>
                </div>
                <div className="action-arrow">
                  <FiArrowRight />
                </div>
                <div className="action-glow"></div>
              </div>

              <div className="action-card modern" onClick={() => history.push('/transactions')}>
                <div className="action-icon">
                  <FiCreditCard />
                </div>
                <div className="action-content">
                  <h3>Transactions</h3>
                  <p>Process payments and transfers</p>
                </div>
                <div className="action-arrow">
                  <FiArrowRight />
                </div>
                <div className="action-glow"></div>
              </div>

              <div className="action-card modern" onClick={() => history.push('/reports')}>
                <div className="action-icon">
                  <FiBarChart />
                </div>
                <div className="action-content">
                  <h3>Analytics</h3>
                  <p>View reports and insights</p>
                </div>
                <div className="action-arrow">
                  <FiArrowRight />
                </div>
                <div className="action-glow"></div>
              </div>
            </div>
          </div>

          {/* Features Showcase */}
          <div className="features-showcase">
            <div className="section-header">
              <h2>Platform Features</h2>
              <p>Powerful tools for modern financial management</p>
            </div>
            
            <div className="feature-list">
              <div className="feature-item">
                <div className="feature-icon">
                  <FiShield />
                </div>
                <div className="feature-content">
                  <h3>Bank-Grade Security</h3>
                  <p>Military-grade encryption protects your financial data with 256-bit SSL</p>
                </div>
              </div>
              
              <div className="feature-item">
                <div className="feature-icon">
                  <FiZap />
                </div>
                <div className="feature-content">
                  <h3>Real-Time Processing</h3>
                  <p>Instant transaction processing with live balance updates</p>
                </div>
              </div>
              
              <div className="feature-item">
                <div className="feature-icon">
                  <FiTarget />
                </div>
                <div className="feature-content">
                  <h3>Smart Automation</h3>
                  <p>AI-powered workflows for seamless operations and compliance</p>
                </div>
              </div>
              
              <div className="feature-item">
                <div className="feature-icon">
                  <FiGlobe />
                </div>
                <div className="feature-content">
                  <h3>24/7 Support</h3>
                  <p>Dedicated financial experts available around the clock</p>
                </div>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="system-status-modern">
            <div className="status-card">
              <div className="status-header">
                <div className="status-indicator">
                  <div className="status-dot active"></div>
                  <span>All Systems Operational</span>
                </div>
                <div className="status-time">
                  <FiClock />
                  <span>Last updated: {new Date().toLocaleTimeString()}</span>
                </div>
              </div>
              <div className="status-details">
                <div className="status-item">
                  <FiCheckCircle />
                  <span>Database: Online</span>
                </div>
                <div className="status-item">
                  <FiCheckCircle />
                  <span>API Services: Active</span>
                </div>
                <div className="status-item">
                  <FiCheckCircle />
                  <span>Security: Protected</span>
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
