# New API Route Organization Structure

## Overview

This document outlines the new domain-based API route organization structure that will replace the current flat structure of 40+ routes.

## Design Principles

1. **Domain-Driven Organization**: Routes grouped by business domain
2. **Consistent Naming**: RESTful conventions where applicable
3. **Logical Hierarchy**: Clear parent-child relationships
4. **Backward Compatibility**: Maintain existing URLs during transition
5. **Scalability**: Structure supports future growth

## Domain Structure

### 1. Authentication Domain (`/api/auth/`)

**Purpose**: User authentication, session management, and user-related operations

**Routes**:
- `POST /api/auth/setup-test-user/` - Create test user accounts
- `GET /api/auth/check-current-persona/` - Verify current user persona

**Middleware**: Authentication validation, session management

### 2. Demo Management Domain (`/api/demos/`)

**Purpose**: Demo creation, configuration, and management

**Routes**:
- `POST /api/demos/agents/create/` - Create new agent
- `POST /api/demos/agents/create-enhanced/` - Create enhanced agent
- `POST /api/demos/create-test/` - Create test demo
- `GET /api/demos/personas/info/` - Get persona information
- `POST /api/demos/agents/verify-objectives/` - Verify agent objectives
- `GET|POST /api/demos/[demoId]/custom-objectives/` - Manage custom objectives
- `POST /api/demos/[demoId]/update-persona/` - Update demo persona

**Middleware**: Demo ownership validation, configuration validation

### 3. Tavus Integration Domain (`/api/tavus/`)

**Purpose**: Tavus API integration, conversation management, and video operations

**Routes**:
- `POST /api/tavus/webhook/` - Tavus webhook handler
- `POST /api/tavus/conversations/start/` - Start conversation
- `POST /api/tavus/conversations/end/` - End conversation
- `POST /api/tavus/conversations/sync/` - Sync conversations
- `GET /api/tavus/conversations/monitor/` - Monitor conversation
- `POST /api/tavus/raven/ensure-perception/` - Ensure Raven perception
- `POST /api/tavus/raven/fix-config/` - Fix Raven configuration
- `GET /api/tavus/videos/find-id/` - Find video ID
- `POST /api/tavus/videos/seed-test/` - Seed test videos
- `GET /api/tavus/videos/e2e/` - E2E video operations

**Middleware**: Tavus API authentication, rate limiting, webhook validation

### 4. Webhook Domain (`/api/webhooks/`)

**Purpose**: Webhook handling, CTA tracking, and external integrations

**Routes**:
- `POST /api/webhooks/cta-click/` - Track CTA clicks
- `GET|POST /api/webhooks/url/` - Webhook URL management
- `POST /api/webhooks/set-url/` - Set webhook URL
- `POST /api/webhooks/update-urls/` - Update webhook URLs
- `POST /api/webhooks/product-interest/` - Product interest webhook
- `POST /api/webhooks/qualification/` - Qualification webhook
- `POST /api/webhooks/video-showcase/` - Video showcase webhook

**Middleware**: Webhook signature validation, security headers, rate limiting

### 5. Data/Analytics Domain (`/api/data/`)

**Purpose**: Data retrieval, analytics, and reporting

**Routes**:
- `GET /api/data/product-interest/` - Product interest data
- `GET /api/data/qualification/` - Qualification data
- `GET /api/data/video-showcase/` - Video showcase data

**Middleware**: Data access authorization, caching, pagination

### 6. External Integrations Domain (`/api/integrations/`)

**Purpose**: Third-party service integrations

**Routes**:
- `GET /api/integrations/elevenlabs/voices/` - ElevenLabs voices
- `POST /api/integrations/transcribe/` - Transcription service
- `GET /api/integrations/ngrok/check-url/` - Ngrok URL validation

**Middleware**: API key validation, service health checks, rate limiting

### 7. Admin/Debug Domain (`/api/admin/`)

**Purpose**: Administrative operations, debugging, and testing

**Debug Routes**:
- `GET /api/admin/debug/conversation-data/` - Debug conversation data
- `GET /api/admin/debug/conversation-id/` - Debug conversation ID
- `GET /api/admin/debug/tavus-conversation/` - Debug Tavus conversation

**Test Routes**:
- `POST /api/admin/test/conversation-completion/` - Test conversation completion
- `POST /api/admin/test/custom-objectives/` - Test custom objectives
- `POST /api/admin/test/custom-objectives-backend/` - Test objectives backend
- `POST /api/admin/test/objectives-override/` - Test objectives override
- `GET /api/admin/test/tavus-connection/` - Test Tavus connection
- `GET /api/admin/test/video-playback/` - Test video playback
- `GET /api/admin/test/video-url/` - Test video URL
- `POST /api/admin/test/webhook/` - Test webhook
- `GET /api/admin/test/env/` - Test environment

**Check Routes**:
- `GET /api/admin/check/knowledge-chunks/` - Check knowledge chunks
- `GET /api/admin/check/persona-config/` - Check persona configuration

**Development Routes**:
- `POST /api/admin/dev/attach-conversation/` - Attach conversation (dev)
- `POST /api/admin/dev/send-tavus-event/` - Send Tavus event (dev)

**Middleware**: Admin authentication, IP whitelisting, audit logging

## Shared Middleware Components

### 1. Authentication Middleware
```typescript
// middleware/auth.ts
export function requireAuth(roles?: string[]) {
  return async (req: NextRequest) => {
    // Validate user session and roles
  };
}
```

### 2. Validation Middleware
```typescript
// middleware/validation.ts
export function validateRequest(schema: ZodSchema) {
  return async (req: NextRequest) => {
    // Validate request body against schema
  };
}
```

### 3. Rate Limiting Middleware
```typescript
// middleware/rate-limit.ts
export function rateLimit(options: RateLimitOptions) {
  return async (req: NextRequest) => {
    // Implement rate limiting logic
  };
}
```

### 4. Error Handling Middleware
```typescript
// middleware/error-handler.ts
export function errorHandler() {
  return async (req: NextRequest, error: Error) => {
    // Standardized error handling and logging
  };
}
```

## Route Handler Structure

### Standard Route Handler Template
```typescript
// src/app/api/[domain]/[resource]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { validateRequest } from '@/middleware/validation';
import { DomainService } from '@/lib/services/domain';

export async function GET(req: NextRequest) {
  try {
    // Authentication
    await requireAuth()(req);
    
    // Business logic via service layer
    const result = await DomainService.getResource();
    
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

## Migration Benefits

### Developer Experience
- **Improved Discoverability**: Logical grouping makes routes easier to find
- **Consistent Patterns**: Similar operations follow same conventions
- **Better Organization**: Related functionality grouped together
- **Cleaner Imports**: Domain-based imports reduce cognitive load

### Maintainability
- **Focused Responsibilities**: Each domain handles specific concerns
- **Shared Middleware**: Common functionality reused across domains
- **Easier Testing**: Domain-specific test suites
- **Better Documentation**: Clear API structure for documentation

### Scalability
- **Room for Growth**: New routes fit naturally into existing domains
- **Performance Optimization**: Domain-specific optimizations possible
- **Security Boundaries**: Domain-level security policies
- **Monitoring**: Domain-specific metrics and alerting

## Implementation Timeline

### Week 1-2: Foundation
- Create new directory structure
- Implement shared middleware components
- Set up compatibility layer

### Week 3-4: Core Domains
- Migrate Auth and Demo Management domains
- Test backward compatibility
- Monitor error rates

### Week 5-6: Integration Domains
- Migrate Tavus and Webhook domains
- Update external integrations
- Performance optimization

### Week 7-8: Supporting Domains
- Migrate Data and Integration domains
- Clean up old routes
- Documentation updates

### Week 9-10: Admin and Cleanup
- Migrate Admin/Debug domain
- Remove compatibility layer
- Final optimization and monitoring