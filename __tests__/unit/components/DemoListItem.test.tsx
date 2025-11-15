/**
 * Unit tests for DemoListItem component
 * Tests demo item rendering, status display, and date formatting
 */

import { render, screen } from '@testing-library/react';
import DemoListItem from '@/components/features/demos/DemoListItem';
import type { Demo } from '@/app/demos/[demoId]/configure/types';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  MoreVertical: () => <div data-testid="more-vertical-icon">More</div>,
}));

describe('DemoListItem Component', () => {
  const baseMockDemo: Demo = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Test Demo',
    user_id: 'user-123',
    tavus_conversation_id: null,
    tavus_persona_id: null,
    cta_title: null,
    cta_message: null,
    cta_button_text: null,
    cta_button_url: null,
    metadata: null,
    created_at: '2024-01-01T00:00:00Z',
  };

  describe('Basic Rendering', () => {
    it('renders demo name and basic information', () => {
      render(<DemoListItem demo={baseMockDemo} />);

      expect(screen.getByText('Test Demo')).toBeInTheDocument();
      expect(screen.getByText(/Created: 12\/31\/2023/)).toBeInTheDocument();
      expect(screen.getByText('Conversations tracked: 0')).toBeInTheDocument();
    });

    it('renders action buttons', () => {
      render(<DemoListItem demo={baseMockDemo} />);

      expect(screen.getByText('View')).toBeInTheDocument();
      expect(screen.getByText('Manage')).toBeInTheDocument();
      expect(screen.getByTestId('more-vertical-icon')).toBeInTheDocument();
    });

    it('has correct links for action buttons', () => {
      render(<DemoListItem demo={baseMockDemo} />);

      const viewLink = screen.getByText('View').closest('a');
      const manageLink = screen.getByText('Manage').closest('a');

      expect(viewLink).toHaveAttribute('href', `/demos/${baseMockDemo.id}/experience`);
      expect(manageLink).toHaveAttribute('href', `/demos/${baseMockDemo.id}/configure`);
    });
  });

  describe('Status Display', () => {
    it('shows Draft status when demo is inactive', () => {
      render(<DemoListItem demo={baseMockDemo} />);

      const statusBadge = screen.getByText('Draft');
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge).toHaveClass('text-gray-600');
      expect(statusBadge).toHaveClass('bg-gray-100');
    });

    it('shows Active status when demo has tavus_persona_id', () => {
      const activeDemo = {
        ...baseMockDemo,
        tavus_persona_id: 'persona-123',
      };

      render(<DemoListItem demo={activeDemo} />);

      const statusBadge = screen.getByText('Active');
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge).toHaveClass('text-domo-success');
      expect(statusBadge).toHaveClass('bg-green-100');
    });

    it('shows Active status when demo has tavus_conversation_id', () => {
      const activeDemo = {
        ...baseMockDemo,
        tavus_conversation_id: 'conv-123',
      };

      render(<DemoListItem demo={activeDemo} />);

      const statusBadge = screen.getByText('Active');
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge).toHaveClass('text-domo-success');
      expect(statusBadge).toHaveClass('bg-green-100');
    });

    it('shows Active status when demo has both tavus IDs', () => {
      const activeDemo = {
        ...baseMockDemo,
        tavus_persona_id: 'persona-123',
        tavus_conversation_id: 'conv-123',
      };

      render(<DemoListItem demo={activeDemo} />);

      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('formats valid date correctly', () => {
      const demoWithDate = {
        ...baseMockDemo,
        created_at: '2024-03-15T14:30:00Z',
      };

      render(<DemoListItem demo={demoWithDate} />);

      expect(screen.getByText(/Created: 3\/15\/2024/)).toBeInTheDocument();
    });

    it('handles null created_at gracefully', () => {
      const demoWithNullDate = {
        ...baseMockDemo,
        created_at: null as any,
      };

      render(<DemoListItem demo={demoWithNullDate} />);

      expect(screen.getByText(/Created: —/)).toBeInTheDocument();
    });

    it('handles undefined created_at gracefully', () => {
      const demoWithUndefinedDate = {
        ...baseMockDemo,
        created_at: undefined as any,
      };

      render(<DemoListItem demo={demoWithUndefinedDate} />);

      expect(screen.getByText(/Created: —/)).toBeInTheDocument();
    });

    it('handles invalid date string gracefully', () => {
      const demoWithInvalidDate = {
        ...baseMockDemo,
        created_at: 'invalid-date',
      };

      render(<DemoListItem demo={demoWithInvalidDate} />);

      expect(screen.getByText(/Created: —/)).toBeInTheDocument();
    });
  });

  describe('Analytics Display', () => {
    it('displays analytics information when available', () => {
      const demoWithAnalytics = {
        ...baseMockDemo,
        metadata: {
          analytics: {
            last_updated: '2024-01-02T10:30:00Z',
            conversations: {
              'conv-1': { status: 'completed' },
              'conv-2': { status: 'active' },
            },
          },
        },
      };

      render(<DemoListItem demo={demoWithAnalytics} />);

      expect(screen.getByText(/Analytics updated: 1\/2\/2024/)).toBeInTheDocument();
      expect(screen.getByText('Conversations tracked: 2')).toBeInTheDocument();
    });

    it('handles empty conversations object', () => {
      const demoWithEmptyAnalytics = {
        ...baseMockDemo,
        metadata: {
          analytics: {
            last_updated: '2024-01-02T10:30:00Z',
            conversations: {},
          },
        },
      };

      render(<DemoListItem demo={demoWithEmptyAnalytics} />);

      expect(screen.getByText('Conversations tracked: 0')).toBeInTheDocument();
    });

    it('handles null conversations', () => {
      const demoWithNullConversations = {
        ...baseMockDemo,
        metadata: {
          analytics: {
            last_updated: '2024-01-02T10:30:00Z',
            conversations: null,
          },
        },
      };

      render(<DemoListItem demo={demoWithNullConversations} />);

      expect(screen.getByText('Conversations tracked: 0')).toBeInTheDocument();
    });

    it('handles missing analytics gracefully', () => {
      const demoWithoutAnalytics = {
        ...baseMockDemo,
        metadata: {},
      };

      render(<DemoListItem demo={demoWithoutAnalytics} />);

      expect(screen.getByText('Conversations tracked: 0')).toBeInTheDocument();
      expect(screen.queryByText(/Analytics updated:/)).not.toBeInTheDocument();
    });

    it('handles null metadata gracefully', () => {
      render(<DemoListItem demo={baseMockDemo} />);

      expect(screen.getByText('Conversations tracked: 0')).toBeInTheDocument();
      expect(screen.queryByText(/Analytics updated:/)).not.toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('has proper CSS classes for layout', () => {
      render(<DemoListItem demo={baseMockDemo} />);

      const container = screen.getByTestId('demo-list-item');
      expect(container).toHaveClass('bg-white');
      expect(container).toHaveClass('p-4');
      expect(container).toHaveClass('rounded-lg');
      expect(container).toHaveClass('shadow-sm');
      expect(container).toHaveClass('border');
      expect(container).toHaveClass('border-gray-100');
    });

    it('has proper text styling', () => {
      render(<DemoListItem demo={baseMockDemo} />);

      const title = screen.getByText('Test Demo');
      expect(title).toHaveClass('text-lg');
      expect(title).toHaveClass('font-bold');
      expect(title).toHaveClass('text-domo-dark-text');
      expect(title).toHaveClass('truncate');
    });

    it('has proper button styling', () => {
      render(<DemoListItem demo={baseMockDemo} />);

      const viewButton = screen.getByText('View');
      const manageButton = screen.getByText('Manage');

      // Check that buttons exist and are links
      expect(viewButton).toBeInTheDocument();
      expect(manageButton).toBeInTheDocument();
      expect(viewButton.closest('a')).toHaveAttribute('href', '/demos/550e8400-e29b-41d4-a716-446655440000/experience');
      expect(manageButton.closest('a')).toHaveAttribute('href', '/demos/550e8400-e29b-41d4-a716-446655440000/configure');
    });
  });

  describe('Edge Cases', () => {
    it('handles very long demo names', () => {
      const demoWithLongName = {
        ...baseMockDemo,
        name: 'This is a very long demo name that should be truncated to prevent layout issues',
      };

      render(<DemoListItem demo={demoWithLongName} />);

      const title = screen.getByText(demoWithLongName.name);
      expect(title).toHaveClass('truncate');
    });

    it('handles demo with empty name', () => {
      const demoWithEmptyName = {
        ...baseMockDemo,
        name: '',
      };

      render(<DemoListItem demo={demoWithEmptyName} />);

      // Should still render the component structure
      expect(screen.getByText('View')).toBeInTheDocument();
      expect(screen.getByText('Manage')).toBeInTheDocument();
    });

    it('handles demo with special characters in name', () => {
      const demoWithSpecialChars = {
        ...baseMockDemo,
        name: 'Demo with "quotes" & <tags> and émojis 🚀',
      };

      render(<DemoListItem demo={demoWithSpecialChars} />);

      expect(screen.getByText('Demo with "quotes" & <tags> and émojis 🚀')).toBeInTheDocument();
    });

    it('handles malformed metadata gracefully', () => {
      const demoWithMalformedMetadata = {
        ...baseMockDemo,
        metadata: 'not-an-object' as any,
      };

      render(<DemoListItem demo={demoWithMalformedMetadata} />);

      expect(screen.getByText('Conversations tracked: 0')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has accessible links', () => {
      render(<DemoListItem demo={baseMockDemo} />);

      const viewLink = screen.getByText('View').closest('a');
      const manageLink = screen.getByText('Manage').closest('a');

      expect(viewLink).toHaveAttribute('href');
      expect(manageLink).toHaveAttribute('href');
    });

    it('has accessible button for more options', () => {
      render(<DemoListItem demo={baseMockDemo} />);

      const moreButton = screen.getByRole('button');
      expect(moreButton).toBeInTheDocument();
    });

    it('has proper semantic structure', () => {
      render(<DemoListItem demo={baseMockDemo} />);

      // Title should be in a heading-like element
      const title = screen.getByText('Test Demo');
      expect(title.tagName).toBe('H3');
    });
  });
});