# Objectives Override Behavior

## Overview

The system implements a clear priority hierarchy for demo objectives:

1. **Custom Objectives** (Highest Priority) - Always override defaults when active
2. **Default Template Objectives** (Fallback) - Used only when no custom objectives exist

## How It Works

### Priority Logic

```typescript
// In create-enhanced-agent API
if (activeCustomObjective && activeCustomObjective.tavus_objectives_id) {
  // ✅ USE CUSTOM OBJECTIVES (overrides defaults)
  objectivesId = activeCustomObjective.tavus_objectives_id;
} else {
  // 📋 USE DEFAULT TEMPLATE OBJECTIVES
  objectivesId = DEFAULT_OBJECTIVES_ID;
}
```

### Default Templates

Located in `src/lib/tavus/objectives-templates.ts`:
- `PRODUCT_DEMO_OBJECTIVES` - Complete product demonstration flow
- `LEAD_QUALIFICATION_OBJECTIVES` - Lead qualification focused flow  
- `CUSTOMER_SUPPORT_OBJECTIVES` - Customer support and training flow

### Custom Objectives

- Stored in database via `custom_objectives` table
- Created through UI in Agent Settings
- Must have `is_active = true` to override defaults
- Must have valid `tavus_objectives_id` to be used

## User Interface

### Visual Indicators

1. **ObjectivesStatus Component**
   - Green: Custom objectives active (overriding defaults)
   - Yellow: Using default templates

2. **Agent Settings**
   - Clear notice about priority system
   - Status indicator showing current objectives source

### Testing

Use the test endpoint to verify override behavior:
```
GET /api/test-objectives-override?demoId=your-demo-id
```

## Fallback Behavior

If custom objectives fail during agent creation:
1. System automatically retries with default objectives
2. Logs indicate fallback occurred
3. Agent is still created successfully

## Key Files

- `src/lib/tavus/custom-objectives-integration.ts` - Core override logic
- `src/app/api/create-enhanced-agent/route.ts` - Agent creation with objectives
- `src/components/ObjectivesStatus.tsx` - UI status indicator
- `src/components/CustomObjectivesManager.tsx` - Custom objectives management

## Validation

The system includes validation to ensure:
- Custom objectives have required fields
- Tavus API integration is working
- Override behavior is functioning correctly
- Fallback mechanisms are in place