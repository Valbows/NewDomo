# ADR-003: Component Organization Strategy

## Status
Accepted

## Context
React components were scattered throughout the codebase without clear organization principles, making it difficult to:
- Find and reuse existing components
- Maintain consistent UI patterns
- Test components effectively
- Scale the component library

## Decision
We will organize React components using a hybrid approach combining Atomic Design principles with feature-based organization.

### Component Hierarchy
```
src/components/
├── ui/                         # Atomic components (atoms/molecules)
│   ├── Button.tsx              # Basic UI elements
│   ├── Input.tsx               # Form controls
│   ├── Modal.tsx               # Common UI patterns
│   └── index.ts                # Barrel exports
├── features/                   # Feature-specific components (organisms)
│   ├── auth/                   # Authentication components
│   │   ├── AuthProvider.tsx    # Context providers
│   │   ├── LoginForm.tsx       # Feature forms
│   │   └── index.ts            # Feature exports
│   ├── demos/                  # Demo management components
│   ├── cvi/                    # Conversational Video Interface
│   └── objectives/             # AI objectives management
└── layout/                     # Layout and navigation (templates)
    ├── Header.tsx              # Site header
    ├── Sidebar.tsx             # Navigation sidebar
    └── DashboardLayout.tsx     # Page layouts
```

## Consequences

### Positive
- **Reusability**: Clear distinction between reusable and feature-specific components
- **Consistency**: UI components enforce design system consistency
- **Testability**: Components can be tested in isolation
- **Maintainability**: Easy to find and update components
- **Scalability**: Clear patterns for adding new components

### Negative
- **Complexity**: Additional abstraction layers
- **Decision Overhead**: Developers must decide component placement
- **Refactoring**: Existing components need reorganization

## Implementation Guidelines

### UI Components (Atoms/Molecules)
- **Purpose**: Reusable, generic components with no business logic
- **Props**: Accept data and callbacks, no direct API calls
- **Styling**: Use CSS modules or styled-components
- **Examples**: Button, Input, Modal, Card, Table

```typescript
// ui/Button.tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger';
  size: 'sm' | 'md' | 'lg';
  onClick: () => void;
  children: React.ReactNode;
}

export function Button({ variant, size, onClick, children }: ButtonProps) {
  return (
    <button 
      className={`btn btn-${variant} btn-${size}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

### Feature Components (Organisms)
- **Purpose**: Business logic and feature-specific functionality
- **Data**: Can make API calls and manage state
- **Composition**: Combine UI components with business logic
- **Examples**: LoginForm, DemoList, ConversationInterface

```typescript
// features/auth/LoginForm.tsx
import { Button, Input } from '@/components/ui';
import { authService } from '@/lib/services/auth';

export function LoginForm() {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  
  const handleSubmit = async () => {
    await authService.login(credentials);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <Input 
        type="email" 
        value={credentials.email}
        onChange={(e) => setCredentials({...credentials, email: e.target.value})}
      />
      <Input 
        type="password" 
        value={credentials.password}
        onChange={(e) => setCredentials({...credentials, password: e.target.value})}
      />
      <Button variant="primary" onClick={handleSubmit}>
        Login
      </Button>
    </form>
  );
}
```

### Layout Components (Templates)
- **Purpose**: Page structure and navigation
- **Responsibility**: Layout, routing, global state
- **Examples**: Header, Sidebar, DashboardLayout

### Co-location Strategy
- Keep related files together:
  - `Component.tsx` - Main component
  - `Component.module.css` - Component styles
  - `Component.test.tsx` - Component tests
  - `types.ts` - Component-specific types
  - `utils.ts` - Component utilities

### Import Strategy
- Use barrel exports (`index.ts`) for clean imports
- Absolute imports with path mapping (`@/components/ui`)
- Group imports by type (React, libraries, internal)

```typescript
// Good import structure
import React, { useState, useEffect } from 'react';
import { Button, Input, Modal } from '@/components/ui';
import { authService } from '@/lib/services/auth';
import { LoginFormProps } from './types';
```

## Migration Strategy
1. **Audit**: Identify all existing components and their usage
2. **Categorize**: Classify components as UI, Feature, or Layout
3. **Extract**: Move components to appropriate directories
4. **Refactor**: Update imports and ensure functionality
5. **Validate**: Test all components and their integrations