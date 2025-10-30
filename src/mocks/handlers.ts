import { http, HttpResponse } from 'msw';

const MOCK_API_URL = 'http://localhost:3000';

export const handlers = [
  // Align with API route which returns an array of voices
  http.get(`${MOCK_API_URL}/api/elevenlabs/voices`, () => {
    return HttpResponse.json([
      { voice_id: 'voice_1', name: 'Rachel' },
      { voice_id: 'voice_2', name: 'Adam' },
    ]);
  }),

  // Mock Tavus create video endpoint to avoid external dependency in tests
  http.post(`${MOCK_API_URL}/api/tavus`, async ({ request }) => {
    // Validate minimal payload presence but always return a non-401 status
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
  // Mock the create-agent API endpoint
  http.post(`${MOCK_API_URL}/api/demos/agents/create`, () => {
    return HttpResponse.json({
      message: 'Agent created successfully.',
      agentId: 'agent_mock_12345',
      shareableLink: 'https://app.tavus.io/share/agent_mock_12345',
    });
  }),
];
