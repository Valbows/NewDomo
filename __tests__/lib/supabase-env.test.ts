describe('supabase client env guard', () => {
  const ENV_URL = 'NEXT_PUBLIC_SUPABASE_URL';
  const ENV_ANON = 'NEXT_PUBLIC_SUPABASE_ANON_KEY';

  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('handles missing or placeholder env vars appropriately', () => {
    // Clear environment variables first
    delete process.env[ENV_URL];
    delete process.env[ENV_ANON];
    delete process.env.NEXT_PUBLIC_E2E_TEST_MODE;
    
    // Set placeholder values
    process.env[ENV_URL] = 'YOUR_SUPABASE_URL';
    process.env[ENV_ANON] = 'YOUR_SUPABASE_KEY';
    process.env.NODE_ENV = 'test'; // Test environment

    // In test environment, the code should handle this gracefully
    expect(() => {
      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { supabase } = require('../..//src/lib/supabase');
        expect(supabase).toBeDefined();
      });
    }).not.toThrow();
  });
});
