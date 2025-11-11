// jest.setup.node.js

// MSW setup for Node environment tests
// Temporarily disabled due to ES modules compatibility issues
// TODO: Fix MSW ES modules configuration
try {
  const { server } = require('./src/mocks/server');
  
  // Establish API mocking before all tests.
  beforeAll(() => server.listen());
  
  // Reset any request handlers that we may add during the tests,
  // so they don't affect other tests.
  afterEach(() => server.resetHandlers());
  
  // Clean up after the tests are finished.
  afterAll(() => server.close());
} catch (error) {
  console.warn('MSW setup failed, running tests without API mocking:', error.message);
}
