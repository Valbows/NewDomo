import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { UIState } from '@/lib/tavus/UI_STATES';
import { extractConversationIdFromUrl, isDailyRoomUrl } from '../utils/helpers';
import type { Demo } from '../types';

export function useDemoConversation(demoId: string) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [demo, setDemo] = useState<Demo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uiState, setUiState] = useState<UIState>(UIState.IDLE);
  const [conversationUrl, setConversationUrl] = useState<string | null>(null);
  const [videoTitles, setVideoTitles] = useState<string[]>([]);

  const isE2E = process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true';
  const forceNew = (() => {
    try {
      const val = (searchParams?.get('forceNew') || searchParams?.get('force') || '').toString().toLowerCase();
      return val === '1' || val === 'true' || val === 'yes';
    } catch {
      return false;
    }
  })();

  // Fetch demo data and start conversation
  useEffect(() => {
    const fetchDemoAndStartConversation = async () => {
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

        // Parse metadata if it's a string
        let processedDemoData = { ...demoData };
        if (typeof processedDemoData.metadata === 'string') {
          console.log('⚠️ Metadata is a string, parsing...');
          try {
            processedDemoData.metadata = JSON.parse(processedDemoData.metadata);
          } catch (err) {
            console.error('Failed to parse metadata:', err);
            processedDemoData.metadata = {};
          }
        }

        setDemo(processedDemoData);

        // Get video titles for dev mode
        const { data: videos } = await supabase
          .from('demo_videos')
          .select('title')
          .eq('demo_id', demoId)
          .order('order_index', { ascending: true });

        if (videos) {
          setVideoTitles(videos.map(v => v.title));
        }

        // Check if we have an existing conversation
        const existingConvId = processedDemoData.tavus_conversation_id;
        const shareableLink = processedDemoData.metadata?.tavusShareableLink;

        if (!forceNew && existingConvId && shareableLink) {
          console.log('Using existing conversation:', existingConvId);
          setConversationUrl(shareableLink);
          setUiState(UIState.CONVERSATION);
          setLoading(false);
          return;
        }

        // Start new conversation
        console.log('Starting new conversation...');
        const response = await fetch('/api/create-agent-and-start-conversation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ demoId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to start conversation');
        }

        const data = await response.json();

        if (data.conversationUrl) {
          const conversationId = isDailyRoomUrl(data.conversationUrl)
            ? extractConversationIdFromUrl(data.conversationUrl)
            : data.conversationId;

          // Update demo with new conversation data
          await supabase
            .from('demos')
            .update({
              tavus_conversation_id: conversationId,
              metadata: {
                ...processedDemoData.metadata,
                tavusShareableLink: data.conversationUrl,
              },
            })
            .eq('id', demoId);

          setConversationUrl(data.conversationUrl);
          setUiState(UIState.CONVERSATION);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error in fetchDemoAndStartConversation:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    fetchDemoAndStartConversation();
  }, [demoId, forceNew, isE2E, searchParams]);

  // Handle conversation end
  const endConversation = () => {
    router.push(`/demos/${demoId}/configure?tab=reporting`);
  };

  return {
    demo,
    loading,
    error,
    uiState,
    setUiState,
    conversationUrl,
    videoTitles,
    endConversation,
  };
}
