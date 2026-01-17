'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface ConversationEndedScreenProps {
  ctaUrl?: string;
  ctaButtonText?: string;
  returnUrl?: string;
  isPopup?: boolean;
  onClose?: () => void;
  countdownSeconds?: number;
}

/**
 * Screen shown when conversation ends.
 * Features:
 * - 10-second countdown before auto-redirect
 * - "Learn More" button to go to CTA immediately
 * - For full page: redirects to customer website + opens CTA in new tab
 * - For popup: shows "Close" button, auto-opens CTA in new tab after countdown
 */
export function ConversationEndedScreen({
  ctaUrl,
  ctaButtonText = 'Learn More',
  returnUrl,
  isPopup = false,
  onClose,
  countdownSeconds = 10,
}: ConversationEndedScreenProps) {
  const [countdown, setCountdown] = useState(countdownSeconds);
  const [hasRedirected, setHasRedirected] = useState(false);
  const hasRedirectedRef = useRef(false);

  const handleCtaRedirect = useCallback(() => {
    if (hasRedirectedRef.current) return;
    hasRedirectedRef.current = true;
    setHasRedirected(true);

    if (ctaUrl) {
      window.open(ctaUrl, '_blank', 'noopener,noreferrer');
    }

    if (!isPopup && returnUrl) {
      setTimeout(() => {
        window.location.href = returnUrl;
      }, 500);
    }

    if (isPopup && onClose) {
      setTimeout(() => {
        onClose();
      }, 500);
    }
  }, [ctaUrl, returnUrl, isPopup, onClose]);

  const handleLearnMoreClick = useCallback(() => {
    handleCtaRedirect();
  }, [handleCtaRedirect]);

  useEffect(() => {
    if (!ctaUrl) return;

    if (countdown <= 0 && !hasRedirectedRef.current) {
      handleCtaRedirect();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, ctaUrl, handleCtaRedirect]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-domo-bg-dark text-white p-8">
      {/* Logo */}
      <img
        src="/domo-logo.png"
        alt="Domo"
        className="h-32 mb-6"
      />

      <h2 className="text-3xl font-bold mb-3 font-heading">Thanks for chatting!</h2>
      <p className="text-domo-text-secondary mb-6 text-center text-lg">
        We hope you enjoyed the demo.
      </p>

      {/* Countdown message */}
      {ctaUrl && countdown > 0 && !hasRedirected && (
        <div className="bg-domo-bg-card border border-domo-border rounded-xl px-6 py-4 mb-6">
          <p className="text-domo-text-secondary text-center">
            Redirecting in <span className="font-bold text-domo-primary text-xl">{countdown}</span> seconds...
          </p>
        </div>
      )}

      {/* No CTA configured message */}
      {!ctaUrl && (
        <p className="text-domo-text-muted mb-6 text-center text-sm">
          No call-to-action configured for this demo.
        </p>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-4 items-center w-full max-w-xs">
        {/* Learn More button */}
        {ctaUrl && !hasRedirected && (
          <button
            onClick={handleLearnMoreClick}
            className="w-full px-8 py-4 bg-domo-primary hover:bg-domo-secondary text-white font-semibold rounded-xl transition-colors text-lg"
          >
            {ctaButtonText}
          </button>
        )}

        {/* For popup: Close button */}
        {isPopup && onClose && (
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-domo-bg-card border border-domo-border hover:border-domo-primary text-white font-medium rounded-xl transition-colors"
          >
            Close
          </button>
        )}
      </div>

      {/* Redirected message */}
      {hasRedirected && (
        <div className="mt-6 flex items-center gap-2 text-domo-text-secondary">
          <svg className="animate-spin h-5 w-5 text-domo-primary" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>{ctaUrl ? 'Opening in new tab...' : 'Thank you for your time!'}</span>
        </div>
      )}
    </div>
  );
}
