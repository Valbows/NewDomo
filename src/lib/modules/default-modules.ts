import type { ModuleDefinition, ModuleId } from './types';

/**
 * Default Product Demo Modules
 *
 * These define the standard flow for a product demonstration.
 * Each module groups related objectives, content, and videos.
 *
 * When a new demo is created, these defaults are seeded into the
 * demo_modules table, allowing per-demo customization later.
 */
export const DEFAULT_PRODUCT_DEMO_MODULES: ModuleDefinition[] = [
  {
    moduleId: 'intro',
    name: 'Introduction',
    description:
      'Welcome visitors, introduce yourself, and set expectations for the demo experience.',
    orderIndex: 1,
    objectiveIds: ['introduce_domo_agent'],
    requiresVideo: false,
    uploadGuidance:
      'Upload content that explains who you are, what the product does at a high level, and what visitors can expect from this demo. Include any welcome videos or company overview materials.',
  },
  {
    moduleId: 'qualification',
    name: 'Qualification',
    description:
      'Understand who the visitor is, their role, company, and specific needs to personalize the demo.',
    orderIndex: 2,
    objectiveIds: ['needs_discovery'],
    requiresVideo: false,
    uploadGuidance:
      'Upload content about your ideal customer profile (ICP), typical customer roles, company sizes you serve, and any qualification criteria. Include FAQs about who the product is best suited for.',
  },
  {
    moduleId: 'overview',
    name: 'Product Overview',
    description:
      "Provide a high-level product walkthrough that connects to the visitor's stated needs.",
    orderIndex: 3,
    objectiveIds: ['explain_and_show_overview'],
    requiresVideo: true,
    uploadGuidance:
      'Upload your main product overview video and supporting materials. Include high-level feature summaries, key benefits, and any "why us" content that resonates with qualified prospects.',
  },
  {
    moduleId: 'feature_deep_dive',
    name: 'Feature Deep Dive',
    description:
      "Demonstrate specific features relevant to the visitor's use case and pain points.",
    orderIndex: 4,
    objectiveIds: [
      'explain_and_show_specific_feature',
      'feature_deep_dive',
      'address_pain_points',
    ],
    requiresVideo: true,
    uploadGuidance:
      'Upload feature-specific demo videos, use case walkthroughs, and detailed documentation. Organize by feature area so the agent can show the most relevant content based on visitor needs.',
  },
  {
    moduleId: 'pricing',
    name: 'Pricing & Objections',
    description:
      'Handle pricing questions, address common objections, and share social proof.',
    orderIndex: 5,
    objectiveIds: ['handle_objections', 'show_social_proof'],
    requiresVideo: false,
    uploadGuidance:
      "Upload pricing information, FAQ documents, case studies, testimonials, and ROI calculators. Include objection handling scripts and competitive comparisons you're comfortable sharing.",
  },
  {
    moduleId: 'cta',
    name: 'Call to Action',
    description:
      'Guide qualified prospects toward next steps: trial signup, sales call, or additional resources.',
    orderIndex: 6,
    objectiveIds: ['discuss_next_steps', 'capture_contact_info', 'complete_demo'],
    requiresVideo: false,
    uploadGuidance:
      'Upload information about next steps, trial details, onboarding process, and what to expect after the demo. Include any resources you want to share with qualified leads.',
  },
];

/**
 * Get module definition by ID
 */
export function getModuleDefinition(
  moduleId: ModuleId
): ModuleDefinition | undefined {
  return DEFAULT_PRODUCT_DEMO_MODULES.find((m) => m.moduleId === moduleId);
}

/**
 * Get next module in sequence based on order index
 */
export function getNextModule(
  currentModuleId: ModuleId
): ModuleDefinition | undefined {
  const current = DEFAULT_PRODUCT_DEMO_MODULES.find(
    (m) => m.moduleId === currentModuleId
  );
  if (!current) return undefined;
  return DEFAULT_PRODUCT_DEMO_MODULES.find(
    (m) => m.orderIndex === current.orderIndex + 1
  );
}

/**
 * Get previous module in sequence
 */
export function getPreviousModule(
  currentModuleId: ModuleId
): ModuleDefinition | undefined {
  const current = DEFAULT_PRODUCT_DEMO_MODULES.find(
    (m) => m.moduleId === currentModuleId
  );
  if (!current || current.orderIndex <= 1) return undefined;
  return DEFAULT_PRODUCT_DEMO_MODULES.find(
    (m) => m.orderIndex === current.orderIndex - 1
  );
}

/**
 * Get the module that contains a given objective
 */
export function getModuleForObjective(
  objectiveId: string
): ModuleDefinition | undefined {
  return DEFAULT_PRODUCT_DEMO_MODULES.find((m) =>
    m.objectiveIds.includes(objectiveId)
  );
}

/**
 * Get all objective IDs for a module
 */
export function getObjectivesForModule(moduleId: ModuleId): string[] {
  const module = getModuleDefinition(moduleId);
  return module?.objectiveIds || [];
}

/**
 * Check if all objectives in a module are completed
 */
export function isModuleComplete(
  moduleId: ModuleId,
  completedObjectives: string[]
): boolean {
  const moduleObjectives = getObjectivesForModule(moduleId);
  if (moduleObjectives.length === 0) return false;
  return moduleObjectives.every((obj) => completedObjectives.includes(obj));
}

/**
 * Get the first module in the sequence
 */
export function getFirstModule(): ModuleDefinition {
  return DEFAULT_PRODUCT_DEMO_MODULES[0];
}

/**
 * Get the last module in the sequence
 */
export function getLastModule(): ModuleDefinition {
  return DEFAULT_PRODUCT_DEMO_MODULES[DEFAULT_PRODUCT_DEMO_MODULES.length - 1];
}

/**
 * Get all module IDs in order
 */
export function getAllModuleIds(): ModuleId[] {
  return DEFAULT_PRODUCT_DEMO_MODULES.map((m) => m.moduleId);
}
