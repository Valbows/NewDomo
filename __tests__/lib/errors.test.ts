import { getErrorMessage, normalizeError, logError } from '@/lib/errors';

// Mock Sentry so logError's production path is safe and observable
jest.mock('@sentry/nextjs', () => {
  return {
    withScope: (cb: (scope: any) => void) => {
      const scope = {
        setContext: jest.fn(),
        setLevel: jest.fn(),
        setTag: jest.fn(),
      };
      cb(scope);
    },
    captureException: jest.fn(),
  };
});

const { captureException } = jest.requireMock('@sentry/nextjs');

describe('error utilities', () => {
  describe('getErrorMessage', () => {
    it('returns the string when input is a string', () => {
      expect(getErrorMessage('oops')).toBe('oops');
    });

    it('returns message from Error instance', () => {
      expect(getErrorMessage(new Error('boom'))).toBe('boom');
    });

    it('returns message-like fields from plain object', () => {
      expect(getErrorMessage({ message: 'msg' })).toBe('msg');
      expect(getErrorMessage({ error_description: 'bad' })).toBe('bad');
      expect(getErrorMessage({ error: 'err' })).toBe('err');
      expect(getErrorMessage({ msg: 'note' })).toBe('note');
    });

    it('JSON stringifies unknown objects when possible', () => {
      expect(getErrorMessage({ a: 1, b: 2 })).toBe(JSON.stringify({ a: 1, b: 2 }));
    });

    it('falls back when JSON.stringify throws (circular)', () => {
      const circular: any = {};
      circular.self = circular;
      expect(getErrorMessage(circular, 'fallback')).toBe('fallback');
    });
  });

  describe('normalizeError', () => {
    it('returns the same Error when given an Error', () => {
      const err = new Error('x');
      expect(normalizeError(err)).toBe(err);
    });

    it('wraps non-Error inputs into Error with a message', () => {
      const err = normalizeError({ message: 'wrapped' });
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe('wrapped');
    });
  });

  describe('logError', () => {
    const originalEnv = process.env.NODE_ENV;
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined as any);
      (captureException as jest.Mock).mockClear();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });

    it('logs to console with context without throwing', () => {
      expect(() => logError(new Error('fail'), 'CTX')).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();
      const firstCallArgs = consoleSpy.mock.calls[0];
      expect(String(firstCallArgs[0])).toContain('CTX: fail');
    });

    it('logs to console without context', () => {
      expect(() => logError(new Error('noctx'))).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();
      const firstCallArgs = consoleSpy.mock.calls[0];
      expect(String(firstCallArgs[0])).toContain('noctx');
    });

    it('forwards to Sentry in production without throwing', () => {
      process.env.NODE_ENV = 'production';
      expect(() => logError(new Error('prod'))).not.toThrow();
      expect(captureException).toHaveBeenCalled();
    });
  });
});
