# API Route Restructuring Plan

## Current API Route Analysis

### Total Routes Identified: 42+ routes

## Domain-Based Route Mapping

### 1. Authentication Domain (`/api/auth/`)

**Current Routes:**
- `/api/setup-test-user/` → `/api/auth/setup-test-user/`
- `/api/check-current-persona/` → `/api/auth/check-current-persona/`

**Rationale:** These routes handle user authentication and session management.

### 2. Demo Management Domain (`/api/demos/`)

**Current Routes:**
- `/api/create-agent/` → `/api/demos/agents/create/`
- `/api/create-enhanced-agent/` → `/api/demos/agents/create-enhanced/`
- `/api/create-test-demo/` → `/api/demos/create-test/`

**Existing Structure (Keep):**
- `/api/demos/[demoId]/custom-objectives/` ✓
- `/api/demos/[demoId]/update-persona/` ✓

**Additional Routes to Move:**
- `/api/get-persona-info/` → `/api/demos/personas/info/`
- `/api/verify-agent-objectives/` → `/api/demos/agents/verify-objectives/`

### 3. Tavus Integration Domain (`/api/tavus/`)

**Current Routes:**
- `/api/tavus/` → `/api/tavus/` (keep existing)
- `/api/tavus-webhook/` → `/api/tavus/webhook/`
- `/api/start-conversation/` → `/api/tavus/conversations/start/`
- `/api/end-conversation/` → `/api/tavus/conversations/end/`
- `/api/sync-tavus-conversations/` → `/api/tavus/conversations/sync/`
- `/api/monitor-conversation/` → `/api/tavus/conversations/monitor/`
- `/api/ensure-raven-perception/` → `/api/tavus/raven/ensure-perception/`
- `/api/fix-raven-config/` → `/api/tavus/raven/fix-config/`
- `/api/find-video-id/` → `/api/tavus/videos/find-id/`
- `/api/seed-test-videos/` → `/api/tavus/videos/seed-test/`
- `/api/e2e-video/` → `/api/tavus/videos/e2e/`

### 4. Webhook Domain (`/api/webhooks/`)

**Current Routes:**
- `/api/track-cta-click/` → `/api/webhooks/cta-click/`
- `/api/webhook-url/` → `/api/webhooks/url/`
- `/api/set-webhook-url/` → `/api/webhooks/set-url/`
- `/api/update-webhook-urls/` → `/api/webhooks/update-urls/`

**Existing Structure (Keep):**
- `/api/webhook/product-interest/` → `/api/webhooks/product-interest/`
- `/api/webhook/qualification/` → `/api/webhooks/qualification/`
- `/api/webhook/video-showcase/` → `/api/webhooks/video-showcase/`

### 5. Data/Analytics Domain (`/api/data/`)

**Current Routes:**
- `/api/product-interest-data/` → `/api/data/product-interest/`
- `/api/qualification-data/` → `/api/data/qualification/`
- `/api/video-showcase-data/` → `/api/data/video-showcase/`

### 6. External Integrations Domain (`/api/integrations/`)

**Current Routes:**
- `/api/elevenlabs/voices/` → `/api/integrations/elevenlabs/voices/`
- `/api/transcribe/` → `/api/integrations/transcribe/`
- `/api/check-ngrok-url/` → `/api/integrations/ngrok/check-url/`

### 7. Admin/Debug Domain (`/api/admin/`)

**Debug Routes:**
- `/api/debug-conversation-data/` → `/api/admin/debug/conversation-data/`
- `/api/debug-conversation-id/` → `/api/admin/debug/conversation-id/`
- `/api/debug-tavus-conversation/` → `/api/admin/debug/tavus-conversation/`

**Test Routes:**
- `/api/test-conversation-completion/` → `/api/admin/test/conversation-completion/`
- `/api/test-custom-objectives/` → `/api/admin/test/custom-objectives/`
- `/api/test-custom-objectives-backend/` → `/api/admin/test/custom-objectives-backend/`
- `/api/test-objectives-override/` → `/api/admin/test/objectives-override/`
- `/api/test-tavus-connection/` → `/api/admin/test/tavus-connection/`
- `/api/test-video-playback/` → `/api/admin/test/video-playback/`
- `/api/test-video-url/` → `/api/admin/test/video-url/`
- `/api/test-webhook/` → `/api/admin/test/webhook/`
- `/api/test-env/` → `/api/admin/test/env/`

**Check Routes:**
- `/api/check-knowledge-chunks/` → `/api/admin/check/knowledge-chunks/`
- `/api/check-persona-config/` → `/api/admin/check/persona-config/`

**Development Routes:**
- `/api/dev/attach-conversation/` → `/api/admin/dev/attach-conversation/`
- `/api/dev/send-tavus-event/` → `/api/admin/dev/send-tavus-event/`

## Route Migration Summary

### Total Routes by Domain:
- **Authentication**: 2 routes
- **Demo Management**: 6 routes
- **Tavus Integration**: 11 routes
- **Webhooks**: 7 routes
- **Data/Analytics**: 3 routes
- **External Integrations**: 3 routes
- **Admin/Debug**: 17 routes

### Total: 49 routes (including existing organized routes)

## URL Compatibility Requirements

### Routes Requiring Backward Compatibility:
All existing routes will need URL compatibility layers to maintain existing integrations and prevent breaking changes.

### High-Priority Compatibility Routes:
1. `/api/tavus-webhook/` - External webhook endpoint
2. `/api/start-conversation/` - Core functionality
3. `/api/end-conversation/` - Core functionality
4. `/api/create-agent/` - Core functionality
5. `/api/webhook/*` - External webhook endpoints
6. `/api/track-cta-click/` - Analytics tracking

### Implementation Strategy:
- Create redirect middleware for old URLs
- Maintain both old and new routes during transition period
- Add deprecation warnings to old routes
- Plan sunset timeline for old routes
## 
Migration Plan for Existing Endpoints

### Phase 1: Create New Directory Structure
1. Create domain-based directories under `/src/app/api/`
2. Set up proper TypeScript path mappings
3. Create shared middleware for each domain

### Phase 2: Implement Compatibility Layer
1. Create URL redirect middleware
2. Implement route aliasing system
3. Add deprecation headers to old routes
4. Set up monitoring for old route usage

### Phase 3: Gradual Migration
1. **Week 1-2**: Auth and Demo Management routes
2. **Week 3-4**: Tavus Integration routes
3. **Week 5-6**: Webhook and Data routes
4. **Week 7-8**: Admin/Debug routes
5. **Week 9-10**: External Integration routes

### Phase 4: Cleanup and Optimization
1. Remove old route handlers
2. Clean up compatibility middleware
3. Update documentation and API references
4. Performance optimization and monitoring

## Backward Compatibility Strategy

### 1. Route Aliasing Middleware
```typescript
// middleware/route-compatibility.ts
export function createRouteAlias(oldPath: string, newPath: string) {
  return (req: NextRequest) => {
    if (req.nextUrl.pathname === oldPath) {
      const newUrl = req.nextUrl.clone();
      newUrl.pathname = newPath;
      return NextResponse.redirect(newUrl);
    }
  };
}
```

### 2. Deprecation Headers
- Add `X-Deprecated-Route: true` header to old routes
- Include `X-New-Route-Location` header with new URL
- Add `Sunset` header with deprecation timeline

### 3. Monitoring and Analytics
- Track usage of old vs new routes
- Monitor error rates during migration
- Set up alerts for breaking changes

### 4. Documentation Updates
- Update API documentation with new routes
- Provide migration guide for external consumers
- Create changelog with deprecation notices

## New API Route Organization Structure

```
src/app/api/
├── auth/
│   ├── setup-test-user/
│   └── check-current-persona/
├── demos/
│   ├── agents/
│   │   ├── create/
│   │   ├── create-enhanced/
│   │   └── verify-objectives/
│   ├── personas/
│   │   └── info/
│   ├── create-test/
│   └── [demoId]/
│       ├── custom-objectives/
│       └── update-persona/
├── tavus/
│   ├── webhook/
│   ├── conversations/
│   │   ├── start/
│   │   ├── end/
│   │   ├── sync/
│   │   └── monitor/
│   ├── raven/
│   │   ├── ensure-perception/
│   │   └── fix-config/
│   └── videos/
│       ├── find-id/
│       ├── seed-test/
│       └── e2e/
├── webhooks/
│   ├── cta-click/
│   ├── url/
│   ├── set-url/
│   ├── update-urls/
│   ├── product-interest/
│   ├── qualification/
│   └── video-showcase/
├── data/
│   ├── product-interest/
│   ├── qualification/
│   └── video-showcase/
├── integrations/
│   ├── elevenlabs/
│   │   └── voices/
│   ├── transcribe/
│   └── ngrok/
│       └── check-url/
└── admin/
    ├── debug/
    │   ├── conversation-data/
    │   ├── conversation-id/
    │   └── tavus-conversation/
    ├── test/
    │   ├── conversation-completion/
    │   ├── custom-objectives/
    │   ├── custom-objectives-backend/
    │   ├── objectives-override/
    │   ├── tavus-connection/
    │   ├── video-playback/
    │   ├── video-url/
    │   ├── webhook/
    │   └── env/
    ├── check/
    │   ├── knowledge-chunks/
    │   └── persona-config/
    └── dev/
        ├── attach-conversation/
        └── send-tavus-event/
```

## Risk Assessment and Mitigation

### High Risk Areas:
1. **External Webhook Endpoints**: Breaking these could affect external integrations
2. **Core Conversation APIs**: Critical for application functionality
3. **Authentication Routes**: Could break user sessions

### Mitigation Strategies:
1. **Comprehensive Testing**: Full integration test suite before migration
2. **Gradual Rollout**: Implement new routes alongside old ones
3. **Monitoring**: Real-time monitoring of error rates and usage
4. **Rollback Plan**: Quick rollback mechanism for each migration phase

### Success Metrics:
- Zero downtime during migration
- No increase in error rates
- Successful deprecation of old routes within timeline
- Improved developer experience with organized structure

## Implementation Checklist

### Pre-Migration:
- [ ] Create comprehensive test suite for all existing routes
- [ ] Set up monitoring and alerting
- [ ] Create migration scripts and automation
- [ ] Prepare rollback procedures

### During Migration:
- [ ] Implement new route structure
- [ ] Deploy compatibility middleware
- [ ] Monitor error rates and usage
- [ ] Update internal documentation

### Post-Migration:
- [ ] Remove old route handlers
- [ ] Clean up compatibility code
- [ ] Update external documentation
- [ ] Performance optimization review