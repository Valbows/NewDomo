import config from '../../next.config.cjs';

describe('next.config.js security headers', () => {
  test('includes baseline security headers on all routes', async () => {
    const headersList = await (config as any).headers();
    expect(Array.isArray(headersList)).toBe(true);
    const allRoute = headersList.find((h: any) => h.source === '/(.*)');
    expect(allRoute).toBeTruthy();
    const keys = allRoute.headers.map((h: any) => h.key);

    expect(keys).toContain('X-Content-Type-Options');
    expect(keys).toContain('Referrer-Policy');
    expect(keys).toContain('X-Frame-Options');
    expect(keys).toContain('Permissions-Policy');
  });
});