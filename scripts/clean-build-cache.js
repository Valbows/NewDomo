#!/usr/bin/env node

/**
 * Build Cache Cleanup Script
 * 
 * Cleans Next.js build cache to free up disk space while preserving
 * essential build artifacts for production deployment.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, '..');
const NEXT_DIR = path.join(ROOT_DIR, '.next');

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
 * Main cleanup function
 */
function cleanBuildCache() {
  console.log('🧹 Next.js Build Cache Cleanup');
  console.log('================================');

  if (!fs.existsSync(NEXT_DIR)) {
    console.log('ℹ️  No .next directory found. Nothing to clean.');
    return;
  }

  const totalSizeBefore = getDirSize(NEXT_DIR);
  console.log(`📊 Current .next size: ${totalSizeBefore}MB`);

  let totalCleaned = 0;

  // Clean development cache (safe to remove)
  const devCachePaths = [
    path.join(NEXT_DIR, 'cache', 'webpack', 'client-development'),
    path.join(NEXT_DIR, 'cache', 'webpack', 'client-development-fallback'),
    path.join(NEXT_DIR, 'cache', 'webpack', 'server-development')
  ];

  console.log('\n🔄 Cleaning development cache...');
  devCachePaths.forEach(cachePath => {
    if (fs.existsSync(cachePath)) {
      const size = removeDir(cachePath);
      if (size > 0) {
        console.log(`   ✅ Removed ${path.basename(cachePath)}: ${size}MB`);
        totalCleaned += size;
      }
    }
  });

  // Optionally clean production cache (regenerates on next build)
  const shouldCleanProd = process.argv.includes('--production') || process.argv.includes('--all');
  
  if (shouldCleanProd) {
    console.log('\n🏭 Cleaning production cache...');
    const prodCachePaths = [
      path.join(NEXT_DIR, 'cache', 'webpack', 'client-production'),
      path.join(NEXT_DIR, 'cache', 'webpack', 'server-production')
    ];

    prodCachePaths.forEach(cachePath => {
      if (fs.existsSync(cachePath)) {
        const size = removeDir(cachePath);
        if (size > 0) {
          console.log(`   ✅ Removed ${path.basename(cachePath)}: ${size}MB`);
          totalCleaned += size;
        }
      }
    });
  }

  // Clean other cache files
  const otherCacheFiles = [
    path.join(NEXT_DIR, 'cache', '.tsbuildinfo'),
    path.join(NEXT_DIR, 'trace')
  ];

  console.log('\n🗑️  Cleaning other cache files...');
  otherCacheFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const sizeMB = Math.round(stats.size / (1024 * 1024) * 100) / 100;
      fs.rmSync(filePath, { recursive: true, force: true });
      console.log(`   ✅ Removed ${path.basename(filePath)}: ${sizeMB}MB`);
      totalCleaned += sizeMB;
    }
  });

  const totalSizeAfter = getDirSize(NEXT_DIR);
  
  console.log('\n📊 Cleanup Summary:');
  console.log(`   Before: ${totalSizeBefore}MB`);
  console.log(`   After:  ${totalSizeAfter}MB`);
  console.log(`   Saved:  ${totalCleaned}MB`);

  if (totalCleaned > 0) {
    console.log('\n✅ Cache cleanup completed successfully!');
    console.log('💡 Cache will be regenerated on next build/dev command.');
  } else {
    console.log('\nℹ️  No cache files found to clean.');
  }

  // Provide usage tips
  console.log('\n💡 Usage Tips:');
  console.log('   • Run this script periodically to free up disk space');
  console.log('   • Use --production flag to also clean production cache');
  console.log('   • Use --all flag to clean everything (maximum space savings)');
  console.log('   • First build after cleanup will be slower but subsequent builds will be fast');
}

// Run cleanup
try {
  cleanBuildCache();
} catch (error) {
  console.error('❌ Error during cleanup:', error.message);
  process.exit(1);
}