require('dotenv').config();
const express = require("express");
const app = express();
const cors = require("cors");

app.use(express.json({ limit: '50mb' })); // Increase limit for image uploads
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors({
  origin: 'http://localhost:3000', // Allow requests from React app
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'accessToken']
}));

const db = require("./models");

// Routers
const usersRouter = require("./routes/Users");
app.use("/users", usersRouter);
app.use("/auth", usersRouter);
const membersRouter = require("./routes/Members");
app.use("/members", membersRouter);
const productsRouter = require("./routes/Products");
app.use("/products", productsRouter);
const accountsRouter = require("./routes/Accounts");
app.use("/accounts", accountsRouter);
const saccoRouter = require("./routes/Sacco");
app.use("/sacco", saccoRouter);
const branchRouter = require("./routes/Branch");
app.use("/branch", branchRouter);
const rolesRouter = require("./routes/Roles");
app.use("/roles", rolesRouter);
const currencyRouter = require("./routes/Currency");
app.use("/currencies", currencyRouter);
const chargesRouter = require("./routes/Charges");
app.use("/charges", chargesRouter);
const logsRouter = require("./routes/Logs");
app.use("/logs", logsRouter);
const transactionsRouter = require("./routes/Transactions");
app.use("/transactions", transactionsRouter);
const smartTellerRouter = require("./routes/SmartTeller");
app.use("/smart-teller", smartTellerRouter);
const genderRouter = require("./routes/Gender");
app.use("/gender", genderRouter);
const identificationTypesRouter = require("./routes/IdentificationTypes");
app.use("/identification-types", identificationTypesRouter);
const memberCategoriesRouter = require("./routes/MemberCategories");
app.use("/member-categories", memberCategoriesRouter);
const nextOfKinRelationTypesRouter = require("./routes/NextOfKinRelationTypes");
app.use("/next-of-kin-relation-types", nextOfKinRelationTypesRouter);
const interestCalculationRulesRouter = require("./routes/InterestCalculationRules");
app.use("/interest-calculation-rules", interestCalculationRulesRouter);
const interestTypesRouter = require("./routes/InterestTypes");
app.use("/interest-types", interestTypesRouter);
const interestFrequencyRouter = require("./routes/InterestFrequency");
app.use("/interest-frequency", interestFrequencyRouter);
const glAccountsRouter = require("./routes/GLAccounts");
app.use("/gl-accounts", glAccountsRouter);
const accountTypesRouter = require("./routes/AccountTypes");
app.use("/account-types", accountTypesRouter);
const loanProductsRouter = require("./routes/LoanProducts");
app.use("/loan-products", loanProductsRouter);
const loanApplicationsRouter = require("./routes/LoanApplications");
app.use("/loan-applications", loanApplicationsRouter);
const collateralRouter = require("./routes/Collateral");
app.use("/collateral", collateralRouter);
const tillRouter = require("./routes/Till");
app.use("/tills", tillRouter);
const payoutsRouter = require("./routes/Payouts");
app.use("/payouts", payoutsRouter);
const nationalityRouter = require("./routes/Nationality");
app.use("/nationality", nationalityRouter);
const maritalStatusRouter = require("./routes/MaritalStatus");
app.use("/marital-status", maritalStatusRouter);
const pendingChargesRouter = require("./routes/PendingCharges");
app.use("/pending-charges", pendingChargesRouter);
const idFormatConfigurationsRouter = require("./routes/IdFormatConfigurations");
app.use("/id-format-configurations", idFormatConfigurationsRouter);
const accountOfficersRouter = require("./routes/AccountOfficers");
app.use("/account-officers", accountOfficersRouter);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "Sacco Management System API is running",
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({ 
    message: "Welcome to Sacco Management System API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      auth: "/auth",
      members: "/members",
      accounts: "/accounts",
      products: "/products",
      transactions: "/transactions"
    }
  });
});

// Skip database sync since we're using migrations
const PORT = process.env.PORT || 3001;
try {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 API available at: http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/health`);
  });
} catch (error) {
  console.log("❌ Server startup error:", error);
}