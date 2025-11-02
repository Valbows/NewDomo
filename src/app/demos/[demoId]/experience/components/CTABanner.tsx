interface Demo {
  id: string;
  name: string;
  user_id: string;
  tavus_conversation_id: string | null;
  metadata: {
    agentName?: string;
    agentPersonality?: string;
    agentGreeting?: string;
    tavusAgentId?: string;
    tavusShareableLink?: string;
    tavusPersonaId?: string;
    agentCreatedAt?: string;
    ctaTitle?: string;
    ctaMessage?: string;
    ctaButtonText?: string;
    ctaButtonUrl?: string;
  } | null;
  cta_title?: string;
  cta_message?: string;
  cta_button_text?: string;
  cta_button_url?: string;
  cta_text?: string;
  cta_link?: string;
}

interface CTABannerProps {
  showCTA: boolean;
  demo: Demo | null;
  ctaTitle: string;
  ctaMessage: string;
  ctaButtonText: string;
  ctaButtonUrl: string;
  onDismiss: () => void;
}

export function CTABanner({
  showCTA,
  demo,
  ctaTitle,
  ctaMessage,
  ctaButtonText,
  ctaButtonUrl,
  onDismiss,
}: CTABannerProps) {
  if (!showCTA || !demo) {
    return null;
  }

  const handleCTAClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {

    // Track CTA click
    if (demo?.tavus_conversation_id && demo?.id) {
      try {
        await fetch('/api/webhooks/cta-click', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversation_id: demo.tavus_conversation_id,
            demo_id: demo.id,
            cta_url: ctaButtonUrl
          })
        });

      } catch (error) {
        // console.warn('⚠️ Failed to track CTA click:', error);
      }
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 shadow-lg" data-testid="cta-banner">
      <div className="bg-gradient-to-r from-green-400 to-blue-500">
        <div className="mx-auto max-w-7xl py-4 px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-xl mr-3">✅</div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {ctaTitle}
                </h3>
                <p className="text-sm text-green-100">
                  {ctaMessage}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 ml-6">
              <a
                href={ctaButtonUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleCTAClick}
                className="inline-flex items-center justify-center px-6 py-2 bg-white text-green-600 font-semibold rounded-lg shadow hover:bg-gray-50 transition-colors duration-200 text-sm"
              >
                {ctaButtonText}
              </a>
              <button
                onClick={onDismiss}
                className="inline-flex items-center justify-center px-4 py-2 border border-white text-white font-medium rounded-lg hover:bg-white/10 transition-colors duration-200 text-sm"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}