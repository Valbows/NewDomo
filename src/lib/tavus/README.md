# Tavus Guardrails Implementation

This directory contains the proper implementation of Tavus guardrails, following their recommended approach of separating guardrails from system prompts.

## Overview

Instead of embedding guardrails directly in system prompts, we now use Tavus's dedicated guardrails API to:

- Create reusable guardrails templates
- Manage guardrails as separate resources
- Attach guardrails to personas via `guardrails_id`

## Files

### Core Files

- `guardrails-templates.ts` - Defines guardrails templates for reuse
- `guardrails-manager.ts` - Manages guardrails via Tavus API
- `persona-with-guardrails.ts` - Utilities for creating personas with guardrails
- `system_prompt.md` - Main system prompt (guardrails managed separately)

### Legacy Files

- `system_prompt.md` - Original system prompt with embedded guardrails (deprecated)

## Quick Start

1. **Set up guardrails:**

   ```bash
   npx tsx scripts/setup-guardrails.ts
   ```

2. **Create persona with guardrails:**

   ```typescript
   import { createDomoAIPersona } from "./src/lib/tavus/persona-with-guardrails";

   const persona = await createDomoAIPersona();
   console.log(`Created persona ${persona.persona_id} with guardrails`);
   ```

3. **Add guardrails to existing persona:**

   ```typescript
   import { addGuardrailsToPersona } from "./src/lib/tavus/persona-with-guardrails";

   await addGuardrailsToPersona("existing-persona-id");
   ```

## Guardrails Templates

### Domo AI Core Guardrails

- **Tool Call Silence**: Never verbalize tool calls
- **Exact Title Requirement**: Only use exact video titles
- **No Content Hallucination**: Don't invent content
- **Sensitive Topics Refusal**: Refuse inappropriate topics
- **No Parroting/Echoing**: Don't repeat user words verbatim
- **Repeat After Me Refusal**: Refuse "repeat after me" requests

### Demo Flow Guardrails

- **Progressive Demo Flow**: Guide users logically
- **Knowledge Base First**: Always check knowledge base

## Environment Variables

Set these after running the setup script:

```bash
TAVUS_API_KEY=your-api-key
DOMO_AI_GUARDRAILS_ID=g12345...  # Set by setup script
DEMO_FLOW_GUARDRAILS_ID=g67890... # Set by setup script
```

## API Usage

### Creating Guardrails

```typescript
import { createGuardrailsManager } from "./guardrails-manager";
import { DOMO_AI_GUARDRAILS } from "./guardrails-templates";

const manager = createGuardrailsManager();
const guardrails = await manager.createGuardrails(DOMO_AI_GUARDRAILS);
```

### Managing Guardrails

```typescript
// List all guardrails
const allGuardrails = await manager.getAllGuardrails();

// Get specific guardrails
const details = await manager.getGuardrails("guardrails-id");

// Update guardrails
await manager.updateGuardrails("guardrails-id", updatedTemplate);

// Delete guardrails
await manager.deleteGuardrails("guardrails-id");
```

## Testing

Run the test suite to verify everything is working:

```bash
npx tsx src/tests/test-guardrails.ts
```

## Migration Guide

### From Embedded Guardrails

1. **Run setup script:**

   ```bash
   npx tsx scripts/setup-guardrails.ts
   ```

2. **Update persona creation code:**

   ```typescript
   // Old way
   const persona = await createPersona({
     system_prompt: systemPromptWithGuardrails,
   });

   // New way
   const persona = await createDomoAIPersona();
   ```

3. **Switch to clean system prompt:**

   - Use `system_prompt.md` (guardrails now managed separately)
   - Remove guardrails section from your prompts

4. **Test your personas:**
   - Verify guardrails are still enforced
   - Check that behavior is consistent

## Benefits

- **Separation of Concerns**: Guardrails managed separately from prompts
- **Reusability**: Same guardrails across multiple personas
- **Version Control**: Track guardrails changes independently
- **API Management**: Use Tavus's guardrails API features
- **Consistency**: Ensure all personas follow same rules

## Troubleshooting

### Common Issues

1. **"TAVUS_API_KEY not found"**

   - Set your API key in environment variables

2. **"Failed to create guardrails"**

   - Check API key permissions
   - Verify network connectivity

3. **"Guardrails not found"**

   - Run the setup script first
   - Check guardrails exist in Tavus dashboard

4. **"Persona creation failed"**
   - Ensure guardrails are created first
   - Check persona configuration

### Getting Help

- Check the examples in `examples/create-persona-with-guardrails.ts`
- Run tests with `npx tsx src/tests/test-guardrails.ts`
- Review Tavus API documentation for guardrails
