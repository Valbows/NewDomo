# Raven-0 Perception Analysis Setup

This document explains how to ensure all Tavus personas have raven-0 perception analysis enabled for detailed conversation insights.

## What is Raven-0?

Raven-0 is Tavus's perception analysis model that provides:
- Visual and behavioral analysis of conversations
- Engagement metrics and sentiment scoring
- Detailed insights into user interactions
- Transcript analysis with perception data

## Automatic Setup for New Personas

All new personas created through the system will automatically have `perception_model: 'raven-0'` enabled:

### 1. Main Create Agent API
- **File**: `src/app/api/create-agent/route.ts`
- **Change**: Added `perception_model: 'raven-0'` to persona creation payload
- **Effect**: All new agents created through the UI will have perception analysis enabled

### 2. Persona with Guardrails Utility
- **File**: `src/lib/tavus/persona-with-guardrails.ts`
- **Change**: Added `perception_model: 'raven-0'` to `createDomoAIPersona` function
- **Effect**: All programmatically created personas will have perception analysis enabled

## Updating Existing Personas

For personas created before this update, use these tools to enable raven-0:

### 1. UI Debug Panel
- Navigate to any demo's Reporting page
- Click "Debug Raven-0" button
- Use "Fix All" to update all personas at once

### 2. API Endpoints
```bash
# Check status of all personas
GET /api/ensure-raven-perception

# Update all personas to use raven-0
POST /api/ensure-raven-perception

# Update specific persona
POST /api/ensure-raven-perception
{
  "personaIds": ["persona-id-here"]
}
```

### 3. Command Line Script
```bash
# Run the bulk update script
npx tsx scripts/ensure-all-raven.ts
```

### 4. Individual Persona Fix
```bash
# Check and fix specific persona
GET /api/check-persona-config?personaId=your-persona-id
POST /api/check-persona-config
{
  "personaId": "your-persona-id",
  "perception_model": "raven-0"
}
```

## Verification

After enabling raven-0, verify it's working:

1. **Check Persona Configuration**:
   - Use the debug panel or API to confirm `perception_model: 'raven-0'`

2. **Test Conversation Sync**:
   - Have a conversation with the persona
   - Use "Sync from Tavus" on the reporting page
   - Check that perception analysis data appears in conversation details

3. **Monitor Logs**:
   - Look for perception analysis events in the sync API logs
   - Verify transcript and perception data are being extracted

## Troubleshooting

### No Perception Data After Sync
1. Verify persona has `perception_model: 'raven-0'`
2. Ensure conversation is completed (not just active)
3. Check Tavus API response for perception events
4. Use the debug script to see detailed event structure

### Persona Update Fails
1. Check TAVUS_API_KEY is valid
2. Verify persona exists and is accessible
3. Check API rate limits
4. Review error logs for specific failure reasons

## Files Modified

### Core Changes
- `src/app/api/create-agent/route.ts` - Main persona creation
- `src/lib/tavus/persona-with-guardrails.ts` - Utility persona creation
- `src/app/api/sync-tavus-conversations/route.ts` - Enhanced data extraction

### New Utilities
- `src/lib/tavus/ensure-raven-perception.ts` - Raven-0 management utilities
- `src/app/api/ensure-raven-perception/route.ts` - Bulk update API
- `src/components/EnsureRavenButton.tsx` - UI component for updates
- `scripts/ensure-all-raven.ts` - Command line bulk update

### Enhanced Components
- `src/components/RavenDebugPanel.tsx` - Debug and fix UI
- `src/app/demos/[demoId]/configure/components/Reporting.tsx` - Added debug panel

## Best Practices

1. **Always Enable for New Personas**: The automatic setup ensures this
2. **Regular Audits**: Use the debug panel to check persona configurations
3. **Monitor Sync Results**: Check that perception data is being captured
4. **Test After Updates**: Verify conversations produce perception analysis

## Environment Variables

No additional environment variables are needed. The system uses the existing `TAVUS_API_KEY` for all operations.