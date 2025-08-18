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

  test('throws when env vars are missing or placeholders', () => {
    process.env[ENV_URL] = 'YOUR_SUPABASE_URL';
    process.env[ENV_ANON] = 'YOUR_SUPABASE_KEY';

    expect(() => {
      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('../..//src/lib/supabase');
      });
    }).toThrow(/Supabase environment variables/);
  });
});
