# File Organization Refactor - Implementation Plan

## Current Status Assessment

✅ **COMPLETED:**

- Test directory structure fully established (`__tests__/unit/`, `__tests__/integration/`, `__tests__/e2e/`)
- All tests consolidated into unified `__tests__/` structure
- Jest configuration set up for new structure with proper test scripts
- Service layer structure created (`src/lib/services/` with auth, demos, tavus, webhooks)
- Complete auth service layer implemented (auth-service.ts, user-service.ts, session-service.ts)
- Agent service implementation completed with business logic extraction (828 lines)
- Demo service implementation completed (438 lines)
- Large files identified: 10 files over 300 lines (largest: Reporting.tsx at 1347 lines)
- Current API structure analyzed: 40+ flat routes need organization

## Implementation Tasks (Priority Order)

### Phase 1: Test Consolidation and Validation Setup ✅ COMPLETE

**Goal: Consolidate scattered test files into unified structure**

- [x] #### Task 1.1: Create unified test directory structure
- [x] Create `__tests__/unit/`, `__tests__/integration/`, `__tests__/e2e/` directories
- [x] Test configuration set up for new structure
- [x] All test files consolidated into proper subdirectories
- _Requirements: 2.1, 2.3_

- [x] #### Task 1.2: Complete test consolidation
- [x] All tests moved to unified `__tests__/` structure
- [x] No remaining scattered test files in src directory
- [x] E2e tests already in proper location
- _Requirements: 2.1, 2.2_

- [x] #### Task 1.3: Update test configurations and imports
- [x] Jest configuration updated for all test locations
- [x] Package.json test scripts configured for new structure
- [x] Test import paths working correctly
- _Requirements: 2.2, 2.4_

- [x] #### Task 1.4: Create import validation script
- [x] Import validation script exists in scripts/validate-imports.ts
- [x] Available as validation command in package.json
- _Requirements: 4.4_

- [x] #### Task 1.5: Verify test consolidation
- [x] Full test suite runs successfully
- [x] All tests accounted for in new structure
- _Requirements: 2.1, 2.2_

### Phase 2: Business Logic Extraction

**Goal: Extract business logic from API handlers into service layer**

- [x] #### Task 2.1: Create service layer structure
- [x] Create `src/lib/services/` directory structure
- [x] Set up domain-specific service directories (auth, demos, tavus, webhooks)
- [x] Service interfaces and types defined
- _Requirements: 3.1, 3.2_

- [x] #### Task 2.2: Extract demo management business logic
- [x] Agent service implemented with full business logic (828 lines)
- [x] Demo service created with configuration management (348 lines)
- [x] Service interfaces and types defined
- [x] Business logic extracted from create-agent routes
- _Requirements: 3.1, 3.3_

- [x] #### Task 2.3: Extract authentication business logic
- [x] 2.3.1 Create auth service interfaces and types
- [x] 2.3.2 Complete auth service implementation (auth-service.ts, user-service.ts, session-service.ts)
- [x] 2.3.3 Extract logic from setup-test-user API route
- [x] 2.3.4 Extract logic from check-current-persona API route
- [x] 2.3.5 Create authentication middleware for API routes
- [x] 2.3.6 Extract auth logic from AuthProvider component
- [x] 2.3.7 Extract auth logic from withAuth HOC
- [x] 2.3.8 Extract sign-in/sign-out logic from login components
- [x] 2.3.9 Extract auth checks from demo and configuration pages
- [x] 2.3.10 Update all API handlers to use auth services
- [x] 2.3.11 Update all components to use auth services
- _Requirements: 3.1, 3.3_

9

- [x] #### Task 2.5: Extract webhook business logic
- [x] 2.5.1 Analyze tavus-webhook/handler.ts (693 lines) for business logic extraction
- [x] 2.5.2 Create webhook service interfaces and types
- [x] 2.5.3 Extract webhook signature validation logic
- [x] 2.5.4 Extract webhook event processing logic
- [x] 2.5.5 Extract webhook tool call handling logic
- [x] 2.5.6 Extract webhook data ingestion logic
- [x] 2.5.7 Create webhook security and validation services
- [x] 2.5.8 Update webhook API handlers to use services
- _Requirements: 3.1, 3.3_

- [x] #### Task 2.6: Complete auth service integration
- [x] 2.6.1 Update setup-test-user API route to use auth services
- [x] 2.6.2 Update check-current-persona API route to use auth services
- [x] 2.6.3 Update AuthProvider component to use auth services
- [x] 2.6.4 Update withAuth HOC to use auth services
- [x] 2.6.5 Update login/signup pages to use auth services
- [x] 2.6.6 Update demo and configuration pages to use auth services
- _Requirements: 3.3, 3.5_

- [x] #### Task 2.7: Update API handlers to use extracted services
- [x] 2.7.1 Update create-agent and create-enhanced-agent routes to use agent service
- [x] 2.7.2 Update authentication-related API routes to use auth services
- [x] 2.7.3 Update Tavus-related API routes to use Tavus services
- [x] 2.7.4 Update webhook API routes to use webhook services
- [x] 2.7.5 Update demo management API routes to use demo services
- [x] 2.7.6 Remove duplicated business logic from all API handlers
- [x] 2.7.7 Ensure all API handlers are thin and focused on HTTP concerns
- _Requirements: 3.3, 3.5_

- [x] #### Task 2.8: Validate business logic extraction
- [x] 2.8.1 Run API tests to ensure all endpoints still work
- [x] 2.8.2 Verify no functionality was lost in extraction
- [x] 2.8.3 Test service layer functionality independently
- [x] 2.8.4 Validate error handling and edge cases
- [x] 2.8.5 Ensure proper logging and monitoring
- _Requirements: 3.3, 3.5_

### Phase 3: API Route Organization

**Goal: Organize 40+ flat API routes into domain-based structure**

- [x] #### Task 3.1: Plan API route restructuring
- [x] 3.1.1 Map current 40+ flat API routes to new domain-based structure
- [x] 3.1.2 Identify routes that need URL compatibility layers
- [x] 3.1.3 Create migration plan for existing endpoints
- [x] 3.1.4 Document new API route organization structure
- [x] 3.1.5 Plan backward compatibility strategy
- _Requirements: 1.1, 1.3_

- [x] #### Task 3.2: Reorganize authentication API routes
- [x] 3.2.1 Move setup-test-user to `src/app/api/auth/setup-test-user/`
- [x] 3.2.2 Move check-current-persona to appropriate domain structure
- [x] 3.2.3 Create auth-related route groupings
- [x] 3.2.4 Update route handlers to use extracted auth services
- [x] 3.2.5 Ensure backward compatibility for existing URLs
- _Requirements: 1.1, 1.2_

- [x] #### Task 3.3: Reorganize demo management API routes
- [x] 3.3.1 Move create-agent to `src/app/api/demos/agents/create/`
- [x] 3.3.2 Move create-enhanced-agent to `src/app/api/demos/agents/create-enhanced/`
- [x] 3.3.3 Move create-test-demo to `src/app/api/demos/create-test/`
- [x] 3.3.4 Organize demo configuration routes under `src/app/api/demos/[demoId]/`
- [x] 3.3.5 Update route handlers to use extracted demo services
- [x] 3.3.6 Ensure backward compatibility for existing URLs
- _Requirements: 1.1, 1.2_

- [x] #### Task 3.4: Reorganize Tavus integration API routes
- [x] 3.4.1 Move tavus routes to `src/app/api/tavus/`
- [x] 3.4.2 Move tavus-webhook to `src/app/api/tavus/webhook/`
- [x] 3.4.3 Move start-conversation to `src/app/api/tavus/conversations/start/`
- [x] 3.4.4 Move end-conversation to `src/app/api/tavus/conversations/end/`
- [x] 3.4.5 Organize persona and video routes under Tavus structure
- [x] 3.4.6 Update route handlers to use extracted Tavus services
- [x] 3.4.7 Ensure backward compatibility for existing URLs
- _Requirements: 1.1, 1.2_

- [x] #### Task 3.5: Reorganize webhook API routes
- [x] 3.5.1 Move webhook routes to `src/app/api/webhooks/`
- [x] 3.5.2 Move track-cta-click to `src/app/api/webhooks/cta-click/`
- [x] 3.5.3 Move webhook-url to `src/app/api/webhooks/url/`
- [x] 3.5.4 Organize webhook handlers by event type
- [x] 3.5.5 Update route handlers to use extracted webhook services
- [x] 3.5.6 Ensure backward compatibility for existing URLs
- _Requirements: 1.1, 1.2_

- [x] #### Task 3.6: Reorganize admin/debug API routes
- [x] 3.6.1 Move debug-\* routes to `src/app/api/admin/debug/`
- [x] 3.6.2 Move test-\* routes to `src/app/api/admin/test/`
- [x] 3.6.3 Move check-\* routes to `src/app/api/admin/check/`
- [x] 3.6.4 Move verify-\* routes to `src/app/api/admin/verify/`
- [x] 3.6.5 Group by functionality (debug, testing, verification)
- [x] 3.6.6 Update route handlers to use extracted services
- [x] 3.6.7 Ensure proper admin authentication and authorization
- _Requirements: 1.1, 1.2_

- [x] #### Task 3.7: Validate API route organization
- [ ]\* 3.7.1 Test all API endpoints to ensure they still work
- [x] 3.7.2 Verify URL compatibility is maintained
- [x] 3.7.3 Test backward compatibility layers
- [x] 3.7.4 Validate route organization structure
- [x] 3.7.5 Ensure proper error handling and responses
- _Requirements: 1.3, 1.5_

### Phase 4: Utility and Component Organization

**Goal: Consolidate utilities and organize components by domain**

- [ ] #### Task 4.1: Consolidate utility modules
- [ ] 4.1.1 Merge duplicate supabase utilities (`src/lib/supabase.ts` vs `src/utils/supabase/server.ts`)
- [ ] 4.1.2 Consolidate security utilities under `src/lib/utils/security/`
- [ ] 4.1.3 Organize validation utilities under `src/lib/utils/validation/`
- [ ] 4.1.4 Organize formatting utilities under `src/lib/utils/formatting/`
- [ ] 4.1.5 Create utility domain groupings by purpose
- [ ] 4.1.6 Update all utility imports across the codebase
- _Requirements: 4.1, 4.2, 4.4_

- [ ] #### Task 4.2: Reorganize React components
- [ ] 4.2.1 Create `src/components/ui/` for shared UI components
- [ ] 4.2.2 Create `src/components/features/` for feature-specific components
- [ ] 4.2.3 Create `src/components/layout/` for layout components
- [ ] 4.2.4 Categorize existing 20+ components by type and domain
- [ ] 4.2.5 Move CVI components to features/cvi structure
- [ ] 4.2.6 Move auth components to features/auth structure
- [ ] 4.2.7 Update component imports across the application
- _Requirements: 5.1, 5.2, 5.5_

- [ ] #### Task 4.3: Create component co-location structure
- [ ] 4.3.1 Group related component files (styles, tests, types) together
- [ ] 4.3.2 Organize CVI components with proper co-location
- [ ] 4.3.3 Co-locate component assets and utilities
- [ ] 4.3.4 Update component organization to follow atomic design principles
- [ ] 4.3.5 Create component-specific type definitions
- _Requirements: 5.3, 5.4_

- [ ] #### Task 4.4: Update import paths and create barrel exports
- [ ] 4.4.1 Add TypeScript path mapping for clean imports
- [ ] 4.4.2 Create index.ts files for barrel exports in components
- [ ] 4.4.3 Create index.ts files for barrel exports in utilities
- [ ] 4.4.4 Create index.ts files for barrel exports in services
- [ ] 4.4.5 Update all imports to use new path structure
- [ ] 4.4.6 Validate all import paths resolve correctly
- _Requirements: 4.4, 5.5_

- [ ] #### Task 4.5: Validate component and utility organization
- [ ]\* 4.5.1 Build application to ensure all imports resolve
- [ ] 4.5.2 Run component tests to verify functionality
- [ ] 4.5.3 Test component rendering and behavior
- [ ] 4.5.4 Validate utility function imports and usage
- [ ] 4.5.5 Ensure no broken dependencies or circular imports
- _Requirements: 4.4, 5.5_

### Phase 5: Large File Refactoring

**Goal: Break down 9 files over 300 lines into focused modules**

- [x] #### Task 5.1: Identify large files for refactoring
- [x] Files identified: Reporting.tsx (1347 lines), experience/page.tsx (880 lines), agent-service.ts (828 lines), tavus-webhook/handler.ts (693 lines), configure/page.tsx (622 lines), toolParser.ts (453 lines), demo-service.ts (438 lines), objectives-templates.ts (416 lines), CustomObjectivesManager.tsx (404 lines), TavusConversation.tsx (394 lines)
- [x] Prioritized by complexity and change frequency
- _Requirements: 6.1, 6.2_

- [ ] #### Task 5.2: Refactor large API handlers and business logic files
- [ ] 5.2.1 Split tavus-webhook/handler.ts (693 lines) into focused modules
- [ ] 5.2.2 Break down objectives-templates.ts (416 lines) into smaller modules
- [ ] 5.2.3 Refactor agent-service.ts (828 lines) into smaller focused services
- [ ] 5.2.4 Refactor demo-service.ts (438 lines) into smaller focused services
- [ ] 5.2.5 Extract common patterns and utilities
- [ ] 5.2.6 Maintain existing functionality and interfaces
- [ ] 5.2.7 Update imports and dependencies
- _Requirements: 6.2, 6.3, 6.5_

- [ ] #### Task 5.3: Refactor large component files
- [ ] 5.3.1 Break down Reporting.tsx (1347 lines) into smaller, focused components
- [ ] 5.3.2 Refactor experience/page.tsx (880 lines) into focused page components
- [ ] 5.3.3 Refactor configure/page.tsx (622 lines) into focused page components
- [ ] 5.3.4 Split CustomObjectivesManager.tsx (404 lines) into focused components
- [ ] 5.3.5 Refactor TavusConversation.tsx (394 lines) into smaller components
- [ ] 5.3.6 Extract custom hooks and utility functions
- [ ] 5.3.7 Maintain component functionality and props interfaces
- _Requirements: 6.2, 6.3, 6.5_

- [ ] #### Task 5.4: Refactor large utility and service files
- [ ] 5.4.1 Split toolParser.ts (453 lines) by functional domain
- [ ] 5.4.2 Create focused service modules with clear responsibilities
- [ ] 5.4.3 Extract common utility patterns
- [ ] 5.4.4 Update imports across codebase for refactored modules
- [ ] 5.4.5 Ensure proper error handling and logging
- _Requirements: 6.2, 6.3, 6.5_

- [ ] #### Task 5.5: Validate large file refactoring
- [ ]\* 5.5.1 Ensure all refactored files are within 300-600 line target
- [ ] 5.5.2 Run tests to verify functionality preservation
- [ ] 5.5.3 Validate component rendering and behavior
- [ ] 5.5.4 Test service functionality and interfaces
- [ ] 5.5.5 Ensure no performance regressions
- _Requirements: 6.4, 6.5_

### Phase 6: Comprehensive Code Documentation

**Goal: Add comprehensive documentation for maintainability**

- [ ] #### Task 6.1: Add JSDoc comments to all public functions
- [ ] 6.1.1 Document function purpose, parameters, and return values
- [ ] 6.1.2 Include usage examples for complex functions
- [ ] 6.1.3 Add type information and validation rules
- [ ] 6.1.4 Document service layer public methods
- [ ] 6.1.5 Document component props and interfaces
- _Requirements: 7.2, 7.5_

- [ ] #### Task 6.2: Document complex business logic and algorithms
- [ ] 6.2.1 Add inline comments explaining complex code blocks
- [ ] 6.2.2 Document business rules and domain constraints
- [ ] 6.2.3 Explain non-obvious implementation decisions
- [ ] 6.2.4 Document algorithm complexity and performance considerations
- [ ] 6.2.5 Add context for domain-specific logic
- _Requirements: 7.1, 7.3_

- [ ] #### Task 6.3: Document external integrations and APIs
- [ ] 6.3.1 Add comments for Supabase database operations
- [ ] 6.3.2 Document Tavus API integration patterns
- [ ] 6.3.3 Explain webhook handling and security measures
- [ ] 6.3.4 Document authentication and authorization flows
- [ ] 6.3.5 Add error handling and retry logic documentation
- _Requirements: 7.4, 7.5_

- [ ] #### Task 6.4: Add architectural and design decision comments
- [ ] 6.4.1 Document why specific patterns were chosen
- [ ] 6.4.2 Explain trade-offs in implementation decisions
- [ ] 6.4.3 Add context for future developers
- [ ] 6.4.4 Document service layer architecture decisions
- [ ] 6.4.5 Explain component organization rationale
- _Requirements: 7.3, 7.5_

- [ ] #### Task 6.5: Review and validate code documentation
- [ ]\* 6.5.1 Ensure all comments are accurate and helpful
- [ ] 6.5.2 Verify JSDoc comments generate proper documentation
- [ ] 6.5.3 Review documentation completeness and clarity
- [ ] 6.5.4 Validate code examples and usage patterns
- [ ] 6.5.5 Ensure documentation stays up-to-date with code changes
- _Requirements: 7.5_

### Phase 7: Enhanced Project Documentation

**Goal: Create comprehensive project documentation**

- [ ] #### Task 7.1: Create comprehensive project README
- [ ] 7.1.1 Write clear project overview and purpose
- [ ] 7.1.2 Document installation and setup instructions
- [ ] 7.1.3 Include development workflow and best practices
- [ ] 7.1.4 Add contribution guidelines and standards
- [ ] 7.1.5 Document environment setup and configuration
- _Requirements: 8.1, 8.3_

- [ ] #### Task 7.2: Create file structure roadmap documentation
- [ ] 7.2.1 Document new directory structure and organization
- [ ] 7.2.2 Explain the reasoning behind organizational decisions
- [ ] 7.2.3 Provide navigation guide for developers
- [ ] 7.2.4 Create visual diagrams of file structure
- [ ] 7.2.5 Document migration from old to new structure
- _Requirements: 8.2, 8.4_

- [ ] #### Task 7.3: Create developer onboarding guide
- [ ] 7.3.1 Write step-by-step setup instructions
- [ ] 7.3.2 Document coding standards and conventions
- [ ] 7.3.3 Include troubleshooting guide for common issues
- [ ] 7.3.4 Create development workflow documentation
- [ ] 7.3.5 Document testing and deployment procedures
- _Requirements: 8.3, 8.5_

- [ ] #### Task 7.4: Document architectural decisions
- [ ] 7.4.1 Create Architecture Decision Records (ADRs)
- [ ] 7.4.2 Document major design patterns and their rationale
- [ ] 7.4.3 Explain technology choices and trade-offs
- [ ] 7.4.4 Document service layer architecture
- [ ] 7.4.5 Explain component organization strategy
- _Requirements: 8.4, 8.5_

- [ ] #### Task 7.5: Validate and finalize documentation
- [ ]\* 7.5.1 Review all documentation for accuracy and completeness
- [ ] 7.5.2 Test setup instructions with fresh environment
- [ ] 7.5.3 Ensure all links and references work correctly
- [ ] 7.5.4 Validate code examples and snippets
- [ ] 7.5.5 Get feedback from team members on documentation
- _Requirements: 8.5_

### Phase 8: Final Cleanup and Optimization

**Goal: Final cleanup and optimization for production readiness**

- [ ] #### Task 8.1: Remove backward compatibility redirect routes
- [ ] 8.1.1 Verify all external integrations have migrated to new URLs
- [ ] 8.1.2 Update all internal references to use new API structure
- [ ] 8.1.3 Remove old redirect stub files (track-cta-click, webhook-url, etc.)
- [ ] 8.1.4 Clean up old webhook event handler redirects
- [ ] 8.1.5 Update documentation to reflect final URL structure
- [ ] 8.1.6 Add deprecation notices before removal (if needed)
- _Requirements: 1.2, 1.3_

- [ ] #### Task 8.2: Remove unused files and directories
- [ ] 8.2.1 Clean up empty directories from file moves
- [ ] 8.2.2 Remove any duplicate or unused files
- [ ] 8.2.3 Clean up old configuration files
- [ ] 8.2.4 Remove temporary or backup files
- _Requirements: 4.2_

- [ ] #### Task 8.3: Optimize import statements
- [ ] 8.3.1 Remove unused imports across the codebase
- [ ] 8.3.2 Optimize import grouping and ordering
- [ ] 8.3.3 Consolidate related imports
- [ ] 8.3.4 Use barrel exports where appropriate
- _Requirements: 4.4_

- [ ] #### Task 8.4: Final code quality review
- [ ] 8.4.1 Run linting and formatting across entire codebase
- [ ] 8.4.2 Ensure consistent code style and conventions
- [ ] 8.4.3 Review code for best practices compliance
- [ ] 8.4.4 Validate TypeScript configurations
- _Requirements: 7.5_

- [ ] #### Task 8.5: Final validation and testing
- [ ] 8.5.1 Run complete test suite
- [ ] 8.5.2 Build and deploy to staging for integration testing
- [ ] 8.5.3 Verify all functionality works end-to-end
- [ ] 8.5.4 Performance testing and optimization
- [ ] 8.5.5 Security review and validation
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
