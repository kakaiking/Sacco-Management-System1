#!/usr/bin/env node

/**
 * Automated Payouts Test Runner
 * 
 * This script provides an easy way to run automated payout tests
 * with different options and configurations.
 */

const { spawn } = require('child_process');
const path = require('path');

// Configuration
const TEST_FILES = {
  simple: 'test-simple-automated-payouts.js',
  comprehensive: 'test-automated-payouts.js'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const showHelp = () => {
  log('\n🚀 Automated Payouts Test Runner', 'bright');
  log('=====================================', 'cyan');
  log('\nUsage:', 'yellow');
  log('  node run-automated-payouts-test.js [options]', 'bright');
  log('\nOptions:', 'yellow');
  log('  --simple, -s        Run simple automated payout test (recommended)', 'green');
  log('  --comprehensive, -c Run comprehensive automated payout test', 'green');
  log('  --help, -h          Show this help message', 'green');
  log('\nExamples:', 'yellow');
  log('  node run-automated-payouts-test.js --simple', 'cyan');
  log('  node run-automated-payouts-test.js -s', 'cyan');
  log('  node run-automated-payouts-test.js --comprehensive', 'cyan');
  log('  node run-automated-payouts-test.js -c', 'cyan');
  log('\nTest Types:', 'yellow');
  log('  Simple Test:', 'green');
  log('    - Tests automated payout endpoints only', 'cyan');
  log('    - No test data creation required', 'cyan');
  log('    - Quick execution (30-60 seconds)', 'cyan');
  log('    - Recommended for regular validation', 'cyan');
  log('\n  Comprehensive Test:', 'green');
  log('    - Creates test members, products, and accounts', 'cyan');
  log('    - Full end-to-end workflow testing', 'cyan');
  log('    - Longer execution time (2-5 minutes)', 'cyan');
  log('    - Recommended for thorough validation', 'cyan');
  log('\nPrerequisites:', 'yellow');
  log('  - Server running on http://localhost:3001', 'red');
  log('  - Database accessible and configured', 'red');
  log('  - Test users (Angie/Kamal) exist with proper credentials', 'red');
  log('\n');
};

const runTest = (testType) => {
  const testFile = TEST_FILES[testType];
  
  if (!testFile) {
    log(`❌ Unknown test type: ${testType}`, 'red');
    showHelp();
    process.exit(1);
  }

  const testPath = path.join(__dirname, testFile);
  
  log(`\n🚀 Starting ${testType} automated payout test...`, 'bright');
  log(`📁 Test file: ${testFile}`, 'blue');
  log(`⏰ Started at: ${new Date().toISOString()}`, 'blue');
  log('\n' + '='.repeat(60), 'cyan');

  const child = spawn('node', [testPath], {
    stdio: 'inherit',
    cwd: __dirname
  });

  child.on('close', (code) => {
    log('\n' + '='.repeat(60), 'cyan');
    log(`⏰ Completed at: ${new Date().toISOString()}`, 'blue');
    
    if (code === 0) {
      log(`\n🎉 ${testType} automated payout test completed successfully!`, 'green');
      log('✅ All tests passed', 'green');
    } else {
      log(`\n💥 ${testType} automated payout test failed!`, 'red');
      log(`❌ Exit code: ${code}`, 'red');
      log('🔧 Check the output above for error details', 'yellow');
    }
    
    log('\n📊 Test Summary:', 'yellow');
    log(`  Test Type: ${testType}`, 'cyan');
    log(`  Exit Code: ${code}`, 'cyan');
    log(`  Status: ${code === 0 ? 'SUCCESS' : 'FAILED'}`, code === 0 ? 'green' : 'red');
    
    process.exit(code);
  });

  child.on('error', (error) => {
    log(`\n💥 Failed to start test: ${error.message}`, 'red');
    log('🔧 Troubleshooting:', 'yellow');
    log('  - Ensure Node.js is installed and accessible', 'cyan');
    log('  - Check that the test file exists', 'cyan');
    log('  - Verify file permissions', 'cyan');
    process.exit(1);
  });
};

const main = () => {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }

  // Parse arguments
  let testType = 'simple'; // Default to simple test
  
  if (args.includes('--comprehensive') || args.includes('-c')) {
    testType = 'comprehensive';
  } else if (args.includes('--simple') || args.includes('-s')) {
    testType = 'simple';
  }

  // Validate that only one test type is specified
  const testTypes = args.filter(arg => 
    ['--simple', '-s', '--comprehensive', '-c'].includes(arg)
  );
  
  if (testTypes.length > 1) {
    log('❌ Error: Cannot specify multiple test types', 'red');
    showHelp();
    process.exit(1);
  }

  // Check for unknown arguments
  const validArgs = ['--simple', '-s', '--comprehensive', '-c', '--help', '-h'];
  const unknownArgs = args.filter(arg => !validArgs.includes(arg));
  
  if (unknownArgs.length > 0) {
    log(`❌ Error: Unknown arguments: ${unknownArgs.join(', ')}`, 'red');
    showHelp();
    process.exit(1);
  }

  // Run the selected test
  runTest(testType);
};

// Handle unhandled errors
process.on('unhandledRejection', (reason, promise) => {
  log(`\n💥 Unhandled Rejection: ${reason}`, 'red');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  log(`\n💥 Uncaught Exception: ${error.message}`, 'red');
  process.exit(1);
});

// Run the main function
main();
