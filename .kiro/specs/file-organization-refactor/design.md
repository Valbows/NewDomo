# File Organization Refactor Design

## Overview

This design outlines a systematic approach to reorganizing the project file structure from the current organic growth pattern to a well-structured, domain-driven architecture that improves maintainability and developer experience.

## Architecture

### Current Structure Problems
- 40+ API routes in flat structure under `src/app/api/`
- Tests scattered across `src/__tests__`, `__tests__`, `src/tests`, `e2e`
- Business logic mixed with API handlers
- Duplicate utilities (`src/lib/supabase.ts` vs `src/utils/supabase/server.ts`)
- Deep nesting in some areas

### Target Structure
```
src/
├── app/                          # Next.js App Router (UI routes only)
│   ├── (auth)/                   # Auth route group
│   ├── dashboard/                # Dashboard pages
│   ├── demos/                    # Demo management pages
│   └── api/                      # Simplified API structure
│       ├── auth/                 # Authentication endpoints
│       ├── demos/                # Demo management endpoints
│       ├── tavus/                # Tavus integration endpoints
│       ├── webhooks/             # Webhook handlers
│       └── admin/                # Admin/debug endpoints
├── components/                   # React components
│   ├── ui/                       # Shared UI components (atoms/molecules)
│   ├── features/                 # Feature-specific components
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── demos/
│   │   └── tavus/
│   └── layout/                   # Layout components
├── lib/                          # Business logic and utilities
│   ├── services/                 # Domain services (business logic)
│   │   ├── auth/
│   │   ├── demos/
│   │   ├── tavus/
│   │   └── webhooks/
│   ├── utils/                    # Shared utilities
│   │   ├── supabase/
│   │   ├── security/
│   │   ├── validation/
│   │   └── formatting/
│   ├── types/                    # TypeScript type definitions
│   └── constants/                # Application constants
├── hooks/                        # React hooks
└── store/                        # State management

__tests__/                        # All tests consolidated here
├── unit/                         # Unit tests (mirror src structure)
│   ├── lib/
│   ├── components/
│   └── hooks/
├── integration/                  # Integration tests
│   ├── api/
│   └── services/
└── e2e/                         # End-to-end tests
```

## Components and Interfaces

### API Route Organization
- **Domain-based grouping**: Group related endpoints together
- **Consistent naming**: Use RESTful conventions where possible
- **Shared middleware**: Extract common functionality (auth, validation, error handling)

### Service Layer Architecture
- **Domain services**: Business logic organized by domain (auth, demos, tavus, webhooks)
- **Repository pattern**: Data access abstraction
- **Utility services**: Cross-cutting concerns (logging, validation, formatting)

### Component Organization
- **UI components**: Reusable, generic components
- **Feature components**: Domain-specific components
- **Layout components**: Page structure and navigation
- **Co-location**: Keep related files (styles, tests, types) together

## Data Models

### File Movement Strategy
1. **Phase 1**: Consolidate tests without breaking functionality
2. **Phase 2**: Extract business logic from API handlers
3. **Phase 3**: Reorganize API routes by domain
4. **Phase 4**: Restructure components and utilities
5. **Phase 5**: Clean up and optimize imports

### Import Path Strategy
- Use absolute imports with path mapping (`@/lib/services/auth`)
- Maintain barrel exports for clean imports
- Update all import paths systematically

## Error Handling

### Migration Risk Mitigation
- **Incremental approach**: Move files in small, testable batches
- **Import validation**: Ensure all imports resolve correctly after each move
- **Test verification**: Run full test suite after each phase
- **Rollback strategy**: Git commits for each logical grouping

### Breaking Change Prevention
- **API route compatibility**: Maintain existing URL structure during transition
- **Component interface stability**: Preserve all component props and exports
- **Service contract preservation**: Keep all public service interfaces unchanged

## Testing Strategy

### Test Organization
- **Mirror source structure**: Tests follow the same organization as source code
- **Test type separation**: Clear boundaries between unit, integration, and e2e tests
- **Shared test utilities**: Common test helpers and fixtures
- **Test data management**: Centralized test data and mocks

### Validation Approach
- **Automated import checking**: Script to validate all imports resolve
- **Build verification**: Ensure project builds successfully after each phase
- **Test suite execution**: Full test suite must pass after each change
- **Manual smoke testing**: Key user flows verified manually

## Large File Refactoring Strategy

### File Size Analysis
- **Target range**: 300-600 lines per file for optimal maintainability
- **Identification process**: Scan codebase for files exceeding 300 lines
- **Prioritization**: Focus on files with complex business logic and high change frequency

### Refactoring Approach
- **Logical separation**: Split files by functional boundaries and responsibilities
- **Module cohesion**: Keep related functionality together within size limits
- **Interface preservation**: Maintain existing public APIs during refactoring
- **Incremental splitting**: Break large files into focused, testable modules

## Documentation and Commenting Strategy

### Code Documentation Standards
- **JSDoc comments**: All public functions, classes, and complex logic
- **Inline comments**: Explain "why" for non-obvious implementations
- **API documentation**: Document external integrations and data contracts
- **Architecture decisions**: Record reasoning behind design choices

### Comment Types and Placement
- **Function headers**: Purpose, parameters, return values, examples
- **Complex algorithms**: Step-by-step explanation of logic
- **Business rules**: Document domain-specific requirements and constraints
- **Integration points**: Explain external service interactions and data flows

## Enhanced Documentation Structure

### README Improvements
- **Project overview**: Clear description of purpose and architecture
- **Structure roadmap**: Visual guide to new file organization
- **Developer onboarding**: Setup instructions and development workflow
- **Contribution guidelines**: Standards for code quality and documentation

### Additional Documentation
- **Architecture Decision Records (ADRs)**: Document major design decisions
- **API documentation**: Comprehensive endpoint and service documentation
- **Development guides**: Best practices and coding standards
- **Troubleshooting guides**: Common issues and solutions