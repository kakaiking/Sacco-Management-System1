require('dotenv').config();
const express = require("express");
const app = express();
const cors = require("cors");

app.use(express.json());
app.use(cors());

// Test route
app.get("/test", (req, res) => {
  res.json({ message: "Server is running!", timestamp: new Date().toISOString() });
});

// Mock authentication middleware
const mockAuth = (req, res, next) => {
  const token = req.headers.authorization || req.headers.accessToken;
  if (!token) {
    return res.status(401).json({ error: "User not logged in!" });
  }
  // Mock user data
  req.user = { username: "testuser", role: "Admin" };
  next();
};

// AccountTypes test route
app.get("/account-types", mockAuth, (req, res) => {
  res.json({ 
    code: 200, 
    message: "Account types fetched", 
    entity: [
      {
        id: 1,
        accountTypeId: "AT-SAV001",
        accountTypeName: "Primary Savings Account",
        productId: 1,
        product: {
          id: 1,
          productName: "Primary Savings Product"
        },
        accountType: "MEMBER",
        bosaFosa: "BOSA",
        debitCredit: "DEBIT",
        appliedOnMemberOnboarding: true,
        isWithdrawable: true,
        currency: "UGX",
        status: "Active",
        createdOn: new Date(Date.now() - 86400000 * 5).toISOString(),
        createdBy: "admin"
      },
      {
        id: 2,
        accountTypeId: "AT-LOAN001",
        accountTypeName: "Personal Loan Account",
        productId: 2,
        product: {
          id: 2,
          productName: "Personal Loan Product"
        },
        accountType: "MEMBER",
        bosaFosa: "BOSA",
        debitCredit: "CREDIT",
        appliedOnMemberOnboarding: false,
        isWithdrawable: false,
        currency: "UGX",
        status: "Draft",
        createdOn: new Date(Date.now() - 86400000 * 3).toISOString(),
        createdBy: "admin"
      },
      {
        id: 3,
        accountTypeId: "AT-SHA001",
        accountTypeName: "Share Capital Account",
        productId: 1,
        product: {
          id: 1,
          productName: "Primary Savings Product"
        },
        accountType: "MEMBER",
        bosaFosa: "BOSA",
        debitCredit: "DEBIT",
        appliedOnMemberOnboarding: true,
        isWithdrawable: false,
        currency: "UGX",
        status: "Active",
        createdOn: new Date(Date.now() - 86400000 * 7).toISOString(),
        createdBy: "admin"
      },
      {
        id: 4,
        accountTypeId: "AT-FIX001",
        accountTypeName: "Fixed Deposit Account",
        productId: 3,
        product: {
          id: 3,
          productName: "Fixed Deposit Product"
        },
        accountType: "MEMBER",
        bosaFosa: "FOSA",
        debitCredit: "DEBIT",
        appliedOnMemberOnboarding: false,
        isWithdrawable: false,
        currency: "UGX",
        status: "Inactive",
        createdOn: new Date(Date.now() - 86400000 * 10).toISOString(),
        createdBy: "admin"
      },
      {
        id: 5,
        accountTypeId: "AT-CHK001",
        accountTypeName: "Current Account",
        productId: 4,
        product: {
          id: 4,
          productName: "Current Account Product"
        },
        accountType: "MEMBER",
        bosaFosa: "FOSA",
        debitCredit: "DEBIT",
        appliedOnMemberOnboarding: true,
        isWithdrawable: true,
        currency: "UGX",
        status: "Draft",
        createdOn: new Date(Date.now() - 86400000 * 1).toISOString(),
        createdBy: "admin"
      }
    ]
  });
});

// Products test route
app.get("/products", mockAuth, (req, res) => {
  res.json({ 
    code: 200, 
    message: "Products fetched", 
    entity: [
      {
        id: 1,
        productId: "P-TEST001",
        productName: "Test Savings Product",
        saccoId: "SACCO001",
        currency: "UGX",
        productType: "BOSA",
        status: "Active",
        createdOn: new Date().toISOString()
      },
      {
        id: 2,
        productId: "P-TEST002",
        productName: "Test Loan Product",
        saccoId: "SACCO001",
        currency: "UGX",
        productType: "BOSA",
        status: "Active",
        createdOn: new Date().toISOString()
      }
    ]
  });
});

// Mock login endpoint
app.post("/auth/login", (req, res) => {
  res.json({
    code: 200,
    message: "Login successful",
    entity: {
      token: "mock-jwt-token-12345",
      user: {
        id: 1,
        username: "testuser",
        role: "Admin",
        permissions: {
          account_types_maintenance: {
            view: true,
            add: true,
            edit: true,
            delete: true,
            approve: true
          }
        }
      }
    }
  });
});

// Mock AccountTypes CRUD operations
app.get("/account-types/:id", mockAuth, (req, res) => {
  const id = parseInt(req.params.id);
  const accountType = {
    id: id,
    accountTypeId: `AT-SAV${id.toString().padStart(3, '0')}`,
    accountTypeName: "Primary Savings Account",
    productId: 1,
    product: {
      id: 1,
      productName: "Primary Savings Product"
    },
    accountType: "MEMBER",
    bosaFosa: "BOSA",
    debitCredit: "DEBIT",
    appliedOnMemberOnboarding: true,
    isWithdrawable: true,
    withdrawableFrom: null,
    interestRate: 5.5,
    interestType: "Simple",
    interestCalculationRule: "Daily",
    interestFrequency: "Monthly",
    isCreditInterest: false,
    isDebitInterest: true,
    needGuarantors: false,
    maxGuarantors: null,
    minGuarantors: null,
    isSpecial: false,
    maxSpecialUsers: null,
    chargeIds: null,
    currency: "UGX",
    status: "Active",
    remarks: "Primary savings account for members",
    createdOn: new Date(Date.now() - 86400000 * 5).toISOString(),
    createdBy: "admin",
    modifiedOn: null,
    modifiedBy: null,
    approvedOn: null,
    approvedBy: null
  };
  
  res.json({ 
    code: 200, 
    message: "Account type fetched", 
    entity: accountType
  });
});

app.post("/account-types", mockAuth, (req, res) => {
  const newAccountType = {
    id: Math.floor(Math.random() * 1000) + 100,
    accountTypeId: `AT-${Math.floor(Math.random() * 1000000)}`,
    ...req.body,
    createdOn: new Date().toISOString(),
    createdBy: "testuser"
  };
  
  res.json({ 
    code: 201, 
    message: "Account type created successfully", 
    entity: newAccountType
  });
});

app.put("/account-types/:id", mockAuth, (req, res) => {
  const updatedAccountType = {
    id: parseInt(req.params.id),
    ...req.body,
    modifiedOn: new Date().toISOString(),
    modifiedBy: "testuser"
  };
  
  res.json({ 
    code: 200, 
    message: "Account type updated successfully", 
    entity: updatedAccountType
  });
});

app.delete("/account-types/:id", mockAuth, (req, res) => {
  res.json({ 
    code: 200, 
    message: "Account type deleted successfully"
  });
});

app.put("/account-types/:id/status", mockAuth, (req, res) => {
  res.json({ 
    code: 200, 
    message: "Account type status updated successfully"
  });
});

// Mock static data endpoints
app.get("/genders", mockAuth, (req, res) => {
  res.json({ 
    code: 200, 
    message: "Genders fetched", 
    entity: [
      { id: 1, genderId: "G-001", genderName: "Male", description: "Male gender", status: "Active" },
      { id: 2, genderId: "G-002", genderName: "Female", description: "Female gender", status: "Active" },
      { id: 3, genderId: "G-003", genderName: "Other", description: "Other gender", status: "Active" }
    ]
  });
});

app.get("/identification-types", mockAuth, (req, res) => {
  res.json({ 
    code: 200, 
    message: "Identification types fetched", 
    entity: [
      { id: 1, identificationTypeId: "ID-001", identificationTypeName: "National ID", description: "National identification card", status: "Active" },
      { id: 2, identificationTypeId: "ID-002", identificationTypeName: "Passport", description: "International passport", status: "Active" },
      { id: 3, identificationTypeId: "ID-003", identificationTypeName: "Driver's License", description: "Driver's license", status: "Active" },
      { id: 4, identificationTypeId: "ID-004", identificationTypeName: "Voter's Card", description: "Voter identification card", status: "Active" }
    ]
  });
});

app.get("/next-of-kin-relation-types", mockAuth, (req, res) => {
  res.json({ 
    code: 200, 
    message: "Next of kin relation types fetched", 
    entity: [
      { id: 1, relationTypeId: "RT-001", relationTypeName: "Spouse", description: "Married partner", status: "Active" },
      { id: 2, relationTypeId: "RT-002", relationTypeName: "Parent", description: "Father or mother", status: "Active" },
      { id: 3, relationTypeId: "RT-003", relationTypeName: "Sibling", description: "Brother or sister", status: "Active" },
      { id: 4, relationTypeId: "RT-004", relationTypeName: "Child", description: "Son or daughter", status: "Active" },
      { id: 5, relationTypeId: "RT-005", relationTypeName: "Guardian", description: "Legal guardian", status: "Active" },
      { id: 6, relationTypeId: "RT-006", relationTypeName: "Other", description: "Other relationship", status: "Active" }
    ]
  });
});

app.get("/member-categories", mockAuth, (req, res) => {
  res.json({ 
    code: 200, 
    message: "Member categories fetched", 
    entity: [
      { id: 1, categoryId: "MC-001", categoryName: "Individual Member", description: "Individual member", status: "Active" },
      { id: 2, categoryId: "MC-002", categoryName: "Individual Non-member", description: "Individual non-member", status: "Active" },
      { id: 3, categoryId: "MC-003", categoryName: "Group Member", description: "Group member", status: "Active" },
      { id: 4, categoryId: "MC-004", categoryName: "Corporate", description: "Corporate member", status: "Active" },
      { id: 5, categoryId: "MC-005", categoryName: "Minor", description: "Minor member", status: "Active" },
      { id: 6, categoryId: "MC-006", categoryName: "Joint", description: "Joint account member", status: "Active" },
      { id: 7, categoryId: "MC-007", categoryName: "Non-Resident", description: "Non-resident member", status: "Active" }
    ]
  });
});

app.get("/interest-types", mockAuth, (req, res) => {
  res.json({ 
    code: 200, 
    message: "Interest types fetched", 
    entity: [
      { id: 1, interestTypeId: "IT-001", interestTypeName: "Simple Interest", description: "Simple interest calculation", status: "Active" },
      { id: 2, interestTypeId: "IT-002", interestTypeName: "Compound Interest", description: "Compound interest calculation", status: "Active" },
      { id: 3, interestTypeId: "IT-003", interestTypeName: "Fixed Rate", description: "Fixed interest rate", status: "Active" },
      { id: 4, interestTypeId: "IT-004", interestTypeName: "Variable Rate", description: "Variable interest rate", status: "Active" }
    ]
  });
});

app.get("/interest-calculation-rules", mockAuth, (req, res) => {
  res.json({ 
    code: 200, 
    message: "Interest calculation rules fetched", 
    entity: [
      { id: 1, ruleId: "ICR-001", ruleName: "Daily", description: "Daily interest calculation", status: "Active" },
      { id: 2, ruleId: "ICR-002", ruleName: "Monthly", description: "Monthly interest calculation", status: "Active" },
      { id: 3, ruleId: "ICR-003", ruleName: "Quarterly", description: "Quarterly interest calculation", status: "Active" },
      { id: 4, ruleId: "ICR-004", ruleName: "Annually", description: "Annual interest calculation", status: "Active" }
    ]
  });
});

app.get("/interest-frequency", mockAuth, (req, res) => {
  res.json({ 
    code: 200, 
    message: "Interest frequencies fetched", 
    entity: [
      { id: 1, frequencyId: "IF-001", frequencyName: "Monthly", description: "Monthly interest payment", status: "Active" },
      { id: 2, frequencyId: "IF-002", frequencyName: "Quarterly", description: "Quarterly interest payment", status: "Active" },
      { id: 3, frequencyId: "IF-003", frequencyName: "Semi-Annually", description: "Semi-annual interest payment", status: "Active" },
      { id: 4, frequencyId: "IF-004", frequencyName: "Annually", description: "Annual interest payment", status: "Active" },
      { id: 5, frequencyId: "IF-005", frequencyName: "At Maturity", description: "Interest paid at maturity", status: "Active" }
    ]
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Simple server running on port ${PORT}`);
  console.log(`Test endpoint: http://localhost:${PORT}/test`);
  console.log(`AccountTypes endpoint: http://localhost:${PORT}/account-types`);
  console.log(`Products endpoint: http://localhost:${PORT}/products`);
});
