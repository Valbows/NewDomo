# Project Guidelines for Claude Code

## Branch Strategy & Environments

| Branch | Environment | Console Logging |
|--------|-------------|-----------------|
| `refactor_claude_code` | Development | Allowed freely |
| `production_ready` | Production | Must be removed or disabled |
| `staging` (future) | Staging | Minimal logging only |

## Logging Rules

### Development (`refactor_claude_code`)
- `console.log`, `console.debug`, `console.info` allowed for debugging
- No restrictions on logging

### Production (`production_ready`)
- **Remove all `console.log` statements** when merging/pushing to this branch
- `console.error` and `console.warn` acceptable for error handling

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
3. **When merging to `production_ready`**: Claude Code MUST automatically remove all `console.log` statements (keep `console.error`/`console.warn` and NODE_ENV-wrapped logs)

### Claude Code Merge Checklist for Production
When user requests merge to `production_ready`, Claude Code will:
1. Checkout `production_ready` branch
2. Merge from source branch
3. **Automatically find and remove all bare `console.log` statements**
4. Keep: `console.error`, `console.warn`, and `if (process.env.NODE_ENV !== 'production')` wrapped logs
5. Commit with message noting console.log cleanup
6. Push to remote

## Code Quality Rules

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
