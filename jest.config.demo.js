const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.demo.js'],
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/src/__tests__/DemoConfigurationPage.spec.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testTimeout: 10000,
};

module.exports = createJestConfig(customJestConfig);