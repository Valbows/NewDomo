/**
 * Type definitions for objectives feature components
 */

import { ObjectiveDefinition } from '@/lib/services/tavus/types';
import { CustomObjective } from '@/lib/supabase/custom-objectives';

export interface CustomObjectivesManagerProps {
  demoId: string;
}

export interface ObjectiveFormData {
  name: string;
  description: string;
  objectives: ObjectiveDefinition[];
}

export interface ObjectivesBuilderProps {
  objectives: ObjectiveDefinition[];
  onChange: (objectives: ObjectiveDefinition[]) => void;
  disabled?: boolean;
}

export interface ObjectivesStatusProps {
  objective: CustomObjective;
  onActivate?: (objectiveId: string) => void;
  onEdit?: (objective: CustomObjective) => void;
  onDelete?: (objectiveId: string) => void;
}

export interface ObjectiveItemProps {
  objective: ObjectiveDefinition;
  index: number;
  onChange: (index: number, objective: ObjectiveDefinition) => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
}

export interface ObjectiveFormProps {
  objective: ObjectiveDefinition;
  onChange: (objective: ObjectiveDefinition) => void;
  disabled?: boolean;
}

// Constants for objectives feature
export const EMPTY_OBJECTIVE: ObjectiveDefinition = {
  objective_name: '',
  objective_prompt: '',
  confirmation_mode: 'auto',
  output_variables: [],
  modality: 'verbal',
  callback_url: '',
};

export const CONFIRMATION_MODES = ['auto', 'manual'] as const;
export const MODALITIES = ['verbal', 'visual', 'both'] as const;