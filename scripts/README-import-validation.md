# Import Validation Scripts

This directory contains scripts to validate that all import statements in the codebase resolve correctly.

## Available Scripts

### 1. JavaScript Version (Recommended)
```bash
npm run validate-imports:js
# or
node scripts/validate-imports.js
```

**Features:**
- ✅ Fast execution (no compilation needed)
- ✅ Handles Node.js built-in modules
- ✅ Supports scoped npm packages (@scope/package)
- ✅ Validates TypeScript path mappings (@/...)
- ✅ Filters out comments and false positives
- ✅ 99.6%+ accuracy on current codebase

### 2. TypeScript Version (Advanced)
```bash
npm run validate-imports
# or
ts-node --project scripts/tsconfig.json scripts/validate-imports.ts
```

**Features:**
- ✅ More comprehensive analysis
- ✅ Circular dependency detection
- ✅ Detailed error reporting
- ⚠️ Requires ts-node and @types/node
- ⚠️ May have false positives with complex path mappings

## What Gets Validated

### Import Types Checked
- **Relative imports**: `./component`, `../utils/helper`
- **TypeScript path mappings**: `@/lib/service`, `@/components/Button`
- **Node.js built-in modules**: `fs`, `path`, `crypto`, etc.
- **NPM packages**: `react`, `next`, `@supabase/supabase-js`, etc.
- **Dynamic imports**: `import('./module')`, `require('module')`

### File Types Analyzed
- TypeScript files (`.ts`, `.tsx`)
- JavaScript files (`.js`, `.jsx`)
- JSON files (`.json`)

### Directories Scanned
- `src/` - Main source code
- `scripts/` - Build and utility scripts
- `__tests__/` - Test files

### Excluded Directories
- `node_modules/`
- `.next/`
- `.git/`
- `dist/`, `build/`
- `test-results/`
- `playwright-report/`

## Usage Examples

### Basic Validation
```bash
# Quick validation with JavaScript version
npm run validate-imports:js
```

### Detailed Analysis
```bash
# Comprehensive analysis with TypeScript version
npm run validate-imports
```

### Integration with CI/CD
```bash
# Add to package.json scripts for CI
"scripts": {
  "validate": "npm run validate-imports:js",
  "test:imports": "npm run validate-imports:js"
}
```

### Pre-commit Hook
```bash
# Add to .husky/pre-commit or similar
npm run validate-imports:js
```

## Output Examples

### Success Case
```
🔍 Starting import validation (JavaScript version)...

📁 Found 216 files to analyze
📦 Found 547 import statements

📊 Import Validation Summary:
   Files analyzed: 216
   Total imports: 547
   Valid imports: 547
   Invalid imports: 0
   Success rate: 100.0%

✅ All imports are valid! No issues found.
```

### Error Case
```
📊 Import Validation Summary:
   Files analyzed: 216
   Total imports: 550
   Valid imports: 544
   Invalid imports: 6
   Success rate: 98.9%

❌ Found 6 invalid imports:
==========================================
  src/components/Button.tsx:3
    Import: "@/lib/missing-util"
  src/pages/api/test.ts:2
    Import: "./non-existent-file"
```

## Common Issues and Solutions

### Issue: TypeScript Path Mapping Not Found
```
Error: TypeScript path mapping not resolved: @/lib/service
```
**Solution:** Ensure the file exists at `src/lib/service.ts` or similar

### Issue: Relative Import Not Found
```
Error: File not found: ./missing-component
```
**Solution:** Check the relative path and file extensions

### Issue: NPM Package Not Found
```
Error: Node module not found: @some/package
```
**Solution:** Install the package with `npm install @some/package`

## Configuration

### TypeScript Path Mappings
The script reads `tsconfig.json` to understand path mappings:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### File Extensions
Default extensions checked: `.ts`, `.tsx`, `.js`, `.jsx`, `.json`

### Exclude Patterns
Default excluded directories can be modified in the script:
```javascript
this.excludePatterns = [
  'node_modules',
  '.next',
  '.git',
  // ... add more as needed
];
```

## Integration with File Organization Refactor

This script is part of the file organization refactor project and should be run:

1. **Before moving files** - Establish baseline
2. **After each phase** - Validate no imports were broken
3. **Before committing** - Ensure all imports resolve
4. **In CI/CD pipeline** - Prevent broken imports from being merged

## Exit Codes

- `0` - All imports are valid
- `1` - Invalid imports found or script error

This makes it suitable for use in CI/CD pipelines and pre-commit hooks.