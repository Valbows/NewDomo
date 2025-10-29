/**
 * Constants for objectives feature components
 */

export const OBJECTIVES_CONFIG = {
  MAX_OBJECTIVES_PER_SET: 10,
  MIN_OBJECTIVE_NAME_LENGTH: 3,
  MAX_OBJECTIVE_NAME_LENGTH: 100,
  MAX_OBJECTIVE_PROMPT_LENGTH: 1000,
  MAX_DESCRIPTION_LENGTH: 500,
} as const;

export const OBJECTIVE_VALIDATION_MESSAGES = {
  NAME_REQUIRED: 'Objective name is required',
  NAME_TOO_SHORT: `Objective name must be at least ${OBJECTIVES_CONFIG.MIN_OBJECTIVE_NAME_LENGTH} characters`,
  NAME_TOO_LONG: `Objective name must be less than ${OBJECTIVES_CONFIG.MAX_OBJECTIVE_NAME_LENGTH} characters`,
  PROMPT_REQUIRED: 'Objective prompt is required',
  PROMPT_TOO_LONG: `Objective prompt must be less than ${OBJECTIVES_CONFIG.MAX_OBJECTIVE_PROMPT_LENGTH} characters`,
  DESCRIPTION_TOO_LONG: `Description must be less than ${OBJECTIVES_CONFIG.MAX_DESCRIPTION_LENGTH} characters`,
  INVALID_CONFIRMATION_MODE: 'Invalid confirmation mode',
  INVALID_MODALITY: 'Invalid modality',
  INVALID_CALLBACK_URL: 'Invalid callback URL format',
  MAX_OBJECTIVES_EXCEEDED: `Cannot have more than ${OBJECTIVES_CONFIG.MAX_OBJECTIVES_PER_SET} objectives`,
} as const;

export const OBJECTIVE_PLACEHOLDERS = {
  NAME: 'Enter objective name...',
  DESCRIPTION: 'Enter objective description...',
  PROMPT: 'Enter the objective prompt that will guide the AI...',
  CALLBACK_URL: 'https://example.com/webhook',
  OUTPUT_VARIABLE: 'variable_name',
} as const;

export const OBJECTIVE_HELP_TEXT = {
  NAME: 'A short, descriptive name for this objective',
  DESCRIPTION: 'Optional description explaining what this objective accomplishes',
  PROMPT: 'The prompt that will guide the AI to achieve this objective',
  CONFIRMATION_MODE: 'How the objective completion should be confirmed',
  MODALITY: 'The interaction method for this objective',
  CALLBACK_URL: 'Optional webhook URL to call when objective is completed',
  OUTPUT_VARIABLES: 'Variables to extract and return when objective is completed',
} as const;