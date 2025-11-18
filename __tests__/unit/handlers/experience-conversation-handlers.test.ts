import { handleConversationEnd } from '@/app/demos/[demoId]/experience/handlers/conversationHandlers';
import { UIState } from '@/lib/tavus/UI_STATES';

describe('Experience Conversation Handlers', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('handleConversationEnd', () => {
    it('should end conversation and redirect to reporting', async () => {
      const demo = {
        id: 'demo1',
        tavus_conversation_id: 'conv123',
        name: 'Test Demo',
      };
      const setUiState = jest.fn();
      const router = {
        push: jest.fn(),
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ synced: true }),
        });

      await handleConversationEnd(
        demo as any,
        setUiState,
        router,
        'demo1'
      );

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 1100));

      expect(global.fetch).toHaveBeenCalledWith('/api/end-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: 'conv123',
          demoId: 'demo1',
        }),
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/sync-tavus-conversations?demoId=demo1', {
        method: 'GET',
      });

      expect(setUiState).toHaveBeenCalledWith(UIState.IDLE);
      expect(router.push).toHaveBeenCalledWith('/demos/demo1/configure?tab=reporting');
    });

    it('should handle end conversation API failure gracefully', async () => {
      const demo = {
        id: 'demo1',
        tavus_conversation_id: 'conv123',
        name: 'Test Demo',
      };
      const setUiState = jest.fn();
      const router = {
        push: jest.fn(),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      });

      await handleConversationEnd(
        demo as any,
        setUiState,
        router,
        'demo1'
      );

      expect(setUiState).toHaveBeenCalledWith(UIState.IDLE);
      expect(router.push).toHaveBeenCalledWith('/demos/demo1/configure?tab=reporting');
    });

    it('should handle sync failure gracefully', async () => {
      const demo = {
        id: 'demo1',
        tavus_conversation_id: 'conv123',
        name: 'Test Demo',
      };
      const setUiState = jest.fn();
      const router = {
        push: jest.fn(),
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        });

      await handleConversationEnd(
        demo as any,
        setUiState,
        router,
        'demo1'
      );

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 1100));

      expect(setUiState).toHaveBeenCalledWith(UIState.IDLE);
      expect(router.push).toHaveBeenCalledWith('/demos/demo1/configure?tab=reporting');
    });

    it('should work when conversation_id is not set', async () => {
      const demo = {
        id: 'demo1',
        tavus_conversation_id: null,
        name: 'Test Demo',
      };
      const setUiState = jest.fn();
      const router = {
        push: jest.fn(),
      };
      const mockFetch = global.fetch as jest.Mock;

      await handleConversationEnd(
        demo as any,
        setUiState,
        router,
        'demo1'
      );

      expect(mockFetch).not.toHaveBeenCalled();
      expect(setUiState).toHaveBeenCalledWith(UIState.IDLE);
      expect(router.push).toHaveBeenCalledWith('/demos/demo1/configure?tab=reporting');
    });

    it('should work when demo is null', async () => {
      const setUiState = jest.fn();
      const router = {
        push: jest.fn(),
      };
      const mockFetch = global.fetch as jest.Mock;

      await handleConversationEnd(
        null,
        setUiState,
        router,
        'demo1'
      );

      expect(mockFetch).not.toHaveBeenCalled();
      expect(setUiState).toHaveBeenCalledWith(UIState.IDLE);
      expect(router.push).toHaveBeenCalledWith('/demos/demo1/configure?tab=reporting');
    });
  });
});
