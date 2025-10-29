/**
 * Tavus Objectives Templates
 * Centralized export of all objectives templates
 */

export * from './types';
export { PRODUCT_DEMO_OBJECTIVES } from './product-demo';
export { LEAD_QUALIFICATION_OBJECTIVES } from './lead-qualification';
export { CUSTOMER_SUPPORT_OBJECTIVES } from './customer-support';

import { PRODUCT_DEMO_OBJECTIVES } from './product-demo';
import { LEAD_QUALIFICATION_OBJECTIVES } from './lead-qualification';
import { CUSTOMER_SUPPORT_OBJECTIVES } from './customer-support';

/**
 * All available objectives templates
 */
export const OBJECTIVES_TEMPLATES = {
  PRODUCT_DEMO: PRODUCT_DEMO_OBJECTIVES,
  LEAD_QUALIFICATION: LEAD_QUALIFICATION_OBJECTIVES,
  CUSTOMER_SUPPORT: CUSTOMER_SUPPORT_OBJECTIVES,
} as const;

export type ObjectivesTemplateKey = keyof typeof OBJECTIVES_TEMPLATES;