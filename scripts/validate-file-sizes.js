#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Validate that refactored files are within the 300-600 line target
 */
function validateFileSizes() {
  console.log('🔍 Validating refactored file sizes...\n');

  // Files that should have been refactored based on the task list
  const refactoredFiles = [
    // Component files that were refactored
    'src/app/demos/[demoId]/experience/page.tsx',
    'src/app/demos/[demoId]/configure/page.tsx',
    
    // Service files that were refactored
    'src/lib/services/demos/demo-service.ts',
    'src/lib/services/demos/demo-configuration-service.ts',
    'src/lib/services/demos/demo-lifecycle-service.ts',
    'src/lib/services/tavus/analytics-service.ts',
    'src/lib/services/tavus/metrics-collection-service.ts',
    'src/lib/services/tavus/reporting-service.ts',
    'src/lib/services/tavus/media-service.ts',
    'src/lib/services/tavus/video-processing-service.ts',
    'src/lib/services/tavus/media-validation-service.ts',
    'src/lib/services/tavus/integration-service.ts',
    'src/lib/services/tavus/api-integration-service.ts',
    'src/lib/services/tavus/sync-service.ts',
  ];

  // Files that still need refactoring
  const pendingRefactorFiles = [
    'src/app/demos/[demoId]/configure/components/Reporting.tsx',
    'src/lib/services/demos/agent-service.ts',
    'src/lib/tools/toolParser.ts',
  ];

  const results = {
    compliant: [],
    oversized: [],
    undersized: [],
    missing: [],
    pending: []
  };

  // Check refactored files
  refactoredFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const lineCount = content.split('\n').length;
      
      if (lineCount >= 300 && lineCount <= 600) {
        results.compliant.push({ path: filePath, lines: lineCount });
      } else if (lineCount > 600) {
        results.oversized.push({ path: filePath, lines: lineCount });
      } else {
        results.undersized.push({ path: filePath, lines: lineCount });
      }
    } else {
      results.missing.push(filePath);
    }
  });

  // Check pending files that still need refactoring
  pendingRefactorFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const lineCount = content.split('\n').length;
      results.pending.push({ path: filePath, lines: lineCount });
    }
  });

  // Report results
  console.log('✅ COMPLIANT FILES (300-600 lines):');
  if (results.compliant.length === 0) {
    console.log('   No files found in compliant range');
  } else {
    results.compliant.forEach(file => {
      console.log(`   ${file.path} (${file.lines} lines)`);
    });
  }

  console.log('\n❌ OVERSIZED FILES (over 600 lines):');
  if (results.oversized.length === 0) {
    console.log('   No oversized files found');
  } else {
    results.oversized.forEach(file => {
      console.log(`   ${file.path} (${file.lines} lines)`);
    });
  }

  console.log('\n📝 UNDERSIZED FILES (under 300 lines - acceptable):');
  if (results.undersized.length === 0) {
    console.log('   No undersized files found');
  } else {
    results.undersized.forEach(file => {
      console.log(`   ${file.path} (${file.lines} lines)`);
    });
  }

  console.log('\n⚠️  MISSING FILES (expected but not found):');
  if (results.missing.length === 0) {
    console.log('   No missing files');
  } else {
    results.missing.forEach(filePath => {
      console.log(`   ${filePath}`);
    });
  }

  console.log('\n🔄 PENDING REFACTOR (still need to be broken down):');
  if (results.pending.length === 0) {
    console.log('   No pending files');
  } else {
    results.pending.forEach(file => {
      console.log(`   ${file.path} (${file.lines} lines)`);
    });
  }

  console.log('\n📊 SUMMARY:');
  console.log(`   Compliant files (300-600 lines): ${results.compliant.length}`);
  console.log(`   Oversized files (>600 lines): ${results.oversized.length}`);
  console.log(`   Undersized files (<300 lines): ${results.undersized.length}`);
  console.log(`   Missing files: ${results.missing.length}`);
  console.log(`   Pending refactor: ${results.pending.length}`);

  return results;
}

if (require.main === module) {
  validateFileSizes();
}

module.exports = { validateFileSizes };