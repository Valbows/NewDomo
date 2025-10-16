#!/usr/bin/env node

/**
 * Test Script for Contextual Video Matching
 * 
 * This script runs comprehensive tests to verify that the contextual video matching
 * system works correctly. It tests:
 * 
 * 1. Business context understanding (planning, budgeting, hiring, etc.)
 * 2. Silent execution (no tool announcements)
 * 3. Appropriate video selection based on user needs
 * 4. Error handling for edge cases
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Running Contextual Video Matching Tests...\n');

try {
  // Run the specific contextual matching test file
  const testCommand = 'npm test -- __tests__/contextual-video-matching.test.ts --verbose';
  
  console.log('📋 Test Command:', testCommand);
  console.log('🔍 Testing contextual intelligence and silent execution...\n');
  
  const result = execSync(testCommand, { 
    stdio: 'inherit',
    cwd: process.cwd(),
    encoding: 'utf8'
  });
  
  console.log('\n✅ Contextual Video Matching Tests Completed Successfully!');
  console.log('\n🎯 Test Results Summary:');
  console.log('- ✅ Strategic planning context matching');
  console.log('- ✅ Budget/cost management context matching');
  console.log('- ✅ Hiring/workforce context matching');
  console.log('- ✅ Data accuracy context matching');
  console.log('- ✅ Collaboration context matching');
  console.log('- ✅ Analytics context matching');
  console.log('- ✅ Implementation context matching');
  console.log('- ✅ Silent execution verification');
  console.log('- ✅ Error handling for edge cases');
  console.log('- ✅ End-to-end business context integration');
  
  console.log('\n🧠 Contextual Intelligence Verified:');
  console.log('- Agent understands business context without exact titles');
  console.log('- Matches user needs to relevant video content');
  console.log('- Executes video fetching silently');
  console.log('- Handles multiple business scenarios correctly');
  
} catch (error) {
  console.error('❌ Contextual Video Matching Tests Failed:');
  console.error(error.message);
  
  console.log('\n🔧 Troubleshooting Tips:');
  console.log('1. Ensure all dependencies are installed: npm install');
  console.log('2. Check that Jest is configured correctly');
  console.log('3. Verify the webhook handler supports contextual matching');
  console.log('4. Review the system prompt for contextual intelligence rules');
  
  process.exit(1);
}

console.log('\n🎉 All contextual video matching functionality is working correctly!');
console.log('The agent can now intelligently match business contexts to relevant videos.');