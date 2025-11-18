import { useState } from 'react';
import type { Demo, CtaOverrides } from '../types';

export function useCTAState(demo: Demo | null) {
  const [showCTA, setShowCTA] = useState(false);
  const [ctaOverrides, setCtaOverrides] = useState<CtaOverrides | null>(null);

  const ctaTitle = ctaOverrides?.cta_title || demo?.cta_title || demo?.metadata?.ctaTitle || 'Ready to Get Started?';
  const ctaMessage = ctaOverrides?.cta_message || demo?.cta_message || demo?.metadata?.ctaMessage || demo?.cta_text || 'Take the next step today!';
  const ctaButtonText = ctaOverrides?.cta_button_text || demo?.cta_button_text || demo?.metadata?.ctaButtonText || 'Start Free Trial';
  const ctaButtonUrl = ctaOverrides?.cta_button_url || demo?.cta_button_url || demo?.metadata?.ctaButtonUrl || demo?.cta_link || 'https://bolt.new';

  return {
    showCTA,
    setShowCTA,
    ctaOverrides,
    setCtaOverrides,
    ctaTitle,
    ctaMessage,
    ctaButtonText,
    ctaButtonUrl,
  };
}
