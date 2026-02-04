'use client';

/**
 * Read-Only Demo Viewer
 *
 * A public-facing demo experience page that:
 * - Shows the full demo experience without edit access
 * - Uses a viewer account (test@example.com) for Workday demos
 * - Has all interactive buttons visible but in view-only mode
 * - Redirects to reporting page after demo ends
 *
 * Route: /view/[demoId]
 */

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DemoExperienceView } from '@/components/conversation';
import { supabase } from '@/lib/supabase';

// Viewer mode configuration
const VIEWER_CONFIG = {
  // Default viewer email for tracking
  viewerEmail: 'test@example.com',
  // Disable editing capabilities
  readOnly: true,
};

interface DemoData {
  id: string;
  name: string;
  tavus_persona_id: string | null;
  metadata: {
    agentName?: string;
    agentGreeting?: string;
  } | null;
  cta_title: string | null;
  cta_message: string | null;
  cta_button_text: string | null;
  cta_button_url: string | null;
}

export default function DemoViewerPage() {
  const params = useParams();
  const router = useRouter();
  const demoId = params.demoId as string;

  const [demo, setDemo] = useState<DemoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversationUrl, setConversationUrl] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [joiningCall, setJoiningCall] = useState(false);

  // Fetch demo data (public access)
  useEffect(() => {
    async function fetchDemo() {
      try {
        setLoading(true);

        // Fetch demo data - this is public viewing
        const { data, error: fetchError } = await supabase
          .from('demos')
          .select('id, name, tavus_persona_id, metadata, cta_title, cta_message, cta_button_text, cta_button_url')
          .eq('id', demoId)
          .single();

        if (fetchError || !data) {
          setError('Demo not found');
          return;
        }

        setDemo(data);
      } catch (err) {
        setError('Failed to load demo');
        console.error('Error fetching demo:', err);
      } finally {
        setLoading(false);
      }
    }

    if (demoId) {
      fetchDemo();
    }
  }, [demoId]);

  // Start conversation when demo is loaded
  useEffect(() => {
    async function startViewerConversation() {
      if (!demo || conversationUrl || joiningCall || error) return;
      if (!demo.tavus_persona_id) {
        setError('Demo agent not configured. Please contact the demo owner.');
        return;
      }

      setJoiningCall(true);

      try {
        const response = await fetch('/api/start-conversation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            demoId: demo.id,
            personaId: demo.tavus_persona_id,
            viewerMode: true,
            viewerEmail: VIEWER_CONFIG.viewerEmail,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to start conversation');
        }

        const data = await response.json();
        setConversationUrl(data.conversationUrl || data.conversation_url);
        setConversationId(data.conversationId || data.conversation_id);
      } catch (err) {
        console.error('Failed to start viewer conversation:', err);
        setError(err instanceof Error ? err.message : 'Failed to start demo');
      } finally {
        setJoiningCall(false);
      }
    }

    startViewerConversation();
  }, [demo, conversationUrl, joiningCall, error]);

  // Handle conversation end - redirect to public reporting
  const handleConversationEnd = useCallback(async () => {
    // Redirect to public reporting page (not the private /demos/ version)
    router.push(`/view/${demoId}/reporting`);

    // End the conversation in background
    if (conversationId) {
      fetch('/api/end-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          demoId: demo?.id,
        }),
      }).catch(() => {});
    }
  }, [conversationId, demo?.id, demoId, router]);

  // Get agent name
  const agentName = demo?.metadata?.agentName || 'Demo Agent';

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-domo-bg-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-domo-primary mx-auto mb-4" />
          <p className="text-domo-text-secondary">Loading demo experience...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-domo-bg-dark flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-domo-text-primary mb-2">Unable to Load Demo</h2>
          <p className="text-domo-text-secondary mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-domo-primary text-white rounded-lg hover:bg-domo-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <DemoExperienceView
      demoName={demo?.name || 'Demo'}
      demoId={demoId}
      agentName={agentName}
      conversationUrl={conversationUrl}
      conversationId={conversationId}
      loading={joiningCall}
      error={null}
      showLobby={false}
      skipEndedScreen={true}
      ctaTitle={demo?.cta_title || undefined}
      ctaMessage={demo?.cta_message || undefined}
      ctaButtonText={demo?.cta_button_text || 'Learn More'}
      ctaButtonUrl={demo?.cta_button_url || undefined}
      onConversationEnd={handleConversationEnd}
      onToolCall={() => {}}
      onCTAClick={() => {
        if (demo?.cta_button_url) {
          window.open(demo.cta_button_url, '_blank');
        }
      }}
      onRetry={() => window.location.reload()}
      isViewerMode={true}
    />
  );
}
