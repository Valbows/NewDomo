/**
 * Utility functions for objectives feature components
 */

import { ObjectiveDefinition } from '@/lib/services/tavus/types';
import { CustomObjective } from '@/lib/supabase/custom-objectives';
import { EMPTY_OBJECTIVE, CONFIRMATION_MODES, MODALITIES } from './types';

/**
 * Validates an objective definition
 */
export function validateObjective(objective: ObjectiveDefinition): string[] {
  const errors: string[] = [];

  if (!objective.objective_name?.trim()) {
    errors.push('Objective name is required');
  }

  if (!objective.objective_prompt?.trim()) {
    errors.push('Objective prompt is required');
  }

  if (!CONFIRMATION_MODES.includes(objective.confirmation_mode as any)) {
    errors.push('Invalid confirmation mode');
  }

  if (!MODALITIES.includes(objective.modality as any)) {
    errors.push('Invalid modality');
  }

  if (objective.callback_url && !isValidUrl(objective.callback_url)) {
    errors.push('Invalid callback URL');
  }

  return errors;
}

/**
 * Creates a new empty objective
 */
export function createEmptyObjective(): ObjectiveDefinition {
  return { ...EMPTY_OBJECTIVE };
}

/**
 * Validates a URL
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Formats objective for display
 */
export function formatObjectiveForDisplay(objective: CustomObjective): {
  name: string;
  description: string;
  objectiveCount: number;
  status: string;
} {
  return {
    name: objective.name,
    description: objective.description || 'No description',
    objectiveCount: objective.objectives?.length || 0,
    status: objective.is_active ? 'Active' : 'Inactive',
  };
}

/**
 * Generates a unique objective name
 */
export function generateObjectiveName(existingNames: string[]): string {
  let counter = 1;
  let name = `Objective ${counter}`;
  
  while (existingNames.includes(name)) {
    counter++;
    name = `Objective ${counter}`;
  }
  
  return name;
}

/**
 * Sorts objectives by creation date (newest first)
 */
export function sortObjectivesByDate(objectives: CustomObjective[]): CustomObjective[] {
  return [...objectives].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/**
 * Filters objectives by status
 */
export function filterObjectivesByStatus(
  objectives: CustomObjective[], 
  status: 'active' | 'inactive' | 'all'
): CustomObjective[] {
  if (status === 'all') return objectives;
  return objectives.filter(obj => 
    status === 'active' ? obj.is_active : !obj.is_active
  );
}

/**
 * Exports objectives to JSON
 */
export function exportObjectivesToJSON(objectives: CustomObjective[]): string {
  const exportData = objectives.map(obj => ({
    name: obj.name,
    description: obj.description,
    objectives: obj.objectives,
    created_at: obj.created_at,
  }));
  
  return JSON.stringify(exportData, null, 2);
}

/**
 * Imports objectives from JSON
 */
export function importObjectivesFromJSON(jsonString: string): Partial<CustomObjective>[] {
  try {
    const data = JSON.parse(jsonString);
    
    if (!Array.isArray(data)) {
      throw new Error('Invalid format: expected array');
    }
    
    return data.map(item => ({
      name: item.name,
      description: item.description,
      objectives: item.objectives || [],
    }));
  } catch (error) {
    throw new Error(`Failed to import objectives: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}