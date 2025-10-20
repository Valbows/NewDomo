/**
 * Utility to ensure all personas have raven-0 perception analysis enabled
 */

export interface PersonaPerceptionStatus {
  persona_id: string;
  persona_name?: string;
  current_perception_model: string | null;
  needs_update: boolean;
  updated: boolean;
  error?: string;
}

/**
 * Check if a persona has raven-0 perception model enabled
 */
export async function checkPersonaPerception(personaId: string): Promise<PersonaPerceptionStatus> {
  const apiKey = process.env.TAVUS_API_KEY;
  if (!apiKey) {
    throw new Error('TAVUS_API_KEY environment variable is required');
  }

  try {
    const response = await fetch(`https://tavusapi.com/v2/personas/${personaId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    });

    if (!response.ok) {
      return {
        persona_id: personaId,
        current_perception_model: null,
        needs_update: false,
        updated: false,
        error: `Failed to fetch persona: ${response.status}`
      };
    }

    const persona = await response.json();
    const currentModel = persona.perception_model || null;
    const needsUpdate = currentModel !== 'raven-0';

    return {
      persona_id: personaId,
      persona_name: persona.name,
      current_perception_model: currentModel,
      needs_update: needsUpdate,
      updated: false
    };
  } catch (error) {
    return {
      persona_id: personaId,
      current_perception_model: null,
      needs_update: false,
      updated: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Update a persona to use raven-0 perception model
 */
export async function enableRavenPerception(personaId: string): Promise<PersonaPerceptionStatus> {
  const apiKey = process.env.TAVUS_API_KEY;
  if (!apiKey) {
    throw new Error('TAVUS_API_KEY environment variable is required');
  }

  // First check current status
  const status = await checkPersonaPerception(personaId);
  
  if (status.error) {
    return status;
  }

  if (!status.needs_update) {
    return {
      ...status,
      updated: false // Already has raven-0
    };
  }

  try {
    const response = await fetch(`https://tavusapi.com/v2/personas/${personaId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        perception_model: 'raven-0'
      })
    });

    if (!response.ok) {
      return {
        ...status,
        updated: false,
        error: `Failed to update persona: ${response.status}`
      };
    }

    console.log(`✅ Updated persona ${personaId} to use raven-0 perception model`);

    return {
      ...status,
      current_perception_model: 'raven-0',
      needs_update: false,
      updated: true
    };
  } catch (error) {
    return {
      ...status,
      updated: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Ensure all personas in a list have raven-0 perception enabled
 */
export async function ensureAllPersonasHaveRaven(personaIds: string[]): Promise<PersonaPerceptionStatus[]> {
  const results: PersonaPerceptionStatus[] = [];
  
  for (const personaId of personaIds) {
    try {
      const result = await enableRavenPerception(personaId);
      results.push(result);
    } catch (error) {
      results.push({
        persona_id: personaId,
        current_perception_model: null,
        needs_update: false,
        updated: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return results;
}

/**
 * Get summary of perception status across multiple personas
 */
export function summarizePerceptionStatus(statuses: PersonaPerceptionStatus[]) {
  return {
    total: statuses.length,
    already_enabled: statuses.filter(s => !s.needs_update && !s.error).length,
    successfully_updated: statuses.filter(s => s.updated).length,
    failed: statuses.filter(s => s.error).length,
    errors: statuses.filter(s => s.error).map(s => ({ persona_id: s.persona_id, error: s.error }))
  };
}