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

// MSW setup
const { server } = require('./src/mocks/server');

// Establish API mocking before all tests.
beforeAll(() => server.listen());

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests.
afterEach(() => server.resetHandlers());

// Clean up after the tests are finished.
afterAll(() => server.close());
