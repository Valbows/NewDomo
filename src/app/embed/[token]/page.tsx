'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { DemoExperienceView } from '@/components/conversation';

interface EmbedConfig {
  demoId: string;
  name: string;
  agentName: string;
  hasPersona: boolean;
  videoTitles?: string[];
  cta: {
    title?: string;
    message?: string;
    buttonText?: string;
    buttonUrl?: string;
    returnUrl?: string;
  };
}

export default function EmbedPage() {
  const params = useParams();
  const token = params.token as string;

  // State
  const [config, setConfig] = useState<EmbedConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversationUrl, setConversationUrl] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [joiningCall, setJoiningCall] = useState(false);

  // Capture referrer URL on mount (customer's website)
  const returnUrlRef = useRef<string | null>(null);
  useEffect(() => {
    // Get the referrer - this is the page that embedded this demo
    if (typeof document !== 'undefined' && document.referrer) {
      // Only use referrer if it's a different origin (not our own site)
      try {
        const referrerUrl = new URL(document.referrer);
        const currentUrl = new URL(window.location.href);
        if (referrerUrl.origin !== currentUrl.origin) {
          returnUrlRef.current = document.referrer;
        }
      } catch {
        // Invalid URL, ignore
      }
    }
  }, []);

  // Fetch embed config only (don't start conversation automatically)
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        // Fetch embed config
        const configResp = await fetch(`/api/embed/${token}/config`);
        if (!configResp.ok) {
          const err = await configResp.json().catch(() => ({}));
          throw new Error(err.error || 'Demo not found or embedding is not enabled');
        }
        const configData = await configResp.json();
        setConfig(configData);

        if (!configData.hasPersona) {
          throw new Error('This demo does not have a configured AI agent');
        }

        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to load demo');
        setLoading(false);
      }
    };

    if (token) {
      fetchConfig();
    }
  }, [token]);

  // Handle join call - start conversation when user clicks join
  const handleJoinCall = useCallback(async () => {
    if (!config) return;

    setJoiningCall(true);
    setError(null);

    try {
      const startResp = await fetch(`/api/embed/${token}/start-conversation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!startResp.ok) {
        const err = await startResp.json().catch(() => ({}));
        throw new Error(err.error || err.message || 'Failed to start conversation');
      }

      const startData = await startResp.json();
      setConversationUrl(startData.conversation_url);
      setConversationId(startData.conversation_id);
    } catch (err: any) {
      setError(err.message || 'Failed to start conversation');
    } finally {
      setJoiningCall(false);
    }
  }, [config, token]);

  // Handle conversation end
  const handleConversationEnd = useCallback(async () => {
    if (conversationId) {
      try {
        await fetch(`/api/embed/${token}/end-conversation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId }),
        });
      } catch (e) {
        console.warn('Error ending conversation:', e);
      }
    }
  }, [conversationId, token]);

  // Handle restart conversation
  const handleRestartConversation = useCallback(async () => {
    if (!config) return;

    setLoading(true);
    setError(null);

    try {
      const startResp = await fetch(`/api/embed/${token}/start-conversation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!startResp.ok) {
        const err = await startResp.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to start conversation');
      }

      const startData = await startResp.json();
      setConversationUrl(startData.conversation_url);
      setConversationId(startData.conversation_id);
    } catch (err: any) {
      setError(err.message || 'Failed to restart conversation');
    } finally {
      setLoading(false);
    }
  }, [config, token]);

  // Handle tool calls (for tracking)
  const handleToolCall = useCallback((toolCall: any) => {
    // Tool calls are handled by the shared component
    // We can add embed-specific tracking here if needed
  }, []);

  // Handle CTA click tracking
  const handleCTAClick = useCallback(async () => {
    if (config?.demoId && conversationId) {
      try {
        await fetch('/api/track-cta-click', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            demo_id: config.demoId,
            conversation_id: conversationId,
          }),
        });
      } catch (e) {
        console.warn('Error tracking CTA click:', e);
      }
    }
  }, [config?.demoId, conversationId]);

  return (
    <DemoExperienceView
      demoName={config?.name || 'Demo'}
      demoId={config?.demoId || ''}
      agentName={config?.agentName}
      conversationUrl={conversationUrl}
      conversationId={conversationId}
      loading={loading}
      error={error}
      showLobby={true}
      onJoinCall={handleJoinCall}
      joiningCall={joiningCall}
      ctaTitle={config?.cta.title}
      ctaMessage={config?.cta.message}
      ctaButtonText={config?.cta.buttonText}
      ctaButtonUrl={config?.cta.buttonUrl}
      returnUrl={config?.cta.returnUrl || returnUrlRef.current || undefined}
      onConversationEnd={handleConversationEnd}
      onToolCall={handleToolCall}
      onCTAClick={handleCTAClick}
      onRetry={() => window.location.reload()}
      onRestart={handleRestartConversation}
      source="embed"
      embedToken={token}
      debugVideoTitles={config?.videoTitles || []}
    />
  );
}
