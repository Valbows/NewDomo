# Deprecated Files and Replacement Mapping

## Overview

This document provides a comprehensive mapping of all deprecated files, functions, and backward compatibility code within the application, along with their modern replacements and removal impact analysis.

## Deprecated Files for Removal

### 1. Legacy Page Components

#### 1.1 `src/app/demos/[demoId]/experience/page-old.tsx` (334 lines)
- **Status**: Legacy page component marked for removal
- **Replacement**: `src/app/demos/[demoId]/experience/page.tsx` (180 lines)
- **Description**: Old implementation of the demo experience page
- **Dependencies**: None (isolated legacy file)
- **Removal Impact**: Safe to remove - no active references
- **Migration Notes**: All functionality has been migrated to the new page.tsx

#### 1.2 `src/app/demos/[demoId]/experience/components/DailyCallSingleton.ts` (302 lines)
- **Status**: Legacy component marked for removal
- **Replacement**: Modern CVI components in `src/components/features/cvi/`
- **Description**: Singleton pattern for Daily.co video calls
- **Dependencies**: 
  - Referenced in `TavusConversation.tsx` (needs refactoring)
  - Uses Daily.co iframe integration
- **Removal Impact**: Requires refactoring TavusConversation.tsx first
- **Migration Notes**: Replace with CVI provider pattern and hooks

### 2. Deprecated Service Files

#### 2.1 `src/lib/supabase.ts`
- **Status**: @deprecated - Backward compatibility wrapper
- **Replacement**: `src/lib/utils/supabase/` directory structure
- **Description**: Legacy Supabase client exports
- **Dependencies**: Re-exports from consolidated utilities
- **Removal Impact**: Safe to remove after import path updates
- **Migration Notes**: Update all imports to use `@/lib/utils/supabase`

#### 2.2 `src/lib/security/webhooks.ts`
- **Status**: @deprecated - Moved to utils
- **Replacement**: `src/lib/utils/security/webhooks.ts`
- **Description**: Webhook security utilities
- **Dependencies**: Re-exports from consolidated security utilities
- **Removal Impact**: Safe to remove after import path updates
- **Migration Notes**: Update imports to use `@/lib/utils/security/webhooks`

#### 2.3 `src/lib/tavus/objectives-templates.ts`
- **Status**: @deprecated - Backward compatibility
- **Replacement**: `src/lib/tavus/objectives/` modular structure
- **Description**: Legacy objectives templates
- **Dependencies**: Maintained for backward compatibility
- **Removal Impact**: Check for active usage before removal
- **Migration Notes**: Migrate to modular objectives system

#### 2.4 `src/lib/services/webhooks/validation-service.ts`
- **Status**: @deprecated - Moved to utils
- **Replacement**: `src/lib/utils/validation/webhook.ts`
- **Description**: Webhook validation business logic
- **Dependencies**: Multiple deprecated methods within the service
- **Removal Impact**: Requires updating all webhook validation calls
- **Migration Notes**: Use consolidated validation utilities

## Deprecated Functions and Methods

### 1. Webhook Security Functions

#### 1.1 `extractSignature()` in `security-service.ts`
```typescript
// Deprecated
extractSignature(header: string | null): string | null

// Replacement
import { extractSignature } from '@/lib/utils/security/webhooks';
```

### 2. Webhook Validation Functions

#### 2.1 Multiple validation methods in `validation-service.ts`
```typescript
// Deprecated methods:
validatePayloadSize(rawBody: string): WebhookValidationResult
validateHeaders(headers: Record<string, string | null>): WebhookValidationResult
extractEventType(event: WebhookEventData): string | null
requiresConversationId(eventType: string): boolean
isToolCallEvent(eventType: string | null): boolean
isObjectiveCompletionEvent(eventType: string | null): boolean
validateConversationId(conversationId: string | null | undefined): WebhookValidationResult
validateEventTimestamp(event: WebhookEventData): WebhookValidationResult

// Replacements in @/lib/utils/validation/webhook:
validateWebhookPayloadSize()
validateWebhookHeaders()
extractEventType()
requiresConversationId()
isToolCallEvent()
isObjectiveCompletionEvent()
validateConversationId()
validateEventTimestamp()
```

### 3. Supabase Client Functions

#### 3.1 Legacy client export in `client.ts`
```typescript
// Deprecated
export const createClient = createServerSupabaseClient;

// Replacement
import { createServerSupabaseClient } from '@/lib/utils/supabase';
```

## Backward Compatibility Code

### 1. Analytics Format Compatibility

#### 1.1 Legacy Analytics Storage
**Location**: Multiple service files
```typescript
// Backward compatibility code in:
// - src/lib/services/webhooks/data-ingestion-service.ts:24
// - src/lib/services/tavus/sync-service.ts:95
// - src/lib/services/webhooks/event-processing-service.ts:222

// Store in legacy analytics format for backward compatibility
await tavusService.services.analytics.ingestAnalyticsEvent(supabase, conversationId, event);
```

**Impact**: Maintains dual storage format for analytics events
**Removal Plan**: Migrate to new analytics format, then remove legacy storage

### 2. API Route Compatibility

#### 2.1 Webhook Processing Interface
**Location**: `src/lib/services/webhooks/webhook-service.ts:166`
```typescript
/**
 * Process webhook event (legacy interface for backward compatibility)
 */
async processWebhookEvent(
```

**Impact**: Maintains old webhook processing interface
**Removal Plan**: Update all callers to use new interface, then remove

### 3. Type Definitions Compatibility

#### 3.1 Demo Configuration Types
**Location**: `src/app/demos/[demoId]/configure/types.ts`
```typescript
/** @deprecated Stored in column `tavus_persona_id` on `demos` */
tavusAgentId?: string;

/** @deprecated Source of truth is column `tavus_conversation_id`; URL can be derived from Tavus API. */
tavusShareableLink?: string;

/** @deprecated Stored in column `tavus_persona_id` on `demos` */
tavusPersonaId?: string;
```

**Impact**: Maintains old field names in TypeScript interfaces
**Removal Plan**: Update database schema migration, then remove deprecated fields

## Re-export Compatibility Layers

### 1. Utility Re-exports

#### 1.1 Supabase Utilities
```typescript
// src/lib/utils/supabase.ts
// Re-exports from consolidated supabase utilities for backward compatibility
export * from './supabase/client';
export * from './supabase/browser';
```

#### 1.2 Tool Parser Re-exports
```typescript
// src/lib/tools/toolParser.ts
// Re-export the main type for backward compatibility
export type { ToolParseResult };
```

## Removal Priority and Impact Analysis

### High Priority (Safe to Remove)
1. **page-old.tsx** - No active dependencies
2. **src/lib/supabase.ts** - Simple re-export wrapper
3. **src/lib/security/webhooks.ts** - Simple re-export wrapper

### Medium Priority (Requires Refactoring)
1. **DailyCallSingleton.ts** - Requires TavusConversation.tsx refactoring
2. **validation-service.ts** - Requires updating webhook validation calls
3. **objectives-templates.ts** - Check for active usage first

### Low Priority (Complex Dependencies)
1. **Legacy analytics format** - Requires data migration strategy
2. **Deprecated type fields** - Requires database schema updates
3. **Legacy webhook interfaces** - Requires API contract updates

## Migration Checklist

### Phase 1: Simple Re-exports
- [ ] Update imports from `@/lib/supabase` to `@/lib/utils/supabase`
- [ ] Update imports from `@/lib/security/webhooks` to `@/lib/utils/security/webhooks`
- [ ] Remove simple re-export wrapper files
- [ ] Test build and functionality

### Phase 2: Component Refactoring
- [ ] Refactor TavusConversation.tsx to remove DailyCallSingleton dependency
- [ ] Implement CVI provider pattern replacement
- [ ] Remove DailyCallSingleton.ts
- [ ] Remove page-old.tsx
- [ ] Test video functionality

### Phase 3: Service Layer Cleanup
- [ ] Update all webhook validation calls to use consolidated utilities
- [ ] Remove deprecated validation service methods
- [ ] Update objectives usage to modular system
- [ ] Remove objectives-templates.ts if unused
- [ ] Test webhook processing

### Phase 4: Data Format Migration
- [ ] Plan analytics data format migration
- [ ] Update database schema for deprecated fields
- [ ] Remove legacy analytics storage code
- [ ] Remove deprecated type definitions
- [ ] Test data integrity

## Testing Strategy for Deprecated Code Removal

### 1. Pre-removal Testing
- Run full test suite to establish baseline
- Test all deprecated functionality manually
- Document expected behavior changes

### 2. Incremental Removal Testing
- Remove one deprecated item at a time
- Run targeted tests for affected functionality
- Verify no regressions in related features

### 3. Post-removal Validation
- Full integration test suite
- E2E testing of critical user journeys
- Performance testing to ensure no degradation

## Risk Assessment

### Low Risk Removals
- Simple re-export wrappers
- Unused legacy files (page-old.tsx)
- Deprecated utility functions with direct replacements

### Medium Risk Removals
- Component refactoring (DailyCallSingleton)
- Service method deprecations
- Type definition updates

### High Risk Removals
- Data format changes
- API contract modifications
- Database schema updates

## Rollback Strategy

### 1. Git Branch Strategy
- Create feature branch for each removal phase
- Maintain ability to rollback individual changes
- Tag stable points for quick recovery

### 2. Deployment Strategy
- Deploy removals in phases
- Monitor error rates and user feedback
- Maintain backward compatibility during transition

### 3. Emergency Rollback
- Keep deprecated code in separate commits
- Maintain deployment scripts for quick restoration
- Document rollback procedures for each removal type

## Success Metrics

### Code Quality Metrics
- Reduction in total lines of code
- Elimination of @deprecated annotations
- Improved TypeScript strict mode compliance

### Performance Metrics
- Bundle size reduction
- Build time improvement
- Runtime performance maintenance

### Maintainability Metrics
- Reduced code duplication
- Simplified import paths
- Cleaner architecture boundaries