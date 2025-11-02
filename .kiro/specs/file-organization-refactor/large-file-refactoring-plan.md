# Large File Refactoring Plan

## Overview

This document outlines the detailed refactoring strategy for 26 files over 300 lines, prioritized by impact, complexity, and user-facing importance.

## Analysis Summary

- **Total files to refactor**: 26 files
- **Total lines in large files**: 12,344 lines
- **Average lines per large file**: 475 lines
- **Largest file**: 1,348 lines (Reporting.tsx)
- **Target**: Break files into 300-600 line modules

## Priority Classification

### High Priority (19 files) - 10,844 lines
Core user-facing components and critical business logic that directly impact user experience and system functionality.

### Medium Priority (3 files) - 1,321 lines  
Utilities, API routes, and integration tests that support core functionality but have lower direct user impact.

### Low Priority (4 files) - 1,497 lines
Legacy code, test files, and deprecated components that can be refactored later or potentially removed.

## Detailed Refactoring Strategy

### Phase 1: Critical UI Components (High Priority)

#### 1.1 Reporting.tsx (1,348 lines) → Target: 4-5 modules
**Current Issues**: Massive monolithic component handling all reporting functionality
**Refactoring Strategy**:
- Extract `ReportingCharts.tsx` (300-400 lines) - Chart rendering and data visualization
- Extract `ReportingFilters.tsx` (200-300 lines) - Filter controls and state management  
- Extract `ReportingTables.tsx` (300-400 lines) - Data tables and pagination
- Extract `ReportingSummary.tsx` (200-300 lines) - Summary statistics and KPIs
- Keep main `Reporting.tsx` (200-300 lines) - Layout and orchestration

#### 1.2 Experience Page (881 lines) → Target: 3-4 modules
**Current Issues**: Main user interface page handling multiple concerns
**Refactoring Strategy**:
- Extract `ConversationInterface.tsx` (300-400 lines) - Chat and conversation UI
- Extract `VideoControls.tsx` (200-300 lines) - Video playback and controls
- Extract `StatusIndicators.tsx` (150-200 lines) - Connection and status displays
- Keep main `page.tsx` (200-300 lines) - Page layout and routing

#### 1.3 Configure Page (625 lines) → Target: 3 modules
**Current Issues**: Configuration interface with mixed concerns
**Refactoring Strategy**:
- Extract `ConfigurationForms.tsx` (250-300 lines) - Form components and validation
- Extract `SettingsPanels.tsx` (200-250 lines) - Settings UI and state management
- Keep main `page.tsx` (200-250 lines) - Page structure and navigation

### Phase 2: Core Business Services (High Priority)

#### 2.1 Agent Service (830 lines) → Target: 3-4 modules
**Current Issues**: Handles all agent-related operations in single file
**Refactoring Strategy**:
- Extract `persona-management-service.ts` (250-300 lines) - Persona CRUD operations
- Extract `agent-configuration-service.ts` (200-300 lines) - Agent setup and config
- Extract `agent-lifecycle-service.ts` (200-250 lines) - Agent creation, updates, deletion
- Keep core `agent-service.ts` (200-250 lines) - Main service interface and orchestration

#### 2.2 Demo Service (537 lines) → Target: 2-3 modules
**Current Issues**: Demo management mixed with configuration logic
**Refactoring Strategy**:
- Extract `demo-configuration-service.ts` (200-300 lines) - Demo setup and configuration
- Extract `demo-lifecycle-service.ts` (200-250 lines) - Demo CRUD operations
- Keep core `demo-service.ts` (150-200 lines) - Main service interface

#### 2.3 Analytics Service (459 lines) → Target: 2-3 modules
**Current Issues**: Data processing and reporting logic combined
**Refactoring Strategy**:
- Extract `metrics-collection-service.ts` (200-250 lines) - Data collection and aggregation
- Extract `reporting-service.ts` (150-200 lines) - Report generation and formatting
- Keep core `analytics-service.ts` (150-200 lines) - Main analytics interface

### Phase 3: Integration and Media Services (High Priority)

#### 3.1 Media Service (446 lines) → Target: 2-3 modules
**Current Issues**: Video processing and media validation combined
**Refactoring Strategy**:
- Extract `video-processing-service.ts` (200-250 lines) - Video encoding, transcoding
- Extract `media-validation-service.ts` (150-200 lines) - File validation and checks
- Keep core `media-service.ts` (150-200 lines) - Main media interface

#### 3.2 Integration Service (417 lines) → Target: 2-3 modules
**Current Issues**: External API integration and sync logic mixed
**Refactoring Strategy**:
- Extract `api-integration-service.ts` (200-250 lines) - External API calls and handling
- Extract `sync-service.ts` (150-200 lines) - Data synchronization logic
- Keep core `integration-service.ts` (100-150 lines) - Main integration interface

### Phase 4: Webhook and Event Processing (High Priority)

#### 4.1 Webhook Service (399 lines) → Target: 2 modules
**Current Issues**: Webhook processing and validation combined
**Refactoring Strategy**:
- Extract `webhook-validation-service.ts` (150-200 lines) - Signature validation and security
- Keep core `webhook-service.ts` (200-250 lines) - Main webhook processing

#### 4.2 Data Ingestion Service (365 lines) → Target: 2 modules
**Current Issues**: Data processing and storage logic combined
**Refactoring Strategy**:
- Extract `data-transformation-service.ts` (150-200 lines) - Data transformation and mapping
- Keep core `data-ingestion-service.ts` (200-250 lines) - Main ingestion logic

### Phase 5: Remaining High Priority Files

#### 5.1 Component Refactoring
- **CustomObjectivesManager.tsx** (405 lines) → Extract form components and state management
- **TavusConversation.tsx** (395 lines) → Extract conversation controls and message handling
- **Conversation/index.tsx** (350 lines) → Extract conversation state and UI components

#### 5.2 Service Refactoring
- **Conversation Management Service** (392 lines) → Extract conversation state and lifecycle
- **Event Processing Service** (359 lines) → Extract event handlers and processors
- **Tool Call Service** (347 lines) → Extract tool validation and execution
- **Objectives Service** (340 lines) → Extract objectives CRUD and validation
- **Video Service** (318 lines) → Extract video operations and metadata
- **Auth Form Service** (313 lines) → Extract form validation and submission

### Phase 6: Medium Priority Files

#### 6.1 Tool Parser (454 lines) → Target: 2-3 modules
**Refactoring Strategy**:
- Extract `tool-parsing-utils.ts` (150-200 lines) - Core parsing logic
- Extract `tool-validation-utils.ts` (150-200 lines) - Validation and error handling
- Keep main `toolParser.ts` (150-200 lines) - Main parser interface

#### 6.2 API Route (360 lines) → Target: 2 modules
**Refactoring Strategy**:
- Extract business logic to service layer
- Keep route handler focused on HTTP concerns (150-200 lines)

### Phase 7: Low Priority Files

#### 7.1 Test Files (507, 483, 378 lines)
**Strategy**: Break into focused test suites by functionality rather than single large files

#### 7.2 Legacy Files (334, 302 lines)
**Strategy**: Evaluate for removal or minimal refactoring if still needed

## Implementation Guidelines

### File Size Targets
- **Optimal range**: 300-600 lines per file
- **Maximum**: 600 lines (exception only for complex but cohesive logic)
- **Minimum**: 100 lines (avoid over-fragmentation)

### Refactoring Principles
1. **Maintain functionality**: No behavior changes during refactoring
2. **Preserve interfaces**: Keep public APIs stable
3. **Logical cohesion**: Group related functionality together
4. **Clear separation**: Distinct responsibilities per module
5. **Test coverage**: Maintain or improve test coverage

### Quality Assurance
- Run full test suite after each file refactoring
- Verify no performance regressions
- Ensure all imports resolve correctly
- Validate component rendering and behavior
- Check service functionality and error handling

## Success Metrics

### Quantitative Goals
- All files under 600 lines
- Average file size reduced from 475 to 350 lines
- Maintain 100% test coverage
- Zero functionality regressions

### Qualitative Goals
- Improved code readability and maintainability
- Easier debugging and testing
- Better separation of concerns
- Enhanced developer experience

## Risk Mitigation

### Technical Risks
- **Import path issues**: Use systematic approach to update all references
- **Circular dependencies**: Careful module design and dependency analysis
- **Test failures**: Incremental refactoring with continuous testing

### Process Risks
- **Scope creep**: Focus only on file splitting, avoid feature changes
- **Merge conflicts**: Coordinate with team on refactoring schedule
- **Performance impact**: Monitor build times and runtime performance

## Timeline Estimate

- **Phase 1-2 (Critical UI & Services)**: 2-3 weeks
- **Phase 3-4 (Integration & Webhooks)**: 1-2 weeks  
- **Phase 5 (Remaining High Priority)**: 1-2 weeks
- **Phase 6-7 (Medium/Low Priority)**: 1 week
- **Total Estimated Time**: 5-8 weeks

This plan provides a systematic approach to breaking down large files while maintaining code quality and functionality.