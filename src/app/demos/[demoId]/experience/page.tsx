'use client';

import { useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { DemoExperienceView } from '@/components/conversation';

// Import custom hooks
import { useDemoData } from './hooks/useDemoData';
import { useRealtimeSubscription } from './hooks/useRealtimeSubscription';
import { useBeforeUnload } from './hooks/useBeforeUnload';
import { useCTA } from './hooks/useCTA';

export default function DemoExperiencePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const demoId = params.demoId as string;

  // Parse forceNew from URL
  const forceNew = (() => {
    try {
      const val = (searchParams?.get('forceNew') || searchParams?.get('force') || '').toString().toLowerCase();
      return val === '1' || val === 'true' || val === 'yes';
    } catch {
      return false;
    }
  })();

  const isE2E = process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true';

  // Use custom hooks
  const {
    demo,
    loading,
    error,
    conversationUrl,
    videoTitles,
  } = useDemoData(demoId, forceNew, isE2E);

  // CTA hook
  const {
    ctaTitle,
    ctaMessage,
    ctaButtonText,
    ctaButtonUrl,
    handleCTAClick,
  } = useCTA({ demo, conversationUrl });

  // Subscribe to Supabase Realtime (for live updates from dashboard)
  useRealtimeSubscription({
    demoId,
    onPlayVideo: () => {}, // Handled by shared component
    onShowCTA: () => {}, // Handled by shared component
  });

  // Handle browser window close/refresh
  useBeforeUnload({
    conversationId: demo?.tavus_conversation_id,
    demoId: demo?.id,
  });

  // Handle conversation end
  const handleConversationEnd = useCallback(async () => {
    // End the Tavus conversation via API if we have a conversation ID
    if (demo?.tavus_conversation_id) {
      try {
        const response = await fetch('/api/end-conversation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: demo.tavus_conversation_id,
            demoId: demo.id,
          }),
        });

        if (response.ok) {
          // Automatically sync conversation data after ending
          try {
            await fetch(`/api/sync-tavus-conversations?demoId=${demo.id}`, {
              method: 'GET',
            });
          } catch (syncError) {
            console.warn('Error syncing conversation data:', syncError);
          }

          // Small delay to ensure sync completes before redirect
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.warn('Error ending Tavus conversation:', error);
      }
    }

    // Redirect to the reporting page
    router.push(`/demos/${demoId}/configure?tab=reporting`);
  }, [demo?.tavus_conversation_id, demo?.id, demoId, router]);

  // Handle tool calls (for any experience-specific tracking)
  const handleToolCall = useCallback((_toolCall: any) => {
    // Tool calls are handled by the shared component
    // Additional experience-specific handling can be added here
  }, []);

  return (
    <DemoExperienceView
      demoName={demo?.name || 'Demo'}
      demoId={demoId}
      conversationUrl={conversationUrl}
      conversationId={demo?.tavus_conversation_id}
      loading={loading}
      error={error}
      ctaTitle={ctaTitle}
      ctaMessage={ctaMessage}
      ctaButtonText={ctaButtonText}
      ctaButtonUrl={ctaButtonUrl}
      onConversationEnd={handleConversationEnd}
      onToolCall={handleToolCall}
      onCTAClick={handleCTAClick}
      onRetry={() => window.location.reload()}
      debugVideoTitles={videoTitles}
    />
  );
}
