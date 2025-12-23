'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { DemoExperienceView } from '@/components/conversation';

interface EmbedConfig {
  demoId: string;
  name: string;
  agentName: string;
  hasPersona: boolean;
  cta: {
    title?: string;
    message?: string;
    buttonText?: string;
    buttonUrl?: string;
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

  // Fetch embed config and start conversation
  useEffect(() => {
    const initEmbed = async () => {
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

        // Start conversation
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
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to load demo');
        setLoading(false);
      }
    };

    if (token) {
      initEmbed();
    }
  }, [token]);

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
      conversationUrl={conversationUrl}
      conversationId={conversationId}
      loading={loading}
      error={error}
      ctaTitle={config?.cta.title}
      ctaMessage={config?.cta.message}
      ctaButtonText={config?.cta.buttonText}
      ctaButtonUrl={config?.cta.buttonUrl}
      onConversationEnd={handleConversationEnd}
      onToolCall={handleToolCall}
      onCTAClick={handleCTAClick}
      onRetry={() => window.location.reload()}
      onRestart={handleRestartConversation}
      source="embed"
      embedToken={token}
    />
  );
}
