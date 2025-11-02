#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Recursively find all files in a directory
 * @param {string} dir - Directory to search
 * @param {string[]} extensions - File extensions to include
 * @returns {string[]} Array of file paths
 */
function findFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];
  
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules, .git, .next, and other build directories
        if (!['node_modules', '.git', '.next', 'dist', 'build', '.vercel', '.swc'].includes(item)) {
          files.push(...findFiles(fullPath, extensions));
        }
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read directory ${dir}: ${error.message}`);
  }
  
  return files;
}

/**
 * Count lines in a file
 * @param {string} filePath - Path to the file
 * @returns {number} Number of lines
 */
function countLines(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.split('\n').length;
  } catch (error) {
    console.warn(`Warning: Could not read file ${filePath}: ${error.message}`);
    return 0;
  }
}

/**
 * Analyze file complexity and determine priority
 * @param {string} filePath - Path to the file
 * @param {number} lineCount - Number of lines in the file
 * @returns {object} Analysis result with priority and reasoning
 */
function analyzeFilePriority(filePath, lineCount) {
  const fileName = path.basename(filePath);
  const dirPath = path.dirname(filePath);
  
  let priority = 'Low';
  let reasoning = [];
  let complexity = 0;
  
  // High priority indicators
  if (filePath.includes('/components/') && fileName.endsWith('.tsx')) {
    priority = 'High';
    reasoning.push('UI component - high user impact');
    complexity += 3;
  }
  
  if (filePath.includes('/pages/') || filePath.includes('/app/') && fileName === 'page.tsx') {
    priority = 'High';
    reasoning.push('Main user interface page');
    complexity += 3;
  }
  
  if (filePath.includes('/services/') && fileName.includes('service')) {
    priority = 'High';
    reasoning.push('Core business logic service');
    complexity += 2;
  }
  
  // Medium priority indicators
  if (filePath.includes('/lib/') || filePath.includes('/utils/')) {
    if (priority === 'Low') priority = 'Medium';
    reasoning.push('Utility/library code');
    complexity += 1;
  }
  
  if (filePath.includes('/api/')) {
    if (priority === 'Low') priority = 'Medium';
    reasoning.push('API route handler');
    complexity += 1;
  }
  
  // Adjust priority based on line count
  if (lineCount > 800) {
    if (priority === 'Medium') priority = 'High';
    if (priority === 'Low') priority = 'Medium';
    reasoning.push('Very large file (800+ lines)');
    complexity += 2;
  } else if (lineCount > 500) {
    if (priority === 'Low') priority = 'Medium';
    reasoning.push('Large file (500+ lines)');
    complexity += 1;
  }
  
  return {
    priority,
    reasoning: reasoning.join(', '),
    complexity,
    category: determineCategory(filePath)
  };
}

/**
 * Determine file category for organization
 * @param {string} filePath - Path to the file
 * @returns {string} File category
 */
function determineCategory(filePath) {
  if (filePath.includes('/components/')) return 'Component';
  if (filePath.includes('/pages/') || filePath.includes('/app/')) return 'Page';
  if (filePath.includes('/services/')) return 'Service';
  if (filePath.includes('/api/')) return 'API Route';
  if (filePath.includes('/lib/') || filePath.includes('/utils/')) return 'Utility';
  if (filePath.includes('/hooks/')) return 'Hook';
  return 'Other';
}

/**
 * Main analysis function
 */
function analyzeLargeFiles() {
  console.log('🔍 Analyzing codebase for large files (300+ lines)...\n');
  
  const srcFiles = findFiles('./src');
  const testFiles = findFiles('./__tests__');
  const allFiles = [...srcFiles, ...testFiles];
  
  const largeFiles = [];
  
  for (const filePath of allFiles) {
    const lineCount = countLines(filePath);
    
    if (lineCount >= 300) {
      const analysis = analyzeFilePriority(filePath, lineCount);
      largeFiles.push({
        path: filePath,
        lines: lineCount,
        ...analysis
      });
    }
  }
  
  // Sort by priority (High -> Medium -> Low) and then by line count (descending)
  largeFiles.sort((a, b) => {
    const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.lines - a.lines;
  });
  
  // Display results
  console.log(`📊 Found ${largeFiles.length} files with 300+ lines:\n`);
  
  const categories = ['High', 'Medium', 'Low'];
  
  for (const priorityLevel of categories) {
    const filesInCategory = largeFiles.filter(f => f.priority === priorityLevel);
    if (filesInCategory.length === 0) continue;
    
    console.log(`🔥 ${priorityLevel} Priority (${filesInCategory.length} files):`);
    console.log('─'.repeat(80));
    
    for (const file of filesInCategory) {
      const relativePath = file.path.replace('./src/', 'src/').replace('./__tests__/', '__tests__/');
      console.log(`  📄 ${relativePath}`);
      console.log(`     Lines: ${file.lines} | Category: ${file.category}`);
      console.log(`     Reason: ${file.reasoning}`);
      console.log('');
    }
  }
  
  // Summary statistics
  const totalLines = largeFiles.reduce((sum, file) => sum + file.lines, 0);
  const avgLines = Math.round(totalLines / largeFiles.length);
  const maxLines = Math.max(...largeFiles.map(f => f.lines));
  
  console.log('📈 Summary Statistics:');
  console.log('─'.repeat(40));
  console.log(`Total files to refactor: ${largeFiles.length}`);
  console.log(`Total lines in large files: ${totalLines.toLocaleString()}`);
  console.log(`Average lines per large file: ${avgLines}`);
  console.log(`Largest file: ${maxLines} lines`);
  
  const priorityCounts = {
    High: largeFiles.filter(f => f.priority === 'High').length,
    Medium: largeFiles.filter(f => f.priority === 'Medium').length,
    Low: largeFiles.filter(f => f.priority === 'Low').length
  };
  
  console.log(`Priority breakdown: High(${priorityCounts.High}) Medium(${priorityCounts.Medium}) Low(${priorityCounts.Low})`);
  
  // Generate refactoring plan
  console.log('\n🎯 Recommended Refactoring Order:');
  console.log('─'.repeat(50));
  
  let phase = 1;
  for (const priorityLevel of categories) {
    const filesInCategory = largeFiles.filter(f => f.priority === priorityLevel);
    if (filesInCategory.length === 0) continue;
    
    console.log(`Phase ${phase}: ${priorityLevel} Priority Files`);
    for (const file of filesInCategory.slice(0, 5)) { // Show top 5 per priority
      const relativePath = file.path.replace('./src/', 'src/').replace('./__tests__/', '__tests__/');
      console.log(`  - ${relativePath} (${file.lines} lines)`);
    }
    if (filesInCategory.length > 5) {
      console.log(`  ... and ${filesInCategory.length - 5} more files`);
    }
    console.log('');
    phase++;
  }
  
  return largeFiles;
}

// Run the analysis
if (require.main === module) {
  analyzeLargeFiles();
}

module.exports = { analyzeLargeFiles, findFiles, countLines };