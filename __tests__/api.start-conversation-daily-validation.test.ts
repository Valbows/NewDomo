// __tests__/api.start-conversation-daily-validation.test.ts
/**
 * Tests for /api/start-conversation route focusing on Daily room validation
 * and preventing stale conversation URL issues
 */

// Mock Sentry wrapper to return the raw handler
jest.mock('@sentry/nextjs', () => ({
  wrapRouteHandlerWithSentry: (fn: any) => fn,
}));

describe('Start Conversation API - Daily Room Validation', () => {
  const demoId = 'demo-test-daily-validation';
  const userId = 'user-1';
  const personaId = 'persona-test-1';
  const replicaId = 'replica-test-1';

  const validConversationId = 'conv-valid-123';
  const validConversationUrl = 'https://tavus.daily.co/conv-valid-123';

  const staleConversationId = 'conv-stale-404';
  const staleConversationUrl = 'https://tavus.daily.co/conv-stale-404';

  const newConversationId = 'conv-new-456';
  const newConversationUrl = 'https://tavus.daily.co/conv-new-456';

  beforeEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();

    process.env.TAVUS_API_KEY = 'test_tavus_key';
    process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';
    process.env.TAVUS_REPLICA_ID = replicaId;
  });

  afterEach(() => {
    delete process.env.TAVUS_API_KEY;
    delete process.env.NEXT_PUBLIC_BASE_URL;
    delete process.env.TAVUS_REPLICA_ID;
  });

  test('should reuse existing conversation when Daily room exists (200)', async () => {
    // Mock database with existing valid conversation URL
    jest.doMock('@/utils/supabase/server', () => {
      return {
        createClient: jest.fn(() => ({
          auth: {
            getUser: jest.fn().mockResolvedValue({ data: { user: { id: userId } } }),
          },
          from: (table: string) => {
            if (table === 'demos') {
              return {
                select: () => ({
                  eq: () => ({
                    single: () =>
                      Promise.resolve({
                        data: {
                          user_id: userId,
                          tavus_persona_id: personaId,
                          tavus_conversation_id: validConversationId,
                          metadata: {
                            tavusShareableLink: validConversationUrl,
                          },
                        },
                        error: null,
                      }),
                  }),
                }),
              } as any;
            }
            throw new Error(`Unexpected table: ${table}`);
          },
        })),
      };
    });

    let gsCheckCalled = false;
    let tavusStatusCheckCalled = false;
    const fetchSpy = jest
      .spyOn(global, 'fetch' as any)
      .mockImplementation(async (...args: unknown[]) => {
        const [input, options] = args as [RequestInfo | URL, RequestInit?];
        const url = typeof input === 'string' ? input : (input as URL).toString();

        // Tavus conversation status check (GET request to check if conversation is active)
        if (url === `https://tavusapi.com/v2/conversations/${validConversationId}` && (!options || options.method === 'GET')) {
          tavusStatusCheckCalled = true;
          return new Response(
            JSON.stringify({ status: 'active', conversation_id: validConversationId }),
            { status: 200, headers: { 'content-type': 'application/json' } }
          ) as any;
        }

        // Daily room validation check
        if (url.startsWith('https://gs.daily.co/rooms/check/')) {
          gsCheckCalled = true;
          return new Response('', { status: 200 }) as any;
        }

        // Should NOT create a new conversation
        if (url.startsWith('https://tavusapi.com/v2/conversations')) {
          throw new Error('Should not create new conversation when existing room is valid');
        }

        throw new Error(`Unhandled fetch URL: ${url}`);
      });

    const { POST } = await import('../src/app/api/start-conversation/route');

    const req = new Request('http://localhost/api/start-conversation', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ demoId }),
    });

    const res = await (POST as any)(req);
    expect(res.status).toBe(200);
    const json = await res.json();

    // Should return existing conversation
    expect(json).toEqual({
      conversation_id: validConversationId,
      conversation_url: validConversationUrl,
    });

    // Should have checked Tavus conversation status (which is now the primary check)
    expect(tavusStatusCheckCalled).toBe(true);

    // Daily room check is skipped when Tavus reports conversation is active
    // expect(gsCheckCalled).toBe(true); // No longer needed with Tavus status check

    fetchSpy.mockRestore();
  });

  test('should create new conversation when cached Daily room is stale (404)', async () => {
    const updates: any[] = [];

    // Mock database with stale conversation URL
    jest.doMock('@/utils/supabase/server', () => {
      return {
        createClient: jest.fn(() => ({
          auth: {
            getUser: jest.fn().mockResolvedValue({ data: { user: { id: userId } } }),
          },
          from: (table: string) => {
            if (table === 'demos') {
              return {
                select: (cols: string) => {
                  if (cols.includes('user_id') && cols.includes('tavus_persona_id')) {
                    return {
                      eq: () => ({
                        single: () =>
                          Promise.resolve({
                            data: {
                              user_id: userId,
                              tavus_persona_id: personaId,
                              tavus_conversation_id: staleConversationId,
                              metadata: {
                                tavusShareableLink: staleConversationUrl,
                              },
                            },
                            error: null,
                          }),
                      }),
                    } as any;
                  }
                  if (cols.includes('metadata')) {
                    return {
                      eq: () => ({
                        single: () =>
                          Promise.resolve({
                            data: {
                              metadata: {
                                tavusShareableLink: staleConversationUrl,
                              },
                            },
                            error: null,
                          }),
                      }),
                    } as any;
                  }
                  throw new Error(`Unexpected select columns: ${cols}`);
                },
                update: (payload: any) => {
                  updates.push(payload);
                  return {
                    eq: () => Promise.resolve({ data: null, error: null }),
                  } as any;
                },
              } as any;
            }
            throw new Error(`Unexpected table: ${table}`);
          },
        })),
      };
    });

    let gsCheck404Count = 0;
    let conversationCreated = false;
    let tavusStatusCheckCalled = false;

    const fetchSpy = jest
      .spyOn(global, 'fetch' as any)
      .mockImplementation(async (...args: unknown[]) => {
        const [input, options] = args as [RequestInfo | URL, RequestInit?];
        const url = typeof input === 'string' ? input : (input as URL).toString();

        // Tavus conversation status check - return "ended" for stale conversation
        if (url === `https://tavusapi.com/v2/conversations/${staleConversationId}` && (!options || options.method === 'GET')) {
          tavusStatusCheckCalled = true;
          return new Response(
            JSON.stringify({ status: 'ended', conversation_id: staleConversationId }),
            { status: 200, headers: { 'content-type': 'application/json' } }
          ) as any;
        }

        // Daily room validation check - return 404 for stale room
        if (url.startsWith('https://gs.daily.co/rooms/check/')) {
          gsCheck404Count++;
          return new Response('Not Found', { status: 404 }) as any;
        }

        // Should create a new conversation (POST request)
        if (url === 'https://tavusapi.com/v2/conversations' && options?.method === 'POST') {
          conversationCreated = true;
          return new Response(
            JSON.stringify({
              conversation_id: newConversationId,
              conversation_url: newConversationUrl,
            }),
            {
              status: 201,
              headers: { 'content-type': 'application/json' },
            }
          ) as any;
        }

        throw new Error(`Unhandled fetch URL: ${url}`);
      });

    const { POST } = await import('../src/app/api/start-conversation/route');

    const req = new Request('http://localhost/api/start-conversation', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ demoId }),
    });

    const res = await (POST as any)(req);
    expect(res.status).toBeLessThan(400);
    const json = await res.json();

    // Should return NEW conversation
    expect(json).toEqual({
      conversation_id: newConversationId,
      conversation_url: newConversationUrl,
    });

    // Should have checked Tavus conversation status
    expect(tavusStatusCheckCalled).toBe(true);

    // Should have created new conversation
    expect(conversationCreated).toBe(true);

    // Should have updated database with new conversation
    const merged = updates.reduce((acc, p) => Object.assign(acc, p), {} as any);
    expect(merged.tavus_conversation_id).toBe(newConversationId);
    expect(merged.metadata?.tavusShareableLink).toBe(newConversationUrl);

    fetchSpy.mockRestore();
  });

  test('should create new conversation when forceNew=true even if existing room is valid', async () => {
    const updates: any[] = [];

    // Mock database with valid conversation URL
    jest.doMock('@/utils/supabase/server', () => {
      return {
        createClient: jest.fn(() => ({
          auth: {
            getUser: jest.fn().mockResolvedValue({ data: { user: { id: userId } } }),
          },
          from: (table: string) => {
            if (table === 'demos') {
              return {
                select: (cols: string) => {
                  if (cols.includes('user_id') && cols.includes('tavus_persona_id')) {
                    return {
                      eq: () => ({
                        single: () =>
                          Promise.resolve({
                            data: {
                              user_id: userId,
                              tavus_persona_id: personaId,
                              tavus_conversation_id: validConversationId,
                              metadata: {
                                tavusShareableLink: validConversationUrl,
                              },
                            },
                            error: null,
                          }),
                      }),
                    } as any;
                  }
                  if (cols.includes('metadata')) {
                    return {
                      eq: () => ({
                        single: () =>
                          Promise.resolve({
                            data: {
                              metadata: {
                                tavusShareableLink: validConversationUrl,
                              },
                            },
                            error: null,
                          }),
                      }),
                    } as any;
                  }
                  throw new Error(`Unexpected select columns: ${cols}`);
                },
                update: (payload: any) => {
                  updates.push(payload);
                  return {
                    eq: () => Promise.resolve({ data: null, error: null }),
                  } as any;
                },
              } as any;
            }
            throw new Error(`Unexpected table: ${table}`);
          },
        })),
      };
    });

    let conversationCreated = false;

    const fetchSpy = jest
      .spyOn(global, 'fetch' as any)
      .mockImplementation(async (...args: unknown[]) => {
        const [input] = args as [RequestInfo | URL, RequestInit?];
        const url = typeof input === 'string' ? input : (input as URL).toString();

        // Should create a new conversation even though existing is valid
        if (url.startsWith('https://tavusapi.com/v2/conversations')) {
          conversationCreated = true;
          return new Response(
            JSON.stringify({
              conversation_id: newConversationId,
              conversation_url: newConversationUrl,
            }),
            {
              status: 201,
              headers: { 'content-type': 'application/json' },
            }
          ) as any;
        }

        throw new Error(`Unhandled fetch URL: ${url}`);
      });

    const { POST } = await import('../src/app/api/start-conversation/route');

    const req = new Request('http://localhost/api/start-conversation', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ demoId, forceNew: true }),
    });

    const res = await (POST as any)(req);
    expect(res.status).toBeLessThan(400);
    const json = await res.json();

    // Should return NEW conversation
    expect(json).toEqual({
      conversation_id: newConversationId,
      conversation_url: newConversationUrl,
    });

    // Should have created new conversation
    expect(conversationCreated).toBe(true);

    fetchSpy.mockRestore();
  });

  test('should create new conversation when no cached conversation exists', async () => {
    const updates: any[] = [];

    // Mock database with NO existing conversation
    jest.doMock('@/utils/supabase/server', () => {
      return {
        createClient: jest.fn(() => ({
          auth: {
            getUser: jest.fn().mockResolvedValue({ data: { user: { id: userId } } }),
          },
          from: (table: string) => {
            if (table === 'demos') {
              return {
                select: (cols: string) => {
                  if (cols.includes('user_id') && cols.includes('tavus_persona_id')) {
                    return {
                      eq: () => ({
                        single: () =>
                          Promise.resolve({
                            data: {
                              user_id: userId,
                              tavus_persona_id: personaId,
                              tavus_conversation_id: null,
                              metadata: {},
                            },
                            error: null,
                          }),
                      }),
                    } as any;
                  }
                  if (cols.includes('metadata')) {
                    return {
                      eq: () => ({
                        single: () =>
                          Promise.resolve({
                            data: { metadata: {} },
                            error: null,
                          }),
                      }),
                    } as any;
                  }
                  throw new Error(`Unexpected select columns: ${cols}`);
                },
                update: (payload: any) => {
                  updates.push(payload);
                  return {
                    eq: () => Promise.resolve({ data: null, error: null }),
                  } as any;
                },
              } as any;
            }
            throw new Error(`Unexpected table: ${table}`);
          },
        })),
      };
    });

    let conversationCreated = false;

    const fetchSpy = jest
      .spyOn(global, 'fetch' as any)
      .mockImplementation(async (...args: unknown[]) => {
        const [input] = args as [RequestInfo | URL, RequestInit?];
        const url = typeof input === 'string' ? input : (input as URL).toString();

        // Should create a new conversation
        if (url.startsWith('https://tavusapi.com/v2/conversations')) {
          conversationCreated = true;
          return new Response(
            JSON.stringify({
              conversation_id: newConversationId,
              conversation_url: newConversationUrl,
            }),
            {
              status: 201,
              headers: { 'content-type': 'application/json' },
            }
          ) as any;
        }

        throw new Error(`Unhandled fetch URL: ${url}`);
      });

    const { POST } = await import('../src/app/api/start-conversation/route');

    const req = new Request('http://localhost/api/start-conversation', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ demoId }),
    });

    const res = await (POST as any)(req);
    expect(res.status).toBeLessThan(400);
    const json = await res.json();

    // Should return new conversation
    expect(json).toEqual({
      conversation_id: newConversationId,
      conversation_url: newConversationUrl,
    });

    // Should have created new conversation
    expect(conversationCreated).toBe(true);

    // Should have updated database
    const merged = updates.reduce((acc, p) => Object.assign(acc, p), {} as any);
    expect(merged.tavus_conversation_id).toBe(newConversationId);
    expect(merged.metadata?.tavusShareableLink).toBe(newConversationUrl);

    fetchSpy.mockRestore();
  });

  test('should handle non-Daily URLs gracefully', async () => {
    const nonDailyUrl = 'https://example.com/not-a-daily-room';

    // Mock database with non-Daily URL
    jest.doMock('@/utils/supabase/server', () => {
      return {
        createClient: jest.fn(() => ({
          auth: {
            getUser: jest.fn().mockResolvedValue({ data: { user: { id: userId } } }),
          },
          from: (table: string) => {
            if (table === 'demos') {
              return {
                select: (cols: string) => {
                  if (cols.includes('user_id') && cols.includes('tavus_persona_id')) {
                    return {
                      eq: () => ({
                        single: () =>
                          Promise.resolve({
                            data: {
                              user_id: userId,
                              tavus_persona_id: personaId,
                              metadata: {
                                tavusShareableLink: nonDailyUrl,
                              },
                            },
                            error: null,
                          }),
                      }),
                    } as any;
                  }
                  if (cols.includes('metadata')) {
                    return {
                      eq: () => ({
                        single: () =>
                          Promise.resolve({
                            data: {
                              metadata: {
                                tavusShareableLink: nonDailyUrl,
                              },
                            },
                            error: null,
                          }),
                      }),
                    } as any;
                  }
                  throw new Error(`Unexpected select columns: ${cols}`);
                },
                update: (payload: any) => ({
                  eq: () => Promise.resolve({ data: null, error: null }),
                }) as any,
              } as any;
            }
            throw new Error(`Unexpected table: ${table}`);
          },
        })),
      };
    });

    let conversationCreated = false;

    const fetchSpy = jest
      .spyOn(global, 'fetch' as any)
      .mockImplementation(async (...args: unknown[]) => {
        const [input] = args as [RequestInfo | URL, RequestInit?];
        const url = typeof input === 'string' ? input : (input as URL).toString();

        // Should NOT check gs.daily.co for non-Daily URLs
        if (url.startsWith('https://gs.daily.co/')) {
          throw new Error('Should not check gs.daily.co for non-Daily URLs');
        }

        // Should create a new conversation
        if (url.startsWith('https://tavusapi.com/v2/conversations')) {
          conversationCreated = true;
          return new Response(
            JSON.stringify({
              conversation_id: newConversationId,
              conversation_url: newConversationUrl,
            }),
            {
              status: 201,
              headers: { 'content-type': 'application/json' },
            }
          ) as any;
        }

        throw new Error(`Unhandled fetch URL: ${url}`);
      });

    const { POST } = await import('../src/app/api/start-conversation/route');

    const req = new Request('http://localhost/api/start-conversation', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ demoId }),
    });

    const res = await (POST as any)(req);
    expect(res.status).toBeLessThan(400);

    // Should have created new conversation
    expect(conversationCreated).toBe(true);

    fetchSpy.mockRestore();
  });
});
