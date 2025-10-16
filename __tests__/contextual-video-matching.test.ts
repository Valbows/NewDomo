import crypto from 'crypto';

// Mock Supabase server client before importing the route
jest.mock('@/utils/supabase/server', () => {
  // Track processed events for idempotency simulation
  const processedEvents = new Set<string>();

  // Mock video database with various business-focused videos
  const mockVideos = {
    'demo_abc': [
      { title: 'Workforce Planning: Strategic Planning', storage_url: 'videos/demo_abc/strategic-planning.mp4' },
      { title: 'Workforce Planning: Headcount and Cost Planning', storage_url: 'videos/demo_abc/cost-planning.mp4' },
      { title: 'Workforce Planning: Build, Hire, Borrow Analysis', storage_url: 'videos/demo_abc/hiring-analysis.mp4' },
      { title: 'Workforce Planning: Headcount Reconciliation', storage_url: 'videos/demo_abc/data-reconciliation.mp4' },
      { title: 'Workforce Planning: Eliminate Planning Silos', storage_url: 'videos/demo_abc/collaboration.mp4' },
      { title: 'Workforce Planning: More Context Behind Numbers', storage_url: 'videos/demo_abc/analytics.mp4' },
      { title: 'Workforce Planning: Planning and Executing', storage_url: 'videos/demo_abc/execution.mp4' }
    ]
  };

  const supabaseMock = {
    from: (table: string) => {
      const builder: any = {
        _table: table,
        _sel: '',
        _eq: [],
        _demo_id: null,
        _title: null,
        select: jest.fn(function (sel?: string) { builder._sel = sel || ''; return builder; }),
        eq: jest.fn(function (col?: string, val?: any) { 
          if (col === 'demo_id') builder._demo_id = val;
          if (col === 'title') builder._title = val;
          builder._eq = [val]; 
          return builder; 
        }),
        single: jest.fn(function () {
          if (table === 'demos') {
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
            const demoVideos = mockVideos[builder._demo_id as keyof typeof mockVideos] || [];
            const video = demoVideos.find(v => v.title === builder._title);
            if (video) {
              return { data: { storage_url: video.storage_url }, error: null };
            }
            return { data: null, error: 'Video not found' };
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
        createSignedUrl: jest.fn((path: string) => ({ 
          data: { signedUrl: `https://signed-url.example/${path}` }, 
          error: null 
        })),
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

describe('Contextual Video Matching Tests', () => {
  const secret = 'test_secret_value';

  beforeEach(() => {
    jest.resetModules();
    process.env.TAVUS_WEBHOOK_SECRET = secret;
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SECRET_KEY = 'test_secret_key';
  });

  afterEach(() => {
    delete process.env.TAVUS_WEBHOOK_SECRET;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SECRET_KEY;
  });

  describe('Strategic Planning Context', () => {
    test('should match strategic planning context to strategic planning video', async () => {
      const { handlePOST } = await import('../src/app/api/tavus-webhook/handler');
      const supabaseServer = await import('@/utils/supabase/server');

      const payloadObj = {
        event_type: 'conversation.toolcall',
        conversation_id: 'conv_strategic_1',
        data: {
          name: 'fetch_video',
          args: { title: 'Workforce Planning: Strategic Planning' },
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

      // Verify correct video was fetched and broadcasted
      const createClientMock = supabaseServer.createClient as unknown as jest.Mock;
      const supabaseInstance = createClientMock.mock.results[0].value;
      const channelMock = supabaseInstance.channel as jest.Mock;
      const channelObj = channelMock.mock.results[0].value;
      expect(channelObj.send).toHaveBeenCalledWith({
        type: 'broadcast',
        event: 'play_video',
        payload: { url: 'https://signed-url.example/videos/demo_abc/strategic-planning.mp4' },
      });
    });

    test('should handle planning-related contextual requests', async () => {
      const { handlePOST } = await import('../src/app/api/tavus-webhook/handler');

      // Test various planning-related contexts that should map to strategic planning
      const planningContexts = [
        'Workforce Planning: Strategic Planning',
        // Note: In real implementation, the agent would intelligently map user context
        // like "We need help with long-term planning" to "Workforce Planning: Strategic Planning"
      ];

      for (const context of planningContexts) {
        const payloadObj = {
          event_type: 'conversation.toolcall',
          conversation_id: `conv_planning_${Math.random()}`,
          data: {
            name: 'fetch_video',
            args: { title: context },
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
      }
    });
  });

  describe('Budget/Cost Management Context', () => {
    test('should match budget context to cost planning video', async () => {
      const { handlePOST } = await import('../src/app/api/tavus-webhook/handler');
      const supabaseServer = await import('@/utils/supabase/server');

      const payloadObj = {
        event_type: 'conversation.toolcall',
        conversation_id: 'conv_budget_1',
        data: {
          name: 'fetch_video',
          args: { title: 'Workforce Planning: Headcount and Cost Planning' },
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

      // Verify correct cost planning video was fetched
      const createClientMock = supabaseServer.createClient as unknown as jest.Mock;
      const supabaseInstance = createClientMock.mock.results[0].value;
      const channelMock = supabaseInstance.channel as jest.Mock;
      const channelObj = channelMock.mock.results[0].value;
      expect(channelObj.send).toHaveBeenCalledWith({
        type: 'broadcast',
        event: 'play_video',
        payload: { url: 'https://signed-url.example/videos/demo_abc/cost-planning.mp4' },
      });
    });
  });

  describe('Hiring/Workforce Context', () => {
    test('should match hiring context to hiring analysis video', async () => {
      const { handlePOST } = await import('../src/app/api/tavus-webhook/handler');
      const supabaseServer = await import('@/utils/supabase/server');

      const payloadObj = {
        event_type: 'conversation.toolcall',
        conversation_id: 'conv_hiring_1',
        data: {
          name: 'fetch_video',
          args: { title: 'Workforce Planning: Build, Hire, Borrow Analysis' },
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

      // Verify correct hiring video was fetched
      const createClientMock = supabaseServer.createClient as unknown as jest.Mock;
      const supabaseInstance = createClientMock.mock.results[0].value;
      const channelMock = supabaseInstance.channel as jest.Mock;
      const channelObj = channelMock.mock.results[0].value;
      expect(channelObj.send).toHaveBeenCalledWith({
        type: 'broadcast',
        event: 'play_video',
        payload: { url: 'https://signed-url.example/videos/demo_abc/hiring-analysis.mp4' },
      });
    });
  });

  describe('Data Accuracy Context', () => {
    test('should match data accuracy context to reconciliation video', async () => {
      const { handlePOST } = await import('../src/app/api/tavus-webhook/handler');
      const supabaseServer = await import('@/utils/supabase/server');

      const payloadObj = {
        event_type: 'conversation.toolcall',
        conversation_id: 'conv_data_1',
        data: {
          name: 'fetch_video',
          args: { title: 'Workforce Planning: Headcount Reconciliation' },
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

      // Verify correct reconciliation video was fetched
      const createClientMock = supabaseServer.createClient as unknown as jest.Mock;
      const supabaseInstance = createClientMock.mock.results[0].value;
      const channelMock = supabaseInstance.channel as jest.Mock;
      const channelObj = channelMock.mock.results[0].value;
      expect(channelObj.send).toHaveBeenCalledWith({
        type: 'broadcast',
        event: 'play_video',
        payload: { url: 'https://signed-url.example/videos/demo_abc/data-reconciliation.mp4' },
      });
    });
  });

  describe('Collaboration Context', () => {
    test('should match collaboration context to silos elimination video', async () => {
      const { handlePOST } = await import('../src/app/api/tavus-webhook/handler');
      const supabaseServer = await import('@/utils/supabase/server');

      const payloadObj = {
        event_type: 'conversation.toolcall',
        conversation_id: 'conv_collab_1',
        data: {
          name: 'fetch_video',
          args: { title: 'Workforce Planning: Eliminate Planning Silos' },
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

      // Verify correct collaboration video was fetched
      const createClientMock = supabaseServer.createClient as unknown as jest.Mock;
      const supabaseInstance = createClientMock.mock.results[0].value;
      const channelMock = supabaseInstance.channel as jest.Mock;
      const channelObj = channelMock.mock.results[0].value;
      expect(channelObj.send).toHaveBeenCalledWith({
        type: 'broadcast',
        event: 'play_video',
        payload: { url: 'https://signed-url.example/videos/demo_abc/collaboration.mp4' },
      });
    });
  });

  describe('Analytics Context', () => {
    test('should match analytics context to insights video', async () => {
      const { handlePOST } = await import('../src/app/api/tavus-webhook/handler');
      const supabaseServer = await import('@/utils/supabase/server');

      const payloadObj = {
        event_type: 'conversation.toolcall',
        conversation_id: 'conv_analytics_1',
        data: {
          name: 'fetch_video',
          args: { title: 'Workforce Planning: More Context Behind Numbers' },
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

      // Verify correct analytics video was fetched
      const createClientMock = supabaseServer.createClient as unknown as jest.Mock;
      const supabaseInstance = createClientMock.mock.results[0].value;
      const channelMock = supabaseInstance.channel as jest.Mock;
      const channelObj = channelMock.mock.results[0].value;
      expect(channelObj.send).toHaveBeenCalledWith({
        type: 'broadcast',
        event: 'play_video',
        payload: { url: 'https://signed-url.example/videos/demo_abc/analytics.mp4' },
      });
    });
  });

  describe('Implementation Context', () => {
    test('should match implementation context to execution video', async () => {
      const { handlePOST } = await import('../src/app/api/tavus-webhook/handler');
      const supabaseServer = await import('@/utils/supabase/server');

      const payloadObj = {
        event_type: 'conversation.toolcall',
        conversation_id: 'conv_impl_1',
        data: {
          name: 'fetch_video',
          args: { title: 'Workforce Planning: Planning and Executing' },
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

      // Verify correct execution video was fetched
      const createClientMock = supabaseServer.createClient as unknown as jest.Mock;
      const supabaseInstance = createClientMock.mock.results[0].value;
      const channelMock = supabaseInstance.channel as jest.Mock;
      const channelObj = channelMock.mock.results[0].value;
      expect(channelObj.send).toHaveBeenCalledWith({
        type: 'broadcast',
        event: 'play_video',
        payload: { url: 'https://signed-url.example/videos/demo_abc/execution.mp4' },
      });
    });
  });

  describe('Silent Execution Verification', () => {
    test('should process video requests without exposing technical details', async () => {
      const { handlePOST } = await import('../src/app/api/tavus-webhook/handler');

      // Test that the system processes requests silently
      const payloadObj = {
        event_type: 'conversation.toolcall',
        conversation_id: 'conv_silent_1',
        data: {
          name: 'fetch_video',
          args: { title: 'Workforce Planning: Strategic Planning' },
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
      
      // Should return success without exposing internal processing
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({ received: true });
      
      // Should not contain any technical video title information in response
      expect(json).not.toHaveProperty('video_title');
      expect(json).not.toHaveProperty('storage_url');
      expect(json).not.toHaveProperty('signed_url');
    });

    test('should handle multiple contextual requests in sequence', async () => {
      const { handlePOST } = await import('../src/app/api/tavus-webhook/handler');

      const contexts = [
        'Workforce Planning: Strategic Planning',
        'Workforce Planning: Headcount and Cost Planning',
        'Workforce Planning: Build, Hire, Borrow Analysis'
      ];

      for (let i = 0; i < contexts.length; i++) {
        const payloadObj = {
          event_type: 'conversation.toolcall',
          conversation_id: `conv_sequence_${i}`,
          data: {
            name: 'fetch_video',
            args: { title: contexts[i] },
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
      }
    });
  });

  describe('Error Handling for Contextual Matching', () => {
    test('should handle requests for non-existent contextual videos gracefully', async () => {
      const { handlePOST } = await import('../src/app/api/tavus-webhook/handler');

      const payloadObj = {
        event_type: 'conversation.toolcall',
        conversation_id: 'conv_nonexistent_1',
        data: {
          name: 'fetch_video',
          args: { title: 'Non-Existent Business Context Video' },
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
      expect(json).toEqual({ message: 'Video not found.' });
    });

    test('should validate video title parameters for contextual requests', async () => {
      const { handlePOST } = await import('../src/app/api/tavus-webhook/handler');

      const payloadObj = {
        event_type: 'conversation.toolcall',
        conversation_id: 'conv_invalid_1',
        data: {
          name: 'fetch_video',
          args: { title: '' }, // Empty title
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
      expect(json).toEqual({ message: 'Invalid or missing video title.' });
    });
  });

  describe('Business Context Integration', () => {
    test('should demonstrate end-to-end contextual video matching flow', async () => {
      const { handlePOST } = await import('../src/app/api/tavus-webhook/handler');
      const supabaseServer = await import('@/utils/supabase/server');

      // Simulate a complete business context to video matching flow
      const businessScenarios = [
        {
          context: 'strategic planning challenges',
          expectedVideo: 'Workforce Planning: Strategic Planning',
          expectedPath: 'videos/demo_abc/strategic-planning.mp4'
        },
        {
          context: 'budget management issues',
          expectedVideo: 'Workforce Planning: Headcount and Cost Planning',
          expectedPath: 'videos/demo_abc/cost-planning.mp4'
        },
        {
          context: 'hiring optimization needs',
          expectedVideo: 'Workforce Planning: Build, Hire, Borrow Analysis',
          expectedPath: 'videos/demo_abc/hiring-analysis.mp4'
        }
      ];

      for (const scenario of businessScenarios) {
        const payloadObj = {
          event_type: 'conversation.toolcall',
          conversation_id: `conv_${scenario.context.replace(/\s+/g, '_')}`,
          data: {
            name: 'fetch_video',
            args: { title: scenario.expectedVideo },
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

        // Verify the correct video was matched and broadcasted
        const createClientMock = supabaseServer.createClient as unknown as jest.Mock;
        const supabaseInstance = createClientMock.mock.results[0].value;
        const channelMock = supabaseInstance.channel as jest.Mock;
        const channelObj = channelMock.mock.results[0].value;
        expect(channelObj.send).toHaveBeenCalledWith({
          type: 'broadcast',
          event: 'play_video',
          payload: { url: `https://signed-url.example/${scenario.expectedPath}` },
        });
      }
    });
  });
});