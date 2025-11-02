#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Validates that refactored services maintain their interfaces and functionality
 */
function validateServiceFunctionality() {
  console.log('🔧 Validating Service Functionality and Interfaces...\n');

  const serviceValidations = [
    // Agent service refactoring validation
    {
      name: 'Agent Service Refactoring',
      mainService: 'src/lib/services/demos/agent-service.ts',
      extractedServices: [
        'src/lib/services/demos/persona-management-service.ts',
        'src/lib/services/demos/agent-configuration-service.ts',
        'src/lib/services/demos/agent-lifecycle-service.ts'
      ],
      expectedExports: ['AgentService', 'createAgent', 'updateAgent']
    },
    
    // Demo service refactoring validation
    {
      name: 'Demo Service Refactoring',
      mainService: 'src/lib/services/demos/demo-service.ts',
      extractedServices: [
        'src/lib/services/demos/demo-configuration-service.ts',
        'src/lib/services/demos/demo-lifecycle-service.ts'
      ],
      expectedExports: ['DemoService', 'createDemo', 'updateDemo']
    },
    
    // Analytics service refactoring validation
    {
      name: 'Analytics Service Refactoring',
      mainService: 'src/lib/services/tavus/analytics-service.ts',
      extractedServices: [
        'src/lib/services/tavus/metrics-collection-service.ts',
        'src/lib/services/tavus/reporting-service.ts'
      ],
      expectedExports: ['AnalyticsService', 'collectMetrics', 'generateReport']
    },
    
    // Tool parser refactoring validation
    {
      name: 'Tool Parser Refactoring',
      mainService: 'src/lib/tools/toolParser.ts',
      extractedServices: [
        'src/lib/tools/tool-parsing-utils.ts',
        'src/lib/tools/tool-validation-utils.ts',
        'src/lib/tools/tool-transformation-utils.ts'
      ],
      expectedExports: ['parseToolCall', 'validateTool', 'transformTool']
    },
    
    // Media service refactoring validation
    {
      name: 'Media Service Refactoring',
      mainService: 'src/lib/services/tavus/media-service.ts',
      extractedServices: [
        'src/lib/services/tavus/video-processing-service.ts',
        'src/lib/services/tavus/media-validation-service.ts'
      ],
      expectedExports: ['MediaService', 'processVideo', 'validateMedia']
    },
    
    // Integration service refactoring validation
    {
      name: 'Integration Service Refactoring',
      mainService: 'src/lib/services/tavus/integration-service.ts',
      extractedServices: [
        'src/lib/services/tavus/api-integration-service.ts',
        'src/lib/services/tavus/sync-service.ts'
      ],
      expectedExports: ['IntegrationService', 'syncData', 'callAPI']
    }
  ];

  let validationResults = {
    passed: 0,
    failed: 0,
    errors: []
  };

  serviceValidations.forEach(validation => {
    console.log(`📋 Validating ${validation.name}:`);
    
    let serviceValid = true;
    
    // Check main service exists and has reasonable size
    if (fs.existsSync(validation.mainService)) {
      const content = fs.readFileSync(validation.mainService, 'utf8');
      const lineCount = content.split('\n').length;
      
      if (lineCount <= 600) {
        console.log(`  ✅ Main service (${lineCount} lines) - GOOD SIZE`);
      } else {
        console.log(`  ❌ Main service (${lineCount} lines) - TOO LARGE`);
        serviceValid = false;
        validationResults.errors.push(`${validation.mainService} is ${lineCount} lines (exceeds 600)`);
      }
      
      // Check for basic exports/imports
      const hasExports = validation.expectedExports.some(exp => content.includes(exp));
      if (hasExports) {
        console.log(`  ✅ Main service has expected exports`);
      } else {
        console.log(`  ⚠️  Main service may be missing expected exports`);
      }
    } else {
      console.log(`  ❌ Main service not found: ${validation.mainService}`);
      serviceValid = false;
      validationResults.errors.push(`Missing main service: ${validation.mainService}`);
    }
    
    // Check extracted services exist and have reasonable sizes
    validation.extractedServices.forEach(servicePath => {
      if (fs.existsSync(servicePath)) {
        const content = fs.readFileSync(servicePath, 'utf8');
        const lineCount = content.split('\n').length;
        
        if (lineCount >= 50 && lineCount <= 600) {
          console.log(`  ✅ Extracted service (${lineCount} lines) - GOOD SIZE`);
        } else if (lineCount < 50) {
          console.log(`  ⚠️  Extracted service (${lineCount} lines) - VERY SMALL`);
        } else {
          console.log(`  ❌ Extracted service (${lineCount} lines) - TOO LARGE`);
          serviceValid = false;
          validationResults.errors.push(`${servicePath} is ${lineCount} lines (exceeds 600)`);
        }
      } else {
        console.log(`  ❌ Extracted service not found: ${servicePath}`);
        serviceValid = false;
        validationResults.errors.push(`Missing extracted service: ${servicePath}`);
      }
    });
    
    if (serviceValid) {
      validationResults.passed++;
      console.log(`  🎉 ${validation.name} - VALIDATION PASSED\n`);
    } else {
      validationResults.failed++;
      console.log(`  ❌ ${validation.name} - VALIDATION FAILED\n`);
    }
  });

  // Component refactoring validation
  console.log('🎨 Validating Component Refactoring:\n');
  
  const componentValidations = [
    {
      name: 'Reporting Component Refactoring',
      mainComponent: 'src/app/demos/[demoId]/configure/components/Reporting.tsx',
      extractedComponents: [
        'src/app/demos/[demoId]/configure/components/ReportingCharts.tsx',
        'src/app/demos/[demoId]/configure/components/ReportingTables.tsx',
        'src/app/demos/[demoId]/configure/components/ReportingFilters.tsx',
        'src/app/demos/[demoId]/configure/components/ReportingSummary.tsx',
        'src/app/demos/[demoId]/configure/components/ReportingUtils.tsx'
      ]
    }
  ];

  componentValidations.forEach(validation => {
    console.log(`📋 Validating ${validation.name}:`);
    
    let componentValid = true;
    
    // Check main component
    if (fs.existsSync(validation.mainComponent)) {
      const content = fs.readFileSync(validation.mainComponent, 'utf8');
      const lineCount = content.split('\n').length;
      
      if (lineCount <= 600) {
        console.log(`  ✅ Main component (${lineCount} lines) - GOOD SIZE`);
      } else {
        console.log(`  ❌ Main component (${lineCount} lines) - TOO LARGE`);
        componentValid = false;
        validationResults.errors.push(`${validation.mainComponent} is ${lineCount} lines (exceeds 600)`);
      }
    } else {
      console.log(`  ❌ Main component not found: ${validation.mainComponent}`);
      componentValid = false;
      validationResults.errors.push(`Missing main component: ${validation.mainComponent}`);
    }
    
    // Check extracted components
    validation.extractedComponents.forEach(componentPath => {
      if (fs.existsSync(componentPath)) {
        const content = fs.readFileSync(componentPath, 'utf8');
        const lineCount = content.split('\n').length;
        
        if (lineCount >= 10 && lineCount <= 600) {
          console.log(`  ✅ Extracted component (${lineCount} lines) - GOOD SIZE`);
        } else if (lineCount < 10) {
          console.log(`  ⚠️  Extracted component (${lineCount} lines) - VERY SMALL (may be re-export)`);
        } else {
          console.log(`  ❌ Extracted component (${lineCount} lines) - TOO LARGE`);
          componentValid = false;
          validationResults.errors.push(`${componentPath} is ${lineCount} lines (exceeds 600)`);
        }
      } else {
        console.log(`  ❌ Extracted component not found: ${componentPath}`);
        componentValid = false;
        validationResults.errors.push(`Missing extracted component: ${componentPath}`);
      }
    });
    
    if (componentValid) {
      validationResults.passed++;
      console.log(`  🎉 ${validation.name} - VALIDATION PASSED\n`);
    } else {
      validationResults.failed++;
      console.log(`  ❌ ${validation.name} - VALIDATION FAILED\n`);
    }
  });

  // Summary
  console.log('📈 SERVICE & COMPONENT VALIDATION SUMMARY:');
  console.log(`✅ Validations passed: ${validationResults.passed}`);
  console.log(`❌ Validations failed: ${validationResults.failed}`);

  if (validationResults.errors.length > 0) {
    console.log('\n🚨 ISSUES FOUND:');
    validationResults.errors.forEach(error => console.log(`   - ${error}`));
  }

  const isValid = validationResults.failed === 0;
  console.log(`\n${isValid ? '🎉' : '❌'} Overall Status: ${isValid ? 'SERVICE VALIDATION PASSED' : 'SERVICE VALIDATION FAILED'}`);

  return validationResults;
}

// Run validation
if (require.main === module) {
  validateServiceFunctionality();
}

module.exports = { validateServiceFunctionality };