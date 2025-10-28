/**
 * Tests for Custom Objectives functionality
 */

// Mock Supabase to avoid environment variable issues
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

import { validateCustomObjectives } from '@/lib/tavus/custom-objectives-integration';
import { ObjectiveDefinition } from '@/lib/tavus/objectives-templates';

describe('Custom Objectives', () => {
  describe('validateCustomObjectives', () => {
    it('should validate correct objectives', () => {
      const objectives: ObjectiveDefinition[] = [
        {
          objective_name: 'welcome_user',
          objective_prompt: 'Welcome the user and understand their needs',
          confirmation_mode: 'auto',
          output_variables: ['user_name', 'user_needs'],
          modality: 'verbal',
        },
        {
          objective_name: 'show_demo',
          objective_prompt: 'Show relevant demo videos based on user needs',
          confirmation_mode: 'manual',
          output_variables: ['videos_shown'],
          modality: 'visual',
        },
      ];

      const result = validateCustomObjectives(objectives);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty objectives array', () => {
      const result = validateCustomObjectives([]);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('At least one objective is required');
    });

    it('should reject objectives with missing required fields', () => {
      const objectives = [
        {
          objective_name: '',
          objective_prompt: 'Some prompt',
          confirmation_mode: 'auto',
          output_variables: [],
          modality: 'verbal',
        },
      ];

      const result = validateCustomObjectives(objectives);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Objective 1: Name is required');
    });

    it('should reject objectives with invalid confirmation mode', () => {
      const objectives = [
        {
          objective_name: 'test',
          objective_prompt: 'Test prompt',
          confirmation_mode: 'invalid' as any,
          output_variables: [],
          modality: 'verbal',
        },
      ];

      const result = validateCustomObjectives(objectives);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Objective 1: Invalid confirmation mode');
    });

    it('should reject objectives with invalid modality', () => {
      const objectives = [
        {
          objective_name: 'test',
          objective_prompt: 'Test prompt',
          confirmation_mode: 'auto',
          output_variables: [],
          modality: 'invalid' as any,
        },
      ];

      const result = validateCustomObjectives(objectives);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Objective 1: Invalid modality');
    });

    it('should reject objectives with invalid output_variables', () => {
      const objectives = [
        {
          objective_name: 'test',
          objective_prompt: 'Test prompt',
          confirmation_mode: 'auto',
          output_variables: 'not_an_array' as any,
          modality: 'verbal',
        },
      ];

      const result = validateCustomObjectives(objectives);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Objective 1: Output variables must be an array');
    });
  });
});