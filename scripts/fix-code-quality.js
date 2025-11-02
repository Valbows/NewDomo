#!/usr/bin/env node

/**
 * Code Quality Fix Script
 * Fixes common code quality issues found by ESLint
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Starting code quality fixes...');

// Function to recursively find all TypeScript/JavaScript files
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

// Function to remove unused imports
function removeUnusedImports(content) {
  const lines = content.split('\n');
  const usedImports = new Set();
  const importLines = [];
  
  // Find all import statements and what they import
  lines.forEach((line, index) => {
    const importMatch = line.match(/^import\s+(?:{([^}]+)}|\*\s+as\s+(\w+)|(\w+))\s+from\s+['"]([^'"]+)['"]/);
    if (importMatch) {
      importLines.push({ line, index, match: importMatch });
    }
  });
  
  // Find usage of imported items in the rest of the file
  const codeContent = lines.join('\n');
  
  importLines.forEach(({ line, index, match }) => {
    let shouldKeep = false;
    
    if (match[1]) { // Named imports
      const namedImports = match[1].split(',').map(s => s.trim());
      const usedNamedImports = namedImports.filter(imp => {
        const cleanImp = imp.replace(/\s+as\s+\w+/, '').trim();
        return codeContent.includes(cleanImp) && 
               codeContent.split('\n').slice(index + 1).some(l => l.includes(cleanImp));
      });
      
      if (usedNamedImports.length > 0) {
        shouldKeep = true;
        lines[index] = line.replace(match[1], usedNamedImports.join(', '));
      }
    } else if (match[2]) { // Namespace import
      const namespace = match[2];
      shouldKeep = codeContent.split('\n').slice(index + 1).some(l => l.includes(namespace));
    } else if (match[3]) { // Default import
      const defaultImport = match[3];
      shouldKeep = codeContent.split('\n').slice(index + 1).some(l => l.includes(defaultImport));
    }
    
    if (!shouldKeep) {
      lines[index] = ''; // Remove the import line
    }
  });
  
  // Remove empty lines that were import statements
  return lines.filter((line, index) => {
    if (line === '' && index > 0 && lines[index - 1] === '') {
      return false; // Remove consecutive empty lines
    }
    return true;
  }).join('\n');
}

// Function to remove console.log statements (but keep console.error, console.warn)
function removeConsoleStatements(content) {
  return content.replace(/^\s*console\.log\([^)]*\);\s*$/gm, '');
}

// Function to fix React unescaped entities
function fixUnescapedEntities(content) {
  return content
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Function to remove unused variables (simple cases)
function removeUnusedVariables(content) {
  const lines = content.split('\n');
  const variableDeclarations = [];
  
  lines.forEach((line, index) => {
    // Find variable declarations
    const varMatch = line.match(/^\s*(?:const|let|var)\s+(\w+)\s*=/);
    if (varMatch) {
      const varName = varMatch[1];
      const restOfFile = lines.slice(index + 1).join('\n');
      
      // Check if variable is used later
      if (!restOfFile.includes(varName)) {
        lines[index] = ''; // Remove unused variable
      }
    }
  });
  
  return lines.join('\n');
}

// Main processing function
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Apply fixes
    content = removeConsoleStatements(content);
    content = removeUnusedImports(content);
    content = removeUnusedVariables(content);
    
    // Only write if content changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
function main() {
  const srcDir = path.join(process.cwd(), 'src');
  const files = findFiles(srcDir);
  
  console.log(`📁 Found ${files.length} files to process`);
  
  let fixedCount = 0;
  
  files.forEach(file => {
    if (processFile(file)) {
      fixedCount++;
    }
  });
  
  console.log(`\n🎉 Code quality fixes complete!`);
  console.log(`📊 Fixed ${fixedCount} out of ${files.length} files`);
  
  // Run ESLint again to see remaining issues
  console.log('\n🔍 Running ESLint to check remaining issues...');
  try {
    execSync('npm run lint', { stdio: 'inherit' });
  } catch (error) {
    console.log('⚠️  Some linting issues remain - these may need manual review');
  }
}

if (require.main === module) {
  main();
}

module.exports = { processFile, removeConsoleStatements, removeUnusedImports };