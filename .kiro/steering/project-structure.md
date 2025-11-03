# Domo AI Project Structure Guidelines

## Core Development Rules

1. **Documentation Organization**: All documentation files belong in `docs/` folder, never create duplicates in root directory. **Exception**: One comprehensive `README.md` is allowed in the root folder for GitHub project overview and initial user guidance.

2. **Environment File Management**:

   - ONLY use these three environment files: `.env.development`, `.env.staging`, `.env.production`
   - `.env.development` replaces `.env.local` for local development and testing
   - NEVER create `.env.local`, `.env`, or other environment files
   - All code must reference the appropriate environment file based on NODE_ENV
   - Jest and other tools should load `.env.development` for local testing

3. **File Reuse**: Always check existing documentation in `docs/` and scripts in `scripts/` before creating new files.

4. **Code Size Management**: 
   - **STRICT LIMIT**: All files must be between 300-500 lines maximum
   - **Refactoring Required**: Any file exceeding 500 lines must be immediately refactored into smaller, focused modules
   - **Optimal Range**: Target 300-400 lines for maintainability
   - **Exceptions**: Only configuration files (package.json, etc.) are exempt from this rule

5. **Developer Comments**: Write clear comments in all created files explaining purpose, usage, and key functionality for other developers.

6. **Testing & Debugging**: Debug and test every new feature or function before moving on - it must pass all checks and work correctly.

7. **Script Organization**: All SQL files belong in `scripts/` folder with descriptive names following `supabase-table-name.sql` pattern.

8. **Architecture Compliance**: Follow the established domain-driven architecture with service layer separation and component organization patterns.

9. **Code Duplication Prevention**: Always check for existing code before implementing new functionality and perform cleanup to remove duplicates when possible.

10. **File & Folder Movement Authorization**: Always ask for user permission and provide clear explanation before moving or removing any files or folders from their current location.

11. **Creation Authorization & Reuse**: Before creating new files or folders, ask for user permission and suggest using existing resources when possible.

12. **Test Organization Compliance**: ALL test files must be placed in `__tests__/` directory with appropriate subdirectories (unit/, integration/, e2e/, lib/, etc.).

13. **Root Directory Cleanliness**: STRICTLY maintain a clean root directory. Only essential configuration files are allowed. Screenshots, temporary files, backup files, and loose documentation are PROHIBITED.

14. **Screenshot & Debug File Prevention**: NEVER commit screenshots, debug images, or temporary files to the repository. Use proper debugging tools and documentation instead of screenshots.

15. **Build Cache Management**: Monitor and clean `.next` folder regularly. Use `npm run clean:cache` weekly and `npm run clean:cache:all` before deployments to manage disk space efficiently.

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

#### **Screenshots & Images (ZERO TOLERANCE)**

- ❌ `*.png`, `*.jpg`, `*.jpeg`, `*.gif`, `*.webp` - ANY image files
- ❌ `debug-*.png`, `video-*.png`, `tavus-*.png` - Debug screenshots
- ❌ `*-test-*.png`, `*-screenshot-*.png` - Test screenshots (should go to test-results/)
- ❌ `playwright-*.png`, `*-actual.png`, `*-diff.png` - Playwright artifacts
- ❌ `*.webm`, `*.mp4` - Test videos (should go to test-results/)
- ❌ `*-trace.zip` - Playwright traces (should go to test-results/)
- ❌ ANY visual debugging artifacts

#### **Documentation Files**

- ❌ `*.md` files except `README.md` → Move to `docs/`
- ❌ `IMPLEMENTATION_SUMMARY.md` → `docs/IMPLEMENTATION_SUMMARY.md`
- ❌ `DEPLOYMENT_GUIDE.md` → `docs/DEPLOYMENT_GUIDE.md`
- ❌ `GUARDRAILS.md` → `docs/GUARDRAILS.md`

#### **Script Files**

- ❌ `*.sh`, `*.js` executable scripts → Move to `scripts/`
- ❌ `setup-*.js` → `scripts/setup-*.js`
- ❌ `validate-*.js` → `scripts/validate-*.js`

#### **Temporary & Backup Files**

- ❌ `*.backup`, `*-old.*`, `*-copy.*` - Backup files
- ❌ `*.log`, `*.tmp`, `*.cache` - Temporary files
- ❌ `data-export.json`, `cvi-components.json` - Exported data
- ❌ `.DS_Store`, `*.swp`, `*.swo` - IDE artifacts

#### **Legacy Configuration**

- ❌ `jest.config.js` → Use `jest.config.cjs`
- ❌ `next.config.js` → Use `next.config.cjs`
- ❌ `postcss.config.js` → Use `postcss.config.cjs`

### 🚨 **Enforcement Actions**

#### **Immediate Removal Required**

1. **Screenshots**: Delete immediately, never commit
2. **Debug files**: Remove and add to `.gitignore`
3. **Backup files**: Delete or move to appropriate location
4. **Loose documentation**: Move to `docs/` folder

#### **Prevention Measures**

1. **Pre-commit hooks**: Check for prohibited files
2. **Regular audits**: Weekly root directory cleanup
3. **Developer education**: Team training on file organization
4. **Automated cleanup**: Scripts to detect and remove violations

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

## Before Creating New Files

1. **Check File Size**: Ensure existing files don't exceed 500 lines before adding new code
2. **Refactor First**: If target file is > 400 lines, refactor before adding new functionality
3. **Use Correct Test Framework**: Jest for unit/integration, Playwright for E2E
4. Check if similar documentation exists in `docs/`
5. Check if similar scripts exist in `scripts/`
6. Update existing files rather than creating duplicates
7. Follow the established naming conventions
8. Add comprehensive comments for developer understanding
9. **NEVER** add screenshots or debug images to root directory

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
import { describe, it, expect } from '@jest/globals';

// ❌ Wrong - Don't use Vitest
import { describe, it, expect } from 'vitest';

// ✅ Correct mocking
jest.mock('@/lib/supabase');

// ❌ Wrong - Don't use vi
vi.mock('@/lib/supabase');
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
