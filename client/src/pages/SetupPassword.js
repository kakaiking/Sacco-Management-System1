import React, { useEffect, useState, useCallback } from "react";
import { useHistory, useLocation } from "react-router-dom";
import axios from "axios";
import { useSnackbar } from "../helpers/SnackbarContext";

function SetupPassword() {
  const history = useHistory();
  const location = useLocation();
  const { showMessage } = useSnackbar();
  
  const [form, setForm] = useState({
    password: "",
    confirmPassword: ""
  });
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");

  const verifyToken = useCallback(async (token) => {
    try {
      const res = await axios.get(`http://localhost:3001/users/verify-token/${token}`);
      setUser(res.data.entity);
    } catch (err) {
      const msg = err?.response?.data?.error || "Invalid or expired token";
      showMessage(msg, "error");
      history.push("/login");
    }
  }, [showMessage, history]);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tokenParam = urlParams.get('token');
    
    if (!tokenParam) {
      showMessage("Invalid or missing token", "error");
      history.push("/login");
      return;
    }
    
    setToken(tokenParam);
    verifyToken(tokenParam);
  }, [location.search, history, showMessage, verifyToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (form.password !== form.confirmPassword) {
      showMessage("Passwords do not match", "error");
      return;
    }
    
    if (form.password.length < 6) {
      showMessage("Password must be at least 6 characters long", "error");
      return;
    }
    
    setLoading(true);
    
    try {
      await axios.post("http://localhost:3001/users/setup-password", {
        token,
        password: form.password,
        confirmPassword: form.confirmPassword
      });
      
      showMessage("Password set up successfully! Your account is now pending approval.", "success");
      history.push("/login");
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to set up password";
      showMessage(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        backgroundColor: "#f8fafc"
      }}>
        <div className="card" style={{ maxWidth: "400px", width: "100%", margin: "20px" }}>
          <div style={{ textAlign: "center", padding: "20px" }}>
            <div style={{ 
              width: "40px", 
              height: "40px", 
              border: "4px solid #e5e7eb", 
              borderTop: "4px solid #3b82f6", 
              borderRadius: "50%", 
              animation: "spin 1s linear infinite",
              margin: "0 auto 20px"
            }}></div>
            <p>Verifying token...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      backgroundColor: "#f8fafc"
    }}>
      <div className="card" style={{ maxWidth: "500px", width: "100%", margin: "20px" }}>
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h1 style={{ 
            fontSize: "28px", 
            fontWeight: "700", 
            color: "#1f2937", 
            marginBottom: "8px" 
          }}>
            Set Up Your Password
          </h1>
          <p style={{ color: "#6b7280", fontSize: "16px" }}>
            Welcome {user.firstName} {user.lastName}!
          </p>
          <p style={{ color: "#6b7280", fontSize: "14px" }}>
            Please create a secure password to complete your account setup.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "20px" }}>
          <div>
            <label style={{ 
              display: "block", 
              marginBottom: "8px", 
              fontWeight: "600", 
              color: "#374151" 
            }}>
              New Password
            </label>
            <input
              className="input"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Enter your new password"
              required
              minLength={6}
              style={{ width: "100%" }}
            />
            <p style={{ 
              fontSize: "12px", 
              color: "#6b7280", 
              marginTop: "4px" 
            }}>
              Password must be at least 6 characters long
            </p>
          </div>

          <div>
            <label style={{ 
              display: "block", 
              marginBottom: "8px", 
              fontWeight: "600", 
              color: "#374151" 
            }}>
              Confirm Password
            </label>
            <input
              className="input"
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              placeholder="Confirm your new password"
              required
              minLength={6}
              style={{ width: "100%" }}
            />
          </div>

          <button
            className="pill"
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px 24px",
              fontSize: "16px",
              fontWeight: "600",
              backgroundColor: loading ? "#9ca3af" : "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
          >
            {loading && (
              <div style={{ 
                width: "16px", 
                height: "16px", 
                border: "2px solid #ffffff", 
                borderTop: "2px solid transparent", 
                borderRadius: "50%", 
                animation: "spin 1s linear infinite"
              }}></div>
            )}
            {loading ? "Setting up password..." : "Set Up Password"}
          </button>
        </form>

        <div style={{ 
          textAlign: "center", 
          marginTop: "30px", 
          paddingTop: "20px", 
          borderTop: "1px solid #e5e7eb" 
        }}>
          <p style={{ fontSize: "12px", color: "#9ca3af" }}>
            Already have an account?{" "}
            <button
              onClick={() => history.push("/login")}
              style={{
                background: "none",
                border: "none",
                color: "#3b82f6",
                cursor: "pointer",
                textDecoration: "underline"
              }}
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default SetupPassword;
