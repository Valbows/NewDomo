import {useState, useEffect} from 'react';
import {useSearchParams} from 'next/navigation';
import {supabase} from '@/lib/utils/supabase/browser';
import {UIState} from '@/lib/tavus';

// CTA override payload shape from Realtime broadcasts
type CtaOverrides = {
  cta_title?: string | null;
  cta_message?: string | null;
  cta_button_text?: string | null;
  cta_button_url?: string | null;
};

interface UseUIStateManagementProps {
  demoId: string;
}

export function useUIStateManagement({ demoId }: UseUIStateManagementProps) {

  const [uiState, setUiState] = useState<UIState>(UIState.IDLE);
  const [playingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null);
  const [showCTA, setShowCTA] = useState(false);
  const [ctaOverrides, setCtaOverrides] = useState<CtaOverrides | null>(null);
  const [videoTitles, setVideoTitles] = useState<string[]>([]);
  const [currentVideoTitle, setCurrentVideoTitle] = useState<string | null>(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState<number | null>(null);
  const [alert, setAlert] = useState<{ type: 'error' | 'info' | 'success'; message: string } | null>(null);

  // Load available video titles for dropdown debugging (dev-only UI consumes this)
  useEffect(() => {
    const loadVideoTitles = async () => {
      try {
        const { data: titlesData, error: titlesError } = await supabase
          .from('demo_videos')
          .select('title')
          .eq('demo_id', demoId);
        if (titlesError) {
          // console.warn('⚠️ Failed to load video titles', titlesError);
        } else if (Array.isArray(titlesData)) {
          const titles = titlesData
            .map((row: any) => row?.title)
            .filter((t: any): t is string => typeof t === 'string' && t.trim().length > 0);
          setVideoTitles(titles);
        }
      } catch (e) {
        // console.warn('⚠️ Unexpected error loading video titles', e);
      }
    };

    if (demoId) {
      loadVideoTitles();
    }
  }, [demoId]);

  // Subscribe to Supabase Realtime broadcasts for this demo
  useEffect(() => {
    if (!demoId) return;

    const channelName = `demo-${demoId}`;
    const channel = supabase.channel(channelName);

    channel
      .on('broadcast', { event: 'play_video' }, (payload: any) => {
        try {
          const url = payload?.payload?.url as string | undefined;

          if (url && typeof url === 'string') {
            // New video source: reset any saved paused position
            setPlayingVideoUrl(url);
            setUiState(UIState.VIDEO_PLAYING);
            // Ensure CTA is hidden while playing and clear any alert banners
            setShowCTA(false);
            setAlert(null);
          }
        } catch (e) {
          // console.warn('Realtime play_video handler error', e);
        }
      })
      .on('broadcast', { event: 'show_trial_cta' }, (payload: any) => {
        try {

          const p = payload?.payload || {};
          setCtaOverrides({
            cta_title: p?.cta_title ?? undefined,
            cta_message: p?.cta_message ?? undefined,
            cta_button_text: p?.cta_button_text ?? undefined,
            cta_button_url: p?.cta_button_url ?? undefined,
          });
          setShowCTA(true);
        } catch (e) {
          // console.warn('Realtime show_trial_cta handler error', e);
          setShowCTA(true);
        }
      })
      .on('broadcast', { event: 'analytics_updated' }, (payload: any) => {

        // Currently no analytics UI here; placeholder for potential refresh logic
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {

        }
      });

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  }, [demoId]);

  // Set initial UI state when conversation is ready
  const setConversationReady = () => {
    setUiState(UIState.CONVERSATION);
  };

  // Handle E2E mode setup
  const setupE2EMode = () => {
    setVideoTitles(['E2E Test Video', 'E2E Second Video']);
    setConversationReady();
  };

  return {
    uiState,
    setUiState,
    playingVideoUrl,
    setPlayingVideoUrl,
    showCTA,
    setShowCTA,
    ctaOverrides,
    setCtaOverrides,
    videoTitles,
    setVideoTitles,
    currentVideoTitle,
    setCurrentVideoTitle,
    currentVideoIndex,
    setCurrentVideoIndex,
    alert,
    setAlert,
    setConversationReady,
    setupE2EMode
  };
}