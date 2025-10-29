/**
 * Constants for demos feature components
 */

export const DEMO_CONFIG = {
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MIN_NAME_LENGTH: 3,
  MAX_CTA_TEXT_LENGTH: 50,
  MAX_CTA_URL_LENGTH: 2000,
} as const;

export const DEMO_VALIDATION_MESSAGES = {
  NAME_REQUIRED: 'Demo name is required',
  NAME_TOO_SHORT: `Demo name must be at least ${DEMO_CONFIG.MIN_NAME_LENGTH} characters`,
  NAME_TOO_LONG: `Demo name must be less than ${DEMO_CONFIG.MAX_NAME_LENGTH} characters`,
  DESCRIPTION_TOO_LONG: `Description must be less than ${DEMO_CONFIG.MAX_DESCRIPTION_LENGTH} characters`,
  INVALID_STATUS: 'Invalid demo status',
  CTA_TEXT_TOO_LONG: `CTA text must be less than ${DEMO_CONFIG.MAX_CTA_TEXT_LENGTH} characters`,
  CTA_URL_TOO_LONG: `CTA URL must be less than ${DEMO_CONFIG.MAX_CTA_URL_LENGTH} characters`,
  INVALID_CTA_URL: 'Invalid CTA URL format',
} as const;

export const DEMO_PLACEHOLDERS = {
  NAME: 'Enter demo name...',
  DESCRIPTION: 'Enter demo description...',
  CTA_TEXT: 'Get Started',
  CTA_URL: 'https://example.com',
} as const;

export const DEMO_STATUS_LABELS = {
  active: 'Active',
  inactive: 'Inactive',
  draft: 'Draft',
} as const;

export const DEMO_STATUS_DESCRIPTIONS = {
  active: 'Demo is live and accessible to users',
  inactive: 'Demo is temporarily disabled',
  draft: 'Demo is in development and not yet published',
} as const;

export const DEMO_SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'created_at', label: 'Created Date' },
  { value: 'updated_at', label: 'Last Modified' },
  { value: 'status', label: 'Status' },
] as const;

export const DEMO_FILTER_OPTIONS = [
  { value: 'all', label: 'All Demos' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'draft', label: 'Draft' },
] as const;