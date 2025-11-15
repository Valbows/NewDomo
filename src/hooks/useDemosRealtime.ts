import { useState, useEffect } from 'react';
import { Demo } from '@/app/demos/[demoId]/configure/types';
import { supabase } from '@/lib/supabase';
import { authService } from '@/lib/services/auth';

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

  const fetchDemos = async () => {
    try {
      setLoading(true);
      setError(null);

      const sessionResult = await authService.getCurrentSession();
      if (!sessionResult.success || !sessionResult.session) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const user = sessionResult.session.user;

      const { data: demosData, error: demosError } = await supabase
        .from('demos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (demosError) {
        console.error('Error fetching demos:', demosError);
        setError('Error loading demos. Please try again.');
      } else {
        setDemos(demosData || []);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error loading demos. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    fetchDemos();
  };

  useEffect(() => {
    fetchDemos();
  }, []);

  // Set up real-time subscription if requested
  useEffect(() => {
    if (!options?.subscribeToAnalyticsUpdated) return;

    const channel = supabase
      .channel('demos-realtime')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'demos' 
        }, 
        () => {
          // Refresh demos when changes occur
          fetchDemos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [options?.subscribeToAnalyticsUpdated]);

  return {
    demos,
    loading,
    error,
    refresh,
  };
};