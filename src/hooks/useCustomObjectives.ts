/**
 * React hook for managing custom objectives
 */

import { useState, useEffect, useCallback } from 'react';
import { CustomObjective } from '@/lib/supabase/custom-objectives';
import { ObjectiveDefinition } from '@/lib/tavus';

interface UseCustomObjectivesReturn {
  objectives: CustomObjective[];
  loading: boolean;
  error: string | null;
  createObjective: (data: CreateObjectiveData) => Promise<CustomObjective>;
  updateObjective: (id: string, data: UpdateObjectiveData) => Promise<CustomObjective>;
  deleteObjective: (id: string) => Promise<void>;
  activateObjective: (id: string) => Promise<void>;
  refreshObjectives: () => Promise<void>;
}

interface CreateObjectiveData {
  name: string;
  description?: string;
  objectives: ObjectiveDefinition[];
}

interface UpdateObjectiveData {
  name?: string;
  description?: string;
  objectives?: ObjectiveDefinition[];
  is_active?: boolean;
}

export function useCustomObjectives(demoId: string): UseCustomObjectivesReturn {
  const [objectives, setObjectives] = useState<CustomObjective[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshObjectives = useCallback(async () => {
    if (!demoId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/demos/${demoId}/custom-objectives`);
      if (!response.ok) {
        throw new Error('Failed to fetch objectives');
      }
      
      const data = await response.json();
      setObjectives(data.objectives || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load objectives');
    } finally {
      setLoading(false);
    }
  }, [demoId]);

  const createObjective = async (data: CreateObjectiveData): Promise<CustomObjective> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/demos/${demoId}/custom-objectives`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create objective');
      }
      
      const result = await response.json();
      await refreshObjectives(); // Refresh the list
      return result.objective;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create objective');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateObjective = async (id: string, data: UpdateObjectiveData): Promise<CustomObjective> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/demos/${demoId}/custom-objectives/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update objective');
      }
      
      const result = await response.json();
      await refreshObjectives(); // Refresh the list
      return result.objective;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update objective');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteObjective = async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/demos/${demoId}/custom-objectives/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete objective');
      }
      
      await refreshObjectives(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete objective');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const activateObjective = async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/demos/${demoId}/custom-objectives/${id}/activate`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to activate objective');
      }
      
      await refreshObjectives(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate objective');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshObjectives();
  }, [refreshObjectives]);

  return {
    objectives,
    loading,
    error,
    createObjective,
    updateObjective,
    deleteObjective,
    activateObjective,
    refreshObjectives,
  };
}