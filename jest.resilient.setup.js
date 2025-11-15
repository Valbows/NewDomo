// Additional setup for resilient testing
import '@testing-library/jest-dom';

// Global test utilities for more resilient testing
global.findByTextContent = (text) => {
  return (content, element) => {
    const hasText = (node) => node.textContent && node.textContent.toLowerCase().includes(text.toLowerCase());
    const nodeHasText = hasText(element);
    const childrenDontHaveText = Array.from(element?.children || []).every(child => !hasText(child));
    return nodeHasText && childrenDontHaveText;
  };
};

// Mock console methods to reduce noise in tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
       args[0].includes('Warning: An invalid form control') ||
       args[0].includes('Warning: Each child in a list should have a unique "key" prop'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('componentWillReceiveProps') ||
       args[0].includes('componentWillUpdate'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});