'use client';

interface CTABannerProps {
  title?: string;
  message?: string;
  buttonText?: string;
  buttonUrl?: string;
  onButtonClick?: () => void;
  onClose: () => void;
}

/**
 * Shared CTA banner that appears at the bottom of conversation pages.
 */
export function CTABanner({
  title = 'Ready to Get Started?',
  message = 'Take the next step today!',
  buttonText = 'Learn More',
  buttonUrl,
  onButtonClick,
  onClose,
}: CTABannerProps) {
  if (!buttonUrl) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 shadow-lg" data-testid="cta-banner">
      <div className="bg-gradient-to-r from-domo-success to-domo-primary">
        <div className="mx-auto max-w-7xl py-4 px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-xl mr-3">✅</div>
              <div>
                <h3 className="text-lg font-bold text-white">{title}</h3>
                <p className="text-sm text-white/80">{message}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 ml-6">
              <a
                href={buttonUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onButtonClick}
                className="inline-flex items-center justify-center px-6 py-2 bg-white text-domo-primary font-semibold rounded-lg shadow hover:bg-white/90 transition-colors duration-200 text-sm"
              >
                {buttonText}
              </a>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white p-1"
                aria-label="Close CTA"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
