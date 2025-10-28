import crypto from 'crypto';

// Mock Supabase client and Sentry before importing the route
jest.mock('@supabase/supabase-js', () => {
  // Track processed events for idempotency simulation
  const processedEvents = new Set<string>();

  const supabaseMock = {
    from: (table: string) => {
      const builder: any = {
        _table: table,
        _sel: '',
        _eq: [],
        select: jest.fn(function (sel?: string) { builder._sel = sel || ''; return builder; }),
        eq: jest.fn(function (_col?: string, val?: any) { builder._eq = [val]; return builder; }),
        single: jest.fn(function () {
          if (table === 'demos') {
            // Return admin-configured CTA fields
            return {
              data: {
                id: 'demo_abc',
                cta_title: 'Try Pro',
                cta_message: 'Unlock features',
                cta_button_text: 'Start Free Trial',
                cta_button_url: 'https://example.com/trial',
              },
              error: null,
            };
          }
          if (table === 'demo_videos') {
            return { data: { storage_url: 'videos/demo_abc/Strategic Planning.mp4' }, error: null };
          }
          if (table === 'processed_webhook_events') {
            const eventId = builder._eq?.[0];
            if (eventId && processedEvents.has(eventId)) {
              return { data: { event_id: eventId }, error: null };
            }
            return { data: null, error: 'not found' };
          }
          return { data: null, error: 'unknown table' };
        }),
        insert: jest.fn(function (rows: any) {
          if (table === 'processed_webhook_events') {
            const row = Array.isArray(rows) ? rows[0] : rows;
            if (row?.event_id) processedEvents.add(row.event_id);
            return { data: row, error: null };
          }
          return { data: rows, error: null };
        }),
      };
      return builder;
    },
    storage: {
      from: jest.fn(() => ({
        createSignedUrl: jest.fn(() => ({ data: { signedUrl: 'https://signed-url.example/video.mp4' }, error: null })),
      })),
    },
    channel: jest.fn(() => ({
      send: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn(),
    })),
    removeChannel: jest.fn(),
  } as any;

  const createClient = jest.fn(() => supabaseMock);
  return { createClient };
});

jest.mock('@sentry/nextjs', () => ({
  wrapRouteHandlerWithSentry: (fn: any) => fn,
}));

function signHex(secret: string, payload: string) {
  return crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
}

describe('Tavus Webhook Tool Calls', () => {
  const secret = 'test_secret_value';

  beforeEach(() => {
    jest.resetModules();
    process.env.TAVUS_WEBHOOK_SECRET = secret;
  });

  afterEach(() => {
    delete process.env.TAVUS_WEBHOOK_SECRET;
  });

  test('fetch_video: finds demo/video, signs URL, broadcasts play_video', async () => {
    const { handlePOST } = await import('../src/app/api/tavus-webhook/handler');
    const supabaseJs = await import('@supabase/supabase-js');

    const payloadObj = {
      event_type: 'conversation.toolcall',
      conversation_id: 'conv_1',
      data: {
        name: 'fetch_video',
        args: { title: 'Strategic Planning' },
      },
    };
    const payload = JSON.stringify(payloadObj);
    const sig = signHex(secret, payload);

    const req = new Request('http://localhost/api/tavus-webhook', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-tavus-signature': sig,
      },
      body: payload,
    });

    const res = await handlePOST(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ received: true });

    // Inspect Supabase channel broadcast
    const createClientMock = supabaseJs.createClient as unknown as jest.Mock;
    const supabaseInstance = createClientMock.mock.results[0].value;
    const channelMock = supabaseInstance.channel as jest.Mock;
    expect(channelMock).toHaveBeenCalledWith('demo-demo_abc');
    const channelObj = channelMock.mock.results[0].value;
    expect(channelObj.send).toHaveBeenCalledWith({
      type: 'broadcast',
      event: 'play_video',
      payload: { url: 'https://signed-url.example/video.mp4' },
    });
  });

  test('show_trial_cta: finds demo and broadcasts CTA event', async () => {
    const { handlePOST } = await import('../src/app/api/tavus-webhook/handler');
    const supabaseServer = await import('@/utils/supabase/server');

    const payloadObj = {
      event_type: 'conversation.toolcall',
      conversation_id: 'conv_2',
      data: {
        name: 'show_trial_cta',
        args: {},
      },
    };
    const payload = JSON.stringify(payloadObj);
    const sig = signHex(secret, payload);

    const req = new Request('http://localhost/api/tavus-webhook', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-tavus-signature': sig,
      },
      body: payload,
    });

    const res = await handlePOST(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ received: true });

    const createClientMock = supabaseServer.createClient as unknown as jest.Mock;
    const supabaseInstance = createClientMock.mock.results[0].value;
    const channelMock = supabaseInstance.channel as jest.Mock;
    expect(channelMock).toHaveBeenCalledWith('demo-demo_abc');
    const channelObj = channelMock.mock.results[0].value;
    expect(channelObj.send).toHaveBeenCalledWith({
      type: 'broadcast',
      event: 'show_trial_cta',
      payload: {
        cta_title: 'Try Pro',
        cta_message: 'Unlock features',
        cta_button_text: 'Start Free Trial',
        cta_button_url: 'https://example.com/trial',
      },
    });
  });

  test('idempotency: duplicate show_trial_cta only broadcasts once', async () => {
    const { handlePOST } = await import('../src/app/api/tavus-webhook/handler');
    const supabaseServer = await import('@/utils/supabase/server');

    const payloadObj = {
      event_type: 'conversation.toolcall',
      conversation_id: 'conv_idem',
      data: {
        name: 'show_trial_cta',
        args: {},
      },
    };
    const payload = JSON.stringify(payloadObj);
    const sig = signHex(secret, payload);

    const reqInit: any = {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-tavus-signature': sig },
      body: payload,
    };

    const res1 = await handlePOST(new Request('http://localhost/api/tavus-webhook', reqInit) as any);
    expect(res1.status).toBe(200);
    await res1.json();

    const res2 = await handlePOST(new Request('http://localhost/api/tavus-webhook', reqInit) as any);
    expect(res2.status).toBe(200);
    await res2.json();

    const createClientMock = supabaseServer.createClient as unknown as jest.Mock;
    const supabaseInstance = createClientMock.mock.results[0].value;
    const channelMock = supabaseInstance.channel as jest.Mock;
    const channelObj = channelMock.mock.results[0].value;
    // Only one broadcast should have occurred
    expect(channelMock).toHaveBeenCalledTimes(1);
    expect(channelObj.send).toHaveBeenCalledTimes(1);
    expect(channelObj.send).toHaveBeenCalledWith({
      type: 'broadcast',
      event: 'show_trial_cta',
      payload: {
        cta_title: 'Try Pro',
        cta_message: 'Unlock features',
        cta_button_text: 'Start Free Trial',
        cta_button_url: 'https://example.com/trial',
      },
    });
  });

  test('play_video alias behaves like fetch_video (signs and broadcasts)', async () => {
    const { handlePOST } = await import('../src/app/api/tavus-webhook/handler');
    const supabaseServer = await import('@/utils/supabase/server');

    const payloadObj = {
      event_type: 'conversation.toolcall',
      conversation_id: 'conv_3',
      data: {
        name: 'play_video',
        args: { title: 'Strategic Planning' },
      },
    };
    const payload = JSON.stringify(payloadObj);
    const sig = signHex(secret, payload);

    const req = new Request('http://localhost/api/tavus-webhook', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-tavus-signature': sig,
      },
      body: payload,
    });

    const res = await handlePOST(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ received: true });

    const createClientMock = supabaseServer.createClient as unknown as jest.Mock;
    const supabaseInstance = createClientMock.mock.results[0].value;
    const channelMock = supabaseInstance.channel as jest.Mock;
    expect(channelMock).toHaveBeenCalledWith('demo-demo_abc');
    const channelObj = channelMock.mock.results[0].value;
    expect(channelObj.send).toHaveBeenCalledWith({
      type: 'broadcast',
      event: 'play_video',
      payload: { url: 'https://signed-url.example/video.mp4' },
    });
  });

  test('fetch_video with missing/invalid title returns 200 with validation message', async () => {
    const { handlePOST } = await import('../src/app/api/tavus-webhook/handler');
    const supabaseServer = await import('@/utils/supabase/server');

    const payloadObj = {
      event_type: 'conversation.toolcall',
      conversation_id: 'conv_4',
      data: {
        name: 'fetch_video',
        args: { title: '   ' },
      },
    } as any;
    const payload = JSON.stringify(payloadObj);
    const sig = signHex(secret, payload);

    const req = new Request('http://localhost/api/tavus-webhook', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-tavus-signature': sig,
      },
      body: payload,
    });

    const res = await handlePOST(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ message: 'Invalid or missing video title.' });

    const createClientMock = supabaseServer.createClient as unknown as jest.Mock;
    const supabaseInstance = createClientMock.mock.results[0].value;
    // Ensure we did not broadcast anything
    expect((supabaseInstance.channel as jest.Mock).mock.calls.length).toBe(0);
  });

  test('fetch_video: demo not found returns 200 with message and no broadcast', async () => {
    jest.resetModules();
    process.env.TAVUS_WEBHOOK_SECRET = secret;
    const supabaseServer = await import('@/utils/supabase/server');

    // Override createClient to return a mock that fails demo lookup
    (supabaseServer.createClient as unknown as jest.Mock).mockImplementation(() => {
      const mock: any = {
        from: (table: string) => {
          const builder: any = {
            select: jest.fn(() => builder),
            eq: jest.fn(() => builder),
            single: jest.fn(() => {
              if (table === 'demos') return { data: null, error: 'not found' };
              return { data: null, error: 'noop' };
            }),
          };
          return builder;
        },
        storage: { from: jest.fn(() => ({ createSignedUrl: jest.fn() })) },
        channel: jest.fn(() => ({ send: jest.fn(), subscribe: jest.fn() })),
        removeChannel: jest.fn(),
      };
      return mock;
    });

    const { handlePOST } = await import('../src/app/api/tavus-webhook/handler');

    const payloadObj = {
      event_type: 'conversation.toolcall',
      conversation_id: 'conv_X',
      data: { name: 'fetch_video', args: { title: 'Any Title' } },
    };
    const payload = JSON.stringify(payloadObj);
    const sig = signHex(secret, payload);

    const res = await handlePOST(new Request('http://localhost/api/tavus-webhook', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-tavus-signature': sig },
      body: payload,
    }) as any);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ message: 'Demo not found for conversation.' });

    const supabaseInstance = (supabaseServer.createClient as any).mock.results.at(-1).value;
    expect((supabaseInstance.channel as jest.Mock).mock.calls.length).toBe(0);
  });

  test('show_trial_cta: demo not found returns 200 with message and no broadcast', async () => {
    jest.resetModules();
    process.env.TAVUS_WEBHOOK_SECRET = secret;
    const supabaseServer = await import('@/utils/supabase/server');

    (supabaseServer.createClient as unknown as jest.Mock).mockImplementation(() => {
      const mock: any = {
        from: (table: string) => ({
          select: () => ({ eq: () => ({ single: () => ({ data: null, error: 'not found' }) }) }),
        }),
        channel: jest.fn(() => ({ send: jest.fn(), subscribe: jest.fn() })),
      };
      return mock;
    });

    const { handlePOST } = await import('../src/app/api/tavus-webhook/handler');

    const payloadObj = {
      event_type: 'conversation.toolcall',
      conversation_id: 'conv_Y',
      data: { name: 'show_trial_cta', args: {} },
    };
    const payload = JSON.stringify(payloadObj);
    const sig = signHex(secret, payload);

    const res = await handlePOST(new Request('http://localhost/api/tavus-webhook', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-tavus-signature': sig },
      body: payload,
    }) as any);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ message: 'Demo not found for conversation.' });

    const supabaseInstance = (supabaseServer.createClient as any).mock.results.at(-1).value;
    expect((supabaseInstance.channel as jest.Mock).mock.calls.length).toBe(0);
  });

  test('fetch_video: video not found returns 200 with message and no broadcast', async () => {
    jest.resetModules();
    process.env.TAVUS_WEBHOOK_SECRET = secret;
    const supabaseServer = await import('@/utils/supabase/server');

    (supabaseServer.createClient as unknown as jest.Mock).mockImplementation(() => {
      const mock: any = {
        from: (table: string) => {
          const builder: any = {
            _sel: '',
            select: jest.fn(function (sel: string) { builder._sel = sel; return builder; }),
            eq: jest.fn(() => builder),
            single: jest.fn(() => {
              if (table === 'demos') return { data: { id: 'demo_abc' }, error: null };
              if (table === 'demo_videos' && builder._sel === 'storage_url') {
                return { data: null, error: 'not found' };
              }
              return { data: null, error: 'noop' };
            }),
          };
          return builder;
        },
        storage: { from: jest.fn(() => ({ createSignedUrl: jest.fn() })) },
        channel: jest.fn(() => ({ send: jest.fn(), subscribe: jest.fn() })),
      };
      return mock;
    });

    const { handlePOST } = await import('../src/app/api/tavus-webhook/handler');

    const payloadObj = {
      event_type: 'conversation.toolcall',
      conversation_id: 'conv_Z',
      data: { name: 'fetch_video', args: { title: 'Missing Title' } },
    };
    const payload = JSON.stringify(payloadObj);
    const sig = signHex(secret, payload);

    const res = await handlePOST(new Request('http://localhost/api/tavus-webhook', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-tavus-signature': sig },
      body: payload,
    }) as any);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ message: 'Video not found.' });

    const supabaseInstance = (supabaseServer.createClient as any).mock.results.at(-1).value;
    expect((supabaseInstance.channel as jest.Mock).mock.calls.length).toBe(0);
  });

  test('fetch_video: signed URL creation error returns 200 with message and no broadcast', async () => {
    jest.resetModules();
    process.env.TAVUS_WEBHOOK_SECRET = secret;
    const supabaseServer = await import('@/utils/supabase/server');

    (supabaseServer.createClient as unknown as jest.Mock).mockImplementation(() => {
      const builder: any = {
        _table: '',
        _sel: '',
        select: jest.fn(function (sel: string) {
          builder._sel = sel;
          return builder;
        }),
        eq: jest.fn(function () {
          return builder;
        }),
        single: jest.fn(function () {
          if (builder._table === 'demos') {
            return { data: { id: 'demo_abc' }, error: null };
          }
          if (builder._table === 'demo_videos' && builder._sel === 'storage_url') {
            return { data: { storage_url: 'videos/path.mp4' }, error: null };
          }
          return { data: null, error: 'noop' };
        }),
      };
      const mock: any = {
        from: (table: string) => {
          builder._table = table;
          return builder;
        },
        storage: {
          from: jest.fn(() => ({
            createSignedUrl: jest.fn(() => ({ data: null, error: 'sign error' })),
          })),
        },
        channel: jest.fn(() => ({ send: jest.fn(), subscribe: jest.fn() })),
      };
      return mock;
    });

    const { handlePOST } = await import('../src/app/api/tavus-webhook/handler');

    const payloadObj = {
      event_type: 'conversation.toolcall',
      conversation_id: 'conv_W',
      data: { name: 'fetch_video', args: { title: 'Any Title' } },
    };
    const payload = JSON.stringify(payloadObj);
    const sig = signHex(secret, payload);

    const res = await handlePOST(new Request('http://localhost/api/tavus-webhook', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-tavus-signature': sig },
      body: payload,
    }) as any);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ message: 'Could not generate video URL.' });

    const supabaseInstance = (supabaseServer.createClient as any).mock.results.at(-1).value;
    expect((supabaseInstance.channel as jest.Mock).mock.calls.length).toBe(0);
  });
});
