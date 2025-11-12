#!/usr/bin/env node

/**
 * Comprehensive test runner for the main branch
 * Runs all tests to ensure functionality is preserved during refactoring
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function runCommand(command, description) {
  log(`\n${colors.blue}🔄 ${description}${colors.reset}`);
  log(`${colors.cyan}Command: ${command}${colors.reset}`);
  
  try {
    const output = execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd(),
      env: { ...process.env, NODE_ENV: 'test' }
    });
    log(`${colors.green}✅ ${description} - PASSED${colors.reset}`);
    return true;
  } catch (error) {
    log(`${colors.red}❌ ${description} - FAILED${colors.reset}`);
    log(`${colors.red}Error: ${error.message}${colors.reset}`);
    return false;
  }
}

function checkTestFiles() {
  const testDirs = [
    '__tests__/unit',
    '__tests__/integration',
    '__tests__/e2e',
  ];
  
  let totalTests = 0;
  
  testDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir).filter(file => 
        file.endsWith('.test.ts') || 
        file.endsWith('.test.tsx') || 
        file.endsWith('.spec.ts')
      );
      totalTests += files.length;
      log(`${colors.cyan}📁 ${dir}: ${files.length} test files${colors.reset}`);
    }
  });
  
  return totalTests;
}

async function main() {
  log(`${colors.bright}${colors.magenta}🧪 COMPREHENSIVE TEST SUITE - MAIN BRANCH${colors.reset}`);
  log(`${colors.magenta}================================================${colors.reset}`);
  
  const startTime = Date.now();
  const results = [];
  
  // Check test files
  log(`\n${colors.yellow}📋 Test File Summary:${colors.reset}`);
  const totalTestFiles = checkTestFiles();
  log(`${colors.bright}Total test files: ${totalTestFiles}${colors.reset}`);
  
  // 1. Unit Tests
  log(`\n${colors.bright}${colors.blue}PHASE 1: UNIT TESTS${colors.reset}`);
  log(`${colors.blue}===================${colors.reset}`);
  
  const unitTestResult = runCommand(
    'npm run test:unit -- --verbose --coverage',
    'Unit Tests (Components, Functions, Utilities)'
  );
  results.push({ name: 'Unit Tests', passed: unitTestResult });
  
  // 2. Integration Tests
  log(`\n${colors.bright}${colors.blue}PHASE 2: INTEGRATION TESTS${colors.reset}`);
  log(`${colors.blue}===========================${colors.reset}`);
  
  const integrationTestResult = runCommand(
    'npm run test:integration -- --verbose',
    'Integration Tests (API Endpoints, Database Operations)'
  );
  results.push({ name: 'Integration Tests', passed: integrationTestResult });
  
  // 3. Lint and Type Check
  log(`\n${colors.bright}${colors.blue}PHASE 3: CODE QUALITY${colors.reset}`);
  log(`${colors.blue}======================${colors.reset}`);
  
  const lintResult = runCommand(
    'npm run lint',
    'ESLint Code Quality Check'
  );
  results.push({ name: 'Lint Check', passed: lintResult });
  
  const typeCheckResult = runCommand(
    'npx tsc --noEmit',
    'TypeScript Type Check'
  );
  results.push({ name: 'Type Check', passed: typeCheckResult });
  
  // 4. Build Test
  log(`\n${colors.bright}${colors.blue}PHASE 4: BUILD VERIFICATION${colors.reset}`);
  log(`${colors.blue}============================${colors.reset}`);
  
  const buildResult = runCommand(
    'npm run build',
    'Production Build Test'
  );
  results.push({ name: 'Build Test', passed: buildResult });
  
  // 5. E2E Tests (if server is running)
  log(`\n${colors.bright}${colors.blue}PHASE 5: END-TO-END TESTS${colors.reset}`);
  log(`${colors.blue}=========================${colors.reset}`);
  
  log(`${colors.yellow}⚠️  E2E tests require a running development server${colors.reset}`);
  log(`${colors.yellow}   Run 'npm run dev' in another terminal, then run 'npm run e2e'${colors.reset}`);
  
  // Check if server is running
  try {
    const response = await fetch('http://localhost:3000/api/health').catch(() => null);
    if (response && response.ok) {
      const e2eResult = runCommand(
        'npm run e2e',
        'End-to-End Tests (Full User Flows)'
      );
      results.push({ name: 'E2E Tests', passed: e2eResult });
    } else {
      log(`${colors.yellow}⏭️  Skipping E2E tests - development server not running${colors.reset}`);
      results.push({ name: 'E2E Tests', passed: null, skipped: true });
    }
  } catch (error) {
    log(`${colors.yellow}⏭️  Skipping E2E tests - development server not accessible${colors.reset}`);
    results.push({ name: 'E2E Tests', passed: null, skipped: true });
  }
  
  // Summary
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000);
  
  log(`\n${colors.bright}${colors.magenta}📊 TEST RESULTS SUMMARY${colors.reset}`);
  log(`${colors.magenta}=======================${colors.reset}`);
  
  let passedCount = 0;
  let failedCount = 0;
  let skippedCount = 0;
  
  results.forEach(result => {
    if (result.skipped) {
      log(`${colors.yellow}⏭️  ${result.name}: SKIPPED${colors.reset}`);
      skippedCount++;
    } else if (result.passed) {
      log(`${colors.green}✅ ${result.name}: PASSED${colors.reset}`);
      passedCount++;
    } else {
      log(`${colors.red}❌ ${result.name}: FAILED${colors.reset}`);
      failedCount++;
    }
  });
  
  log(`\n${colors.bright}Summary:${colors.reset}`);
  log(`${colors.green}✅ Passed: ${passedCount}${colors.reset}`);
  log(`${colors.red}❌ Failed: ${failedCount}${colors.reset}`);
  log(`${colors.yellow}⏭️  Skipped: ${skippedCount}${colors.reset}`);
  log(`${colors.cyan}⏱️  Duration: ${duration}s${colors.reset}`);
  
  if (failedCount === 0) {
    log(`\n${colors.bright}${colors.green}🎉 ALL TESTS PASSED! Main branch is ready for refactoring.${colors.reset}`);
    log(`${colors.green}You can now safely switch to the refactoring branch and run these same tests.${colors.reset}`);
    process.exit(0);
  } else {
    log(`\n${colors.bright}${colors.red}💥 SOME TESTS FAILED! Fix issues before refactoring.${colors.reset}`);
    log(`${colors.red}The main branch must be fully functional before refactoring begins.${colors.reset}`);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  log(`${colors.red}💥 Uncaught Exception: ${error.message}${colors.reset}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`${colors.red}💥 Unhandled Rejection at: ${promise}, reason: ${reason}${colors.reset}`);
  process.exit(1);
});

// Run the test suite
main().catch(error => {
  log(`${colors.red}💥 Test suite failed: ${error.message}${colors.reset}`);
  process.exit(1);
});