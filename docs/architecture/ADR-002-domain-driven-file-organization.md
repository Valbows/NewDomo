# ADR-002: Domain-Driven File Organization

## Status
Accepted

## Context
The original project structure had grown organically with:
- 40+ API routes in a flat structure
- Tests scattered across multiple directories
- Components mixed together without clear organization
- Utilities duplicated in different locations
- Large files (300+ lines) that were difficult to maintain

## Decision
We will reorganize the entire codebase using domain-driven design principles with clear separation by business functionality.

### New Structure
```
src/
├── app/api/                    # API routes by domain
│   ├── admin/                  # Administrative functions
│   ├── auth/                   # Authentication
│   ├── demos/                  # Demo management
│   ├── tavus/                  # Tavus integration
│   └── webhooks/               # Webhook processing
├── components/                 # React components
│   ├── ui/                     # Reusable UI components
│   ├── features/               # Feature-specific components
│   └── layout/                 # Layout components
├── lib/services/               # Business logic services
│   ├── auth/                   # Authentication services
│   ├── demos/                  # Demo services
│   ├── tavus/                  # Tavus services
│   └── webhooks/               # Webhook services
└── lib/utils/                  # Shared utilities
    ├── supabase/               # Database utilities
    ├── security/               # Security functions
    └── validation/             # Validation helpers

__tests__/                      # Unified test structure
├── unit/                       # Unit tests
├── integration/                # Integration tests
└── e2e/                       # End-to-end tests
```

## Consequences

### Positive
- **Discoverability**: Related files are grouped together
- **Maintainability**: Clear boundaries between domains
- **Scalability**: Easy to add new features without cluttering
- **Team Collaboration**: Multiple developers can work on different domains
- **Testing**: Clear test organization mirrors source structure

### Negative
- **Migration Effort**: Significant work to reorganize existing code
- **Import Path Changes**: All imports need to be updated
- **Learning Curve**: Team needs to understand new structure

## Implementation Guidelines

### File Naming Conventions
- Use kebab-case for directories: `auth-service/`
- Use PascalCase for React components: `AuthProvider.tsx`
- Use camelCase for utilities: `validateInput.ts`
- Use descriptive names that indicate purpose

### Domain Boundaries
- **Auth**: User authentication, authorization, session management
- **Demos**: Demo creation, configuration, video management
- **Tavus**: AI agent integration, conversation management
- **Webhooks**: Event processing, tool calls, data ingestion
- **Admin**: Administrative functions, debugging, utilities

### Co-location Principles
- Keep related files together (component + styles + tests)
- Group by feature rather than file type
- Minimize deep nesting (max 3-4 levels)
- Use index files for clean imports

### Migration Strategy
1. **Phase 1**: Consolidate tests into unified structure
2. **Phase 2**: Extract business logic into service layer
3. **Phase 3**: Reorganize API routes by domain
4. **Phase 4**: Restructure components and utilities
5. **Phase 5**: Update all import paths and validate

## Validation
- All imports must resolve correctly after reorganization
- Full test suite must pass after each phase
- Build process must complete successfully
- No duplicate code or utilities should remain