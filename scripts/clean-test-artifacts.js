#!/usr/bin/env node

/**
 * Test Artifacts Cleanup Script
 * 
 * Cleans up test artifacts including screenshots, videos, traces, and reports.
 * Also removes any test artifacts that accidentally ended up in the root directory.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

/**
 * Get directory size in MB
 */
function getDirSize(dirPath) {
  try {
    const result = execSync(`du -sm "${dirPath}"`, { encoding: 'utf8' });
    return parseInt(result.split('\t')[0]);
  } catch (error) {
    return 0;
  }
}

/**
 * Remove directory recursively
 */
function removeDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    const sizeBefore = getDirSize(dirPath);
    fs.rmSync(dirPath, { recursive: true, force: true });
    return sizeBefore;
  }
  return 0;
}

/**
 * Remove files matching pattern
 */
function removeFiles(pattern, directory = ROOT_DIR) {
  try {
    const files = fs.readdirSync(directory);
    let removedCount = 0;
    let totalSize = 0;

    files.forEach(file => {
      if (file.match(pattern)) {
        const filePath = path.join(directory, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
        fs.unlinkSync(filePath);
        removedCount++;
        console.log(`   ✅ Removed: ${file}`);
      }
    });

    return { count: removedCount, size: Math.round(totalSize / (1024 * 1024) * 100) / 100 };
  } catch (error) {
    return { count: 0, size: 0 };
  }
}

/**
 * Main cleanup function
 */
function cleanTestArtifacts() {
  console.log('🧹 Test Artifacts Cleanup');
  console.log('=========================');

  let totalCleaned = 0;
  let totalFiles = 0;

  // Clean test-results directory
  const testResultsPath = path.join(ROOT_DIR, 'test-results');
  if (fs.existsSync(testResultsPath)) {
    const testResultsSize = removeDir(testResultsPath);
    if (testResultsSize > 0) {
      console.log(`📁 Removed test-results/: ${testResultsSize}MB`);
      totalCleaned += testResultsSize;
    }
  }

  // Clean playwright-report directory
  const playwrightReportPath = path.join(ROOT_DIR, 'playwright-report');
  if (fs.existsSync(playwrightReportPath)) {
    const reportSize = removeDir(playwrightReportPath);
    if (reportSize > 0) {
      console.log(`📊 Removed playwright-report/: ${reportSize}MB`);
      totalCleaned += reportSize;
    }
  }

  // Clean any test screenshots that ended up in root directory
  console.log('\n🖼️  Cleaning test screenshots from root...');
  const screenshotPatterns = [
    /.*-test-.*\.png$/,
    /.*-screenshot-.*\.png$/,
    /debug-.*\.png$/,
    /test-.*\.png$/,
    /playwright-.*\.png$/,
    /.*-actual\.png$/,
    /.*-expected\.png$/,
    /.*-diff\.png$/
  ];

  screenshotPatterns.forEach(pattern => {
    const result = removeFiles(pattern);
    if (result.count > 0) {
      console.log(`   ✅ Removed ${result.count} files matching ${pattern}: ${result.size}MB`);
      totalFiles += result.count;
      totalCleaned += result.size;
    }
  });

  // Clean any video files that might have ended up in root
  console.log('\n🎥 Cleaning test videos from root...');
  const videoPatterns = [
    /.*-test-.*\.webm$/,
    /.*-test-.*\.mp4$/,
    /playwright-.*\.webm$/
  ];

  videoPatterns.forEach(pattern => {
    const result = removeFiles(pattern);
    if (result.count > 0) {
      console.log(`   ✅ Removed ${result.count} video files: ${result.size}MB`);
      totalFiles += result.count;
      totalCleaned += result.size;
    }
  });

  // Clean any trace files
  console.log('\n🔍 Cleaning trace files from root...');
  const tracePatterns = [
    /.*-trace\.zip$/,
    /playwright-trace-.*\.zip$/
  ];

  tracePatterns.forEach(pattern => {
    const result = removeFiles(pattern);
    if (result.count > 0) {
      console.log(`   ✅ Removed ${result.count} trace files: ${result.size}MB`);
      totalFiles += result.count;
      totalCleaned += result.size;
    }
  });

  // Summary
  console.log('\n📊 Cleanup Summary:');
  console.log(`   Directories cleaned: 2`);
  console.log(`   Files removed: ${totalFiles}`);
  console.log(`   Total space saved: ${totalCleaned}MB`);

  if (totalCleaned > 0 || totalFiles > 0) {
    console.log('\n✅ Test artifacts cleanup completed successfully!');
  } else {
    console.log('\nℹ️  No test artifacts found to clean.');
  }

  // Provide usage tips
  console.log('\n💡 Prevention Tips:');
  console.log('   • Test artifacts should go to test-results/ directory');
  console.log('   • HTML reports should go to playwright-report/ directory');
  console.log('   • Both directories are properly git-ignored');
  console.log('   • Run this script after test failures to clean up');
  console.log('   • Updated Playwright configs now enforce proper output directories');
}

// Run cleanup
try {
  cleanTestArtifacts();
} catch (error) {
  console.error('❌ Error during cleanup:', error.message);
  process.exit(1);
}