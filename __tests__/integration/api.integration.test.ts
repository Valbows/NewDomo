
describe('API Integration Tests', () => {
  const BASE_URL = 'http://localhost:3000';

  // Test for the Tavus API endpoint
  describe('POST /api/tavus', () => {
    it('should return a non-401 response, confirming the API key is valid', async () => {
      const response = await fetch(`${BASE_URL}/api/tavus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script: 'This is a test script for our integration test.',
          // A dummy voice_id is sufficient to test the API key authentication
          voice_id: 'dummy-voice-id',
        }),
      });

      // The critical assertion: A 401 status means the API key is invalid.
      // Any other status (e.g., 201 Created, 400 Bad Request for dummy data)
      // means the authentication was successful.
      expect(response.status).not.toBe(401);
    }, 10000); // 10 second timeout for external API calls
  });

  // Test for the ElevenLabs API endpoint
  describe('GET /api/elevenlabs/voices', () => {
    it('should fetch voices successfully and return a 200 OK status', async () => {
      const response = await fetch(`${BASE_URL}/api/elevenlabs/voices`);
      const data = await response.json();

      // This is the critical assertion. If this fails, the API key is invalid.
      expect(response.status).toBe(200);

      // Further checks to ensure the response is as expected
      expect(Array.isArray(data)).toBe(true);
      if (data.length > 0) {
        expect(data[0]).toHaveProperty('voice_id');
        expect(data[0]).toHaveProperty('name');
      }
    }, 10000); // 10 second timeout for external API calls
  });
});