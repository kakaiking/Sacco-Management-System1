import React, { useState, useContext, useRef, useEffect } from "react";
import axios from "axios";
import { useHistory } from "react-router-dom";
import { AuthContext } from "../helpers/AuthContext";
import { useSnackbar } from "../helpers/SnackbarContext";
import { getUserPermissions } from "../helpers/PermissionUtils";
import { fetchRolePermissions } from "../services/roleService";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { setAuthState } = useContext(AuthContext);
  const { showMessage } = useSnackbar();
  const isMountedRef = useRef(true);

  let history = useHistory();

  // Cleanup function to prevent memory leaks
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const login = async () => {
    if (!username || !password) {
      showMessage("Please enter both username and password", "error");
      return;
    }

    setIsLoading(true);
    
    try {
      const data = { username: username, password: password };
      const response = await axios.post("http://localhost:3001/auth/login", data);
      
      if (response.data.error) {
        showMessage(response.data.error, "error");
      } else {
        localStorage.setItem("accessToken", response.data.token);
        
        // Fetch role permissions
        const rolePermissions = await fetchRolePermissions(response.data.role || "User");
        const userPermissions = getUserPermissions(response.data.role || "User", rolePermissions);
        
        const authStateData = {
          username: response.data.username,
          id: response.data.id,
          userId: response.data.userId,
          role: response.data.role || "User",
          saccoId: response.data.saccoId || 'SYSTEM',
          branchId: response.data.branchId || '',
          permissions: userPermissions,
          status: true,
        };
        
        // Console log the user state on successful login
        console.log("=== LOGIN SUCCESS - USER STATE DATA ===");
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
        showMessage(`Welcome back, ${response.data.username}!`, "success");
        history.push("/");
      }
    } catch (error) {
      const errorMessage = error?.response?.data?.error || "Login failed. Please try again.";
      showMessage(errorMessage, "error");
    } finally {
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };
  return (
    <div className="loginPage">
      <div className="orbs">
        <div className="orb one"></div>
        <div className="orb two"></div>
        <div className="orb three"></div>
      </div>
      <div className="loginContainer">
        <div className="loginLeft">
          <div className="welcomeSection">
            {/* <div className="brandBadge">
              <div className="badgeIcon">💎</div>
              <span>Premium Financial Platform</span>
            </div> */}
            
            <h1 className="welcomeTitle">
              <span className="titleMain">Sacco</span>
              <span className="titleAccent">Lite</span>
              <div className="titleUnderline"></div>
            </h1>
            
            <p className="welcomeSubtitle">
              Transform your cooperative's financial future with our 
              <span className="highlight"> cutting-edge</span> platform designed for 
              <span className="highlight"> modern savings societies</span>.
            </p>
            
            {/* <div className="statsContainer">
              <div className="statItem">
                <div className="statNumber">10K+</div>
                <div className="statLabel">Active Members</div>
              </div>
              <div className="statItem">
                <div className="statNumber">$50M+</div>
                <div className="statLabel">Assets Managed</div>
              </div>
              <div className="statItem">
                <div className="statNumber">99.9%</div>
                <div className="statLabel">Uptime</div>
              </div>
            </div> */}
            
            <div className="featureList">
              <div className="featureItem">
                <div className="featureIcon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="featureContent">
                  <h3>Bank-Grade Security</h3>
                  <p>Military-grade encryption protects your financial data</p>
                </div>
              </div>
              
              <div className="featureItem">
                <div className="featureIcon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="featureContent">
                  <h3>Real-Time Analytics</h3>
                  <p>Live insights and predictive financial modeling</p>
                </div>
              </div>
              
              <div className="featureItem">
                <div className="featureIcon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 12H18L15 21L9 3L6 12H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="featureContent">
                  <h3>Smart Automation</h3>
                  <p>AI-powered workflows for seamless operations</p>
                </div>
              </div>
              
              <div className="featureItem">
                <div className="featureIcon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="featureContent">
                  <h3>24/7 Support</h3>
                  <p>Dedicated financial experts at your service</p>
                </div>
              </div>
            </div>
            
            {/* <div className="trustIndicators">
              <div className="trustItem">
                <div className="trustIcon">🏆</div>
                <span>ISO 27001 Certified</span>
              </div>
              <div className="trustItem">
                <div className="trustIcon">🔒</div>
                <span>SOC 2 Compliant</span>
              </div>
              <div className="trustItem">
                <div className="trustIcon">⚡</div>
                <span>99.9% Uptime</span>
              </div>
            </div> */}
          </div>
        </div>
        
        <div className="loginRight">
          <div className="loginCard">
            <div className="loginHeader">
              <h2 className="loginTitle">Sign In</h2>
              <p className="loginSubtitle">Access your account securely</p>
            </div>

            <div className="loginForm">
              <div className="field">
                <label className="label">Username</label>
                <div className="inputWrapper">
                  <input
                    className="input"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(event) => {
                      setUsername(event.target.value);
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        login();
                      }
                    }}
                  />
                </div>
              </div>

              <div className="field">
                <label className="label">Password</label>
                <div className="inputWrapper">
                  <input
                    className="input"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        login();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="passwordToggle"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <div className="eyeIcon">
                      {showPassword ? (
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                        </svg>
                      )}
                    </div>
                  </button>
                </div>
              </div>

              <button 
                className="submitButton" 
                onClick={login}
                disabled={isLoading}
                style={{
                  opacity: isLoading ? 0.7 : 1,
                  cursor: isLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
