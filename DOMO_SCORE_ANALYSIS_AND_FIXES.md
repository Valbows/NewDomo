# 🏆 Domo Score Analysis & Improvement Plan

## Current Score: 2/5 (40%)

### ✅ Successfully Captured (2 points):
1. **Contact Confirmation** - Name, email, position captured via `greeting_and_qualification` objective
2. **Visual Analysis (Perception)** - Full visual perception data captured via Tavus Raven-0

### ❌ Missing Data Points (3 points):
3. **Reason Why They Visited Site** - No product interest data captured
4. **Platform Feature Most Interested In** - Video viewed but not tracked properly  
5. **CTA Execution** - CTA clicked but tracked under wrong conversation ID

---

## 🔍 Root Cause Analysis

### Issue 1: Conversation ID Mismatch
**Problem**: The system uses `demo.tavus_conversation_id` from database metadata, but Tavus creates new conversation IDs for each session.

**Evidence**: 
- CTA was successfully clicked and tracked under old conversation ID `c9c623466826c4cc`
- Actual conversation used new ID `c747544530dac4c9`
- Video tracking also affected by same issue

**Impact**: CTA and video tracking fail to contribute to Domo Score

### Issue 2: Missing Objectives Configuration
**Problem**: Demo has no objectives configured (`objectives_id: null`, `metadata.objectives: []`)

**Evidence**:
- User expressed interest: "improving budgeting" and "organization and planning"
- No `product_interest_discovery` objective completion event fired
- System relies on objective completions to capture structured data

**Impact**: Product interest data not captured automatically

### Issue 3: Video Showcase Tracking Gap
**Problem**: Video was requested, played, and viewed but not recorded in `video_showcase_data` table

**Evidence**:
- Console logs show: `fetch_video` tool call with "Workforce Planning: Headcount and Cost Planning"
- Video successfully played: `✅ Video view tracked successfully`
- But no records in `video_showcase_data` for conversation ID `c747544530dac4c9`

**Impact**: Platform feature interest not counted toward Domo Score

---

## 🔧 Implemented Fixes

### Fix 1: Dynamic Conversation ID Resolution ✅
**File**: `src/app/demos/[demoId]/experience/page.tsx`

**Changes**:
- Added `extractConversationIdFromUrl()` helper function
- Updated CTA tracking to use current conversation URL instead of stored metadata
- Updated video tracking to use current conversation URL instead of stored metadata

**Code**:
```typescript
// Helper function to extract conversation ID from Tavus Daily URL
function extractConversationIdFromUrl(url: string): string | null {
  try {
    // Tavus URLs are in format: https://tavus.daily.co/{conversation_id}
    const match = url.match(/tavus\.daily\.co\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

// Use current conversation ID from URL
const currentConversationId = conversationUrl ? extractConversationIdFromUrl(conversationUrl) : demo?.tavus_conversation_id;
```

### Fix 2: Enhanced Logging & Debugging ✅
**Added detailed logging to track**:
- Which conversation ID is being used (current URL vs demo metadata)
- Success/failure of tracking API calls
- Data source identification for troubleshooting

---

## 🎯 Expected Improvements

### After Fixes Applied:
- **CTA Execution**: ❌ → ✅ (+1 point)
- **Platform Feature Interest**: ❌ → ✅ (+1 point)  
- **New Score**: 4/5 (80%) - **+2 points improvement**

### Remaining Gap:
- **Reason Why They Visited Site**: Still requires objectives configuration

---

## 📋 Next Steps for 5/5 Score

### 1. Configure Demo Objectives
**Action**: Set up proper objectives in demo configuration
**Required Objectives**:
- `greeting_and_qualification` ✅ (already working)
- `product_interest_discovery` ❌ (needs setup)
- `video_showcase` ✅ (will work with fixes)

### 2. Test Complete Flow
**Action**: Run end-to-end test with new conversation
**Expected Result**: All 5 data points captured = 5/5 (100%) Domo Score

### 3. Monitor & Validate
**Action**: Use reporting dashboard to verify improvements
**Tools**: 
- Supabase database queries
- Console log analysis  
- Domo Score calculation verification

---

## 🧪 Testing Commands

### Check Current Data:
```bash
node check-domo-score.js
```

### Test Fixes (after deployment):
```bash
node test-domo-score-fixes.js
```

### Verify Conversation ID Extraction:
```javascript
const url = "https://tavus.daily.co/c747544530dac4c9";
const id = extractConversationIdFromUrl(url);
console.log(id); // Should output: c747544530dac4c9
```

---

## 💡 Key Insights

1. **Conversation ID Management**: Critical to use active conversation ID, not stored metadata
2. **Objective Configuration**: Essential for automated data capture
3. **Real-time Tracking**: Video and CTA events happen during active conversations
4. **Data Consistency**: All tracking must use same conversation identifier
5. **Fallback Mechanisms**: Manual tracking APIs provide backup when objectives fail

---

## 🎉 Success Metrics

- **Before**: 2/5 (40%) - Only contact info and perception captured
- **After Fixes**: 4/5 (80%) - Added CTA and video tracking  
- **With Objectives**: 5/5 (100%) - Complete product interest capture
- **Improvement**: +150% increase in data capture completeness