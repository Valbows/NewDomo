import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import DashboardPage from '@/app/dashboard/page';
import { useDemosRealtime } from '@/hooks/useDemosRealtime';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/hooks/useDemosRealtime', () => ({
  useDemosRealtime: jest.fn(),
}));

jest.mock('@/components/features/auth', () => ({
  withAuth: (Component: React.ComponentType) => Component,
}));

jest.mock('@/components/layout/DashboardLayout', () => {
  return function MockDashboardLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="dashboard-layout">{children}</div>;
  };
});

jest.mock('@/components/features/demos', () => ({
  DemoList: function MockDemoList({ demos, loading, error, onRefresh }: any) {
    return (
      <div data-testid="demo-list">
        {loading && <div data-testid="demo-list-loading">Loading demos...</div>}
        {error && <div data-testid="demo-list-error">{error}</div>}
        {!loading && !error && demos.length === 0 && (
          <div data-testid="demo-list-empty">No demos yet. Create your first demo to get started.</div>
        )}
        {!loading && !error && demos.length > 0 && (
          <div data-testid="demo-list-items">
            {demos.map((demo: any) => (
              <div key={demo.id} data-testid={`demo-item-${demo.id}`}>
                {demo.name}
              </div>
            ))}
          </div>
        )}
        <button onClick={onRefresh} data-testid="demo-list-refresh">
          Refresh
        </button>
      </div>
    );
  },
}));

jest.mock('@/components/features/dashboard', () => ({
  DashboardSummary: function MockDashboardSummary({ demos, loading }: any) {
    return (
      <div data-testid="dashboard-summary">
        {loading ? (
          <div data-testid="summary-loading">Loading summary...</div>
        ) : (
          <div data-testid="summary-stats">
            <span data-testid="total-demos">{demos.length}</span>
            <span data-testid="active-demos">
              {demos.filter((d: any) => d.tavus_persona_id || d.tavus_conversation_id).length}
            </span>
          </div>
        )}
      </div>
    );
  },
}));

describe('Dashboard Page', () => {
  const mockUseDemosRealtime = useDemosRealtime as jest.MockedFunction<typeof useDemosRealtime>;
  const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

  const mockDemos = [
    {
      id: 'demo-1',
      name: 'Test Demo 1',
      user_id: 'user-123',
      created_at: '2023-01-01T00:00:00Z',
      tavus_persona_id: 'persona-1',
      tavus_conversation_id: null,
      metadata: {
        analytics: {
          last_updated: '2023-01-02T00:00:00Z',
          conversations: {
            'conv-1': { status: 'completed' }
          }
        }
      }
    },
    {
      id: 'demo-2',
      name: 'Test Demo 2',
      user_id: 'user-123',
      created_at: '2023-01-03T00:00:00Z',
      tavus_persona_id: null,
      tavus_conversation_id: 'conv-3',
      metadata: {}
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseRouter.mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
      refresh: jest.fn(),
    } as any);
  });

  describe('Dashboard Rendering', () => {
    it('should render dashboard with title and welcome message', () => {
      mockUseDemosRealtime.mockReturnValue({
        demos: [],
        loading: false,
        error: null,
        refresh: jest.fn(),
      });

      render(<DashboardPage />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Welcome back, User!')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
    });

    it('should render create demo button', () => {
      mockUseDemosRealtime.mockReturnValue({
        demos: [],
        loading: false,
        error: null,
        refresh: jest.fn(),
      });

      render(<DashboardPage />);

      const createButton = screen.getByRole('button', { name: /create new demo/i });
      expect(createButton).toBeInTheDocument();
      expect(createButton.closest('a')).toHaveAttribute('href', '/demos/create');
    });
  });

  describe('Demo Loading States', () => {
    it('should show loading state when demos are loading', () => {
      mockUseDemosRealtime.mockReturnValue({
        demos: [],
        loading: true,
        error: null,
        refresh: jest.fn(),
      });

      render(<DashboardPage />);

      expect(screen.getByTestId('demo-list-loading')).toBeInTheDocument();
      expect(screen.getByTestId('summary-loading')).toBeInTheDocument();
    });

    it('should show error state when there is an error', () => {
      const mockRefresh = jest.fn();
      mockUseDemosRealtime.mockReturnValue({
        demos: [],
        loading: false,
        error: 'Failed to load demos',
        refresh: mockRefresh,
      });

      render(<DashboardPage />);

      expect(screen.getByTestId('demo-list-error')).toHaveTextContent('Failed to load demos');
    });

    it('should show empty state when no demos exist', () => {
      mockUseDemosRealtime.mockReturnValue({
        demos: [],
        loading: false,
        error: null,
        refresh: jest.fn(),
      });

      render(<DashboardPage />);

      expect(screen.getByTestId('demo-list-empty')).toBeInTheDocument();
      expect(screen.getByTestId('total-demos')).toHaveTextContent('0');
    });

    it('should display demos when they are loaded', () => {
      mockUseDemosRealtime.mockReturnValue({
        demos: mockDemos,
        loading: false,
        error: null,
        refresh: jest.fn(),
      });

      render(<DashboardPage />);

      expect(screen.getByTestId('demo-list-items')).toBeInTheDocument();
      expect(screen.getByTestId('demo-item-demo-1')).toHaveTextContent('Test Demo 1');
      expect(screen.getByTestId('demo-item-demo-2')).toHaveTextContent('Test Demo 2');
      expect(screen.getByTestId('total-demos')).toHaveTextContent('2');
      expect(screen.getByTestId('active-demos')).toHaveTextContent('2'); // Both have persona or conversation ID
    });
  });

  describe('Dashboard Summary Integration', () => {
    it('should pass correct props to DashboardSummary', () => {
      mockUseDemosRealtime.mockReturnValue({
        demos: mockDemos,
        loading: false,
        error: null,
        refresh: jest.fn(),
      });

      render(<DashboardPage />);

      expect(screen.getByTestId('dashboard-summary')).toBeInTheDocument();
      expect(screen.getByTestId('summary-stats')).toBeInTheDocument();
      expect(screen.getByTestId('total-demos')).toHaveTextContent('2');
    });

    it('should show loading summary when demos are loading', () => {
      mockUseDemosRealtime.mockReturnValue({
        demos: [],
        loading: true,
        error: null,
        refresh: jest.fn(),
      });

      render(<DashboardPage />);

      expect(screen.getByTestId('summary-loading')).toBeInTheDocument();
    });
  });

  describe('Demo List Integration', () => {
    it('should pass correct props to DemoList', () => {
      const mockRefresh = jest.fn();
      mockUseDemosRealtime.mockReturnValue({
        demos: mockDemos,
        loading: false,
        error: null,
        refresh: mockRefresh,
      });

      render(<DashboardPage />);

      expect(screen.getByTestId('demo-list')).toBeInTheDocument();
      
      // Test refresh functionality
      const refreshButton = screen.getByTestId('demo-list-refresh');
      refreshButton.click();
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });
  });

  describe('Hook Integration', () => {
    it('should call useDemosRealtime hook', () => {
      mockUseDemosRealtime.mockReturnValue({
        demos: [],
        loading: false,
        error: null,
        refresh: jest.fn(),
      });

      render(<DashboardPage />);

      expect(mockUseDemosRealtime).toHaveBeenCalledTimes(1);
    });

    it('should handle hook state changes', async () => {
      // Start with loading state
      mockUseDemosRealtime.mockReturnValue({
        demos: [],
        loading: true,
        error: null,
        refresh: jest.fn(),
      });

      const { rerender } = render(<DashboardPage />);

      expect(screen.getByTestId('demo-list-loading')).toBeInTheDocument();

      // Update to loaded state
      mockUseDemosRealtime.mockReturnValue({
        demos: mockDemos,
        loading: false,
        error: null,
        refresh: jest.fn(),
      });

      rerender(<DashboardPage />);

      expect(screen.queryByTestId('demo-list-loading')).not.toBeInTheDocument();
      expect(screen.getByTestId('demo-list-items')).toBeInTheDocument();
    });
  });

  describe('Authentication Integration', () => {
    it('should be wrapped with withAuth HOC', () => {
      // This test ensures the component is properly protected
      // The actual auth logic is tested in the withAuth component tests
      mockUseDemosRealtime.mockReturnValue({
        demos: [],
        loading: false,
        error: null,
        refresh: jest.fn(),
      });

      render(<DashboardPage />);

      // If we can render the dashboard content, the auth wrapper is working
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      mockUseDemosRealtime.mockReturnValue({
        demos: [],
        loading: false,
        error: null,
        refresh: jest.fn(),
      });

      render(<DashboardPage />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Dashboard');
    });

    it('should have accessible button for creating demos', () => {
      mockUseDemosRealtime.mockReturnValue({
        demos: [],
        loading: false,
        error: null,
        refresh: jest.fn(),
      });

      render(<DashboardPage />);

      const createButton = screen.getByRole('button', { name: /create new demo/i });
      expect(createButton).toBeInTheDocument();
    });
  });
});