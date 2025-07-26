# Domo A.I. Project Log

## Purpose
This log tracks important architectural decisions, errors encountered, and solutions implemented throughout the Domo A.I. project development lifecycle. It serves as both documentation and a learning resource to prevent repeat failures.

## Architectural Decisions

### Initial Architecture Setup (2025-07-21)
- **Decision**: Selected Next.js 14+ with App Router as the frontend framework
  - **Rationale**: Provides excellent performance, built-in API routes, and modern React features
  - **Alternatives Considered**: SvelteKit, Remix
  - **Impact**: Establishes foundation for all frontend development

- **Decision**: Selected Zustand for state management
  - **Rationale**: Offers excellent balance between Redux-like organization and simplicity
  - **Alternatives Considered**: Redux Toolkit, Jotai, Context API
  - **Impact**: Enables clean organization of complex real-time state with minimal boilerplate

- **Decision**: Selected Supabase for backend (PostgreSQL + pgvector)
  - **Rationale**: Provides vector search capabilities critical for semantic knowledge retrieval
  - **Alternatives Considered**: Firebase, MongoDB Atlas
  - **Impact**: Enables core semantic search functionality for knowledge base

- **Decision**: Implemented Hybrid Listener pattern for tool call reliability
  - **Rationale**: Addresses known inconsistency in AI-generated tool calls
  - **Alternatives Considered**: Direct parsing, function calling only
  - **Impact**: Critical for achieving >99.5% tool call reliability target

- **Decision**: Video Processing Pipeline (2025-07-22)
  - **Rationale**: Implemented an automated video processing pipeline using a Supabase Edge Function (`process-video`) and a PostgreSQL trigger (`on_new_video`). This creates a robust, event-driven backend that automatically handles video transcription upon upload, decoupling the frontend from the processing logic. This adheres to the **Automated** and **Resilient** principles.
  - **Alternatives Considered**: Client-side processing (not feasible for large files), dedicated backend server (more complex to manage).
  - **Impact**: Fully automates the core content creation workflow, enabling a seamless admin experience.

## Errors & Solutions

- **Date**: 2025-07-25
- **Component**: Next.js Build / Supabase Server Client
- **Error Description**: The application failed to build due to a duplicate export error, and API routes were returning 500 errors because the Supabase client could not initialize.
- **Root Cause**: 
  1. A duplicate `export default` statement existed in `/src/app/demos/[demoId]/configure/page.tsx`.
  2. The `.env.local` file used an incorrect variable name (`NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`) for the Supabase secret key, which the server client expected as `SUPABASE_SECRET_KEY`.
- **Solution**: 
  1. Removed the redundant export statement.
  2. Renamed the environment variable to `SUPABASE_SECRET_KEY` in `.env.local`.
  3. Restarted the development server to load the corrected environment variables.
- **Prevention**: Create a `.env.example` file to ensure consistent and correct environment variable naming. Implement stricter linting to catch duplicate exports.

### Tavus Real-Time Tool Calling Breakthrough (2025-07-25)
- **Date**: 2025-07-25
- **Component**: Tavus Agent Integration / Real-Time Tool Calling
- **Issue Description**: Tool calls were only being detected after conversation ended via webhook `application.transcription_ready` events, not in real-time during active conversation.
- **Root Cause**: 
  1. Using iframe embedding instead of Daily.co JavaScript SDK prevented access to real-time `app-message` events.
  2. Webhook-based tool calls only fire after conversation transcription is complete.
  3. Real-time tool calling requires Daily.co WebRTC data channel integration.
- **Solution**: 
  1. **Created TavusConversation component** with Daily.co JavaScript SDK integration.
  2. **Implemented app-message event listener** to capture real-time tool calls via WebRTC data channel.
  3. **Added dual-path architecture**: Real-time via Daily.co + backup webhook parsing for reliability.
  4. **Enhanced transcript parsing** with detailed logging to debug tool call extraction.
- **Key Discovery**: Tavus real-time tool calling works through Daily.co's `app-message` events, not webhooks. Webhooks are only for post-conversation analysis.
- **Impact**: Enables true real-time video playback triggered by AI agent during active conversation, achieving the core user requirement.
- **Prevention**: Always use Daily.co SDK for real-time interactions with Tavus conversations, not iframe embedding.

### Daily.co Integration Fixes (2025-07-25)
- **Date**: 2025-07-25
- **Component**: TavusConversation Component / Daily.co Integration
- **Issue Description**: Multiple issues with Daily.co integration: duplicate DailyIframe instances, video interface not displaying, and app messages not being processed for tool calls.
- **Root Cause**: 
  1. React re-rendering causing duplicate Daily.co instances without proper cleanup.
  2. Iframe mounting timing issues - trying to mount before Daily.co fully initialized.
  3. App message processing not handling different tool call formats from Tavus.
- **Solution**: 
  1. **Added initialization guard** to prevent duplicate Daily.co instances.
  2. **Enhanced iframe mounting** with proper timing, container clearing, and error handling.
  3. **Improved app message processing** to handle multiple tool call formats (direct events, transcript parsing, content mentions).
  4. **Added manual test button** for debugging tool call functionality.
- **Key Technical Details**:
  - Used `isInitialized` state to prevent duplicate Daily.co instances
  - Added 1-second delay for iframe mounting to allow Daily.co initialization
  - Enhanced app message listener to check `data.transcript`, `data.content`, and direct tool call events
  - Added comprehensive logging for debugging tool call processing
- **Impact**: Fixes the video interface display and enables proper real-time tool call processing.
- **Prevention**: Always implement proper React cleanup and initialization guards for external SDK integrations.

### Error Template
- **Date**: YYYY-MM-DD
- **Component**: [Component Name]
- **Error Description**: [Brief description of what went wrong]
- **Root Cause**: [Analysis of underlying cause]
- **Solution**: [How it was fixed]
- **Prevention**: [Steps to prevent similar issues]

- **Date**: 2025-07-22
- **Component**: Cascade Internal Tools (`update_plan`)
- **Error Description**: The `update_plan` tool has failed repeatedly with an internal error: `CORTEX_STEP_TYPE_BRAIN_UPDATE: failed to read content for brain entry... no such file or directory`.
- **Root Cause**: The root cause appears to be an internal issue within the Cascade system's planning/memory mechanism, as the file path referenced is internal to the tool's operation.
- **Solution**: The immediate solution is to bypass the `update_plan` tool and continue development based on the last known version of the plan. The issue is logged here for future diagnosis by the Windsurf engineering team.
- **Prevention**: As this is an internal tool error, prevention is outside the scope of project-level actions. The log serves as the preventative measure by documenting the failure.

- **Date**: 2025-07-22
- **Component**: `HomePage` (`src/app/page.tsx`)
- **Error Description**: Homepage buttons ("Create a Demo Now", "Sign In") were unresponsive and navigated to a 404 page for `/login`.
- **Root Cause**: The homepage was implemented as a pure React Server Component, which cannot handle client-side events like `onClick`. Additionally, the `/login` and `/signup` routes did not exist.
- **Solution**:
    1. Created a new client component, `HomePageClient.tsx`, to encapsulate all interactive UI elements and their corresponding logic.
    2. Refactored the main `HomePage` (`src/app/page.tsx`) to render the new `HomePageClient` component, correctly separating server and client concerns.
    3. Created new pages for `/login` and `/signup` with forms that integrate with Supabase for user authentication.
- **Prevention**: Strictly adhere to the React Server Component (RSC) model by separating client-side and server-side concerns during component design. Ensure all components requiring hooks or event handlers are marked with `"use client"`.

- **Date**: 2025-07-22
- **Component**: Supabase CLI / Local Environment
- **Error Description**: `supabase` command not found, preventing deployment of Edge Functions and database migrations.
- **Root Cause**: Supabase CLI was not installed on the local machine. Homebrew, the required package manager, was also not installed.
- **Solution**:
    1. Installed Homebrew using the official script.
    2. Configured the shell (`.zshrc`) to include Homebrew in the system's PATH.
    3. Installed the Supabase CLI using `brew install supabase/tap/supabase`.
    4. Authenticated the CLI using `supabase login`.
- **Prevention**: Document the prerequisite of having Supabase CLI installed in the project's `README.md` for future developers.

- **Date**: 2025-07-22
- **Component**: `supabase/trigger.sql`
- **Error Description**: The initial SQL trigger implementation contained a hardcoded Supabase `service_role_key` in the `Authorization` header.
- **Root Cause**: A misunderstanding of the security model for invoking Edge Functions from database triggers. Exposing the service role key publicly is a critical security vulnerability.
- **Solution**: Replaced the `service_role_key` with the public `anon_key`. The Edge Function is designed to use the service role key securely from its own environment variables, while the trigger only needs the public key to invoke the function.
- **Prevention**: Establish a strict security protocol: never commit service role keys or other high-privilege secrets to version control or expose them in client-side/database code. Always use environment variables for secrets.

- **Date**: 2025-07-22
- **Component**: Supabase CLI / Deployment
- **Error Description**: The `supabase db push` command failed with the error "Cannot find project ref. Have you run supabase link?".
- **Root Cause**: The local project directory was not linked to the remote Supabase project, preventing synchronization of database migrations.
- **Solution**:
    1. Ran `supabase link --project-ref zewcvwsirjvgknvrmhhk` to connect the local environment to the remote Supabase project.
    2. Provided the database password when prompted.
    3. Successfully re-ran `supabase db push` to apply the migration.
- **Prevention**: Document the `supabase link` step as a mandatory one-time setup action in the project's `README.md`.

- **Date**: 2025-07-24
- **Component**: Supabase Database Schema
- **Error Description**: Multiple critical database errors encountered:
  1. `Could not fetch videos: relation "public.demo_videos" does not exist`
  2. `new row violates row-level security policy`
  3. Failed uploads to Supabase Storage
- **Root Cause**: The required database tables (`demos`, `demo_videos`, `knowledge_chunks`) and their Row Level Security policies were not properly created in Supabase. Without these tables, data persistence fails and the application cannot function correctly.
- **Solution**:
    1. Created comprehensive SQL schema definition file (`supabase/schema.sql`)
    2. Implemented proper RLS policies for all tables and storage buckets
    3. Prepared for execution in Supabase SQL editor to create the required infrastructure
- **Prevention**: Following the S.A.F.E. principle (Strategic) by implementing database schema first before application code, and documenting all schema requirements for future reference.

## CRITICAL FAILURE ANALYSIS - 2025-07-25T02:13:00

### PROTOCOL VIOLATION ACKNOWLEDGMENT
**SEVERITY: CRITICAL**

I have completely failed to follow the S.A.F.E. D.R.Y. A.R.C.H.I.T.E.C.T. protocols explicitly defined by the user. This represents a fundamental breakdown in system discipline.

#### Specific Violations:
1. **Strategic Failure**: Operating in reactive patch-mode instead of architectural planning
2. **Automation Failure**: Zero unit tests, integration tests, or automated validation
3. **Fortification Failure**: No proper error handling, validation, or security measures
4. **Evolution Failure**: Not documenting lessons learned or preventing repeat failures

#### Root Cause Analysis:
- **Current Error**: "Missing required metadata fields" in demo creation
- **Underlying Issue**: Database schema constraints not properly validated
- **System Failure**: No test coverage to catch schema validation errors
- **Process Failure**: No git commits, no version control, no rollback capability

### IMMEDIATE CORRECTIVE ACTION PLAN

#### Phase 1: Emergency Stabilization (Next 30 minutes)
1. **STOP** all reactive debugging
2. **IMPLEMENT** proper error handling for demo creation
3. **CREATE** unit tests for demo creation flow
4. **ESTABLISH** git repository with initial commit

#### Phase 2: Architectural Compliance (Next 2 hours)
1. **ACTIVATE** Designer Mode per A.R.C.H.I.T.E.C.T. protocol
2. **IMPLEMENT** comprehensive testing strategy
3. **ESTABLISH** proper CI/CD pipeline
4. **DOCUMENT** all architectural decisions

#### Phase 3: System Hardening (Ongoing)
1. **FORTIFY** all API endpoints with proper validation
2. **AUTOMATE** all testing and deployment processes
3. **EVOLVE** system with proper documentation and learning capture

### LESSONS LEARNED
1. **Never operate without following established protocols**
2. **Always implement tests before features**
3. **Always commit code changes to version control**
4. **Always validate schema changes with automated tests**
5. **Always document architectural decisions**

## Development Progress

### Phase 0: Validation Sprint (5 Days)
- **Day 1 (2025-07-24)**: 
  - Identified critical database schema issues preventing application functionality
  - Created comprehensive SQL schema aligned with project requirements
  - Prepared database migration for implementation in Supabase
- **Day 2**: [To be completed during development]
- **Day 3**: [To be completed during development]
- **Day 4**: [To be completed during development]
- **Day 5**: [To be completed during development]

### Phase 1: Core Build (14 Days)
- **Day 1 (2025-07-22)**:
  - Fixed unresponsive homepage buttons by refactoring server/client component architecture.
  - Created a fully functional authentication flow with Login (`/login`) and Sign-up (`/signup`) pages using Supabase Auth.
- **Days 2-3**: [To be completed during development]
- **Days 4-6**: [To be completed during development] 
- **Days 7-11**: [To be completed during development]
- **Days 12-14**: [To be completed during development]

## Performance Metrics

### Tool Call Reliability
- **Target**: >99.5% success rate
- **Current**: [To be measured]
- **Last Updated**: [Date]

### Interaction Latency
- **Target**: <2s median response time
- **Current**: [To be measured]
- **Last Updated**: [Date]

### Demo Completion Rate
- **Target**: >95% sessions complete without technical failure
- **Current**: [To be measured]
- **Last Updated**: [Date]

## Security Audit Notes

- **Initial Assessment**: [To be completed]
- **Supabase Storage Configuration**: [To be verified]
- **API Key Management**: [To be documented]
