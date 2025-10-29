# Component Organization

This directory follows **Atomic Design** principles to create a scalable and maintainable component architecture.

## Structure Overview

```
src/components/
├── ui/                    # Atoms & Molecules
├── layout/               # Organisms & Templates  
├── features/             # Feature-specific Organisms
└── index.ts             # Main barrel export
```

## Atomic Design Hierarchy

### 🔬 Atoms (`src/components/ui/`)
Basic building blocks that can't be broken down further.

**Examples:**
- Buttons
- Input fields
- Labels
- Icons
- Typography elements

**Characteristics:**
- Single responsibility
- Highly reusable
- No business logic
- Style variants only

### 🧬 Molecules (`src/components/ui/`)
Simple combinations of atoms that work together as a unit.

**Examples:**
- Search bars (input + button)
- Form groups (label + input + error)
- Navigation items (icon + text + badge)
- Card headers (title + actions)

**Characteristics:**
- Combine 2-3 atoms
- Single purpose
- Reusable across features
- Minimal business logic

### 🦠 Organisms (`src/components/layout/` & `src/components/features/`)
Complex UI components made of molecules and atoms.

**Layout Organisms:**
- Header (navigation + user menu + search)
- Footer (links + copyright + social)
- Sidebar (navigation + user info)

**Feature Organisms:**
- Demo lists
- Objective managers
- Auth forms
- CVI conversation interface

**Characteristics:**
- Feature-specific functionality
- Business logic integration
- Compose multiple molecules
- Domain-focused

### 📄 Templates (`src/components/layout/`)
Page-level layouts that define structure without content.

**Examples:**
- DashboardLayout
- AuthLayout
- PublicLayout

**Characteristics:**
- Define page structure
- Slot-based content areas
- Responsive behavior
- No specific content

### 📱 Pages (`src/app/`)
Specific instances of templates with real content.

**Examples:**
- Dashboard page
- Demo configuration page
- Sign-in page

**Characteristics:**
- Use templates
- Provide real content
- Handle routing
- Connect to data sources

## Co-location Strategy

Each component follows a co-location pattern:

```
ComponentName/
├── index.tsx              # Main component
├── ComponentName.module.css  # Styles
├── ComponentName.test.tsx    # Tests
├── types.ts              # Component-specific types
├── utils.ts              # Component utilities
└── constants.ts          # Component constants
```

### Feature Components Structure

```
features/
├── auth/
│   ├── AuthProvider.tsx
│   ├── withAuth.tsx
│   ├── types.ts
│   ├── constants.ts
│   └── index.ts
├── demos/
│   ├── DemoList.tsx
│   ├── DemoList.module.css
│   ├── DemoListItem.tsx
│   ├── DemoListItem.module.css
│   ├── types.ts
│   ├── utils.ts
│   ├── constants.ts
│   └── index.ts
└── cvi/
    ├── components/
    │   ├── audio-wave/
    │   │   ├── index.tsx
    │   │   └── audio-wave.module.css
    │   └── conversation/
    │       ├── index.tsx
    │       └── conversation.module.css
    ├── hooks/
    │   ├── use-cvi-call.tsx
    │   └── use-local-camera.tsx
    ├── types.ts
    └── index.ts
```

## Import Strategy

### Barrel Exports
Each directory has an `index.ts` file that exports all public components:

```typescript
// src/components/ui/index.ts
export { default as Button } from './Button';
export { default as Input } from './Input';
export type * from './types';
export * from './utils';
```

### Path Mapping
Use absolute imports with TypeScript path mapping:

```typescript
// ✅ Good
import { Button, Input } from '@/components/ui';
import { DemoList } from '@/components/features/demos';

// ❌ Avoid
import Button from '../../../components/ui/Button';
```

## Component Guidelines

### Naming Conventions
- **PascalCase** for component names
- **kebab-case** for CSS modules
- **camelCase** for props and functions

### Props Interface
Always define TypeScript interfaces for props:

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
}
```

### CSS Modules
Use CSS modules for component-specific styles:

```css
/* Button.module.css */
.button {
  @apply inline-flex items-center justify-center font-medium rounded-md;
}

.primary {
  @apply bg-blue-600 text-white hover:bg-blue-700;
}
```

### Testing Strategy
- **Unit tests** for individual components
- **Integration tests** for component interactions
- **Visual regression tests** for UI consistency

## Best Practices

### 1. Single Responsibility
Each component should have one clear purpose.

### 2. Composition over Inheritance
Build complex components by composing simpler ones.

### 3. Props Interface Design
- Keep props minimal and focused
- Use TypeScript for type safety
- Provide sensible defaults

### 4. Style Isolation
- Use CSS modules for component styles
- Avoid global CSS dependencies
- Follow design system tokens

### 5. Accessibility
- Include proper ARIA attributes
- Support keyboard navigation
- Provide semantic HTML

### 6. Performance
- Use React.memo for expensive components
- Implement proper key props for lists
- Lazy load heavy components

## Migration Guide

When refactoring existing components:

1. **Identify the atomic level** (atom, molecule, organism)
2. **Move to appropriate directory**
3. **Create co-located files** (styles, tests, types)
4. **Update imports** throughout the codebase
5. **Add to barrel exports**
6. **Update documentation**

## Tools and Utilities

### Component Generator
Use the component generator script to create new components:

```bash
npm run generate:component ComponentName --type=atom
npm run generate:component FeatureName --type=organism --feature=demos
```

### Style Guide
Reference the design system for:
- Color palette
- Typography scale
- Spacing system
- Component variants

### Testing Utilities
Common testing patterns and utilities are available in:
- `__tests__/utils/` - Test helpers
- `__tests__/mocks/` - Mock components and data