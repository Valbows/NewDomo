import {useState, useEffect} from 'react';
import {supabase} from '@/lib/utils/supabase/browser';
import {UIState} from '@/lib/tavus';

interface UsePreviewFunctionalityProps {
  demoId: string;
  fetchDemoData: () => Promise<void>;
}

export function usePreviewFunctionality({ demoId, fetchDemoData }: UsePreviewFunctionalityProps) {
  const [playingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null);
  const [uiState, setUiState] = useState<UIState>(UIState.IDLE);

  // Subscribe to real-time events for this demo
  useEffect(() => {
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
  }, [demoId, fetchDemoData]);

  const handleVideoPlayerClose = () => {
    setPlayingVideoUrl(null);
    setUiState(UIState.IDLE);
  };

  return {
    playingVideoUrl,
    setPlayingVideoUrl,
    uiState,
    setUiState,
    handleVideoPlayerClose
  };
}