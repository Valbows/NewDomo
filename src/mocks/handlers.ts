import { http, HttpResponse } from 'msw';

const MOCK_API_URL = 'http://localhost:3000';
const SUPABASE_URL = 'https://xddjudwawavxwirpkksz.supabase.co';

// Mock data for testing
const mockDemo = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Test Demo',
  created_at: '2024-01-01T00:00:00Z'
};

const mockConversations = [
  {
    id: 'conv-1',
    demo_id: '550e8400-e29b-41d4-a716-446655440000',
    created_at: '2024-01-01T00:00:00Z',
    completed_at: '2024-01-01T00:05:00Z'
  },
  {
    id: 'conv-2',
    demo_id: '550e8400-e29b-41d4-a716-446655440000',
    created_at: '2024-01-01T01:00:00Z',
    completed_at: null
  }
];

export const handlers = [
  // API route handlers
  http.get(`${MOCK_API_URL}/api/elevenlabs/voices`, () => {
    return HttpResponse.json([
      { voice_id: 'voice_1', name: 'Rachel' },
      { voice_id: 'voice_2', name: 'Adam' },
    ]);
  }),

  http.post(`${MOCK_API_URL}/api/tavus`, async ({ request }) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return HttpResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    if (!body || typeof body !== 'object' || !('script' in body) || !('voice_id' in body)) {
      return HttpResponse.json({ error: 'Missing script or voice_id' }, { status: 400 });
    }
    return HttpResponse.json({ id: 'mock_video_123', status: 'created' }, { status: 201 });
  }),

  http.post(`${MOCK_API_URL}/api/create-agent`, () => {
    return HttpResponse.json({
      message: 'Agent created successfully.',
      agentId: 'agent_mock_12345',
      shareableLink: 'https://app.tavus.io/share/agent_mock_12345',
    });
  }),

  http.get(`${MOCK_API_URL}/api/webhook-url`, () => {
    return HttpResponse.json({ success: true, url: 'https://test-webhook.com' });
  }),

  http.get(`${MOCK_API_URL}/api/demos/:demoId/custom-objectives`, () => {
    return HttpResponse.json({ objectives: [] });
  }),

  // Handle the specific demo-123 endpoint that the test uses
  http.get(`${MOCK_API_URL}/api/demos/demo-123/custom-objectives`, () => {
    return HttpResponse.json({ objectives: [] });
  }),

  // Additional missing endpoints
  http.get(`${SUPABASE_URL}/rest/v1/custom_objectives`, () => {
    return HttpResponse.json([]);
  }),

  http.options(`${SUPABASE_URL}/rest/v1/custom_objectives`, () => {
    return new HttpResponse(null, { status: 200 });
  }),

  // Supabase REST API handlers
  http.get(`${SUPABASE_URL}/rest/v1/demos`, () => {
    return HttpResponse.json([mockDemo]);
  }),

  http.options(`${SUPABASE_URL}/rest/v1/demos`, () => {
    return new HttpResponse(null, { status: 200 });
  }),

  http.delete(`${SUPABASE_URL}/rest/v1/demos`, () => {
    return HttpResponse.json({ count: 0 });
  }),

  // Conversation details endpoints
  http.get(`${SUPABASE_URL}/rest/v1/conversation_details`, () => {
    return HttpResponse.json(mockConversations);
  }),

  http.options(`${SUPABASE_URL}/rest/v1/conversation_details`, () => {
    return new HttpResponse(null, { status: 200 });
  }),

  http.delete(`${SUPABASE_URL}/rest/v1/conversation_details`, () => {
    return HttpResponse.json({ count: 0 });
  }),

  // Qualification data endpoints
  http.get(`${SUPABASE_URL}/rest/v1/qualification_data`, () => {
    return HttpResponse.json([]);
  }),

  http.options(`${SUPABASE_URL}/rest/v1/qualification_data`, () => {
    return new HttpResponse(null, { status: 200 });
  }),

  http.delete(`${SUPABASE_URL}/rest/v1/qualification_data`, () => {
    return HttpResponse.json({ count: 0 });
  }),

  // Product interest data endpoints
  http.get(`${SUPABASE_URL}/rest/v1/product_interest_data`, () => {
    return HttpResponse.json([]);
  }),

  http.options(`${SUPABASE_URL}/rest/v1/product_interest_data`, () => {
    return new HttpResponse(null, { status: 200 });
  }),

  http.delete(`${SUPABASE_URL}/rest/v1/product_interest_data`, () => {
    return HttpResponse.json({ count: 0 });
  }),

  // Video showcase data endpoints
  http.get(`${SUPABASE_URL}/rest/v1/video_showcase_data`, () => {
    return HttpResponse.json([]);
  }),

  http.options(`${SUPABASE_URL}/rest/v1/video_showcase_data`, () => {
    return new HttpResponse(null, { status: 200 });
  }),

  http.delete(`${SUPABASE_URL}/rest/v1/video_showcase_data`, () => {
    return HttpResponse.json({ count: 0 });
  }),

  // CTA tracking endpoints
  http.get(`${SUPABASE_URL}/rest/v1/cta_tracking`, () => {
    return HttpResponse.json([]);
  }),

  http.options(`${SUPABASE_URL}/rest/v1/cta_tracking`, () => {
    return new HttpResponse(null, { status: 200 });
  }),

  http.delete(`${SUPABASE_URL}/rest/v1/cta_tracking`, () => {
    return HttpResponse.json({ count: 0 });
  }),
];
