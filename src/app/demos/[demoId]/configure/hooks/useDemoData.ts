import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { UIState } from '@/lib/tavus/UI_STATES';
import { logError, getErrorMessage } from '@/lib/errors';
import type { Demo, DemoVideo, KnowledgeChunk } from '../types';

interface UseDemoDataReturn {
  demo: Demo | null;
  setDemo: (demo: Demo) => void;
  demoVideos: DemoVideo[];
  setDemoVideos: React.Dispatch<React.SetStateAction<DemoVideo[]>>;
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
      // Listen to Postgres changes on the demos row
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'demos', filter: `id=eq.${demoId}` },
        (payload) => {
          fetchDemoData();
        }
      )
      // Listen to demo_videos changes (for transcription status updates)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'demo_videos' },
        (payload) => {
          const updatedVideo = payload.new as DemoVideo;
          // Filter by demo_id in callback (more reliable than filter param for non-PK columns)
          if (!updatedVideo || updatedVideo.demo_id !== demoId) return;

          setDemoVideos(prev => prev.map(v =>
            v.id === updatedVideo.id ? updatedVideo : v
          ));
          // If transcription completed, also refresh knowledge chunks
          if (updatedVideo.processing_status === 'completed') {
            supabase
              .from('knowledge_chunks')
              .select('*')
              .eq('demo_id', demoId)
              .then(({ data }) => {
                if (data) {
                  setKnowledgeChunks(data);
                }
              });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'demo_videos' },
        (payload) => {
          const newVideo = payload.new as DemoVideo;
          // Filter by demo_id in callback
          if (!newVideo || newVideo.demo_id !== demoId) return;

          // Deduplicate: only add if video doesn't already exist
          setDemoVideos(prev => {
            const exists = prev.some(v => v.id === newVideo.id);
            if (exists) return prev;
            return [...prev, newVideo];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'demo_videos' },
        (payload) => {
          const deletedVideo = payload.old as { id: string; demo_id?: string };
          // Filter by demo_id in callback (if available in old record)
          if (!deletedVideo?.id) return;

          setDemoVideos(prev => prev.filter(v => v.id !== deletedVideo.id));
        }
      )
      // Listen to knowledge_chunks changes (for new transcripts)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'knowledge_chunks' },
        (payload) => {
          const newChunk = payload.new as KnowledgeChunk;
          // Filter by demo_id in callback
          if (!newChunk || newChunk.demo_id !== demoId) return;

          // Deduplicate: only add if chunk doesn't already exist
          setKnowledgeChunks(prev => {
            const exists = prev.some(c => c.id === newChunk.id);
            if (exists) return prev;
            return [...prev, newChunk];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'knowledge_chunks' },
        (payload) => {
          const deletedChunk = payload.old as { id: string; demo_id?: string };
          if (!deletedChunk?.id) return;

          setKnowledgeChunks(prev => prev.filter(c => c.id !== deletedChunk.id));
        }
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('[useDemoData] Realtime channel error:', err);
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
