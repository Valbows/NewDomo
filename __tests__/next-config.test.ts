import config from '../next.config.js';

describe('next.config.js security headers', () => {
  test('includes security headers for embed routes', async () => {
    const headersList = await (config as any).headers();
    expect(Array.isArray(headersList)).toBe(true);

    // Find embed route headers
    const embedRoute = headersList.find((h: any) => h.source === '/embed/:path*');
    expect(embedRoute).toBeTruthy();

    const embedKeys = embedRoute.headers.map((h: any) => h.key);
    expect(embedKeys).toContain('X-Content-Type-Options');
    expect(embedKeys).toContain('Referrer-Policy');
    expect(embedKeys).toContain('X-Frame-Options');
    expect(embedKeys).toContain('Permissions-Policy');
    expect(embedKeys).toContain('Content-Security-Policy');

    // Embed routes should allow framing
    const xFrameOptions = embedRoute.headers.find((h: any) => h.key === 'X-Frame-Options');
    expect(xFrameOptions.value).toBe('ALLOWALL');
  });

  test('includes security headers for non-embed routes', async () => {
    const headersList = await (config as any).headers();
    expect(Array.isArray(headersList)).toBe(true);

    // Find non-embed route headers (negative lookahead for embed)
    const nonEmbedRoute = headersList.find((h: any) => h.source === '/((?!embed).*)');
    expect(nonEmbedRoute).toBeTruthy();

    const keys = nonEmbedRoute.headers.map((h: any) => h.key);
    expect(keys).toContain('X-Content-Type-Options');
    expect(keys).toContain('Referrer-Policy');
    expect(keys).toContain('X-Frame-Options');
    expect(keys).toContain('Permissions-Policy');

    // Non-embed routes should deny framing
    const xFrameOptions = nonEmbedRoute.headers.find((h: any) => h.key === 'X-Frame-Options');
    expect(xFrameOptions.value).toBe('DENY');
  });
});
