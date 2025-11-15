#!/usr/bin/env node

/**
 * Duplicate Detection Script
 * Helps prevent duplicate component creation by searching for existing implementations
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const componentName = process.argv[2];

if (!componentName) {
  console.log('Usage: npm run check:duplicates ComponentName');
  console.log('Example: npm run check:duplicates DemoList');
  process.exit(1);
}

console.log(`🔍 Checking for duplicates of: ${componentName}\n`);

// Search patterns
const searchPatterns = [
  componentName,
  componentName.toLowerCase(),
  componentName.replace(/([A-Z])/g, '-$1').toLowerCase().substring(1), // kebab-case
  componentName.replace(/([A-Z])/g, '_$1').toLowerCase().substring(1), // snake_case
];

console.log('📁 Searching file system...');
searchPatterns.forEach(pattern => {
  try {
    const result = execSync(`find src/ -name "*${pattern}*" -type f 2>/dev/null || true`, { encoding: 'utf8' });
    if (result.trim()) {
      console.log(`  Pattern "${pattern}":`, result.trim().split('\n'));
    }
  } catch (error) {
    // Ignore errors
  }
});

console.log('\n🎯 Checking features directory specifically...');
try {
  const result = execSync(`find src/components/features/ -name "*${componentName}*" 2>/dev/null || true`, { encoding: 'utf8' });
  if (result.trim()) {
    console.log('  ✅ Features implementations found:');
    result.trim().split('\n').forEach(file => {
      console.log(`    - ${file}`);
    });
  } else {
    console.log('  ❌ No features implementations found');
  }
} catch (error) {
  console.log('  ❌ Error searching features directory');
}

console.log('\n📦 Checking imports in codebase...');
try {
  const result = execSync(`grep -r "import.*${componentName}" src/ 2>/dev/null || true`, { encoding: 'utf8' });
  if (result.trim()) {
    console.log('  Import statements found:');
    result.trim().split('\n').slice(0, 5).forEach(line => {
      console.log(`    ${line}`);
    });
    if (result.trim().split('\n').length > 5) {
      console.log(`    ... and ${result.trim().split('\n').length - 5} more`);
    }
  } else {
    console.log('  ❌ No import statements found');
  }
} catch (error) {
  console.log('  ❌ Error searching imports');
}

console.log('\n🧪 Checking test files...');
try {
  const result = execSync(`grep -r "${componentName}" __tests__/ 2>/dev/null || true`, { encoding: 'utf8' });
  if (result.trim()) {
    console.log('  Test references found:');
    result.trim().split('\n').slice(0, 3).forEach(line => {
      console.log(`    ${line.substring(0, 80)}...`);
    });
    if (result.trim().split('\n').length > 3) {
      console.log(`    ... and ${result.trim().split('\n').length - 3} more`);
    }
  } else {
    console.log('  ❌ No test references found');
  }
} catch (error) {
  console.log('  ❌ Error searching tests');
}

console.log('\n📋 RECOMMENDATION:');
console.log('Before creating a new component:');
console.log('1. ✅ Check if features version exists (preferred)');
console.log('2. ✅ Verify no similar functionality exists');
console.log('3. ✅ Choose correct domain-driven location');
console.log('4. ✅ Update test imports to match chosen location');
console.log('5. ✅ Follow architecture compliance guidelines');

console.log('\n🎯 Next steps:');
console.log('- If features version exists: Use it and update imports');
console.log('- If no duplicates found: Safe to create new component');
console.log('- If similar functionality exists: Consider extending existing component');