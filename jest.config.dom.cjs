// jest.config.dom.js
const nextJest = require('next/jest')({
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  displayName: 'dom',
  moduleDirectories: ['node_modules', '<rootDir>/'],
  setupFiles: ['<rootDir>/jest.env.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testMatch: [
    '<rootDir>/__tests__/unit/**/*.test.tsx',
    '<rootDir>/__tests__/unit/**/*.spec.tsx',
    '<rootDir>/__tests__/integration/**/*.test.tsx',
    '<rootDir>/__tests__/integration/**/*.spec.tsx',
    '<rootDir>/src/**/*.test.tsx',
    '<rootDir>/src/**/*.spec.tsx'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    'until-async': '<rootDir>/src/mocks/__mocks__/until-async.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(msw|@mswjs|until-async|@open-draft)/)'
  ],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = nextJest(customJestConfig);