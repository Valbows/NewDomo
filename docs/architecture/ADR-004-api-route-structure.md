# ADR-004: API Route Structure

## Status
Accepted

## Context
The original API structure had 40+ routes in a flat organization under `src/app/api/`, making it difficult to:
- Find related endpoints
- Maintain consistent patterns
- Implement shared middleware
- Scale the API as features grew

## Decision
We will organize API routes by business domain with consistent patterns and shared middleware.

### New API Structure
```
src/app/api/
├── admin/                      # Administrative endpoints
│   ├── check/                  # Health checks and diagnostics
│   ├── debug/                  # Debug utilities
│   ├── test/                   # Test endpoints
│   └── middleware.ts           # Admin authentication
├── auth/                       # Authentication endpoints
│   ├── session/                # Session management
│   ├── user/                   # User operations
│   └── setup-test-user/        # Development utilities
├── demos/                      # Demo management
│   ├── [demoId]/               # Demo-specific operations
│   ├── agents/                 # Agent creation and management
│   └── create-test/            # Test demo creation
├── tavus/                      # Tavus AI integration
│   ├── conversations/          # Conversation management
│   ├── personas/               # Persona operations
│   ├── videos/                 # Video processing
│   └── webhook/                # Tavus webhooks
└── webhooks/                   # General webhook processing
    ├── cta-click/              # CTA interaction tracking
    ├── events/                 # Event processing
    └── data/                   # Data ingestion
```

## Consequences

### Positive
- **Organization**: Related endpoints are grouped together
- **Discoverability**: Easy to find relevant API routes
- **Consistency**: Shared patterns and middleware per domain
- **Maintainability**: Clear boundaries between different concerns
- **Security**: Domain-specific authentication and authorization

### Negative
- **URL Changes**: Some existing URLs may need to change
- **Migration Effort**: Significant work to reorganize routes
- **Complexity**: More directories to navigate

## Implementation Guidelines

### Route Naming Conventions
- Use RESTful patterns where appropriate:
  - `GET /api/demos` - List demos
  - `POST /api/demos` - Create demo
  - `GET /api/demos/[id]` - Get specific demo
  - `PUT /api/demos/[id]` - Update demo
  - `DELETE /api/demos/[id]` - Delete demo

### Handler Structure
All API handlers should follow this pattern:

```typescript
// route.ts
import { NextRequest } from 'next/server';
import { authService } from '@/lib/services/auth';
import { demoService } from '@/lib/services/demos';

export async function GET(request: NextRequest) {
  try {
    // 1. Authentication
    const user = await authService.validateSession(request);
    
    // 2. Input validation
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // 3. Business logic (delegated to service)
    const demos = await demoService.getUserDemos(user.id, { limit });
    
    // 4. Response
    return Response.json({ demos });
  } catch (error) {
    // 5. Error handling
    console.error('Error fetching demos:', error);
    return Response.json(
      { error: 'Failed to fetch demos' },
      { status: 500 }
    );
  }
}
```

### Middleware Patterns
- **Authentication**: Validate user sessions and permissions
- **Validation**: Input sanitization and validation
- **Logging**: Request/response logging and monitoring
- **Rate Limiting**: Prevent abuse and ensure fair usage
- **CORS**: Cross-origin request handling

### Error Handling
Consistent error responses across all endpoints:

```typescript
// Success response
{
  "data": { /* response data */ },
  "message": "Operation completed successfully"
}

// Error response
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_ERROR_CODE",
  "details": { /* additional error context */ }
}
```

### Domain-Specific Patterns

#### Authentication Routes (`/api/auth/`)
- Handle user login, logout, registration
- Session management and token validation
- Password reset and email verification

#### Demo Routes (`/api/demos/`)
- CRUD operations for demos
- Video upload and processing
- Agent configuration and management

#### Tavus Routes (`/api/tavus/`)
- Persona creation and management
- Conversation lifecycle
- Webhook event processing

#### Webhook Routes (`/api/webhooks/`)
- Event ingestion and processing
- Tool call handling
- Data transformation and storage

### Security Considerations
- **Authentication**: All routes require valid user sessions (except public endpoints)
- **Authorization**: Users can only access their own resources
- **Input Validation**: All inputs are validated and sanitized
- **Rate Limiting**: Prevent abuse and ensure system stability
- **HTTPS Only**: All API communication over secure connections

### Testing Strategy
- **Unit Tests**: Test individual route handlers
- **Integration Tests**: Test complete request/response cycles
- **E2E Tests**: Test critical user workflows
- **Load Tests**: Ensure performance under load

## Migration Strategy
1. **Audit**: Document all existing API routes and their usage
2. **Group**: Organize routes by business domain
3. **Refactor**: Move routes to new structure with consistent patterns
4. **Update**: Update all client code to use new endpoints
5. **Validate**: Ensure all functionality works correctly
6. **Cleanup**: Remove old routes and redirect handlers