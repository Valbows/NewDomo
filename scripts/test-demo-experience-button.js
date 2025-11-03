#!/usr/bin/env node

/**
 * Test runner for Demo Experience Button functionality
 * Runs unit tests, integration tests, and provides E2E test instructions
 */

import { execSync } from 'child_process';
import path from 'path';

console.log('🧪 Demo Experience Button Test Suite');
console.log('=====================================\n');

// Test configuration
const tests = {
  unit: [
    '__tests__/unit/ConfigurationHeader.test.tsx',
    '__tests__/unit/DemoExperiencePage.test.tsx'
  ],
  integration: [
    '__tests__/integration/demo-experience-navigation.integration.test.ts'
  ],
  e2e: [
    '__tests__/e2e/demo-experience-button.spec.ts'
  ]
};

// Helper function to run commands
function runCommand(command, description) {
  console.log(`\n📋 ${description}`);
  console.log(`Command: ${command}`);
  console.log('─'.repeat(50));
  
  try {
    const output = execSync(command, { 
      stdio: 'inherit', 
      cwd: process.cwd(),
      encoding: 'utf8'
    });
    console.log('✅ Success!\n');
    return true;
  } catch (error) {
    console.log(`❌ Failed with exit code: ${error.status}\n`);
    return false;
  }
}

// Main test execution
async function runTests() {
  let totalTests = 0;
  let passedSuites = 0;
  
  console.log('🔧 Running Unit Tests...');
  console.log('========================');
  
  // Run unit tests
  const unitTestCommand = `npm run test:unit -- --testPathPatterns="ConfigurationHeader|DemoExperiencePage"`;
  if (runCommand(unitTestCommand, 'Unit Tests: ConfigurationHeader & DemoExperiencePage')) {
    passedSuites++;
  }
  totalTests++;
  
  console.log('🔗 Running Integration Tests...');
  console.log('===============================');
  
  // Run integration tests
  const integrationTestCommand = `npm run test:integration -- --testPathPatterns="demo-experience-navigation"`;
  if (runCommand(integrationTestCommand, 'Integration Tests: Navigation Flow')) {
    passedSuites++;
  }
  totalTests++;
  
  console.log('🌐 E2E Tests Information');
  console.log('========================');
  console.log('E2E tests require Supabase environment setup.');
  console.log('To run E2E tests manually:');
  console.log('  npx playwright test demo-experience-button.spec.ts --headed');
  console.log('');
  console.log('Prerequisites:');
  console.log('  1. Configure Supabase environment variables in .env.development');
  console.log('  2. Ensure E2E demo data exists in database');
  console.log('  3. Install Playwright: npx playwright install');
  console.log('');
  
  // Summary
  console.log('📊 Test Summary');
  console.log('===============');
  console.log(`Test Suites: ${passedSuites}/${totalTests} passed`);
  
  if (passedSuites === totalTests) {
    console.log('🎉 All automated tests passed!');
    console.log('');
    console.log('✅ Ready for manual testing:');
    console.log('  1. Navigate to a demo configure page');
    console.log('  2. Click "View Demo Experience" button');
    console.log('  3. Verify navigation to experience page');
    console.log('  4. Test accessibility with keyboard navigation');
    console.log('  5. Test on different screen sizes');
  } else {
    console.log('⚠️  Some tests failed. Please review the output above.');
    process.exit(1);
  }
}

// Additional utility functions
function showTestFiles() {
  console.log('📁 Test Files Created:');
  console.log('======================');
  
  console.log('\n🧪 Unit Tests:');
  tests.unit.forEach(file => console.log(`  - ${file}`));
  
  console.log('\n🔗 Integration Tests:');
  tests.integration.forEach(file => console.log(`  - ${file}`));
  
  console.log('\n🌐 E2E Tests:');
  tests.e2e.forEach(file => console.log(`  - ${file}`));
  
  console.log('\n📚 Documentation:');
  console.log('  - __tests__/docs/demo-experience-button-testing-summary.md');
  console.log('  - scripts/test-demo-experience-button.js (this file)');
}

// Command line argument handling
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log('Usage: node scripts/test-demo-experience-button.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --help, -h     Show this help message');
  console.log('  --files        Show list of test files');
  console.log('  --unit         Run only unit tests');
  console.log('  --integration  Run only integration tests');
  console.log('  --e2e          Show E2E test instructions');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/test-demo-experience-button.js');
  console.log('  node scripts/test-demo-experience-button.js --unit');
  console.log('  node scripts/test-demo-experience-button.js --files');
  process.exit(0);
}

if (args.includes('--files')) {
  showTestFiles();
  process.exit(0);
}

if (args.includes('--unit')) {
  console.log('🧪 Running Unit Tests Only...');
  const unitTestCommand = `npm run test:unit -- --testPathPatterns="ConfigurationHeader|DemoExperiencePage"`;
  runCommand(unitTestCommand, 'Unit Tests: ConfigurationHeader & DemoExperiencePage');
  process.exit(0);
}

if (args.includes('--integration')) {
  console.log('🔗 Running Integration Tests Only...');
  const integrationTestCommand = `npm run test:integration -- --testPathPatterns="demo-experience-navigation"`;
  runCommand(integrationTestCommand, 'Integration Tests: Navigation Flow');
  process.exit(0);
}

if (args.includes('--e2e')) {
  console.log('🌐 E2E Test Instructions');
  console.log('========================');
  console.log('To run E2E tests:');
  console.log('  npx playwright test demo-experience-button.spec.ts --headed');
  console.log('');
  console.log('Prerequisites:');
  console.log('  1. Configure Supabase environment variables');
  console.log('  2. Ensure E2E demo data exists');
  console.log('  3. Install Playwright browsers');
  process.exit(0);
}

// Run all tests by default
runTests().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});