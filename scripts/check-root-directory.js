#!/usr/bin/env node

/**
 * Root Directory Compliance Checker
 * 
 * Validates that the root directory only contains allowed files
 * according to project structure guidelines.
 */

import fs from 'fs';
import path from 'path';

// Allowed files and patterns in root directory
const ALLOWED_FILES = [
  // Essential configuration files
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'next.config.cjs',
  'tailwind.config.js',
  'eslint.config.js',
  'jest.config.cjs',
  'jest.config.dom.cjs',
  'jest.config.node.cjs',
  'postcss.config.cjs',
  'playwright.config.ts',
  'playwright.real.config.ts',
  
  // Environment & setup files
  '.env.example',
  '.env.development',
  '.env.staging',
  '.env.production',
  '.gitignore',
  '.dockerignore',
  'README.md',
  'next-env.d.ts',
  
  // Build & development files
  'jest.setup.js',
  'jest.setup.node.js',
  'jest.env.js',
  'docker-compose.yml',
  'Dockerfile',
  'render.yaml',
];

// Allowed directories (auto-generated, git-ignored)
const ALLOWED_DIRECTORIES = [
  '.next',
  '.swc',
  'test-artifacts',
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.git',
  '.kiro',
  'src',
  'docs',
  'scripts',
  '__tests__',
  'public',
];

// Prohibited file patterns with suggested actions
const PROHIBITED_PATTERNS = [
  {
    pattern: /\.md$/,
    exclude: ['README.md'],
    message: 'Markdown files (except README.md) must be in docs/ folder',
    action: 'Move to docs/ folder'
  },
  {
    pattern: /\.(png|jpg|jpeg|gif|webp|webm|mp4)$/,
    message: 'Image and video files are prohibited in root directory',
    action: 'Delete or move to appropriate assets folder'
  },
  {
    pattern: /\.(sh|js)$/,
    exclude: ALLOWED_FILES.filter(f => f.endsWith('.js')),
    message: 'Script files must be in scripts/ folder',
    action: 'Move to scripts/ folder'
  },
  {
    pattern: /\.(log|tmp|cache|backup)$/,
    message: 'Temporary and log files are prohibited',
    action: 'Delete immediately'
  },
  {
    pattern: /-old\.|\.old$|-copy\.|\.copy$|-backup\.|\.backup$/,
    message: 'Backup files are prohibited',
    action: 'Delete immediately'
  },
  {
    pattern: /\.(csv|xlsx|json)$/,
    exclude: ['package.json', 'package-lock.json'],
    message: 'Data files should be in data/ folder or deleted',
    action: 'Move to data/ folder or delete if temporary'
  },
  {
    pattern: /^\.env(\.local)?$/,
    message: 'Use .env.development instead of .env or .env.local',
    action: 'Rename to .env.development'
  }
];

function checkRootDirectory() {
  console.log('🔍 Checking root directory compliance...\n');
  
  const rootFiles = fs.readdirSync('.', { withFileTypes: true });
  const violations = [];
  let totalFiles = 0;
  let allowedFiles = 0;
  
  for (const dirent of rootFiles) {
    const name = dirent.name;
    
    // Skip hidden files starting with . (except allowed ones)
    if (name.startsWith('.') && !ALLOWED_FILES.includes(name) && !ALLOWED_DIRECTORIES.includes(name)) {
      continue;
    }
    
    if (dirent.isDirectory()) {
      if (!ALLOWED_DIRECTORIES.includes(name)) {
        violations.push({
          name,
          type: 'directory',
          message: `Unexpected directory in root: ${name}`,
          action: 'Review if this directory should exist in root'
        });
      }
      continue;
    }
    
    totalFiles++;
    
    if (ALLOWED_FILES.includes(name)) {
      allowedFiles++;
      continue;
    }
    
    // Check against prohibited patterns
    let isViolation = false;
    for (const rule of PROHIBITED_PATTERNS) {
      if (rule.pattern.test(name)) {
        // Check if file is in exclude list
        if (rule.exclude && rule.exclude.includes(name)) {
          allowedFiles++;
          continue;
        }
        
        violations.push({
          name,
          type: 'file',
          message: rule.message,
          action: rule.action
        });
        isViolation = true;
        break;
      }
    }
    
    // If no specific rule matched, it's still a violation
    if (!isViolation) {
      violations.push({
        name,
        type: 'file',
        message: 'File not in allowed list for root directory',
        action: 'Review if this file belongs in root or should be moved'
      });
    }
  }
  
  // Report results
  console.log(`📊 Root Directory Analysis:`);
  console.log(`   Total files: ${totalFiles}`);
  console.log(`   Allowed files: ${allowedFiles}`);
  console.log(`   Violations: ${violations.length}\n`);
  
  if (violations.length === 0) {
    console.log('✅ Root directory is compliant with project structure guidelines!');
    return true;
  }
  
  console.log('❌ Root directory violations found:\n');
  
  violations.forEach((violation, index) => {
    console.log(`${index + 1}. ${violation.name} (${violation.type})`);
    console.log(`   Issue: ${violation.message}`);
    console.log(`   Action: ${violation.action}\n`);
  });
  
  console.log('🔧 To fix these violations:');
  console.log('   1. Review each file/directory listed above');
  console.log('   2. Move or delete according to the suggested actions');
  console.log('   3. Run this script again to verify compliance');
  console.log('   4. See .kiro/steering/project-structure.md for detailed guidelines\n');
  
  return false;
}

// Run the check
const isCompliant = checkRootDirectory();
process.exit(isCompliant ? 0 : 1);