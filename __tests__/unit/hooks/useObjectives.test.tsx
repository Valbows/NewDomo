import { renderHook, act } from '@testing-library/react';
import { useObjectives } from '@/hooks/useObjectives';

// Mock the objectives manager
const mockManager = {
  getAllObjectives: jest.fn(),
  createObjectives: jest.fn(),
  deleteObjectives: jest.fn(),
};

jest.mock('@/lib/tavus/objectives-manager', () => ({
  createObjectivesManager: () => mockManager,
}));

describe('useObjectives Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockObjective = {
    uuid: 'test-uuid-1',
    name: 'Test Objective',
    data: [{ id: 1, title: 'Test Item' }],
    created_at: '2023-01-01T00:00:00Z',
  };

  describe('Initial State and Loading', () => {
    it('loads objectives on mount', async () => {
      mockManager.getAllObjectives.mockResolvedValueOnce({
        data: [mockObjective],
      });

      const { result } = renderHook(() => useObjectives());

      // Wait for the effect to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.objectives).toEqual([mockObjective]);
      expect(result.current.error).toBeNull();
      expect(mockManager.getAllObjectives).toHaveBeenCalledTimes(1);
    });

    it('handles load error on mount', async () => {
      const errorMessage = 'Failed to load';
      mockManager.getAllObjectives.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useObjectives());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.objectives).toEqual([]);
      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('createObjectives', () => {
    it('creates objectives successfully', async () => {
      const template = { name: 'Test Template', objectives: [] };
      const createdUuid = 'new-uuid';
      
      mockManager.createObjectives.mockResolvedValueOnce({ uuid: createdUuid });
      mockManager.getAllObjectives
        .mockResolvedValueOnce({ data: [] }) // Initial load
        .mockResolvedValueOnce({ data: [mockObjective] }); // Refresh after create

      const { result } = renderHook(() => useObjectives());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0)); // Wait for initial load
      });

      let returnedUuid;
      await act(async () => {
        returnedUuid = await result.current.createObjectives(template);
      });

      expect(returnedUuid).toBe(createdUuid);
      expect(mockManager.createObjectives).toHaveBeenCalledWith(template);
      expect(mockManager.getAllObjectives).toHaveBeenCalledTimes(2); // Initial + refresh
      expect(result.current.error).toBeNull();
    });

    it('handles create error', async () => {
      const template = { name: 'Test Template', objectives: [] };
      const errorMessage = 'Create failed';
      
      mockManager.createObjectives.mockRejectedValueOnce(new Error(errorMessage));
      mockManager.getAllObjectives.mockResolvedValueOnce({ data: [] });

      const { result } = renderHook(() => useObjectives());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        try {
          await result.current.createObjectives(template);
        } catch (error) {
          expect(error.message).toBe(errorMessage);
        }
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('deleteObjectives', () => {
    it('deletes objectives successfully', async () => {
      const objectivesId = 'test-id';
      
      mockManager.deleteObjectives.mockResolvedValueOnce(undefined);
      mockManager.getAllObjectives
        .mockResolvedValueOnce({ data: [mockObjective] }) // Initial load
        .mockResolvedValueOnce({ data: [] }); // Refresh after delete

      const { result } = renderHook(() => useObjectives());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await result.current.deleteObjectives(objectivesId);
      });

      expect(mockManager.deleteObjectives).toHaveBeenCalledWith(objectivesId);
      expect(mockManager.getAllObjectives).toHaveBeenCalledTimes(2); // Initial + refresh
      expect(result.current.error).toBeNull();
    });

    it('handles delete error', async () => {
      const objectivesId = 'test-id';
      const errorMessage = 'Delete failed';
      
      mockManager.deleteObjectives.mockRejectedValueOnce(new Error(errorMessage));
      mockManager.getAllObjectives.mockResolvedValueOnce({ data: [] });

      const { result } = renderHook(() => useObjectives());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        try {
          await result.current.deleteObjectives(objectivesId);
        } catch (error) {
          expect(error.message).toBe(errorMessage);
        }
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('refreshObjectives', () => {
    it('refreshes objectives successfully', async () => {
      const newObjective = { ...mockObjective, uuid: 'new-uuid' };
      
      mockManager.getAllObjectives
        .mockResolvedValueOnce({ data: [mockObjective] })
        .mockResolvedValueOnce({ data: [newObjective] });

      const { result } = renderHook(() => useObjectives());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.objectives).toEqual([mockObjective]);

      await act(async () => {
        await result.current.refreshObjectives();
      });

      expect(result.current.objectives).toEqual([newObjective]);
      expect(mockManager.getAllObjectives).toHaveBeenCalledTimes(2);
    });
  });

  describe('Loading States', () => {
    it('shows loading state during operations', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      
      mockManager.getAllObjectives.mockReturnValueOnce(promise);

      const { result } = renderHook(() => useObjectives());

      expect(result.current.loading).toBe(true);

      act(() => {
        resolvePromise!({ data: [mockObjective] });
      });

      await act(async () => {
        await promise;
      });

      expect(result.current.loading).toBe(false);
    });
  });
});