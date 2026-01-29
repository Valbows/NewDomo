/**
 * Tests for DemoExperiencePage
 *
 * These tests capture the critical behaviors of the experience page
 * to ensure they are preserved during refactoring:
 *
 * 1. Demo fetch and conversation start
 * 2. beforeunload handler for conversation cleanup
 * 3. Supabase Realtime subscription handlers
 * 4. Tool call handling (fetch_video, pause_video, etc.)
 * 5. Video player controls
 * 6. CTA display and click tracking
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// Mock Next.js navigation
const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
  replace: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useParams: () => ({ demoId: 'test-demo-123' }),
  useSearchParams: () => ({
    get: jest.fn().mockReturnValue(null),
  }),
}));

// Create mock channel with spies
const mockChannelOn = jest.fn().mockReturnThis();
const mockChannelSubscribe = jest.fn().mockImplementation((callback) => {
  if (callback) callback('SUBSCRIBED');
  return { on: mockChannelOn, subscribe: mockChannelSubscribe };
});
const mockChannel = {
  on: mockChannelOn,
  subscribe: mockChannelSubscribe,
};

// Create mock Supabase with spies
const mockFrom = jest.fn().mockReturnThis();
const mockSelect = jest.fn().mockReturnThis();
const mockEq = jest.fn().mockReturnThis();
const mockIlike = jest.fn().mockReturnThis();
const mockSingle = jest.fn();
const mockStorageFrom = jest.fn().mockReturnThis();
const mockCreateSignedUrl = jest.fn();
const mockSupabaseChannel = jest.fn().mockReturnValue(mockChannel);
const mockRemoveChannel = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: any[]) => {
      mockFrom(...args);
      return {
        select: (...args: any[]) => {
          mockSelect(...args);
          return {
            eq: (...args: any[]) => {
              mockEq(...args);
              return {
                single: () => mockSingle(),
                maybeSingle: () => mockSingle(),
                ilike: (...args: any[]) => {
                  mockIlike(...args);
                  return {
                    single: () => mockSingle(),
                    maybeSingle: () => mockSingle(),
                    limit: jest.fn().mockResolvedValue({ data: [], error: null }),
                  };
                },
                order: jest.fn().mockResolvedValue({ data: [], error: null }),
                limit: jest.fn().mockResolvedValue({ data: [], error: null }),
              };
            },
          };
        },
      };
    },
    channel: (name: string) => mockSupabaseChannel(name),
    removeChannel: (ch: any) => mockRemoveChannel(ch),
    storage: {
      from: (...args: any[]) => {
        mockStorageFrom(...args);
        return {
          createSignedUrl: (...args: any[]) => mockCreateSignedUrl(...args),
        };
      },
    },
  },
}));

// Mock CVIProvider
jest.mock('@/components/cvi/components/cvi-provider', () => ({
  CVIProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="cvi-provider">{children}</div>,
}));

// Mock ResourcesPanel
jest.mock('@/components/resources', () => ({
  ResourcesPanel: () => <div data-testid="resources-panel">Resources Panel</div>,
}));

// Mock AgentHeader
jest.mock('@/components/conversation/AgentHeader', () => ({
  AgentHeader: () => <div data-testid="agent-header">Agent Header</div>,
}));

// Mock TextInputBar
jest.mock('@/components/conversation/TextInputBar', () => ({
  TextInputBar: () => <div data-testid="text-input-bar">Text Input Bar</div>,
}));

// Mock AgentConversationView (replaced TavusConversationCVI)
// Note: onToolCall is called as onToolCall(toolName, args) with two arguments
jest.mock('@/components/conversation/AgentConversationView', () => ({
  AgentConversationView: ({ onLeave, onToolCall }: any) => (
    <div data-testid="agent-conversation">
      <button data-testid="trigger-leave" onClick={onLeave}>Leave</button>
      <button data-testid="trigger-fetch-video" onClick={() => onToolCall('fetch_video', { title: 'Test Video' })}>Fetch Video</button>
      <button data-testid="trigger-pause-video" onClick={() => onToolCall('pause_video', {})}>Pause Video</button>
      <button data-testid="trigger-resume-video" onClick={() => onToolCall('resume_video', {})}>Resume Video</button>
      <button data-testid="trigger-close-video" onClick={() => onToolCall('close_video', {})}>Close Video</button>
      <button data-testid="trigger-next-video" onClick={() => onToolCall('next_video', {})}>Next Video</button>
      <button data-testid="trigger-show-cta" onClick={() => onToolCall('show_trial_cta', {})}>Show CTA</button>
      <button data-testid="trigger-play-video" onClick={() => onToolCall('fetch_video', { title: 'Test Video' })}>Play Video</button>
    </div>
  ),
}));

// Mock InlineVideoPlayer
const mockVideoPlayerPlay = jest.fn().mockResolvedValue(undefined);
const mockVideoPlayerPause = jest.fn();
const mockVideoPlayerGetCurrentTime = jest.fn().mockReturnValue(0);
const mockVideoPlayerSetVolume = jest.fn();

jest.mock('@/app/demos/[demoId]/experience/components/InlineVideoPlayer', () => ({
  InlineVideoPlayer: React.forwardRef(({ onClose, onVideoEnd }: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      play: mockVideoPlayerPlay,
      pause: mockVideoPlayerPause,
      isPaused: jest.fn().mockReturnValue(false),
      getCurrentTime: mockVideoPlayerGetCurrentTime,
      seekTo: jest.fn(),
      setVolume: mockVideoPlayerSetVolume,
    }));
    return (
      <div data-testid="inline-video-player">
        <button data-testid="video-close" onClick={onClose}>Close</button>
        <button data-testid="video-end" onClick={onVideoEnd}>End Video</button>
      </div>
    );
  }),
}));

// Mock fetch - need to override before MSW
const mockFetch = jest.fn();

// Store original fetch
const originalFetch = global.fetch;

beforeAll(() => {
  // Override fetch to bypass MSW
  global.fetch = mockFetch as any;
});

afterAll(() => {
  global.fetch = originalFetch;
});

// Mock navigator.sendBeacon
const mockSendBeacon = jest.fn().mockReturnValue(true);
Object.defineProperty(navigator, 'sendBeacon', {
  value: mockSendBeacon,
  writable: true,
});

// Import component after mocks
import DemoExperiencePage from '@/app/demos/[demoId]/experience/page';

describe('DemoExperiencePage', () => {
  const mockDemoData = {
    id: 'test-demo-123',
    name: 'Test Demo',
    user_id: 'user-123',
    tavus_conversation_id: 'conv-456',
    metadata: {
      agentName: 'Test Agent',
      ctaTitle: 'Get Started',
      ctaMessage: 'Try it now',
      ctaButtonText: 'Start',
      ctaButtonUrl: 'https://example.com',
    },
    cta_title: 'Admin CTA Title',
    cta_message: 'Admin CTA Message',
    cta_button_text: 'Admin Button',
    cta_button_url: 'https://admin.example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset Supabase mock
    mockSingle.mockResolvedValue({ data: mockDemoData, error: null });
    mockCreateSignedUrl.mockResolvedValue({
      data: { signedUrl: 'https://storage.example.com/video.mp4' },
      error: null,
    });

    // Reset fetch mock
    mockFetch.mockImplementation((url: string) => {
      if (url === '/api/start-conversation') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ conversation_url: 'https://tavus.daily.co/test-room' }),
        });
      }
      if (url.includes('/api/track-video-view') || url.includes('/api/track-cta-click')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      if (url === '/api/end-conversation') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      if (url.includes('/api/sync-tavus-conversations')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    // Reset channel mock
    mockChannelOn.mockClear().mockReturnThis();
    mockChannelSubscribe.mockClear().mockImplementation((callback) => {
      if (callback) callback('SUBSCRIBED');
      return mockChannel;
    });
  });

  describe('Demo Fetch and Conversation Start', () => {
    it('fetches demo data on mount', async () => {
      render(<DemoExperiencePage />);

      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledWith('demos');
        expect(mockEq).toHaveBeenCalledWith('id', 'test-demo-123');
      });
    });

    it('calls start-conversation API after fetching demo', async () => {
      render(<DemoExperiencePage />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/start-conversation', expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('test-demo-123'),
        }));
      });
    });

    it('displays AI Demo Assistant header', async () => {
      render(<DemoExperiencePage />);

      await waitFor(() => {
        // The header now shows "AI Demo Assistant" instead of the demo name
        expect(screen.getByText('AI Demo Assistant')).toBeInTheDocument();
      });
    });

    it('shows error when demo not found', async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } });

      render(<DemoExperiencePage />);

      await waitFor(() => {
        expect(screen.getByText('Demo not found')).toBeInTheDocument();
      });
    });
  });

  describe('beforeunload Handler', () => {
    it('sends beacon on window beforeunload', async () => {
      render(<DemoExperiencePage />);

      await waitFor(() => {
        expect(screen.getByTestId('agent-conversation')).toBeInTheDocument();
      });

      // Trigger beforeunload event
      const event = new Event('beforeunload');
      window.dispatchEvent(event);

      expect(mockSendBeacon).toHaveBeenCalledWith(
        '/api/end-conversation',
        expect.stringContaining('conv-456')
      );
    });

    it('includes demoId in beacon payload', async () => {
      render(<DemoExperiencePage />);

      await waitFor(() => {
        expect(screen.getByTestId('agent-conversation')).toBeInTheDocument();
      });

      const event = new Event('beforeunload');
      window.dispatchEvent(event);

      expect(mockSendBeacon).toHaveBeenCalledWith(
        '/api/end-conversation',
        expect.stringContaining('test-demo-123')
      );
    });
  });

  describe('Supabase Realtime Subscriptions', () => {
    it('subscribes to demo channel on mount', async () => {
      render(<DemoExperiencePage />);

      await waitFor(() => {
        expect(mockSupabaseChannel).toHaveBeenCalledWith('demo-test-demo-123');
      });
    });

    it('registers broadcast handlers for play_video event', async () => {
      render(<DemoExperiencePage />);

      await waitFor(() => {
        expect(mockChannelOn).toHaveBeenCalledWith(
          'broadcast',
          { event: 'play_video' },
          expect.any(Function)
        );
      });
    });

    it('registers broadcast handlers for show_trial_cta event', async () => {
      render(<DemoExperiencePage />);

      await waitFor(() => {
        expect(mockChannelOn).toHaveBeenCalledWith(
          'broadcast',
          { event: 'show_trial_cta' },
          expect.any(Function)
        );
      });
    });

    it('registers broadcast handlers for analytics_updated event', async () => {
      render(<DemoExperiencePage />);

      await waitFor(() => {
        expect(mockChannelOn).toHaveBeenCalledWith(
          'broadcast',
          { event: 'analytics_updated' },
          expect.any(Function)
        );
      });
    });

    it('calls subscribe after registering handlers', async () => {
      render(<DemoExperiencePage />);

      await waitFor(() => {
        expect(mockChannelSubscribe).toHaveBeenCalled();
      });
    });
  });

  describe('Tool Call Handling', () => {
    it('handles fetch_video tool call', async () => {
      // Mock video lookup
      let callCount = 0;
      mockSingle.mockImplementation(() => {
        callCount++;
        // First call is demo data, subsequent are video queries
        if (callCount === 1) {
          return Promise.resolve({ data: mockDemoData, error: null });
        }
        return Promise.resolve({
          data: { storage_url: 'videos/test.mp4', title: 'Test Video' },
          error: null,
        });
      });

      render(<DemoExperiencePage />);

      await waitFor(() => {
        expect(screen.getByTestId('agent-conversation')).toBeInTheDocument();
      });

      // Trigger fetch_video tool call
      await act(async () => {
        fireEvent.click(screen.getByTestId('trigger-fetch-video'));
      });

      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledWith('demo_videos');
      });
    });

    it('handles pause_video tool call', async () => {
      render(<DemoExperiencePage />);

      await waitFor(() => {
        expect(screen.getByTestId('agent-conversation')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('trigger-pause-video'));
      });

      // Pause is handled - no error thrown
    });

    it('handles show_trial_cta tool call', async () => {
      render(<DemoExperiencePage />);

      await waitFor(() => {
        expect(screen.getByTestId('agent-conversation')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('trigger-show-cta'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('cta-banner')).toBeInTheDocument();
      });
    });

    it('handles close_video tool call', async () => {
      render(<DemoExperiencePage />);

      await waitFor(() => {
        expect(screen.getByTestId('agent-conversation')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('trigger-close-video'));
      });

      // Video should be closed - no video overlay visible
      expect(screen.queryByTestId('video-overlay')).not.toBeInTheDocument();
    });
  });

  describe('CTA Display and Click Tracking', () => {
    it('displays CTA with admin-level fields (priority over metadata)', async () => {
      render(<DemoExperiencePage />);

      await waitFor(() => {
        expect(screen.getByTestId('agent-conversation')).toBeInTheDocument();
      });

      // Trigger CTA display
      await act(async () => {
        fireEvent.click(screen.getByTestId('trigger-show-cta'));
      });

      await waitFor(() => {
        expect(screen.getByText('Admin CTA Title')).toBeInTheDocument();
        expect(screen.getByText('Admin CTA Message')).toBeInTheDocument();
        expect(screen.getByText('Admin Button')).toBeInTheDocument();
      });
    });

    it('tracks CTA click', async () => {
      render(<DemoExperiencePage />);

      await waitFor(() => {
        expect(screen.getByTestId('agent-conversation')).toBeInTheDocument();
      });

      // Show CTA
      await act(async () => {
        fireEvent.click(screen.getByTestId('trigger-show-cta'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('cta-banner')).toBeInTheDocument();
      });

      // Click CTA button
      const ctaButton = screen.getByText('Admin Button');
      await act(async () => {
        fireEvent.click(ctaButton);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/track-cta-click', expect.objectContaining({
          method: 'POST',
        }));
      });
    });

    it('can close CTA banner', async () => {
      render(<DemoExperiencePage />);

      await waitFor(() => {
        expect(screen.getByTestId('agent-conversation')).toBeInTheDocument();
      });

      // Show CTA
      await act(async () => {
        fireEvent.click(screen.getByTestId('trigger-show-cta'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('cta-banner')).toBeInTheDocument();
      });

      // Close CTA
      const closeButton = screen.getByLabelText('Close CTA');
      await act(async () => {
        fireEvent.click(closeButton);
      });

      await waitFor(() => {
        expect(screen.queryByTestId('cta-banner')).not.toBeInTheDocument();
      });
    });
  });

  describe('Conversation End', () => {
    it('calls end-conversation API when conversation ends', async () => {
      render(<DemoExperiencePage />);

      await waitFor(() => {
        expect(screen.getByTestId('agent-conversation')).toBeInTheDocument();
      });

      // Trigger leave
      await act(async () => {
        fireEvent.click(screen.getByTestId('trigger-leave'));
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/end-conversation', expect.objectContaining({
          method: 'POST',
        }));
      });
    });

    it('redirects to configure page with reporting tab after conversation ends', async () => {
      // Use fake timers for this test since there's a 1s delay before redirect
      jest.useFakeTimers();

      render(<DemoExperiencePage />);

      await waitFor(() => {
        expect(screen.getByTestId('agent-conversation')).toBeInTheDocument();
      });

      // Trigger leave
      await act(async () => {
        fireEvent.click(screen.getByTestId('trigger-leave'));
      });

      // Fast-forward past the 1 second delay in handleConversationEnd
      await act(async () => {
        jest.advanceTimersByTime(1500);
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/demos/test-demo-123/reporting');
      });

      jest.useRealTimers();
    });

    it('syncs conversation data after ending', async () => {
      render(<DemoExperiencePage />);

      await waitFor(() => {
        expect(screen.getByTestId('agent-conversation')).toBeInTheDocument();
      });

      // Trigger leave
      await act(async () => {
        fireEvent.click(screen.getByTestId('trigger-leave'));
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/sync-tavus-conversations'),
          expect.any(Object)
        );
      });
    });
  });

  describe('Video Player Controls', () => {
    it('displays video overlay when video is playing', async () => {
      render(<DemoExperiencePage />);

      await waitFor(() => {
        expect(screen.getByTestId('agent-conversation')).toBeInTheDocument();
      });

      // Trigger play_video tool call (not fetch_video)
      await act(async () => {
        fireEvent.click(screen.getByTestId('trigger-play-video'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('video-overlay')).toBeInTheDocument();
      });
    });

    it('shows inline video player in overlay', async () => {
      render(<DemoExperiencePage />);

      await waitFor(() => {
        expect(screen.getByTestId('agent-conversation')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('trigger-play-video'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('inline-video-player')).toBeInTheDocument();
      });
    });
  });

  describe('UI State Transitions', () => {
    it('shows loading state initially', () => {
      render(<DemoExperiencePage />);
      expect(screen.getByText('Loading demo...')).toBeInTheDocument();
    });

    it('shows conversation after loading', async () => {
      render(<DemoExperiencePage />);

      await waitFor(() => {
        expect(screen.getByTestId('agent-conversation')).toBeInTheDocument();
      });
    });

    it('hides conversation container when video starts playing', async () => {
      render(<DemoExperiencePage />);

      await waitFor(() => {
        expect(screen.getByTestId('agent-conversation')).toBeInTheDocument();
      });

      // Use play_video tool call to trigger video playing mode
      await act(async () => {
        fireEvent.click(screen.getByTestId('trigger-play-video'));
      });

      await waitFor(() => {
        const container = screen.getByTestId('conversation-container');
        // In the new layout, the conversation is visually hidden (moved off-screen) when video is playing
        expect(container).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });
});
