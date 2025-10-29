#!/usr/bin/env node

/**
 * Component Structure Validation Script
 * 
 * Validates that all components follow the co-location and atomic design patterns.
 */

const fs = require('fs');
const path = require('path');

const COMPONENT_DIRS = [
  'src/components/ui',
  'src/components/layout',
  'src/components/features'
];

const REQUIRED_FILES = {
  atom: ['index.tsx'],
  molecule: ['index.tsx'],
  organism: ['index.tsx'],
  template: ['index.tsx']
};

const RECOMMENDED_FILES = {
  atom: ['index.tsx', '*.module.css', '*.test.tsx'],
  molecule: ['index.tsx', '*.module.css', '*.test.tsx'],
  organism: ['index.tsx', '*.module.css', '*.test.tsx', 'types.ts', 'utils.ts'],
  template: ['index.tsx', '*.module.css', '*.test.tsx', 'types.ts']
};

function scanDirectory(dir, results = []) {
  if (!fs.existsSync(dir)) {
    return results;
  }

  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      // Check if this is a component directory (contains index.tsx)
      const indexPath = path.join(itemPath, 'index.tsx');
      if (fs.existsSync(indexPath)) {
        results.push({
          name: item,
          path: itemPath,
          type: determineComponentType(dir),
          files: fs.readdirSync(itemPath)
        });
      } else {
        // Recursively scan subdirectories
        scanDirectory(itemPath, results);
      }
    }
  }
  
  return results;
}

function determineComponentType(dir) {
  if (dir.includes('ui')) return 'atom'; // or molecule, but we'll treat UI as atoms for simplicity
  if (dir.includes('layout')) return 'template';
  if (dir.includes('features')) return 'organism';
  return 'unknown';
}

function validateComponent(component) {
  const issues = [];
  const { name, path: componentPath, type, files } = component;
  
  // Check required files
  const required = REQUIRED_FILES[type] || [];
  for (const requiredFile of required) {
    if (!files.includes(requiredFile)) {
      issues.push(`Missing required file: ${requiredFile}`);
    }
  }
  
  // Check recommended files
  const recommended = RECOMMENDED_FILES[type] || [];
  for (const recommendedPattern of recommended) {
    if (recommendedPattern.includes('*')) {
      const pattern = recommendedPattern.replace('*', name);
      if (!files.some(file => file.match(pattern.replace('.', '\\.')))) {
        issues.push(`Missing recommended file: ${pattern}`);
      }
    } else if (!files.includes(recommendedPattern)) {
      issues.push(`Missing recommended file: ${recommendedPattern}`);
    }
  }
  
  // Check for index.ts barrel export in parent directory
  const parentDir = path.dirname(componentPath);
  const parentIndexPath = path.join(parentDir, 'index.ts');
  if (fs.existsSync(parentIndexPath)) {
    const indexContent = fs.readFileSync(parentIndexPath, 'utf8');
    if (!indexContent.includes(name)) {
      issues.push(`Component not exported in parent index.ts`);
    }
  } else {
    issues.push(`Parent directory missing index.ts barrel export`);
  }
  
  // Check component naming convention
  if (!/^[A-Z][a-zA-Z0-9]*$/.test(name)) {
    issues.push(`Component name should be PascalCase: ${name}`);
  }
  
  return issues;
}

function generateReport(components) {
  console.log('🔍 Component Structure Validation Report\n');
  
  let totalComponents = 0;
  let componentsWithIssues = 0;
  let totalIssues = 0;
  
  const componentsByType = {
    atom: [],
    molecule: [],
    organism: [],
    template: [],
    unknown: []
  };
  
  // Categorize components
  for (const component of components) {
    componentsByType[component.type].push(component);
    totalComponents++;
  }
  
  // Validate each component
  for (const [type, typeComponents] of Object.entries(componentsByType)) {
    if (typeComponents.length === 0) continue;
    
    console.log(`\n📦 ${type.toUpperCase()} COMPONENTS (${typeComponents.length})`);
    console.log('─'.repeat(50));
    
    for (const component of typeComponents) {
      const issues = validateComponent(component);
      
      if (issues.length === 0) {
        console.log(`✅ ${component.name}`);
      } else {
        console.log(`❌ ${component.name}`);
        componentsWithIssues++;
        totalIssues += issues.length;
        
        for (const issue of issues) {
          console.log(`   • ${issue}`);
        }
      }
    }
  }
  
  // Summary
  console.log('\n📊 SUMMARY');
  console.log('─'.repeat(50));
  console.log(`Total Components: ${totalComponents}`);
  console.log(`Components with Issues: ${componentsWithIssues}`);
  console.log(`Total Issues: ${totalIssues}`);
  console.log(`Compliance Rate: ${Math.round(((totalComponents - componentsWithIssues) / totalComponents) * 100)}%`);
  
  // Recommendations
  if (totalIssues > 0) {
    console.log('\n💡 RECOMMENDATIONS');
    console.log('─'.repeat(50));
    console.log('1. Use the component generator script for new components:');
    console.log('   node scripts/generate-component.js ComponentName --type=atom');
    console.log('2. Add missing files to existing components');
    console.log('3. Update parent index.ts files to export components');
    console.log('4. Follow PascalCase naming convention');
    console.log('5. Co-locate related files (styles, tests, types)');
  }
  
  return {
    totalComponents,
    componentsWithIssues,
    totalIssues,
    complianceRate: Math.round(((totalComponents - componentsWithIssues) / totalComponents) * 100)
  };
}

// Main execution
console.log('🚀 Starting component structure validation...\n');

let allComponents = [];

for (const dir of COMPONENT_DIRS) {
  console.log(`Scanning ${dir}...`);
  const components = scanDirectory(dir);
  allComponents = allComponents.concat(components);
}

console.log(`\nFound ${allComponents.length} components\n`);

const report = generateReport(allComponents);

// Exit with error code if there are issues
if (report.totalIssues > 0) {
  console.log('\n❌ Validation failed. Please fix the issues above.');
  process.exit(1);
} else {
  console.log('\n✅ All components follow the expected structure!');
  process.exit(0);
}