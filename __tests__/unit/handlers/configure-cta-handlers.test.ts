import { handleSaveCTA, handleSaveAdminCTAUrl } from '@/app/demos/[demoId]/configure/handlers/ctaHandlers';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      update: jest.fn(() => ({
        eq: jest.fn(),
      })),
    })),
  },
}));

// Mock alert
global.alert = jest.fn();

// Import after mocking
const { supabase: mockSupabase } = require('@/lib/supabase');

describe('Configure CTA Handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleSaveCTA', () => {
    it('should save CTA settings successfully', async () => {
      const demo = {
        id: 'demo1',
        name: 'Test Demo',
        metadata: {
          agentName: 'Test Agent',
        },
      };
      const setDemo = jest.fn();

      const mockFrom = mockSupabase.from('demos');
      const mockUpdate = (mockFrom.update as jest.Mock)();
      (mockUpdate.eq as jest.Mock).mockResolvedValue({
        error: null,
      });

      await handleSaveCTA(
        'Try Our Product',
        'Sign up for a free trial',
        'Start Free Trial',
        demo as any,
        'demo1',
        setDemo
      );

      expect(mockFrom.update).toHaveBeenCalledWith({
        metadata: {
          agentName: 'Test Agent',
          ctaTitle: 'Try Our Product',
          ctaMessage: 'Sign up for a free trial',
          ctaButtonText: 'Start Free Trial',
        },
      });

      expect(setDemo).toHaveBeenCalledWith({
        ...demo,
        metadata: {
          agentName: 'Test Agent',
          ctaTitle: 'Try Our Product',
          ctaMessage: 'Sign up for a free trial',
          ctaButtonText: 'Start Free Trial',
        },
      });

      expect(global.alert).toHaveBeenCalledWith('CTA settings saved successfully!');
    });

    it('should handle save error', async () => {
      const mockFrom = mockSupabase.from('demos');
      const mockUpdate = (mockFrom.update as jest.Mock)();
      (mockUpdate.eq as jest.Mock).mockResolvedValue({
        error: new Error('Database error'),
      });

      await handleSaveCTA(
        'Title',
        'Message',
        'Button',
        { id: 'demo1', metadata: {} } as any,
        'demo1',
        jest.fn()
      );

      expect(global.alert).toHaveBeenCalledWith('Failed to save CTA settings.');
    });

    it('should work with null demo', async () => {
      const setDemo = jest.fn();

      const mockFrom = mockSupabase.from('demos');
      const mockUpdate = (mockFrom.update as jest.Mock)();
      (mockUpdate.eq as jest.Mock).mockResolvedValue({
        error: null,
      });

      await handleSaveCTA(
        'Title',
        'Message',
        'Button',
        null,
        'demo1',
        setDemo
      );

      expect(mockFrom.update).toHaveBeenCalledWith({
        metadata: {
          ctaTitle: 'Title',
          ctaMessage: 'Message',
          ctaButtonText: 'Button',
        },
      });

      expect(setDemo).not.toHaveBeenCalled();
    });
  });

  describe('handleSaveAdminCTAUrl', () => {
    it('should save admin CTA URL successfully', async () => {
      const demo = {
        id: 'demo1',
        name: 'Test Demo',
        cta_button_url: 'https://old-url.com',
      };
      const setDemo = jest.fn();

      const mockFrom = mockSupabase.from('demos');
      const mockUpdate = (mockFrom.update as jest.Mock)();
      (mockUpdate.eq as jest.Mock).mockResolvedValue({
        error: null,
      });

      await handleSaveAdminCTAUrl(
        'https://new-url.com',
        'demo1',
        demo as any,
        setDemo
      );

      expect(mockFrom.update).toHaveBeenCalledWith({
        cta_button_url: 'https://new-url.com',
      });

      expect(setDemo).toHaveBeenCalledWith({
        ...demo,
        cta_button_url: 'https://new-url.com',
      });
    });

    it('should handle empty URL', async () => {
      const demo = {
        id: 'demo1',
        cta_button_url: 'https://old-url.com',
      };
      const setDemo = jest.fn();

      const mockFrom = mockSupabase.from('demos');
      const mockUpdate = (mockFrom.update as jest.Mock)();
      (mockUpdate.eq as jest.Mock).mockResolvedValue({
        error: null,
      });

      await handleSaveAdminCTAUrl(
        '',
        'demo1',
        demo as any,
        setDemo
      );

      expect(mockFrom.update).toHaveBeenCalledWith({
        cta_button_url: null,
      });

      expect(setDemo).toHaveBeenCalledWith({
        ...demo,
        cta_button_url: null,
      });
    });

    it('should handle save error and rethrow', async () => {
      const mockFrom = mockSupabase.from('demos');
      const mockUpdate = (mockFrom.update as jest.Mock)();
      (mockUpdate.eq as jest.Mock).mockResolvedValue({
        error: new Error('Database error'),
      });

      await expect(
        handleSaveAdminCTAUrl(
          'https://url.com',
          'demo1',
          { id: 'demo1' } as any,
          jest.fn()
        )
      ).rejects.toThrow();

      expect(global.alert).toHaveBeenCalledWith('Failed to save Admin CTA URL.');
    });

    it('should work with null demo', async () => {
      const setDemo = jest.fn();

      const mockFrom = mockSupabase.from('demos');
      const mockUpdate = (mockFrom.update as jest.Mock)();
      (mockUpdate.eq as jest.Mock).mockResolvedValue({
        error: null,
      });

      await handleSaveAdminCTAUrl(
        'https://url.com',
        'demo1',
        null,
        setDemo
      );

      expect(setDemo).not.toHaveBeenCalled();
    });
  });
});
