# ADR-001: Service Layer Architecture

## Status
Accepted

## Context
The original codebase had business logic mixed directly into API route handlers and React components, making it difficult to:
- Test business logic independently
- Reuse logic across different interfaces
- Maintain consistent behavior across the application
- Scale the codebase as features grew

## Decision
We will implement a comprehensive service layer architecture that separates business logic from presentation and API concerns.

### Service Layer Structure
```
src/lib/services/
├── auth/           # Authentication and authorization
├── demos/          # Demo management and configuration
├── tavus/          # Tavus AI integration
└── webhooks/       # Webhook processing
```

### Key Principles
1. **Domain Organization**: Services are organized by business domain
2. **Single Responsibility**: Each service has a focused, well-defined purpose
3. **Dependency Injection**: Services can be easily mocked and tested
4. **Type Safety**: All services use TypeScript interfaces and types
5. **Error Handling**: Consistent error handling across all services

## Consequences

### Positive
- Business logic is testable in isolation
- Code reuse across API routes and components
- Consistent behavior and error handling
- Easier to maintain and extend functionality
- Clear separation of concerns

### Negative
- Additional abstraction layer adds complexity
- More files to maintain
- Learning curve for developers new to the pattern

## Implementation
Services are implemented as TypeScript modules with:
- Clear interfaces defining public APIs
- Comprehensive JSDoc documentation
- Input validation and error handling
- Type-safe database operations
- Consistent logging and monitoring

## Examples

### Service Definition
```typescript
export interface DemoService {
  createDemo(userId: string, data: CreateDemoData): Promise<Demo>;
  getUserDemos(userId: string): Promise<Demo[]>;
  updateDemo(demoId: string, data: UpdateDemoData): Promise<Demo>;
  deleteDemo(demoId: string): Promise<void>;
}
```

### API Route Usage
```typescript
import { demoService } from '@/lib/services/demos';

export async function POST(request: Request) {
  const data = await request.json();
  const demo = await demoService.createDemo(userId, data);
  return Response.json(demo);
}
```

### Component Usage
```typescript
import { demoService } from '@/lib/services/demos';

export function DemoList() {
  const [demos, setDemos] = useState([]);
  
  useEffect(() => {
    demoService.getUserDemos(userId).then(setDemos);
  }, [userId]);
  
  return <div>{/* UI */}</div>;
}
```