// __tests__/api.create-agent-and-start-conversation.test.ts

// Mock Sentry wrapper to return the raw handler
jest.mock('@sentry/nextjs', () => ({
  wrapRouteHandlerWithSentry: (fn: any) => fn,
}));

describe('Create Agent and Start Conversation APIs', () => {
  const demoId = 'demo-123';
  const userId = 'user-1';

  const personaId = 'persona-test-1';
  const conversationId = 'conv-test-1';
  const conversationUrl = 'https://app.tavus.io/conversation/conv-test-1';

  beforeEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();

    process.env.TAVUS_API_KEY = 'test_tavus_key';
    process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';
    delete process.env.TAVUS_REPLICA_ID; // default unset
  });

  afterEach(() => {
    delete process.env.TAVUS_API_KEY;
    delete process.env.NEXT_PUBLIC_BASE_URL;
    delete process.env.TAVUS_REPLICA_ID;
  });

  test('create-agent writes tavus_persona_id to demos table', async () => {
    const demoMetadata = { objectives: ['Increase conversions', 'Answer product questions'] };

    const updates: any[] = [];

    // Mock Supabase server client
    jest.doMock('@/lib/utils/supabase', () => {
      return {
        createClient: jest.fn(() => ({
          auth: {
            getUser: jest.fn().mockResolvedValue({ data: { user: { id: userId } } }),
          },
          from: (table: string) => {
            if (table === 'demos') {
              return {
                select: (cols: string) => ({
                  eq: (col: string, val: string) => ({
                    single: () =>
                      Promise.resolve({
                        data: { id: demoId, user_id: userId, metadata: demoMetadata },
                        error: null,
                      }),
                  }),
                }),
                update: (payload: any) => {
                  updates.push(payload);
                  return {
                    eq: (_col: string, _val: string) => Promise.resolve({ data: null, error: null }),
                  } as any;
                },
              } as any;
            }
            if (table === 'knowledge_chunks') {
              return {
                select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }),
              } as any;
            }
            if (table === 'demo_videos') {
              return {
                select: () => ({ eq: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }) }),
              } as any;
            }
            throw new Error(`Unexpected table: ${table}`);
          },
        })),
      };
    });

    // Mock Tavus personas API
    const fetchSpy = jest
      .spyOn(global, 'fetch' as any)
      .mockImplementation(async (...args: unknown[]) => {
        const [input, init] = args as [RequestInfo | URL, RequestInit?];
        const url = typeof input === 'string' ? input : (input as URL).toString();
        if (url.startsWith('https://tavusapi.com/v2/personas')) {
          return new Response(JSON.stringify({ persona_id: personaId }), {
            status: 201,
            headers: { 'content-type': 'application/json' },
          }) as any;
        }
        throw new Error(`Unhandled fetch URL: ${url}`);
      });

    const { POST: CreateAgentPOST } = await import('../../src/app/api/demos/agents/create/route');

    const req = new Request('http://localhost/api/demos/agents/create', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ demoId, agentName: 'Test Agent' }),
    });

    const res = await (CreateAgentPOST as any)(req);
    expect(res.status).toBeLessThan(400);
    const json = await res.json();
    expect(json).toHaveProperty('personaId', personaId);

    // Verify DB update
    expect(updates.some((p) => p && p.tavus_persona_id === personaId)).toBe(true);

    fetchSpy.mockRestore();
  });

  test('start-conversation returns 400 if tavus_persona_id missing', async () => {
    // Mock Supabase server client for missing persona
    jest.doMock('@/lib/utils/supabase', () => {
      return {
        createClient: jest.fn(() => ({
          auth: {
            getUser: jest.fn().mockResolvedValue({ data: { user: { id: userId } } }),
          },
          from: (table: string) => {
            if (table === 'demos') {
              return {
                select: (cols: string) => ({
                  eq: (col: string, val: string) => ({
                    single: () =>
                      Promise.resolve({
                        data: { user_id: userId, tavus_persona_id: null },
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

    const { POST: StartConversationPOST } = await import('../../src/app/api/start-conversation/route');

    const req = new Request('http://localhost/api/start-conversation', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ demoId }),
    });

    const res = await (StartConversationPOST as any)(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json).toEqual({ error: 'This demo does not have a configured agent persona.' });
  });

  test('start-conversation updates tavus_conversation_id and metadata.tavusShareableLink', async () => {
    const updates: any[] = [];

    // Mock Supabase server client for successful path
    jest.doMock('@/lib/utils/supabase', () => {
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
                      eq: () => ({ single: () => Promise.resolve({ data: { user_id: userId, tavus_persona_id: personaId }, error: null }) }),
                    } as any;
                  }
                  if (cols.includes('metadata')) {
                    return {
                      eq: () => ({ single: () => Promise.resolve({ data: { metadata: { foo: 'bar' } }, error: null }) }),
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

    // Mock Tavus APIs: persona GET (to supply default_replica_id) and conversation POST
    const fetchSpy = jest
      .spyOn(global, 'fetch' as any)
      .mockImplementation(async (...args: unknown[]) => {
        const [input, _init] = args as [RequestInfo | URL, RequestInit?];
        const url = typeof input === 'string' ? input : (input as URL).toString();
        if (url.startsWith('https://tavusapi.com/v2/personas/')) {
          return new Response(JSON.stringify({ default_replica_id: 'replica-test-1' }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }) as any;
        }
        if (url.startsWith('https://tavusapi.com/v2/conversations')) {
          return new Response(JSON.stringify({
            conversation_id: conversationId,
            conversation_url: conversationUrl,
          }), {
            status: 201,
            headers: { 'content-type': 'application/json' },
          }) as any;
        }
        throw new Error(`Unhandled fetch URL: ${url}`);
      });

    const { POST: StartConversationPOST } = await import('../../src/app/api/start-conversation/route');

    const req = new Request('http://localhost/api/start-conversation', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ demoId }),
    });

    const res = await (StartConversationPOST as any)(req);
    expect(res.status).toBeLessThan(400);
    const json = await res.json();
    expect(json).toHaveProperty('conversation_id', conversationId);
    expect(json).toHaveProperty('conversation_url', conversationUrl);

    // Verify DB update payload contains both fields
    const merged = updates.reduce((acc, p) => Object.assign(acc, p), {} as any);
    expect(merged.tavus_conversation_id).toBe(conversationId);
    expect(merged.metadata).toBeDefined();
    expect(merged.metadata.tavusShareableLink).toBe(conversationUrl);

    fetchSpy.mockRestore();
  });

  test('create-agent includes no tools when TAVUS_TOOLS_ENABLED is false or unset', async () => {
    // Ensure env is disabled
    delete process.env.TAVUS_TOOLS_ENABLED;
    delete process.env.TAVUS_MINIMAL_TOOLS;

    // Mock Supabase server client
    jest.doMock('@/lib/utils/supabase', () => {
      return {
        createClient: jest.fn(() => ({
          auth: {
            getUser: jest.fn().mockResolvedValue({ data: { user: { id: userId } } }),
          },
          from: (table: string) => {
            if (table === 'demos') {
              return {
                select: () => ({
                  eq: () => ({ single: () => Promise.resolve({ data: { id: demoId, user_id: userId, metadata: {} }, error: null }) })
                }),
                update: (_payload: any) => ({
                  eq: (_col: string, _val: string) => Promise.resolve({ data: null, error: null })
                }) as any
              } as any;
            }
            if (table === 'knowledge_chunks') {
              return { select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }) } as any;
            }
            if (table === 'demo_videos') {
              return { select: () => ({ eq: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }) }) } as any;
            }
            throw new Error(`Unexpected table: ${table}`);
          },
        })),
      };
    });

    let personaPayload: any = null;
    const fetchSpy = jest
      .spyOn(global, 'fetch' as any)
      .mockImplementation(async (...args: unknown[]) => {
        const [input, init] = args as [RequestInfo | URL, RequestInit?];
        const url = typeof input === 'string' ? input : (input as URL).toString();
        if (url.startsWith('https://tavusapi.com/v2/personas')) {
          try {
            personaPayload = JSON.parse(String(init!.body));
          } catch (e) {
            throw new Error('Failed to parse persona request body');
          }
          return new Response(JSON.stringify({ persona_id: personaId }), {
            status: 201,
            headers: { 'content-type': 'application/json' },
          }) as any;
        }
        throw new Error(`Unhandled fetch URL: ${url}`);
      });

    const { POST: CreateAgentPOST } = await import('../../src/app/api/demos/agents/create/route');

    const req = new Request('http://localhost/api/demos/agents/create', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ demoId, agentName: 'Test Agent' }),
    });

    const res = await (CreateAgentPOST as any)(req);
    expect(res.status).toBeLessThan(400);
    expect(personaPayload).toBeTruthy();
    expect(Array.isArray(personaPayload.layers?.llm?.tools)).toBe(true);
    expect(personaPayload.layers.llm.tools).toHaveLength(0);

    fetchSpy.mockRestore();
  });

  test('create-agent includes minimal fetch_video tool when TAVUS_TOOLS_ENABLED=true and TAVUS_MINIMAL_TOOLS=true', async () => {
    process.env.TAVUS_TOOLS_ENABLED = 'true';
    process.env.TAVUS_MINIMAL_TOOLS = 'true';

    const demoVideoTitles = ['Fourth Video', 'Welcome'];

    // Mock Supabase server client with available videos
    jest.doMock('@/lib/utils/supabase', () => {
      return {
        createClient: jest.fn(() => ({
          auth: {
            getUser: jest.fn().mockResolvedValue({ data: { user: { id: userId } } }),
          },
          from: (table: string) => {
            if (table === 'demos') {
              return {
                select: () => ({
                  eq: () => ({ single: () => Promise.resolve({ data: { id: demoId, user_id: userId, metadata: {} }, error: null }) })
                }),
                update: (_payload: any) => ({
                  eq: (_col: string, _val: string) => Promise.resolve({ data: null, error: null })
                }) as any
              } as any;
            }
            if (table === 'knowledge_chunks') {
              return { select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }) } as any;
            }
            if (table === 'demo_videos') {
              return {
                select: () => ({
                  eq: () => ({
                    eq: () => Promise.resolve({
                      data: demoVideoTitles.map((t) => ({ title: t, transcript: `Transcript for ${t}` })),
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

    let personaPayload: any = null;
    const fetchSpy = jest
      .spyOn(global, 'fetch' as any)
      .mockImplementation(async (...args: unknown[]) => {
        const [input, init] = args as [RequestInfo | URL, RequestInit?];
        const url = typeof input === 'string' ? input : (input as URL).toString();
        if (url.startsWith('https://tavusapi.com/v2/personas')) {
          personaPayload = JSON.parse(String(init!.body));
          return new Response(JSON.stringify({ persona_id: personaId }), {
            status: 201,
            headers: { 'content-type': 'application/json' },
          }) as any;
        }
        throw new Error(`Unhandled fetch URL: ${url}`);
      });

    const { POST: CreateAgentPOST } = await import('../../src/app/api/demos/agents/create/route');

    const req = new Request('http://localhost/api/demos/agents/create', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ demoId, agentName: 'Test Agent' }),
    });

    const res = await (CreateAgentPOST as any)(req);
    expect(res.status).toBeLessThan(400);
    expect(personaPayload).toBeTruthy();

    const tools = personaPayload.layers?.llm?.tools;
    expect(Array.isArray(tools)).toBe(true);
    expect(tools).toHaveLength(1);
    expect(tools[0]?.function?.name).toBe('fetch_video');

    const titleProp = tools[0]?.function?.parameters?.properties?.title;
    expect(titleProp?.type).toBe('string');
    // When available, enum should list exact video titles
    expect(titleProp?.enum).toEqual(expect.arrayContaining(demoVideoTitles));
    expect(titleProp?.enum?.length).toBe(demoVideoTitles.length);

    fetchSpy.mockRestore();
    delete process.env.TAVUS_TOOLS_ENABLED;
    delete process.env.TAVUS_MINIMAL_TOOLS;
  });

  test('create-agent includes full toolset when TAVUS_TOOLS_ENABLED=true and TAVUS_MINIMAL_TOOLS=false', async () => {
    process.env.TAVUS_TOOLS_ENABLED = 'true';
    process.env.TAVUS_MINIMAL_TOOLS = 'false';

    // Mock Supabase server client (videos optional for this test)
    jest.doMock('@/lib/utils/supabase', () => {
      return {
        createClient: jest.fn(() => ({
          auth: {
            getUser: jest.fn().mockResolvedValue({ data: { user: { id: userId } } }),
          },
          from: (table: string) => {
            if (table === 'demos') {
              return {
                select: () => ({
                  eq: () => ({ single: () => Promise.resolve({ data: { id: demoId, user_id: userId, metadata: {} }, error: null }) })
                }),
                update: (_payload: any) => ({
                  eq: (_col: string, _val: string) => Promise.resolve({ data: null, error: null })
                }) as any
              } as any;
            }
            if (table === 'knowledge_chunks') {
              return { select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }) } as any;
            }
            if (table === 'demo_videos') {
              return { select: () => ({ eq: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }) }) } as any;
            }
            throw new Error(`Unexpected table: ${table}`);
          },
        })),
      };
    });

    let personaPayload: any = null;
    const fetchSpy = jest
      .spyOn(global, 'fetch' as any)
      .mockImplementation(async (...args: unknown[]) => {
        const [input, init] = args as [RequestInfo | URL, RequestInit?];
        const url = typeof input === 'string' ? input : (input as URL).toString();
        if (url.startsWith('https://tavusapi.com/v2/personas')) {
          personaPayload = JSON.parse(String(init!.body));
          return new Response(JSON.stringify({ persona_id: personaId }), {
            status: 201,
            headers: { 'content-type': 'application/json' },
          }) as any;
        }
        throw new Error(`Unhandled fetch URL: ${url}`);
      });

    const { POST: CreateAgentPOST } = await import('../../src/app/api/demos/agents/create/route');

    const req = new Request('http://localhost/api/demos/agents/create', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ demoId, agentName: 'Test Agent' }),
    });

    const res = await (CreateAgentPOST as any)(req);
    expect(res.status).toBeLessThan(400);
    expect(personaPayload).toBeTruthy();

    const tools = personaPayload.layers?.llm?.tools;
    expect(Array.isArray(tools)).toBe(true);
    const names = tools.map((t: any) => t?.function?.name).filter(Boolean);
    expect(names).toEqual(expect.arrayContaining([
      'fetch_video',
      'pause_video',
      'play_video',
      'next_video',
      'close_video',
      'show_trial_cta',
    ]));
    expect(names).toHaveLength(6);

    fetchSpy.mockRestore();
    delete process.env.TAVUS_TOOLS_ENABLED;
    delete process.env.TAVUS_MINIMAL_TOOLS;
  });
});
