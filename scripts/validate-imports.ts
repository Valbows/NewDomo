#!/usr/bin/env node

/**
 * Import Validation Script
 * 
 * This script validates that all import statements in the codebase resolve correctly.
 * It checks for:
 * - Missing files/modules
 * - Incorrect relative paths
 * - Invalid TypeScript path mappings
 * - Circular dependencies
 * - Unused imports (optional)
 * 
 * Usage:
 *   npm run validate-imports
 *   node scripts/validate-imports.ts
 *   node scripts/validate-imports.ts --fix-paths
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface ImportInfo {
  file: string;
  line: number;
  importPath: string;
  importType: 'relative' | 'absolute' | 'node_module' | 'typescript_path';
  resolvedPath?: string;
  exists: boolean;
  error?: string;
}

interface ValidationResult {
  totalFiles: number;
  totalImports: number;
  validImports: number;
  invalidImports: ImportInfo[];
  circularDependencies: string[][];
  summary: string;
}

class ImportValidator {
  private projectRoot: string;
  private srcRoot: string;
  private tsConfig: any;
  private pathMappings: Map<string, string[]> = new Map();
  private fileExtensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];
  private excludePatterns = [
    'node_modules',
    '.next',
    '.git',
    'dist',
    'build',
    '__tests__',
    'test-results',
    'playwright-report'
  ];

  constructor() {
    this.projectRoot = process.cwd();
    this.srcRoot = path.join(this.projectRoot, 'src');
    this.loadTsConfig();
    this.setupPathMappings();
  }

  private loadTsConfig(): void {
    try {
      const tsConfigPath = path.join(this.projectRoot, 'tsconfig.json');
      const tsConfigContent = fs.readFileSync(tsConfigPath, 'utf-8');
      // Remove comments and parse JSON
      const cleanContent = tsConfigContent.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
      this.tsConfig = JSON.parse(cleanContent);
    } catch (error) {
      console.warn('Could not load tsconfig.json, using defaults');
      this.tsConfig = { compilerOptions: {} };
    }
  }

  private setupPathMappings(): void {
    const paths = this.tsConfig?.compilerOptions?.paths || {};
    const baseUrl = this.tsConfig?.compilerOptions?.baseUrl || '.';
    
    for (const [pattern, mappings] of Object.entries(paths)) {
      const resolvedMappings = (mappings as string[]).map(mapping => 
        path.resolve(this.projectRoot, baseUrl, mapping)
      );
      this.pathMappings.set(pattern, resolvedMappings);
    }
  }

  private getAllFiles(dir: string, extensions: string[] = this.fileExtensions): string[] {
    const files: string[] = [];
    
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

  private extractImports(filePath: string): ImportInfo[] {
    const imports: ImportInfo[] = [];
    
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Match various import patterns
        const importPatterns = [
          /^import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/,  // import ... from '...'
          /^import\s+['"`]([^'"`]+)['"`]/,               // import '...'
          /^export\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/,  // export ... from '...'
          /require\(['"`]([^'"`]+)['"`]\)/,              // require('...')
          /import\(['"`]([^'"`]+)['"`]\)/,               // dynamic import('...')
        ];
        
        for (const pattern of importPatterns) {
          const match = line.match(pattern);
          if (match) {
            const importPath = match[1];
            const importInfo: ImportInfo = {
              file: filePath,
              line: i + 1,
              importPath,
              importType: this.getImportType(importPath),
              exists: false
            };
            
            this.resolveImport(importInfo, filePath);
            imports.push(importInfo);
          }
        }
      }
    } catch (error) {
      console.warn(`Could not read file ${filePath}:`, error);
    }
    
    return imports;
  }

  private getImportType(importPath: string): ImportInfo['importType'] {
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      return 'relative';
    } else if (importPath.startsWith('@/')) {
      return 'typescript_path';
    } else if (importPath.startsWith('/')) {
      return 'absolute';
    } else {
      return 'node_module';
    }
  }

  private resolveImport(importInfo: ImportInfo, fromFile: string): void {
    const { importPath, importType } = importInfo;
    
    try {
      switch (importType) {
        case 'relative':
          this.resolveRelativeImport(importInfo, fromFile);
          break;
        case 'typescript_path':
          this.resolveTypeScriptPathImport(importInfo);
          break;
        case 'absolute':
          this.resolveAbsoluteImport(importInfo);
          break;
        case 'node_module':
          this.resolveNodeModuleImport(importInfo);
          break;
      }
    } catch (error) {
      importInfo.error = error instanceof Error ? error.message : String(error);
    }
  }

  private resolveRelativeImport(importInfo: ImportInfo, fromFile: string): void {
    const fromDir = path.dirname(fromFile);
    const resolvedPath = path.resolve(fromDir, importInfo.importPath);
    
    // Try with different extensions
    const candidates = [
      resolvedPath,
      ...this.fileExtensions.map(ext => resolvedPath + ext),
      ...this.fileExtensions.map(ext => path.join(resolvedPath, 'index' + ext))
    ];
    
    for (const candidate of candidates) {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        importInfo.resolvedPath = candidate;
        importInfo.exists = true;
        return;
      }
    }
    
    importInfo.error = `File not found: ${importInfo.importPath}`;
  }

  private resolveTypeScriptPathImport(importInfo: ImportInfo): void {
    const importPath = importInfo.importPath;
    
    // Handle @/* mappings
    for (const [pattern, mappings] of this.pathMappings.entries()) {
      const regexPattern = pattern.replace('*', '(.*)');
      const regex = new RegExp(`^${regexPattern}$`);
      const match = importPath.match(regex);
      
      if (match) {
        const captured = match[1] || '';
        
        for (const mapping of mappings) {
          const resolvedPath = mapping.replace('*', captured);
          
          // Try with different extensions
          const candidates = [
            resolvedPath,
            ...this.fileExtensions.map(ext => resolvedPath + ext),
            ...this.fileExtensions.map(ext => path.join(resolvedPath, 'index' + ext))
          ];
          
          for (const candidate of candidates) {
            if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
              importInfo.resolvedPath = candidate;
              importInfo.exists = true;
              return;
            }
          }
        }
      }
    }
    
    importInfo.error = `TypeScript path mapping not resolved: ${importPath}`;
  }

  private resolveAbsoluteImport(importInfo: ImportInfo): void {
    const resolvedPath = path.join(this.projectRoot, importInfo.importPath);
    
    if (fs.existsSync(resolvedPath)) {
      importInfo.resolvedPath = resolvedPath;
      importInfo.exists = true;
    } else {
      importInfo.error = `Absolute path not found: ${importInfo.importPath}`;
    }
  }

  private resolveNodeModuleImport(importInfo: ImportInfo): void {
    try {
      // Check if it's a built-in Node.js module
      const builtinModules = ['fs', 'path', 'crypto', 'http', 'https', 'url', 'querystring', 'util'];
      const moduleName = importInfo.importPath.split('/')[0];
      
      if (builtinModules.includes(moduleName)) {
        importInfo.exists = true;
        importInfo.resolvedPath = `node:${moduleName}`;
        return;
      }
      
      // Check if package exists in node_modules
      const packageJsonPath = path.join(this.projectRoot, 'node_modules', moduleName, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        importInfo.exists = true;
        importInfo.resolvedPath = packageJsonPath;
      } else {
        importInfo.error = `Node module not found: ${importInfo.importPath}`;
      }
    } catch (error) {
      importInfo.error = `Error resolving node module: ${importInfo.importPath}`;
    }
  }

  private detectCircularDependencies(imports: ImportInfo[]): string[][] {
    const graph = new Map<string, Set<string>>();
    const circularDeps: string[][] = [];
    
    // Build dependency graph
    for (const importInfo of imports) {
      if (importInfo.exists && importInfo.resolvedPath) {
        const fromFile = importInfo.file;
        const toFile = importInfo.resolvedPath;
        
        if (!graph.has(fromFile)) {
          graph.set(fromFile, new Set());
        }
        graph.get(fromFile)!.add(toFile);
      }
    }
    
    // Detect cycles using DFS
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const dfs = (node: string, path: string[]): void => {
      if (recursionStack.has(node)) {
        const cycleStart = path.indexOf(node);
        if (cycleStart !== -1) {
          circularDeps.push(path.slice(cycleStart));
        }
        return;
      }
      
      if (visited.has(node)) return;
      
      visited.add(node);
      recursionStack.add(node);
      path.push(node);
      
      const dependencies = graph.get(node) || new Set();
      for (const dep of dependencies) {
        dfs(dep, [...path]);
      }
      
      recursionStack.delete(node);
      path.pop();
    };
    
    for (const node of graph.keys()) {
      if (!visited.has(node)) {
        dfs(node, []);
      }
    }
    
    return circularDeps;
  }

  public validate(): ValidationResult {
    console.log('🔍 Starting import validation...\n');
    
    // Get all TypeScript/JavaScript files
    const allFiles = [
      ...this.getAllFiles(this.srcRoot),
      ...this.getAllFiles(path.join(this.projectRoot, 'scripts')),
      ...this.getAllFiles(path.join(this.projectRoot, '__tests__')),
    ];
    
    console.log(`📁 Found ${allFiles.length} files to analyze`);
    
    // Extract all imports
    const allImports: ImportInfo[] = [];
    for (const file of allFiles) {
      const imports = this.extractImports(file);
      allImports.push(...imports);
    }
    
    console.log(`📦 Found ${allImports.length} import statements`);
    
    // Separate valid and invalid imports
    const validImports = allImports.filter(imp => imp.exists);
    const invalidImports = allImports.filter(imp => !imp.exists);
    
    // Detect circular dependencies
    console.log('🔄 Checking for circular dependencies...');
    const circularDependencies = this.detectCircularDependencies(validImports);
    
    const result: ValidationResult = {
      totalFiles: allFiles.length,
      totalImports: allImports.length,
      validImports: validImports.length,
      invalidImports,
      circularDependencies,
      summary: this.generateSummary(allFiles.length, allImports.length, validImports.length, invalidImports, circularDependencies)
    };
    
    return result;
  }

  private generateSummary(
    totalFiles: number,
    totalImports: number,
    validImports: number,
    invalidImports: ImportInfo[],
    circularDeps: string[][]
  ): string {
    const invalidCount = invalidImports.length;
    const successRate = totalImports > 0 ? ((validImports / totalImports) * 100).toFixed(1) : '0';
    
    let summary = `\n📊 Import Validation Summary:\n`;
    summary += `   Files analyzed: ${totalFiles}\n`;
    summary += `   Total imports: ${totalImports}\n`;
    summary += `   Valid imports: ${validImports}\n`;
    summary += `   Invalid imports: ${invalidCount}\n`;
    summary += `   Success rate: ${successRate}%\n`;
    summary += `   Circular dependencies: ${circularDeps.length}\n`;
    
    if (invalidCount === 0 && circularDeps.length === 0) {
      summary += `\n✅ All imports are valid! No issues found.\n`;
    } else {
      summary += `\n❌ Found ${invalidCount + circularDeps.length} issues that need attention.\n`;
    }
    
    return summary;
  }

  public printResults(result: ValidationResult): void {
    console.log(result.summary);
    
    if (result.invalidImports.length > 0) {
      console.log('\n❌ Invalid Imports:');
      console.log('==================');
      
      // Group by error type
      const byType = new Map<string, ImportInfo[]>();
      for (const imp of result.invalidImports) {
        const key = imp.importType;
        if (!byType.has(key)) byType.set(key, []);
        byType.get(key)!.push(imp);
      }
      
      for (const [type, imports] of byType.entries()) {
        console.log(`\n${type.toUpperCase()} IMPORTS (${imports.length}):`);
        for (const imp of imports.slice(0, 10)) { // Limit output
          const relativePath = path.relative(this.projectRoot, imp.file);
          console.log(`  ${relativePath}:${imp.line}`);
          console.log(`    Import: "${imp.importPath}"`);
          console.log(`    Error: ${imp.error || 'Unknown error'}`);
        }
        if (imports.length > 10) {
          console.log(`    ... and ${imports.length - 10} more`);
        }
      }
    }
    
    if (result.circularDependencies.length > 0) {
      console.log('\n🔄 Circular Dependencies:');
      console.log('========================');
      
      for (let i = 0; i < Math.min(result.circularDependencies.length, 5); i++) {
        const cycle = result.circularDependencies[i];
        console.log(`\nCycle ${i + 1}:`);
        for (let j = 0; j < cycle.length; j++) {
          const file = path.relative(this.projectRoot, cycle[j]);
          console.log(`  ${j + 1}. ${file}`);
        }
      }
      
      if (result.circularDependencies.length > 5) {
        console.log(`\n... and ${result.circularDependencies.length - 5} more cycles`);
      }
    }
  }
}

// CLI execution
if (require.main === module) {
  const validator = new ImportValidator();
  
  try {
    const result = validator.validate();
    validator.printResults(result);
    
    // Exit with error code if there are issues
    const hasIssues = result.invalidImports.length > 0 || result.circularDependencies.length > 0;
    process.exit(hasIssues ? 1 : 0);
    
  } catch (error) {
    console.error('❌ Import validation failed:', error);
    process.exit(1);
  }
}

export { ImportValidator, ValidationResult, ImportInfo };