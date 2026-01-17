'use client';

import { useState } from 'react';
import { Copy, Check, RefreshCw, ExternalLink, Code2, Globe, MousePointer, Monitor, Smartphone } from 'lucide-react';
import { Demo } from '../../types';
import { supabase } from '@/lib/supabase';
import { DomoModal } from '@/components/DomoModal';

interface EmbedSettingsProps {
  demo: Demo | null;
  onDemoUpdate: (demo: Demo) => void;
}

// Standard iframe size presets
const IFRAME_SIZES = {
  small: { width: '560', height: '315', label: 'Small', desc: '560×315 (YouTube default)' },
  medium: { width: '800', height: '450', label: 'Medium', desc: '800×450 (16:9)' },
  large: { width: '960', height: '540', label: 'Large', desc: '960×540 (16:9)' },
  responsive: { width: '100%', height: '600', label: 'Responsive', desc: '100% width, 600px height' },
} as const;

type IframeSizeKey = keyof typeof IFRAME_SIZES;

export function EmbedSettings({ demo, onDemoUpdate }: EmbedSettingsProps) {
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState<'token' | 'iframe' | 'popup' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<IframeSizeKey>('responsive');
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);

  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_BASE_URL || 'https://your-domain.com';

  const embedUrl = demo?.embed_token
    ? `${baseUrl}/embed/${demo.embed_token}`
    : null;

  const currentSize = IFRAME_SIZES[selectedSize];
  const iframeCode = embedUrl
    ? `<iframe
  src="${embedUrl}"
  width="${currentSize.width}"
  height="${currentSize.height}"
  frameborder="0"
  allow="camera; microphone"
></iframe>`
    : '';

  const popupCode = demo?.embed_token
    ? `<!-- Add this script to your page (once) -->
<script src="${baseUrl}/embed.js" data-base-url="${baseUrl}"></script>

<!-- Add this to your button -->
<button onclick="Domo.open('${demo.embed_token}')">
  Book a Demo
</button>`
    : '';

  const handleToggleEmbedding = async () => {
    if (!demo) return;
    setSaving(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('demos')
        .update({ is_embeddable: !demo.is_embeddable })
        .eq('id', demo.id);

      if (updateError) throw updateError;

      onDemoUpdate({
        ...demo,
        is_embeddable: !demo.is_embeddable,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to update embedding settings');
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateClick = () => {
    if (!demo) return;
    setShowRegenerateModal(true);
  };

  const handleRegenerateToken = async () => {
    if (!demo) return;
    setShowRegenerateModal(false);
    setRegenerating(true);
    setError(null);

    try {
      // Generate a new UUID token
      const newToken = crypto.randomUUID();

      const { error: updateError } = await supabase
        .from('demos')
        .update({ embed_token: newToken })
        .eq('id', demo.id);

      if (updateError) throw updateError;

      onDemoUpdate({
        ...demo,
        embed_token: newToken,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to regenerate token');
    } finally {
      setRegenerating(false);
    }
  };

  const handleCopy = async (type: 'token' | 'iframe' | 'popup') => {
    let text = '';
    if (type === 'token') text = embedUrl || '';
    else if (type === 'iframe') text = iframeCode;
    else if (type === 'popup') text = popupCode;

    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!demo) {
    return (
      <div className="p-6 text-domo-text-muted">
        Loading demo settings...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-white font-heading">Embed Settings</h2>
        <p className="text-domo-text-secondary mt-1">
          Allow external websites to embed your demo using an iFrame.
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-domo-error/10 border border-domo-error/20 text-domo-error rounded-xl">
          {error}
        </div>
      )}

      {/* Enable Embedding Toggle */}
      <div className="bg-domo-bg-card border border-domo-border rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-domo-text-muted" />
            <div>
              <h3 className="font-medium text-white">Enable Embedding</h3>
              <p className="text-sm text-domo-text-secondary">
                Allow this demo to be embedded on external websites
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleEmbedding}
            disabled={saving}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-domo-primary focus:ring-offset-2 focus:ring-offset-domo-bg-dark ${
              demo.is_embeddable ? 'bg-domo-primary' : 'bg-domo-bg-elevated'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                demo.is_embeddable ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Prerequisites Check */}
        {demo.is_embeddable && !demo.tavus_persona_id && (
          <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <p className="text-sm text-amber-400">
              <strong>Note:</strong> This demo doesn't have an AI agent configured yet.
              The embed will show an error until you configure the agent in the Agent Settings tab.
            </p>
          </div>
        )}
      </div>

      {/* Embed URL and Token */}
      {demo.is_embeddable && (
        <>
          <div className="bg-domo-bg-card border border-domo-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <ExternalLink className="w-5 h-5 text-domo-text-muted" />
                <h3 className="font-medium text-white">Embed URL</h3>
              </div>
              <button
                onClick={handleRegenerateClick}
                disabled={regenerating}
                className="text-sm text-domo-text-secondary hover:text-white flex items-center gap-1 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
                Regenerate Token
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={embedUrl || ''}
                className="flex-1 px-3 py-2.5 bg-domo-bg-dark border border-domo-border rounded-lg text-sm font-mono text-domo-text-secondary"
              />
              <button
                onClick={() => handleCopy('token')}
                className="px-3 py-2.5 bg-domo-bg-elevated hover:bg-domo-bg-elevated/80 rounded-lg transition-colors"
                title="Copy URL"
              >
                {copied === 'token' ? (
                  <Check className="w-5 h-5 text-domo-success" />
                ) : (
                  <Copy className="w-5 h-5 text-domo-text-secondary" />
                )}
              </button>
              {embedUrl && (
                <a
                  href={embedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2.5 bg-domo-bg-elevated hover:bg-domo-bg-elevated/80 rounded-lg transition-colors"
                  title="Preview embed"
                >
                  <ExternalLink className="w-5 h-5 text-domo-text-secondary" />
                </a>
              )}
            </div>

            <p className="mt-3 text-xs text-domo-text-muted">
              Share this URL directly or use the embed code below to add to your website.
            </p>
          </div>

          {/* Option 1: Popup Button */}
          <div className="bg-domo-bg-card border border-domo-border rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-domo-border">
              <div className="flex items-center gap-3">
                <MousePointer className="w-5 h-5 text-domo-text-muted" />
                <div>
                  <h3 className="font-medium text-white">Option 1: Popup Button</h3>
                  <p className="text-xs text-domo-text-muted">Opens demo in a modal overlay</p>
                </div>
              </div>
              <button
                onClick={() => handleCopy('popup')}
                className="flex items-center gap-1 text-sm bg-domo-primary hover:bg-domo-secondary text-white px-3 py-1.5 rounded-lg transition-colors"
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

            {/* Visual Preview */}
            <div className="p-4 bg-domo-bg-dark">
              <p className="text-xs text-domo-text-muted mb-2 flex items-center gap-1">
                <Monitor className="w-3 h-3" />
                Preview: How it looks on your website
              </p>
              {/* Mini Website Frame - Domo Homepage Style */}
              <div className="bg-domo-bg-card rounded-lg shadow-md overflow-hidden border border-domo-border relative max-w-xl mx-auto">
                {/* Mini Browser Chrome */}
                <div className="bg-domo-bg-elevated px-3 py-2 flex items-center gap-2 border-b border-domo-border">
                  <div className="flex gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-domo-error"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-domo-success"></div>
                  </div>
                  <div className="flex-1 bg-domo-bg-dark rounded px-2 py-0.5 text-[10px] text-domo-text-muted font-mono">
                    domo.ai
                  </div>
                </div>
                {/* Domo Homepage Style */}
                <div className="bg-domo-bg-dark h-72">
                  {/* Domo navbar */}
                  <div className="flex items-center justify-between px-4 py-2 border-b border-domo-border/50">
                    <span className="text-[11px] font-bold text-white tracking-wide">DOMO</span>
                    <div className="flex gap-3 items-center">
                      <span className="text-[8px] text-domo-text-muted">Features</span>
                      <span className="text-[8px] text-domo-text-muted">Pricing</span>
                      <span className="text-[8px] text-domo-text-muted">About</span>
                    </div>
                  </div>
                  {/* Hero section */}
                  <div className="text-center pt-5 px-4">
                    <h2 className="text-sm font-bold text-white leading-tight">
                      Create AI-Powered Product Demos in Minutes
                    </h2>
                    <p className="text-[9px] text-domo-text-muted mt-1.5">
                      Interactive video demos that answer questions in real-time
                    </p>
                    {/* CTA Button */}
                    <div className="mt-4">
                      <span className="inline-block bg-domo-success text-white text-[9px] px-5 py-2 rounded-lg font-medium shadow-lg shadow-domo-success/30">
                        Book a Demo
                      </span>
                    </div>
                  </div>
                  {/* Features hint */}
                  <div className="text-center mt-4">
                    <p className="text-[8px] text-domo-success uppercase tracking-wider">Core Features</p>
                  </div>
                </div>

                {/* Popup Overlay Preview */}
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center" style={{ top: '28px' }}>
                  <div className="bg-domo-bg-card rounded-lg shadow-2xl w-4/5 h-48 border border-domo-border relative">
                    {/* Close button */}
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-domo-bg-elevated rounded-full flex items-center justify-center border border-domo-border">
                      <span className="text-xs text-white">×</span>
                    </div>
                    {/* Demo content */}
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gradient-to-br from-domo-primary to-purple-600 flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-white rounded-full"></div>
                        </div>
                        <p className="text-[11px] text-white font-medium">Your Demo Popup</p>
                        <p className="text-[8px] text-domo-text-muted mt-1">Opens when clicking "Book a Demo"</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Code */}
            <div className="p-4 border-t border-domo-border">
              <pre className="p-3 bg-domo-bg-dark text-domo-text-secondary rounded-lg text-xs overflow-x-auto whitespace-pre-wrap border border-domo-border">
                <code>{popupCode}</code>
              </pre>
              <p className="mt-2 text-xs text-domo-text-muted">
                Best for: Homepage CTAs, navigation buttons, marketing pages
              </p>
            </div>
          </div>

          {/* Option 2: iFrame Embed */}
          <div className="bg-domo-bg-card border border-domo-border rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-domo-border">
              <div className="flex items-center gap-3">
                <Code2 className="w-5 h-5 text-domo-text-muted" />
                <div>
                  <h3 className="font-medium text-white">Option 2: iFrame Embed</h3>
                  <p className="text-xs text-domo-text-muted">Embed demo directly on a dedicated page</p>
                </div>
              </div>
              <button
                onClick={() => handleCopy('iframe')}
                className="flex items-center gap-1 text-sm bg-domo-primary hover:bg-domo-secondary text-white px-3 py-1.5 rounded-lg transition-colors"
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

            {/* Size Selection */}
            <div className="p-4 border-b border-domo-border bg-domo-bg-elevated">
              <p className="text-xs text-domo-text-secondary mb-3 font-medium">Select Size:</p>
              <div className="grid grid-cols-4 gap-2">
                {(Object.keys(IFRAME_SIZES) as IframeSizeKey[]).map((sizeKey) => {
                  const size = IFRAME_SIZES[sizeKey];
                  const isSelected = selectedSize === sizeKey;
                  // Calculate preview dimensions (scaled down proportionally) - more distinct sizes
                  const previewWidth = sizeKey === 'responsive' ? 70 : Math.round(parseInt(size.width) / 12);
                  const previewHeight = Math.round(parseInt(size.height) / 12);

                  return (
                    <button
                      key={sizeKey}
                      onClick={() => setSelectedSize(sizeKey)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        isSelected
                          ? 'border-domo-primary bg-domo-primary/10'
                          : 'border-domo-border bg-domo-bg-dark hover:border-domo-border/80'
                      }`}
                    >
                      {/* Visual size representation */}
                      <div className="flex justify-center mb-2">
                        <div
                          className={`border-2 border-dashed rounded ${
                            isSelected ? 'border-domo-primary bg-domo-primary/20' : 'border-domo-border bg-domo-bg-elevated'
                          }`}
                          style={{
                            width: `${previewWidth}px`,
                            height: `${previewHeight}px`,
                            minWidth: '35px',
                            minHeight: '20px'
                          }}
                        />
                      </div>
                      <p className={`text-xs font-medium ${isSelected ? 'text-domo-primary' : 'text-domo-text-secondary'}`}>
                        {size.label}
                      </p>
                      <p className="text-[10px] text-domo-text-muted mt-0.5">{size.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Visual Preview */}
            <div className="p-4 bg-domo-bg-dark">
              <p className="text-xs text-domo-text-muted mb-2 flex items-center gap-1">
                <Monitor className="w-3 h-3" />
                Preview: How it looks on your website
              </p>
              {/* Mini Website Frame - Domo Homepage Style */}
              <div className="bg-domo-bg-card rounded-lg shadow-md overflow-hidden border border-domo-border max-w-xl mx-auto">
                {/* Mini Browser Chrome */}
                <div className="bg-domo-bg-elevated px-3 py-2 flex items-center gap-2 border-b border-domo-border">
                  <div className="flex gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-domo-error"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-domo-success"></div>
                  </div>
                  <div className="flex-1 bg-domo-bg-dark rounded px-2 py-0.5 text-[10px] text-domo-text-muted font-mono">
                    domo.ai/demo
                  </div>
                </div>
                {/* Domo Homepage Style */}
                <div className="bg-domo-bg-dark">
                  {/* Domo navbar */}
                  <div className="flex items-center justify-between px-4 py-2 border-b border-domo-border/50">
                    <span className="text-[11px] font-bold text-white tracking-wide">DOMO</span>
                    <div className="flex gap-3 items-center">
                      <span className="text-[8px] text-domo-text-muted">Features</span>
                      <span className="text-[8px] text-domo-text-muted">Pricing</span>
                      <span className="text-[8px] text-domo-text-muted">About</span>
                    </div>
                  </div>
                  {/* Hero section */}
                  <div className="px-4 pt-5 pb-3 text-center">
                    <h2 className="text-sm font-bold text-white leading-tight">
                      Create AI-Powered Product Demos in Minutes
                    </h2>
                    <p className="text-[9px] text-domo-text-muted mt-1.5">
                      Interactive video demos that answer questions in real-time.
                    </p>
                  </div>
                  {/* iFrame embed area */}
                  <div className="px-4 pb-5">
                    <div
                      className={`bg-domo-bg-card rounded-lg border-2 border-dashed border-domo-primary flex items-center justify-center mx-auto transition-all ${
                        selectedSize === 'responsive' ? 'w-full' : ''
                      }`}
                      style={{
                        width: selectedSize === 'responsive' ? '100%' : `${Math.min(parseInt(currentSize.width) / 2.8, 340)}px`,
                        height: `${Math.min(parseInt(currentSize.height) / 2.8, 200)}px`,
                      }}
                    >
                      <div className="text-center">
                        <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-gradient-to-br from-domo-primary to-purple-600 flex items-center justify-center">
                          <div className="w-3 h-3 border-2 border-white rounded-full"></div>
                        </div>
                        <p className="text-[11px] text-domo-primary font-medium">Your Demo Embedded Here</p>
                        <p className="text-[9px] text-domo-text-muted mt-1">{currentSize.width} × {currentSize.height}</p>
                      </div>
                    </div>
                  </div>
                  {/* Features section */}
                  <div className="px-4 pb-4 text-center">
                    <p className="text-[9px] text-domo-success uppercase tracking-wider font-medium">Core Features</p>
                    <div className="flex justify-center gap-6 mt-1.5">
                      <span className="text-[8px] text-domo-text-muted">AI Demos</span>
                      <span className="text-[8px] text-domo-text-muted">Real-Time Q&A</span>
                      <span className="text-[8px] text-domo-text-muted">Analytics</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Code */}
            <div className="p-4 border-t border-domo-border">
              <pre className="p-3 bg-domo-bg-dark text-domo-text-secondary rounded-lg text-xs overflow-x-auto border border-domo-border">
                <code>{iframeCode}</code>
              </pre>
              <p className="mt-2 text-xs text-domo-text-muted">
                Best for: Dedicated demo pages, product tours, documentation sites
              </p>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-domo-primary/10 border border-domo-primary/20 rounded-xl p-4">
            <h4 className="font-medium text-white mb-2">Security Information</h4>
            <ul className="text-sm text-domo-text-secondary space-y-1">
              <li>• The embed token is unique and cannot be guessed</li>
              <li>• Only demos with embedding enabled can be accessed via the embed URL</li>
              <li>• Regenerating the token will invalidate all existing embeds</li>
              <li>• Camera and microphone access is required for the AI conversation</li>
            </ul>
          </div>
        </>
      )}

      {/* Regenerate Token Confirmation Modal */}
      <DomoModal
        isOpen={showRegenerateModal}
        onClose={() => setShowRegenerateModal(false)}
        onConfirm={handleRegenerateToken}
        title="Regenerate Embed Token"
        message="Are you sure you want to regenerate the embed token? This will break any existing embeds using the current token."
        type="confirm"
        confirmText="Regenerate"
      />
    </div>
  );
}
