# Reporting Architecture Guidelines

## Overview
The reporting system provides detailed analytics for conversation data with a modular, component-based architecture.

## Architecture Structure

### Main Components
- **`Reporting.tsx`** - Main container component that orchestrates data fetching and layout
- **`reporting/` folder** - Individual specialized components for different data types

### Component Hierarchy
```
Reporting.tsx (Main Container)
├── ContactInfoCard.tsx (Contact/qualification data)
├── ProductInterestCard.tsx (Interest and pain points)
├── VideoShowcaseCard.tsx (Video requests and fulfillment)
├── CtaTrackingCard.tsx (CTA engagement tracking)
└── DomoScoreCard.tsx (Overall engagement scoring)
```

## Data Flow

### Database Tables
- **`conversation_details`** - Main conversation metadata (status, duration, transcript)
- **`qualification_data`** - Contact information captured during conversations
- **`product_interest_data`** - Product interests and pain points identified
- **`video_showcase_data`** - Videos requested and shown during demos
- **`cta_tracking`** - Call-to-action engagement metrics

### Data Fetching Pattern
1. Fetch conversations from `conversation_details` table
2. Extract `tavus_conversation_id` values for related data lookup
3. Fetch related data from specialized tables using conversation IDs
4. Convert arrays to lookup objects keyed by conversation ID
5. Pass data to individual components for rendering

## Component Responsibilities

### Reporting.tsx (Main Container)
- Data fetching and state management
- Conversation list rendering
- Expandable conversation details coordination
- Summary statistics calculation

### Individual Cards
- **ContactInfoCard**: Display captured contact information (name, email, position)
- **ProductInterestCard**: Show primary interests and identified pain points
- **VideoShowcaseCard**: Display requested vs. shown videos with engagement
- **CtaTrackingCard**: Track CTA presentation and click-through rates
- **DomoScoreCard**: Calculate and display overall engagement score (0-5 points)

## Interface Consistency

### Required Fields (All Data Interfaces)
```typescript
interface BaseReportingData {
  id: string;
  conversation_id: string;
  objective_name: string;
  event_type: string;
  raw_payload: any;
  received_at: string;
}
```

### Specific Interfaces
- Extend `BaseReportingData` with domain-specific fields
- Maintain consistency between main `Reporting.tsx` and individual components
- Use nullable types for optional fields (`string | null`, `string[] | null`)

## Development Guidelines

### When Adding New Reporting Components
1. Create component in `reporting/` folder
2. Define interface matching database table structure
3. Export from `reporting/index.ts`
4. Import and use in main `Reporting.tsx`
5. Add data fetching logic for new table
6. Update `DomoScoreCard` if it affects scoring

### When Modifying Interfaces
1. Update interface in individual component file
2. Update matching interface in `Reporting.tsx`
3. Update interface in `DomoScoreCard.tsx` if used there
4. Ensure database table structure matches interface

### Data Fetching Best Practices
- Use batch queries with `in()` for related data
- Convert arrays to lookup objects for O(1) access
- Handle null/undefined data gracefully
- Use consistent error handling patterns

## Scoring System (DomoScoreCard)

### 5-Point Engagement Scale
1. **Contact Confirmation** - Name, email, or position captured
2. **Reason for Visit** - Primary interest or pain points identified
3. **Platform Feature Interest** - Videos requested or shown
4. **CTA Execution** - Call-to-action clicked
5. **Visual Analysis** - Valid perception analysis available

### Score Interpretation
- **4-5 points**: Excellent engagement (Green)
- **3 points**: Good engagement (Blue)
- **2 points**: Fair engagement (Yellow)
- **0-1 points**: Poor engagement (Red)

## File Organization

### ✅ Correct Structure
```
src/app/demos/[demoId]/configure/components/
├── Reporting.tsx                    # Main container
└── reporting/
    ├── index.ts                     # Exports
    ├── ContactInfoCard.tsx          # Contact data
    ├── ProductInterestCard.tsx      # Interest data
    ├── VideoShowcaseCard.tsx        # Video data
    ├── CtaTrackingCard.tsx         # CTA data
    └── DomoScoreCard.tsx           # Scoring
```

### ❌ Avoid
- Putting all logic in single file
- Inconsistent interface definitions
- Direct database queries in components
- Mixing data fetching with presentation logic

## Integration Points

### Webhook Processing
- Data flows from Tavus webhooks → specialized tables → reporting components
- Objective completion events populate `qualification_data`, `product_interest_data`
- Video showcase events populate `video_showcase_data`
- CTA events populate `cta_tracking`

### Real-time Updates
- Components refresh when new webhook data arrives
- Sync functionality pulls latest data from Tavus API
- Conversation status updates reflect in real-time