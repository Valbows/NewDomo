describe('tavus-webhook route exports', () => {
  test('POST handler is exported and is a function', async () => {
    const mod = await import('../../src/app/api/tavus-webhook/route');
    expect(typeof mod.POST).toBe('function');
  });
});
