/**
 * Integration utilities for custom objectives with Tavus agent execution
 */

import { getActiveCustomObjective } from '@/lib/supabase/custom-objectives';
import { createObjectivesManager } from './objectives-manager';
import { OBJECTIVES_TEMPLATES } from './objectives-templates';

/**
 * Get the objectives ID to use for a demo
 * Prioritizes active custom objectives, falls back to default templates
 */
export async function getObjectivesForDemo(demoId: string): Promise<string | null> {
  try {
    // First, check if there's an active custom objective
    const activeCustomObjective = await getActiveCustomObjective(demoId);
    
    if (activeCustomObjective && activeCustomObjective.tavus_objectives_id) {
      console.log(`Using custom objectives for demo ${demoId}: ${activeCustomObjective.name}`);
      return activeCustomObjective.tavus_objectives_id;
    }

    // Fall back to default demo objectives
    const objectivesManager = createObjectivesManager();
    
    // Try to get or create default product demo objectives
    try {
      const defaultObjectives = await objectivesManager.ensureObjectives(
        OBJECTIVES_TEMPLATES.PRODUCT_DEMO
      );
      console.log(`Using default product demo objectives for demo ${demoId}`);
      return defaultObjectives;
    } catch (error) {
      console.error('Failed to get default objectives:', error);
      return null;
    }
  } catch (error) {
    console.error('Error getting objectives for demo:', error);
    return null;
  }
}

/**
 * Create or update custom objectives in Tavus API
 */
export async function syncCustomObjectiveWithTavus(customObjectiveId: string): Promise<string | null> {
  try {
    const { getCustomObjective, updateCustomObjective } = await import('@/lib/supabase/custom-objectives');
    
    const customObjective = await getCustomObjective(customObjectiveId);
    if (!customObjective) {
      throw new Error('Custom objective not found');
    }

    const objectivesManager = createObjectivesManager();

    let tavusObjectivesId = customObjective.tavus_objectives_id;

    if (tavusObjectivesId) {
      // Update existing objectives in Tavus
      await objectivesManager.updateObjectives(tavusObjectivesId, {
        name: customObjective.name,
        description: customObjective.description || '',
        objectives: customObjective.objectives,
      });
    } else {
      // Create new objectives in Tavus
      const result = await objectivesManager.createObjectives({
        name: customObjective.name,
        description: customObjective.description || '',
        objectives: customObjective.objectives,
      });
      
      tavusObjectivesId = result.uuid!;
      
      // Update our database with the Tavus ID
      await updateCustomObjective(customObjectiveId, {
        tavus_objectives_id: tavusObjectivesId,
      });
    }

    return tavusObjectivesId;
  } catch (error) {
    console.error('Error syncing custom objective with Tavus:', error);
    return null;
  }
}

/**
 * Validate custom objectives before creating/updating
 */
export function validateCustomObjectives(objectives: any[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!Array.isArray(objectives) || objectives.length === 0) {
    errors.push('At least one objective is required');
    return { valid: false, errors };
  }

  objectives.forEach((obj, index) => {
    if (!obj.objective_name || typeof obj.objective_name !== 'string') {
      errors.push(`Objective ${index + 1}: Name is required`);
    }

    if (!obj.objective_prompt || typeof obj.objective_prompt !== 'string') {
      errors.push(`Objective ${index + 1}: Prompt is required`);
    }

    if (!['auto', 'manual'].includes(obj.confirmation_mode)) {
      errors.push(`Objective ${index + 1}: Invalid confirmation mode`);
    }

    if (!['verbal', 'visual'].includes(obj.modality)) {
      errors.push(`Objective ${index + 1}: Invalid modality`);
    }

    if (obj.output_variables && !Array.isArray(obj.output_variables)) {
      errors.push(`Objective ${index + 1}: Output variables must be an array`);
    }
  });

  return { valid: errors.length === 0, errors };
}

/**
 * Get demo objectives status and information
 */
export async function getDemoObjectivesStatus(demoId: string) {
  try {
    const activeCustomObjective = await getActiveCustomObjective(demoId);
    
    return {
      hasCustomObjectives: !!activeCustomObjective,
      activeObjective: activeCustomObjective,
      objectivesId: activeCustomObjective?.tavus_objectives_id || null,
      objectivesName: activeCustomObjective?.name || 'Default Product Demo',
      objectivesCount: activeCustomObjective?.objectives.length || 0,
    };
  } catch (error) {
    console.error('Error getting demo objectives status:', error);
    return {
      hasCustomObjectives: false,
      activeObjective: null,
      objectivesId: null,
      objectivesName: 'Default Product Demo',
      objectivesCount: 0,
    };
  }
}