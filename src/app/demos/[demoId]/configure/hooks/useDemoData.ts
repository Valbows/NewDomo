import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { UIState } from '@/lib/tavus/UI_STATES';
import { logError, getErrorMessage } from '@/lib/errors';
import type { Demo, DemoVideo, KnowledgeChunk } from '../types';

interface UseDemoDataReturn {
  demo: Demo | null;
  setDemo: (demo: Demo) => void;
  demoVideos: DemoVideo[];
  setDemoVideos: (videos: DemoVideo[]) => void;
  knowledgeChunks: KnowledgeChunk[];
  setKnowledgeChunks: (chunks: KnowledgeChunk[]) => void;
  loading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  playingVideoUrl: string | null;
  setPlayingVideoUrl: (url: string | null) => void;
  uiState: UIState;
  setUiState: (state: UIState) => void;
  fetchDemoData: () => Promise<void>;
}

export function useDemoData(demoId: string): UseDemoDataReturn {
  const [demo, setDemo] = useState<Demo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [demoVideos, setDemoVideos] = useState<DemoVideo[]>([]);
  const [knowledgeChunks, setKnowledgeChunks] = useState<KnowledgeChunk[]>([]);
  const [uiState, setUiState] = useState<UIState>(UIState.IDLE);
  const [playingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null);

  const fetchDemoData = useCallback(async () => {
    try {
      const { data: demoData, error: demoError } = await supabase.from('demos').select('*').eq('id', demoId).single();
      if (demoError) throw demoError;
      if (!demoData) throw new Error('Demo not found.');
      setDemo(demoData);

      const { data: videoData, error: videoError } = await supabase.from('demo_videos').select('*').eq('demo_id', demoId).order('order_index');
      if (videoError) console.warn('Could not fetch videos:', videoError.message);
      else setDemoVideos(videoData || []);

      const { data: knowledgeData, error: knowledgeError } = await supabase.from('knowledge_chunks').select('*').eq('demo_id', demoId);
      if (knowledgeError) console.warn('Could not fetch knowledge chunks:', knowledgeError.message);
      else setKnowledgeChunks(knowledgeData || []);

    } catch (err: unknown) {
      logError(err, 'Failed to fetch demo data');
      setError(getErrorMessage(err, 'Failed to fetch demo data.'));
    } finally {
      setLoading(false);
    }
  }, [demoId]);

  useEffect(() => {
    setLoading(true);
    fetchDemoData();

    // Subscribe to real-time events for this demo
    const channel = supabase.channel(`demo-${demoId}`);

    channel
      .on('broadcast', { event: 'play_video' }, (payload) => {
        if (payload?.payload?.url) {
          setPlayingVideoUrl(payload.payload.url);
          setUiState(UIState.VIDEO_PLAYING);
        }
      })
      .on('broadcast', { event: 'show_trial_cta' }, (payload) => {
        setUiState(UIState.DEMO_COMPLETE);
      })
      .on('broadcast', { event: 'analytics_updated' }, (payload) => {
        // Refresh demo data so Reporting reflects the latest analytics snapshot
        fetchDemoData();
      })
      // Fallback: listen to Postgres changes on the demos row to auto-refresh
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'demos', filter: `id=eq.${demoId}` },
        (payload) => {
          try {
            const changedCols = Object.keys(payload?.new || {});
          } catch {}
          fetchDemoData();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
        }
      });

    // Clean up subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDemoData, demoId]);

  return {
    demo,
    setDemo,
    demoVideos,
    setDemoVideos,
    knowledgeChunks,
    setKnowledgeChunks,
    loading,
    error,
    setError,
    playingVideoUrl,
    setPlayingVideoUrl,
    uiState,
    setUiState,
    fetchDemoData,
  };
}
