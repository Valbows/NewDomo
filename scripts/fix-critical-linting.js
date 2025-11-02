#!/usr/bin/env node

/**
 * Script to fix critical linting issues that prevent builds
 * Focus on syntax errors and critical warnings only
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const SRC_DIR = path.join(__dirname, '..', 'src');
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

/**
 * Get all files with specified extensions recursively
 */
function getAllFiles(dir, extensions) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        traverse(fullPath);
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

/**
 * Fix React unescaped entities (critical for build)
 */
function fixUnescapedEntities(content) {
  // Fix unescaped quotes in JSX
  content = content.replace(/(\w+)="([^"]*)"([^"]*)"([^"]*)"/g, (match, attr, p1, p2, p3) => {
    // Only fix if it's clearly a JSX attribute with unescaped quotes inside
    if (p2.includes(' ') || p3.includes(' ')) {
      return `${attr}="${p1}&quot;${p2}&quot;${p3}"`;
    }
    return match;
  });
  
  // Fix unescaped apostrophes in JSX text
  content = content.replace(/>([^<]*)'([^<]*)</g, (match, before, after) => {
    return `>${before}&apos;${after}<`;
  });
  
  return content;
}

/**
 * Comment out console statements in production code (non-critical)
 */
function handleConsoleStatements(content, filePath) {
  // Skip test files, scripts, and development utilities
  if (filePath.includes('__tests__') || 
      filePath.includes('scripts/') || 
      filePath.includes('examples/') ||
      filePath.includes('.test.') ||
      filePath.includes('.spec.')) {
    return content;
  }
  
  // Only comment out obvious debug console statements
  const lines = content.split('\n');
  const fixedLines = lines.map(line => {
    // Only comment out standalone console statements that look like debug logs
    if (line.trim().match(/^console\.(log|warn|error)\(/)) {
      return line.replace(/^(\s*)console\./, '$1// console.');
    }
    return line;
  });
  
  return fixedLines.join('\n');
}

/**
 * Fix unused variables by prefixing with underscore (simple cases only)
 */
function fixSimpleUnusedVars(content) {
  // Fix unused parameters in arrow functions and regular functions
  content = content.replace(/\(([^)]+)\)\s*=>/g, (match, params) => {
    // Simple case: single unused parameter
    if (params.includes(',')) return match; // Skip complex cases
    if (params.trim().match(/^\w+$/)) {
      return `(_${params.trim()}) =>`;
    }
    return match;
  });
  
  return content;
}

/**
 * Process a single file
 */
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Apply only safe fixes
    content = fixUnescapedEntities(content);
    content = handleConsoleStatements(content, filePath);
    // Skip unused vars fix for now as it's more complex
    
    // Only write if content changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed: ${path.relative(process.cwd(), filePath)}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🔧 Starting critical linting fixes...\n');
  
  const files = getAllFiles(SRC_DIR, EXTENSIONS);
  console.log(`Found ${files.length} files to process\n`);
  
  let fixedCount = 0;
  
  for (const file of files) {
    if (processFile(file)) {
      fixedCount++;
    }
  }
  
  console.log(`\n✅ Processed ${files.length} files, fixed ${fixedCount} files`);
  
  // Run ESLint to check remaining critical issues
  console.log('\n🔍 Running ESLint to check remaining critical issues...');
  try {
    execSync('npx eslint src/ --ext .ts,.tsx,.js,.jsx --quiet', { stdio: 'inherit' });
    console.log('✅ No critical errors found!');
  } catch (error) {
    console.log('\n⚠️  Some critical issues remain - manual fixes may be needed');
  }
}

if (require.main === module) {
  main();
}

module.exports = { processFile, fixUnescapedEntities, handleConsoleStatements };