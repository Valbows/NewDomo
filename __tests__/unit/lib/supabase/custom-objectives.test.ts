/**
 * Unit tests for custom objectives database operations
 * Tests CRUD operations, error handling, and business logic
 */

import { supabase } from '@/lib/supabase';
import {
  createCustomObjective,
  getCustomObjectives,
  getCustomObjective,
  getActiveCustomObjective,
  updateCustomObjective,
  deleteCustomObjective,
} from '@/lib/supabase/custom-objectives';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('Custom Objectives Database Operations', () => {
  const mockDemoId = '550e8400-e29b-41d4-a716-446655440000';
  const mockObjectiveId = '660e8400-e29b-41d4-a716-446655440001';
  
  const mockObjective = {
    id: mockObjectiveId,
    demo_id: mockDemoId,
    name: 'Test Objective',
    description: 'Test description',
    objectives: [
      {
        objective_name: 'test_objective',
        description: 'Test objective description',
        required: true,
      },
    ],
    tavus_objectives_id: 'tavus-123',
    is_active: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockChain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase.from.mockReturnValue(mockChain as any);
  });

  describe('createCustomObjective', () => {
    const createData = {
      demo_id: mockDemoId,
      name: 'New Objective',
      description: 'New description',
      objectives: [
        {
          objective_name: 'new_objective',
          description: 'New objective description',
          required: true,
        },
      ],
    };

    it('creates a new custom objective successfully', async () => {
      mockChain.single.mockResolvedValue({
        data: mockObjective,
        error: null,
      });

      const result = await createCustomObjective(createData);

      expect(mockSupabase.from).toHaveBeenCalledWith('custom_objectives');
      expect(mockChain.insert).toHaveBeenCalledWith({
        demo_id: createData.demo_id,
        name: createData.name,
        description: createData.description,
        objectives: createData.objectives,
      });
      expect(mockChain.select).toHaveBeenCalled();
      expect(mockChain.single).toHaveBeenCalled();
      expect(result).toEqual(mockObjective);
    });

    it('throws error when creation fails', async () => {
      const error = { message: 'Database error' };
      mockChain.single.mockResolvedValue({
        data: null,
        error,
      });

      await expect(createCustomObjective(createData)).rejects.toThrow(
        'Failed to create custom objective: Database error'
      );
    });

    it('creates objective without optional description', async () => {
      const dataWithoutDescription = {
        demo_id: mockDemoId,
        name: 'New Objective',
        objectives: createData.objectives,
      };

      mockChain.single.mockResolvedValue({
        data: mockObjective,
        error: null,
      });

      await createCustomObjective(dataWithoutDescription);

      expect(mockChain.insert).toHaveBeenCalledWith({
        demo_id: dataWithoutDescription.demo_id,
        name: dataWithoutDescription.name,
        description: undefined,
        objectives: dataWithoutDescription.objectives,
      });
    });
  });

  describe('getCustomObjectives', () => {
    it('fetches all objectives for a demo', async () => {
      const mockObjectives = [mockObjective, { ...mockObjective, id: 'another-id' }];
      mockChain.order.mockResolvedValue({
        data: mockObjectives,
        error: null,
      });

      const result = await getCustomObjectives(mockDemoId);

      expect(mockSupabase.from).toHaveBeenCalledWith('custom_objectives');
      expect(mockChain.select).toHaveBeenCalledWith('*');
      expect(mockChain.eq).toHaveBeenCalledWith('demo_id', mockDemoId);
      expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual(mockObjectives);
    });

    it('returns empty array when no objectives found', async () => {
      mockChain.order.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await getCustomObjectives(mockDemoId);

      expect(result).toEqual([]);
    });

    it('throws error when fetch fails', async () => {
      const error = { message: 'Database error' };
      mockChain.order.mockResolvedValue({
        data: null,
        error,
      });

      await expect(getCustomObjectives(mockDemoId)).rejects.toThrow(
        'Failed to fetch custom objectives: Database error'
      );
    });
  });

  describe('getCustomObjective', () => {
    it('fetches a specific objective by ID', async () => {
      mockChain.single.mockResolvedValue({
        data: mockObjective,
        error: null,
      });

      const result = await getCustomObjective(mockObjectiveId);

      expect(mockSupabase.from).toHaveBeenCalledWith('custom_objectives');
      expect(mockChain.select).toHaveBeenCalledWith('*');
      expect(mockChain.eq).toHaveBeenCalledWith('id', mockObjectiveId);
      expect(mockChain.single).toHaveBeenCalled();
      expect(result).toEqual(mockObjective);
    });

    it('returns null when objective not found', async () => {
      const error = { code: 'PGRST116' }; // Not found error code
      mockChain.single.mockResolvedValue({
        data: null,
        error,
      });

      const result = await getCustomObjective(mockObjectiveId);

      expect(result).toBeNull();
    });

    it('throws error for other database errors', async () => {
      const error = { message: 'Database error', code: 'OTHER_ERROR' };
      mockChain.single.mockResolvedValue({
        data: null,
        error,
      });

      await expect(getCustomObjective(mockObjectiveId)).rejects.toThrow(
        'Failed to fetch custom objective: Database error'
      );
    });
  });

  describe('getActiveCustomObjective', () => {
    it('fetches the active objective for a demo', async () => {
      const activeObjective = { ...mockObjective, is_active: true };
      mockChain.single.mockResolvedValue({
        data: activeObjective,
        error: null,
      });

      const result = await getActiveCustomObjective(mockDemoId);

      expect(mockSupabase.from).toHaveBeenCalledWith('custom_objectives');
      expect(mockChain.select).toHaveBeenCalledWith('*');
      expect(mockChain.eq).toHaveBeenCalledWith('demo_id', mockDemoId);
      expect(mockChain.eq).toHaveBeenCalledWith('is_active', true);
      expect(mockChain.single).toHaveBeenCalled();
      expect(result).toEqual(activeObjective);
    });

    it('returns null when no active objective found', async () => {
      const error = { code: 'PGRST116' }; // Not found error code
      mockChain.single.mockResolvedValue({
        data: null,
        error,
      });

      const result = await getActiveCustomObjective(mockDemoId);

      expect(result).toBeNull();
    });

    it('throws error for database errors', async () => {
      const error = { message: 'Database error', code: 'OTHER_ERROR' };
      mockChain.single.mockResolvedValue({
        data: null,
        error,
      });

      await expect(getActiveCustomObjective(mockDemoId)).rejects.toThrow(
        'Failed to fetch active custom objective: Database error'
      );
    });
  });

  describe('updateCustomObjective', () => {
    const updateData = {
      name: 'Updated Objective',
      description: 'Updated description',
      is_active: true,
    };

    it('updates an objective successfully', async () => {
      const updatedObjective = { ...mockObjective, ...updateData };
      mockChain.single.mockResolvedValue({
        data: updatedObjective,
        error: null,
      });

      const result = await updateCustomObjective(mockObjectiveId, updateData);

      expect(mockSupabase.from).toHaveBeenCalledWith('custom_objectives');
      expect(mockChain.update).toHaveBeenCalledWith(updateData);
      expect(mockChain.eq).toHaveBeenCalledWith('id', mockObjectiveId);
      expect(mockChain.select).toHaveBeenCalled();
      expect(mockChain.single).toHaveBeenCalled();
      expect(result).toEqual(updatedObjective);
    });

    it('throws error when update fails', async () => {
      const error = { message: 'Database error' };
      mockChain.single.mockResolvedValue({
        data: null,
        error,
      });

      await expect(updateCustomObjective(mockObjectiveId, updateData)).rejects.toThrow(
        'Failed to update custom objective: Database error'
      );
    });

    it('updates with partial data', async () => {
      const partialUpdate = { name: 'New Name Only' };
      const updatedObjective = { ...mockObjective, ...partialUpdate };
      mockChain.single.mockResolvedValue({
        data: updatedObjective,
        error: null,
      });

      const result = await updateCustomObjective(mockObjectiveId, partialUpdate);

      expect(mockChain.update).toHaveBeenCalledWith(partialUpdate);
      expect(result).toEqual(updatedObjective);
    });
  });

  // Note: setActiveCustomObjective is complex as it calls other functions
  // We'll test it as an integration test rather than unit test

  describe('deleteCustomObjective', () => {
    beforeEach(() => {
      // Reset mocks for each test
      jest.clearAllMocks();
      mockSupabase.from.mockReturnValue(mockChain as any);
    });

    it('deletes an objective successfully', async () => {
      mockChain.eq.mockResolvedValue({ error: null });

      await deleteCustomObjective(mockObjectiveId);

      expect(mockSupabase.from).toHaveBeenCalledWith('custom_objectives');
      expect(mockChain.delete).toHaveBeenCalled();
      expect(mockChain.eq).toHaveBeenCalledWith('id', mockObjectiveId);
    });

    it('throws error when deletion fails', async () => {
      const error = { message: 'Database error' };
      mockChain.eq.mockResolvedValue({ error });

      await expect(deleteCustomObjective(mockObjectiveId)).rejects.toThrow(
        'Failed to delete custom objective: Database error'
      );
    });
  });

  // Note: duplicateCustomObjective is complex as it calls other functions
  // We'll test it as an integration test rather than unit test

  describe('Error Handling Edge Cases', () => {
    it('handles empty objectives array', async () => {
      const objectiveWithEmptyArray = {
        ...mockObjective,
        objectives: [],
      };

      mockChain.single.mockResolvedValue({
        data: objectiveWithEmptyArray,
        error: null,
      });

      const result = await createCustomObjective({
        demo_id: mockDemoId,
        name: 'Test',
        objectives: [],
      });

      expect(result.objectives).toEqual([]);
    });
  });
});