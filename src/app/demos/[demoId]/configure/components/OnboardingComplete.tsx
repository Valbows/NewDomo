'use client';

import { useState, useEffect, useCallback } from 'react';
import { Copy, Check, ExternalLink, PartyPopper } from 'lucide-react';

interface OnboardingCompleteProps {
  demoId: string;
  demoName: string;
  embedToken?: string;
  onDismiss: () => void;
}

// Confetti particle component
function ConfettiParticle({ delay, left, color, shape }: { delay: number; left: number; color: string; shape: 'circle' | 'square' }) {
  return (
    <div
      className="absolute w-3 h-3"
      style={{
        left: `${left}%`,
        top: '-20px',
        backgroundColor: color,
        borderRadius: shape === 'circle' ? '50%' : '0%',
        animation: `confettiFall 4s ease-in-out ${delay}s infinite`,
      }}
    />
  );
}

export function OnboardingComplete({ demoId, demoName, embedToken, onDismiss }: OnboardingCompleteProps) {
  const [copied, setCopied] = useState<'popup' | 'iframe' | null>(null);
  const [showContent, setShowContent] = useState(false);

  // Animate content in after confetti starts
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : '';

  const embedUrl = embedToken ? `${baseUrl}/embed/${embedToken}` : null;

  const popupCode = embedToken
    ? `<!-- Add this script to your page (once) -->
<script src="${baseUrl}/embed.js" data-base-url="${baseUrl}"></script>

<!-- Add this to your button -->
<button onclick="Domo.open('${embedToken}')">
  Book a Demo
</button>`
    : '';

  const iframeCode = embedUrl
    ? `<iframe
  src="${embedUrl}"
  width="100%"
  height="600"
  frameborder="0"
  allow="camera; microphone"
></iframe>`
    : '';

  const handleCopy = useCallback(async (type: 'popup' | 'iframe') => {
    const text = type === 'popup' ? popupCode : iframeCode;
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [popupCode, iframeCode]);

  // Generate confetti particles
  const confettiColors = ['#248BFB', '#6FB3FC', '#4ade80', '#fbbf24', '#f472b6', '#a78bfa'];
  const confettiParticles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    delay: Math.random() * 3,
    left: Math.random() * 100,
    color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
    shape: (Math.random() > 0.5 ? 'circle' : 'square') as 'circle' | 'square',
  }));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-domo-bg-dark" />

      {/* Confetti container */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {confettiParticles.map((particle) => (
          <ConfettiParticle
            key={particle.id}
            delay={particle.delay}
            left={particle.left}
            color={particle.color}
            shape={particle.shape}
          />
        ))}
      </div>

      {/* Content */}
      <div className={`relative z-10 flex flex-col items-center justify-center min-h-screen px-4 transition-all duration-500 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Celebration icon */}
        <div className="mb-6 relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-domo-primary to-domo-secondary flex items-center justify-center animate-bounce-slow">
            <PartyPopper className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 text-center font-heading">
          Congratulations!
        </h1>
        <p className="text-xl text-domo-text-secondary mb-2 text-center">
          Your demo <span className="text-domo-primary font-semibold">"{demoName}"</span> is ready!
        </p>
        <p className="text-domo-text-muted mb-8 text-center max-w-md">
          Copy the embed code below to add your demo to any website.
        </p>

        {/* Embed Code Cards */}
        {embedToken && (
          <div className="w-full max-w-2xl space-y-4 mb-8">
            {/* Popup Button Code */}
            <div className="bg-domo-bg-card border border-domo-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-domo-border">
                <div>
                  <h3 className="font-medium text-white">Popup Button</h3>
                  <p className="text-xs text-domo-text-muted">Opens demo in a modal overlay</p>
                </div>
                <button
                  onClick={() => handleCopy('popup')}
                  className="flex items-center gap-2 px-4 py-2 bg-domo-primary hover:bg-domo-secondary text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {copied === 'popup' ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Code
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 bg-domo-bg-dark text-domo-text-secondary text-xs overflow-x-auto max-h-32">
                <code>{popupCode}</code>
              </pre>
            </div>

            {/* iFrame Code */}
            <div className="bg-domo-bg-card border border-domo-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-domo-border">
                <div>
                  <h3 className="font-medium text-white">iFrame Embed</h3>
                  <p className="text-xs text-domo-text-muted">Embed demo directly on a page</p>
                </div>
                <button
                  onClick={() => handleCopy('iframe')}
                  className="flex items-center gap-2 px-4 py-2 bg-domo-primary hover:bg-domo-secondary text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {copied === 'iframe' ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Code
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 bg-domo-bg-dark text-domo-text-secondary text-xs overflow-x-auto max-h-32">
                <code>{iframeCode}</code>
              </pre>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href={`/demos/${demoId}/experience`}
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-domo-primary hover:bg-domo-secondary text-white font-semibold rounded-xl transition-colors"
          >
            <ExternalLink className="w-5 h-5" />
            Preview Demo
          </a>
          <button
            onClick={onDismiss}
            className="px-8 py-3 bg-domo-success hover:bg-domo-success/90 text-white font-semibold rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>

      {/* CSS for confetti animation - using dangerouslySetInnerHTML for global keyframes */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes confettiFall {
            0% {
              transform: translateY(0) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(100vh) rotate(720deg);
              opacity: 0;
            }
          }
          @keyframes bounceSlow {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-10px);
            }
          }
          .animate-bounce-slow {
            animation: bounceSlow 2s ease-in-out infinite;
          }
        `
      }} />
    </div>
  );
}
