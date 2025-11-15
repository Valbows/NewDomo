import { useState, useEffect } from 'react';
import { Demo } from '@/app/demos/[demoId]/configure/types';

interface UseDemosRealtimeOptions {
  subscribeToAnalyticsUpdated?: boolean;
}

interface UseDemosRealtimeReturn {
  demos: Demo[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export const useDemosRealtime = (options?: UseDemosRealtimeOptions): UseDemosRealtimeReturn => {
  const [demos, setDemos] = useState<Demo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => {
    setLoading(true);
    setError(null);
    // Simulate refresh
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return {
    demos,
    loading,
    error,
    refresh,
  };
};