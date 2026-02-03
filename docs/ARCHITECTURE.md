# Domo AI Architecture Guide

This document provides a high-level overview of the Domo AI codebase architecture.

## Table of Contents
- [System Overview](#system-overview)
- [Key Data Flows](#key-data-flows)
- [Core Components](#core-components)
- [Domo Score System](#domo-score-system)
- [Tool Call Processing](#tool-call-processing)
- [Real-time Updates](#real-time-updates)
- [File Reference](#file-reference)

---

## System Overview

Domo AI is an interactive demo platform that creates AI-powered product demonstrations using:
- **Tavus** - Conversational video AI (agent video calls via Daily.co)
- **Supabase** - Database, storage, authentication, and real-time subscriptions
- **Twelve Labs** - Video indexing and semantic search
- **Next.js 14** - React framework with App Router

### High-Level Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│   User Browser  │────▶│  Next.js App │────▶│    Supabase     │
│                 │     │  (Frontend)  │     │  (PostgreSQL)   │
└────────┬────────┘     └──────┬───────┘     └─────────────────┘
         │                     │
         │  WebRTC             │  API Routes
         ▼                     ▼
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Daily.co      │────▶│ Tavus Agent  │────▶│  Tavus Webhook  │
│  (Video Call)   │     │   (AI)       │     │   /api/tavus-   │
└─────────────────┘     └──────────────┘     │    webhook      │
                                             └─────────────────┘
```

---

## Key Data Flows

### 1. Demo Experience Flow

```
User joins demo
      │
      ▼
┌─────────────────────────────────────────────────────────────┐
│  DemoExperienceView.tsx                                     │
│  - Manages UI state (IDLE, CONVERSATION, VIDEO_PLAYING)     │
│  - Handles tool calls from AI agent                         │
│  - Tracks analytics events                                  │
└───────────────────────┬─────────────────────────────────────┘
                        │
      ┌─────────────────┼─────────────────┐
      │                 │                 │
      ▼                 ▼                 ▼
┌───────────┐    ┌───────────┐    ┌───────────────┐
│ Agent     │    │ Video     │    │ Resources     │
│ Convo     │    │ Player    │    │ Panel         │
│ View      │    │           │    │ (Insights)    │
└───────────┘    └───────────┘    └───────────────┘
```

### 2. Tool Call Flow

When the AI agent wants to play a video:

```
1. Tavus Agent emits tool call event
         │
         ▼
2. Daily.co sends app-message to browser
         │
         ▼
3. AgentConversationView receives event
         │
         ▼
4. toolParser.ts parses tool name/args
   (handles 5+ event formats)
         │
         ▼
5. DemoExperienceView.handleToolCall()
         │
         ▼
6. Video lookup (5-level fallback):
   - Case-insensitive match
   - Exact match
   - Fuzzy match
   - Keyword extraction
   - Semantic search (Twelve Labs)
         │
         ▼
7. Video plays in InlineVideoPlayer
```

### 3. Webhook → Domo Score Flow

When Tavus sends objective completion events:

```
Tavus sends webhook
         │
         ▼
/api/tavus-webhook/handler.ts
         │
         ├──▶ handleContactInfoCollection()
         │         │
         │         ▼
         │    qualification_data table
         │         │
         │         ▼
         │    Broadcast: 'field_captured'
         │
         ├──▶ handleProductInterestDiscovery()
         │         │
         │         ▼
         │    product_interest_data table
         │         │
         │         ▼
         │    Broadcast: 'topics_captured'
         │
         └──▶ handleVideoShowcaseObjective()
                   │
                   ▼
              video_showcase_data table
```

---

## Core Components

### Frontend Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `DemoExperienceView` | `src/components/conversation/` | Main demo UI, orchestrates video + conversation |
| `AgentConversationView` | `src/components/conversation/` | Daily.co integration, handles video call |
| `InlineVideoPlayer` | `src/app/demos/[demoId]/experience/components/` | Video playback with chapter support |
| `ResourcesPanel` | `src/components/resources/` | Side panel showing insights + transcript |

### API Routes

| Route | Purpose |
|-------|---------|
| `/api/create-enhanced-agent` | Creates Tavus persona with system prompt |
| `/api/start-conversation` | Starts Tavus video call, handles cleanup |
| `/api/tavus-webhook` | Receives Tavus events, updates Domo Score |
| `/api/twelve-labs/*` | Video indexing and semantic search |

### Key Hooks

| Hook | Location | Purpose |
|------|----------|---------|
| `useToolCallHandler` | `src/app/demos/[demoId]/experience/hooks/` | Processes AI tool calls |
| `useInsightsData` | `src/app/demos/[demoId]/experience/hooks/` | Real-time qualification data |
| `useRealtimeSubscription` | `src/app/demos/[demoId]/experience/hooks/` | Supabase real-time events |

---

## Domo Score System

The Domo Score measures lead qualification quality (0-5 points).

### Scoring Criteria

| Criterion | Points | Data Source | Table |
|-----------|--------|-------------|-------|
| Contact Confirmation | 1 | Email, name provided | `qualification_data` |
| Reason For Visit | 1 | Interest, pain points | `product_interest_data` |
| Platform Feature Interest | 1 | Videos watched | `video_showcase_data` |
| CTA Execution | 1 | CTA button clicked | `cta_tracking` |
| Perception Analysis | 1 | Valid video perception | `conversation_details` |

### Centralized Service

```typescript
// ONLY use DomoScoreService to write to score-related tables
import { DomoScoreService } from '@/lib/domo-score';

const service = new DomoScoreService(supabaseClient);
await service.trackContact(conversationId, demoId, { email: '...' });
await service.trackInterest(conversationId, demoId, { primaryInterest: '...' });
await service.trackVideoView(conversationId, demoId, { videoTitle: '...' });
```

**Important**: Direct writes to score tables (`qualification_data`, `product_interest_data`, etc.) are prohibited. Always use `DomoScoreService`.

---

## Tool Call Processing

### Tool Parser Architecture

The `toolParser.ts` handles multiple Tavus event formats:

```
Event arrives
     │
     ├── Is event_type 'conversation.tool_call'?
     │   └── Extract name + args from function field
     │
     ├── Is event_type 'transcription_ready'?
     │   └── Parse tool_calls from transcript array
     │
     └── Is event_type 'utterance'? (optional)
         └── Parse function call from speech text
              e.g., "fetch_video(\"Product Demo\")"
```

### Name Canonicalization

Various tool name formats are normalized:

| Input | Canonical Output |
|-------|------------------|
| `pause`, `hold on`, `pause video` | `pause_video` |
| `resume`, `play`, `continue` | `play_video` |
| `close`, `exit`, `stop video` | `close_video` |
| `next`, `skip` | `next_video` |

### Negation Detection

Prevents false positives from phrases like "don't pause":

```typescript
// These should NOT trigger pause_video:
"Don't pause the video"
"No need to close it"
```

---

## Real-time Updates

### Supabase Realtime Channels

Each demo has a dedicated channel for live updates:

```typescript
// Channel: demo-{demoId}
// Events:
//   - 'field_captured'     → Contact field collected
//   - 'topics_captured'    → Interest data collected
//   - 'video_watched'      → Video was shown
//   - 'cta_clicked'        → CTA button clicked
//   - 'conversation_ended' → Call ended
```

### Frontend Subscription

```typescript
// useInsightsData hook subscribes to real-time events
const channel = supabase.channel(`demo-${demoId}`);
channel.on('broadcast', { event: 'field_captured' }, (payload) => {
  // Update local state immediately
});
```

---

## File Reference

### Critical Files (Domo Score)

| File | Purpose |
|------|---------|
| `src/lib/domo-score/index.ts` | Centralized score service |
| `src/app/api/tavus-webhook/handler.ts` | Webhook processing |
| `src/app/api/tavus-webhook/handlers/objectiveHandlers.ts` | Objective data extraction |

### High Complexity Files

| File | Lines | Key Logic |
|------|-------|-----------|
| `DemoExperienceView.tsx` | ~940 | 5-level video lookup, state management |
| `AgentConversationView.tsx` | ~680 | Daily.co SDK, subtitle lifecycle |
| `toolParser.ts` | ~450 | Multi-format tool parsing |
| `useToolCallHandler.ts` | ~320 | Suppression window, video lookup |
| `create-enhanced-agent/route.ts` | ~480 | System prompt composition |

### Configuration Files

| File | Purpose |
|------|---------|
| `.claude/CLAUDE.md` | Claude Code instructions, branch workflow |
| `src/lib/tavus/system_prompt.md` | AI agent system prompt |
| `src/lib/tavus/tool-definitions.ts` | Tool definitions for Tavus |

---

## Development Guidelines

### Branch Strategy

```
refactor_claude_code → staging → production_ready
      (dev)            (test)       (live)
```

### Console Logging Rules

| Branch | Allowed |
|--------|---------|
| `refactor_claude_code` | All logging |
| `staging` | NODE_ENV wrapped only |
| `production_ready` | Only `console.error`, `console.warn` |

### Testing

```bash
npm run test:all    # Must be 100% passing before commit
```

---

## Related Documentation

- [Domo Score Implementation](./features/DOMO_SCORE_IMPLEMENTATION_SUMMARY.md)
- [CTA Tracking](./features/CTA_TRACKING_IMPLEMENTATION_SUMMARY.md)
- [Objectives Override Behavior](./features/OBJECTIVES_OVERRIDE_BEHAVIOR.md)
- [Deployment Guide](./guides/DEPLOYMENT_GUIDE.md)
- [Supabase Migration Guide](./guides/SUPABASE_MIGRATION_GUIDE.md)
