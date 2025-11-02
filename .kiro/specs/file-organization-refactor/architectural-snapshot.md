# Architectural Snapshot - Pre-Cleanup State

## Overview

This document provides a comprehensive snapshot of the current system architecture as of the pre-cleanup phase. This serves as a reference point for understanding the system state before deprecated code removal and can be used for rollback scenarios or impact analysis.

## System Architecture Overview

### Current Architecture Pattern
The application follows a **Domain-Driven Design (DDD)** pattern with **Service Layer Architecture**, organized into the following layers:

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  Next.js App Router Pages + React Components               │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    API Layer                                │
│  Domain-organized API Routes (auth, demos, tavus, etc.)    │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                            │
│  Business Logic Services by Domain                          │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Data Access Layer                        │
│  Supabase Client + External API Integrations               │
└─────────────────────────────────────────────────────────────┘
```

## File Structure Snapshot

### Current Directory Structure (December 2024)

```
project-root/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/                      # API Routes (Domain-organized)
│   │   │   ├── admin/                # Admin and debug endpoints
│   │   │   ├── auth/                 # Authentication endpoints
│   │   │   ├── demos/                # Demo management endpoints
│   │   │   ├── tavus/                # Tavus integration endpoints
│   │   │   ├── webhooks/             # Webhook handlers
│   │   │   └── tavus-webhook/        # Legacy webhook handler
│   │   ├── demos/                    # Demo pages
│   │   │   ├── [demoId]/
│   │   │   │   ├── configure/        # Demo configuration interface
│   │   │   │   └── experience/       # Demo user experience
│   │   │   └── create/               # Demo creation
│   │   ├── dashboard/                # Dashboard pages
│   │   ├── auth/                     # Authentication pages
│   │   └── [other-pages]/            # Various utility pages
│   ├── components/                   # React Components
│   │   ├── ui/                       # Shared UI components
│   │   ├── features/                 # Feature-specific components
│   │   │   ├── auth/                 # Authentication components
│   │   │   ├── cvi/                  # Conversational Video Interface
│   │   │   ├── dashboard/            # Dashboard components
│   │   │   ├── demos/                # Demo management components
│   │   │   ├── objectives/           # Objectives management
│   │   │   └── webhooks/             # Webhook components
│   │   └── layout/                   # Layout components
│   ├── lib/                          # Business Logic and Utilities
│   │   ├── services/                 # Domain Services (Business Logic)
│   │   │   ├── auth/                 # Authentication services
│   │   │   ├── demos/                # Demo management services
│   │   │   ├── tavus/                # Tavus integration services
│   │   │   └── webhooks/             # Webhook processing services
│   │   ├── utils/                    # Shared Utilities
│   │   │   ├── supabase/             # Database utilities
│   │   │   ├── security/             # Security utilities
│   │   │   ├── validation/           # Validation utilities
│   │   │   └── formatting/           # Formatting utilities
│   │   ├── tavus/                    # Legacy Tavus utilities
│   │   ├── tools/                    # Tool parsing utilities
│   │   ├── supabase.ts               # DEPRECATED: Legacy Supabase wrapper
│   │   └── security/                 # DEPRECATED: Legacy security wrapper
│   ├── hooks/                        # React Hooks
│   └── store/                        # State Management
├── __tests__/                        # Consolidated Test Structure
│   ├── unit/                         # Unit Tests
│   ├── integration/                  # Integration Tests
│   └── e2e/                          # End-to-End Tests
├── scripts/                          # Utility Scripts
├── supabase/                         # Database Schema and Functions
└── [config-files]                    # Various configuration files
```

## Service Layer Architecture

### Domain Services Overview

#### 1. Authentication Services (`src/lib/services/auth/`)
- **auth-service.ts** (Core authentication logic)
- **user-service.ts** (User management)
- **session-service.ts** (Session handling)
- **auth-form-service.ts** (Form validation and processing)
- **auth-guard-service.ts** (Authorization guards)
- **auth-provider-service.ts** (Authentication context)
- **middleware.ts** (Authentication middleware)

#### 2. Demo Management Services (`src/lib/services/demos/`)
- **demo-service.ts** (Core demo operations)
- **agent-service.ts** (208 lines - Refactored from 829 lines)
- **agent-configuration-service.ts** (307 lines - Extracted)
- **agent-lifecycle-service.ts** (168 lines - Extracted)
- **persona-management-service.ts** (264 lines - Extracted)
- **demo-configuration-service.ts** (Demo configuration logic)
- **demo-lifecycle-service.ts** (Demo lifecycle management)
- **video-service.ts** (318 lines - Video processing)

#### 3. Tavus Integration Services (`src/lib/services/tavus/`)
- **tavus-client.ts** (Tavus API client)
- **conversation-service.ts** (Conversation management)
- **conversation-management-service.ts** (392 lines - Advanced conversation logic)
- **persona-service.ts** (Persona operations)
- **persona-management-service.ts** (Persona lifecycle)
- **analytics-service.ts** (459 lines - Analytics processing)
- **metrics-collection-service.ts** (Extracted metrics logic)
- **reporting-service.ts** (Extracted reporting logic)
- **media-service.ts** (446 lines - Media handling)
- **video-processing-service.ts** (Extracted video processing)
- **media-validation-service.ts** (Extracted media validation)
- **integration-service.ts** (417 lines - External API integration)
- **api-integration-service.ts** (Extracted API integration)
- **sync-service.ts** (Extracted data synchronization)
- **objectives-service.ts** (340 lines - Objectives management)
- **guardrails-service.ts** (Guardrails management)
- **webhook-service.ts** (399 lines - Webhook processing)

#### 4. Webhook Processing Services (`src/lib/services/webhooks/`)
- **webhook-service.ts** (Main webhook orchestration)
- **event-processing-service.ts** (359 lines - Event handling)
- **data-ingestion-service.ts** (365 lines - Data processing)
- **tool-call-service.ts** (347 lines - Tool processing)
- **security-service.ts** (Security validation)
- **validation-service.ts** (DEPRECATED - 190+ lines of validation logic)

## Component Architecture Snapshot

### Component Size Distribution (Pre-Cleanup)

#### Large Components (300+ lines)
1. **TavusConversation.tsx** - 395 lines (Video conversation management)
2. **Reporting.tsx** - 428 lines (Main reporting interface)
3. **DailyCallSingleton.ts** - 302 lines (LEGACY - Video call singleton)
4. **page-old.tsx** - 334 lines (LEGACY - Old experience page)

#### Successfully Refactored Components
1. **CustomObjectivesManager.tsx** - 147 lines (Reduced from 404 lines)
2. **experience/page.tsx** - 180 lines (Reduced from 727 lines)
3. **configure/page.tsx** - 254 lines (Reduced from 627 lines)
4. **ReportingSummary.tsx** - 7 lines (Reduced from 516 lines, now just exports)

#### Extracted Component Modules
1. **Reporting Components**:
   - ReportingCharts.tsx (81 lines)
   - ReportingTables.tsx (281 lines)
   - ReportingFilters.tsx (45 lines)
   - ReportingUtils.tsx (249 lines)
   - reporting/ directory (5 card components)

2. **Tool Parser Utilities**:
   - tool-parsing-utils.ts (247 lines)
   - tool-validation-utils.ts (176 lines)
   - tool-transformation-utils.ts (93 lines)
   - Main toolParser.ts (82 lines)

## API Route Organization

### Current API Structure

```
src/app/api/
├── admin/                    # Administrative endpoints
│   ├── check/               # System health checks
│   ├── debug/               # Debug utilities
│   ├── test/                # Testing endpoints
│   ├── utilities/           # Admin utilities
│   └── verify/              # Verification endpoints
├── auth/                    # Authentication endpoints
│   ├── session/             # Session management
│   ├── setup-test-user/     # Test user setup
│   └── user/                # User operations
├── demos/                   # Demo management endpoints
│   ├── [demoId]/            # Demo-specific operations
│   ├── agents/              # Agent creation and management
│   └── check-current-persona/ # Persona verification
├── tavus/                   # Tavus integration endpoints
│   ├── conversations/       # Conversation management
│   ├── debug/               # Tavus debugging
│   ├── perception/          # Perception management
│   ├── personas/            # Persona operations
│   ├── test/                # Tavus testing
│   ├── videos/              # Video operations
│   └── webhook/             # Tavus webhook handler
├── webhooks/                # General webhook endpoints
│   ├── cta-click/           # CTA tracking
│   ├── data/                # Data webhooks
│   ├── events/              # Event webhooks
│   ├── set-url/             # URL management
│   ├── test/                # Webhook testing
│   ├── update-urls/         # URL updates
│   └── url/                 # URL operations
└── tavus-webhook/           # LEGACY: Old webhook handler
```

### API Route Statistics
- **Total API Routes**: 40+ endpoints
- **Domain Organization**: 5 main domains (admin, auth, demos, tavus, webhooks)
- **Backward Compatibility Routes**: 0 (All removed ✅)
- **Legacy Routes**: 1 (tavus-webhook/ - marked for removal)

## Database Schema Overview

### Current Database Structure

#### Core Tables
1. **demos** - Demo configuration and metadata
2. **users** - User accounts and profiles
3. **conversations** - Conversation records and state
4. **analytics_events** - Event tracking and analytics
5. **custom_objectives** - User-defined objectives
6. **knowledge_chunks** - Knowledge base content
7. **processed_webhook_events** - Webhook event log

#### Schema Compatibility Issues
- **Deprecated Fields in demos table**:
  - `tavus_agent_id` (deprecated, use `tavus_persona_id`)
  - Legacy URL fields (deprecated, derive from API)
- **Dual Analytics Storage**: Both new and legacy formats maintained

## External Integrations

### Current Integration Points

#### 1. Tavus API Integration
- **Client**: `src/lib/services/tavus/tavus-client.ts`
- **Endpoints**: Personas, Conversations, Videos, Webhooks
- **Authentication**: API key-based
- **Rate Limiting**: Implemented
- **Error Handling**: Comprehensive retry logic

#### 2. Supabase Integration
- **Client Types**: Browser, Server, Admin
- **Authentication**: Row Level Security (RLS)
- **Real-time**: Enabled for demos and conversations
- **Storage**: File uploads and media management

#### 3. ElevenLabs Integration
- **Purpose**: Voice synthesis
- **Client**: API route handler
- **Usage**: Voice selection for personas

#### 4. Daily.co Integration (LEGACY)
- **Purpose**: Video calling infrastructure
- **Implementation**: DailyCallSingleton (marked for removal)
- **Replacement**: CVI (Conversational Video Interface) system

## Testing Architecture

### Test Structure Overview

```
__tests__/
├── unit/                    # Unit Tests (Mirror src structure)
│   ├── components/          # Component tests
│   │   ├── features/        # Feature component tests
│   │   └── ui/              # UI component tests
│   ├── lib/                 # Library tests
│   │   ├── services/        # Service layer tests
│   │   ├── utils/           # Utility tests
│   │   └── tools/           # Tool tests
│   └── hooks/               # React hooks tests
├── integration/             # Integration Tests
│   └── api/                 # API integration tests
└── e2e/                     # End-to-End Tests
    ├── dashboard-realtime.spec.ts
    ├── homepage.spec.ts
    ├── pip-natural-end.spec.ts
    ├── tool-calling.spec.ts
    └── video-controls.spec.ts
```

### Test Coverage Status
- **Unit Tests**: ~85% coverage for services and utilities
- **Integration Tests**: API endpoints and service interactions
- **E2E Tests**: Critical user journeys and tool calling functionality
- **Test Framework**: Jest (unit/integration), Playwright (E2E)

## Performance Characteristics

### Current Performance Metrics

#### Bundle Size Analysis
- **Main Bundle**: ~2.1MB (estimated)
- **Component Chunks**: Properly code-split by route
- **Service Layer**: ~400KB of business logic
- **Utility Layer**: ~150KB of shared utilities

#### Database Performance
- **Query Performance**: Optimized with proper indexing
- **Connection Pooling**: Supabase managed
- **Real-time Performance**: Sub-second updates for demos

#### API Response Times
- **Authentication**: <200ms average
- **Demo Operations**: <500ms average
- **Webhook Processing**: <1s average
- **Tavus Integration**: <2s average (external dependency)

## Security Architecture

### Current Security Measures

#### Authentication & Authorization
- **Provider**: Supabase Auth
- **Method**: JWT tokens with refresh
- **Session Management**: Server-side validation
- **Route Protection**: Middleware-based guards

#### API Security
- **Webhook Validation**: Signature verification
- **Rate Limiting**: Implemented per endpoint
- **Input Validation**: Comprehensive validation layer
- **Error Handling**: Sanitized error responses

#### Data Security
- **Database**: Row Level Security (RLS)
- **File Storage**: Signed URLs with expiration
- **Secrets Management**: Environment variables
- **Audit Logging**: Webhook events and user actions

## Known Issues and Technical Debt

### Current Technical Debt Items

#### 1. Legacy Components
- **DailyCallSingleton.ts** (302 lines) - Singleton pattern, needs refactoring
- **page-old.tsx** (334 lines) - Unused legacy page
- **TavusConversation.tsx** (395 lines) - Tightly coupled to legacy singleton

#### 2. Deprecated Services
- **validation-service.ts** - 8 deprecated methods
- **security-service.ts** - 1 deprecated method
- **objectives-templates.ts** - Legacy template system

#### 3. Backward Compatibility Code
- **Dual Analytics Storage** - 40% storage overhead
- **Legacy Type Definitions** - 3 deprecated fields
- **Re-export Wrappers** - 4 compatibility files

#### 4. Large Files Remaining
- **TavusConversation.tsx** (395 lines) - Video conversation management
- **analytics-service.ts** (459 lines) - Analytics processing
- **media-service.ts** (446 lines) - Media handling
- **integration-service.ts** (417 lines) - External API integration

## Configuration Snapshot

### Current Configuration Files

#### Build Configuration
- **Next.js**: `next.config.js` - Custom webpack config, API routes
- **TypeScript**: `tsconfig.json` - Strict mode, path mapping
- **Tailwind**: `tailwind.config.js` - Custom theme, component classes

#### Testing Configuration
- **Jest**: `jest.config.js` - Multiple environments (DOM, Node)
- **Playwright**: `playwright.config.ts` - E2E test configuration
- **Test Setup**: Environment-specific setup files

#### Development Configuration
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting
- **Husky**: Git hooks for quality gates

## Deployment Architecture

### Current Deployment Setup

#### Hosting
- **Platform**: Vercel (Next.js optimized)
- **Environment**: Production, Staging, Development
- **Domain**: Custom domain with SSL

#### Database
- **Provider**: Supabase (PostgreSQL)
- **Backup**: Automated daily backups
- **Migrations**: Version-controlled schema changes

#### External Services
- **Tavus**: Video AI platform integration
- **ElevenLabs**: Voice synthesis
- **Daily.co**: Video calling (legacy, being phased out)

## Monitoring and Observability

### Current Monitoring Stack

#### Error Tracking
- **Sentry**: Client and server-side error tracking
- **Custom Logging**: Structured logging for business events

#### Performance Monitoring
- **Vercel Analytics**: Core web vitals and performance metrics
- **Custom Metrics**: Business-specific performance tracking

#### Health Checks
- **API Health**: Automated endpoint monitoring
- **Database Health**: Connection and query performance
- **External Service Health**: Integration status monitoring

## Conclusion

This architectural snapshot represents the current state of the system after significant refactoring and organization improvements. The system has evolved from an organically grown structure to a well-organized, domain-driven architecture with clear separation of concerns.

### Key Achievements
- ✅ Service layer architecture implemented
- ✅ API routes organized by domain
- ✅ Component structure rationalized
- ✅ Test consolidation completed
- ✅ Major file size reductions achieved
- ✅ Utility consolidation completed

### Remaining Work
- 🔄 Legacy component removal (DailyCallSingleton, page-old.tsx)
- 🔄 Deprecated service cleanup
- 🔄 Backward compatibility code removal
- 🔄 Final large file refactoring
- 🔄 Comprehensive documentation completion

This snapshot serves as the baseline for the final cleanup phase and provides a reference point for understanding the system's evolution and current state.