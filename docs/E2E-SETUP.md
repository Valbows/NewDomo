# E2E Test Setup Guide

## Quick Setup

Run this single command to set up everything:

```bash
npm run setup:e2e
```

This will:
1. Create test user and demo in database
2. Create test video records
3. Upload test video files to storage

## Manual Setup (if needed)

### 1. Environment Setup

The E2E tests use these environment variables (already configured):

```bash
# In .env.e2e
E2E_DEMO_ID=42beb287-f385-4100-86a4-bfe7008d531b
E2E_VIDEO_TITLE=E2E Test Video
NEXT_PUBLIC_E2E_TEST_MODE=true
NEXT_PUBLIC_TAVUS_TOOLCALL_TEXT_FALLBACK=true
```

### 2. Database Setup

```bash
# Create test user and demo
npm run seed:e2e

# Create test videos in database and upload files
npm run seed:e2e-videos
```

### 3. Running E2E Tests

```bash
# Run all E2E tests
npm run e2e

# Run only tool calling tests
npm run e2e -- __tests__/e2e/tool-calling.spec.ts

# Run with browser visible (for debugging)
npm run e2e -- __tests__/e2e/tool-calling.spec.ts --headed

# Run specific test
npm run e2e -- __tests__/e2e/tool-calling.spec.ts -g "fetch_video tool call"
```

## Test Data Created

### Test User
- **Email**: test@example.com
- **Password**: password123
- **ID**: fc07d4fe-7497-4b92-87b9-0bceadb25c4e

### Test Demo
- **ID**: 42beb287-f385-4100-86a4-bfe7008d531b
- **Name**: Live E2E Demo
- **Storage Path**: test-videos/

### Test Videos
1. **E2E Test Video** (`test-videos/e2e-test-video.mp4`)
2. **Strategic Planning** (`test-videos/strategic-planning.mp4`)
3. **Product Demo** (`test-videos/product-demo.mp4`)

## How E2E Tests Work

### Dev Controls
When `NEXT_PUBLIC_E2E_TEST_MODE=true`, the experience page shows dev controls:
- **Dropdown**: Select from available video titles
- **Play Button**: Trigger video request tool call
- **CTA Button**: Trigger CTA display tool call
- **Pause/Resume/Next/Close**: Video control tool calls

### Test Flow
1. Navigate to `/demos/42beb287-f385-4100-86a4-bfe7008d531b/experience`
2. Wait for dev controls to appear
3. Use controls to simulate agent tool calls
4. Verify video playback and CTA display
5. Test error scenarios

## Troubleshooting

### Dev Controls Not Appearing
- Check that `NEXT_PUBLIC_E2E_TEST_MODE=true` is set
- Verify test videos exist in database: `npm run seed:e2e-videos`
- Check browser console for errors

### Video Not Loading
- Verify video files uploaded: check Supabase storage bucket `demo-videos`
- Check signed URL generation in browser network tab
- Ensure test videos have valid storage paths

### Tests Timing Out
- Increase timeout in test: `test.setTimeout(120000)`
- Add more wait time for database operations
- Check if application is running on correct port (3101)

### Database Issues
- Verify Supabase connection in `.env.local`
- Check that `demo_videos` table exists
- Ensure test user has proper permissions

## Test Environment

The E2E tests run on:
- **Port**: 3101 (to avoid conflicts with dev server)
- **Mode**: Development with E2E flags enabled
- **Database**: Same as local development
- **Storage**: Same Supabase storage bucket

## Cleaning Up

To clean up test data:

```bash
# Remove test videos from storage
# (Manual cleanup via Supabase dashboard)

# Remove test data from database
# (Can be done via Supabase dashboard or custom script)
```

## Integration with CI/CD

The tests are configured to work in CI environments:
- Uses build + start instead of dev server
- Includes proper timeouts and retries
- Generates HTML reports for debugging

---

**Last Updated**: $(date)
**Status**: Ready for use