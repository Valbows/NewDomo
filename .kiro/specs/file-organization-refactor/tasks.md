# File Organization Refactor - Implementation Plan

## Current Status Assessment

✅ **COMPLETED:**

- Basic test directory structure exists (`__tests__/unit/`, `__tests__/integration/`, `__tests__/e2e/`)
- Jest configuration partially set up for new structure
- Large files identified for refactoring (8 files over 300 lines)
- Current API structure analyzed (40+ flat routes need organization)

## Implementation Tasks (Priority Order)

### Phase 1: Test Consolidation and Validation Setup

**Goal: Consolidate scattered test files into unified structure**

#### Task 1.1: Create unified test directory structure

- [x] Create `__tests__/unit/`, `__tests__/integration/`, `__tests__/e2e/` directories
- [x] Test configuration partially set up for new structure
- _Requirements: 2.1, 2.3_

#### Task 1.2: Complete test consolidation

- [x] Move remaining tests from `src/tests/` to `__tests__/unit/`
- Move e2e tests from `e2e/` directory to `__tests__/e2e/`
- Remove empty `src/__tests__/` directory
- _Requirements: 2.1, 2.2_

#### Task 1.3: Update test configurations and imports

- [x] Update Jest configuration to include all test locations
- Fix test import paths after moves
- Update package.json test scripts for new structure
- _Requirements: 2.2, 2.4_

#### Task 1.4: Create import validation script

- [x] Write script to check all imports resolve correctly
- Add to package.json as validation command
- _Requirements: 4.4_

#### Task 1.5: Verify test consolidation

- [x] Run full test suite to ensure all tests pass
- Validate no tests were lost in migration
- _Requirements: 2.1, 2.2_

### Phase 2: Business Logic Extraction

**Goal: Extract business logic from API handlers into service layer**

#### Task 2.1: Create service layer structure

- [ ] Create `src/lib/services/` directory structure
- Set up domain-specific service directories (auth, demos, tavus, webhooks)
- _Requirements: 3.1, 3.2_

#### Task 2.2: Extract authentication business logic

- [ ] Identify auth-related API handlers (sign-in, setup-test-user, etc.)
- Move auth logic from API handlers to `src/lib/services/auth/`
- Create auth service interfaces and implementations
- Update API handlers to use auth services
- _Requirements: 3.1, 3.3_

#### Task 2.3: Extract demo management business logic

- [ ] Extract logic from demos API routes and create-agent routes
- Move demo logic from API handlers to `src/lib/services/demos/`
- Create demo service interfaces and implementations
- Update API handlers to use demo services
- _Requirements: 3.1, 3.3_

#### Task 2.4: Extract Tavus integration business logic

- [ ] Consolidate existing Tavus logic from `src/lib/tavus/` and API handlers
- Move Tavus logic from API handlers to `src/lib/services/tavus/`
- Create unified Tavus service interfaces
- Update API handlers to use Tavus services
- _Requirements: 3.1, 3.3_

#### Task 2.5: Extract webhook business logic

- [ ] Extract logic from tavus-webhook and webhook API handlers
- Move webhook logic from API handlers to `src/lib/services/webhooks/`
- Create webhook service interfaces and implementations
- Update API handlers to use webhook services
- _Requirements: 3.1, 3.3_

#### Task 2.6: Validate business logic extraction

- [ ]\* Run API tests to ensure all endpoints still work
- Verify no functionality was lost in extraction
- _Requirements: 3.3, 3.5_

### Phase 3: API Route Organization

**Goal: Organize 40+ flat API routes into domain-based structure**

#### Task 3.1: Plan API route restructuring

- [ ] Map current 40+ flat API routes to new domain-based structure
- Identify routes that need URL compatibility layers
- Create migration plan for existing endpoints
- _Requirements: 1.1, 1.3_

#### Task 3.2: Reorganize authentication API routes

- [ ] Move setup-test-user, check-current-persona to `src/app/api/auth/`
- Update route handlers to use extracted services
- _Requirements: 1.1, 1.2_

#### Task 3.3: Reorganize demo management API routes

- [ ] Consolidate create-agent, create-enhanced-agent, create-test-demo routes
- Move to organized structure under `src/app/api/demos/`
- Update route handlers to use extracted services
- _Requirements: 1.1, 1.2_

#### Task 3.4: Reorganize Tavus integration API routes

- [ ] Move tavus, tavus-webhook, start-conversation, end-conversation routes
- Organize under `src/app/api/tavus/`
- Update route handlers to use extracted services
- _Requirements: 1.1, 1.2_

#### Task 3.5: Reorganize webhook API routes

- [ ] Move webhook, track-cta-click, and webhook-url routes
- Organize under `src/app/api/webhooks/`
- Update route handlers to use extracted services
- _Requirements: 1.1, 1.2_

#### Task 3.6: Reorganize admin/debug API routes

- [ ] Move debug-_, test-_, check-_, verify-_ routes to `src/app/api/admin/`
- Group by functionality (debug, testing, verification)
- Update route handlers to use extracted services
- _Requirements: 1.1, 1.2_

#### Task 3.7: Validate API route organization

- [ ]\* Test all API endpoints to ensure they still work
- Verify URL compatibility is maintained
- _Requirements: 1.3, 1.5_

### Phase 4: Utility and Component Organization

**Goal: Consolidate utilities and organize components by domain**

#### Task 4.1: Consolidate utility modules

- [ ] Merge duplicate supabase utilities (`src/lib/supabase.ts` vs `src/utils/supabase/server.ts`)
- Consolidate security utilities under `src/lib/utils/security/`
- Organize utilities by domain and purpose
- Update all utility imports across the codebase
- _Requirements: 4.1, 4.2, 4.4_

#### Task 4.2: Reorganize React components

- [ ] Create `src/components/ui/`, `src/components/features/`, `src/components/layout/`
- Categorize existing 20+ components by type and domain
- Move CVI components to features/cvi structure
- Update component imports across the application
- _Requirements: 5.1, 5.2, 5.5_

#### Task 4.3: Create component co-location structure

- [ ] Group related component files (styles, tests, types) together
- Organize CVI components with proper co-location
- Update component organization to follow atomic design principles
- _Requirements: 5.3, 5.4_

#### Task 4.4: Update import paths and create barrel exports

- [ ] Add TypeScript path mapping for clean imports
- Create index.ts files for barrel exports
- Update all imports to use new path structure
- _Requirements: 4.4, 5.5_

#### Task 4.5: Validate component and utility organization

- [ ]\* Build application to ensure all imports resolve
- Run component tests to verify functionality
- _Requirements: 4.4, 5.5_

### Phase 5: Large File Refactoring

**Goal: Break down 8 files over 300 lines into focused modules**

#### Task 5.1: Identify large files for refactoring

- [x] Files identified: Reporting.tsx (1347 lines), experience/page.tsx (880 lines), tavus-webhook/handler.ts (693 lines), configure/page.tsx (622 lines), create-enhanced-agent/route.ts (471 lines), toolParser.ts (453 lines), objectives-templates.ts (416 lines), CustomObjectivesManager.tsx (404 lines)
- [x] Prioritized by complexity and change frequency
- _Requirements: 6.1, 6.2_

#### Task 5.2: Refactor large API handlers and business logic files

- [ ] Split tavus-webhook/handler.ts (693 lines) into focused modules
- Refactor create-enhanced-agent/route.ts (471 lines) and extract business logic
- Break down objectives-templates.ts (416 lines) into smaller modules
- Maintain existing functionality and interfaces
- _Requirements: 6.2, 6.3, 6.5_

#### Task 5.3: Refactor large component files

- [ ] Break down Reporting.tsx (1347 lines) into smaller, focused components
- Refactor experience/page.tsx (880 lines) and configure/page.tsx (622 lines)
- Split CustomObjectivesManager.tsx (404 lines) into focused components
- Extract custom hooks and utility functions
- Maintain component functionality and props interfaces
- _Requirements: 6.2, 6.3, 6.5_

#### Task 5.4: Refactor large utility and service files

- [ ] Split toolParser.ts (453 lines) by functional domain
- Create focused service modules with clear responsibilities
- Update imports across codebase for refactored modules
- _Requirements: 6.2, 6.3, 6.5_

#### Task 5.5: Validate large file refactoring

- [ ]\* Ensure all refactored files are within 300-600 line target
- Run tests to verify functionality preservation
- _Requirements: 6.4, 6.5_

### Phase 6: Comprehensive Code Documentation

**Goal: Add comprehensive documentation for maintainability**

#### Task 6.1: Add JSDoc comments to all public functions

- [ ] Document function purpose, parameters, and return values
- Include usage examples for complex functions
- Add type information and validation rules
- _Requirements: 7.2, 7.5_

#### Task 6.2: Document complex business logic and algorithms

- [ ] Add inline comments explaining complex code blocks
- Document business rules and domain constraints
- Explain non-obvious implementation decisions
- _Requirements: 7.1, 7.3_

#### Task 6.3: Document external integrations and APIs

- [ ] Add comments for Supabase database operations
- Document Tavus API integration patterns
- Explain webhook handling and security measures
- _Requirements: 7.4, 7.5_

#### Task 6.4: Add architectural and design decision comments

- [ ] Document why specific patterns were chosen
- Explain trade-offs in implementation decisions
- Add context for future developers
- _Requirements: 7.3, 7.5_

#### Task 6.5: Review and validate code documentation

- [ ]\* Ensure all comments are accurate and helpful
- Verify JSDoc comments generate proper documentation
- _Requirements: 7.5_

### Phase 7: Enhanced Project Documentation

**Goal: Create comprehensive project documentation**

#### Task 7.1: Create comprehensive project README

- [ ] Write clear project overview and purpose
- Document installation and setup instructions
- Include development workflow and best practices
- _Requirements: 8.1, 8.3_

#### Task 7.2: Create file structure roadmap documentation

- [ ] Document new directory structure and organization
- Explain the reasoning behind organizational decisions
- Provide navigation guide for developers
- _Requirements: 8.2, 8.4_

#### Task 7.3: Create developer onboarding guide

- [ ] Write step-by-step setup instructions
- Document coding standards and conventions
- Include troubleshooting guide for common issues
- _Requirements: 8.3, 8.5_

#### Task 7.4: Document architectural decisions

- [ ] Create Architecture Decision Records (ADRs)
- Document major design patterns and their rationale
- Explain technology choices and trade-offs
- _Requirements: 8.4, 8.5_

#### Task 7.5: Validate and finalize documentation

- [ ]\* Review all documentation for accuracy and completeness
- Test setup instructions with fresh environment
- Ensure all links and references work correctly
- _Requirements: 8.5_

### Phase 8: Final Cleanup and Optimization

**Goal: Final cleanup and optimization for production readiness**

#### Task 8.1: Remove unused files and directories

- [ ] Clean up empty directories from file moves
- Remove any duplicate or unused files
- _Requirements: 4.2_

#### Task 8.2: Optimize import statements

- [ ] Remove unused imports across the codebase
- Optimize import grouping and ordering
- _Requirements: 4.4_

#### Task 8.3: Final code quality review

- [ ] Run linting and formatting across entire codebase
- Ensure consistent code style and conventions
- _Requirements: 7.5_

#### Task 8.4: Final validation and testing

- [ ] Run complete test suite
- Build and deploy to staging for integration testing
- Verify all functionality works end-to-end
- _Requirements: 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5_

## Success Criteria

By end of implementation:

- [ ] All tests consolidated into unified `__tests__/` structure
- [ ] Business logic extracted into service layer
- [ ] API routes organized by domain (auth, demos, tavus, webhooks, admin)
- [ ] Components organized by type and domain
- [ ] All files under 600 lines with focused responsibilities
- [ ] Comprehensive code and project documentation
- [ ] Clean, optimized codebase ready for production

## Technical Debt & Future Enhancements

- Consider implementing automated file size monitoring
- Add pre-commit hooks for import organization
- Implement automated documentation generation
- Consider adding architectural testing tools

## Risk Mitigation

- Maintain comprehensive test coverage during refactoring
- Implement changes incrementally with validation at each step
- Keep backup branches for major structural changes
- Test all functionality after each phase completion
