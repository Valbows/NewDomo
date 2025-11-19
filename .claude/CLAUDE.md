# Project Guidelines for Claude Code

## Branch Strategy & Environments

| Branch | Environment | Console Logging |
|--------|-------------|-----------------|
| `refactor_claude_code` | Development | Allowed freely |
| `staging` | Staging/Testing | NODE_ENV wrapped only |
| `production_ready` | Production | Must be removed completely |

### Three-Branch Workflow
```
refactor_claude_code → staging → production_ready
     (dev)              (test)       (live)
```

## Logging Rules

### Development (`refactor_claude_code`)
- `console.log`, `console.debug`, `console.info` allowed for debugging
- No restrictions on logging

### Staging (`staging`)
- **Remove verbose debug logs** (emoji spam, temporary traces)
- **Keep NODE_ENV wrapped logs** for diagnostics
- `console.error` and `console.warn` acceptable

### Production (`production_ready`)
- **Remove ALL `console.log` statements** including NODE_ENV wrapped
- Only `console.error` and `console.warn` allowed

### Hybrid Safety Net (NODE_ENV)
For critical diagnostic logs that must work in both branches, use:
```typescript
if (process.env.NODE_ENV !== 'production') {
  console.log('Important diagnostic info');
}
```
- These logs appear in dev (`npm run dev`) but are silenced in production builds
- Use sparingly for important diagnostics (e.g., state transitions, error recovery)
- **NOT a replacement for removing debug logs** - still clean up verbose/temporary logs

### What to Remove vs Keep
**REMOVE when merging to production:**
- Verbose debug logs (emoji spam, state dumps)
- Temporary debugging statements
- Development-only traces

**KEEP with NODE_ENV check:**
- Critical state transition logs
- Error recovery diagnostics
- Feature flow confirmations

## Branch Workflow

1. **Always confirm current branch** before editing code
2. **Never create new branches** unless explicitly requested
3. **Follow three-branch flow**: `refactor_claude_code` → `staging` → `production_ready`

### Claude Code Merge Checklist for Staging
When user requests merge to `staging`, Claude Code will:
1. Checkout `staging` branch
2. Merge from `refactor_claude_code`
3. **Remove verbose/emoji debug logs** (bare console.logs)
4. **Keep**: `console.error`, `console.warn`, NODE_ENV-wrapped logs
5. Commit with message noting cleanup
6. Push to remote

### Claude Code Merge Checklist for Production
When user requests merge to `production_ready`, Claude Code will:
1. Checkout `production_ready` branch
2. Merge from `staging`
3. **Remove ALL console.log statements** (including NODE_ENV wrapped)
4. **Keep only**: `console.error`, `console.warn`
5. Commit with message noting console.log cleanup
6. Push to remote

## Code Quality Rules

### Folder Organization
Keep root folder clean with only standard files:

**Allowed in root:**
- `README.md` (only documentation file allowed)
- Configuration files (`.eslintrc`, `package.json`, `tsconfig.json`, etc.)
- Standard folders (`src/`, `public/`, `node_modules/`, etc.)

**Move to proper folders:**
- All documentation → `docs/`
- All scripts → `scripts/`
- Test files → `__tests__/` or alongside source files

**Never create in root:**
- `*.md` files (except README.md)
- Standalone script files
- Temporary/debug files

### File Size Limits
- **Maximum 500 lines per file** - Refactor if exceeded
- Split large files into smaller, focused modules
- Extract reusable logic into separate utility files

### Testing Requirements
- **After completing any new feature or function, write tests**
- Run `npm run test:all` - must be **100% passing with no skips**
- All tests must complete successfully before committing

### Test Organization
- **Unit/Integration tests**: Include in `npm run test:all`
- **Complex/Real-time data tests**: Keep separate from main test command
  - Tests requiring live API calls
  - Tests with external dependencies
  - Long-running performance tests
  - Create separate scripts like `npm run test:e2e` or `npm run test:integration`

## Automation Options

### Option 1: ESLint Rule (Recommended)
Add to `.eslintrc`:
```json
{
  "rules": {
    "no-console": ["error", { "allow": ["warn", "error"] }]
  },
  "overrides": [{
    "files": ["**/*.dev.ts", "**/*.test.ts"],
    "rules": { "no-console": "off" }
  }]
}
```

### Option 2: Pre-commit Hook
Create `.husky/pre-commit`:
```bash
#!/bin/sh
branch=$(git branch --show-current)
if [ "$branch" = "production_ready" ]; then
  if grep -r "console\.log" --include="*.ts" --include="*.tsx" src/; then
    echo "Error: console.log found in production branch"
    exit 1
  fi
fi
```

### Option 3: Build Script
Add to `package.json`:
```json
{
  "scripts": {
    "build:prod": "NODE_ENV=production && npm run lint:no-console && next build",
    "lint:no-console": "grep -r 'console\\.log' --include='*.ts' --include='*.tsx' src/ && exit 1 || exit 0"
  }
}
```

### Option 4: Babel/SWC Transform
Use `babel-plugin-transform-remove-console` or configure SWC to strip console calls in production builds.

## Quick Reference

```bash
# Check current branch
git branch --show-current

# Find console.log statements
grep -r "console\.log" --include="*.ts" --include="*.tsx" src/

# Remove console.log (use with caution)
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' '/console\.log/d'
```
