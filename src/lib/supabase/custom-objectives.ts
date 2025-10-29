/**
 * Custom Objectives Database Operations
 * Handles CRUD operations for user-defined demo objectives
 */

import { supabase } from '@/lib/supabase';
import { ObjectiveDefinition } from '@/lib/tavus';

export interface CustomObjective {
  id: string;
  demo_id: string;
  name: string;
  description?: string;
  objectives: ObjectiveDefinition[];
  tavus_objectives_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomObjectiveRequest {
  demo_id: string;
  name: string;
  description?: string;
  objectives: ObjectiveDefinition[];
}

export interface UpdateCustomObjectiveRequest {
  name?: string;
  description?: string;
  objectives?: ObjectiveDefinition[];
  tavus_objectives_id?: string;
  is_active?: boolean;
}

/**
 * Create a new custom objective set
 */
export async function createCustomObjective(
  data: CreateCustomObjectiveRequest
): Promise<CustomObjective> {
  const { data: result, error } = await supabase
    .from('custom_objectives')
    .insert({
      demo_id: data.demo_id,
      name: data.name,
      description: data.description,
      objectives: data.objectives,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create custom objective: ${error.message}`);
  }

  return result;
}

/**
 * Get all custom objectives for a demo
 */
export async function getCustomObjectives(demoId: string): Promise<CustomObjective[]> {
  const { data, error } = await supabase
    .from('custom_objectives')
    .select('*')
    .eq('demo_id', demoId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch custom objectives: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a specific custom objective by ID
 */
export async function getCustomObjective(id: string): Promise<CustomObjective | null> {
  const { data, error } = await supabase
    .from('custom_objectives')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to fetch custom objective: ${error.message}`);
  }

  return data;
}

/**
 * Get the active custom objective for a demo
 */
export async function getActiveCustomObjective(demoId: string): Promise<CustomObjective | null> {
  const { data, error } = await supabase
    .from('custom_objectives')
    .select('*')
    .eq('demo_id', demoId)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to fetch active custom objective: ${error.message}`);
  }

  return data;
}

/**
 * Update a custom objective
 */
export async function updateCustomObjective(
  id: string,
  updates: UpdateCustomObjectiveRequest
): Promise<CustomObjective> {
  const { data, error } = await supabase
    .from('custom_objectives')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update custom objective: ${error.message}`);
  }

  return data;
}

/**
 * Set a custom objective as active (deactivates others for the same demo)
 */
export async function setActiveCustomObjective(id: string): Promise<void> {
  // First get the demo_id for this objective
  const objective = await getCustomObjective(id);
  if (!objective) {
    throw new Error('Custom objective not found');
  }

  // Deactivate all other objectives for this demo
  const { error: deactivateError } = await supabase
    .from('custom_objectives')
    .update({ is_active: false })
    .eq('demo_id', objective.demo_id);

  if (deactivateError) {
    throw new Error(`Failed to deactivate other objectives: ${deactivateError.message}`);
  }

  // Activate the selected objective
  const { error: activateError } = await supabase
    .from('custom_objectives')
    .update({ is_active: true })
    .eq('id', id);

  if (activateError) {
    throw new Error(`Failed to activate objective: ${activateError.message}`);
  }
}

/**
 * Delete a custom objective
 */
export async function deleteCustomObjective(id: string): Promise<void> {
  const { error } = await supabase
    .from('custom_objectives')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete custom objective: ${error.message}`);
  }
}

/**
 * Duplicate a custom objective
 */
export async function duplicateCustomObjective(
  id: string,
  newName?: string
): Promise<CustomObjective> {
  const original = await getCustomObjective(id);
  if (!original) {
    throw new Error('Custom objective not found');
  }

  return createCustomObjective({
    demo_id: original.demo_id,
    name: newName || `${original.name} (Copy)`,
    description: original.description,
    objectives: original.objectives,
  });
}