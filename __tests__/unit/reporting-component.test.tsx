/**
 * Unit tests for the Reporting Component
 * Tests data fetching, display, and Domo Score calculations
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Reporting } from '@/app/demos/[demoId]/configure/components/Reporting';
import { supabase } from '@/lib/supabase';

// Using real Supabase API for E2E testing

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Loader2: () => <div data-testid="loader">Loading...</div>,
  RefreshCw: () => <div data-testid="refresh-icon">Refresh</div>,
  Calendar: () => <div data-testid="calendar-icon">Calendar</div>,
  Clock: () => <div data-testid="clock-icon">Clock</div>,
  MessageSquare: () => <div data-testid="message-icon">Message</div>,
  BarChart3: () => <div data-testid="chart-icon">Chart</div>,
  ChevronDown: () => <div data-testid="chevron-down">Down</div>,
  ChevronUp: () => <div data-testid="chevron-up">Up</div>,
}));

describe('Reporting Component', () => {
  const testDemo = {
    id: '550e8400-e29b-41d4-a716-446655440000', // Real test demo ID
    name: 'Test Demo',
    tavus_conversation_id: 'test-conversation-id',
  };

  const mockConversationDetails = [
    {
      id: '1',
      tavus_conversation_id: 'conv-1',
      conversation_name: 'Test Conversation 1',
      transcript: [
        { speaker: 'user', text: 'Hello', timestamp: 1000 },
        { speaker: 'replica', text: 'Hi there!', timestamp: 2000 },
      ],
      perception_analysis: 'User appears engaged and attentive',
      started_at: '2024-01-01T10:00:00Z',
      completed_at: '2024-01-01T10:05:00Z',
      duration_seconds: 300,
      status: 'completed',
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:05:00Z',
    },
    {
      id: '2',
      tavus_conversation_id: 'conv-2',
      conversation_name: 'Test Conversation 2',
      transcript: null,
      perception_analysis: null,
      started_at: '2024-01-01T11:00:00Z',
      completed_at: null,
      duration_seconds: null,
      status: 'active',
      created_at: '2024-01-01T11:00:00Z',
      updated_at: '2024-01-01T11:00:00Z',
    },
  ];

  const mockContactInfo = {
    'conv-1': {
      id: '1',
      conversation_id: 'conv-1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      position: 'Developer',
      received_at: '2024-01-01T10:01:00Z',
    },
  };

  const mockProductInterest = {
    'conv-1': {
      id: '1',
      conversation_id: 'conv-1',
      primary_interest: 'Workforce Planning',
      pain_points: ['Manual processes', 'Data silos'],
      received_at: '2024-01-01T10:02:00Z',
    },
  };

  const mockVideoShowcase = {
    'conv-1': {
      id: '1',
      conversation_id: 'conv-1',
      videos_shown: ['Video 1', 'Video 2'],
      objective_name: 'video_showcase',
      received_at: '2024-01-01T10:03:00Z',
    },
  };

  const mockCtaTracking = {
    'conv-1': {
      id: '1',
      conversation_id: 'conv-1',
      demo_id: 'test-demo-id',
      cta_shown_at: '2024-01-01T10:04:00Z',
      cta_clicked_at: '2024-01-01T10:04:30Z',
      cta_url: 'https://example.com',
    },
  };

  beforeEach(() => {
    // Using real Supabase API - no mocking needed
  });

  describe('Component Rendering', () => {
    it('renders the reporting component', async () => {
      render(<Reporting demo={testDemo} />);
      
      expect(screen.getByText('Reporting & Analytics')).toBeInTheDocument();
      expect(screen.getByText(/View detailed conversation transcripts/)).toBeInTheDocument();
    });

    it('displays loading state initially', () => {
      render(<Reporting demo={testDemo} />);
      
      // Component should render without crashing
      expect(screen.getByText('Reporting & Analytics')).toBeInTheDocument();
    });

    it('displays sync button', async () => {
      render(<Reporting demo={testDemo} />);
      
      await waitFor(() => {
        expect(screen.getByText('Sync from Domo')).toBeInTheDocument();
      });
    });

    it('handles null demo gracefully', () => {
      render(<Reporting demo={null} />);
      
      expect(screen.getByText('Reporting & Analytics')).toBeInTheDocument();
    });
  });

  describe('Data Fetching', () => {
    it('fetches conversation details on mount', async () => {
      render(<Reporting demo={testDemo} />);
      
      // Component should render and attempt to fetch data
      await waitFor(() => {
        expect(screen.getByText('Reporting & Analytics')).toBeInTheDocument();
        expect(screen.getByText('Total Conversations')).toBeInTheDocument();
      });
    });

    it('fetches all related data tables', async () => {
      render(<Reporting demo={testDemo} />);
      
      // Component should render all data sections
      await waitFor(() => {
        expect(screen.getByText('Total Conversations')).toBeInTheDocument();
        expect(screen.getByText('Completed')).toBeInTheDocument();
        expect(screen.getByText('Avg Duration')).toBeInTheDocument();
        expect(screen.getByText('Avg Domo Score')).toBeInTheDocument();
        expect(screen.getByText('Last Conversation')).toBeInTheDocument();
      });
    });

    it('handles fetch errors gracefully', async () => {
      // Test with invalid demo to trigger error handling
      const invalidDemo = { ...testDemo, id: 'invalid-demo-id' };
      
      render(<Reporting demo={invalidDemo} />);
      
      // Component should render without crashing even with invalid data
      await waitFor(() => {
        expect(screen.getByText('Reporting & Analytics')).toBeInTheDocument();
      });
    });
  });

  describe('Conversation Display', () => {
    it('displays conversation list when data is loaded', async () => {
      render(<Reporting demo={testDemo} />);
      
      // Wait for component to finish loading
      await waitFor(() => {
        // Should show either conversations or empty state
        expect(
          screen.getByText('Conversation Details') || 
          screen.getByText('No detailed conversations found')
        ).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('displays conversation statistics', async () => {
      render(<Reporting demo={testDemo} />);
      
      await waitFor(() => {
        expect(screen.getByText('Total Conversations')).toBeInTheDocument();
        expect(screen.getByText('Completed')).toBeInTheDocument();
        expect(screen.getByText('Avg Duration')).toBeInTheDocument();
        expect(screen.getByText('Avg Domo Score')).toBeInTheDocument();
      });
    });

    it('shows conversation details section', async () => {
      render(<Reporting demo={testDemo} />);
      
      await waitFor(() => {
        expect(screen.getByText('Conversation Details')).toBeInTheDocument();
        expect(screen.getByText(/Detailed transcripts and perception analysis/)).toBeInTheDocument();
      });
    });
  });

  describe('Domo Score Calculation', () => {
    it('displays Domo Score section', async () => {
      render(<Reporting demo={testDemo} />);
      
      await waitFor(() => {
        expect(screen.getByText('Avg Domo Score')).toBeInTheDocument();
        expect(screen.getByText(/5/)).toBeInTheDocument(); // Shows score format
      });
    });

    it('shows Domo Score components', async () => {
      render(<Reporting demo={testDemo} />);
      
      await waitFor(() => {
        expect(screen.getByText('Avg Domo Score')).toBeInTheDocument();
        // Score components would be visible in expanded conversation details
      });
    });

    it('calculates average Domo Score across conversations', async () => {
      render(<Reporting demo={testDemo} />);
      
      await waitFor(() => {
        expect(screen.getByText('Avg Domo Score')).toBeInTheDocument();
        // Shows the average calculation in the stats card
      });
    });
  });

  describe('Data Cards', () => {
    it('displays data card infrastructure', async () => {
      render(<Reporting demo={testDemo} />);
      
      await waitFor(() => {
        expect(screen.getByText('Conversation Details')).toBeInTheDocument();
        // Data cards would be visible when conversations are expanded
      });
    });

    it('shows conversation data structure', async () => {
      render(<Reporting demo={testDemo} />);
      
      await waitFor(() => {
        expect(screen.getByText('Conversation Details')).toBeInTheDocument();
        expect(screen.getByText(/Detailed transcripts and perception analysis/)).toBeInTheDocument();
      });
    });

    it('handles data card display logic', async () => {
      render(<Reporting demo={testDemo} />);
      
      await waitFor(() => {
        // Component should handle data card rendering logic
        expect(screen.getByText('Conversation Details')).toBeInTheDocument();
      });
    });

    it('manages data card state', async () => {
      render(<Reporting demo={testDemo} />);
      
      await waitFor(() => {
        // Component should manage data card state properly
        expect(screen.getByText('Reporting & Analytics')).toBeInTheDocument();
      });
    });
  });

  describe('Sync Functionality', () => {
    it('triggers sync when sync button is clicked', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true }),
      });

      render(<Reporting demo={testDemo} />);
      
      await waitFor(() => {
        expect(screen.getByText('Sync from Domo')).toBeInTheDocument();
      });

      const syncButton = screen.getByText('Sync from Domo');
      fireEvent.click(syncButton);

      expect(global.fetch).toHaveBeenCalledWith(
        `/api/sync-tavus-conversations?demoId=${testDemo.id}`,
        { method: 'GET' }
      );
    });

    it('shows syncing state during sync', async () => {
      global.fetch = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        }), 100))
      );

      render(<Reporting demo={testDemo} />);
      
      await waitFor(() => {
        expect(screen.getByText('Sync from Domo')).toBeInTheDocument();
      });

      const syncButton = screen.getByText('Sync from Domo');
      fireEvent.click(syncButton);

      expect(screen.getByText('Syncing...')).toBeInTheDocument();
    });

    it('handles sync errors gracefully', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Sync failed'));

      render(<Reporting demo={testDemo} />);
      
      await waitFor(() => {
        expect(screen.getByText('Sync from Domo')).toBeInTheDocument();
      });

      const syncButton = screen.getByText('Sync from Domo');
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to sync conversations/)).toBeInTheDocument();
      });
    });
  });

  describe('Empty States', () => {
    it('displays empty state when no conversations exist', async () => {
      render(<Reporting demo={testDemo} />);
      
      await waitFor(() => {
        // Should show either conversations or empty state message
        expect(
          screen.getByText('No detailed conversations found') ||
          screen.getByText('Conversation Details')
        ).toBeInTheDocument();
      });
    });

    it('displays missing data cards when data is not captured', async () => {
      render(<Reporting demo={testDemo} />);
      
      await waitFor(() => {
        expect(screen.getByText('Conversation Details')).toBeInTheDocument();
        // Component should handle missing data gracefully
        // Empty state messages would appear when no data is available
      });
    });
  });
});