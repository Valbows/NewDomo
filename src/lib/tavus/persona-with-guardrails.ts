/**
 * Persona creation utilities with guardrails integration
 */

import { createGuardrailsManager } from './guardrails-manager';
import * as fs from 'fs';
import * as path from 'path';

export interface PersonaConfig {
  system_prompt?: string;
  guardrails_id?: string;
  objectives_id?: string;
  // Add other persona properties as needed
  [key: string]: any;
}

export interface PersonaResponse {
  persona_id: string;
  system_prompt: string;
  guardrails_id?: string;
  objectives_id?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Create a persona with Domo AI guardrails
 */
export async function createDomoAIPersona(config: Omit<PersonaConfig, 'guardrails_id'> = {}): Promise<PersonaResponse> {
  const apiKey = process.env.TAVUS_API_KEY;
  if (!apiKey) {
    throw new Error('TAVUS_API_KEY environment variable is required');
  }

  // Get or create guardrails
  const manager = createGuardrailsManager();
  const guardrailsId = await manager.ensureDomoAIGuardrails();

  // Load system prompt if not provided
  let systemPrompt = config.system_prompt;
  if (!systemPrompt) {
    const promptPath = path.join(process.cwd(), 'src', 'lib', 'tavus', 'system_prompt.md');
    systemPrompt = fs.readFileSync(promptPath, 'utf-8');
  }

  // Create persona with guardrails
  const personaConfig: PersonaConfig = {
    ...config,
    system_prompt: systemPrompt,
    guardrails_id: guardrailsId
  };

  // Debug logging removed for production

  const response = await fetch('https://tavusapi.com/v2/personas/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey
    },
    body: JSON.stringify(personaConfig)
  });

  if (!response.ok) {
    throw new Error(`Failed to create persona: ${response.statusText}`);
  }

  const persona = await response.json();
  console.log(`✅ Created persona ${persona.persona_id} with guardrails ${guardrailsId}`);
  
  return persona;
}

/**
 * Add guardrails to an existing persona
 */
export async function addGuardrailsToPersona(personaId: string, guardrailsId?: string): Promise<PersonaResponse> {
  const apiKey = process.env.TAVUS_API_KEY;
  if (!apiKey) {
    throw new Error('TAVUS_API_KEY environment variable is required');
  }

  // Get guardrails ID if not provided
  if (!guardrailsId) {
    const manager = createGuardrailsManager();
    guardrailsId = await manager.ensureDomoAIGuardrails();
  }

  // Update persona with guardrails using JSON Patch
  const patchOperations = [
    {
      op: "add",
      path: "/guardrails_id",
      value: guardrailsId
    }
  ];

  const response = await fetch(`https://tavusapi.com/v2/personas/${personaId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey
    },
    body: JSON.stringify(patchOperations)
  });

  if (!response.ok) {
    throw new Error(`Failed to update persona: ${response.statusText}`);
  }

  const persona = await response.json();
  console.log(`✅ Added guardrails ${guardrailsId} to persona ${personaId}`);
  
  return persona;
}

/**
 * Get environment variable for guardrails ID
 */
export function getGuardrailsIdFromEnv(): string | undefined {
  return process.env.DOMO_AI_GUARDRAILS_ID;
}

/**
 * Validate that a persona has guardrails attached
 */
export async function validatePersonaGuardrails(personaId: string): Promise<boolean> {
  const apiKey = process.env.TAVUS_API_KEY;
  if (!apiKey) {
    throw new Error('TAVUS_API_KEY environment variable is required');
  }

  const response = await fetch(`https://tavusapi.com/v2/personas/${personaId}`, {
    method: 'GET',
    headers: {
      'x-api-key': apiKey
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to get persona: ${response.statusText}`);
  }

  const persona = await response.json();
  return !!persona.guardrails_id;
}