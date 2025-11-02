#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Validates the large file refactoring by checking file sizes and structure
 */
function validateRefactoring() {
  console.log('🔍 Validating Large File Refactoring...\n');

  // Files that were specifically refactored according to the tasks
  const refactoredFiles = [
    // Reporting.tsx refactoring (Task 4.2.1)
    'src/app/demos/[demoId]/configure/components/Reporting.tsx',
    'src/app/demos/[demoId]/configure/components/ReportingCharts.tsx',
    'src/app/demos/[demoId]/configure/components/ReportingTables.tsx',
    'src/app/demos/[demoId]/configure/components/ReportingFilters.tsx',
    'src/app/demos/[demoId]/configure/components/ReportingSummary.tsx',
    'src/app/demos/[demoId]/configure/components/ReportingUtils.tsx',
    
    // Agent service refactoring (Task 4.3.1)
    'src/lib/services/demos/agent-service.ts',
    'src/lib/services/demos/persona-management-service.ts',
    'src/lib/services/demos/agent-configuration-service.ts',
    'src/lib/services/demos/agent-lifecycle-service.ts',
    
    // Demo service refactoring (Task 4.3.2)
    'src/lib/services/demos/demo-service.ts',
    'src/lib/services/demos/demo-configuration-service.ts',
    'src/lib/services/demos/demo-lifecycle-service.ts',
    
    // Analytics service refactoring (Task 4.3.3)
    'src/lib/services/tavus/analytics-service.ts',
    'src/lib/services/tavus/metrics-collection-service.ts',
    'src/lib/services/tavus/reporting-service.ts',
    
    // ToolParser refactoring (Task 4.4.1)
    'src/lib/tools/toolParser.ts',
    'src/lib/tools/tool-parsing-utils.ts',
    'src/lib/tools/tool-validation-utils.ts',
    'src/lib/tools/tool-transformation-utils.ts',
    
    // Media service refactoring (Task 4.4.2)
    'src/lib/services/tavus/media-service.ts',
    'src/lib/services/tavus/video-processing-service.ts',
    'src/lib/services/tavus/media-validation-service.ts',
    
    // Integration service refactoring (Task 4.4.3)
    'src/lib/services/tavus/integration-service.ts',
    'src/lib/services/tavus/api-integration-service.ts',
    'src/lib/services/tavus/sync-service.ts'
  ];

  // Files that still need refactoring according to tasks
  const remainingLargeFiles = [
    'src/app/demos/[demoId]/experience/page.tsx',
    'src/app/demos/[demoId]/configure/page.tsx',
    'src/components/features/objectives/CustomObjectivesManager.tsx'
  ];

  let validationResults = {
    refactoredFilesValid: 0,
    refactoredFilesInvalid: 0,
    remainingLargeFiles: 0,
    missingFiles: 0,
    errors: []
  };

  console.log('📊 Checking refactored files (target: 300-600 lines):\n');

  // Check refactored files
  refactoredFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const lineCount = content.split('\n').length;
      
      if (lineCount <= 600) {
        console.log(`✅ ${filePath}: ${lineCount} lines (GOOD)`);
        validationResults.refactoredFilesValid++;
      } else {
        console.log(`❌ ${filePath}: ${lineCount} lines (TOO LARGE)`);
        validationResults.refactoredFilesInvalid++;
        validationResults.errors.push(`${filePath} has ${lineCount} lines (exceeds 600 line target)`);
      }
    } else {
      console.log(`⚠️  ${filePath}: FILE NOT FOUND`);
      validationResults.missingFiles++;
      validationResults.errors.push(`${filePath} is missing`);
    }
  });

  console.log('\n📋 Checking remaining large files that still need refactoring:\n');

  // Check remaining large files
  remainingLargeFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const lineCount = content.split('\n').length;
      
      if (lineCount > 400) {
        console.log(`🔄 ${filePath}: ${lineCount} lines (NEEDS REFACTORING)`);
        validationResults.remainingLargeFiles++;
      } else {
        console.log(`✅ ${filePath}: ${lineCount} lines (ALREADY GOOD)`);
      }
    } else {
      console.log(`⚠️  ${filePath}: FILE NOT FOUND`);
      validationResults.missingFiles++;
    }
  });

  // Summary
  console.log('\n📈 VALIDATION SUMMARY:');
  console.log(`✅ Refactored files within target: ${validationResults.refactoredFilesValid}`);
  console.log(`❌ Refactored files exceeding target: ${validationResults.refactoredFilesInvalid}`);
  console.log(`🔄 Large files still needing refactoring: ${validationResults.remainingLargeFiles}`);
  console.log(`⚠️  Missing files: ${validationResults.missingFiles}`);

  if (validationResults.errors.length > 0) {
    console.log('\n🚨 ISSUES FOUND:');
    validationResults.errors.forEach(error => console.log(`   - ${error}`));
  }

  const isValid = validationResults.refactoredFilesInvalid === 0 && validationResults.missingFiles === 0;
  console.log(`\n${isValid ? '🎉' : '❌'} Overall Status: ${isValid ? 'VALIDATION PASSED' : 'VALIDATION FAILED'}`);

  return validationResults;
}

// Run validation
if (require.main === module) {
  validateRefactoring();
}

module.exports = { validateRefactoring };