// jest.config.node.js
module.exports = {
  displayName: 'node',
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/__tests__/**/*.test.ts',
    '<rootDir>/__tests__/unit/**/*.test.ts',
    '<rootDir>/__tests__/integration/**/*.test.ts',
    '<rootDir>/__tests__/lib/**/*.test.ts',
    '<rootDir>/src/**/*.test.ts'
  ],
  setupFiles: ['<rootDir>/jest.env.js'],
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
