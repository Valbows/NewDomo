/**
 * Unit tests for DemoList component
 * Tests demo listing, loading states, and error handling
 */

import { render, screen, fireEvent } from '@testing-library/react';
import DemoList from '@/components/features/demos/DemoList';
import type { Demo } from '@/app/demos/[demoId]/configure/types';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

// Mock DemoListItem component
jest.mock('@/components/features/demos/DemoListItem', () => {
  return function MockDemoListItem({ demo }: { demo: any }) {
    return <div data-testid="demo-item">{demo.name}</div>;
  };
});

// Mock the useDemosRealtime hook
jest.mock('@/hooks/useDemosRealtime', () => ({
  useDemosRealtime: jest.fn(),
}));

import { useDemosRealtime } from '@/hooks/useDemosRealtime';
const mockUseDemosRealtime = useDemosRealtime as jest.MockedFunction<typeof useDemosRealtime>;

describe('DemoList Component', () => {
  const mockDemo: Demo = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Test Demo',
    user_id: 'user-123',
    tavus_conversation_id: 'conv-123',
    tavus_persona_id: 'persona-123',
    cta_title: null,
    cta_message: null,
    cta_button_text: null,
    cta_button_url: null,
    metadata: {
      analytics: {
        last_updated: '2024-01-01T00:00:00Z',
        conversations: {
          'conv-1': { status: 'completed' },
        },
      },
    },
    created_at: '2024-01-01T00:00:00Z',
  };

  const mockRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders demo list with title and create link', () => {
      mockUseDemosRealtime.mockReturnValue({
        demos: [],
        loading: false,
        error: null,
        refresh: mockRefresh,
      });

      render(<DemoList />);

      expect(screen.getByText('Your Demos')).toBeInTheDocument();
      expect(screen.getByText('Create new')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Create new' })).toHaveAttribute('href', '/demos/create');
    });

    it('displays demo list when demos are provided', () => {
      const demos = [mockDemo];
      
      render(<DemoList demos={demos} loading={false} error={null} />);

      expect(screen.getByText('Your Demos')).toBeInTheDocument();
      expect(screen.getByText('Test Demo')).toBeInTheDocument();
    });

    it('uses hook data when no props provided', () => {
      mockUseDemosRealtime.mockReturnValue({
        demos: [mockDemo],
        loading: false,
        error: null,
        refresh: mockRefresh,
      });

      render(<DemoList />);

      expect(screen.getByText('Test Demo')).toBeInTheDocument();
    });

    it('prioritizes prop data over hook data', () => {
      const propDemo = { ...mockDemo, name: 'Prop Demo' };
      
      mockUseDemosRealtime.mockReturnValue({
        demos: [mockDemo],
        loading: false,
        error: null,
        refresh: mockRefresh,
      });

      render(<DemoList demos={[propDemo]} loading={false} error={null} />);

      expect(screen.getByText('Prop Demo')).toBeInTheDocument();
      expect(screen.queryByText('Test Demo')).not.toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('displays loading skeletons when loading', () => {
      render(<DemoList demos={[]} loading={true} error={null} />);

      expect(screen.getByTestId('demo-list-skeletons')).toBeInTheDocument();
      expect(screen.getAllByTestId('demo-skeleton-item')).toHaveLength(3);
    });

    it('uses hook loading state when no props provided', () => {
      mockUseDemosRealtime.mockReturnValue({
        demos: [],
        loading: true,
        error: null,
        refresh: mockRefresh,
      });

      render(<DemoList />);

      expect(screen.getByTestId('demo-list-skeletons')).toBeInTheDocument();
    });

    it('shows loading skeletons with proper structure', () => {
      render(<DemoList demos={[]} loading={true} error={null} />);

      const skeletons = screen.getAllByTestId('demo-skeleton-item');
      expect(skeletons).toHaveLength(3);
      
      skeletons.forEach(skeleton => {
        expect(skeleton).toHaveClass('animate-pulse');
        expect(skeleton).toHaveClass('bg-white');
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message with retry button', () => {
      const errorMessage = 'Failed to load demos';
      
      render(<DemoList demos={[]} loading={false} error={errorMessage} onRefresh={mockRefresh} />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByTestId('demo-list-retry')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('calls refresh function when retry button is clicked', () => {
      const errorMessage = 'Failed to load demos';
      
      render(<DemoList demos={[]} loading={false} error={errorMessage} onRefresh={mockRefresh} />);

      const retryButton = screen.getByTestId('demo-list-retry');
      fireEvent.click(retryButton);

      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });

    it('uses hook error and refresh when no props provided', () => {
      mockUseDemosRealtime.mockReturnValue({
        demos: [],
        loading: false,
        error: 'Hook error',
        refresh: mockRefresh,
      });

      render(<DemoList />);

      expect(screen.getByText('Hook error')).toBeInTheDocument();
      
      const retryButton = screen.getByTestId('demo-list-retry');
      fireEvent.click(retryButton);

      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });

    it('displays error with proper styling', () => {
      render(<DemoList demos={[]} loading={false} error="Test error" onRefresh={mockRefresh} />);

      const errorContainer = screen.getByText('Test error').closest('div');
      expect(errorContainer).toHaveClass('text-red-700');
      expect(errorContainer).toHaveClass('bg-red-50');
      expect(errorContainer).toHaveClass('border-red-100');
    });
  });

  describe('Empty States', () => {
    it('displays empty message when no demos and not loading', () => {
      mockUseDemosRealtime.mockReturnValue({
        demos: [],
        loading: false,
        error: null,
        refresh: mockRefresh,
      });

      render(<DemoList demos={[]} loading={false} error={null} />);

      expect(screen.getByText('No demos yet. Create your first demo to get started.')).toBeInTheDocument();
    });

    it('does not show empty message when loading', () => {
      render(<DemoList demos={[]} loading={true} error={null} />);

      expect(screen.queryByText('No demos yet. Create your first demo to get started.')).not.toBeInTheDocument();
    });

    it('does not show empty message when there is an error', () => {
      render(<DemoList demos={[]} loading={false} error="Some error" onRefresh={mockRefresh} />);

      expect(screen.queryByText('No demos yet. Create your first demo to get started.')).not.toBeInTheDocument();
    });
  });

  describe('Demo Rendering', () => {
    it('renders multiple demos', () => {
      const demos = [
        mockDemo,
        { ...mockDemo, id: 'demo-2', name: 'Second Demo' },
        { ...mockDemo, id: 'demo-3', name: 'Third Demo' },
      ];

      render(<DemoList demos={demos} loading={false} error={null} />);

      expect(screen.getByText('Test Demo')).toBeInTheDocument();
      expect(screen.getByText('Second Demo')).toBeInTheDocument();
      expect(screen.getByText('Third Demo')).toBeInTheDocument();
    });

    it('passes demo data to DemoListItem components', () => {
      render(<DemoList demos={[mockDemo]} loading={false} error={null} />);

      // Check that demo data is rendered (DemoListItem should display this)
      expect(screen.getByText('Test Demo')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<DemoList demos={[]} loading={false} error={null} />);

      const demoList = screen.getByTestId('demo-list');
      expect(demoList).toHaveAttribute('aria-busy', 'false');
      expect(demoList).toHaveAttribute('aria-live', 'polite');
    });

    it('updates aria-busy when loading', () => {
      render(<DemoList demos={[]} loading={true} error={null} />);

      const demoList = screen.getByTestId('demo-list');
      expect(demoList).toHaveAttribute('aria-busy', 'true');
    });

    it('has accessible retry button', () => {
      render(<DemoList demos={[]} loading={false} error="Error" onRefresh={mockRefresh} />);

      const retryButton = screen.getByTestId('demo-list-retry');
      expect(retryButton).toBeEnabled();
    });
  });

  describe('Hook Integration', () => {
    it('disables analytics subscription when demos are provided via props', () => {
      render(<DemoList demos={[mockDemo]} loading={false} error={null} />);

      expect(mockUseDemosRealtime).toHaveBeenCalledWith({ subscribeToAnalyticsUpdated: false });
    });

    it('enables analytics subscription when using hook data', () => {
      mockUseDemosRealtime.mockReturnValue({
        demos: [],
        loading: false,
        error: null,
        refresh: mockRefresh,
      });

      render(<DemoList />);

      expect(mockUseDemosRealtime).toHaveBeenCalledWith({ subscribeToAnalyticsUpdated: true });
    });
  });

  describe('Edge Cases', () => {
    it('handles null demos gracefully', () => {
      render(<DemoList demos={null as any} loading={false} error={null} />);

      expect(screen.getByText('No demos yet. Create your first demo to get started.')).toBeInTheDocument();
    });

    it('handles undefined demos gracefully', () => {
      render(<DemoList demos={undefined as any} loading={false} error={null} />);

      expect(screen.getByText('No demos yet. Create your first demo to get started.')).toBeInTheDocument();
    });

    it('handles demos with missing properties', () => {
      const incompleteDemo = {
        id: 'incomplete',
        name: 'Incomplete Demo',
        // Missing other required properties
      } as Demo;

      render(<DemoList demos={[incompleteDemo]} loading={false} error={null} />);

      expect(screen.getByText('Incomplete Demo')).toBeInTheDocument();
    });
  });
});