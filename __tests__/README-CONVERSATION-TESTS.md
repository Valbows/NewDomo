# Conversation Flow Tests

This document describes the test suite created to prevent the "meeting does not exist" error that occurred when viewing demo experiences.

## The Problem

When users clicked "View Demo Experience", they encountered an error:
```
The meeting you're trying to join does not exist.
```

### Root Cause

1. The `useDemoConversation` hook was calling a non-existent API endpoint (`/api/create-agent-and-start-conversation`)
2. The hook was using cached Daily.co room URLs without validating they still exist
3. Daily.co rooms can expire or become invalid, but the app was trying to join them anyway

### The Fix

1. **Fixed API endpoint**: Changed from `/api/create-agent-and-start-conversation` to `/api/start-conversation`
2. **Added room validation**: The `/api/start-conversation` route now:
   - Checks if a cached Daily room still exists by calling `https://gs.daily.co/rooms/check/{domain}/{room}`
   - Reuses the room if it returns 200 (exists)
   - Creates a new conversation if it returns 404 (doesn't exist)
3. **Simplified hook logic**: Removed client-side caching logic, delegating validation to the API

## Test Files

### 1. API Route Tests
**File**: `__tests__/api.start-conversation-daily-validation.test.ts`

Tests the core Daily room validation logic:

- ✅ **Reuse existing conversation** when Daily room exists (200)
- ✅ **Create new conversation** when cached Daily room is stale (404)
- ✅ **Force new conversation** when `forceNew=true` (ignores cache)
- ✅ **Create new conversation** when no cached conversation exists
- ✅ **Handle non-Daily URLs** gracefully (invalid URLs)

**Running these tests**:
```bash
npm test -- __tests__/api.start-conversation-daily-validation.test.ts
```

**Test Results**:
```
PASS  __tests__/api.start-conversation-daily-validation.test.ts
  Start Conversation API - Daily Room Validation
    ✓ should reuse existing conversation when Daily room exists (200)
    ✓ should create new conversation when cached Daily room is stale (404)
    ✓ should create new conversation when forceNew=true
    ✓ should create new conversation when no cached conversation exists
    ✓ should handle non-Daily URLs gracefully

Tests: 5 passed, 5 total
```

### 2. Hook Tests
**File**: `__tests__/unit/hooks/useDemoConversation.test.ts`

Tests the `useDemoConversation` hook:

- Calls correct API endpoint (`/api/start-conversation`)
- Handles API responses correctly
- Updates database with new conversation data
- Passes `forceNew` parameter from URL
- Handles E2E mode
- Handles demo not found errors
- Parses stringified metadata

**Note**: These tests require jsdom environment and may need path alias configuration.

### 3. E2E Integration Tests
**File**: `__tests__/e2e/demo-experience-conversation-flow.spec.ts`

End-to-end tests using Playwright:

- Full flow from "View Demo Experience" to joining conversation
- Reusing existing valid conversations
- Creating new conversations when rooms are stale
- Forcing new conversations with `?forceNew=true`
- Handling API errors gracefully
- Preventing concurrent conversation creation

**Running E2E tests**:
```bash
npm run test:e2e -- demo-experience-conversation-flow.spec.ts
```

## Key Test Scenarios

### Scenario 1: Fresh Start (No Cached Conversation)
**Expected**: Create new conversation
```
User clicks "View Demo Experience"
→ Hook calls /api/start-conversation
→ API finds no cached URL in database
→ API creates new Tavus conversation
→ Returns new conversation_url
→ User joins successfully
```

### Scenario 2: Valid Cached Conversation
**Expected**: Reuse existing conversation
```
User clicks "View Demo Experience"
→ Hook calls /api/start-conversation
→ API finds cached URL in database
→ API checks https://gs.daily.co/rooms/check/... → 200 OK
→ Returns cached conversation_url
→ User joins successfully
```

### Scenario 3: Stale Cached Conversation (The Bug)
**Expected**: Create new conversation
```
User clicks "View Demo Experience"
→ Hook calls /api/start-conversation
→ API finds cached URL in database
→ API checks https://gs.daily.co/rooms/check/... → 404 Not Found
→ API creates NEW Tavus conversation
→ Returns new conversation_url
→ Database updated with new URL
→ User joins successfully ✅ (Previously failed ❌)
```

### Scenario 4: Force New Conversation
**Expected**: Always create new conversation
```
User clicks "View Demo Experience?forceNew=true"
→ Hook calls /api/start-conversation with forceNew=true
→ API skips validation, creates new conversation
→ Returns new conversation_url
→ User joins successfully
```

## Running Tests

### Run all conversation tests:
```bash
npm test -- conversation
```

### Run specific test file:
```bash
npm test -- __tests__/api.start-conversation-daily-validation.test.ts
```

### Run with coverage:
```bash
npm test -- --coverage __tests__/api.start-conversation-daily-validation.test.ts
```

## Continuous Integration

These tests should be run:
- ✅ On every PR
- ✅ Before deployment
- ✅ As part of nightly regression suite

## Future Improvements

1. **Add monitoring**: Track Daily room 404 errors in production
2. **Cache TTL**: Add time-based expiration for cached URLs (e.g., 24 hours)
3. **Retry logic**: Retry failed Daily room checks with exponential backoff
4. **User feedback**: Show better error messages when conversation creation fails

## Related Files

- `/src/app/api/start-conversation/route.ts` - API route with validation logic
- `/src/app/demos/[demoId]/experience/hooks/useDemoConversation.ts` - React hook
- `/src/app/demos/[demoId]/experience/page.tsx` - Experience page
- `/scripts/database/debug-demo.js` - Database debugging script

## Debugging

To check conversation state in database:
```bash
node scripts/database/debug-demo.js
```

To manually test Daily room validation:
```bash
curl https://gs.daily.co/rooms/check/tavus/YOUR_ROOM_ID
# Returns 200 if exists, 404 if not
```

## Commit Reference

This test suite was created to prevent regression of the fix for:
**Issue**: "The meeting you're trying to join does not exist" error
**Fix**: Validate Daily rooms before joining, create new conversation if stale
**Commit**: [Your commit hash here]
