// Minimal jest setup for DemoConfigurationPage test without problematic cleanup

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