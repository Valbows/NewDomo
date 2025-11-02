#!/usr/bin/env node

/**
 * Circular Dependencies Checker
 * Detects circular dependencies in the codebase
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 Checking for circular dependencies...');

// Function to extract imports from a file
function extractImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const imports = [];
    
    // Match various import patterns
    const importPatterns = [
      /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g,
      /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
      /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g
    ];
    
    importPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        imports.push(match[1]);
      }
    });
    
    return imports;
  } catch (error) {
    return [];
  }
}

// Function to resolve import path to actual file path
function resolveImportPath(importPath, fromFile) {
  const fromDir = path.dirname(fromFile);
  
  // Handle relative imports
  if (importPath.startsWith('./') || importPath.startsWith('../')) {
    const resolved = path.resolve(fromDir, importPath);
    
    // Try different extensions
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '/index.jsx'];
    
    for (const ext of extensions) {
      const fullPath = resolved + ext;
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }
    
    // Check if it's a directory with index file
    if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
      for (const indexFile of ['index.ts', 'index.tsx', 'index.js', 'index.jsx']) {
        const indexPath = path.join(resolved, indexFile);
        if (fs.existsSync(indexPath)) {
          return indexPath;
        }
      }
    }
  }
  
  // Handle absolute imports (like @/...)
  if (importPath.startsWith('@/')) {
    const srcPath = importPath.replace('@/', 'src/');
    const resolved = path.resolve(process.cwd(), srcPath);
    
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '/index.jsx'];
    
    for (const ext of extensions) {
      const fullPath = resolved + ext;
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }
    
    // Check if it's a directory with index file
    if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
      for (const indexFile of ['index.ts', 'index.tsx', 'index.js', 'index.jsx']) {
        const indexPath = path.join(resolved, indexFile);
        if (fs.existsSync(indexPath)) {
          return indexPath;
        }
      }
    }
  }
  
  return null;
}

// Function to find all source files
function findSourceFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!['node_modules', '.git', '.next', 'dist', 'build', '.swc'].includes(item)) {
          traverse(fullPath);
        }
      } else if (['.ts', '.tsx', '.js', '.jsx'].some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

// Function to build dependency graph
function buildDependencyGraph(files) {
  const graph = new Map();
  
  files.forEach(file => {
    const imports = extractImports(file);
    const resolvedImports = imports
      .map(imp => resolveImportPath(imp, file))
      .filter(resolved => resolved && files.includes(resolved));
    
    graph.set(file, resolvedImports);
  });
  
  return graph;
}

// Function to detect circular dependencies using DFS
function detectCircularDependencies(graph) {
  const visited = new Set();
  const recursionStack = new Set();
  const cycles = [];
  
  function dfs(node, path = []) {
    if (recursionStack.has(node)) {
      // Found a cycle
      const cycleStart = path.indexOf(node);
      const cycle = path.slice(cycleStart).concat([node]);
      cycles.push(cycle);
      return;
    }
    
    if (visited.has(node)) {
      return;
    }
    
    visited.add(node);
    recursionStack.add(node);
    path.push(node);
    
    const dependencies = graph.get(node) || [];
    dependencies.forEach(dep => {
      dfs(dep, [...path]);
    });
    
    recursionStack.delete(node);
  }
  
  // Check all nodes
  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      dfs(node);
    }
  }
  
  return cycles;
}

// Function to format file path for display
function formatPath(filePath) {
  return path.relative(process.cwd(), filePath);
}

// Function to display results
function displayResults(cycles) {
  console.log('\n📊 Circular Dependencies Analysis');
  console.log('==================================');
  
  if (cycles.length === 0) {
    console.log('✅ No circular dependencies found!');
    return;
  }
  
  console.log(`❌ Found ${cycles.length} circular dependencies:`);
  
  cycles.forEach((cycle, index) => {
    console.log(`\n${index + 1}. Circular dependency detected:`);
    cycle.forEach((file, i) => {
      const arrow = i === cycle.length - 1 ? ' → (cycle)' : ' →';
      console.log(`   ${formatPath(file)}${arrow}`);
    });
  });
  
  console.log('\n💡 Recommendations:');
  console.log('===================');
  console.log('• Extract shared code into separate modules');
  console.log('• Use dependency injection or inversion of control');
  console.log('• Consider using interfaces to break tight coupling');
  console.log('• Move shared types to a common types file');
  console.log('• Use event-driven architecture for loose coupling');
}

// Main execution
function main() {
  const srcDir = path.join(process.cwd(), 'src');
  const files = findSourceFiles(srcDir);
  
  console.log(`📁 Analyzing ${files.length} source files...`);
  
  const graph = buildDependencyGraph(files);
  const cycles = detectCircularDependencies(graph);
  
  displayResults(cycles);
  
  return cycles.length === 0 ? 0 : 1;
}

if (require.main === module) {
  const exitCode = main();
  process.exit(exitCode);
}

module.exports = { detectCircularDependencies, buildDependencyGraph };