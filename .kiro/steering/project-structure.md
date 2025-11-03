# Domo AI Project Structure Guidelines

## 🚨 CRITICAL: Git Add Authorization Required

**MANDATORY RULE**: No `git add` commands without explicit permission. Always request approval before staging any changes to the repository.

## Core Development Rules

1. **Git Add Authorization**: **NEVER** stage code without explicit permission. Always request approval and wait for "yes" before executing `git add`.

2. **Documentation Organization**: All documentation files belong in `docs/` folder, never create duplicates in root directory. **Exception**: One comprehensive `README.md` is allowed in the root folder for GitHub project overview and initial user guidance.

3. **Environment File Management**:

   - ONLY use these three environment files: `.env.development`, `.env.staging`, `.env.production`
   - `.env.development` replaces `.env.local` for local development and testing
   - NEVER create `.env.local`, `.env`, or other environment files
   - All code must reference the appropriate environment file based on NODE_ENV
   - Jest and other tools should load `.env.development` for local testing

4. **File Reuse**: Always check existing documentation in `docs/` and scripts in `scripts/` before creating new files.

5. **Code Size Management**:

   - **STRICT LIMIT**: All files must be between 300-500 lines maximum
   - **Refactoring Required**: Any file exceeding 500 lines must be immediately refactored into smaller, focused modules
   - **Optimal Range**: Target 300-400 lines for maintainability
   - **Exceptions**: Only configuration files (package.json, etc.) are exempt from this rule

6. **Developer Comments**: Write clear comments in all created files explaining purpose, usage, and key functionality for other developers.

7. **Testing & Debugging**: Debug and test every new feature or function before moving on - it must pass all checks and work correctly.

8. **Script Organization**: All SQL files belong in `scripts/` folder with descriptive names following `supabase-table-name.sql` pattern.

9. **Architecture Compliance**: Follow the established domain-driven architecture with service layer separation and component organization patterns.

10. **Code Duplication Prevention**: Always check for existing code before implementing new functionality and perform cleanup to remove duplicates when possible.

11. **File & Folder Movement Authorization**: Always ask for user permission and provide clear explanation before moving or removing any files or folders from their current location.

12. **Creation Authorization & Reuse**: Before creating new files or folders, ask for user permission and suggest using existing resources when possible.

13. **Test Organization Compliance**: ALL test files must be placed in `__tests__/` directory with appropriate subdirectories (unit/, integration/, e2e/, lib/, etc.).

14. **Root Directory Cleanliness**: STRICTLY maintain a clean root directory. Only essential configuration files are allowed. Screenshots, temporary files, backup files, and loose documentation are PROHIBITED.

15. **Screenshot & Debug File Prevention**: NEVER commit screenshots, debug images, or temporary files to the repository. Use proper debugging tools and documentation instead of screenshots.

16. **Build Cache Management**: Monitor and clean `.next` folder regularly. Use `npm run clean:cache` weekly and `npm run clean:cache:all` before deployments to manage disk space efficiently.

## Code Size Management Rules

### **File Size Limits (STRICTLY ENFORCED)**

- **Maximum**: 500 lines per file
- **Target Range**: 300-400 lines for optimal maintainability
- **Minimum**: 50 lines (avoid overly fragmented files)

### **Refactoring Triggers**

- **Immediate Action Required**: Any file > 500 lines
- **Consider Refactoring**: Files > 400 lines
- **Monitor**: Files approaching 350 lines

### **Refactoring Strategies**

1. **Extract Utility Functions**: Move helper functions to separate utils files
2. **Separate Types**: Create dedicated types.ts files for interfaces
3. **Component Decomposition**: Break large components into smaller, focused ones
4. **Service Layer**: Extract business logic into service classes
5. **Data Layer**: Separate data fetching/processing logic

### **File Organization Patterns**

```
feature/
├── index.ts              # Main exports (< 50 lines)
├── Component.tsx         # Main component (300-400 lines)
├── types.ts             # TypeScript interfaces (< 200 lines)
├── utils.ts             # Helper functions (< 300 lines)
├── service.ts           # Business logic (< 400 lines)
└── components/          # Sub-components if needed
    ├── SubComponent1.tsx
    └── SubComponent2.tsx
```

## Key Documentation Files

- `docs/GUARDRAILS.md` - Tavus guardrails implementation
- `docs/DEPLOYMENT_GUIDE.md` - Deployment instructions
- `docs/MANUAL_TESTING_GUIDE.md` - Testing procedures
- `docs/architecture/README.md` - Architecture overview
- `docs/plan.md` - Project roadmap and requirements

## Root Directory Policy

### ✅ ALLOWED in Root Directory

#### **Essential Configuration Files**

- `package.json`, `package-lock.json` - Node.js dependencies
- `tsconfig.json` - TypeScript configuration
- `next.config.cjs` - Next.js configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `eslint.config.js` - ESLint configuration
- `jest.config.cjs`, `jest.config.dom.cjs`, `jest.config.node.cjs` - Jest configurations
- `postcss.config.cjs` - PostCSS configuration
- `playwright.config.ts`, `playwright.real.config.ts` - Playwright configurations

#### **Environment & Setup Files**

- `.env.example`, `.env.development`, `.env.staging`, `.env.production` - Environment templates
- `.gitignore`, `.dockerignore` - Git/Docker ignore files
- `README.md` - Main project documentation (ONLY ONE ALLOWED)
- `next-env.d.ts` - Next.js TypeScript definitions

#### **Build & Development Files**

- `jest.setup.js`, `jest.setup.node.js`, `jest.env.js` - Jest setup files
- `docker-compose.yml`, `Dockerfile` - Docker configuration
- `render.yaml` - Deployment configuration

#### **Build Output Directories (Auto-generated, Git-ignored)**

- `.next/` - Next.js build output (~409MB, clean regularly with `npm run clean:cache`)
- `.swc/` - SWC compiler cache and plugins (auto-managed by Next.js)
- `test-artifacts/` - Consolidated test artifacts directory
  - `test-artifacts/results/` - Playwright test artifacts (screenshots, videos, traces)
  - `test-artifacts/reports/` - HTML test reports
- `node_modules/` - Dependencies (auto-generated from package.json)
- `dist/`, `build/` - Build output directories (if used)
- `coverage/` - Test coverage reports (auto-generated)

### ❌ STRICTLY PROHIBITED in Root Directory

#### **🚨 ZERO TOLERANCE POLICY - IMMEDIATE REMOVAL REQUIRED**

Any file in the following categories found in root directory must be immediately moved or deleted:

#### **Documentation Files (ZERO TOLERANCE)**

- ❌ **ANY** `*.md` files except `README.md` → **MUST** move to `docs/`
- ❌ `log.md`, `changelog.md`, `notes.md` → `docs/log.md`, `docs/changelog.md`, `docs/notes.md`
- ❌ `IMPLEMENTATION_SUMMARY.md` → `docs/IMPLEMENTATION_SUMMARY.md`
- ❌ `DEPLOYMENT_GUIDE.md` → `docs/DEPLOYMENT_GUIDE.md`
- ❌ `GUARDRAILS.md` → `docs/GUARDRAILS.md`
- ❌ `TODO.md`, `ROADMAP.md`, `FEATURES.md` → `docs/TODO.md`, `docs/ROADMAP.md`, `docs/FEATURES.md`
- ❌ `API.md`, `ARCHITECTURE.md` → `docs/API.md`, `docs/ARCHITECTURE.md`

#### **Screenshots & Images (ZERO TOLERANCE)**

- ❌ `*.png`, `*.jpg`, `*.jpeg`, `*.gif`, `*.webp` - ANY image files
- ❌ `debug-*.png`, `video-*.png`, `tavus-*.png` - Debug screenshots
- ❌ `*-test-*.png`, `*-screenshot-*.png` - Test screenshots (should go to test-results/)
- ❌ `playwright-*.png`, `*-actual.png`, `*-diff.png` - Playwright artifacts
- ❌ `*.webm`, `*.mp4` - Test videos (should go to test-results/)
- ❌ `*-trace.zip` - Playwright traces (should go to test-results/)
- ❌ ANY visual debugging artifacts

#### **Script Files (ZERO TOLERANCE)**

- ❌ `*.sh`, `*.js` executable scripts → **MUST** move to `scripts/`
- ❌ `setup-*.js` → `scripts/setup-*.js`
- ❌ `validate-*.js` → `scripts/validate-*.js`
- ❌ `build-*.sh`, `deploy-*.sh` → `scripts/build-*.sh`, `scripts/deploy-*.sh`
- ❌ `test-*.js`, `seed-*.js` → `scripts/test-*.js`, `scripts/seed-*.js`

#### **Log & Data Files (ZERO TOLERANCE)**

- ❌ `*.log`, `*.tmp`, `*.cache` - Temporary files → Delete or move to appropriate location
- ❌ `data-export.json`, `cvi-components.json` - Exported data → Move to `data/` or delete
- ❌ `debug.json`, `output.json`, `results.json` → Move to appropriate folder or delete
- ❌ `*.csv`, `*.xlsx`, `*.sql` - Data files → Move to `data/` or `scripts/`

#### **Temporary & Backup Files (ZERO TOLERANCE)**

- ❌ `*.backup`, `*-old.*`, `*-copy.*` - Backup files → Delete immediately
- ❌ `*-backup`, `*-temp`, `*-tmp` - Temporary files → Delete immediately
- ❌ `.DS_Store`, `*.swp`, `*.swo` - IDE artifacts → Delete immediately
- ❌ `Thumbs.db`, `desktop.ini` - OS artifacts → Delete immediately

#### **Legacy Configuration (ZERO TOLERANCE)**

- ❌ `jest.config.js` → Use `jest.config.cjs`
- ❌ `next.config.js` → Use `next.config.cjs`
- ❌ `postcss.config.js` → Use `postcss.config.cjs`
- ❌ `.env.local`, `.env` → Use `.env.development`

#### **Development Artifacts (ZERO TOLERANCE)**

- ❌ `*.patch`, `*.diff` - Patch files → Move to `patches/` or delete
- ❌ `*.orig`, `*.rej` - Merge conflict artifacts → Delete immediately
- ❌ `package-lock.json.bak` - Backup package locks → Delete immediately

### 🚨 **ENFORCEMENT ACTIONS**

#### **🔥 IMMEDIATE REMOVAL PROTOCOL**

When ANY prohibited file is found in root directory:

1. **STOP ALL WORK** - Do not proceed with other tasks
2. **IDENTIFY VIOLATION** - Determine file type and correct location
3. **TAKE ACTION** - Follow appropriate remediation steps below
4. **VERIFY COMPLIANCE** - Ensure root directory is clean before continuing

#### **📋 REMEDIATION STEPS BY FILE TYPE**

##### **Documentation Files (`*.md`)**

```bash
# REQUIRED ACTION: Move to docs/
mv filename.md docs/filename.md
git add docs/filename.md
git rm filename.md
```

##### **Script Files (`*.sh`, `*.js` executables)**

```bash
# REQUIRED ACTION: Move to scripts/
mv script-name.js scripts/script-name.js
git add scripts/script-name.js
git rm script-name.js
```

##### **Images & Screenshots**

```bash
# REQUIRED ACTION: Delete immediately
rm *.png *.jpg *.jpeg *.gif *.webp
git rm *.png *.jpg *.jpeg *.gif *.webp
# Add to .gitignore if needed
echo "*.png" >> .gitignore
```

##### **Temporary & Backup Files**

```bash
# REQUIRED ACTION: Delete immediately
rm *.backup *-old.* *-copy.* *.tmp *.log
git rm *.backup *-old.* *-copy.* *.tmp *.log
```

##### **Data Files**

```bash
# REQUIRED ACTION: Move to data/ or delete
mkdir -p data/
mv *.json *.csv *.xlsx data/
git add data/
git rm *.json *.csv *.xlsx
```

#### **🛡️ PREVENTION MEASURES**

##### **1. Pre-Creation Checklist**

Before creating ANY new file in root directory, ask:

- ✅ Is this an essential configuration file?
- ✅ Is this file listed in the ALLOWED section?
- ✅ Does this file belong in `docs/`, `scripts/`, or another folder?
- ✅ Will this file be needed by the build process or deployment?

##### **2. Automated Detection Script**

```bash
# Available in package.json scripts:
npm run check:root  # Validates root directory compliance
```

**Usage:**

```bash
# Check compliance before committing
npm run check:root

# Should output:
✅ Root directory is compliant with project structure guidelines!
```

##### **3. Git Pre-commit Hook**

```bash
#!/bin/sh
# .git/hooks/pre-commit
node scripts/check-root-directory.js
if [ $? -ne 0 ]; then
  echo "❌ Root directory contains prohibited files. Fix before committing."
  exit 1
fi
```

##### **4. Regular Audits**

- **Daily**: Check root directory before starting work
- **Weekly**: Run `npm run check:root` to validate compliance
- **Monthly**: Review and update prohibited file patterns

#### **🎯 COMPLIANCE VERIFICATION**

##### **Root Directory Should Only Contain:**

```
✅ package.json, package-lock.json
✅ tsconfig.json, next.config.cjs
✅ tailwind.config.js, eslint.config.js
✅ jest.config.cjs, playwright.config.ts
✅ .env.example, .env.development, .env.staging, .env.production
✅ .gitignore, .dockerignore
✅ README.md (ONLY ONE)
✅ next-env.d.ts
✅ jest.setup.js, docker-compose.yml, render.yaml
✅ Auto-generated directories: .next/, node_modules/, coverage/
```

##### **Quick Compliance Check:**

```bash
# Count non-config files in root (should be minimal)
ls -la | grep -v "^d" | grep -v "package\|tsconfig\|next.config\|tailwind\|eslint\|jest\|playwright\|\.env\|\.git\|README\|docker\|render" | wc -l

# Should return 0 or very low number
```

#### **🚨 ESCALATION PROCESS**

##### **If Violations Persist:**

1. **First Violation**: Immediate cleanup + documentation review
2. **Second Violation**: Team discussion on file organization
3. **Third Violation**: Implement automated enforcement tools
4. **Ongoing Issues**: Review and strengthen project structure guidelines

##### **Emergency Cleanup Command:**

```bash
# Nuclear option - use with caution
npm run clean:root:emergency
```

This will automatically move/delete common violations according to the rules above.

## Testing Framework Guidelines

### **IMPORTANT: Jest Only - No Vitest**

- **Primary Test Runner**: Jest (configured via `jest.config.cjs`)
- **DO NOT** add Vitest configurations (`vitest.config.*`)
- **DO NOT** use Vitest imports (`import { describe } from 'vitest'`)
- **USE** Jest imports (`import { describe } from '@jest/globals'`)

### **Test Environment Setup**

```
Testing Stack:
├── Jest - Unit & Integration tests
├── Playwright - End-to-end tests
├── React Testing Library - Component testing
└── MSW - API mocking
```

### **Test File Organization**

```
__tests__/
├── unit/                    # Jest unit tests
├── integration/             # Jest integration tests
├── e2e/                     # Playwright E2E tests
└── lib/                     # Test utilities
```

### **Test Commands**

- `npm run test` - All tests
- `npm run test:unit` - Unit tests only
- `npm run test:integration` - Integration tests only
- `npm run test:e2e` - End-to-end tests only

### **Configuration Files**

- `jest.config.cjs` - Main Jest configuration
- `jest.config.dom.cjs` - DOM environment tests
- `jest.config.node.cjs` - Node.js environment tests
- `playwright.config.ts` - E2E test configuration

## Git Add Authorization Protocol

### 🚨 **MANDATORY: No Git Add Without Explicit Permission**

#### **STRICT RULE: All code changes require review and approval before staging**

##### **Before ANY `git add` command:**

1. **STOP** - Do not add files automatically
2. **REVIEW** - Examine all changes made in this session
3. **REQUEST** - Ask for explicit permission to stage changes
4. **WAIT** - Do not proceed until receiving clear "yes" approval

##### **Required Review Process:**

```bash
# 1. Show what will be staged
git status
git diff

# 2. List all modified files
git diff --name-only

# 3. Request permission with summary
"I have made the following changes:
- [Brief description of changes]
- [Files modified: list each file]
- [Purpose/reason for changes]

May I stage these changes with git add?"

# 4. Wait for explicit "yes" before proceeding
# Only add after receiving clear approval
```

##### **Approved Add Commands (only after permission):**

```bash
git add .                   # After explicit "yes"
git add filename.ext        # After explicit "yes"
git add -A                  # After explicit "yes"
```

##### **NEVER use these without permission:**

```bash
git add .                   # FORBIDDEN without permission
git add -A                  # FORBIDDEN without permission
git add *                   # FORBIDDEN without permission
git commit -am "message"    # FORBIDDEN (bypasses add review)
```

#### **Exception Handling:**

##### **Emergency Situations Only:**

- Critical production bugs requiring immediate fixes
- Security vulnerabilities needing urgent patches
- Build failures blocking team development

**Even in emergencies:** Still request permission but explain urgency

##### **Violation Consequences:**

1. **First violation**: Review this protocol and acknowledge understanding
2. **Repeated violations**: Implement git hooks to prevent unauthorized pushes
3. **Persistent issues**: Require pull request workflow for all changes

#### **Implementation Safeguards:**

##### **Automated Git Hook Installation:**

```bash
# Install git add hook to enforce authorization
npm run install:hooks

# This creates a git hook that:
# - Intercepts all 'git add' commands
# - Shows summary of changes before staging
# - Requires explicit 'y' confirmation
# - Cancels add if permission not given
# - Provides change summary for permission requests
```

##### **Manual Git Hook Setup (Alternative):**

```bash
# Create git add alias manually
git config alias.add '!echo "🚨 STOP: Git add requires explicit permission"; echo "Have you received approval to stage these changes? (y/N)"; read response; if [ "$response" = "y" ] || [ "$response" = "Y" ]; then git add-original "$@"; else echo "❌ Add cancelled - obtain permission first"; exit 1; fi; #'
```

##### **Safe Development Workflow:**

```bash
# 1. Make changes (editing files)
# ... make your code changes ...

# 2. Review changes before staging
git status
git diff

# 3. Request permission to stage changes
# "May I stage these changes with git add?"

# 4. Only add after receiving "yes"
git add .
git commit -m "description"

# 5. Request permission to push (separate approval)
# "May I push this commit?"

# 6. Only push after receiving second "yes"
git push
```

## Before Creating New Files

1. **Check File Size**: Ensure existing files don't exceed 500 lines before adding new code
2. **Refactor First**: If target file is > 400 lines, refactor before adding new functionality
3. **Use Correct Test Framework**: Jest for unit/integration, Playwright for E2E
4. **Request Push Permission**: Never push without explicit approval
5. Check if similar documentation exists in `docs/`
6. Check if similar scripts exist in `scripts/`
7. Update existing files rather than creating duplicates
8. Follow the established naming conventions
9. Add comprehensive comments for developer understanding
10. **NEVER** add screenshots or debug images to root directory

## Code Size Monitoring

### **Development Workflow**

1. **Before Coding**: Check current file size with `wc -l filename`
2. **During Development**: Monitor line count as you add code
3. **Before Commit**: Verify no files exceed 500 lines
4. **Code Review**: Reject PRs with oversized files

### **Refactoring Checklist**

- [ ] Identify logical boundaries for splitting
- [ ] Extract reusable utilities
- [ ] Separate types and interfaces
- [ ] Create focused sub-components
- [ ] Maintain clear imports/exports
- [ ] Update documentation
- [ ] Test functionality after refactoring

## Current Code Architecture

### Domain-Driven Structure

```
src/
├── app/api/                    # API routes by domain
│   ├── admin/                  # Administrative functions
│   ├── auth/                   # Authentication
│   ├── demos/                  # Demo management
│   ├── tavus/                  # Tavus integration
│   └── webhooks/               # Webhook processing
├── components/                 # React components
│   ├── ui/                     # Reusable UI components (atoms/molecules)
│   ├── features/               # Feature-specific components (organisms)
│   └── layout/                 # Layout components (templates)
├── lib/services/               # Business logic services
│   ├── auth/                   # Authentication services
│   ├── demos/                  # Demo services
│   ├── tavus/                  # Tavus services
│   └── webhooks/               # Webhook services
└── lib/utils/                  # Shared utilities
    ├── supabase/               # Database utilities
    ├── security/               # Security functions
    └── validation/             # Validation helpers
```

### Architecture Layers

1. **Presentation Layer**: React components (ui/, features/, layout/)
2. **API Layer**: Next.js routes organized by domain (app/api/)
3. **Service Layer**: Business logic (lib/services/)
4. **Data Layer**: Supabase integration (lib/supabase/)
5. **Integration Layer**: External APIs (lib/tavus/, lib/elevenlabs/)

## Refactoring Success Example: Reporting System

### **Before Refactoring**

- Single `Reporting.tsx` file: **613 lines** ❌
- Violated size limits
- Hard to maintain and test

### **After Refactoring**

```
reporting/
├── Reporting.tsx           # 146 lines ✅ (Main container)
├── types.ts               # 77 lines ✅ (Interfaces)
├── utils.ts               # 107 lines ✅ (Helper functions)
├── data-service.ts        # 127 lines ✅ (Data fetching)
├── ConversationList.tsx   # 143 lines ✅ (List component)
├── ConversationDetails.tsx # 110 lines ✅ (Detail component)
└── [existing cards]       # All under 230 lines ✅
```

### **Benefits Achieved**

- **Maintainability**: Easy to find and modify specific functionality
- **Testability**: Smaller, focused modules with comprehensive Jest tests
- **Reusability**: Components can be used elsewhere
- **Clarity**: Single responsibility per file
- **Compliance**: All files under 500-line limit

## Testing Best Practices

### **Writing New Tests**

1. **Unit Tests**: Use Jest with `@jest/globals` imports
2. **Component Tests**: Use React Testing Library with Jest
3. **E2E Tests**: Use Playwright for full user workflows
4. **API Tests**: Use MSW for mocking external services

### **Test File Naming**

- Unit tests: `*.test.ts` or `*.test.tsx`
- Integration tests: `*.integration.test.ts`
- E2E tests: `*.spec.ts` (Playwright convention)

### **Common Testing Patterns**

```typescript
// ✅ Correct Jest import
import { describe, it, expect } from "@jest/globals";

// ❌ Wrong - Don't use Vitest
import { describe, it, expect } from "vitest";

// ✅ Correct mocking
jest.mock("@/lib/supabase");

// ❌ Wrong - Don't use vi
vi.mock("@/lib/supabase");
```

### Key Principles

- **Domain Organization**: Group by business functionality, not file type
- **Service Layer**: Extract business logic from API routes and components
- **Component Hierarchy**: UI (reusable) → Features (business logic) → Layout (structure)
- **Single Responsibility**: Each module has one clear purpose
- **Type Safety**: TypeScript interfaces and validation throughout
- **Test Organization**: ALL tests belong in `__tests__/` directory with subdirectories for different test types

## Proper Debugging & Documentation Alternatives

### ❌ Instead of Screenshots, Use:

#### **For UI Issues**

- ✅ **Playwright traces**: `npx playwright show-trace trace.zip`
- ✅ **Browser DevTools**: Network/Console logs in text format
- ✅ **Component tests**: Automated visual regression tests
- ✅ **Storybook**: Component documentation and testing

#### **For API Issues**

- ✅ **API logs**: Structured logging with timestamps
- ✅ **Postman collections**: Shareable API test cases
- ✅ **Integration tests**: Automated API testing
- ✅ **OpenAPI specs**: API documentation

#### **For Database Issues**

- ✅ **SQL queries**: Copy-paste actual queries and results
- ✅ **Database migrations**: Version-controlled schema changes
- ✅ **Seed data**: Reproducible test data scripts

#### **For Documentation**

- ✅ **Markdown files**: Text-based documentation in `docs/`
- ✅ **Code comments**: Inline explanations
- ✅ **README sections**: Setup and usage instructions
- ✅ **Architecture diagrams**: Text-based diagrams (Mermaid, ASCII)

### 📁 **Proper File Organization Examples**

```
✅ CORRECT STRUCTURE:
├── docs/
│   ├── api-integration-guide.md
│   ├── troubleshooting.md
│   └── images/              # Only if absolutely necessary
│       └── architecture.png
├── scripts/
│   ├── debug-api.js
│   └── validate-setup.js
└── README.md               # Only essential project info

❌ INCORRECT STRUCTURE:
├── debug-screenshot.png    # NEVER!
├── api-test-results.png    # NEVER!
├── setup-guide.md          # Move to docs/
└── validate.js             # Move to scripts/
```
