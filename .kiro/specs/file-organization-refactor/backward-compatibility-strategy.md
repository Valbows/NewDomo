# Backward Compatibility Strategy

## Overview

This document outlines the comprehensive strategy for maintaining backward compatibility during the API route restructuring process, ensuring zero downtime and no breaking changes for existing integrations.

## Compatibility Requirements

### Critical External Endpoints
These endpoints are used by external systems and require the highest level of compatibility:

1. **Webhook Endpoints**:
   - `/api/tavus-webhook/` - Tavus service callbacks
   - `/api/webhook/product-interest/` - External product interest webhooks
   - `/api/webhook/qualification/` - External qualification webhooks
   - `/api/webhook/video-showcase/` - External video showcase webhooks
   - `/api/track-cta-click/` - Analytics tracking from external sites

2. **Core API Endpoints**:
   - `/api/start-conversation/` - Frontend conversation initiation
   - `/api/end-conversation/` - Frontend conversation termination
   - `/api/create-agent/` - Agent creation from UI
   - `/api/create-enhanced-agent/` - Enhanced agent creation

### Internal Endpoints
These endpoints are used internally and have more flexibility for migration:

1. **Admin/Debug Routes**: All `/api/test-*`, `/api/debug-*`, `/api/check-*`
2. **Development Routes**: `/api/dev/*`
3. **Configuration Routes**: Most configuration and management endpoints

## Compatibility Implementation Strategy

### 1. Route Aliasing System

#### Middleware-Based Redirects
```typescript
// middleware/route-compatibility.ts
import { NextRequest, NextResponse } from 'next/server';

interface RouteAlias {
  oldPath: string;
  newPath: string;
  deprecationDate?: Date;
  sunsetDate?: Date;
}

const ROUTE_ALIASES: RouteAlias[] = [
  {
    oldPath: '/api/tavus-webhook',
    newPath: '/api/tavus/webhook',
    deprecationDate: new Date('2024-02-01'),
    sunsetDate: new Date('2024-05-01')
  },
  {
    oldPath: '/api/start-conversation',
    newPath: '/api/tavus/conversations/start',
    deprecationDate: new Date('2024-02-01'),
    sunsetDate: new Date('2024-05-01')
  },
  // ... more aliases
];

export function routeCompatibilityMiddleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  
  const alias = ROUTE_ALIASES.find(a => pathname.startsWith(a.oldPath));
  
  if (alias) {
    const newUrl = req.nextUrl.clone();
    newUrl.pathname = pathname.replace(alias.oldPath, alias.newPath);
    
    const response = NextResponse.redirect(newUrl, 308); // Permanent redirect
    
    // Add deprecation headers
    response.headers.set('X-Deprecated-Route', 'true');
    response.headers.set('X-New-Route-Location', alias.newPath);
    
    if (alias.deprecationDate) {
      response.headers.set('Deprecation', alias.deprecationDate.toISOString());
    }
    
    if (alias.sunsetDate) {
      response.headers.set('Sunset', alias.sunsetDate.toISOString());
    }
    
    return response;
  }
  
  return NextResponse.next();
}
```

#### Next.js Middleware Configuration
```typescript
// middleware.ts
import { NextRequest } from 'next/server';
import { routeCompatibilityMiddleware } from './middleware/route-compatibility';

export function middleware(req: NextRequest) {
  // Apply route compatibility first
  const compatibilityResponse = routeCompatibilityMiddleware(req);
  if (compatibilityResponse) {
    return compatibilityResponse;
  }
  
  // Continue with other middleware
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*'
  ]
};
```

### 2. Dual Route Implementation

For critical endpoints, maintain both old and new routes during transition:

#### Old Route Handler (Temporary)
```typescript
// src/app/api/tavus-webhook/route.ts
import { NextRequest } from 'next/server';
import { handleTavusWebhook } from '@/app/api/tavus/webhook/route';

export async function POST(req: NextRequest) {
  // Add deprecation warning
  console.warn('DEPRECATED: /api/tavus-webhook is deprecated. Use /api/tavus/webhook instead.');
  
  // Delegate to new handler
  return handleTavusWebhook(req);
}
```

#### New Route Handler
```typescript
// src/app/api/tavus/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { TavusWebhookService } from '@/lib/services/tavus';

export async function handleTavusWebhook(req: NextRequest) {
  // Implementation
}

export async function POST(req: NextRequest) {
  return handleTavusWebhook(req);
}
```

### 3. Deprecation Headers and Monitoring

#### Standard Deprecation Headers
```typescript
interface DeprecationHeaders {
  'X-Deprecated-Route': 'true';
  'X-New-Route-Location': string;
  'Deprecation': string; // RFC 8594 - ISO 8601 date
  'Sunset': string; // RFC 8594 - ISO 8601 date
  'Link': string; // Link to migration documentation
}
```

#### Usage Monitoring
```typescript
// lib/monitoring/route-usage.ts
export function trackRouteUsage(oldRoute: string, newRoute: string, userAgent?: string) {
  // Log to analytics service
  analytics.track('deprecated_route_usage', {
    oldRoute,
    newRoute,
    userAgent,
    timestamp: new Date().toISOString()
  });
  
  // Increment metrics
  metrics.increment('deprecated_routes.usage', {
    route: oldRoute,
    new_route: newRoute
  });
}
```

## Migration Timeline and Phases

### Phase 1: Preparation (Week 1)
- [ ] Implement route aliasing middleware
- [ ] Set up monitoring and analytics
- [ ] Create deprecation header system
- [ ] Prepare rollback procedures

### Phase 2: Low-Risk Routes (Week 2-3)
**Routes to migrate first**:
- Admin/debug routes (`/api/test-*`, `/api/debug-*`, `/api/check-*`)
- Development routes (`/api/dev/*`)
- Internal configuration routes

**Strategy**: Direct migration with deprecation warnings

### Phase 3: Medium-Risk Routes (Week 4-5)
**Routes to migrate**:
- Data endpoints (`/api/*-data`)
- Integration endpoints (`/api/elevenlabs/*`, `/api/transcribe`)
- Non-critical Tavus routes

**Strategy**: Dual implementation with monitoring

### Phase 4: High-Risk Routes (Week 6-7)
**Routes to migrate**:
- Core conversation APIs (`/api/start-conversation`, `/api/end-conversation`)
- Agent creation APIs (`/api/create-*`)
- Authentication routes

**Strategy**: Gradual rollout with feature flags

### Phase 5: Critical External Routes (Week 8-9)
**Routes to migrate**:
- Webhook endpoints (`/api/tavus-webhook`, `/api/webhook/*`)
- CTA tracking (`/api/track-cta-click`)

**Strategy**: Extended dual implementation with external communication

### Phase 6: Cleanup (Week 10-12)
- [ ] Remove old route handlers
- [ ] Clean up compatibility middleware
- [ ] Update documentation
- [ ] Performance optimization

## Risk Mitigation Strategies

### 1. Comprehensive Testing
```typescript
// __tests__/integration/route-compatibility.test.ts
describe('Route Compatibility', () => {
  test('old webhook routes redirect to new routes', async () => {
    const response = await fetch('/api/tavus-webhook', {
      method: 'POST',
      body: JSON.stringify(mockWebhookPayload)
    });
    
    expect(response.status).toBe(308); // Permanent redirect
    expect(response.headers.get('X-Deprecated-Route')).toBe('true');
    expect(response.headers.get('X-New-Route-Location')).toBe('/api/tavus/webhook');
  });
  
  test('new routes work correctly', async () => {
    const response = await fetch('/api/tavus/webhook', {
      method: 'POST',
      body: JSON.stringify(mockWebhookPayload)
    });
    
    expect(response.status).toBe(200);
  });
});
```

### 2. Feature Flags for Gradual Rollout
```typescript
// lib/feature-flags.ts
export function shouldUseNewRoute(routeName: string, userId?: string): boolean {
  // Gradual rollout based on user segments
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  
  const rolloutPercentage = getRouteRolloutPercentage(routeName);
  const userHash = userId ? hashUserId(userId) : Math.random();
  
  return userHash < rolloutPercentage;
}
```

### 3. Real-time Monitoring and Alerting
```typescript
// lib/monitoring/alerts.ts
export function setupRouteMonitoring() {
  // Monitor error rates
  metrics.gauge('route_error_rate', () => {
    return calculateErrorRate();
  });
  
  // Alert on high error rates
  if (getErrorRate() > 0.05) { // 5% error rate threshold
    alerts.send('High error rate detected during route migration');
  }
  
  // Monitor deprecated route usage
  metrics.gauge('deprecated_route_usage', () => {
    return getDeprecatedRouteUsage();
  });
}
```

### 4. Rollback Procedures
```typescript
// scripts/rollback-routes.ts
export async function rollbackToOldRoutes() {
  // Disable new routes
  await featureFlags.disable('new_api_routes');
  
  // Re-enable old route handlers
  await featureFlags.enable('legacy_api_routes');
  
  // Clear CDN cache
  await cdn.purgeCache('/api/*');
  
  // Notify team
  await notifications.send('API routes rolled back to legacy version');
}
```

## External Communication Strategy

### 1. API Documentation Updates
- Update API documentation with new routes
- Add deprecation notices to old routes
- Provide migration examples and guides
- Include timeline for deprecation

### 2. Developer Notifications
```typescript
// Email template for external developers
const migrationNotification = {
  subject: 'API Route Updates - Action Required',
  body: `
    We're improving our API structure for better organization and performance.
    
    Affected Routes:
    - /api/tavus-webhook → /api/tavus/webhook
    - /api/start-conversation → /api/tavus/conversations/start
    
    Timeline:
    - New routes available: February 1, 2024
    - Old routes deprecated: February 1, 2024
    - Old routes sunset: May 1, 2024
    
    Migration Guide: https://docs.example.com/api-migration
  `
};
```

### 3. Webhook Provider Updates
For external webhook providers (like Tavus), coordinate the URL changes:

1. **Notification**: Inform providers of new webhook URLs
2. **Dual Registration**: Register both old and new URLs temporarily
3. **Gradual Migration**: Switch providers to new URLs
4. **Cleanup**: Remove old webhook registrations

## Success Metrics

### Compatibility Success Indicators
- **Zero Breaking Changes**: No 4xx/5xx errors due to route changes
- **Smooth Transition**: <1% increase in overall error rate
- **Complete Migration**: 100% of traffic moved to new routes
- **Clean Deprecation**: All old routes removed within timeline

### Monitoring Dashboards
1. **Route Usage Dashboard**: Track old vs new route usage
2. **Error Rate Dashboard**: Monitor error rates during migration
3. **Performance Dashboard**: Compare response times
4. **External Integration Dashboard**: Monitor webhook success rates

## Rollback Criteria

### Automatic Rollback Triggers
- Error rate increases by >5% for any route
- Critical webhook failures (>10% failure rate)
- Performance degradation >50% increase in response time
- External integration failures

### Manual Rollback Scenarios
- Customer complaints about broken functionality
- Discovery of data integrity issues
- Security vulnerabilities in new implementation
- Unforeseen compatibility issues with external systems