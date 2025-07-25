import { http, HttpResponse } from 'msw';

const MOCK_API_URL = 'http://localhost';

export const handlers = [
  http.get('/api/elevenlabs/voices', () => {
    return HttpResponse.json({
      voices: [
        { voice_id: 'voice_1', name: 'Rachel' },
        { voice_id: 'voice_2', name: 'Adam' },
      ],
    });
  }),
  // Mock the create-agent API endpoint
  http.post(`${MOCK_API_URL}/api/create-agent`, () => {
    return HttpResponse.json({
      message: 'Agent created successfully.',
      agentId: 'agent_mock_12345',
      shareableLink: 'https://app.tavus.io/share/agent_mock_12345',
    });
  }),
];
