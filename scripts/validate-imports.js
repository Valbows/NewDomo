#!/usr/bin/env node

/**
 * Import Validation Script (JavaScript version)
 * 
 * This script validates that all import statements in the codebase resolve correctly.
 * It's a simplified version that works without TypeScript compilation.
 * 
 * Usage:
 *   npm run validate-imports:js
 *   node scripts/validate-imports.js
 */

const fs = require('fs');
const path = require('path');

class SimpleImportValidator {
  constructor() {
    this.projectRoot = process.cwd();
    this.srcRoot = path.join(this.projectRoot, 'src');
    this.fileExtensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];
    this.excludePatterns = [
      'node_modules',
      '.next',
      '.git',
      'dist',
      'build',
      '__tests__',
      'test-results',
      'playwright-report'
    ];
    this.tsConfig = this.loadTsConfig();
  }

  loadTsConfig() {
    try {
      const tsConfigPath = path.join(this.projectRoot, 'tsconfig.json');
      const content = fs.readFileSync(tsConfigPath, 'utf-8');
      // Simple JSON parsing (remove comments)
      const cleanContent = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
      return JSON.parse(cleanContent);
    } catch (error) {
      console.warn('Could not load tsconfig.json, using defaults');
      return { compilerOptions: {} };
    }
  }

  getAllFiles(dir, extensions = this.fileExtensions) {
    const files = [];
    
    if (!fs.existsSync(dir)) return files;
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Skip excluded directories
        if (this.excludePatterns.some(pattern => entry.name.includes(pattern))) {
          continue;
        }
        files.push(...this.getAllFiles(fullPath, extensions));
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
    
    return files;
  }

  extractImports(filePath) {
    const imports = [];
    
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip comments, empty lines, and regex patterns
        if (line.startsWith('//') || line.startsWith('/*') || line.startsWith('*') || 
            !line || line.includes('//') || line.startsWith('/')) {
          continue;
        }
        
        // Match import patterns
        const patterns = [
          /^import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/,
          /^import\s+['"`]([^'"`]+)['"`]/,
          /^export\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/,
          /require\(['"`]([^'"`]+)['"`]\)/,
          /import\(['"`]([^'"`]+)['"`]\)/,
        ];
        
        for (const pattern of patterns) {
          const match = line.match(pattern);
          if (match) {
            const importPath = match[1];
            imports.push({
              file: filePath,
              line: i + 1,
              importPath,
              exists: this.checkImportExists(importPath, filePath)
            });
          }
        }
      }
    } catch (error) {
      console.warn(`Could not read file ${filePath}:`, error.message);
    }
    
    return imports;
  }

  checkImportExists(importPath, fromFile) {
    // Node modules (simplified check)
    if (!importPath.startsWith('.') && !importPath.startsWith('/') && !importPath.startsWith('@/')) {
      // Check for Node.js built-in modules
      const builtinModules = [
        'fs', 'path', 'crypto', 'http', 'https', 'url', 'querystring', 'util',
        'events', 'stream', 'buffer', 'os', 'child_process', 'cluster', 'net',
        'tls', 'dgram', 'dns', 'readline', 'repl', 'vm', 'zlib', 'assert'
      ];
      
      const moduleName = importPath.split('/')[0];
      if (builtinModules.includes(moduleName)) {
        return true;
      }
      
      // Check npm packages (handle scoped packages)
      let packagePath;
      if (importPath.startsWith('@')) {
        // Scoped package like @sentry/nextjs
        const parts = importPath.split('/');
        if (parts.length >= 2) {
          const scopedName = parts[0] + '/' + parts[1];
          packagePath = path.join(this.projectRoot, 'node_modules', scopedName, 'package.json');
        }
      } else {
        // Regular package
        packagePath = path.join(this.projectRoot, 'node_modules', moduleName, 'package.json');
      }
      
      return packagePath && fs.existsSync(packagePath);
    }
    
    // TypeScript path mapping (@/...)
    if (importPath.startsWith('@/')) {
      const relativePath = importPath.replace('@/', '');
      const fullPath = path.join(this.srcRoot, relativePath);
      return this.fileExistsWithExtensions(fullPath);
    }
    
    // Relative imports
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      const fromDir = path.dirname(fromFile);
      const fullPath = path.resolve(fromDir, importPath);
      return this.fileExistsWithExtensions(fullPath);
    }
    
    // Absolute imports
    if (importPath.startsWith('/')) {
      const fullPath = path.join(this.projectRoot, importPath);
      return this.fileExistsWithExtensions(fullPath);
    }
    
    return false;
  }

  fileExistsWithExtensions(basePath) {
    // Try exact path first
    if (fs.existsSync(basePath) && fs.statSync(basePath).isFile()) {
      return true;
    }
    
    // Try with extensions
    for (const ext of this.fileExtensions) {
      const pathWithExt = basePath + ext;
      if (fs.existsSync(pathWithExt) && fs.statSync(pathWithExt).isFile()) {
        return true;
      }
    }
    
    // Try index files
    for (const ext of this.fileExtensions) {
      const indexPath = path.join(basePath, 'index' + ext);
      if (fs.existsSync(indexPath) && fs.statSync(indexPath).isFile()) {
        return true;
      }
    }
    
    return false;
  }

  validate() {
    console.log('🔍 Starting import validation (JavaScript version)...\n');
    
    // Get all files
    const allFiles = [
      ...this.getAllFiles(this.srcRoot),
      ...this.getAllFiles(path.join(this.projectRoot, 'scripts')),
      ...this.getAllFiles(path.join(this.projectRoot, '__tests__')),
    ];
    
    console.log(`📁 Found ${allFiles.length} files to analyze`);
    
    // Extract imports
    const allImports = [];
    for (const file of allFiles) {
      const imports = this.extractImports(file);
      allImports.push(...imports);
    }
    
    console.log(`📦 Found ${allImports.length} import statements`);
    
    // Analyze results
    const validImports = allImports.filter(imp => imp.exists);
    const invalidImports = allImports.filter(imp => !imp.exists);
    
    const successRate = allImports.length > 0 ? 
      ((validImports.length / allImports.length) * 100).toFixed(1) : '0';
    
    // Print summary
    console.log(`\n📊 Import Validation Summary:`);
    console.log(`   Files analyzed: ${allFiles.length}`);
    console.log(`   Total imports: ${allImports.length}`);
    console.log(`   Valid imports: ${validImports.length}`);
    console.log(`   Invalid imports: ${invalidImports.length}`);
    console.log(`   Success rate: ${successRate}%`);
    
    if (invalidImports.length === 0) {
      console.log(`\n✅ All imports are valid! No issues found.`);
    } else {
      console.log(`\n❌ Found ${invalidImports.length} invalid imports:`);
      console.log('==========================================');
      
      // Show first 20 invalid imports
      for (let i = 0; i < Math.min(invalidImports.length, 20); i++) {
        const imp = invalidImports[i];
        const relativePath = path.relative(this.projectRoot, imp.file);
        console.log(`  ${relativePath}:${imp.line}`);
        console.log(`    Import: "${imp.importPath}"`);
      }
      
      if (invalidImports.length > 20) {
        console.log(`    ... and ${invalidImports.length - 20} more`);
      }
    }
    
    return {
      totalFiles: allFiles.length,
      totalImports: allImports.length,
      validImports: validImports.length,
      invalidImports: invalidImports.length,
      success: invalidImports.length === 0
    };
  }
}

// CLI execution
if (require.main === module) {
  const validator = new SimpleImportValidator();
  
  try {
    const result = validator.validate();
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('❌ Import validation failed:', error);
    process.exit(1);
  }
}

module.exports = { SimpleImportValidator };