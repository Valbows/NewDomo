import crypto from 'crypto';

// Mock Supabase client and Sentry before importing the route
jest.mock('@supabase/supabase-js', () => {
  return {
    createClient: jest.fn(() => ({
      from: (table: string) => {
        const builder: any = {
          select: () => builder,
          eq: () => builder,
          single: () => {
            if (table === 'processed_webhook_events') {
              return { data: null, error: 'not found' };
            }
            return { data: null, error: 'not found' };
          },
          insert: (rows: any) => {
            // Mock insert for idempotency tracking
            return { data: rows, error: null };
          }
        };
        return builder;
      },
      storage: {
        from: () => ({
          createSignedUrl: () => ({ data: { signedUrl: 'signed-url' }, error: null })
        })
      },
      channel: () => ({
        send: async () => {},
        subscribe: () => {}
      }),
      removeChannel: () => {}
    }))
  };
});

jest.mock('@sentry/nextjs', () => ({
  wrapRouteHandlerWithSentry: (fn: any) => fn,
}));

// Helper to sign payloads with HMAC-SHA256
function signHex(secret: string, payload: string) {
  return crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
}

function signBase64(secret: string, payload: string) {
  return crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('base64');
}

describe('Tavus Webhook Security', () => {
  const secret = 'test_secret_value';

  beforeEach(() => {
    jest.resetModules();
    process.env.TAVUS_WEBHOOK_SECRET = secret;
  });

  afterEach(() => {
    delete process.env.TAVUS_WEBHOOK_SECRET;
  });

  test('returns 401 Unauthorized for invalid or missing signature', async () => {
    const { handlePOST } = await import('../src/app/api/tavus-webhook/handler');

    const payload = JSON.stringify({ event_type: 'utterance', data: {} });

    const req = new Request('http://localhost/api/tavus-webhook', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-tavus-signature': 'invalid-signature',
      },
      body: payload,
    });

    const res = await handlePOST(req as any);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json).toEqual({ error: 'Unauthorized' });
  });

  test('accepts multi-part signature header (t=..., v1=<base64>)', async () => {
    const { handlePOST } = await import('../src/app/api/tavus-webhook/handler');

    const payload = JSON.stringify({ event_type: 'utterance', data: {} });
    const ts = '1690000002';
    const sig = `t=${ts}, v1=${signBase64(secret, payload)}`;

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
  });

  test('rejects wrong algorithm prefix (sha1=<hex>) and returns 401', async () => {
    const { handlePOST } = await import('../src/app/api/tavus-webhook/handler');

    const payload = JSON.stringify({ event_type: 'utterance', data: {} });
    const hex = signHex(secret, payload);
    const header = `sha1=${hex}`;

    const req = new Request('http://localhost/api/tavus-webhook', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-tavus-signature': header,
      },
      body: payload,
    });

    const res = await handlePOST(req as any);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json).toEqual({ error: 'Unauthorized' });
  });

  test('rejects multi-part header with missing signature part (t=..., v1=) and returns 401', async () => {
    const { handlePOST } = await import('../src/app/api/tavus-webhook/handler');

    const payload = JSON.stringify({ event_type: 'utterance', data: {} });
    const ts = '1690000003';
    const header = `t=${ts}, v1=`;

    const req = new Request('http://localhost/api/tavus-webhook', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-tavus-signature': header,
      },
      body: payload,
    });

    const res = await handlePOST(req as any);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json).toEqual({ error: 'Unauthorized' });
  });

  test('accepts valid signature (hex) and returns 200 for benign event', async () => {
    const { handlePOST } = await import('../src/app/api/tavus-webhook/handler');

    const payload = JSON.stringify({ event_type: 'utterance', data: {} });
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
  });

  test('accepts multi-part signature header (t=..., sha256=<hex>)', async () => {
    const { handlePOST } = await import('../src/app/api/tavus-webhook/handler');

    const payload = JSON.stringify({ event_type: 'utterance', data: {} });
    const ts = '1690000001';
    const sig = `t=${ts}, sha256=${signHex(secret, payload)}`;

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
  });

  test('rejects malformed base64 signature and returns 401', async () => {
    const { handlePOST } = await import('../src/app/api/tavus-webhook/handler');

    const payload = JSON.stringify({ event_type: 'utterance', data: {} });
    const malformed = 'sha256=!!not_base64!!';

    const req = new Request('http://localhost/api/tavus-webhook', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-tavus-signature': malformed,
      },
      body: payload,
    });

    const res = await handlePOST(req as any);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json).toEqual({ error: 'Unauthorized' });
  });

  test('rejects mismatched payload even with valid hex signature format', async () => {
    const { handlePOST } = await import('../src/app/api/tavus-webhook/handler');

    const payloadSent = JSON.stringify({ event_type: 'utterance', data: {} });
    const payloadSigned = JSON.stringify({ event_type: 'utterance', data: { different: true } });
    const sig = signHex(secret, payloadSigned);

    const req = new Request('http://localhost/api/tavus-webhook', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-tavus-signature': sig,
      },
      body: payloadSent,
    });

    const res = await handlePOST(req as any);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json).toEqual({ error: 'Unauthorized' });
  });

  test('accepts valid signature with prefixed header (sha256=...)', async () => {
    const { handlePOST } = await import('../src/app/api/tavus-webhook/handler');

    const payload = JSON.stringify({ event_type: 'utterance', data: {} });
    const sig = `sha256=${signHex(secret, payload)}`;

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
  });

  test('ingestion-type events still return 200 even if Supabase lookups fail', async () => {
    const { handlePOST } = await import('../src/app/api/tavus-webhook/handler');

    // Event type matches shouldIngestEvent needles (application_conversation_completed)
    const payload = JSON.stringify({
      event_type: 'application.conversation.completed',
      conversation_id: 'conv_123',
      data: { summary: { score: 0.9 } },
    });
    const sig = signHex(secret, payload);

    const req = new Request('http://localhost/api/tavus-webhook', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-tavus-signature': sig,
      },
      body: payload,
    });

    const res = await (handlePOST as any)(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ received: true });
  }, 10000); // 10 second timeout for this slow test

  test('accepts valid signature (base64) and returns 200 for benign event', async () => {
    const { handlePOST } = await import('../src/app/api/tavus-webhook/handler');

    const payload = JSON.stringify({ event_type: 'utterance', data: {} });
    const sig = signBase64(secret, payload);

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
  });

  test('accepts valid signature with prefixed base64 (sha256=...)', async () => {
    const { handlePOST } = await import('../src/app/api/tavus-webhook/handler');

    const payload = JSON.stringify({ event_type: 'utterance', data: {} });
    const sig = `sha256=${signBase64(secret, payload)}`;

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
  });

  test('accepts multi-part signature header (t=..., v1=<hex>)', async () => {
    const { handlePOST } = await import('../src/app/api/tavus-webhook/handler');

    const payload = JSON.stringify({ event_type: 'utterance', data: {} });
    const ts = '1690000000';
    const sig = `t=${ts}, v1=${signHex(secret, payload)}`;

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
  });

  test('accepts valid signature via alt header "tavus-signature"', async () => {
    const { handlePOST } = await import('../src/app/api/tavus-webhook/handler');

    const payload = JSON.stringify({ event_type: 'utterance', data: {} });
    const sig = signHex(secret, payload);

    const req = new Request('http://localhost/api/tavus-webhook', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'tavus-signature': sig,
      },
      body: payload,
    });

    const res = await handlePOST(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ received: true });
  });

  test('accepts valid signature via alt header "x-signature"', async () => {
    const { handlePOST } = await import('../src/app/api/tavus-webhook/handler');

    const payload = JSON.stringify({ event_type: 'utterance', data: {} });
    const sig = signHex(secret, payload);

    const req = new Request('http://localhost/api/tavus-webhook', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-signature': sig,
      },
      body: payload,
    });

    const res = await handlePOST(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ received: true });
  });
});
