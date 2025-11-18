# Fix for Domo Score Tracking Issues

## Issues Identified

1. **CTA Tracking**: CTA clicks are being tracked successfully but may not be reflected in Domo score due to data fetching timing or conversation ID mismatch.

2. **Video Tracking**: Videos are being played but not tracked in the `video_showcase_data` table for scoring.

## Solutions Implemented

### 1. Added Video Tracking API Endpoint
- Created `/api/track-video-view/route.ts` to track when videos are viewed
- Added tracking call in the video playback function in `page.tsx`

### 2. Enhanced Video Tracking in Experience Page
- Modified `src/app/demos/[demoId]/experience/page.tsx` to call the video tracking API when videos are played
- Added proper error handling and logging

### 3. Debug Queries
- Created `debug-domo-score-issues.sql` to help diagnose data issues

## Testing Steps

1. **Test Video Tracking**:
   - Start a new conversation
   - Request and view a video
   - Check that the video title appears in `video_showcase_data` table
   - Verify Domo score reflects the video viewing (should get 1 point for "Platform Feature Most Interested In")

2. **Test CTA Tracking**:
   - Complete a conversation flow
   - Click the CTA button
   - Check that `cta_clicked_at` is populated in `cta_tracking` table
   - Verify Domo score reflects the CTA click (should get 1 point for "CTA Execution")

3. **Debug Data Issues**:
   - Run the queries in `debug-domo-score-issues.sql` for any problematic conversation
   - Check for conversation ID mismatches between tables

## Expected Behavior After Fix

- Videos shown during conversations should be tracked and contribute to Domo score
- CTA clicks should be properly reflected in the score calculation
- All 5 components of the Domo score should work correctly:
  1. Contact Confirmation ✅ (already working)
  2. Reason Why They Visited Site ✅ (already working) 
  3. Platform Feature Most Interested In 🔧 (fixed with video tracking)
  4. CTA Execution 🔧 (should work, may need debugging)
  5. Visual Analysis ✅ (already working)

## Files Modified

1. `src/app/demos/[demoId]/experience/page.tsx` - Added video tracking
2. `src/app/api/track-video-view/route.ts` - New API endpoint for video tracking
3. `debug-domo-score-issues.sql` - Debug queries
4. `fix-domo-score-tracking.md` - This documentation

## Next Steps

1. Test the video tracking functionality
2. If CTA tracking still doesn't work, investigate conversation ID mapping
3. Consider adding real-time score updates in the UI
4. Add more detailed logging for debugging