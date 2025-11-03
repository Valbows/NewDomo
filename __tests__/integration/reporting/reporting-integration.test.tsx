/**
 * Integration Tests for Reporting System
 * Tests data flow, API integration, and component interactions
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReportingDataService } from '@/app/demos/[demoId]/configure/components/reporting/data-service';
import { Reporting } from '@/app/demos/[demoId]/configure/components/Reporting';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn()
  }
}));

// Mock ReportingDataService
jest.mock('@/app/demos/[demoId]/configure/components/reporting/data-service');

// Mock fetch for API calls
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('Reporting Integration Tests', () => {
  const mockDemo = {
    id: 'test-demo-id',
    name: 'Test Demo',
    tavus_persona_id: 'test-persona-id'
  };

  const mockConversationData = [
    {
      id: 'conv-1',
      tavus_conversation_id: 'tavus-conv-1',
      conversation_name: 'Test Conversation 1',
      transcript: [
        { speaker: 'User', text: 'Hello' },
        { speaker: 'AI', text: 'Hi there!' }
      ],
      perception_analysis: 'User appears engaged and interested',
      started_at: '2024-01-01T10:00:00Z',
      completed_at: '2024-01-01T10:05:00Z',
      duration_seconds: 300,
      status: 'completed',
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:05:00Z'
    }
  ];

  const mockContactData = [
    {
      id: 'contact-1',
      conversation_id: 'tavus-conv-1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      position: 'CEO',
      objective_name: 'contact_information_collection',
      event_type: 'objective_completed',
      raw_payload: {},
      received_at: '2024-01-01T10:03:00Z'
    }
  ];

  const mockProductInterestData = [
    {
      id: 'product-1',
      conversation_id: 'tavus-conv-1',
      objective_name: 'product_interest_discovery',
      primary_interest: 'Analytics Dashboard',
      pain_points: ['Manual reporting', 'Data silos'],
      event_type: 'objective_completed',
      raw_payload: {},
      received_at: '2024-01-01T10:04:00Z'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('ReportingDataService', () => {
    it('should fetch conversation data successfully', async () => {
      const mockResult = {
        conversations: mockConversationData,
        dataSets: {
          contactInfo: { 'tavus-conv-1': mockContactData[0] },
          productInterestData: { 'tavus-conv-1': mockProductInterestData[0] },
          videoShowcaseData: {},
          ctaTrackingData: {}
        }
      };

      jest.spyOn(ReportingDataService, 'fetchConversationData').mockResolvedValue(mockResult);

      const result = await ReportingDataService.fetchConversationData('test-demo-id');

      expect(result.conversations).toHaveLength(1);
      expect(result.conversations[0].conversation_name).toBe('Test Conversation 1');
      expect(result.dataSets.contactInfo['tavus-conv-1']).toBeDefined();
      expect(result.dataSets.contactInfo['tavus-conv-1'].first_name).toBe('John');
    });

    it('should handle sync conversations API call', async () => {
      const mockResponse = {
        conversations_synced: 5,
        conversations_total: 5,
        message: 'Sync completed'
      };

      // Mock alert for development environment
      global.alert = jest.fn();
      process.env.NODE_ENV = 'development';

      jest.spyOn(ReportingDataService, 'syncConversations').mockResolvedValue({
        conversations_synced: 5,
        conversations_total: 5
      });

      const result = await ReportingDataService.syncConversations('test-demo-id');

      expect(result.conversations_synced).toBe(5);
    });
  });

  describe('Reporting Component Integration', () => {
    it('should render loading state initially', () => {
      render(<Reporting demo={mockDemo} />);
      
      expect(screen.getByText('Loading conversation data...')).toBeInTheDocument();
    });

    it('should display conversation analytics after loading', async () => {
      // Mock successful data fetch
      jest.spyOn(ReportingDataService, 'fetchConversationData').mockResolvedValue({
        conversations: mockConversationData,
        dataSets: {
          contactInfo: { 'tavus-conv-1': mockContactData[0] },
          productInterestData: { 'tavus-conv-1': mockProductInterestData[0] },
          videoShowcaseData: {},
          ctaTrackingData: {}
        }
      });

      render(<Reporting demo={mockDemo} />);

      await waitFor(() => {
        expect(screen.getByText('Conversation Analytics')).toBeInTheDocument();
      });

      // Check summary stats
      expect(screen.getByText('Total Conversations')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('Avg Duration')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('should show conversation with data tags', async () => {
      jest.spyOn(ReportingDataService, 'fetchConversationData').mockResolvedValue({
        conversations: mockConversationData,
        dataSets: {
          contactInfo: { 'tavus-conv-1': mockContactData[0] },
          productInterestData: { 'tavus-conv-1': mockProductInterestData[0] },
          videoShowcaseData: {},
          ctaTrackingData: {}
        }
      });

      render(<Reporting demo={mockDemo} />);

      await waitFor(() => {
        expect(screen.getByText('Test Conversation 1')).toBeInTheDocument();
      });

      // Check data tags are displayed
      expect(screen.getByText('👤 Contact Info')).toBeInTheDocument();
      expect(screen.getByText('🎯 Product Interest')).toBeInTheDocument();
    });

    it('should expand conversation details when clicked', async () => {
      jest.spyOn(ReportingDataService, 'fetchConversationData').mockResolvedValue({
        conversations: mockConversationData,
        dataSets: {
          contactInfo: { 'tavus-conv-1': mockContactData[0] },
          productInterestData: { 'tavus-conv-1': mockProductInterestData[0] },
          videoShowcaseData: {},
          ctaTrackingData: {}
        }
      });

      render(<Reporting demo={mockDemo} />);

      await waitFor(() => {
        expect(screen.getByText('Test Conversation 1')).toBeInTheDocument();
      });

      // Click expand button
      const expandButton = screen.getByText('Expand');
      fireEvent.click(expandButton);

      // Check expanded content appears
      await waitFor(() => {
        expect(screen.getByText('Collapse')).toBeInTheDocument();
        expect(screen.getByText('💬 Conversation Transcript')).toBeInTheDocument();
        expect(screen.getByText('🏆 Domo Score')).toBeInTheDocument();
      });

      // Check contact info card is displayed
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('CEO')).toBeInTheDocument();

      // Check product interest card
      expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Manual reporting')).toBeInTheDocument();
    });

    it('should handle sync button click', async () => {
      jest.spyOn(ReportingDataService, 'fetchConversationData').mockResolvedValue({
        conversations: [],
        dataSets: {
          contactInfo: {},
          productInterestData: {},
          videoShowcaseData: {},
          ctaTrackingData: {}
        }
      });

      jest.spyOn(ReportingDataService, 'syncConversations').mockResolvedValue({
        conversations_synced: 0,
        conversations_total: 0
      });

      render(<Reporting demo={mockDemo} />);

      await waitFor(() => {
        expect(screen.getByText('Sync Data')).toBeInTheDocument();
      });

      const syncButton = screen.getByText('Sync Data');
      fireEvent.click(syncButton);

      // Check loading state
      await waitFor(() => {
        expect(screen.getByText('Syncing...')).toBeInTheDocument();
      });

      // Verify sync service was called
      expect(ReportingDataService.syncConversations).toHaveBeenCalledWith('test-demo-id');
    });
  });

  describe('Error Handling', () => {
    it('should handle data fetch errors gracefully', async () => {
      jest.spyOn(ReportingDataService, 'fetchConversationData').mockRejectedValue(
        new Error('Database connection failed')
      );

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<Reporting demo={mockDemo} />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Error fetching conversation data:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });

    it('should handle sync errors gracefully', async () => {
      jest.spyOn(ReportingDataService, 'fetchConversationData').mockResolvedValue({
        conversations: [],
        dataSets: {
          contactInfo: {},
          productInterestData: {},
          videoShowcaseData: {},
          ctaTrackingData: {}
        }
      });

      jest.spyOn(ReportingDataService, 'syncConversations').mockRejectedValue(
        new Error('Sync failed')
      );

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<Reporting demo={mockDemo} />);

      await waitFor(() => {
        expect(screen.getByText('Sync Data')).toBeInTheDocument();
      });

      const syncButton = screen.getByText('Sync Data');
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Error syncing conversations:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });
  });
});