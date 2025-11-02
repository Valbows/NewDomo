#!/usr/bin/env node

/**
 * Basic linting fixes - only handle safe, non-destructive changes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Starting basic linting fixes...\n');

// 1. Fix the ESLint configuration issue first
console.log('📝 Updating package.json to fix ESLint module type warning...');

try {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Add type: module to fix the ESLint warning
  if (!packageJson.type) {
    packageJson.type = 'module';
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log('✅ Added "type": "module" to package.json');
  }
} catch (error) {
  console.log('⚠️  Could not update package.json:', error.message);
}

// 2. Run ESLint with --fix to automatically fix what it can
console.log('\n🔍 Running ESLint with --fix to automatically fix issues...');

try {
  execSync('npx eslint src/ --ext .ts,.tsx,.js,.jsx --fix --quiet', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  console.log('✅ ESLint auto-fix completed');
} catch (error) {
  console.log('⚠️  ESLint auto-fix completed with some remaining issues');
}

// 3. Check the results
console.log('\n📊 Checking remaining issues...');

try {
  execSync('npx eslint src/ --ext .ts,.tsx,.js,.jsx --format=compact', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  console.log('\n✅ All linting issues resolved!');
} catch (error) {
  console.log('\n⚠️  Some linting issues remain. These may need manual fixes.');
  console.log('💡 Focus on fixing critical errors first, then warnings.');
}

console.log('\n🎯 Basic linting fixes completed!');