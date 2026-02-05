'use client';

/**
 * Read-Only Demo Viewer
 *
 * A public-facing demo experience page that:
 * - Shows a lobby screen before starting
 * - Shows the full demo experience without edit access
 * - Uses a viewer account (test@example.com) for tracking
 * - Redirects to reporting page after demo ends
 *
 * Route: /view/[demoId]
 */

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DemoExperienceView } from '@/components/conversation';
import { Video, Camera, BarChart3, Play } from 'lucide-react';

// Viewer mode configuration
const VIEWER_CONFIG = {
  // Default viewer email for tracking
  viewerEmail: 'test@example.com',
  // Disable editing capabilities
  readOnly: true,
  // Only allow this specific demo ID for public viewing (Workday demo)
  allowedDemoId: 'cbb04ff3-07e7-46bf-bfc3-db47ceaf85de',
};

// Demo metadata for the lobby screen
const DEMO_INFO = {
  title: 'Workday Product Demo',
  subtitle: 'Experience an AI-powered interactive demo',
  description: 'This demo showcases how Domo creates engaging, personalized product demonstrations using AI video technology.',
  features: [
    {
      icon: Video,
      title: 'Interactive Video Demo',
      description: 'Watch product videos and ask questions in real-time',
    },
    {
      icon: Camera,
      title: 'AI Perception Analysis',
      description: 'Our AI analyzes engagement to personalize your experience',
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'See the reporting insights after your demo session',
    },
  ],
  disclaimer: 'For the best experience and to see our perception analysis capabilities, please enable your camera. Your video is processed in real-time and not stored.',
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
  const [showLobby, setShowLobby] = useState(true);
  const [conversationUrl, setConversationUrl] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [joiningCall, setJoiningCall] = useState(false);

  // Check if demo ID is allowed
  useEffect(() => {
    if (demoId !== VIEWER_CONFIG.allowedDemoId) {
      setError('Demo not found');
      setLoading(false);
      return;
    }

    // Set demo data directly (bypassing Supabase RLS for this specific demo)
    setDemo({
      id: demoId,
      name: DEMO_INFO.title,
      tavus_persona_id: null, // Will be fetched when starting conversation
      metadata: {
        agentName: 'Domo Agent',
        agentGreeting: 'Hello! Welcome to the Workday demo.',
      },
      cta_title: 'Ready to Get Started?',
      cta_message: 'Create your own AI-powered demos with Domo.',
      cta_button_text: 'Learn More',
      cta_button_url: 'https://domo.ai',
    });
    setLoading(false);
  }, [demoId]);

  // Start conversation when user clicks "Ready to Join"
  const handleStartDemo = useCallback(async () => {
    if (joiningCall) return;

    setJoiningCall(true);
    setShowLobby(false);

    try {
      const response = await fetch('/api/start-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          demoId: demoId,
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
      setShowLobby(true);
    } finally {
      setJoiningCall(false);
    }
  }, [demoId, joiningCall]);

  // Handle conversation end - redirect to public reporting
  const handleConversationEnd = useCallback(async () => {
    // Redirect to public reporting page
    router.push(`/view/${demoId}/reporting`);

    // End the conversation in background
    if (conversationId) {
      fetch('/api/end-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          demoId: demoId,
        }),
      }).catch(() => {});
    }
  }, [conversationId, demoId, router]);

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

  // Show lobby screen
  if (showLobby && !conversationUrl) {
    return (
      <div className="min-h-screen bg-domo-bg-dark flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-domo-primary/20 mb-4">
              <Play className="w-8 h-8 text-domo-primary" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 font-heading">
              {DEMO_INFO.title}
            </h1>
            <p className="text-lg text-domo-text-secondary">
              {DEMO_INFO.subtitle}
            </p>
          </div>

          {/* Description */}
          <div className="bg-domo-bg-card border border-domo-border rounded-2xl p-6 mb-6">
            <p className="text-domo-text-secondary text-center mb-6">
              {DEMO_INFO.description}
            </p>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {DEMO_INFO.features.map((feature, index) => (
                <div key={index} className="text-center p-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-domo-bg-elevated mb-3">
                    <feature.icon className="w-6 h-6 text-domo-primary" />
                  </div>
                  <h3 className="text-white font-medium mb-1">{feature.title}</h3>
                  <p className="text-sm text-domo-text-muted">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <Camera className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-200">
                {DEMO_INFO.disclaimer}
              </p>
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={handleStartDemo}
            disabled={joiningCall}
            className="w-full py-4 px-6 bg-domo-primary text-white font-semibold text-lg rounded-xl hover:bg-domo-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {joiningCall ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" />
                Starting Demo...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Ready to Join
              </>
            )}
          </button>

          {/* Footer */}
          <p className="text-center text-domo-text-muted text-sm mt-6">
            Powered by <span className="text-domo-primary font-medium">Domo AI</span>
          </p>
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
