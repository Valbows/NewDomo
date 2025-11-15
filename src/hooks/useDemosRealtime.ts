import { useState, useEffect } from 'react';

interface Demo {
  id: string;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface UseDemosRealtimeReturn {
  demos: Demo[];
  loading: boolean;
  error: string | null;
}

export const useDemosRealtime = (): UseDemosRealtimeReturn => {
  const [demos, setDemos] = useState<Demo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  };
};