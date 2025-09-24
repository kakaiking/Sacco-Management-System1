import React, { useContext, useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { AuthContext } from "../helpers/AuthContext";
import { FiDownload, FiRefreshCw } from "react-icons/fi";
import DashboardWrapper from '../components/DashboardWrapper';

function LoanCalculator() {
  const history = useHistory();
  const { authState, isLoading } = useContext(AuthContext);

  useEffect(() => {
    // Only redirect if authentication check is complete and user is not authenticated
    if (!isLoading && !authState.status) {
      history.push("/login");
    }
  }, [authState, isLoading, history]);

  const [loanData, setLoanData] = useState({
    principal: "",
    interestRate: "",
    termMonths: "",
    startDate: "",
    paymentFrequency: "monthly"
  });

  const [schedule, setSchedule] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isCalculated, setIsCalculated] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLoanData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateLoan = () => {
    const principal = parseFloat(loanData.principal);
    const annualRate = parseFloat(loanData.interestRate) / 100;
    const termMonths = parseInt(loanData.termMonths);
    const startDate = new Date(loanData.startDate);

    if (!principal || !annualRate || !termMonths || !startDate) {
      alert("Please fill in all fields");
      return;
    }

    
    const monthlyRate = annualRate / 12;
    const totalPayments = termMonths;

    // Calculate monthly payment using PMT formula
    const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
                          (Math.pow(1 + monthlyRate, totalPayments) - 1);

    const scheduleData = [];
    let remainingBalance = principal;
    let totalInterest = 0;

    for (let i = 0; i < totalPayments; i++) {
      const interestPayment = remainingBalance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      remainingBalance = Math.max(0, remainingBalance - principalPayment);
      totalInterest += interestPayment;

      const paymentDate = new Date(startDate);
      paymentDate.setMonth(paymentDate.getMonth() + i);

      scheduleData.push({
        paymentNumber: i + 1,
        paymentDate: paymentDate.toLocaleDateString(),
        paymentAmount: monthlyPayment.toFixed(2),
        principalPayment: principalPayment.toFixed(2),
        interestPayment: interestPayment.toFixed(2),
        remainingBalance: remainingBalance.toFixed(2)
      });
    }

    setSchedule(scheduleData);
    setSummary({
      totalPayments: totalPayments,
      monthlyPayment: monthlyPayment.toFixed(2),
      totalInterest: totalInterest.toFixed(2),
      totalAmount: (principal + totalInterest).toFixed(2)
    });
    setIsCalculated(true);
  };

  const resetCalculator = () => {
    setLoanData({
      principal: "",
      interestRate: "",
      termMonths: "",
      startDate: "",
      paymentFrequency: "monthly"
    });
    setSchedule([]);
    setSummary(null);
    setIsCalculated(false);
  };

  const exportToCSV = () => {
    if (!schedule.length) return;

    const headers = ["Payment #", "Payment Date", "Payment Amount", "Principal", "Interest", "Remaining Balance"];
    const csvContent = [
      headers.join(","),
      ...schedule.map(row => [
        row.paymentNumber,
        row.paymentDate,
        row.paymentAmount,
        row.principalPayment,
        row.interestPayment,
        row.remainingBalance
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `loan-schedule-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <DashboardWrapper>
      <header className="header">
        <div className="header__left">
          <div className="greeting">Loan Calculator</div>
        </div>
      </header>

      <main className="dashboard__content">
        <section className="card" style={{ padding: "24px", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "24px" }}>
            <h2 style={{ margin: 0, color: "var(--primary-700)" }}>Loan Calculator</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "var(--primary-700)" }}>
                Loan Amount (Principal)
              </label>
              <input
                type="number"
                name="principal"
                value={loanData.principal}
                onChange={handleInputChange}
                placeholder="Enter loan amount"
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "16px"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "var(--primary-700)" }}>
                Annual Interest Rate (%)
              </label>
              <input
                type="number"
                name="interestRate"
                value={loanData.interestRate}
                onChange={handleInputChange}
                placeholder="Enter interest rate"
                step="0.01"
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "16px"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "var(--primary-700)" }}>
                Loan Term (Months)
              </label>
              <input
                type="number"
                name="termMonths"
                value={loanData.termMonths}
                onChange={handleInputChange}
                placeholder="Enter term in months"
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "16px"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "var(--primary-700)" }}>
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={loanData.startDate}
                onChange={handleInputChange}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "16px"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "var(--primary-700)" }}>
                Payment Frequency
              </label>
              <select
                name="paymentFrequency"
                value={loanData.paymentFrequency}
                onChange={handleInputChange}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "16px"
                }}
              >
                <option value="monthly">Monthly</option>
                <option value="bi-weekly">Bi-weekly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
            <button
              onClick={calculateLoan}
              style={{
                backgroundColor: "var(--primary-500)",
                color: "white",
                border: "none",
                padding: "12px 24px",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.3s ease"
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "var(--primary-600)";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "var(--primary-500)";
              }}
            >
              Calculate Loan
            </button>

            <button
              onClick={resetCalculator}
              style={{
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                padding: "12px 24px",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.3s ease"
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#5a6268";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#6c757d";
              }}
            >
              <FiRefreshCw />
              Reset
            </button>
          </div>
        </section>

        {summary && (
          <section className="card" style={{ padding: "24px", marginBottom: "24px" }}>
            <h3 style={{ margin: "0 0 20px 0", color: "var(--primary-700)" }}>Loan Summary</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
              <div style={{ textAlign: "center", padding: "16px", backgroundColor: "var(--primary-100)", borderRadius: "8px" }}>
                <div style={{ fontSize: "24px", fontWeight: "700", color: "var(--primary-700)" }}>
                  {summary.monthlyPayment}
                </div>
                <div style={{ fontSize: "14px", color: "var(--muted-text)" }}>Monthly Payment</div>
              </div>
              <div style={{ textAlign: "center", padding: "16px", backgroundColor: "rgba(16, 185, 129, 0.1)", borderRadius: "8px" }}>
                <div style={{ fontSize: "24px", fontWeight: "700", color: "#059669" }}>
                  {summary.totalInterest}
                </div>
                <div style={{ fontSize: "14px", color: "var(--muted-text)" }}>Total Interest</div>
              </div>
              <div style={{ textAlign: "center", padding: "16px", backgroundColor: "rgba(249, 115, 22, 0.1)", borderRadius: "8px" }}>
                <div style={{ fontSize: "24px", fontWeight: "700", color: "#ea580c" }}>
                  {summary.totalAmount}
                </div>
                <div style={{ fontSize: "14px", color: "var(--muted-text)" }}>Total Amount</div>
              </div>
              <div style={{ textAlign: "center", padding: "16px", backgroundColor: "rgba(6, 182, 212, 0.1)", borderRadius: "8px" }}>
                <div style={{ fontSize: "24px", fontWeight: "700", color: "#0891b2" }}>
                  {summary.totalPayments}
                </div>
                <div style={{ fontSize: "14px", color: "var(--muted-text)" }}>Total Payments</div>
              </div>
            </div>
          </section>
        )}

        {isCalculated && schedule.length > 0 && (
          <section className="card" style={{ padding: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, color: "var(--primary-700)" }}>Payment Schedule</h3>
              <button
                onClick={exportToCSV}
                style={{
                  backgroundColor: "#10b981",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#059669";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#10b981";
                }}
              >
                <FiDownload />
                Export CSV
              </button>
            </div>

            <div className="tableContainer">
              <table className="table">
                <thead>
                  <tr>
                    <th>Payment #</th>
                    <th>Payment Date</th>
                    <th>Payment Amount</th>
                    <th>Principal</th>
                    <th>Interest</th>
                    <th>Remaining Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((payment, index) => (
                    <tr key={index}>
                      <td>{payment.paymentNumber}</td>
                      <td>{payment.paymentDate}</td>
                      <td style={{ fontWeight: "600" }}>{payment.paymentAmount}</td>
                      <td style={{ color: "#059669" }}>{payment.principalPayment}</td>
                      <td style={{ color: "#ea580c" }}>{payment.interestPayment}</td>
                      <td style={{ color: "var(--muted-text)" }}>{payment.remainingBalance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </DashboardWrapper>
  );
}

export default LoanCalculator;
