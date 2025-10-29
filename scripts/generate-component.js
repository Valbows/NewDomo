#!/usr/bin/env node

/**
 * Component Generator Script
 * 
 * Generates new React components following the atomic design and co-location patterns.
 * 
 * Usage:
 *   node scripts/generate-component.js ComponentName --type=atom
 *   node scripts/generate-component.js ComponentName --type=molecule
 *   node scripts/generate-component.js ComponentName --type=organism --feature=demos
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const componentName = args[0];

if (!componentName) {
  console.error('❌ Component name is required');
  console.log('Usage: node scripts/generate-component.js ComponentName --type=atom');
  process.exit(1);
}

// Parse options
const options = {};
args.slice(1).forEach(arg => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.substring(2).split('=');
    options[key] = value || true;
  }
});

const componentType = options.type || 'atom';
const featureName = options.feature;

// Validate component type
const validTypes = ['atom', 'molecule', 'organism', 'template'];
if (!validTypes.includes(componentType)) {
  console.error(`❌ Invalid component type: ${componentType}`);
  console.log(`Valid types: ${validTypes.join(', ')}`);
  process.exit(1);
}

// Determine target directory
let targetDir;
switch (componentType) {
  case 'atom':
  case 'molecule':
    targetDir = 'src/components/ui';
    break;
  case 'template':
    targetDir = 'src/components/layout';
    break;
  case 'organism':
    if (featureName) {
      targetDir = `src/components/features/${featureName}`;
    } else {
      targetDir = 'src/components/layout';
    }
    break;
}

// Create component directory
const componentDir = path.join(targetDir, componentName);
if (fs.existsSync(componentDir)) {
  console.error(`❌ Component ${componentName} already exists in ${componentDir}`);
  process.exit(1);
}

fs.mkdirSync(componentDir, { recursive: true });

// Generate component file
const componentTemplate = `import React from 'react';
import styles from './${componentName}.module.css';
${componentType === 'organism' && featureName ? `import { ${componentName}Props } from './types';` : ''}

${componentType === 'organism' && featureName ? '' : `interface ${componentName}Props {
  className?: string;
  children?: React.ReactNode;
}`}

export function ${componentName}({ className, children, ...props }: ${componentName}Props) {
  return (
    <div className={\`\${styles.container} \${className || ''}\`} {...props}>
      {children || <span>TODO: Implement ${componentName}</span>}
    </div>
  );
}

export default ${componentName};
`;

fs.writeFileSync(path.join(componentDir, 'index.tsx'), componentTemplate);

// Generate CSS module
const cssTemplate = `/* Styles for ${componentName} component */

.container {
  /* TODO: Add component styles */
}

/* Component variants */
.primary {
  /* Primary variant styles */
}

.secondary {
  /* Secondary variant styles */
}

/* Component sizes */
.small {
  /* Small size styles */
}

.medium {
  /* Medium size styles */
}

.large {
  /* Large size styles */
}

/* Component states */
.disabled {
  /* Disabled state styles */
}

.loading {
  /* Loading state styles */
}

.error {
  /* Error state styles */
}
`;

fs.writeFileSync(path.join(componentDir, `${componentName}.module.css`), cssTemplate);

// Generate test file
const testTemplate = `/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ${componentName} } from './index';

describe('${componentName}', () => {
  it('renders without crashing', () => {
    render(<${componentName} />);
    expect(screen.getByText(/TODO: Implement ${componentName}/)).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<${componentName} className="custom-class" />);
    const component = screen.getByText(/TODO: Implement ${componentName}/).parentElement;
    expect(component).toHaveClass('custom-class');
  });

  it('renders children when provided', () => {
    render(<${componentName}>Test Content</${componentName}>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  // TODO: Add more specific tests for ${componentName} functionality
});
`;

fs.writeFileSync(path.join(componentDir, `${componentName}.test.tsx`), testTemplate);

// Generate types file for organisms
if (componentType === 'organism' && featureName) {
  const typesTemplate = `/**
 * Type definitions for ${componentName} component
 */

export interface ${componentName}Props {
  className?: string;
  children?: React.ReactNode;
  // TODO: Add specific props for ${componentName}
}

// TODO: Add additional types specific to ${componentName}
export interface ${componentName}State {
  // Component state interface
}

export interface ${componentName}Config {
  // Component configuration interface
}
`;

  fs.writeFileSync(path.join(componentDir, 'types.ts'), typesTemplate);

  // Generate utils file for organisms
  const utilsTemplate = `/**
 * Utility functions for ${componentName} component
 */

/**
 * Validates ${componentName} props
 */
export function validate${componentName}Props(props: any): string[] {
  const errors: string[] = [];
  
  // TODO: Add validation logic for ${componentName}
  
  return errors;
}

/**
 * Formats data for ${componentName} display
 */
export function format${componentName}Data(data: any): any {
  // TODO: Add formatting logic for ${componentName}
  return data;
}

// TODO: Add more utility functions specific to ${componentName}
`;

  fs.writeFileSync(path.join(componentDir, 'utils.ts'), utilsTemplate);

  // Generate constants file for organisms
  const constantsTemplate = `/**
 * Constants for ${componentName} component
 */

export const ${componentName.toUpperCase()}_CONFIG = {
  // TODO: Add configuration constants
} as const;

export const ${componentName.toUpperCase()}_MESSAGES = {
  // TODO: Add message constants
} as const;

export const ${componentName.toUpperCase()}_DEFAULTS = {
  // TODO: Add default values
} as const;
`;

  fs.writeFileSync(path.join(componentDir, 'constants.ts'), constantsTemplate);
}

// Update index.ts in target directory
const indexPath = path.join(targetDir, 'index.ts');
let indexContent = '';

if (fs.existsSync(indexPath)) {
  indexContent = fs.readFileSync(indexPath, 'utf8');
}

const exportLine = `export { default as ${componentName} } from './${componentName}';`;
if (!indexContent.includes(exportLine)) {
  indexContent += `\n${exportLine}`;
  fs.writeFileSync(indexPath, indexContent);
}

console.log(`✅ Generated ${componentType} component: ${componentName}`);
console.log(`📁 Location: ${componentDir}`);
console.log(`📝 Files created:`);
console.log(`   - index.tsx`);
console.log(`   - ${componentName}.module.css`);
console.log(`   - ${componentName}.test.tsx`);

if (componentType === 'organism' && featureName) {
  console.log(`   - types.ts`);
  console.log(`   - utils.ts`);
  console.log(`   - constants.ts`);
}

console.log(`\n🔄 Updated: ${indexPath}`);
console.log(`\n📚 Next steps:`);
console.log(`   1. Implement component logic in index.tsx`);
console.log(`   2. Add component-specific styles in ${componentName}.module.css`);
console.log(`   3. Write comprehensive tests in ${componentName}.test.tsx`);

if (componentType === 'organism' && featureName) {
  console.log(`   4. Define types in types.ts`);
  console.log(`   5. Add utility functions in utils.ts`);
  console.log(`   6. Configure constants in constants.ts`);
}

console.log(`   7. Update component documentation`);
console.log(`   8. Add to Storybook (if applicable)`);