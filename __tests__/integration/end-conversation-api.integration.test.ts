import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/end-conversation/route';

// Mock the Tavus service
jest.mock('@/lib/services/tavus/integration-service', () => ({
  getTavusService: jest.fn(() => ({
    endConversationForDemo: jest.fn().mockResolvedValue({
      success: true,
      data: { conversation_id: 'test-conv-123', status: 'ended' }
    })
  }))
}));

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          error: null
        }))
      }))
    }))
  }
}));

describe('/api/end-conversation', () => {
  const mockTavusService = {
    endConversationForDemo: jest.fn()
  };

  const mockSupabase = {
    from: jest.fn(() => ({
      update: jest.fn(() => ({
        eq: jest.fn(() => ({ error: null }))
      }))
    }))
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mocks
    const { getTavusService } = require('@/lib/services/tavus/integration-service');
    getTavusService.mockReturnValue(mockTavusService);
    
    const { supabase } = require('@/lib/supabase');
    Object.assign(supabase, mockSupabase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should end conversation successfully', async () => {
    mockTavusService.endConversationForDemo.mockResolvedValue({
      success: true,
      data: { conversation_id: 'test-conv-123', status: 'ended' }
    });

    const request = new NextRequest('http://localhost:3000/api/end-conversation', {
      method: 'POST',
      body: JSON.stringify({
        demoId: 'test-demo-123',
        conversationId: 'test-conv-123'
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Conversation ended successfully');
    expect(mockTavusService.endConversationForDemo).toHaveBeenCalledWith(
      'test-demo-123',
      null,
      'test-conv-123',
      expect.any(Object)
    );
  });

  it('should handle missing demo ID', async () => {
    const request = new NextRequest('http://localhost:3000/api/end-conversation', {
      method: 'POST',
      body: JSON.stringify({
        conversationId: 'test-conv-123'
        // Missing demoId
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Demo ID is required');
  });

  it('should handle conversation end without conversation ID', async () => {
    const request = new NextRequest('http://localhost:3000/api/end-conversation', {
      method: 'POST',
      body: JSON.stringify({
        demoId: 'test-demo-123'
        // No conversationId
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockTavusService.endConversationForDemo).not.toHaveBeenCalled();
  });

  it('should continue even if Tavus API fails', async () => {
    mockTavusService.endConversationForDemo.mockResolvedValue({
      success: false,
      error: 'Tavus API error'
    });

    const request = new NextRequest('http://localhost:3000/api/end-conversation', {
      method: 'POST',
      body: JSON.stringify({
        demoId: 'test-demo-123',
        conversationId: 'test-conv-123'
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Conversation ended successfully');
  });

  it('should continue even if database update fails', async () => {
    mockTavusService.endConversationForDemo.mockResolvedValue({
      success: true,
      data: { conversation_id: 'test-conv-123', status: 'ended' }
    });

    // Mock database error
    const mockUpdate = jest.fn(() => ({
      eq: jest.fn(() => ({ error: 'Database error' }))
    }));
    mockSupabase.from.mockReturnValue({ update: mockUpdate });

    const request = new NextRequest('http://localhost:3000/api/end-conversation', {
      method: 'POST',
      body: JSON.stringify({
        demoId: 'test-demo-123',
        conversationId: 'test-conv-123'
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Conversation ended successfully');
  });

  it('should handle malformed JSON', async () => {
    const request = new NextRequest('http://localhost:3000/api/end-conversation', {
      method: 'POST',
      body: 'invalid json',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to end conversation');
    expect(data.details).toBeDefined();
  });

  it('should handle service exceptions', async () => {
    mockTavusService.endConversationForDemo.mockRejectedValue(
      new Error('Service unavailable')
    );

    const request = new NextRequest('http://localhost:3000/api/end-conversation', {
      method: 'POST',
      body: JSON.stringify({
        demoId: 'test-demo-123',
        conversationId: 'test-conv-123'
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to end conversation');
    expect(data.details).toBe('Service unavailable');
  });
});