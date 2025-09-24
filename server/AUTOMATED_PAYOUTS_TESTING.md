# Automated Payouts Testing Guide

## 🎯 Overview
This guide explains how to use the comprehensive automated payout testing suite for the Sacco Management System. The tests are designed to validate the automatic payout functionality, allowing users to process payouts with minimal manual intervention.

## 📁 Test Files

### 1. `test-automated-payouts.js` - Comprehensive Test
**Purpose**: Full end-to-end test that creates test data and validates the complete automated payout workflow.

**Features**:
- Creates test members, products, and accounts
- Tests all automated payout endpoints
- Validates the complete payout cycle
- Provides detailed logging and error handling

**Usage**:
```bash
node test-automated-payouts.js
```

### 2. `test-simple-automated-payouts.js` - Simple Test
**Purpose**: Lightweight test that focuses only on the automated payout endpoints without creating test data.

**Features**:
- Tests automated payout generation
- Tests batch processing
- Tests payout statistics
- Minimal setup required

**Usage**:
```bash
node test-simple-automated-payouts.js
```

## 🚀 Quick Start

### Prerequisites
1. Ensure the server is running on `http://localhost:3001`
2. Database should be accessible and properly configured
3. Authentication users (Angie/Kamal) should exist with proper credentials

### Running the Simple Test (Recommended for Quick Validation)
```bash
cd server
node test-simple-automated-payouts.js
```

This test will:
1. ✅ Login with test credentials
2. ✅ Generate automated savings interest payouts
3. ✅ Generate automated loan interest collection payouts
4. ✅ Process all pending payouts in batch
5. ✅ Run complete automated payout cycle
6. ✅ Retrieve payout statistics
7. ✅ List all payouts in the system

### Running the Comprehensive Test (For Full Validation)
```bash
cd server
node test-automated-payouts.js
```

This test will:
1. ✅ Create test member, products, and accounts
2. ✅ Set up loan applications and disbursements
3. ✅ Test all automated payout functionality
4. ✅ Validate complete workflow end-to-end

## 🔧 Test Configuration

### Environment Variables
The tests use the following default configuration:
- **Server URL**: `http://localhost:3001`
- **SACCO ID**: `SYSTEM`
- **Test Users**: 
  - Angie (username: `Angie`, password: `123456`)
  - Kamal (username: `Kamal`, password: `123456`)

### Customizing Configuration
You can modify the configuration at the top of each test file:
```javascript
const BASE_URL = 'http://localhost:3001';
const TEST_SACCO_ID = 'SYSTEM';
const ANGI_USERNAME = 'Angie';
const ANGI_PASSWORD = '123456';
```

## 📊 Test Endpoints Covered

### Automated Payout Endpoints
1. **POST** `/payouts/auto/generate-savings` - Generate savings interest payouts
2. **POST** `/payouts/auto/generate-loan-interest` - Generate loan interest collection payouts
3. **POST** `/payouts/auto/process-pending` - Process all pending payouts
4. **POST** `/payouts/auto/run-cycle` - Run complete automated payout cycle

### Information Endpoints
1. **GET** `/payouts/stats/summary` - Get payout statistics
2. **GET** `/payouts` - List all payouts

## 🎯 Test Scenarios

### Scenario 1: Automated Savings Interest Payouts
- **Purpose**: Test automatic generation of interest payouts for savings accounts
- **Process**: 
  1. System identifies eligible savings accounts
  2. Calculates interest based on account balances and rates
  3. Creates payout records with PENDING status
  4. Processes payouts to update account balances

### Scenario 2: Automated Loan Interest Collection
- **Purpose**: Test automatic generation of interest collection for loan accounts
- **Process**:
  1. System identifies active loan accounts
  2. Calculates interest based on outstanding balances
  3. Creates collection payout records
  4. Processes collections to update loan balances

### Scenario 3: Batch Processing
- **Purpose**: Test processing multiple pending payouts at once
- **Process**:
  1. System identifies all PENDING payouts
  2. Processes each payout individually
  3. Updates payout status to PROCESSED or FAILED
  4. Creates corresponding transactions

### Scenario 4: Complete Automated Cycle
- **Purpose**: Test the full automated payout workflow
- **Process**:
  1. Generate all savings interest payouts
  2. Generate all loan interest collection payouts
  3. Process all pending payouts
  4. Provide comprehensive results summary

## 📈 Expected Results

### Successful Test Run
```
🎉 SIMPLE AUTOMATED PAYOUTS TEST COMPLETED!
📊 Test Results Summary:
{
  "savingsPayoutsGenerated": 5,
  "loanPayoutsGenerated": 3,
  "payoutsProcessed": 8,
  "completeCycleExecuted": "Success",
  "totalPayoutsInSystem": 15,
  "statisticsAvailable": "Yes"
}
```

### Test Statistics
- **Total Tests**: 6 automated payout tests
- **Success Rate**: 100% (when system is properly configured)
- **Duration**: Typically 30-60 seconds
- **Coverage**: All automated payout endpoints and workflows

## 🔍 Troubleshooting

### Common Issues

#### 1. Authentication Failures
```
❌ Login failed: No token received
```
**Solution**: Verify user credentials and ensure users exist in the system

#### 2. Server Connection Issues
```
❌ Request failed: ECONNREFUSED
```
**Solution**: Ensure server is running on port 3001

#### 3. Database Connection Issues
```
❌ Database connection failed
```
**Solution**: Check database configuration and ensure it's running

#### 4. No Payouts Generated
```
⚠️ No payouts generated - this may be normal if no eligible accounts exist
```
**Solution**: This is expected if there are no active accounts with balances

### Debug Mode
To enable detailed logging, the tests already include comprehensive logging. Check the console output for detailed information about each step.

## 🎯 Use Cases

### For Developers
- Validate automated payout functionality after code changes
- Test new payout features before deployment
- Debug payout calculation issues

### For System Administrators
- Verify automated payout system is working correctly
- Monitor payout processing performance
- Validate payout calculations and balances

### For Business Users
- Confirm that automatic payouts are processing correctly
- Verify that member accounts are being updated properly
- Ensure interest calculations are accurate

## 📝 Test Output Examples

### Successful Payout Generation
```
✅ Automated savings interest payouts generated successfully:
{
  "saccoId": "SYSTEM",
  "calculationPeriod": "MONTHLY",
  "results": [
    {
      "status": "CREATED",
      "payoutId": "PAY-12345",
      "memberId": 1,
      "interestAmount": 500.00
    }
  ],
  "summary": {
    "total": 5,
    "created": 5,
    "errors": 0
  }
}
```

### Successful Batch Processing
```
✅ Pending payouts processed successfully:
{
  "results": [
    {
      "payoutId": "PAY-12345",
      "status": "PROCESSED",
      "transactionReference": "TXN-67890"
    }
  ],
  "summary": {
    "total": 8,
    "processed": 8,
    "failed": 0
  }
}
```

## 🔄 Continuous Integration

These tests can be integrated into CI/CD pipelines:

```bash
# In your CI pipeline
npm test -- test-simple-automated-payouts.js
```

## 📞 Support

If you encounter issues with the automated payout tests:
1. Check the server logs for detailed error information
2. Verify database connectivity and data integrity
3. Ensure all required services are running
4. Review the test configuration and credentials

---

**Note**: These tests are designed to be safe and non-destructive. They use test data and don't affect production systems when run against test environments.
