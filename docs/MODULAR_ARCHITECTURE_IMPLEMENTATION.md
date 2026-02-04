# Modular Sub-Context Architecture - Implementation Guide

## Overview

This document provides a comprehensive guide to the modular sub-context architecture implemented in Domo. This system organizes demo content, objectives, and session state into logical modules that match the natural flow of a product demonstration.

---

## Table of Contents

1. [Core Concept](#core-concept)
2. [Module Definitions](#module-definitions)
3. [Database Schema](#database-schema)
4. [Frontend Components](#frontend-components)
5. [API Endpoints](#api-endpoints)
6. [Data Flow](#data-flow)
7. [Debug Logging](#debug-logging)
8. [Integration Points](#integration-points)
9. [File Reference](#file-reference)

---

## Core Concept

Instead of a flat "upload anything" architecture, content is organized into **6 standard demo modules**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DEMO FLOW                                         │
├─────────┬──────────────┬──────────┬────────────────┬─────────┬─────────────┤
│  Intro  │ Qualification│ Overview │ Feature Deep   │ Pricing │    CTA      │
│         │              │          │     Dive       │         │             │
│ Welcome │ Understand   │ High-    │ Detailed       │ Handle  │ Guide to    │
│ visitor │ visitor      │ level    │ feature        │ pricing │ next steps  │
│         │ needs        │ product  │ demos          │ talk    │             │
│         │              │ tour     │                │         │             │
├─────────┼──────────────┼──────────┼────────────────┼─────────┼─────────────┤
│ No video│   No video   │  VIDEO   │     VIDEO      │No video │  No video   │
│ required│   required   │ REQUIRED │    REQUIRED    │required │  required   │
└─────────┴──────────────┴──────────┴────────────────┴─────────┴─────────────┘
```

---

## Module Definitions

### Default Modules

| # | Module ID | Name | Description | Video Required |
|---|-----------|------|-------------|----------------|
| 1 | `intro` | Introduction | Welcome visitors, introduce the agent, set expectations | No |
| 2 | `qualification` | Qualification | Understand visitor needs, role, and pain points | No |
| 3 | `overview` | Product Overview | High-level product walkthrough and value proposition | **Yes** |
| 4 | `feature_deep_dive` | Feature Deep Dive | Detailed feature demonstrations based on visitor interests | **Yes** |
| 5 | `pricing` | Pricing & Objections | Handle pricing questions and common objections | No |
| 6 | `cta` | Call to Action | Guide to next steps, capture contact info, schedule follow-up | No |

### TypeScript Types

```typescript
// src/lib/modules/types.ts

type ModuleId =
  | 'intro'
  | 'qualification'
  | 'overview'
  | 'feature_deep_dive'
  | 'pricing'
  | 'cta';

interface ModuleDefinition {
  moduleId: ModuleId;
  name: string;
  description: string;
  orderIndex: number;
  requiresVideo: boolean;
  uploadGuidance: string;
  objectiveIds: string[];
}

interface ModuleState {
  completedModules: ModuleId[];
  completedObjectives: string[];
  currentModuleStartedAt?: string;
  moduleData?: Record<ModuleId, Record<string, unknown>>;
}
```

---

## Database Schema

### Migration File
`supabase/migrations/20260129000000_add_modules_architecture.sql`

### Tables & Columns

#### 1. `demo_modules` (New Table)
Stores custom module configurations per demo.

```sql
CREATE TABLE demo_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    demo_id UUID REFERENCES demos(id) ON DELETE CASCADE,
    module_id TEXT NOT NULL,           -- e.g., 'intro', 'overview'
    name TEXT NOT NULL,                -- Display name
    description TEXT,                  -- Module description
    order_index INTEGER NOT NULL,      -- Sort order (1-6)
    requires_video BOOLEAN DEFAULT FALSE,
    upload_guidance TEXT,              -- Help text for uploads
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(demo_id, module_id)
);
```

#### 2. Content Tables (Modified)
Added `module_id` column to assign content to modules:

```sql
-- Videos
ALTER TABLE demo_videos ADD COLUMN module_id TEXT;

-- Knowledge sources
ALTER TABLE knowledge_sources ADD COLUMN module_id TEXT;

-- Knowledge chunks
ALTER TABLE knowledge_chunks ADD COLUMN module_id TEXT;
```

#### 3. Conversation Tracking (Modified)
Track module progress during demo sessions:

```sql
ALTER TABLE conversation_details
    ADD COLUMN current_module_id TEXT,
    ADD COLUMN module_state JSONB DEFAULT '{}';
```

### Entity Relationship

```
┌─────────────┐       ┌──────────────────┐       ┌─────────────────┐
│   demos     │──────▶│   demo_modules   │       │   demo_videos   │
│             │       │                  │       │   module_id ────┼──┐
└─────────────┘       └──────────────────┘       └─────────────────┘  │
                                                                       │
                      ┌──────────────────┐       ┌─────────────────┐  │
                      │ conversation_    │       │knowledge_chunks │  │
                      │ details          │       │   module_id ────┼──┤
                      │ current_module_id│       └─────────────────┘  │
                      │ module_state     │                            │
                      └──────────────────┘       Links to module_id ◀─┘
```

---

## Frontend Components

### 1. ModuleSelector
**Location:** `src/app/demos/[demoId]/configure/components/ModuleSelector.tsx`

Dropdown component for selecting which module content belongs to.

```tsx
<ModuleSelector
  value={selectedModuleId}
  onChange={setSelectedModuleId}
  placeholder="Select module..."
  size="sm" | "md"
  disabled={false}
/>
```

**Features:**
- Shows all 6 default modules with descriptions
- "No module (unassigned)" option
- Video requirement badges
- Used in: VideoManagement, KnowledgeBaseManagement

---

### 2. ModuleContentSection
**Location:** `src/app/demos/[demoId]/configure/components/ModuleContentSection.tsx`

Displays a single module's content with completion status.

```tsx
<ModuleContentSection
  module={moduleDefinition}
  videos={videos}
  knowledgeChunks={knowledgeChunks}
  isExpanded={true}
  onToggle={() => {}}
  isActive={false}
/>
```

**Features:**
- Expandable/collapsible content list
- Completion status indicator
- Video requirement warnings
- Upload guidance display

---

### 3. ModularContentManager
**Location:** `src/app/demos/[demoId]/configure/components/ModularContentManager.tsx`

Overview of all modules with progress tracking and bulk assignment.

```tsx
<ModularContentManager
  videos={videos}
  knowledgeChunks={knowledgeChunks}
  onContentUpdated={() => refetchContent()}
/>
```

**Features:**
- Overall progress bar (X/6 modules complete)
- Quick stats bar with module status icons
- Expand/collapse all modules
- **Bulk Assignment UI:**
  - Unassigned content section (amber warning)
  - Multi-select checkboxes
  - "Select All" / "Clear" buttons
  - Module dropdown for bulk assignment
  - Assign button with loading state

---

### 4. ModuleConfigurationEditor
**Location:** `src/app/demos/[demoId]/configure/components/ModuleConfigurationEditor.tsx`

Allows per-demo customization of modules.

```tsx
<ModuleConfigurationEditor
  demoId={demoId}
  onModulesChanged={() => refetchModules()}
/>
```

**Features:**
- View default modules (read-only initially)
- "Customize" button copies defaults to editable custom modules
- Edit module: name, description, requires_video, upload_guidance
- Reorder modules (up/down arrows)
- Delete modules
- "Reset to Defaults" button

---

### 5. ModuleProgressIndicator
**Location:** `src/components/conversation/ModuleProgressIndicator.tsx`

Real-time module progress display during demo experience.

```tsx
<ModuleProgressIndicator
  conversationId={conversationId}
  demoId={demoId}
  compact={true}  // Header mode
/>

<ModuleProgressIndicator
  conversationId={conversationId}
  demoId={demoId}
  compact={false} // Full panel mode
/>
```

**Features:**
- **Compact mode:** Progress bar + current module name (for header)
- **Full mode:**
  - Progress bar with percentage
  - Visual stepper showing all modules
  - Checkmarks for completed modules
  - Current module highlighting
  - Current module description
- **Real-time updates:** Subscribes to Supabase realtime broadcasts

**Realtime Events Handled:**
- `module_changed` - When agent transitions to new module
- `objective_completed` - When an objective within a module completes

---

## API Endpoints

### 1. Module CRUD API
**Endpoint:** `/api/demos/[demoId]/modules`

#### GET - Fetch modules
```typescript
// Response when no custom modules exist:
{
  modules: ModuleDefinition[],  // Default modules
  isDefault: true
}

// Response with custom modules:
{
  modules: DemoModule[],  // Custom modules from DB
  isDefault: false
}
```

#### POST - Initialize custom modules
```typescript
// Request:
{ useDefaults: true }  // Copy from defaults

// Response:
{ modules: DemoModule[] }  // Newly created modules
```

#### PATCH - Update a module
```typescript
// Request:
{
  moduleId: "uuid",
  updates: {
    name?: string,
    description?: string,
    order_index?: number,
    requires_video?: boolean,
    upload_guidance?: string
  }
}

// Response:
{ module: DemoModule }
```

#### DELETE - Delete module or reset
```typescript
// Delete single module:1
DELETE /api/demos/[demoId]/modules?moduleId=uuid

// Reset to defaults:
DELETE /api/demos/[demoId]/modules?resetToDefaults=true
```

---

### 2. Bulk Assignment API
**Endpoint:** `/api/content/bulk-assign-module`

#### PATCH - Bulk assign content to module
```typescript
// Request:
{
  videoIds?: string[],
  knowledgeChunkIds?: string[],
  moduleId: string | null  // null to unassign
}

// Response:
{
  success: true,
  videosUpdated: number,
  chunksUpdated: number,
  moduleId: string | null,
  warnings?: string[]  // Partial failures
}
```

---

## Data Flow

### Content Upload Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  User uploads   │────▶│  ModuleSelector  │────▶│   Content saved │
│  video/doc/QA   │     │  (optional)      │     │   with module_id│
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### LLM Prompt Assembly Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Fetch content  │────▶│  Group by module │────▶│  Build prompt   │
│  with module_id │     │  content-builder │     │  with structure │
└─────────────────┘     └──────────────────┘     └─────────────────┘

Prompt Structure:
## MODULES AND OBJECTIVES
[Module 1: Introduction]
- Objective: introduce_domo_agent
[Module 2: Qualification]
- Objective: needs_discovery
...

## KNOWLEDGE BASE BY MODULE
### Module: Introduction
[Content chunks for intro]
### Module: Product Overview
[Content chunks for overview]
...
```

### Runtime State Tracking Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Tavus sends    │────▶│  Webhook updates │────▶│  Broadcasts to  │
│  objective_     │     │  module_state in │     │  frontend via   │
│  completed      │     │  conversation_   │     │  Supabase       │
│  event          │     │  details         │     │  realtime       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                          │
                                                          ▼
                                                 ┌─────────────────┐
                                                 │ ModuleProgress  │
                                                 │ Indicator       │
                                                 │ updates UI      │
                                                 └─────────────────┘
```

---

## Debug Logging

All module components include debug logging that only runs in development.

### Log Prefixes

| Component | Prefix | Location |
|-----------|--------|----------|
| ModuleProgressIndicator | `[ModuleProgress]` | Frontend |
| ModuleSelector | `[ModuleSelector]` | Frontend |
| ModularContentManager | `[ModularContentManager]` | Frontend |
| ModuleConfigurationEditor | `[ModuleConfigEditor]` | Frontend |
| Modules API | `[DemoModules GET/POST/PATCH/DELETE]` | Backend |
| Bulk Assign API | `[BulkAssignModule]` | Backend |

### Debug Helper Pattern

```typescript
const debugLog = (message: string, data?: any) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[ComponentName] ${message}`, data !== undefined ? data : '');
  }
};
```

### What Gets Logged

**ModuleProgressIndicator:**
- Initialization with props
- Fetch attempts and results
- Realtime channel subscription status
- Module change events
- Objective completion events
- State updates

**ModularContentManager:**
- Bulk assignment start (items selected, target module)
- API call success/failure
- Updated counts

**ModuleConfigurationEditor:**
- Module fetch operations
- Initialize custom modules
- Save/delete/move operations
- Error states

**API Routes:**
- All CRUD operations with parameters
- Success/failure results
- Update counts

---

## Integration Points

### 1. Demo Experience View

The `ModuleProgressIndicator` is integrated into the header:

```tsx
// src/components/conversation/DemoExperienceView.tsx

<AgentHeader agentName={agentName || demoName} onHelpClick={handleHelpClick}>
  <ModuleProgressIndicator
    conversationId={conversationId || null}
    demoId={demoId}
    compact={true}
    className="ml-4"
  />
</AgentHeader>
```

### 2. Configure Page

Content management components use module assignment:

```tsx
// VideoManagement.tsx
<ModuleSelector
  value={selectedModuleId}
  onChange={setSelectedModuleId}
/>

// KnowledgeBaseManagement.tsx
<ModuleSelector
  value={docModuleId}
  onChange={setDocModuleId}
/>
```

### 3. Agent Header

Updated to accept children for flexible content:

```tsx
interface AgentHeaderProps {
  agentName?: string;
  connectionStatus?: 'connected' | 'connecting' | 'disconnected' | 'error';
  onHelpClick?: () => void;
  children?: ReactNode;  // NEW
}
```

---

## File Reference

### New Files Created

| File | Purpose |
|------|---------|
| `src/lib/modules/types.ts` | TypeScript types for modules |
| `src/lib/modules/default-modules.ts` | Default 6 module definitions |
| `src/lib/modules/content-builder.ts` | Build module-structured LLM prompts |
| `src/lib/modules/state-manager.ts` | Runtime module state tracking |
| `src/lib/modules/index.ts` | Barrel exports |
| `src/app/demos/[demoId]/configure/components/ModuleSelector.tsx` | Module dropdown |
| `src/app/demos/[demoId]/configure/components/ModuleContentSection.tsx` | Single module display |
| `src/app/demos/[demoId]/configure/components/ModularContentManager.tsx` | Full module overview |
| `src/app/demos/[demoId]/configure/components/ModuleConfigurationEditor.tsx` | Module customization UI |
| `src/components/conversation/ModuleProgressIndicator.tsx` | Real-time progress display |
| `src/app/api/demos/[demoId]/modules/route.ts` | Module CRUD API |
| `src/app/api/content/bulk-assign-module/route.ts` | Bulk assignment API |
| `supabase/migrations/20260129000000_add_modules_architecture.sql` | Database migration |

### Modified Files

| File | Changes |
|------|---------|
| `src/app/demos/[demoId]/configure/types.ts` | Added `module_id` to interfaces |
| `src/app/demos/[demoId]/configure/components/VideoManagement.tsx` | ModuleSelector integration |
| `src/app/demos/[demoId]/configure/components/KnowledgeBaseManagement.tsx` | ModuleSelector integration |
| `src/app/demos/[demoId]/configure/page.tsx` | Module-aware handlers |
| `src/components/conversation/AgentHeader.tsx` | Added children prop |
| `src/components/conversation/DemoExperienceView.tsx` | ModuleProgressIndicator integration |
| `src/components/conversation/index.ts` | Export ModuleProgressIndicator |

---

## Quick Start

### 1. Apply Migration
```bash
supabase db push
# or
supabase migration up
```

### 2. Test Module Selection
1. Go to Configure page for a demo
2. Upload a video
3. Select a module from the dropdown
4. Verify module_id is saved

### 3. Test Bulk Assignment
1. Go to Configure page
2. Scroll to "Content by Module" section
3. Expand "Unassigned Content"
4. Select items and assign to a module

### 4. Test Progress Indicator
1. Start a demo experience
2. Look for progress indicator in header
3. Check browser console for `[ModuleProgress]` logs

---

## Benefits

1. **Better LLM Context** - Agent knows which content relates to which demo phase
2. **Progress Tracking** - Visitors see where they are in the demo flow
3. **Organized Content** - Admins understand what content serves each purpose
4. **Customizable Flow** - Different products can have different module structures
5. **Analytics Ready** - Track completion rates per module
6. **Debug Visibility** - Comprehensive logging for development

---

## Future Enhancements

1. **Module Analytics Dashboard** - Show conversion rates per module
2. **A/B Testing Modules** - Test different module orderings
3. **Module Templates** - Pre-built module sets for different industries
4. **AI Module Suggestions** - Analyze content and suggest module assignments
5. **Module-Aware Video Search** - Filter videos by module in semantic search
