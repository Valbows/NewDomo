'use client';

import { useCallback, useEffect } from 'react';
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
    conversationId, // Session-specific, not from shared database
    videoTitles,
    startConversation,
    joiningCall,
  } = useDemoData(demoId, forceNew, isE2E);

  // Auto-start conversation when demo is loaded (skip lobby for experience page)
  useEffect(() => {
    if (demo && !conversationUrl && !joiningCall && !error) {
      startConversation();
    }
  }, [demo, conversationUrl, joiningCall, error, startConversation]);

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
    conversationId: conversationId, // Use session-specific ID
    demoId: demo?.id,
  });

  // Handle conversation end
  const handleConversationEnd = useCallback(async () => {
    // Redirect immediately - don't wait for API calls
    router.push(`/demos/${demoId}/reporting`);

    // End the Tavus conversation via API in background (non-blocking)
    if (conversationId) {
      fetch('/api/end-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversationId,
          demoId: demo?.id,
        }),
      }).then((response) => {
        if (response.ok) {
          // Sync conversation data in background
          fetch(`/api/sync-tavus-conversations?demoId=${demo?.id}`, {
            method: 'GET',
          }).catch(() => {});
        }
      }).catch(() => {});
    }
  }, [conversationId, demo?.id, demoId, router]);

  // Handle tool calls (for any experience-specific tracking)
  const handleToolCall = useCallback((_toolCall: any) => {
    // Tool calls are handled by the shared component
    // Additional experience-specific handling can be added here
  }, []);

  // Get agent name from metadata
  const agentName = demo?.metadata?.agentName;

  return (
    <DemoExperienceView
      demoName={demo?.name || 'Demo'}
      demoId={demoId}
      agentName={agentName}
      conversationUrl={conversationUrl}
      conversationId={conversationId}
      loading={loading || joiningCall}
      error={error}
      showLobby={false}
      skipEndedScreen={true}
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
