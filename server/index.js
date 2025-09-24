require('dotenv').config();
const express = require("express");
const app = express();
const cors = require("cors");

app.use(express.json());
app.use(cors());

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

// Skip database sync since we're using migrations
try {
  app.listen(3001, () => {
    console.log("Server running on port 3001");
  });
} catch (error) {
  console.log("Server startup error:", error);
}
