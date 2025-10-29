/**
 * React hook for managing objectives
 */

import { useState, useEffect } from 'react';
import { createObjectivesManager, type ObjectivesTemplate } from '@/lib/tavus';

interface ObjectivesData {
  uuid?: string;
  name?: string;
  data?: any[];
  created_at: string;
}

export function useObjectives() {
  const [objectives, setObjectives] = useState<ObjectivesData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const manager = createObjectivesManager();

  const loadObjectives = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await manager.getAllObjectives();
      setObjectives(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load objectives');
    } finally {
      setLoading(false);
    }
  };

  const createObjectives = async (template: ObjectivesTemplate) => {
    setLoading(true);
    setError(null);
    try {
      const result = await manager.createObjectives(template);
      await loadObjectives(); // Refresh the list
      return result.uuid!;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create objectives');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteObjectives = async (objectivesId: string) => {
    setLoading(true);
    setError(null);
    try {
      await manager.deleteObjectives(objectivesId);
      await loadObjectives(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete objectives');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadObjectives();
  }, []);

  return {
    objectives,
    loading,
    error,
    createObjectives,
    deleteObjectives,
    refreshObjectives: loadObjectives
  };
}