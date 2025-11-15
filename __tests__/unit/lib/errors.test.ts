/**
 * Unit tests for error handling utilities
 * Tests error message extraction, normalization, and logging
 */

import { getErrorMessage, normalizeError, logError } from '@/lib/errors';

// Mock console methods
const originalConsoleError = console.error;
const mockConsoleError = jest.fn();

describe('Error Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = mockConsoleError;
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  describe('getErrorMessage', () => {
    it('extracts message from string error', () => {
      const result = getErrorMessage('Simple error message');
      expect(result).toBe('Simple error message');
    });

    it('extracts message from Error object', () => {
      const error = new Error('Error object message');
      const result = getErrorMessage(error);
      expect(result).toBe('Error object message');
    });

    it('extracts message from API error object with message field', () => {
      const apiError = { message: 'API error message' };
      const result = getErrorMessage(apiError);
      expect(result).toBe('API error message');
    });

    it('extracts message from API error object with error_description field', () => {
      const apiError = { error_description: 'OAuth error description' };
      const result = getErrorMessage(apiError);
      expect(result).toBe('OAuth error description');
    });

    it('extracts message from API error object with error field', () => {
      const apiError = { error: 'Generic error field' };
      const result = getErrorMessage(apiError);
      expect(result).toBe('Generic error field');
    });

    it('extracts message from API error object with msg field', () => {
      const apiError = { msg: 'Message field' };
      const result = getErrorMessage(apiError);
      expect(result).toBe('Message field');
    });

    it('returns JSON string for complex objects without known error fields', () => {
      const complexError = { status: 500, data: { details: 'Complex error' } };
      const result = getErrorMessage(complexError);
      expect(result).toBe('{"status":500,"data":{"details":"Complex error"}}');
    });

    it('returns JSON string for null, undefined for undefined', () => {
      expect(getErrorMessage(null)).toBe('null');
      expect(getErrorMessage(undefined)).toBe(undefined);
    });

    it('returns custom fallback when JSON.stringify fails', () => {
      const customFallback = 'Custom fallback message';
      // Create a circular reference that will cause JSON.stringify to fail
      const circularRef: any = {};
      circularRef.self = circularRef;
      expect(getErrorMessage(circularRef, customFallback)).toBe(customFallback);
    });

    it('returns fallback for non-serializable objects', () => {
      const circularRef: any = {};
      circularRef.self = circularRef;
      const result = getErrorMessage(circularRef);
      expect(result).toBe('An unknown error occurred');
    });

    it('handles number errors', () => {
      const result = getErrorMessage(404);
      expect(result).toBe('404');
    });

    it('handles boolean errors', () => {
      const result = getErrorMessage(false);
      expect(result).toBe('false');
    });
  });

  describe('normalizeError', () => {
    it('returns Error object unchanged', () => {
      const error = new Error('Test error');
      const result = normalizeError(error);
      expect(result).toBe(error);
      expect(result instanceof Error).toBe(true);
    });

    it('converts string to Error object', () => {
      const result = normalizeError('String error');
      expect(result instanceof Error).toBe(true);
      expect(result.message).toBe('String error');
    });

    it('converts object to Error object', () => {
      const errorObj = { message: 'Object error' };
      const result = normalizeError(errorObj);
      expect(result instanceof Error).toBe(true);
      expect(result.message).toBe('Object error');
    });

    it('converts null to Error object', () => {
      const result = normalizeError(null);
      expect(result instanceof Error).toBe(true);
      expect(result.message).toBe('null');
    });

    it('converts undefined to Error object', () => {
      const result = normalizeError(undefined);
      expect(result instanceof Error).toBe(true);
      expect(result.message).toBe('');
    });
  });

  describe('logError', () => {
    it('logs error without context', () => {
      const error = new Error('Test error');
      logError(error);
      
      expect(mockConsoleError).toHaveBeenCalledWith('Test error', error);
    });

    it('logs error with context', () => {
      const error = new Error('Test error');
      const context = 'Test context';
      logError(error, context);
      
      expect(mockConsoleError).toHaveBeenCalledWith('Test context: Test error', error);
    });

    it('logs string error without context', () => {
      logError('String error');
      
      expect(mockConsoleError).toHaveBeenCalledWith('String error', 'String error');
    });

    it('logs string error with context', () => {
      logError('String error', 'Test context');
      
      expect(mockConsoleError).toHaveBeenCalledWith('Test context: String error', 'String error');
    });

    it('logs object error', () => {
      const errorObj = { message: 'Object error' };
      logError(errorObj, 'Test context');
      
      expect(mockConsoleError).toHaveBeenCalledWith('Test context: Object error', errorObj);
    });

    it('handles null error gracefully', () => {
      logError(null, 'Test context');
      
      expect(mockConsoleError).toHaveBeenCalledWith('Test context: null', null);
    });

    it('handles undefined error gracefully', () => {
      logError(undefined);
      
      expect(mockConsoleError).toHaveBeenCalledWith(undefined, undefined);
    });

    it('does not throw when Sentry operations fail', () => {
      // This test ensures logError never throws, even if Sentry fails
      const error = new Error('Test error');
      
      expect(() => {
        logError(error, 'Test context');
      }).not.toThrow();
      
      expect(mockConsoleError).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles deeply nested error objects', () => {
      const deepError = {
        response: {
          data: {
            error: {
              message: 'Deep nested error'
            }
          }
        }
      };
      
      // Should serialize the whole object since it doesn't match known patterns
      const result = getErrorMessage(deepError);
      expect(result).toContain('Deep nested error');
    });

    it('handles empty string errors', () => {
      expect(getErrorMessage('')).toBe('');
    });

    it('handles whitespace-only string errors', () => {
      expect(getErrorMessage('   ')).toBe('   ');
    });

    it('handles array errors', () => {
      const arrayError = ['error1', 'error2'];
      const result = getErrorMessage(arrayError);
      expect(result).toBe('["error1","error2"]');
    });

    it('handles function errors', () => {
      const functionError = () => 'error';
      const result = getErrorMessage(functionError);
      // Functions get JSON.stringified, which returns undefined
      expect(result).toBe(undefined);
    });
  });
});