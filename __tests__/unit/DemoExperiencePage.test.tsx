import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import DemoExperiencePage from '@/app/demos/[demoId]/experience/page';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          order: jest.fn(() => ({
            // For video titles query
            eq: jest.fn(() => ({
              order: jest.fn(() => Promise.resolve({ data: [], error: null }))
            }))
          }))
        }))
      }))
    }))
  }
}));

// Mock CVI Provider
jest.mock('@/components/features/cvi/components/cvi-provider', () => ({
  CVIProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="cvi-provider">{children}</div>
}));

// Mock child components
jest.mock('@/app/demos/[demoId]/experience/components/TavusConversationCVI', () => ({
  TavusConversationCVI: () => <div data-testid="tavus-conversation-cvi">Tavus CVI</div>
}));

jest.mock('@/app/demos/[demoId]/experience/components/ConversationInterface', () => ({
  ConversationInterface: () => <div data-testid="conversation-interface">Conversation Interface</div>
}));

jest.mock('@/app/demos/[demoId]/experience/components/DemoHeader', () => ({
  DemoHeader: ({ demo, demoId }: { demo: any, demoId: string }) => (
    <div data-testid="demo-header">
      Demo Header - {demo?.name || 'Loading'} ({demoId})
    </div>
  )
}));

jest.mock('@/app/demos/[demoId]/experience/components/StatusIndicators', () => ({
  StatusIndicators: () => <div data-testid="status-indicators">Status Indicators</div>
}));

jest.mock('@/app/demos/[demoId]/experience/components/VideoControls', () => ({
  VideoControls: () => <div data-testid="video-controls">Video Controls</div>
}));

jest.mock('@/app/demos/[demoId]/experience/components/CTABanner', () => ({
  CTABanner: () => <div data-testid="cta-banner">CTA Banner</div>
}));

const mockUseParams = useParams as jest.MockedFunction<typeof useParams>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>;

describe('DemoExperiencePage', () => {
  const mockPush = jest.fn();
  const mockRouter = { push: mockPush };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseParams.mockReturnValue({ demoId: 'test-demo-123' });
    mockUseRouter.mockReturnValue(mockRouter as any);
    mockUseSearchParams.mockReturnValue({
      get: jest.fn().mockReturnValue(null)
    } as any);

    // Set E2E mode to true for predictable testing
    process.env.NEXT_PUBLIC_E2E_TEST_MODE = 'true';
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_E2E_TEST_MODE;
  });

  test('renders loading state initially when not in E2E mode', async () => {
    // Disable E2E mode to test loading state
    delete process.env.NEXT_PUBLIC_E2E_TEST_MODE;

    // Mock Supabase to delay response
    const { supabase } = require('@/lib/supabase');
    supabase.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => new Promise(resolve => setTimeout(() => resolve({ data: null, error: { message: 'Demo not found' } }), 100)))
        }))
      }))
    });

    render(<DemoExperiencePage />);

    // Should show loading initially
    expect(screen.getByText('Loading demo...')).toBeInTheDocument();
    
    // Wait for the async operation to complete
    await waitFor(() => {
      expect(screen.getByText('Demo Error')).toBeInTheDocument();
    });
  });

  test('renders demo experience page in E2E mode', async () => {
    render(<DemoExperiencePage />);

    // Wait for E2E stub data to load
    await waitFor(() => {
      expect(screen.getByTestId('demo-header')).toBeInTheDocument();
    });

    expect(screen.getByTestId('cvi-provider')).toBeInTheDocument();
    expect(screen.getByTestId('demo-header')).toHaveTextContent('E2E Demo');
    expect(screen.getByTestId('status-indicators')).toBeInTheDocument();
    expect(screen.getByTestId('video-controls')).toBeInTheDocument();
    expect(screen.getByTestId('cta-banner')).toBeInTheDocument();
  });

  test('handles different demo IDs correctly', async () => {
    mockUseParams.mockReturnValue({ demoId: 'different-demo-456' });

    render(<DemoExperiencePage />);

    await waitFor(() => {
      expect(screen.getByTestId('demo-header')).toBeInTheDocument();
    });

    expect(screen.getByTestId('demo-header')).toHaveTextContent('different-demo-456');
  });

  test('handles forceNew parameter', async () => {
    mockUseSearchParams.mockReturnValue({
      get: jest.fn().mockImplementation((param) => {
        if (param === 'forceNew') return 'true';
        return null;
      })
    } as any);

    render(<DemoExperiencePage />);

    await waitFor(() => {
      expect(screen.getByTestId('demo-header')).toBeInTheDocument();
    });

    // In E2E mode, should still render normally
    expect(screen.getByTestId('demo-header')).toHaveTextContent('E2E Demo');
  });

  test('renders error state when demo not found', async () => {
    // Disable E2E mode to test real error handling
    delete process.env.NEXT_PUBLIC_E2E_TEST_MODE;

    // Mock Supabase to return error
    const { supabase } = require('@/lib/supabase');
    supabase.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: { message: 'Demo not found' } }))
        }))
      }))
    });

    render(<DemoExperiencePage />);

    await waitFor(() => {
      expect(screen.getByText('Demo Error')).toBeInTheDocument();
    });

    expect(screen.getByText('Demo not found')).toBeInTheDocument();
    expect(screen.getByText('Return to Dashboard')).toBeInTheDocument();
  });

  test('handles return to dashboard navigation', async () => {
    // Disable E2E mode to test error state
    delete process.env.NEXT_PUBLIC_E2E_TEST_MODE;

    const { supabase } = require('@/lib/supabase');
    supabase.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: { message: 'Demo not found' } }))
        }))
      }))
    });

    render(<DemoExperiencePage />);

    await waitFor(() => {
      expect(screen.getByText('Return to Dashboard')).toBeInTheDocument();
    });

    const returnButton = screen.getByText('Return to Dashboard');
    returnButton.click();

    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  test('applies correct CSS classes and styling', async () => {
    render(<DemoExperiencePage />);

    await waitFor(() => {
      expect(screen.getByTestId('cvi-provider')).toBeInTheDocument();
    });

    // Check that the main container inside CVI provider has correct classes
    const mainContainer = screen.getByTestId('cvi-provider').querySelector('.min-h-screen');
    expect(mainContainer).toHaveClass('min-h-screen', 'bg-gray-50', 'relative');
  });

  test('handles different viewport configurations', async () => {
    // Mock window object for viewport testing
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    render(<DemoExperiencePage />);

    await waitFor(() => {
      expect(screen.getByTestId('demo-header')).toBeInTheDocument();
    });

    // Component should render regardless of viewport size
    expect(screen.getByTestId('cvi-provider')).toBeInTheDocument();
  });

  test('handles navigation from configure page', async () => {
    // Simulate navigation from configure page
    mockUseSearchParams.mockReturnValue({
      get: jest.fn().mockImplementation((param) => {
        if (param === 'from') return 'configure';
        return null;
      })
    } as any);

    render(<DemoExperiencePage />);

    await waitFor(() => {
      expect(screen.getByTestId('demo-header')).toBeInTheDocument();
    });

    // Should render normally regardless of source
    expect(screen.getByTestId('demo-header')).toHaveTextContent('E2E Demo');
  });

  test('maintains demo context throughout component lifecycle', async () => {
    render(<DemoExperiencePage />);

    await waitFor(() => {
      expect(screen.getByTestId('demo-header')).toBeInTheDocument();
    });

    // Demo context should be maintained
    expect(screen.getByTestId('demo-header')).toHaveTextContent('E2E Demo (test-demo-123)');
  });
});