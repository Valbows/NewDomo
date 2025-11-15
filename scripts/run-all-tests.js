#!/usr/bin/env node

/**
 * Unified Test Runner
 * Runs both Jest (unit/integration) and Playwright (e2e) tests
 */

const { spawn } = require('child_process');
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

function runCommand(command, args, description) {
  return new Promise((resolve, reject) => {
    log(`\n${colors.cyan}🚀 ${description}${colors.reset}`);
    log(`${colors.yellow}Running: ${command} ${args.join(' ')}${colors.reset}\n`);

    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      cwd: process.cwd(),
    });

    child.on('close', (code) => {
      if (code === 0) {
        log(`\n${colors.green}✅ ${description} completed successfully${colors.reset}`);
        resolve(code);
      } else {
        log(`\n${colors.red}❌ ${description} failed with exit code ${code}${colors.reset}`);
        reject(new Error(`${description} failed`));
      }
    });

    child.on('error', (error) => {
      log(`\n${colors.red}❌ Error running ${description}: ${error.message}${colors.reset}`);
      reject(error);
    });
  });
}

async function runAllTests() {
  const startTime = Date.now();
  
  log(`${colors.bright}${colors.magenta}🧪 COMPREHENSIVE TEST SUITE RUNNER${colors.reset}`);
  log(`${colors.bright}Running Jest (Unit/Integration) + Playwright (E2E) Tests${colors.reset}\n`);

  const results = {
    jest: { success: false, duration: 0 },
    playwright: { success: false, duration: 0 },
  };

  try {
    // Run Jest tests (unit + integration)
    const jestStart = Date.now();
    await runCommand('npm', ['run', 'test'], 'Jest Tests (Unit + Integration)');
    results.jest.success = true;
    results.jest.duration = Date.now() - jestStart;

    // Run Playwright tests (e2e)
    const playwrightStart = Date.now();
    await runCommand('npm', ['run', 'test:e2e'], 'Playwright Tests (E2E)');
    results.playwright.success = true;
    results.playwright.duration = Date.now() - playwrightStart;

    // Success summary
    const totalDuration = Date.now() - startTime;
    log(`\n${colors.bright}${colors.green}🎉 ALL TESTS PASSED!${colors.reset}`);
    log(`${colors.green}✅ Jest: ${(results.jest.duration / 1000).toFixed(1)}s${colors.reset}`);
    log(`${colors.green}✅ Playwright: ${(results.playwright.duration / 1000).toFixed(1)}s${colors.reset}`);
    log(`${colors.bright}${colors.green}Total Duration: ${(totalDuration / 1000).toFixed(1)}s${colors.reset}\n`);

  } catch (error) {
    // Failure summary
    const totalDuration = Date.now() - startTime;
    log(`\n${colors.bright}${colors.red}❌ TEST SUITE FAILED${colors.reset}`);
    log(`${colors.red}Jest: ${results.jest.success ? '✅' : '❌'} ${(results.jest.duration / 1000).toFixed(1)}s${colors.reset}`);
    log(`${colors.red}Playwright: ${results.playwright.success ? '✅' : '❌'} ${(results.playwright.duration / 1000).toFixed(1)}s${colors.reset}`);
    log(`${colors.bright}${colors.red}Total Duration: ${(totalDuration / 1000).toFixed(1)}s${colors.reset}`);
    log(`${colors.red}Error: ${error.message}${colors.reset}\n`);
    
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  log(`${colors.bright}Unified Test Runner${colors.reset}`);
  log('Runs both Jest and Playwright tests in sequence\n');
  log('Usage:');
  log('  npm run test:all     # Run all tests');
  log('  npm run test         # Run Jest only');
  log('  npm run test:e2e     # Run Playwright only');
  log('  npm run test:watch   # Run Jest in watch mode');
  process.exit(0);
}

// Run the tests
runAllTests().catch((error) => {
  log(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});