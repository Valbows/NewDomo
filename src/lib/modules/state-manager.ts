/**
 * Module State Manager
 *
 * Handles runtime tracking of module progress during conversations.
 * Updates current_module_id and module_state in conversation_details.
 */

import type { ModuleId, ModuleState } from './types';
import {
  DEFAULT_PRODUCT_DEMO_MODULES,
  getModuleForObjective,
  getNextModule,
} from './default-modules';

/**
 * Create initial module state for a new conversation
 */
export function createInitialModuleState(): ModuleState {
  return {
    completedModules: [],
    completedObjectives: [],
    currentModuleStartedAt: new Date().toISOString(),
    moduleData: {} as Record<ModuleId, Record<string, unknown>>,
  };
}

/**
 * Result of updating module state after an objective completes
 */
export interface ModuleStateUpdateResult {
  newState: ModuleState;
  newModuleId: ModuleId | null;
  moduleChanged: boolean;
  previousModuleId: ModuleId | null;
}

/**
 * Update module state when an objective completes.
 *
 * Logic:
 * 1. Add objective to completedObjectives list
 * 2. Determine which module the objective belongs to
 * 3. If no current module, set it based on the objective
 * 4. Check if all objectives in current module are complete
 * 5. If so, mark module as complete and advance to next module
 */
export function updateModuleStateOnObjectiveComplete(
  currentState: ModuleState | null,
  currentModuleId: ModuleId | null,
  completedObjectiveName: string
): ModuleStateUpdateResult {
  const state = currentState || createInitialModuleState();

  // Add objective to completed list (avoid duplicates)
  const completedObjectives = [...state.completedObjectives];
  if (!completedObjectives.includes(completedObjectiveName)) {
    completedObjectives.push(completedObjectiveName);
  }

  // Determine which module this objective belongs to
  const objectiveModule = getModuleForObjective(completedObjectiveName);
  const objectiveModuleId = objectiveModule?.moduleId || null;

  // If no current module, set it based on the objective
  let newModuleId = currentModuleId;
  const previousModuleId = currentModuleId;

  if (!currentModuleId && objectiveModuleId) {
    newModuleId = objectiveModuleId;
  }

  // Check if we should advance to the next module
  let moduleChanged = false;
  const completedModules = [...state.completedModules];

  if (newModuleId) {
    const currentModuleDef = DEFAULT_PRODUCT_DEMO_MODULES.find(
      (m) => m.moduleId === newModuleId
    );

    if (currentModuleDef) {
      // Check if all objectives in current module are complete
      const moduleObjectivesComplete = currentModuleDef.objectiveIds.every(
        (objId) => completedObjectives.includes(objId)
      );

      if (moduleObjectivesComplete && !completedModules.includes(newModuleId)) {
        // Mark current module as complete
        completedModules.push(newModuleId);

        // Move to next module
        const nextModule = getNextModule(newModuleId);
        if (nextModule) {
          newModuleId = nextModule.moduleId;
          moduleChanged = true;
        }
      }
    }
  }

  const newState: ModuleState = {
    completedModules,
    completedObjectives,
    currentModuleStartedAt: moduleChanged
      ? new Date().toISOString()
      : state.currentModuleStartedAt,
    moduleData: state.moduleData,
  };

  return {
    newState,
    newModuleId,
    moduleChanged,
    previousModuleId,
  };
}

/**
 * Store module-specific data (e.g., qualification answers)
 */
export function setModuleData(
  state: ModuleState,
  moduleId: ModuleId,
  key: string,
  value: unknown
): ModuleState {
  const moduleData = { ...state.moduleData } as Record<
    ModuleId,
    Record<string, unknown>
  >;

  if (!moduleData[moduleId]) {
    moduleData[moduleId] = {};
  }

  moduleData[moduleId][key] = value;

  return {
    ...state,
    moduleData,
  };
}

/**
 * Get module-specific data
 */
export function getModuleData(
  state: ModuleState,
  moduleId: ModuleId,
  key: string
): unknown {
  return state.moduleData?.[moduleId]?.[key];
}

/**
 * Check if a specific module is complete
 */
export function isModuleCompleted(
  state: ModuleState,
  moduleId: ModuleId
): boolean {
  return state.completedModules.includes(moduleId);
}

/**
 * Get progress percentage for a module (0-100)
 */
export function getModuleProgress(
  state: ModuleState,
  moduleId: ModuleId
): number {
  const moduleDef = DEFAULT_PRODUCT_DEMO_MODULES.find(
    (m) => m.moduleId === moduleId
  );
  if (!moduleDef || moduleDef.objectiveIds.length === 0) return 0;

  const completedCount = moduleDef.objectiveIds.filter((objId) =>
    state.completedObjectives.includes(objId)
  ).length;

  return Math.round((completedCount / moduleDef.objectiveIds.length) * 100);
}

/**
 * Get overall demo progress percentage (0-100)
 */
export function getOverallProgress(state: ModuleState): number {
  const totalObjectives = DEFAULT_PRODUCT_DEMO_MODULES.reduce(
    (sum, m) => sum + m.objectiveIds.length,
    0
  );

  if (totalObjectives === 0) return 0;

  const completedCount = state.completedObjectives.length;
  return Math.round((completedCount / totalObjectives) * 100);
}

/**
 * Get a human-readable summary of current module state
 */
export function getModuleStateSummary(
  state: ModuleState,
  currentModuleId: ModuleId | null
): string {
  const currentModule = currentModuleId
    ? DEFAULT_PRODUCT_DEMO_MODULES.find((m) => m.moduleId === currentModuleId)
    : null;

  const parts: string[] = [];

  if (currentModule) {
    parts.push(`Current: ${currentModule.name}`);
    parts.push(`Progress: ${getModuleProgress(state, currentModuleId!)}%`);
  }

  if (state.completedModules.length > 0) {
    parts.push(`Completed: ${state.completedModules.join(', ')}`);
  }

  parts.push(`Overall: ${getOverallProgress(state)}%`);

  return parts.join(' | ');
}
