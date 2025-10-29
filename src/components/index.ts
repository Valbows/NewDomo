// Layout Components (Organisms)
export * from './layout';

// UI Components (Atoms & Molecules)
export * from './ui';

// Feature Components (Organisms & Templates)
export * from './features';

/**
 * Component Organization follows Atomic Design principles:
 * 
 * Atoms (Basic UI elements):
 * - Buttons, inputs, labels, icons
 * - Found in: src/components/ui/
 * 
 * Molecules (Simple combinations of atoms):
 * - Form groups, search bars, navigation items
 * - Found in: src/components/ui/
 * 
 * Organisms (Complex UI components):
 * - Headers, footers, forms, lists
 * - Found in: src/components/layout/ and src/components/features/
 * 
 * Templates (Page-level layouts):
 * - Dashboard layout, auth layout
 * - Found in: src/components/layout/
 * 
 * Pages (Specific instances of templates):
 * - Found in: src/app/
 */