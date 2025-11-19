# Webhook Handler Tests

This document describes the test suite created to prevent the video showcase and product interest data storage bugs.

## The Problem That Was Fixed

When users viewed demos and watched videos, the webhook handlers were trying to insert data into columns that didn't exist in the database:

1. **`demo_id`** - Code tried to insert this, but it was never in the `video_showcase_data` table schema
2. **`requested_videos`** - Code tried to insert this, but it was removed in migration `20241215000005_remove_requested_videos_column.sql`

This caused **silent failures** - the insert operations failed but only logged warnings, so:
- ❌ Video showcase data was NOT stored in database
- ❌ Reporting page showed "No product interest data captured"
- ✅ Webhooks were successfully received (logs showed success)
- ✅ The data was being sent from Tavus correctly

## Test Files

### 1. Video Showcase Tracking Tests
**File**: `__tests__/api/tavus-webhook-video-tracking.test.ts`

Tests the `handleFetchVideo` and `trackVideoShowcase` functions:

- ✅ Inserts video showcase data with correct schema (no `demo_id`, no `requested_videos`)
- ✅ Updates existing video showcase data without invalid columns
- ✅ Accumulates multiple videos in `videos_shown` array
- ✅ Deduplicates videos in array
- ✅ Handles insert errors gracefully
- ✅ **REGRESSION CHECK**: Payload must NOT include `demo_id`
- ✅ **REGRESSION CHECK**: Payload must NOT include `requested_videos`
- ✅ **REGRESSION CHECK**: Payload must match actual schema

**Running these tests**:
```bash
npm test -- tavus-webhook-video-tracking
```

### 2. Product Interest Tracking Tests
**File**: `__tests__/api/tavus-webhook-product-interest.test.ts`

Tests the `handleProductInterestDiscovery` and `handleContactInfoCollection` functions:

- ✅ Stores product interest data with correct schema
- ✅ Handles `pain_points` as string and converts to array
- ✅ Handles missing `pain_points` gracefully
- ✅ Handles missing `primary_interest` gracefully
- ✅ Stores qualification data with correct schema
- ✅ Handles partial contact information
- ✅ **REGRESSION CHECK**: `product_interest_data` has correct columns
- ✅ **REGRESSION CHECK**: `qualification_data` has correct columns

**Running these tests**:
```bash
npm test -- tavus-webhook-product-interest
```

### 3. Schema Validation Tests
**File**: `__tests__/database/schema-validation.test.ts`

Tests that validate payloads match actual database schema:

- ✅ Validates `video_showcase_data` schema
- ✅ Validates `product_interest_data` schema
- ✅ Validates `qualification_data` schema
- ✅ **CRITICAL REGRESSION CHECK**: Insert must NOT include `demo_id`
- ✅ **CRITICAL REGRESSION CHECK**: Insert must NOT include `requested_videos`
- ✅ Detects when handler code tries to insert invalid columns
- ✅ Integration test: Actual database insert without schema errors
- ✅ Integration test: Fails correctly when inserting invalid columns

**Running these tests**:
```bash
npm test -- schema-validation
```

## Running All Webhook Tests

```bash
# Run all webhook-related tests
npm test -- webhook

# Run with coverage
npm test -- --coverage webhook

# Run in watch mode during development
npm test -- --watch webhook
```

## CI/CD Integration

These tests should run:
- ✅ On every pull request
- ✅ Before deployment to staging/production
- ✅ As part of nightly regression suite

**Recommended CI command**:
```bash
npm test -- tavus-webhook-video-tracking tavus-webhook-product-interest schema-validation
```

## What These Tests Prevent

### Bug 1: Schema Mismatch
**Before Fix:**
```typescript
const payload = {
  conversation_id: conversationId,
  demo_id: demoId, // ❌ Column doesn't exist
  requested_videos: [...], // ❌ Column was removed
  videos_shown: updatedVideosShown,
};
```

**After Fix:**
```typescript
const payload = {
  conversation_id: conversationId,
  videos_shown: updatedVideosShown, // ✅ Only valid columns
  received_at: new Date().toISOString(),
};
```

### Bug 2: Silent Failures
**Before:**
- Insert fails with error code `42703` (column does not exist)
- Error is logged as warning: `console.warn('Failed to insert...')`
- Webhook returns 200 OK
- Data is NOT stored in database
- Reporting page shows "No data captured"

**After:**
- Tests catch schema mismatches at test time
- CI/CD fails if invalid columns are added
- Developers see test failures before code is deployed

## Test Results

All tests passing:
```
PASS  __tests__/api/tavus-webhook-video-tracking.test.ts
  Tavus Webhook - Video Showcase Tracking
    Video Showcase Data Storage
      ✓ should insert video showcase data with correct schema
      ✓ should update existing video showcase data without adding invalid columns
      ✓ should accumulate multiple videos in videos_shown array
      ✓ should deduplicate videos in videos_shown array
      ✓ should handle insert errors gracefully without throwing
    Schema Validation - Regression Tests
      ✓ REGRESSION CHECK: video_showcase_data payload must not include demo_id
      ✓ REGRESSION CHECK: video_showcase_data payload must not include requested_videos
      ✓ REGRESSION CHECK: video_showcase_data payload must match actual schema
    Objective Handler - Video Showcase
      ✓ should handle demo_video_showcase objective completion without invalid columns

PASS  __tests__/api/tavus-webhook-product-interest.test.ts
  Tavus Webhook - Product Interest Tracking
    Product Interest Data Storage
      ✓ should store product interest data with correct schema
      ✓ should handle pain_points as string and convert to array
      ✓ should handle missing pain_points gracefully
      ✓ should handle missing primary_interest gracefully
      ✓ should handle database errors gracefully without throwing
    Qualification Data Storage (Contact Info)
      ✓ should store qualification data with correct schema
      ✓ should handle partial contact information
    Schema Validation - Regression Tests
      ✓ REGRESSION CHECK: product_interest_data must have correct columns
      ✓ REGRESSION CHECK: qualification_data must have correct columns

PASS  __tests__/database/schema-validation.test.ts
  Database Schema Validation
    video_showcase_data table schema
      ✓ should have expected columns and NOT have removed columns
      ✓ should validate that handler payload matches schema
    product_interest_data table schema
      ✓ should have expected columns
      ✓ should validate that handler payload matches schema
    qualification_data table schema
      ✓ should have expected columns
    Regression Check - Schema Mismatch Prevention
      ✓ CRITICAL: video_showcase_data insert must NOT include demo_id
      ✓ CRITICAL: video_showcase_data insert must NOT include requested_videos
      ✓ should detect when handler code tries to insert invalid columns
    Integration Test - Actual Database Insert
      ✓ should successfully insert video showcase data without schema errors
      ✓ should fail to insert video showcase data with invalid columns

Tests: 26 passed, 26 total
```

## Debug Tools

If tests fail or data isn't showing in reporting:

### 1. Check database for actual data
```bash
node scripts/database/debug-reporting-data.js
```

This shows:
- All conversation details
- All product interest data
- All video showcase data
- All qualification data
- Cross-reference analysis (which conversation IDs have data)

### 2. Check webhook logs
Look for these log messages in your application:
```
✅ Successfully stored product interest data
✅ Successfully inserted video_showcase_data for {conversationId}
✅ Successfully stored qualification data
```

If you see warnings instead:
```
❌ Failed to insert video_showcase_data: column "demo_id" does not exist
```

This means the schema mismatch bug has returned - run the tests!

### 3. Manual database query
```sql
-- Check video showcase data
SELECT conversation_id, videos_shown, received_at
FROM video_showcase_data
ORDER BY received_at DESC
LIMIT 10;

-- Check product interest data
SELECT conversation_id, primary_interest, pain_points, received_at
FROM product_interest_data
ORDER BY received_at DESC
LIMIT 10;
```

## Related Files

- **Webhook Handler**: `src/app/api/tavus-webhook/handler.ts`
- **Tool Call Handlers**: `src/app/api/tavus-webhook/handlers/toolCallHandlers.ts`
- **Objective Handlers**: `src/app/api/tavus-webhook/handlers/objectiveHandlers.ts`
- **Reporting Hook**: `src/app/demos/[demoId]/configure/components/reporting/hooks/useConversationData.ts`
- **Debug Script**: `scripts/database/debug-reporting-data.js`

## Future Improvements

1. **Automated schema validation**: Add a pre-commit hook that validates handler payloads against actual database schema
2. **Type safety**: Generate TypeScript types from database schema (e.g., using Supabase CLI)
3. **Better error handling**: Throw errors instead of warnings when critical inserts fail
4. **Monitoring**: Add Sentry alerts for failed webhook data storage
5. **Migration checks**: CI/CD step that validates migrations don't remove columns still used in code

## Commit Reference

These tests were created to prevent regression of the fix for:
- **Issue**: Video showcase and product interest data not showing in reporting page despite webhooks succeeding
- **Root Cause**: Code tried to insert `demo_id` and `requested_videos` columns that don't exist in schema
- **Fix**: Removed invalid columns from insert payloads
- **Prevention**: Created comprehensive test suite to catch schema mismatches
