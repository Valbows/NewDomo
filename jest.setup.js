// jest.setup.js

// Polyfill for fetch, Response, Request, Headers
require('whatwg-fetch');

// Polyfills for TextEncoder and other browser APIs not present in JSDOM
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const { TransformStream } = require('stream/web');
global.TransformStream = TransformStream;

// MSW requires a BroadcastChannel implementation. We can mock a basic one.
class MockBroadcastChannel {
  constructor(name) {}
  postMessage(message) {}
  close() {}
  addEventListener(type, listener) {}
  removeEventListener(type, listener) {}
  dispatchEvent(event) {}
}
global.BroadcastChannel = MockBroadcastChannel;

// Extends Jest with custom matchers
require('@testing-library/jest-dom');

// E2E Testing with Development Supabase Database
// Import test database utilities
const { setupTestData, cleanupTestData } = require('./__tests__/utils/test-db.ts');

// Global test setup and teardown
beforeAll(async () => {
  // Set up test data before all tests (only if needed)
  try {
    console.log('🚀 Using development database for E2E tests');
    // Optionally set up test data - commented out to avoid interfering with dev data
    // await setupTestData();
  } catch (error) {
    console.error('❌ Failed to initialize test database:', error);
  }
});

afterAll(async () => {
  // Clean up test data after all tests (only test-specific data)
  try {
    await cleanupTestData();
    console.log('🧹 Test data cleaned up');
  } catch (error) {
    console.warn('⚠️ Failed to clean up test database:', error);
  }
});

// MSW setup
// Temporarily disabled due to ES modules compatibility issues
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
