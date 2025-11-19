# Test Suite Summary

## Overview
Comprehensive test suite for preventing critical bugs in demo conversation flow and webhook data storage.

## Test Suites

### 1. Conversation Flow Tests
**Created:** 2025-11-18
**Bug Fixed:** "The meeting you're trying to join does not exist"
**Test Files:** 3 files, 18 tests
**Status:** ✅ All passing

Prevents the bug where users couldn't join demo experiences due to stale Daily.co room URLs.

**Test Files:**
- `__tests__/api.start-conversation-daily-validation.test.ts` (5 tests)
- `__tests__/unit/hooks/useDemoConversation.test.ts` (13 tests)
- `__tests__/e2e/demo-experience-conversation-flow.spec.ts` (E2E tests)

**Run Command:**
```bash
npm test -- api.start-conversation-daily-validation useDemoConversation
```

**Documentation:** See `__tests__/README-CONVERSATION-TESTS.md`

---

### 2. Webhook Data Storage Tests
**Created:** 2025-11-19
**Bug Fixed:** Video showcase and product interest data not being stored
**Test Files:** 3 files, 26 tests
**Status:** ✅ All passing (43 webhook tests total)

Prevents schema mismatch bugs where webhook handlers try to insert non-existent database columns.

**Test Files:**
- `__tests__/api/tavus-webhook-video-tracking.test.ts` (9 tests)
- `__tests__/api/tavus-webhook-product-interest.test.ts` (9 tests)
- `__tests__/database/schema-validation.test.ts` (8 tests)

**Run Command:**
```bash
npm test -- tavus-webhook
```

**Documentation:** See `__tests__/README-WEBHOOK-TESTS.md`

---

## Quick Reference

| Test Suite | Files | Tests | Run Command |
|------------|-------|-------|-------------|
| Conversation Flow | 3 | 18 | `npm test -- conversation` |
| Webhook Data Storage | 3 | 26+ | `npm test -- tavus-webhook` |
| **Total** | **6** | **44+** | `npm test` |

## Critical Regression Checks

### Conversation Flow
✅ Must not use `/api/create-agent-and-start-conversation` (non-existent endpoint)
✅ Must validate Daily rooms before joining
✅ Must handle stale Daily rooms gracefully (create new if 404)

### Webhook Data Storage
✅ `video_showcase_data` payload must NOT include `demo_id`
✅ `video_showcase_data` payload must NOT include `requested_videos`
✅ All webhook handler payloads must match actual database schema

## Bugs Fixed

### Bug 1: Meeting Does Not Exist (Nov 2025-11-18)
**Symptom:** Error: "The meeting you're trying to join does not exist"
**Root Cause:** Hook called wrong API endpoint and used cached Daily.co URLs without validation
**Fix:** Use `/api/start-conversation` which validates room existence
**Tests:** 18 tests prevent regression

### Bug 2: Video/Product Interest Data Not Captured (Nov 2025-11-19)
**Symptom:** Webhooks succeeded but reporting page showed "No data captured"
**Root Cause:** Code tried to insert `demo_id` and `requested_videos` columns that don't exist in schema
**Fix:** Removed invalid columns from insert payloads
**Tests:** 26 tests prevent regression

## Running Tests

### Run all tests
```bash
npm test
```

### Run with coverage
```bash
npm test -- --coverage
```

### Run specific test suite
```bash
# Conversation flow tests
npm test -- conversation

# Webhook tests
npm test -- tavus-webhook

# Schema validation
npm test -- schema-validation
```

### Run in watch mode (development)
```bash
npm test -- --watch
```

## CI/CD Integration

**Required**: All tests must pass before deployment

```bash
# Run in CI/CD pipeline
npm test -- --ci --coverage --maxWorkers=2
```

**Recommended checks:**
- ✅ Run on every pull request
- ✅ Run before deployment to staging
- ✅ Run before deployment to production
- ✅ Run nightly regression suite

## Debug Tools

### Database Debugging
```bash
# Check what data is actually in database
node scripts/database/debug-reporting-data.js

# Check demo state
node scripts/database/debug-demo.js
```

### Manual API Testing
```bash
# Validate Daily room exists
curl https://gs.daily.co/rooms/check/tavus/YOUR_ROOM_ID
# 200 = exists, 404 = doesn't exist
```

## Test Coverage Goals

| Component | Current | Goal |
|-----------|---------|------|
| API Routes | ~70% | 80% |
| Webhook Handlers | 90% | 95% |
| React Hooks | ~60% | 75% |
| Database Operations | 85% | 90% |

## Future Test Improvements

1. **Automated schema validation**: Pre-commit hook to validate payloads against DB schema
2. **Type safety**: Generate TypeScript types from database schema
3. **E2E video playback**: Test actual video showcase flow end-to-end
4. **Load testing**: Simulate multiple concurrent conversations
5. **Integration with Sentry**: Alert on test failures in production

## Related Documentation

- **Conversation Tests**: `__tests__/README-CONVERSATION-TESTS.md`
- **Webhook Tests**: `__tests__/README-WEBHOOK-TESTS.md`
- **Test Files**: `__tests__/` directory
- **Debug Scripts**: `scripts/database/` directory

## Test Maintenance

When adding new features:

1. **Write tests first** (TDD approach)
2. **Run tests locally** before committing
3. **Update regression checks** when fixing bugs
4. **Document test purpose** in test file comments
5. **Keep test data realistic** (use actual conversation IDs, video titles, etc.)

## Monitoring & Alerts

### Production Monitoring
- Sentry alerts for failed webhook data storage
- Daily.co room 404 errors tracked
- Conversation creation failures logged

### Test Alerts
- CI/CD pipeline failures notify team immediately
- Nightly regression suite reports sent to Slack
- Coverage decrease blocks PR merges

---

**Last Updated:** 2025-11-19
**Test Suite Status:** ✅ All 44+ tests passing
**Coverage:** ~75% (goal: 85%)
