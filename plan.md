# Domo A.I. - Comprehensive Project Plan
(S.A.F.E. D.R.Y. A.R.C.H.I.T.E.C.T. Implementation)

## API Documentation References

**Always consult these official documentation sources when implementing integrations:**

### Tavus API Documentation
- Main Documentation: [Tavus Documentation](https://docs.tavus.io/sections/introduction)
- Tool Call Event Schema: [Tavus Tool Call Events](https://docs.tavus.io/sections/event-schemas/conversation-toolcall#tool-call-event)
- Conversation API: [Tavus Conversations](https://docs.tavus.io/sections/api-reference/conversations)

### ElevenLabs Documentation
- Full Documentation: [ElevenLabs Docs](https://elevenlabs.io/docs/llms-full.txt)
- Transcription API: [ElevenLabs Transcription](https://elevenlabs.io/docs/api-reference/transcription)

### Supabase Documentation
- General Documentation: [Supabase Docs](https://supabase.com/llms.txt)
- PostgreSQL Vector: [pgvector Extension](https://supabase.com/docs/guides/database/extensions/pgvector)
- Storage Documentation: [Supabase Storage](https://supabase.com/docs/guides/storage)

## Notes
- Project follows the S.A.F.E. D.R.Y. A.R.C.H.I.T.E.C.T. Protocol strictly.
- Implementation plan is detailed and must not be reduced; only expanded with new info.
- Tavus API key, endpoints, and video upload process provided by user.
- User will provide 3-5 MP4 demo videos on demand.
- Specific Q&A content and user journey scenarios for demo agent provided (happy-path, interrupt-path, off-topic-path, resilience-path).
- UI/UX must follow the attached screenshots for all phases (homepage, sign in, dashboard, demo creation, uploads, configuration page).
- Branding, layout, and color scheme must match provided screenshots exactly.
- MVP is a browser-based web app for controlled demos; no live end-users or authentication for MVP.
- All demo content and knowledge base must be pre-loaded for showcase.
- No PII is collected or stored; security scope is limited to public demo data.
- Comprehensive logging and error handling are required for all Tavus and ElevenLabs interactions.
- Success is defined by >99.5% tool call reliability, <2s latency, and full demo journey completion.
- Expanded architecture, UI/UX, and scenario requirements now included per canonical plan.
- Technical stack, testing, accessibility, and design system requirements are detailed and must be strictly followed.
- For step-by-step execution details and scenario-based testing, refer to this unified plan.md as the single source of truth.
- Always consult official API documentation for integrations and troubleshooting.
- All reference screenshots for UI pages have been received. Proceed with UI/UX implementation for: Homepage, Sign In Page, User Dashboard, Create a Demo Page, Upload Txt Page, Upload Video Page, Demo Configuration Page. Each page must match the provided reference for color, font, layout, and spacing.

## Task List
- [ ] Complete Phase 0: 5-Day Validation Sprint
  - [ ] Days 1-2: Technical Research & Prototyping
    - [ ] Validate Tavus Integration (Next.js app, tool_call/utterance event validation, Hybrid Listener prototype, WebRTC logic, tavus-integration-test/ output)
    - [ ] Confirm Service Tiers & Quotas (pricing, quotas, usage restrictions for Tavus/ElevenLabs)
  - [ ] Day 3: Architecture & Data Design
    - [ ] Finalize and implement PostgreSQL schema in Supabase (videos, knowledge_chunks, indexes)
    - [ ] Set up Zustand state management and store slices
    - [ ] Map all UI states (LOADING, THINKING, PLAYING, PAUSED, SPEAKING, ERROR, COMPLETE, SERVICE_DEGRADED)
  - [ ] Day 4: Agent Behavior & Content Strategy
    - [ ] Define and document system prompt and agent behavior (per canonical system_prompt.md)
    - [ ] Document and test content workflow (video upload, transcription, embedding, storage, Q&A pairs)
    - [ ] Specify and prepare demo video content (3-5 segments, 30-60s each, narration, story arc)
  - [ ] Day 5: Risk Mitigation & Dependencies
    - [ ] Implement Hybrid Listener logic for tool call resilience (regex, malformed event handling)
    - [ ] Set up all dependencies and comprehensive logging strategy (Tavus/ElevenLabs events, tool call success/failure, playback errors)
- [ ] Complete Phase 1: Core Build (14 Days)
  - [ ] Implement static UI per screenshots (homepage, sign in, dashboard, demo creation, uploads, configuration)
    - [ ] Homepage (match reference)
    - [ ] Sign In Page (match reference)
    - [ ] User Dashboard (match reference)
    - [ ] Create a Demo Page (match reference)
    - [x] Create/Upload Demo Page (This will now be a video upload page, replacing the text upload page)
    - [ ] Demo Configuration Page (match reference)
  - [ ] Integrate Zustand for global state management
  - [ ] Integrate Supabase for DB and storage
  - [ ] Integrate react-player and Framer Motion for video and animation
  - [ ] Integrate Tavus CVI for AI agent and video chat
  - [ ] Implement Hybrid Listener in TavusAvatar component
  - [ ] Implement all agent tool call scenarios (fetch_video, show_trial_cta, error/fallback)
  - [ ] Implement scenario-based Q&A logic (happy-path, interrupt, off-topic, resilience)
  - [ ] Implement logging for all Tavus/ElevenLabs events and tool calls
  - [ ] Conduct multi-layer automated testing (unit, integration, AI behavior, E2E)
  - [ ] Prepare and validate demo environment (Netlify + Supabase)
- [ ] Document all architectural decisions, logs, and test results
- [ ] Review and iterate on UX for accessibility and usability
- [ ] Ensure all expanded requirements from canonical plan.md are implemented (architecture, design, scenarios, accessibility, testing, deployment, etc.)
- [ ] Validate agent behavior and demo flow for all explicit scenarios:
  - [ ] Happy-path: linear demo completion
  - [ ] Interrupt-path: mid-video Q&A and resume
  - [ ] Off-topic-path: steer back to demo
  - [ ] Resilience-path: service failure fallback
- [x] Consolidate all plan files into a single unified plan.md and delete redundant files
- [ ] Delete redundant plan files (other plan.md/build-plan.md)

## Scenario-Based Testing Plan

### Scenario 1: Happy Path
1. User navigates to demo URL
2. User greeted by AI agent
3. User asks to see product demo
4. Agent triggers fetch_video for first video
5. Video plays completely
6. User asks relevant question
7. Agent answers from knowledge base
8. Agent suggests moving to next feature
9. Complete sequence proceeds through all videos
10. Agent triggers show_trial_cta at completion

### Scenario 2: Interrupt Path
1. Video is playing
2. User interrupts with question
3. Video pauses
4. Agent answers question
5. Agent asks if user wants to resume
6. Video resumes from pause point

### Scenario 3: Off-Topic Path
1. User asks irrelevant question
2. Agent politely declines to answer
3. Agent steers conversation back to demo

### Scenario 4: Resilience Path
1. ElevenLabs TTS service fails
2. UI shows degraded service state
3. Agent responses appear as text only
4. Demo can still continue with user interaction

## PHASE 0: PRE-BUILD VALIDATION SPRINT (5 Days)

### Days 1-2: Technical Research & Prototyping

#### Task: Validate Tavus Integration
- Build minimal Next.js app to connect to Tavus CVI
- Confirm exact format of tool_call vs utterance events using live API
  - Tavus API Key: 9e3a9a6a54e44edaa2e456191ba0d0f3
  - API Base URL: https://tavusapi.com
  - Key endpoints:
    - https://tavusapi.com/v2/conversations (for creating conversations)
    - https://tavusapi.com/v2/replicas (for replica operations)
    - https://tavusapi.com/v2/videos (for video operations)
    - https://tavusapi.com/v2/speech (for speech generation)
- Prototype Hybrid Listener with live data to validate regex approach
- Document WebRTC connection/reconnection logic and error handling
- Output: tavus-integration-test/ directory with working prototype

#### Task: Confirm Service Tiers & Quotas
- Review Tavus and ElevenLabs pricing for chosen tiers
- Validate quota limits support planned demo usage
- Document any usage restrictions or rate limits

### Day 3: Architecture & Data Design

#### Task: Finalize Database Schema
```sql
-- FINAL POSTGRESQL SCHEMA
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    storage_url TEXT NOT NULL, -- Supabase Storage URL
    sequence_order INT NOT NULL, -- Linear playback order
    duration_seconds INT, -- For UI progress indicators
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    content TEXT NOT NULL, -- Transcribed text or Q&A pairs
    embedding VECTOR(1536), -- OpenAI embeddings for semantic search
    chunk_type VARCHAR(20) DEFAULT 'transcript', -- 'transcript' or 'qa_pair'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_videos_sequence ON videos(sequence_order);
CREATE INDEX idx_knowledge_video ON knowledge_chunks(video_id);
CREATE INDEX idx_knowledge_embedding ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops);
```

#### Task: State Management Architecture
- Decision: Zustand for state management
- Rationale: Perfect balance of power and simplicity for complex real-time state
- Create store/ directory structure with state slices

#### Task: UI States Mapping
```typescript
// UI_STATES.ts
export enum UIState {
  LOADING = 'loading',           // Connecting to Tavus
  AGENT_THINKING = 'thinking',   // Processing user input  
  VIDEO_PLAYING = 'playing',     // Demo content active
  VIDEO_PAUSED = 'paused',       // Q&A interruption
  AGENT_SPEAKING = 'speaking',   // TTS active
  SERVICE_ERROR = 'error',       // Fallback UI
  SERVICE_DEGRADED = 'degraded', // Partial functionality (e.g., TTS fails)
  DEMO_COMPLETE = 'complete'     // Final CTA state
}
```

### Day 4: Agent Behavior & Content Strategy

#### Task: System Prompt Definition
```markdown
# system_prompt.md

You are Domo A.I., a friendly and expert guide. Your goal is to lead the user through a product demo by showing a sequence of videos and answering their questions.

## CORE RULES:
- Stick to the product; if asked off-topic questions, politely decline and steer back to demo
- When you need to show a video or display a button, you MUST use a tool call
- Do not announce your actions; perform them silently
- Follow linear progression: show videos in sequence_order
- After each video + 1-2 questions, ask "Shall we move on to the next feature?"
- If you've answered the same question twice, offer to move on
- End demo with show_trial_cta() when appropriate

## AVAILABLE TOOLS:
- fetch_video(video_title) - Display specific demo video
- show_trial_cta() - Show final call-to-action button

## PERSONALITY: 
Professional but approachable, knowledgeable, concise. Focus on guiding users through the demo experience smoothly.
```

#### Task: Content Workflow Documentation (Video-First)
1.  **Video Upload**: Admin uploads an MP4 file to a secure Supabase Storage bucket (`demo-videos/`).
2.  **Audio Extraction**: A serverless function triggers on upload, extracts the audio from the video file (e.g., using FFmpeg). - **DONE**
3.  **Transcription**: The extracted audio is sent to the ElevenLabs Speech-to-Text API to be converted into a raw transcript. - **DONE**
4.  **Embedding**: The transcript is chunked into meaningful segments. Each chunk is sent to an embedding model (e.g., OpenAI) to generate a vector embedding. - **PENDING**
5.  **Storage**: The original transcript, its chunks, and their corresponding embeddings are saved to the `knowledge_chunks` table, linked to the original video in the `videos` table. - **DONE**

#### Task: Demo Content Specifications
- Quantity: 3-5 short video segments
- Length: 30-60 seconds each (maintains engagement, allows interruptions)
- Audio: Videos have embedded narration (AI introduces/discusses, doesn't narrate)
- Story Arc: Demonstrates complete user workflow from start to finish

### Day 5: Risk Mitigation & Dependencies

#### Task: Hybrid Listener Implementation
```javascript
// FINALIZED HYBRID LISTENER LOGIC
const TOOL_CALL_REGEX = /^([a-zA-Z_]+)\((.*)\)$/;
const KNOWN_TOOLS = ['fetch_video', 'show_trial_cta'];

const handleTavusEvent = (event) => {
  if (event.type === 'tool_call') {
    // Official path: trusted event
    executeToolCall(event.name, event.args);
  } else if (event.type === 'utterance' && KNOWN_TOOLS.includes(event.speech)) {
    // Handle no-arg case (e.g., just 'fetch_video')
    executeToolCall(event.speech, {});
  } else if (event.type === 'utterance') {
    const match = event.speech.match(TOOL_CALL_REGEX);
    if (match) {
      // Parse malformed tool call from utterance
      const toolName = match[1];
      const argsString = match[2];
      const args = parseToolArgs(argsString);
      executeToolCall(toolName, args);
    } else {
      // Normal conversational speech
      displayMessage(event.speech);
    }
  }
}
```

#### Task: Complete Dependency Stack
```json
{
  "name": "domo-ai-mvp",
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "typescript": "^5.0.0",
    "zustand": "^4.4.0",
    "@supabase/supabase-js": "^2.38.0",
    "framer-motion": "^10.16.0",
    "react-player": "^2.13.0",
    "tailwindcss": "^3.3.0",
    "@radix-ui/react-dialog": "^1.0.0",
    "@radix-ui/react-button": "^1.0.0",
    "lucide-react": "^0.294.0",
    "openai": "^4.20.0"
  }
}
```

#### Task: Comprehensive Logging Strategy
- Log every Tavus event with timestamp and type
- Track tool call success/failure rates
- Monitor video load times and playback errors
- Store logs in Supabase for debugging analysis

## ⚡️ SECTION 1: APPLICATION FOUNDATION

### 📌 Core Problem & Vision
- **Core Problem**: Software SaaS companies waste valuable time, money, and resources having account executives provide repetitive product demos to leads who are not yet qualified or ready to buy.
- **Vision**: To provide an AI-powered agent, Domo A.I., that delivers personalized, on-demand, conversational video demos to website leads. The agent will intelligently answer questions, qualify leads automatically, and guide them to the next step, freeing up human account executives to focus exclusively on high-intent prospects.

### 🎯 Target Audience & Context (MVP Focus)
- **Primary Audience (The Demo)**: The project is a pre-configured showcase aimed at impressing potential investors, pilot customers, and internal stakeholders. The focus is on demonstrating capability, not serving live end-users yet.
- **Secondary Audience (The Customer Persona)**: The system is built as if it were for a Marketing Manager or Sales Operations person at an innovative SaaS company like "Bolt.new".
- **Technical Comfort Level**: Intermediate (familiar with marketing/sales software, not developers)
- **Goal**: Automate top of sales funnel and increase quality of leads passed to sales team

### ✅ Success Definition for MVP (2-Week Showcase + 5-Day Validation)
The MVP is a pre-configured, single-use-case showcase with the following success criteria:
- ✅ Pre-selected demo videos and knowledge base loaded into system
- ✅ Natural conversation capability with Tavus-powered AI agent
- ✅ Reliable video triggering based on conversational cues (>99.5% success rate)
- ✅ Accurate Q&A responses using Supabase knowledge base
- ✅ Smooth interaction with <2s latency for critical actions
- ✅ Proven "Hybrid Tool Call Workaround" resilience to AI behavioral inconsistency
- ✅ Complete user journey from greeting → demo → Q&A → CTA

### 📱 Platform Priority
- ✅ Web App (Browser-based): Complete experience occurs within web browser for both admin and demo user.

## 🧱 SECTION 2: FEATURE ARCHITECTURE & UX FLOW

### 🧩 Core Features Matrix
| Feature | User Story | Implementation Status |
|---------|------------|----------------------|
| AI-Powered Conversational Engine | "As a user, I can have natural, human-like conversation with the AI agent to explore the product." | ✅ Designed |
| Automated Knowledge Base Creation | "As an admin, I can upload a video, and the system will automatically create a searchable knowledge base from its audio." | ⏳ To Be Implemented |
| Dynamic Video Retrieval | "As a user, I can ask to see a specific feature, and the agent will instantly show me the relevant video." | ✅ Designed |
| Intelligent Knowledge Base | "As a user, I can ask detailed questions, and it will provide accurate answers based on product documentation." | ✅ Designed |
| Resilient Tool-Calling | "As the system, I can reliably interpret agent intent to perform actions, even if AI output is malformed." | ✅ Designed |
| Sequential Demo Logic | "As a user, I can be guided through a logical sequence of feature videos that tell a coherent story." | ✅ Designed |

### 🚀 Admin Content Creation Workflow
This workflow describes how a demo administrator sets up a new demo.

#### Entry Point
- Admin logs into the Domo A.I. platform.
- Admin navigates to the Dashboard.

#### Demo Creation
- Admin clicks "+ Create New Demo".
- Admin is redirected to the video upload page.

#### Video Upload & Processing
- Admin selects and uploads an MP4 video file.
- The system provides feedback on the upload progress.
- On completion, the backend triggers the processing pipeline:
  1. **Audio Extraction**: Audio is stripped from the video file.
  2. **Transcription**: The audio is sent to the ElevenLabs API for speech-to-text transcription.
  3. **Embedding**: The resulting transcript is chunked and converted into vector embeddings.
  4. **Storage**: The transcript and embeddings are stored in the `knowledge_chunks` table, linked to the video.
- UI State: UPLOADING → PROCESSING → COMPLETE

#### Configuration
- After processing, the admin is redirected to the Demo Configuration page.
- Here, they can review the transcript, edit Q&A pairs, and finalize the demo settings.

### 👣 User Journey Mapping (Complete MVP Experience)

#### Entry Point
- User navigates to Domo A.I. demo URL
- Instant loading (no login/consent forms)

#### Onboarding
- Page loads with Tavus AI agent in chat interface
- Agent greets user and introduces demo format
- UI State: LOADING → AGENT_SPEAKING

#### Core Demo Workflow
- User engages in conversation with agent
- User asks to see feature (e.g., "Show me the dashboard")
- Agent responds + Hybrid Listener intercepts intent (fetch_video("dashboard"))
- UI transitions: AGENT_THINKING → VIDEO_PLAYING
- Video plays full-screen, agent/user shrink to picture-in-picture
- Agent can pause video for context or answer interrupting questions
- UI State: VIDEO_PAUSED for Q&A, then VIDEO_PLAYING to resume
- Demo proceeds sequentially through 3-5 videos

#### Interactive Q&A
- Agent answers questions using knowledge base semantic search
- Responses generated from relevant knowledge_chunks
- UI maintains conversational flow with typing indicators

#### Completion
- UI returns to main split-screen view after final video
- Agent conducts final Q&A using full knowledge base
- Agent identifies conversation end and triggers show_trial_cta
- Frontend displays final call-to-action link in chat
- UI State: DEMO_COMPLETE

### ⚙️ System Logic & Data Flow (Hybrid Listener Pattern)
Core Implementation: Client-side Hybrid Listener in src/components/TavusAvatar.jsx
```javascript
// RESILIENT EVENT HANDLING FLOW
const handleTavusEvent = (event) => {
  logEvent(event); // Comprehensive logging
  
  if (event.type === 'tool_call') {
    // TRUSTED PATH: Official tool call event
    const { name, args } = event;
    executeAction(name, args);
  } 
  else if (event.type === 'utterance') {
    const speech = event.speech;
    
    // CHECK 1: Exact tool name match (no-arg case)
    if (KNOWN_TOOLS.includes(speech)) {
      executeAction(speech, {});
      return;
    }
    
    // CHECK 2: Regex pattern match for malformed tool calls
    const match = speech.match(TOOL_CALL_REGEX);
    if (match) {
      const toolName = match[1];
      const argsString = match[2];
      const parsedArgs = parseToolArgs(argsString);
      executeAction(toolName, parsedArgs);
      return;
    }
    
    // DEFAULT: Treat as conversational speech
    displayMessage(speech);
  }
}

// Action execution with state management
const executeAction = (name, args) => {
  switch(name) {
    case 'fetch_video':
      setUIState(UIState.VIDEO_PLAYING);
      playVideo(args.video_title || args);
      break;
    case 'show_trial_cta':
      setUIState(UIState.DEMO_COMPLETE);
      showCallToAction();
      break;
    default:
      console.warn(`Unknown tool: ${name}`);
  }
}
```

## 🔧 SECTION 3: TECHNICAL STACK & ARCHITECTURE

### 💻 Technology Stack (Finalized)
| Layer | Technology | Specification | Rationale |
|-------|------------|---------------|-----------|
| Frontend | Next.js 14+ | App Router, React 18+, TypeScript | Top-tier performance, type safety, modern development experience |
| State Management | Zustand 4.4+ | Global store with slices | Perfect balance of power and simplicity for complex real-time state |
| UI Components | Radix UI + Tailwind | Accessible, composable components | Industry standard for accessible, beautiful UIs |
| Backend | Next.js API Routes + Supabase Edge Functions | Serverless architecture | Highly scalable, co-located with frontend/database |
| Database | Supabase PostgreSQL + pgvector | SQL with vector search | Robust, semantic search capability, excellent tooling |
| File Storage | Supabase Storage | Built-in CDN | Secure file handling, sufficient performance for MVP |
| Authentication | None (MVP) | Deferred to Phase 2 | Maximizes development speed on core features |
| AI - LLM | Tavus-managed GPT-4o | Conversational Video Interface | State-of-the-art reasoning, managed through Tavus CVI |
| AI - Speech | ElevenLabs | Transcription + TTS | Best-in-class audio processing |
| Video Chat | Tavus CVI | Real-time avatar interface | Core user experience, emotionally expressive AI |
| Video Playback | react-player | Robust video component | Battle-tested, smooth integration with animations |
| Animations | Framer Motion | UI transitions | Smooth state transitions, professional feel |

### 📊 Performance Requirements (MVP Focused)
- Expected Load: 1-5 concurrent users (controlled demonstrations)
- Data Volume: 3-5 videos, ~100-200 knowledge chunks
- Response Time: <2s latency for critical interactions
- Availability: "Works on demand" during presentation times
- Tool Call Success: >99.5% reliability target

### 🌐 Deployment Strategy
- Hosting: Netlify (frontend) + Supabase (backend)
- CI/CD: Manual deployment for MVP speed
- Environment: Single live demo environment
- Monitoring: Platform-integrated logging (Netlify + Supabase dashboards)

## 🔐 SECTION 4: SECURITY & COMPLIANCE

### 📦 Data Classification (MVP Scope)
| Data Type | Sensitivity | Storage | Protection |
|-----------|-------------|---------|------------|
| Demo Videos | Low (Public Content) | Supabase Storage | Proper bucket configuration |
| Knowledge Base | Low (Public Content) | Supabase Database | Read-only API access |
| User Interactions | None Stored | Session-only | No PII collection |

### 🛡️ Security Requirements
- ✅ Security Misconfiguration: Supabase Storage properly configured (no public writes)
- ✅ No Authentication Risk: No login system eliminates auth vulnerabilities
- ✅ No Data Privacy Risk: No personal data collection/storage

## 🔗 SECTION 5: INTEGRATIONS & DEPENDENCIES

### 🔌 Required APIs & Services
| Service | Purpose | Critical Path | Fallback |
|---------|---------|--------------|----------|
| Tavus.io | Real-time AI avatar, GPT-4o brain, video chat | Yes | None (demo fails) |
| Supabase | Database, file storage, backend | Yes | None (no content) |
| ElevenLabs | Audio transcription, TTS voice | Partial | Demo continues silently |

### ⚠️ Risk Assessment
- Vendor Lock-in: High (accepted for Tavus capabilities)
- Cost Escalation: Low (fixed 1-month budget)
- Availability Risk: High (mitigated by comprehensive logging + manual overrides)
- Behavioral Risk: Mitigated by Hybrid Listener pattern

## 🚀 SECTION 6: GROWTH & EVOLUTION

### 📈 Success Metrics (MVP KPIs)
#### 🏆 Primary KPIs:
- Tool Call Success Rate: >99.5% (logged and measured)
- Interaction Latency: <2s median response time
- Demo Completion Rate: >95% sessions complete without technical failure
- Uptime: No critical errors during demo presentations

#### Secondary KPIs:
- CTA Conversion: % of demos ending with successful show_trial_cta
- User Engagement: Average session duration and video completion rates

### 🌱 Roadmap (Post-MVP)
#### Phase 1.5 - Stabilization:
- Refine Hybrid Listener based on logs
- Develop comprehensive test data suite
- Performance optimization

#### Phase 2 - Commercialization:
- Multi-tenant SaaS platform
- Admin dashboard for content management
- CRM integrations (Salesforce, HubSpot)
- Billing system integration

## 🧪 SECTION 7: TESTING & QA STRATEGY

### 🎯 Multi-Layer Testing Architecture
#### Layer 1: Unit Testing
- Tool Call Parser: 100% coverage for all input patterns
- State Management: Zustand store behavior validation
- Utility Functions: Argument parsing, video URL generation

#### Layer 2: Integration Testing
- Tavus CVI: Mocked event handling for all scenarios
- Supabase: Database queries and storage access
- ElevenLabs: Transcription workflow testing

#### Layer 3: AI Behavior Testing
- Consistency: Same prompts → reliable tool calls
- Safety: Off-topic questions handled gracefully
- Failure: Graceful degradation when services offline

#### Layer 4: End-to-End Testing
- Happy Path: Greeting → Demo → Q&A → CTA
- Interrupt Path: User questions during video playback
- Error Path: Service failures and recovery

## 📊 SECTION 8: IMPLEMENTATION TIMELINE

### Phase 0: Validation Sprint (5 Days) - MANDATORY
- Days 1-2: Tavus integration + API validation
- Day 3: Architecture finalization + schema setup
- Day 4: Agent behavior + content strategy
- Day 5: Risk mitigation + dependency setup

### Phase 1: Core Build (14 Days)
- Days 1-3: Static UI + Zustand state management
- Days 4-6: Supabase integration + video player
- Days 7-11: Tavus integration + Hybrid Listener implementation
- Days 12-14: Testing, polish, demo preparation

**Total Timeline: 19 Days (Validation + Build)**

## 🧠 SECTION 9: S.A.F.E. D.R.Y. ALIGNMENT

### ✅ System Readiness Checklist
- Strategic Planning: ✅ Multi-tenant architecture considered
- Automated Testing: ✅ Comprehensive 4-layer strategy
- Fortified Security: ✅ Appropriate for MVP scope
- Evolving System: ✅ Phase 2+ roadmap defined
- Resilient Design: ✅ Hybrid Listener pattern + error handling

## 🎯 SECTION 10: BUILD AGENT INSTRUCTIONS

### 🔧 Implementation Priorities
- Complete Phase 0 Validation Sprint First (5 days mandatory)
- Implement Comprehensive Logging for tool call debugging
- Use Live Tavus Documentation via agentic search during development
- Focus on Tool Call Reliability as primary success metric
- Build for Future Multi-tenant Scale in architecture decisions

### 📋 Development Guidelines
- State Management: Use Zustand store slices for organized state
- Error Handling: Graceful degradation for all external service failures
- Performance: Optimize for <2s interaction latency
- Testing: Build automated tests alongside features
- Documentation: Log all architectural decisions and API behaviors

### 🚀 Success Definition
MVP is successful when:
- Hybrid Listener achieves >99.5% tool call success rate
- Complete user journey functions smoothly end-to-end
- System remains stable through multiple demo presentations
- All critical interactions complete within 2-second target
- Comprehensive logs provide debugging capability for any issues

## 🧮 SECTION 11: UI/UX IMPLEMENTATION GUIDE

Based on the provided screenshots, the following UI components and styling must be implemented:

### Homepage
- Clean, modern design with a dark blue navbar featuring the DOMO logo
- Navigation options: Features, Pricing, About, Sign In
- Hero section with heading "Create AI-Powered Product Demos in Minutes"
- Subheading explaining the value proposition
- Call-to-action button "Create a Demo Now"
- Right-side floating mockup of the demo interface
- Green accent color for key highlights

### Sign In Page
- Centered authentication form with DOMO logo at top
- Options for test accounts with one-click access
- Social login options (Google, GitHub)
- Traditional email/password login form
- Clean, minimalist design with ample white space

### User Dashboard
- Left-aligned DOMO logo with "Dashboard" section indicator
- User profile in top-right with refresh and sign-out options
- Welcome message with user name
- Stats cards showing demo metrics (Total Demos, Published, In Progress, Total Views)
- "Your Demos" section with card-based list of demos
- Each card shows status badge, video/KB counts, timestamps
- Action buttons (Preview, Share, etc.)
- "Create New Demo" button in top-right of section

### Create Demo Page
- Step-by-step process indicator (1. Knowledge Base, 2. Videos, 3. Review)
- Active step highlighted
- Back to Dashboard navigation
- File upload area with drag-and-drop functionality
- Side panel with helpful tips and template download option
- Processing summary showing file analysis results
- Action buttons at bottom (Save Draft, Continue to Videos)

### Upload Pages
- Consistent layout with step indicators
- File upload interface with clear instructions
- Processing indicators and file status displays
- Helpful tips sidebar
- Preview options for uploaded content

## 📱 SECTION 12: RESPONSIVE DESIGN SPECIFICATIONS

The application must be responsive across various device sizes with these breakpoints:

- Mobile: 320px - 480px
- Tablet: 481px - 768px
- Laptop: 769px - 1024px
- Desktop: 1025px and above

### Mobile Optimization Strategy
- Stack cards vertically
- Reduce padding and margins
- Simplify navigation to hamburger menu
- Ensure touch targets are at least 44x44px
- Optimize video player for vertical orientation

### Desktop Enhancement Strategy
- Utilize horizontal space with multi-column layouts
- Show more detailed statistics and previews
- Enhanced hover states and interactions
- Picture-in-picture video capability during demos
- Full keyboard navigation support

## 🎨 SECTION 13: DESIGN SYSTEM

Based on the screenshots, the design system includes:

### Color Palette
- Primary: #1A2942 (Dark Blue)
- Secondary: #10B981 (Green)
- Accent: #3B82F6 (Blue)
- Background: #F9FAFB (Light Gray)
- Text: #111827 (Near Black)
- Light Text: #6B7280 (Gray)
- Success: #10B981 (Green)
- Warning: #F59E0B (Amber)
- Error: #EF4444 (Red)

### Typography
- Headings: Inter, semi-bold, sizes 24-48px
- Body: Inter, regular, sizes 14-16px
- Buttons: Inter, medium, size 14px
- System font fallbacks: -apple-system, BlinkMacSystemFont, sans-serif

### Component Library
- Buttons: Primary (filled blue), Secondary (outlined), Ghost (text only)
- Cards: White background, subtle shadow, 8px border radius
- Inputs: Clean borders, clear focus states, 8px border radius
- Badges: Small, pill-shaped status indicators
- Icons: Lucide React icons, 20-24px, consistent with UI style

### Animation Guidelines
- Transitions: 150-300ms, ease-in-out
- Hover effects: Subtle scale (1.02) and shadow increase
- Page transitions: Fade in/out, 200ms
- Loading states: Pulsing animation for placeholders
- Video transitions: Smooth scaling with Framer Motion

## 🔍 SECTION 14: ACCESSIBILITY CONSIDERATIONS

To ensure the application is accessible to all users:

- WCAG 2.1 AA compliance as baseline
- Proper heading hierarchy (H1-H6)
- Sufficient color contrast (minimum 4.5:1 for normal text)
- Keyboard navigation support
- ARIA labels for all interactive elements
- Focus management during modal/dialog interactions
- Alternative text for all images and visual elements
- Error states clearly communicated visually and via screen readers
