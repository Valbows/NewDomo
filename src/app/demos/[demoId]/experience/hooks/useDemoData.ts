import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { UIState } from '@/lib/tavus/UI_STATES';
import { getErrorMessage, logError } from '@/lib/errors';

// Validate that a URL points to a Daily room (required by our CVI join logic)
const isDailyRoomUrl = (url: string) => /^https?:\/\/[a-z0-9.-]+\.daily\.co\/.+/i.test(url);

export interface Demo {
  id: string;
  name: string;
  user_id: string;
  tavus_conversation_id: string | null;
  metadata: {
    agentName?: string;
    agentPersonality?: string;
    agentGreeting?: string;
    tavusAgentId?: string;
    tavusShareableLink?: string;
    tavusPersonaId?: string;
    agentCreatedAt?: string;
    ctaTitle?: string;
    ctaMessage?: string;
    ctaButtonText?: string;
    ctaButtonUrl?: string;
  } | null;
  // Admin-level CTA fields
  cta_title?: string;
  cta_message?: string;
  cta_button_text?: string;
  cta_button_url?: string;
  // Legacy CTA fields
  cta_text?: string;
  cta_link?: string;
}

interface UseDemoDataResult {
  demo: Demo | null;
  loading: boolean;
  error: string | null;
  conversationUrl: string | null;
  conversationId: string | null; // Current session's conversation ID (not shared)
  uiState: UIState;
  setUiState: (state: UIState) => void;
  videoTitles: string[];
  startConversation: () => Promise<void>;
  joiningCall: boolean;
}

export function useDemoData(demoId: string, forceNew: boolean, isE2E: boolean): UseDemoDataResult {
  const [demo, setDemo] = useState<Demo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversationUrl, setConversationUrl] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null); // Session-specific, not shared
  const [uiState, setUiState] = useState<UIState>(UIState.IDLE);
  const [videoTitles, setVideoTitles] = useState<string[]>([]);
  const [joiningCall, setJoiningCall] = useState(false);

  // Fetch demo data only (don't start conversation automatically)
  useEffect(() => {
    const fetchDemoData = async () => {
      try {
        // E2E mode: provide stub data, avoid network calls
        if (isE2E) {
          const stubDemo: Demo = {
            id: demoId,
            name: 'E2E Demo',
            user_id: 'e2e-user',
            tavus_conversation_id: 'e2e-conv',
            metadata: {
              tavusShareableLink: 'about:blank',
              ctaTitle: 'Ready to Get Started?',
              ctaMessage: 'Take the next step today!',
              ctaButtonText: 'Start Free Trial',
              ctaButtonUrl: 'https://example.com/meta-start'
            },
            cta_title: 'Ready to Get Started?',
            cta_message: 'Take the next step today!',
            cta_button_text: 'Start Free Trial',
            cta_button_url: 'https://example.com/admin-start'
          };
          setDemo(stubDemo);
          setVideoTitles(['E2E Test Video', 'E2E Second Video']);
          setConversationUrl('about:blank');
          setUiState(UIState.CONVERSATION);
          setLoading(false);
          return;
        }

        // Get demo data
        const { data: demoData, error: demoError } = await supabase
          .from('demos')
          .select('*')
          .eq('id', demoId)
          .single();

        if (demoError || !demoData) {
          setError('Demo not found');
          setLoading(false);
          return;
        }

        // Parse metadata if it's a string BEFORE setting demo state
        let processedDemoData = { ...demoData };

        if (typeof processedDemoData.metadata === 'string') {
          try {
            processedDemoData.metadata = JSON.parse(processedDemoData.metadata);
          } catch (e: unknown) {
            logError(e, 'Failed to parse metadata');
            processedDemoData.metadata = {};
          }
        }

        // Set the demo with properly parsed metadata
        setDemo(processedDemoData);

        // Load available video titles for dropdown debugging
        try {
          const { data: titlesData, error: titlesError } = await supabase
            .from('demo_videos')
            .select('title')
            .eq('demo_id', processedDemoData.id);
          if (titlesError) {
            console.warn('Failed to load video titles', titlesError);
          } else if (Array.isArray(titlesData)) {
            const titles = titlesData
              .map((row: any) => row?.title)
              .filter((t: any): t is string => typeof t === 'string' && t.trim().length > 0);
            setVideoTitles(titles);
          }
        } catch (e) {
          console.warn('Unexpected error loading video titles', e);
        }

        setLoading(false);
      } catch (err: unknown) {
        setError(getErrorMessage(err, 'Failed to load demo'));
        setLoading(false);
      }
    };

    fetchDemoData();
  }, [demoId, isE2E]);

  // Start conversation - called when user clicks "Join Call"
  const startConversation = useCallback(async () => {
    if (!demo) return;

    setJoiningCall(true);
    setError(null);

    try {
      // In-flight client-side dedupe (helps with React Strict Mode double-invoke in dev)
      const win: any = typeof window !== 'undefined' ? window : undefined;
      if (win) {
        win.__startConvInflight = win.__startConvInflight || new Map<string, Promise<any>>();
      }
      const inflight: Map<string, Promise<any>> | undefined = win?.__startConvInflight;
      let startPromise = inflight?.get(demo.id);

      if (!startPromise) {
        startPromise = fetch('/api/start-conversation', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ demoId: demo.id, forceNew }),
        }).then(async (resp) => {
          if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            throw err;
          }
          return resp.json();
        });
        inflight?.set(demo.id, startPromise);
      }

      let data: any;
      try {
        data = await startPromise;
      } finally {
        inflight?.delete(demo.id);
      }

      const url = data?.conversation_url as string | undefined;
      const convId = data?.conversation_id as string | undefined;
      if (url && isDailyRoomUrl(url)) {
        setConversationUrl(url);
        setConversationId(convId || null); // Store session-specific conversation ID
        setUiState(UIState.CONVERSATION);
      } else {
        console.warn('Received non-Daily conversation URL from API:', url);
        setError('Conversation URL invalid. Please verify Domo configuration.');
      }
    } catch (e: any) {
      console.error('Error starting conversation:', e);
      setError(e?.error || e?.message || 'Failed to start conversation');
    } finally {
      setJoiningCall(false);
    }
  }, [demo, forceNew]);

  return {
    demo,
    loading,
    error,
    conversationUrl,
    conversationId, // Session-specific conversation ID (not from shared database)
    uiState,
    setUiState,
    videoTitles,
    startConversation,
    joiningCall,
  };
}
