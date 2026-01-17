import { useState, useCallback } from 'react';
import type { Demo } from './useDemoData';
import type { CtaOverrides } from './useRealtimeSubscription';

// Helper function to extract conversation ID from Tavus Daily URL
function extractConversationIdFromUrl(url: string): string | null {
  try {
    const match = url.match(/tavus\.daily\.co\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

interface UseCTAParams {
  demo: Demo | null;
  conversationUrl: string | null;
}

interface UseCTAResult {
  showCTA: boolean;
  setShowCTA: (show: boolean) => void;
  ctaOverrides: CtaOverrides | null;
  setCtaOverrides: (overrides: CtaOverrides | null) => void;
  ctaTitle: string;
  ctaMessage: string;
  ctaButtonText: string;
  ctaButtonUrl: string;
  handleCTAClick: () => Promise<void>;
}

export function useCTA({ demo, conversationUrl }: UseCTAParams): UseCTAResult {
  const [showCTA, setShowCTA] = useState(false);
  const [ctaOverrides, setCtaOverrides] = useState<CtaOverrides | null>(null);

  // Derive final CTA values: admin fields > override > metadata > fallback
  const ctaTitle =
    ctaOverrides?.cta_title ?? demo?.cta_title ?? demo?.metadata?.ctaTitle ?? 'Ready to Get Started?';
  const ctaMessage =
    ctaOverrides?.cta_message ?? demo?.cta_message ?? demo?.metadata?.ctaMessage ?? 'Take the next step today!';
  const ctaButtonText =
    ctaOverrides?.cta_button_text ?? demo?.cta_button_text ?? demo?.metadata?.ctaButtonText ?? 'Start Free Trial';
  const ctaButtonUrl =
    ctaOverrides?.cta_button_url ?? demo?.cta_button_url ?? demo?.metadata?.ctaButtonUrl ?? '#';

  const handleCTAClick = useCallback(async () => {
    const currentConversationId = conversationUrl
      ? extractConversationIdFromUrl(conversationUrl)
      : demo?.tavus_conversation_id;

    if (currentConversationId && demo?.id) {
      try {
        await fetch('/api/track-cta-click', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversation_id: currentConversationId,
            demo_id: demo.id,
            cta_url: ctaButtonUrl
          })
        });
      } catch (error) {
        console.warn('Failed to track CTA click:', error);
      }
    }
  }, [conversationUrl, demo?.tavus_conversation_id, demo?.id, ctaButtonUrl]);

  return {
    showCTA,
    setShowCTA,
    ctaOverrides,
    setCtaOverrides,
    ctaTitle,
    ctaMessage,
    ctaButtonText,
    ctaButtonUrl,
    handleCTAClick,
  };
}
