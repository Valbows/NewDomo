# CTA Tracking Implementation Summary

## Overview
I've implemented comprehensive CTA (Call-to-Action) tracking to capture when users are shown a trial CTA and whether they click on it. This addresses the requirement to track "Execute CTA?" as a yes/no metric in the reporting page.

## What Was Implemented

### 1. Database Schema
- **New Table**: `cta_tracking` 
- **Purpose**: Track CTA show/click events per conversation
- **Key Fields**:
  - `conversation_id`: Links to Tavus conversation
  - `demo_id`: Links to demo
  - `cta_shown_at`: Timestamp when CTA was displayed
  - `cta_clicked_at`: Timestamp when user clicked CTA button
  - `cta_url`: The URL user was redirected to
  - `user_agent` & `ip_address`: For analytics

### 2. Backend Tracking

#### Webhook Handler Updates (`src/app/api/tavus-webhook/handler.ts`)
- **When**: `show_trial_cta` tool is called by the AI agent
- **Action**: Records `cta_shown_at` timestamp in database
- **Data**: Links conversation ID to demo ID and CTA URL

#### New API Endpoint (`src/app/api/track-cta-click/route.ts`)
- **Purpose**: Track when user actually clicks the CTA button
- **Method**: POST
- **Data**: Updates existing record with `cta_clicked_at` timestamp
- **Security**: Captures user agent and IP for analytics

### 3. Frontend Tracking

#### Experience Page Updates (`src/app/demos/[demoId]/experience/page.tsx`)
- **Location**: CTA button click handler
- **Action**: Calls `/api/track-cta-click` when user clicks trial button
- **Data**: Sends conversation ID, demo ID, and CTA URL
- **Error Handling**: Graceful failure - tracking doesn't block user action

### 4. Reporting Dashboard

#### New Components (`src/app/demos/[demoId]/configure/components/Reporting.tsx`)

**CtaTrackingCard Component**:
- Shows "Execute CTA?" status for each conversation
- **States**:
  - "Yes - Clicked" (green) - User saw and clicked CTA
  - "Shown - Not Clicked" (yellow) - User saw CTA but didn't click
  - "No Activity" (gray) - No CTA activity recorded
- **Data Displayed**:
  - Whether CTA was shown (Yes/No + timestamp)
  - Whether CTA was clicked (Yes/No + timestamp)
  - CTA URL that was used

**Conversation List Updates**:
- Added CTA tracking badge next to other data badges
- Badge color indicates status:
  - Green: "CTA Clicked"
  - Yellow: "CTA Shown" (but not clicked)

**Data Fetching**:
- New `fetchCtaTrackingData()` function
- Integrated with existing sync functionality
- Real-time updates when new data arrives

## Data Flow

1. **AI Agent Triggers CTA**: Agent calls `show_trial_cta()` tool
2. **Webhook Captures Show Event**: Records `cta_shown_at` in database
3. **Frontend Displays CTA**: User sees trial button
4. **User Clicks Button**: Frontend calls tracking API
5. **Click Event Recorded**: Updates record with `cta_clicked_at`
6. **Reporting Updates**: Dashboard shows complete CTA journey

## Reporting Metrics

The reporting page now answers the key question: **"Execute CTA?"**

- **Yes**: User was shown CTA and clicked it
- **Partially**: User was shown CTA but didn't click
- **No**: No CTA activity recorded for this conversation

## Files Modified/Created

### New Files:
- `supabase-cta-tracking-table.sql` - Database schema
- `src/app/api/track-cta-click/route.ts` - Click tracking API
- `MANUAL_CTA_TABLE_SETUP.md` - Setup instructions
- `create-cta-table.js` - Automated setup script (backup)

### Modified Files:
- `src/app/api/tavus-webhook/handler.ts` - Added CTA show tracking
- `src/app/demos/[demoId]/experience/page.tsx` - Added click tracking
- `src/app/demos/[demoId]/configure/components/Reporting.tsx` - Added reporting UI

## Next Steps

1. **Manual Database Setup**: Run the SQL from `MANUAL_CTA_TABLE_SETUP.md` in Supabase
2. **Test the Flow**: 
   - Start a demo conversation
   - Let AI agent trigger CTA
   - Click the trial button
   - Check reporting dashboard
3. **Verify Data**: Confirm both show and click events are recorded

## Benefits

- **Complete CTA Funnel**: Track from show to click
- **Conversion Metrics**: Calculate CTA conversion rates
- **User Behavior**: Understand which demos generate more CTA clicks
- **A/B Testing Ready**: Can compare different CTA messages/URLs
- **Analytics Integration**: IP and user agent data for deeper analysis