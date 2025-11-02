# Component Architecture Documentation

## Overview

This document provides a comprehensive overview of the current React component structure and dependencies within the application. The components are organized following a feature-based architecture with clear separation between UI components, feature-specific components, and layout components.

## Component Structure

### 1. Core Component Organization

The component architecture follows a three-tier structure:

```
src/components/
├── ui/                    # Shared UI components (atoms/molecules)
├── features/              # Feature-specific components (organisms)
└── layout/                # Layout and navigation components
```

### 2. UI Components (`src/components/ui/`)

**Purpose**: Reusable, generic UI components that can be used across different features.

- **CTA.tsx** - Call-to-action component with styling (CTA.module.css)
- **EnsureRavenButton.tsx** - Specialized button for Raven functionality
- **Features.tsx** - Feature showcase component
- **Hero.tsx** - Hero section component
- **RavenDebugPanel.tsx** - Debug panel for Raven functionality
- **index.ts** - Barrel export for UI components
- **types.ts** - TypeScript type definitions
- **utils.ts** - UI utility functions

### 3. Feature Components (`src/components/features/`)

**Purpose**: Domain-specific components organized by business functionality.

#### 3.1 Authentication (`auth/`)
- **AuthProvider.tsx** - Authentication context provider
- **withAuth.tsx** - Higher-order component for authentication
- **types.ts** - Authentication type definitions
- **index.ts** - Barrel exports

#### 3.2 Conversational Video Interface (`cvi/`)
**Complex nested structure for video conversation functionality:**

```
cvi/
├── components/
│   ├── audio-wave/           # Audio visualization
│   ├── conversation/         # Conversation interface
│   ├── cvi-provider/         # CVI context provider
│   └── device-select/        # Device selection UI
├── hooks/                    # CVI-specific React hooks
│   ├── use-cvi-call.tsx
│   ├── use-local-camera.tsx
│   ├── use-local-microphone.tsx
│   ├── use-local-screenshare.tsx
│   └── use-replica-ids.tsx
├── types.ts                  # CVI type definitions
└── index.ts                  # Barrel exports
```

#### 3.3 Dashboard (`dashboard/`)
- **DashboardSummary.tsx** - Main dashboard summary component
- **types.ts** - Dashboard type definitions
- **index.ts** - Barrel exports

#### 3.4 Demos (`demos/`)
- **DemoList.tsx** - List of demos with styling (DemoList.module.css)
- **DemoListItem.tsx** - Individual demo item with styling (DemoListItem.module.css)
- **constants.ts** - Demo-related constants
- **types.ts** - Demo type definitions
- **utils.ts** - Demo utility functions
- **index.ts** - Barrel exports

#### 3.5 Objectives (`objectives/`)
**Comprehensive objectives management system:**

```
objectives/
├── components/               # Sub-components
│   ├── ObjectiveForm.tsx
│   ├── ObjectivesList.tsx
│   └── index.ts
├── CustomObjectivesManager.tsx (147 lines) # Main manager component
├── ObjectivesBuilder.tsx     # Objectives builder interface
├── ObjectivesStatus.tsx      # Status display component
├── constants.ts              # Objectives constants
├── types.ts                  # Type definitions
├── utils.ts                  # Utility functions
└── index.ts                  # Barrel exports
```

#### 3.6 Webhooks (`webhooks/`)
- **WebhookUrlDisplay.tsx** - Webhook URL display component
- **types.ts** - Webhook type definitions
- **index.ts** - Barrel exports

### 4. Layout Components (`src/components/layout/`)

**Purpose**: Application layout and navigation components.

- **DashboardLayout.tsx** - Main dashboard layout wrapper
- **Footer.tsx** - Application footer
- **Header.tsx** - Application header
- **Sidebar.tsx** - Navigation sidebar
- **types.ts** - Layout type definitions
- **index.ts** - Barrel exports

### 5. Page-Level Components (`src/app/`)

**Purpose**: Next.js App Router pages and page-specific components.

#### 5.1 Demo Configuration (`demos/[demoId]/configure/`)
**Comprehensive demo configuration interface:**

```
configure/
├── components/
│   ├── reporting/            # Reporting sub-components
│   │   ├── ContactInfoCard.tsx
│   │   ├── CtaTrackingCard.tsx
│   │   ├── DomoScoreCard.tsx
│   │   ├── ProductInterestCard.tsx
│   │   ├── VideoShowcaseCard.tsx
│   │   └── index.ts
│   ├── AdminCTAUrlEditor.tsx
│   ├── AgentSettings.tsx
│   ├── ConfigurationForms.tsx
│   ├── ConfigurationHeader.tsx
│   ├── ConfigurationPreview.tsx
│   ├── CTASettings.tsx
│   ├── KnowledgeBaseManagement.tsx
│   ├── Reporting.tsx (428 lines) # Main reporting component
│   ├── ReportingCharts.tsx (81 lines)
│   ├── ReportingFilters.tsx (45 lines)
│   ├── ReportingSummary.tsx (7 lines) # Now just exports
│   ├── ReportingTables.tsx (281 lines)
│   ├── ReportingUtils.tsx (249 lines)
│   ├── SettingsPanels.tsx
│   ├── VideoManagement.tsx
│   └── VideoPlayer.tsx
├── hooks/                    # Configuration-specific hooks
├── page.tsx (254 lines)      # Main configuration page
└── types.ts                  # Configuration types
```

#### 5.2 Demo Experience (`demos/[demoId]/experience/`)
**User-facing demo experience interface:**

```
experience/
├── components/
│   ├── ConversationInterface.tsx
│   ├── CTABanner.tsx
│   ├── DailyCallSingleton.ts (302 lines) # Legacy component
│   ├── DemoHeader.tsx
│   ├── InlineVideoPlayer.tsx
│   ├── StatusIndicators.tsx
│   ├── TavusConversation.tsx (395 lines)
│   ├── TavusConversationCVI.tsx
│   └── VideoControls.tsx
├── hooks/                    # Experience-specific hooks
├── page.tsx (180 lines)      # Main experience page
└── page-old.tsx (334 lines)  # Legacy page (marked for removal)
```

## Component Dependencies and Relationships

### 1. Dependency Flow

```
Pages (App Router)
    ↓
Layout Components
    ↓
Feature Components
    ↓
UI Components + CVI Components
    ↓
Hooks + Services + Utilities
```

### 2. Key Dependencies

#### Authentication Flow
- **AuthProvider** → **withAuth** → **Protected Pages**
- **AuthProvider** uses auth services from `src/lib/services/auth/`

#### Demo Management Flow
- **DemoList** → **DemoListItem** → **Demo Services**
- **Configuration Pages** → **Configuration Components** → **Demo Services**
- **Experience Pages** → **Conversation Components** → **Tavus Services**

#### CVI Integration
- **TavusConversation** → **CVI Components** → **CVI Hooks**
- **CVI Provider** → **Device Selection** → **Audio/Video Components**

### 3. Cross-Feature Dependencies

- **Objectives components** integrate with **Demo configuration**
- **Webhook components** integrate with **Admin functionality**
- **CTA components** span across **UI** and **Demo features**
- **Reporting components** integrate with **Analytics services**

## Component Size Analysis

### Large Components (300+ lines)
1. **TavusConversation.tsx** - 395 lines (conversation management)
2. **Reporting.tsx** - 428 lines (main reporting interface)
3. **DailyCallSingleton.ts** - 302 lines (legacy, marked for removal)
4. **page-old.tsx** - 334 lines (legacy, marked for removal)

### Refactored Components (Successfully reduced)
1. **CustomObjectivesManager.tsx** - Reduced to 147 lines
2. **experience/page.tsx** - Reduced to 180 lines
3. **configure/page.tsx** - Reduced to 254 lines
4. **ReportingSummary.tsx** - Reduced to 7 lines (now just exports)

## Component Co-location Strategy

### 1. Styling Co-location
- CSS modules are co-located with components (e.g., `DemoList.module.css`)
- Feature-specific styles kept within feature directories

### 2. Type Co-location
- Each feature directory contains its own `types.ts` file
- Shared types are in component-level `types.ts` files

### 3. Utility Co-location
- Feature-specific utilities are co-located (e.g., `demos/utils.ts`)
- Cross-feature utilities are in `src/lib/utils/`

## Import Patterns

### 1. Barrel Exports
All feature directories use `index.ts` files for clean imports:
```typescript
// From feature directories
export { AuthProvider } from './AuthProvider';
export { withAuth } from './withAuth';

// Usage
import { AuthProvider, withAuth } from '@/components/features/auth';
```

### 2. Path Mapping
Components use absolute imports with TypeScript path mapping:
```typescript
import { DemoService } from '@/lib/services/demos';
import { Button } from '@/components/ui';
```

## Testing Strategy

### 1. Component Testing Structure
```
__tests__/unit/components/
├── features/
│   ├── auth/
│   ├── cvi/
│   ├── demos/
│   └── objectives/
└── ui/
```

### 2. Test Co-location
- Unit tests mirror the component structure
- Integration tests focus on component interactions
- E2E tests cover complete user workflows

## Future Considerations

### 1. Component Optimization
- Consider further breaking down **TavusConversation.tsx** (395 lines)
- Evaluate **Reporting.tsx** for additional modularization
- Remove legacy components (**DailyCallSingleton.ts**, **page-old.tsx**)

### 2. Architecture Improvements
- Implement component composition patterns for complex features
- Consider implementing a design system for UI components
- Evaluate state management patterns for complex component interactions

### 3. Performance Considerations
- Implement lazy loading for large feature components
- Consider code splitting at the feature level
- Optimize bundle size for page-level components

## Component Interaction Patterns

### 1. Provider Pattern
- **AuthProvider** manages authentication state
- **CVI Provider** manages video conversation state

### 2. HOC Pattern
- **withAuth** provides authentication wrapper
- Used for protecting routes and components

### 3. Compound Component Pattern
- **Reporting components** work together as a compound system
- **CVI components** form a cohesive video interface system

### 4. Render Props / Custom Hooks
- **CVI hooks** provide reusable video functionality
- **Configuration hooks** manage form state and validation