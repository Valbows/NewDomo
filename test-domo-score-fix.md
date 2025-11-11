# Test Plan for Domo Score Fix

## Test Scenario: Complete Conversation Flow

### Setup
1. Open a demo in the experience page
2. Open browser developer tools to monitor console logs
3. Have the reporting page open in another tab to monitor score changes

### Test Steps

#### 1. Test Video Tracking
1. Start a conversation with the AI agent
2. Ask to see a demo video (e.g., "Can you show me a video about workforce planning?")
3. When the agent offers to show a video, accept (say "Yes please")
4. **Expected Results**:
   - Video should play
   - Console should show: `✅ Video view tracked successfully: [Video Title]`
   - In reporting page, the conversation should show a purple "🎬 Video Data" badge
   - Domo score should include 1 point for "Platform Feature Most Interested In"

#### 2. Test CTA Tracking
1. Continue the conversation until the CTA appears
2. Click the CTA button
3. **Expected Results**:
   - Console should show detailed tracking data and `✅ CTA click tracked successfully`
   - In reporting page, the conversation should show a green "🎯 CTA Clicked" badge
   - Domo score should include 1 point for "CTA Execution"

#### 3. Verify Complete Score
After completing both steps, the Domo score should show:
- ✅ Contact Confirmation (1 pt) - if name/email provided
- ✅ Reason Why They Visited Site (1 pt) - if interest expressed
- ✅ Platform Feature Most Interested In (1 pt) - from video viewing
- ✅ CTA Execution (1 pt) - from CTA click
- ✅ Visual Analysis (1 pt) - if camera is working

**Total Expected Score: 4-5/5 points**

### Debugging Failed Tests

#### If Video Tracking Fails:
1. Check console for error messages
2. Verify the `/api/track-video-view` endpoint is working
3. Run this query to check database:
   ```sql
   SELECT * FROM video_showcase_data WHERE conversation_id = '[CONVERSATION_ID]';
   ```

#### If CTA Tracking Fails:
1. Check console for detailed tracking data
2. Verify conversation ID matches between tracking and scoring
3. Run this query to check database:
   ```sql
   SELECT * FROM cta_tracking WHERE conversation_id = '[CONVERSATION_ID]';
   ```

#### If Score Doesn't Update:
1. Wait 30 seconds for auto-refresh
2. Manually refresh the reporting page
3. Check if data exists in database but score calculation is wrong

### Manual Database Verification

Use the queries in `debug-domo-score-issues.sql` to verify data is being stored correctly:

```sql
-- Replace 'YOUR_CONVERSATION_ID' with the actual conversation ID from logs
SELECT 'cta_tracking' as table_name, COUNT(*) as count FROM cta_tracking WHERE conversation_id = 'YOUR_CONVERSATION_ID'
UNION ALL
SELECT 'video_showcase_data' as table_name, COUNT(*) as count FROM video_showcase_data WHERE conversation_id = 'YOUR_CONVERSATION_ID';
```

### Success Criteria
- [ ] Videos are tracked when played
- [ ] CTA clicks are tracked when clicked
- [ ] Domo score reflects both video viewing and CTA execution
- [ ] Score updates appear in reporting dashboard within 30 seconds
- [ ] Console logs show successful tracking for both actions