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

4. **Code Size Management**: Refactor any file that grows beyond 500 lines into smaller, focused modules.

5. **Developer Comments**: Write clear comments in all created files explaining purpose, usage, and key functionality for other developers.

6. **Testing & Debugging**: Debug and test every new feature or function before moving on - it must pass all checks and work correctly.

7. **Script Organization**: All SQL files belong in `scripts/` folder with descriptive names following `supabase-table-name.sql` pattern.

8. **Architecture Compliance**: Follow the established domain-driven architecture with service layer separation and component organization patterns.

9. **Code Duplication Prevention**: Always check for existing code before implementing new functionality and perform cleanup to remove duplicates when possible.

10. **File & Folder Movement Authorization**: Always ask for user permission and provide clear explanation before moving or removing any files or folders from their current location.

11. **Creation Authorization & Reuse**: Before creating new files or folders, ask for user permission and suggest using existing resources when possible.

12. **Test Organization Compliance**: ALL test files must be placed in `__tests__/` directory with appropriate subdirectories (unit/, integration/, e2e/, lib/, etc.).

## Key Documentation Files

- `docs/GUARDRAILS.md` - Tavus guardrails implementation
- `docs/DEPLOYMENT_GUIDE.md` - Deployment instructions
- `docs/MANUAL_TESTING_GUIDE.md` - Testing procedures
- `docs/architecture/README.md` - Architecture overview
- `docs/plan.md` - Project roadmap and requirements

## Before Creating New Files

1. Check if similar documentation exists in `docs/`
2. Check if similar scripts exist in `scripts/`
3. Update existing files rather than creating duplicates
4. Follow the established naming conventions
5. Add comprehensive comments for developer understanding

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

### Key Principles

- **Domain Organization**: Group by business functionality, not file type
- **Service Layer**: Extract business logic from API routes and components
- **Component Hierarchy**: UI (reusable) → Features (business logic) → Layout (structure)
- **Single Responsibility**: Each module has one clear purpose
- **Type Safety**: TypeScript interfaces and validation throughout
- **Test Organization**: ALL tests belong in `__tests__/` directory with subdirectories for different test types
