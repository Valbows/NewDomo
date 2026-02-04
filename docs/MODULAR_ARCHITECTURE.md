# Domo Modular Sub-Context Architecture

## Overview

This document describes the complete modular sub-context architecture for Domo, which organizes demo content, objectives, and session state into logical modules that match the natural flow of a product demonstration.

---

## Core Concept

Instead of a flat "upload anything" architecture, content is now organized into **6 standard demo modules**:

| # | Module ID | Name | Purpose | Video Required |
|---|-----------|------|---------|----------------|
| 1 | `intro` | Introduction | Welcome visitors, introduce the agent | No |
| 2 | `qualification` | Qualification | Understand visitor needs and role | No |
| 3 | `overview` | Product Overview | High-level product walkthrough | Yes |
| 4 | `feature_deep_dive` | Feature Deep Dive | Detailed feature demonstrations | Yes |
| 5 | `pricing` | Pricing & Objections | Handle pricing and objections | No |
| 6 | `cta` | Call to Action | Guide to next steps, capture contact | No |

---

## Architecture Components

### 1. Core Module System (`src/lib/modules/`)

| File | Purpose |
|------|---------|
| `types.ts` | TypeScript types: `ModuleId`, `ModuleDefinition`, `ModuleState`, `DemoModule` |
| `default-modules.ts` | Default 6 modules with objective mappings and helpers |
| `content-builder.ts` | Builds module-structured sections for LLM prompts |
| `state-manager.ts` | Runtime tracking of module progress |
| `index.ts` | Barrel exports |

### 2. Database Schema

```sql
-- Custom modules per demo (optional customization)
CREATE TABLE demo_modules (
    id UUID PRIMARY KEY,
    demo_id UUID REFERENCES demos(id),
    module_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    requires_video BOOLEAN DEFAULT FALSE,
    upload_guidance TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content organization
ALTER TABLE demo_videos ADD COLUMN module_id TEXT;
ALTER TABLE knowledge_chunks ADD COLUMN module_id TEXT;

-- Runtime tracking
ALTER TABLE conversation_details ADD COLUMN current_module_id TEXT;
ALTER TABLE conversation_details ADD COLUMN module_state JSONB DEFAULT '{}';
```

### 3. UI Components (`src/app/demos/[demoId]/configure/components/`)

| Component | Purpose |
|-----------|---------|
| `ModuleSelector.tsx` | Dropdown for assigning content to modules |
| `ModuleContentSection.tsx` | Displays a single module's content |
| `ModularContentManager.tsx` | Overview of all modules with bulk assignment |
| `ModuleConfigurationEditor.tsx` | Customize modules for a specific demo |

### 4. API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/demos/[demoId]/modules` | GET | Fetch modules (custom or defaults) |
| `/api/demos/[demoId]/modules` | POST | Initialize custom modules |
| `/api/demos/[demoId]/modules` | PATCH | Update a module |
| `/api/demos/[demoId]/modules` | DELETE | Delete module or reset to defaults |
| `/api/content/bulk-assign-module` | PATCH | Bulk assign content to modules |

### 5. Demo Experience Component

| Component | Purpose |
|-----------|---------|
| `ModuleProgressIndicator.tsx` | Real-time progress display during demo |

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
```

---

## Key Features

### 1. Module Selection During Upload

When uploading videos or knowledge, users can optionally assign content to a specific module:

- **VideoManagement**: Module dropdown in upload form + inline module editing
- **KnowledgeBaseManagement**: Module dropdown for docs, URLs, and Q&A pairs

### 2. Module Progress Display

The `ModuleProgressIndicator` component shows:
- Current module
- Completed modules (checkmarks)
- Overall progress percentage
- Module descriptions

Two display modes:
- **Compact**: Just progress bar and current module
- **Full**: All modules with visual stepper

### 3. Bulk Module Assignment

The `ModularContentManager` allows:
- Select multiple unassigned items
- Choose target module from dropdown
- Assign in bulk with one click

### 4. Custom Module Configuration

The `ModuleConfigurationEditor` provides:
- View default modules
- "Customize" to create editable copies
- Edit module name, description, requirements
- Reorder modules (up/down arrows)
- Delete modules
- Reset to defaults

---

## Usage Examples

### Assigning Module During Video Upload

```typescript
// In page.tsx
const handleVideoUpload = async (moduleId?: ModuleId | null) => {
  await videoUpload({
    selectedVideoFile,
    videoTitle,
    demoId,
    moduleId, // Now passed to handler
    // ...
  });
};
```

### Checking Module Progress in Demo Experience

```tsx
<ModuleProgressIndicator
  conversationId={conversationId}
  demoId={demoId}
  compact={true}
/>
```

### Using Module-Structured Prompts

```typescript
// In create-enhanced-agent/route.ts
const moduleContentSection = buildModuleContentSection(
  knowledgeChunks,
  videos
);
const modulesObjectivesSection = buildModulesObjectivesSection();

const enhancedSystemPrompt = basePrompt
  + modulesObjectivesSection
  + moduleContentSection;
```

---

## Benefits

1. **Better LLM Context**: Agent knows which content relates to which demo phase
2. **Progress Tracking**: Visitors see where they are in the demo flow
3. **Organized Content**: Admins understand what content serves each purpose
4. **Customizable Flow**: Different products can have different module structures
5. **Analytics Ready**: Track completion rates per module

---

## Files Modified/Created

### New Files
- `src/lib/modules/types.ts`
- `src/lib/modules/default-modules.ts`
- `src/lib/modules/content-builder.ts`
- `src/lib/modules/state-manager.ts`
- `src/lib/modules/index.ts`
- `supabase/migrations/20260129000000_add_modules_architecture.sql`
- `src/app/demos/[demoId]/configure/components/ModuleSelector.tsx`
- `src/app/demos/[demoId]/configure/components/ModuleContentSection.tsx`
- `src/app/demos/[demoId]/configure/components/ModularContentManager.tsx`
- `src/app/demos/[demoId]/configure/components/ModuleConfigurationEditor.tsx`
- `src/app/demos/[demoId]/configure/components/modules/index.ts`
- `src/components/conversation/ModuleProgressIndicator.tsx`
- `src/app/api/demos/[demoId]/modules/route.ts`
- `src/app/api/content/bulk-assign-module/route.ts`

### Modified Files
- `src/app/demos/[demoId]/configure/types.ts` - Added `module_id` to interfaces
- `src/app/demos/[demoId]/configure/handlers/videoHandlers.ts` - Module support
- `src/app/demos/[demoId]/configure/handlers/knowledgeHandlers.ts` - Module support
- `src/app/demos/[demoId]/configure/components/VideoManagement.tsx` - ModuleSelector
- `src/app/demos/[demoId]/configure/components/KnowledgeBaseManagement.tsx` - ModuleSelector
- `src/app/demos/[demoId]/configure/page.tsx` - Module-aware handlers
- `src/app/api/transcribe/route.ts` - Propagates module_id
- `src/app/api/create-enhanced-agent/route.ts` - Module-structured prompts
- `src/lib/tavus/objectives-templates.ts` - Added moduleId to objectives
- `src/app/api/tavus-webhook/handler.ts` - Module state tracking
- `src/components/conversation/index.ts` - Export ModuleProgressIndicator

---

## Next Steps (Future Enhancements)

1. **Module Analytics Dashboard**: Show conversion rates per module
2. **A/B Testing Modules**: Test different module orderings
3. **Module Templates**: Pre-built module sets for different industries
4. **AI Module Suggestions**: Analyze content and suggest module assignments
5. **Module-Aware Video Search**: Filter videos by module in semantic search

---

## Quick Reference

### ModuleId Type
```typescript
type ModuleId =
  | 'intro'
  | 'qualification'
  | 'overview'
  | 'feature_deep_dive'
  | 'pricing'
  | 'cta';
```

### ModuleState Type
```typescript
interface ModuleState {
  completedModules: ModuleId[];
  completedObjectives: string[];
  currentModuleStartedAt?: string;
  moduleData?: Record<ModuleId, Record<string, unknown>>;
}
```

### Key Imports
```typescript
import { DEFAULT_PRODUCT_DEMO_MODULES, getModuleDefinition } from '@/lib/modules';
import { ModuleSelector } from './components/ModuleSelector';
import { ModularContentManager } from './components/ModularContentManager';
import { ModuleProgressIndicator } from '@/components/conversation';
```
