#!/usr/bin/env node

/**
 * Code Best Practices Review Script
 * Reviews code for common best practices and patterns
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Starting code best practices review...');

// Best practices rules
const BEST_PRACTICES = {
  // TypeScript specific
  typescript: {
    'explicit-return-types': {
      pattern: /function\s+\w+\([^)]*\)\s*{/g,
      message: 'Consider adding explicit return types to functions',
      severity: 'warning'
    },
    'interface-over-type': {
      pattern: /type\s+\w+\s*=\s*{/g,
      message: 'Consider using interface instead of type for object definitions',
      severity: 'info'
    }
  },
  
  // React specific
  react: {
    'missing-key-prop': {
      pattern: /\.map\([^}]*=>\s*<[^>]*(?!.*key=)/g,
      message: 'Missing key prop in mapped JSX elements',
      severity: 'error'
    },
    'inline-styles': {
      pattern: /style={{[^}]*}}/g,
      message: 'Consider using CSS classes instead of inline styles',
      severity: 'warning'
    },
    'missing-display-name': {
      pattern: /const\s+\w+\s*=\s*React\.memo\(/g,
      message: 'Consider adding displayName to memoized components',
      severity: 'info'
    }
  },
  
  // General JavaScript/TypeScript
  general: {
    'magic-numbers': {
      pattern: /(?<![.\w])[0-9]{2,}(?![.\w])/g,
      message: 'Consider extracting magic numbers to named constants',
      severity: 'warning'
    },
    'long-parameter-list': {
      pattern: /function\s+\w+\([^)]{50,}\)/g,
      message: 'Function has too many parameters, consider using an options object',
      severity: 'warning'
    },
    'nested-ternary': {
      pattern: /\?[^:]*\?[^:]*:/g,
      message: 'Nested ternary operators reduce readability',
      severity: 'warning'
    }
  },
  
  // Security
  security: {
    'eval-usage': {
      pattern: /\beval\s*\(/g,
      message: 'Avoid using eval() - security risk',
      severity: 'error'
    },
    'innerHTML-usage': {
      pattern: /\.innerHTML\s*=/g,
      message: 'Consider using textContent or safer DOM methods',
      severity: 'warning'
    }
  },
  
  // Performance
  performance: {
    'inefficient-array-methods': {
      pattern: /\.forEach\([^}]*\.push\(/g,
      message: 'Consider using map() instead of forEach with push',
      severity: 'info'
    },
    'unnecessary-bind': {
      pattern: /\.bind\(this\)/g,
      message: 'Consider using arrow functions instead of bind',
      severity: 'info'
    }
  }
};

// Function to analyze a file
function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    const lines = content.split('\n');
    
    // Check each category of best practices
    Object.entries(BEST_PRACTICES).forEach(([category, rules]) => {
      Object.entries(rules).forEach(([ruleName, rule]) => {
        const matches = content.match(rule.pattern);
        if (matches) {
          // Find line numbers for each match
          matches.forEach(match => {
            const lineIndex = content.indexOf(match);
            const lineNumber = content.substring(0, lineIndex).split('\n').length;
            
            issues.push({
              file: filePath,
              line: lineNumber,
              category,
              rule: ruleName,
              message: rule.message,
              severity: rule.severity,
              match: match.substring(0, 50) + (match.length > 50 ? '...' : '')
            });
          });
        }
      });
    });
    
    return issues;
  } catch (error) {
    console.error(`❌ Error analyzing ${filePath}:`, error.message);
    return [];
  }
}

// Function to find all TypeScript/JavaScript files
function findFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules, .git, .next, etc.
        if (!['node_modules', '.git', '.next', 'dist', 'build', '.swc'].includes(item)) {
          traverse(fullPath);
        }
      } else if (extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

// Function to generate report
function generateReport(allIssues) {
  const report = {
    summary: {
      totalFiles: new Set(allIssues.map(i => i.file)).size,
      totalIssues: allIssues.length,
      bySeverity: {
        error: allIssues.filter(i => i.severity === 'error').length,
        warning: allIssues.filter(i => i.severity === 'warning').length,
        info: allIssues.filter(i => i.severity === 'info').length
      },
      byCategory: {}
    },
    issues: allIssues
  };
  
  // Group by category
  allIssues.forEach(issue => {
    if (!report.summary.byCategory[issue.category]) {
      report.summary.byCategory[issue.category] = 0;
    }
    report.summary.byCategory[issue.category]++;
  });
  
  return report;
}

// Function to display report
function displayReport(report) {
  console.log('\n📊 Code Best Practices Review Report');
  console.log('=====================================');
  
  console.log(`\n📁 Files analyzed: ${report.summary.totalFiles}`);
  console.log(`🔍 Total issues found: ${report.summary.totalIssues}`);
  
  console.log('\n📈 Issues by severity:');
  console.log(`  ❌ Errors: ${report.summary.bySeverity.error}`);
  console.log(`  ⚠️  Warnings: ${report.summary.bySeverity.warning}`);
  console.log(`  ℹ️  Info: ${report.summary.bySeverity.info}`);
  
  console.log('\n📂 Issues by category:');
  Object.entries(report.summary.byCategory).forEach(([category, count]) => {
    console.log(`  ${category}: ${count}`);
  });
  
  if (report.issues.length > 0) {
    console.log('\n🔍 Top 20 Issues:');
    console.log('==================');
    
    report.issues
      .sort((a, b) => {
        const severityOrder = { error: 3, warning: 2, info: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      })
      .slice(0, 20)
      .forEach((issue, index) => {
        const severityIcon = issue.severity === 'error' ? '❌' : 
                           issue.severity === 'warning' ? '⚠️' : 'ℹ️';
        
        console.log(`\n${index + 1}. ${severityIcon} ${issue.message}`);
        console.log(`   📁 ${path.relative(process.cwd(), issue.file)}:${issue.line}`);
        console.log(`   📝 ${issue.match}`);
        console.log(`   🏷️  ${issue.category}/${issue.rule}`);
      });
  }
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  console.log('===================');
  
  if (report.summary.bySeverity.error > 0) {
    console.log('🔴 High Priority: Fix error-level issues first (security and critical bugs)');
  }
  
  if (report.summary.bySeverity.warning > 10) {
    console.log('🟡 Medium Priority: Address warning-level issues to improve code quality');
  }
  
  if (report.summary.byCategory.typescript > 5) {
    console.log('📘 TypeScript: Consider improving type safety and explicit typing');
  }
  
  if (report.summary.byCategory.react > 5) {
    console.log('⚛️  React: Review React best practices and component patterns');
  }
  
  if (report.summary.byCategory.performance > 3) {
    console.log('⚡ Performance: Consider optimizing performance-related issues');
  }
}

// Main execution
function main() {
  const srcDir = path.join(process.cwd(), 'src');
  const files = findFiles(srcDir);
  
  console.log(`📁 Analyzing ${files.length} files...`);
  
  const allIssues = [];
  
  files.forEach(file => {
    const issues = analyzeFile(file);
    allIssues.push(...issues);
  });
  
  const report = generateReport(allIssues);
  displayReport(report);
  
  // Save detailed report to file
  const reportPath = path.join(process.cwd(), 'code-quality-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n💾 Detailed report saved to: ${reportPath}`);
  
  return report.summary.bySeverity.error === 0 ? 0 : 1;
}

if (require.main === module) {
  const exitCode = main();
  process.exit(exitCode);
}

module.exports = { analyzeFile, generateReport, BEST_PRACTICES };