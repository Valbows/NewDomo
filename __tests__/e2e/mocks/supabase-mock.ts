/**
 * Mock Supabase client for CI testing
 */

// Mock demo data that matches the expected structure
export const mockDemo = {
  id: 'bbd9ffac-f4b7-4df3-9b8a-a01748c9a44b',
  name: 'E2E Test Demo',
  user_id: 'test-user-id',
  tavus_persona_id: 'test-persona-id',
  video_storage_path: 'test-videos/',
  cta_button_url: 'https://example.com/cta',
  metadata: {
    uploadId: 'bbd9ffac-f4b7-4df3-9b8a-a01748c9a44b',
    userId: 'test-user-id',
    fileName: 'test-demo.json',
    fileType: 'application/json',
    fileSize: '1024',
    uploadTimestamp: new Date().toISOString(),
    agentName: 'E2E Test Agent',
    agentPersonality: 'Helpful and friendly',
    agentGreeting: 'Hello! Welcome to our demo.',
    ctaTitle: 'Ready to Get Started?',
    ctaMessage: 'Start your free trial today!',
    ctaButtonText: 'Start Free Trial'
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

// Mock videos data
export const mockVideos = [
  {
    id: 'video-1',
    demo_id: 'bbd9ffac-f4b7-4df3-9b8a-a01748c9a44b',
    title: 'E2E Test Video',
    file_path: 'test-videos/video1.mp4',
    created_at: new Date().toISOString()
  },
  {
    id: 'video-2',
    demo_id: 'bbd9ffac-f4b7-4df3-9b8a-a01748c9a44b',
    title: 'E2E Second Video',
    file_path: 'test-videos/video2.mp4',
    created_at: new Date().toISOString()
  }
];

// Mock knowledge chunks
export const mockKnowledgeChunks = [
  {
    id: 'knowledge-1',
    demo_id: 'bbd9ffac-f4b7-4df3-9b8a-a01748c9a44b',
    question: 'What is this demo about?',
    answer: 'This is an E2E test demo for our application.',
    created_at: new Date().toISOString()
  }
];

// Mock conversation data
export const mockConversationData = [
  {
    id: 'conversation-1',
    demo_id: 'bbd9ffac-f4b7-4df3-9b8a-a01748c9a44b',
    tavus_conversation_id: 'test-conversation-id',
    status: 'completed',
    duration: 120,
    created_at: new Date().toISOString()
  }
];

// Create a mock Supabase client that returns our test data
export const createMockSupabaseClient = () => {
  const mockFrom = (table: string) => {
    const mockQuery = {
      select: (columns?: string) => mockQuery,
      eq: (column: string, value: any) => mockQuery,
      single: () => {
        if (table === 'demos') {
          return Promise.resolve({ data: mockDemo, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      },
      then: (callback: (result: any) => any) => {
        let data;
        switch (table) {
          case 'demos':
            data = [mockDemo];
            break;
          case 'demo_videos':
            data = mockVideos;
            break;
          case 'knowledge_chunks':
            data = mockKnowledgeChunks;
            break;
          case 'conversation_details':
            data = mockConversationData;
            break;
          default:
            data = [];
        }
        return callback({ data, error: null });
      }
    };
    return mockQuery;
  };

  return {
    from: mockFrom,
    auth: {
      getUser: () => Promise.resolve({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null
      })
    }
  };
};