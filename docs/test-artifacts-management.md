# Test Artifacts Management Guide

## Overview

Test artifacts (screenshots, videos, traces, reports) should be properly organized and never clutter the root directory. This guide explains the proper structure and management of test artifacts.

## Proper Test Artifacts Structure (Consolidated)

```
project/
├── test-artifacts/            # ✅ Consolidated test artifacts directory
│   ├── results/              # Playwright test artifacts
│   │   ├── screenshots/      # Screenshots of failed tests
│   │   ├── videos/           # Videos of test runs
│   │   ├── traces/           # Debug traces
│   │   └── .last-run.json    # Test run metadata
│   └── reports/              # HTML test reports
│       ├── index.html        # Main report
│       └── assets/           # Report assets
├── __tests__/                # ✅ Test source code
│   ├── e2e/                  # E2E tests
│   ├── unit/                 # Unit tests
│   └── integration/          # Integration tests
└── coverage/                 # ✅ Coverage reports (if enabled)
```

## Why Screenshots Ended Up in Root Directory

### ❌ **Root Cause Analysis:**

1. **Missing `outputDir` Configuration**
   ```typescript
   // BEFORE (problematic)
   export default defineConfig({
     testDir: '__tests__/e2e',
     // No outputDir specified - uses default behavior
   });
   ```

2. **Working Directory Issues**
   - Tests running from wrong directory
   - Relative path resolution problems
   - Process working directory not set to project root

3. **Playwright Default Behavior**
   - Without explicit `outputDir`, Playwright uses `test-results/`
   - But if working directory is wrong, artifacts go to current directory
   - Screenshots use relative paths that can resolve incorrectly

### ✅ **The Fix Applied:**

```typescript
// AFTER (consolidated structure)
export default defineConfig({
  testDir: '__tests__/e2e',
  outputDir: 'test-artifacts/results',        // ✅ Consolidated artifacts directory
  reporter: [['html', { 
    outputFolder: 'test-artifacts/reports'    // ✅ Consolidated reports directory
  }]],
});
```

## Configuration Details

### ✅ **Playwright Configuration (Fixed)**

#### **Main Config (`playwright.config.ts`)**
```typescript
export default defineConfig({
  testDir: '__tests__/e2e',
  outputDir: 'test-artifacts/results',          // ✅ Consolidated artifacts directory
  reporter: [['html', { 
    outputFolder: 'test-artifacts/reports'      // ✅ Consolidated reports directory
  }]],
  use: {
    screenshot: 'only-on-failure',              // ✅ Screenshots on failure
    video: 'retain-on-failure',                 // ✅ Videos on failure
    trace: 'on-first-retry',                    // ✅ Traces on retry
  },
});
```

#### **Real API Config (`playwright.real.config.ts`)**
```typescript
export default defineConfig({
  testDir: "__tests__/e2e-real",
  outputDir: "test-artifacts/results",          // ✅ Consolidated artifacts directory
  reporter: [["html", { 
    outputFolder: "test-artifacts/reports"      // ✅ Consolidated reports directory
  }]],
});
```

### ✅ **Git Ignore Configuration (Enhanced)**

```gitignore
# Test artifacts (consolidated)
test-artifacts/
# Legacy directories (in case they get created)
test-results/
playwright-report/

# Prevent any test artifacts from ending up in root
*-test-*.png
*-screenshot-*.png
debug-*.png
test-*.png
playwright-*.png
*-actual.png
*-expected.png
*-diff.png
*.webm
*.mp4
*-trace.zip
```

## Artifact Types and Locations

### 📸 **Screenshots**
- **Purpose**: Visual evidence of test failures
- **Location**: `test-artifacts/results/[test-name]/[screenshot-name].png`
- **Trigger**: `screenshot: 'only-on-failure'`
- **❌ Never in root**: Should always be in `test-artifacts/results/`

### 🎥 **Videos**
- **Purpose**: Full test run recordings
- **Location**: `test-artifacts/results/[test-name]/video.webm`
- **Trigger**: `video: 'retain-on-failure'`
- **Size**: Can be large (10-50MB per test)

### 🔍 **Traces**
- **Purpose**: Detailed debugging information
- **Location**: `test-artifacts/results/[test-name]/trace.zip`
- **Trigger**: `trace: 'on-first-retry'`
- **Usage**: `npx playwright show-trace test-artifacts/results/[test-name]/trace.zip`

### 📊 **Reports**
- **Purpose**: HTML test results and analysis
- **Location**: `test-artifacts/reports/index.html`
- **Access**: `npx playwright show-report test-artifacts/reports`
- **Size**: Usually small (< 1MB)

## Cleanup and Management

### 🧹 **Automated Cleanup Scripts**

```bash
# Clean all test artifacts
npm run clean:test

# Clean specific artifacts
rm -rf test-results/
rm -rf playwright-report/

# Clean everything (build cache + test artifacts)
npm run clean:all
```

### 📋 **Manual Cleanup**

```bash
# Remove consolidated test artifacts directory
rm -rf test-artifacts/

# Remove legacy directories (if they exist)
rm -rf test-results/ playwright-report/

# Remove any artifacts that ended up in root
rm -f *-test-*.png *-screenshot-*.png debug-*.png
rm -f *.webm *.mp4 *-trace.zip
```

### ⏰ **When to Clean**

1. **After test debugging** - Remove large video/trace files
2. **Before commits** - Ensure no artifacts in root
3. **Disk space issues** - Test artifacts can be large
4. **CI/CD cleanup** - Clean between builds
5. **Weekly maintenance** - Regular cleanup routine

## Best Practices

### ✅ **Do's**

1. **Always use explicit `outputDir`** in Playwright configs
2. **Check working directory** before running tests
3. **Clean artifacts regularly** to save disk space
4. **Use proper git ignore** for all artifact patterns
5. **Run cleanup scripts** after test failures

### ❌ **Don'ts**

1. **Never commit test artifacts** to version control
2. **Never leave screenshots in root** directory
3. **Don't ignore large video files** - they consume disk space
4. **Don't run tests from wrong directory**
5. **Don't skip cleanup** after debugging sessions

## Troubleshooting

### 🔧 **Common Issues**

#### **Screenshots Still Going to Root**
```bash
# Check current working directory
pwd
# Should be project root

# Check Playwright config
grep -n "outputDir" playwright*.config.ts
# Should show: outputDir: 'test-results'

# Run cleanup
npm run clean:test
```

#### **Large Test Artifacts**
```bash
# Check artifact sizes
du -sh test-results/ playwright-report/

# Clean large files
find test-results -name "*.webm" -size +10M -delete
find test-results -name "*.zip" -size +5M -delete
```

#### **Missing Test Results Directory**
```bash
# Create directory if missing
mkdir -p test-results

# Run tests to regenerate
npm run e2e
```

## Monitoring and Maintenance

### 📊 **Size Monitoring**

```bash
# Check current sizes
du -sh test-results/ playwright-report/

# Monitor growth over time
watch -n 60 'du -sh test-results/ playwright-report/'
```

### 🔄 **Automated Maintenance**

```bash
# Add to crontab for weekly cleanup
0 0 * * 0 cd /path/to/project && npm run clean:test

# Add to CI/CD pipeline
npm run clean:test  # Clean before tests
npm run e2e         # Run tests
npm run clean:test  # Clean after tests (optional)
```

## Summary

- **Test artifacts belong in `test-results/` and `playwright-report/`**
- **Never commit artifacts to version control**
- **Use explicit `outputDir` configuration**
- **Clean artifacts regularly to save disk space**
- **Monitor artifact sizes and clean large files**
- **Use automated cleanup scripts for maintenance**

The updated configuration ensures all test artifacts go to their proper locations and never clutter the root directory.