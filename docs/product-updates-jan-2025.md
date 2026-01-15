# Domo Product Updates & Fixes - January 2025

**Meeting Date:** January 11, 2025
**Document Created:** January 13, 2025
**Status:** Action Items for Development

---

## Table of Contents
1. [Post-Conversation Flow & CTA Redirect](#1-post-conversation-flow--cta-redirect)
2. [Embed Widget Priority & Sizing](#2-embed-widget-priority--sizing)
3. [ElevenLabs / Video Transcription](#3-elevenlabs--video-transcription)
4. [Knowledge Base Improvements](#4-knowledge-base-improvements)
5. [Demo Completion Page](#5-demo-completion-page)
6. [Reporting Page Refinements](#6-reporting-page-refinements)
7. [Branding & UI Updates](#7-branding--ui-updates)
8. [Security & Access Control](#8-security--access-control)
9. [Concurrent Calls & Data Sync](#9-concurrent-calls--data-sync)
10. [Console Logs & CSP Fixes](#10-console-logs--csp-fixes)
11. [Perception Analysis](#11-perception-analysis)
12. [Nice to Have (Future)](#12-nice-to-have-future)

---

## 1. Post-Conversation Flow & CTA Redirect

### Current State
- After conversation ends, user sees a "Thanks for chatting" screen with option to start new conversation
- No automatic redirect to Call-to-Action (CTA) page
- Hand icon displayed on end screen

### Required Changes

#### 1.1 Countdown Timer Implementation
- Add a **countdown timer (10 seconds)** on the end-of-conversation screen
- Display countdown visibly to user (e.g., "Redirecting in 10... 9... 8...")
- During countdown, user can still:
  - Click "Start New Conversation" (if enabled by customer)
  - Click "Learn More" to go directly to CTA page

#### 1.2 Auto-Redirect Logic
When countdown reaches zero:
1. **Automatically redirect** to the Call-to-Action page (new tab)
2. **Simultaneously**, redirect the original page back to the customer's website

This ensures:
- Every user who completes a conversation **always sees the CTA page**
- User is returned to the original website seamlessly
- Maximum value delivered to customer ("100% of completers saw your CTA")

#### 1.3 Settings Option for Customers
Add a toggle in customer settings:
- **Option A:** Allow user to start another conversation (button visible during countdown)
- **Option B:** No new conversation option, just countdown to CTA redirect

Some customers may want unlimited conversations (budget permitting), others may prefer direct redirect.

#### 1.4 Logo Change
- Replace the **hand icon** with **Domo logo** on the end screen
- **Premium option:** Allow customers to upload their own logo (extra cost feature)
- This provides Domo branding exposure on every conversation end

#### 1.5 Different Flow for Pop-up Embed
For the pop-up embed option (where user stays on customer's website):
- User is already on the site, so no need for complex redirect
- After conversation ends, show only two options:
  1. "Learn More" (goes to CTA)
  2. "Close" (dismisses modal, user stays on website)
- If user doesn't click either within 10 seconds, **auto-open CTA in new tab**
- The button to start a new call is already visible on the page, so no need to show it in the end modal

---

## 2. Embed Widget Priority & Sizing

### Current State
- Responsive embed and pop-up embed have equal visibility
- All iframe sizes appear the same regardless of setting

### Required Changes

#### 2.1 Reorder Embed Options
- **Option 1 (Primary):** Pop-up embed
  - Keeps user sticky on the customer's site
  - Cleaner UX, less redirecting needed
  - Looks more modern and integrated
- **Option 2 (Secondary):** Responsive/Full-page embed
  - Current default behavior
  - Redirects to separate page

#### 2.2 Iframe Sizing Fix
- Verify that size options (small, medium, large) actually produce different iframe dimensions
- Currently all sizes render identically
- Test that code copy reflects correct sizing parameters
- Ensure sizing changes are reflected in real-time preview

#### 2.3 Color Scheme Consistency
- Demo widget colors should match the overall Domo brand/dashboard colors
- Ensure visual consistency across all touchpoints

---

## 3. ElevenLabs / Video Transcription

### Current Issue
```
Error Details:
Status code: 401
Body: {
  "detail": {
    "status": "detected_unusual_activity",
    "message": "Unusual activity detected. Free Tier usage disabled..."
  }
}
```
- Video playback works, but audio transcription fails
- Error is displaying to end users on production

### Required Changes

#### 3.1 Error Handling by Environment
| Branch | Error Handling |
|--------|----------------|
| `refactor_claude_code` (dev) | Show detailed error for debugging |
| `staging` | Show generic error, log details to Sentry |
| `production_ready` | **Remove/hide specific ElevenLabs error**, show user-friendly message only |

#### 3.2 User-Facing Message
Instead of showing API error details, display:
> "Transcription is temporarily unavailable. Video playback is still working."

#### 3.3 Long-term Fix
- Migrate to Domo-owned ElevenLabs account with paid tier
- Apply for ElevenLabs startup package
- Ensure API key is properly configured in Render environment variables

---

## 4. Knowledge Base Improvements

### Current Issues
- Knowledge base doesn't auto-update when video processing completes
- User must manually refresh page to see new content
- Half-page layout cuts off content awkwardly
- No labels showing content source

### Required Changes

#### 4.1 Auto-Refresh / Real-time Update
When a video/document finishes processing:
- **Option A (Preferred):** Automatically update the knowledge base list without page refresh
- **Option B (Fallback):** Add a visible "Refresh" button if auto-update is too complex
- Show clear status indicator: "Pending" → "Processing" → "Ready"

#### 4.2 Content Source Labels
Add visible labels to each knowledge base item showing:
- **Source type:** Document, URL, Video
- **File name:** Original document/video name
- **URL:** If imported from website, show the source URL
- **Date added:** When the content was uploaded

Example display:
```
[VIDEO] product-demo-v2.mp4 | Added Jan 10, 2025
[URL] https://workday.com/features | Imported Jan 11, 2025
[DOC] sales-playbook.pdf | Added Jan 9, 2025
```

#### 4.3 Full-Page Layout
- Remove the half-page constraint
- Allow content to flow across the full page width
- Enable proper scrolling for long content lists
- Improve text readability and spacing

---

## 5. Demo Completion Page

### Current State
- Redirects to congratulations too early
- User hasn't had chance to copy embed code

### Required Changes

#### 5.1 Correct Flow Sequence
1. User completes all onboarding steps
2. Show the **final configuration page** with embed code
3. User copies the embed code
4. User clicks "Done" or "Complete Setup"
5. **THEN** show congratulations with celebration

#### 5.2 Celebration UI
- Add **confetti or balloons animation** on the page background
- Display congratulations message as a **pop-up overlay**
- User can dismiss the pop-up and still see the configuration page
- This allows them to go back and copy anything they missed

#### 5.3 Metrics Tracking
Track when users complete their first demo for analytics:
- "First demo completed within X hours of signup"
- "Average time to complete onboarding: X minutes"

---

## 6. Reporting Page Refinements

### Current Issues
- "New Conversation" label shows for all conversations, even old ones
- General UI polish needed

### Required Changes

#### 6.1 Conversation Titles
- Show accurate labels based on conversation status:
  - "New" for conversations from today
  - Actual date/time for older conversations
  - Or simply remove "New" designation entirely

#### 6.2 Data Display
- Ensure Domo Score syncs properly
- Verify perception analysis data populates correctly
- Add sync/refresh button if data doesn't auto-populate

---

## 7. Branding & UI Updates

### Required Changes

#### 7.1 Homepage Blue Banner
- Remove or fix the weird blue banner appearing on homepage
- Investigate source of the styling issue

#### 7.2 Brand Kit Implementation
**Pending:** Val to send brand kit and logo files

Once received, update:
- Color scheme across all pages
- Logo placement (header, footer, loading screens)
- Typography if specified in brand kit

#### 7.3 Login Page
- Add **Domo logo** to the authentication/login page
- Currently shows generic auth page without branding
- Logo should appear above "Sign into your account" text

#### 7.4 Logo Requirements
Current logo has limitations (can't use everywhere due to format issues). Need:
- PNG (transparent background)
- JPEG
- SVG
- AI/Adobe format
- Multiple sizes for different use cases

---

## 8. Security & Access Control

### Current Issue
- After viewing a demo via embed, user can navigate back and potentially access the customer's Domo dashboard
- Embed URL uses `app.domoagent.ai` domain

### Required Changes

#### 8.1 Embed URL Isolation
- Consider using a separate subdomain for embeds: `demo.domoagent.ai` or similar
- This separates the demo experience from the authenticated app
- Any navigation away from embed should NOT lead to app.domoagent.ai

#### 8.2 Auth Check on App Pages
- If someone navigates to `app.domoagent.ai` from an embed:
  - Check if they're authenticated
  - If NOT authenticated → redirect to login page
  - If authenticated → ensure they're going to THEIR OWN dashboard, not the customer whose demo they just viewed

#### 8.3 Post-Demo Navigation
When demo ends and CTA page opens:
- Close/hide the embed modal
- New tab with CTA page opens
- Original tab returns to customer's website
- User should NEVER end up at Domo dashboard from embed flow

---

## 9. Concurrent Calls & Data Sync

### Current Issues
- Pop-up modal not fetching video properly
- View experience fetches video but doesn't save to database
- Need to verify multiple simultaneous calls work correctly

### Test Results from Meeting
- Two concurrent calls: **SUCCESS** (both logged data)
- Video display: **INCONSISTENT** (worked for one user, not the other)

### Required Changes

#### 9.1 Video Fetch Consistency
- Debug why pop-up modal fails to fetch video in some cases
- Ensure video loads reliably across all embed types
- Test on multiple browsers and devices

#### 9.2 Database Sync
- Ensure every conversation saves to database regardless of embed type
- Verify data appears in reporting page for all sessions
- Add error handling/retry logic for failed database writes

#### 9.3 Concurrent Call Testing
Before production, test:
- 2 calls simultaneously ✓ (verified working)
- 3 calls simultaneously (Tavus limit on current plan)
- Different customers' demos at same time
- Same customer, multiple users at once

#### 9.4 Tavus Plan Considerations
Current plan: 3 concurrent calls limit
- If multiple customers have calls at same time, they share this limit
- Future: Custom Tavus plan or separate API keys per customer
- For now: Low probability issue, but note for scaling

#### 9.5 Auto-End Inactive Calls
- If user ends call, immediately terminate the session
- Don't wait 5 minutes for auto-timeout
- Implement IP-based call limits (max 1-2 calls per IP)
- Prevents abuse and saves API minutes

---

## 10. Console Logs & CSP Fixes

### Current Browser Console Errors
```
Content Security Policy violations:
- Inline script execution blocked
- WebSocket connection to Supabase blocked
```

### Required Changes

#### 10.1 Update Content Security Policy
In `next.config.js` or headers configuration, update CSP to allow:

**script-src:**
- Add `'unsafe-inline'` OR
- Add specific script hashes OR
- Use nonces for inline scripts

**connect-src:**
- Add `wss://*.supabase.co` for WebSocket connections
- Current policy only allows `https://*.supabase.co`

#### 10.2 Remove Debug Console Logs
Per CLAUDE.md guidelines:
- Remove all `console.log` from production branch
- Keep only `console.error` and `console.warn`
- Ensure no API keys, Supabase URLs, or sensitive data logged to console

#### 10.3 Browser Output Cleanup
Remove visible console outputs showing:
- API keys
- Sentry info
- Tavus info
- ElevenLabs info
- Any internal system information

---

## 11. Perception Analysis

### Current Issue
- Fetch Domo (perception analysis) needs to be added back to main branch
- Was removed or broken during recent updates

### Required Changes
- Restore perception analysis functionality
- Ensure it syncs properly with reporting page
- Verify data populates after conversation ends

---

## 12. Nice to Have (Future)

These items are not blocking but should be implemented when time allows:

### 12.1 CRM Integration (HubSpot)
- Add as step in onboarding flow
- Connect customer's HubSpot account
- Auto-sync conversation data and lead info
- Place in Settings or as post-embed-code step

### 12.2 TwelveLabs Integration
- For video understanding/search capabilities
- Free tier: 10 hours indexing, 50 search calls/day, 100 embed calls/day
- Enables context understanding at any point in video
- Agent can search video content for verification

### 12.3 Agent Search Feature
- Triple verification system
- Agent can search knowledge base during conversation
- Improves accuracy of responses

---

## Priority Order (Suggested)

### High Priority (This Week)
1. ElevenLabs error handling on production
2. Post-conversation CTA redirect with countdown
3. Console log cleanup / CSP fixes
4. Security - prevent embed users accessing dashboard
5. Concurrent calls data sync fix

### Medium Priority (This Month)
6. Knowledge base auto-refresh and labels
7. Demo completion page flow fix
8. Embed widget reordering (pop-up as primary)
9. Branding updates (once brand kit received)
10. Reporting page refinements

### Lower Priority (As Time Allows)
11. Iframe sizing verification
12. Perception analysis restore
13. HubSpot CRM integration
14. TwelveLabs integration

---

## Notes from Meeting

### Key Business Context
- Goal: 4 clients by end of January
- Focus on product stability and refinement
- Target: 90% success rate, 10% failure tolerance
- Every completed conversation should show CTA (value prop for customers)
- Product should handle concurrent users at scale

### API Limits to Track
| Service | Current Plan | Limit |
|---------|--------------|-------|
| Tavus | Free/Starter | 3 concurrent calls |
| ElevenLabs | Free (disabled) | Need paid tier |
| TwelveLabs | Free | 10 hrs indexing, 50 search/day |

### Environment Migration TODO
Before production launch, migrate accounts to Domo-owned:
- Supabase
- Tavus
- ElevenLabs
- All API keys under Domo business accounts

---

*Document created from meeting transcript and developer notes. Update status as items are completed.*
