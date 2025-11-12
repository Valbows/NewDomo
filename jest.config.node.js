// jest.config.node.js
require('dotenv').config({ path: '.env.development' });

module.exports = {
  displayName: 'node',
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/__tests__/integration/**/*.test.ts',
    '<rootDir>/__tests__/**/*.test.ts'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.node.js'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      { tsconfig: '<rootDir>/tsconfig.json' }
    ],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  watchPathIgnorePatterns: ['<rootDir>/.next/'],
  modulePathIgnorePatterns: ['<rootDir>/.next/'],
};
