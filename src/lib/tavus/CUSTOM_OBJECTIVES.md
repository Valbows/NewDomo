# Custom Demo Objectives

This feature allows users to create custom conversation flows for their Tavus agents, stored in Supabase and executed during demo conversations.

## Overview

Custom objectives provide a structured way to define how your agent should conduct demo conversations. Instead of using generic templates, you can create specific flows tailored to your product, audience, and goals.

## Features

- **Visual Builder**: Create objectives through the Agent Settings UI
- **Database Storage**: Objectives are stored in Supabase with full CRUD operations
- **Tavus Integration**: Automatically synced with Tavus API for agent execution
- **Activation System**: Only one objective set can be active per demo
- **Fallback Support**: Falls back to default templates if no custom objectives are active

## Architecture

### Database Schema

```sql
CREATE TABLE custom_objectives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    demo_id UUID NOT NULL REFERENCES demos(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    objectives JSONB NOT NULL DEFAULT '[]',
    tavus_objectives_id TEXT, -- Tavus API objectives ID
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### API Endpoints

- `GET /api/demos/[demoId]/custom-objectives` - List all objectives for a demo
- `POST /api/demos/[demoId]/custom-objectives` - Create new objective set
- `PUT /api/demos/[demoId]/custom-objectives/[objectiveId]` - Update objective set
- `DELETE /api/demos/[demoId]/custom-objectives/[objectiveId]` - Delete objective set
- `POST /api/demos/[demoId]/custom-objectives/[objectiveId]/activate` - Activate objective set

### Components

- `CustomObjectivesManager` - Main management interface
- `ObjectivesStatus` - Shows active objectives status
- `useCustomObjectives` - React hook for CRUD operations

## Usage

### 1. Creating Custom Objectives

Navigate to your demo's Agent Settings page and use the Custom Demo Objectives section:

1. Click "New Objective Set"
2. Enter a name and description
3. Add objective steps with:
   - Step name (e.g., `welcome_user`)
   - Objective prompt (what the agent should do)
   - Confirmation mode (auto/manual)
   - Modality (verbal/visual)
   - Output variables to capture

### 2. Activating Objectives

Only one objective set can be active per demo:

1. Click the play button next to an objective set
2. The system will deactivate other objectives and activate the selected one
3. The active objective will be used in new conversations

### 3. Integration with Agent

When a conversation starts:

1. System checks for active custom objectives
2. If found, uses the custom objectives with Tavus API
3. If none, falls back to default product demo template
4. Agent follows the structured conversation flow

## Objective Definition Structure

Each objective step includes:

```typescript
interface ObjectiveDefinition {
  objective_name: string;           // Unique step identifier
  objective_prompt: string;         // What the agent should do
  confirmation_mode: 'auto' | 'manual';  // How to confirm completion
  output_variables?: string[];      // Data to capture
  modality: 'verbal' | 'visual';   // Communication type
  next_conditional_objectives?: Record<string, string>;  // Conditional next steps
  next_required_objectives?: string[];  // Required next steps
  callback_url?: string;            // Optional webhook
}
```

## Examples

### Simple Product Demo

```typescript
const objectives = [
  {
    objective_name: 'welcome_user',
    objective_prompt: 'Welcome the user and understand their needs',
    confirmation_mode: 'auto',
    output_variables: ['user_name', 'company', 'use_case'],
    modality: 'verbal'
  },
  {
    objective_name: 'show_features',
    objective_prompt: 'Show relevant product features based on their needs',
    confirmation_mode: 'manual',
    output_variables: ['features_shown', 'interest_level'],
    modality: 'visual'
  },
  {
    objective_name: 'capture_contact',
    objective_prompt: 'Capture contact information for follow-up',
    confirmation_mode: 'manual',
    output_variables: ['email', 'phone', 'timeline'],
    modality: 'verbal'
  }
];
```

### Advanced E-commerce Demo

See `examples/create-custom-objectives.ts` for detailed examples including:
- E-commerce platform demo with qualification and feature demonstration
- Security SaaS demo with compliance focus
- Conditional branching based on user responses

## Best Practices

### Objective Design

1. **Start Simple**: Begin with 3-5 clear objectives
2. **Be Specific**: Write detailed prompts that guide agent behavior
3. **Capture Data**: Use output_variables to track important information
4. **Test Thoroughly**: Test your objectives with real conversations

### Conversation Flow

1. **Logical Progression**: Order objectives in a natural conversation flow
2. **Conditional Branching**: Use conditional objectives for different user paths
3. **Fallback Handling**: Always have a way to handle unexpected responses
4. **Clear Completion**: Define clear success criteria for each objective

### Performance

1. **Reasonable Length**: Keep objective sets to 5-10 steps maximum
2. **Clear Prompts**: Write concise but comprehensive prompts
3. **Efficient Capture**: Only capture variables you'll actually use
4. **Regular Updates**: Update objectives based on conversation analytics

## Troubleshooting

### Common Issues

1. **Objectives Not Active**: Check that you've activated the objective set
2. **Tavus Sync Failed**: Check API keys and network connectivity
3. **Agent Not Following Flow**: Review objective prompts for clarity
4. **Missing Data**: Verify output_variables are properly configured

### Debugging

1. Check browser console for API errors
2. Verify demo ownership and permissions
3. Test with simple objectives first
4. Review Tavus conversation logs

## Migration from Simple Objectives

If you're currently using simple text objectives in demo metadata:

1. Create a new custom objective set
2. Convert each text objective to a structured objective
3. Add appropriate prompts and configuration
4. Test the new flow
5. Activate the custom objectives

The system will automatically fall back to simple objectives if no custom objectives are active.

## API Reference

### Custom Objectives CRUD

```typescript
// Create
const objective = await createCustomObjective({
  demo_id: 'demo-uuid',
  name: 'My Custom Flow',
  description: 'Detailed demo flow for enterprise customers',
  objectives: [/* ObjectiveDefinition[] */]
});

// Read
const objectives = await getCustomObjectives('demo-uuid');
const active = await getActiveCustomObjective('demo-uuid');

// Update
await updateCustomObjective('objective-uuid', {
  name: 'Updated Name',
  objectives: [/* updated objectives */]
});

// Delete
await deleteCustomObjective('objective-uuid');

// Activate
await setActiveCustomObjective('objective-uuid');
```

### Integration Utilities

```typescript
// Get objectives for demo (custom or default)
const objectivesId = await getObjectivesForDemo('demo-uuid');

// Sync with Tavus API
const tavusId = await syncCustomObjectiveWithTavus('objective-uuid');

// Validate objectives
const { valid, errors } = validateCustomObjectives(objectives);
```