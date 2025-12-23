'use client';

import { useState } from 'react';
import { Copy, Check, RefreshCw, ExternalLink, Code2, Globe, MousePointer } from 'lucide-react';
import { Demo } from '../../types';
import { supabase } from '@/lib/supabase';

interface EmbedSettingsProps {
  demo: Demo | null;
  onDemoUpdate: (demo: Demo) => void;
}

export function EmbedSettings({ demo, onDemoUpdate }: EmbedSettingsProps) {
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState<'token' | 'iframe' | 'popup' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_BASE_URL || 'https://your-domain.com';

  const embedUrl = demo?.embed_token
    ? `${baseUrl}/embed/${demo.embed_token}`
    : null;

  const iframeCode = embedUrl
    ? `<iframe
  src="${embedUrl}"
  width="100%"
  height="600"
  frameborder="0"
  allow="camera; microphone"
></iframe>`
    : '';

  const popupCode = demo?.embed_token
    ? `<!-- Add this script to your page -->
<script src="${baseUrl}/embed.js" data-base-url="${baseUrl}"></script>

<!-- Add this to your button -->
<button onclick="Domo.open('${demo.embed_token}')">
  Book Demo
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

  const handleRegenerateToken = async () => {
    if (!demo) return;
    if (!confirm('Are you sure you want to regenerate the embed token? This will break any existing embeds.')) {
      return;
    }

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
      <div className="p-6 text-gray-500">
        Loading demo settings...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Embed Settings</h2>
        <p className="text-gray-600 mt-1">
          Allow external websites to embed your demo using an iFrame.
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-100 border border-red-300 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Enable Embedding Toggle */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-gray-500" />
            <div>
              <h3 className="font-medium text-gray-900">Enable Embedding</h3>
              <p className="text-sm text-gray-500">
                Allow this demo to be embedded on external websites
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleEmbedding}
            disabled={saving}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              demo.is_embeddable ? 'bg-indigo-600' : 'bg-gray-200'
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
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> This demo doesn't have an AI agent configured yet.
              The embed will show an error until you configure the agent in the Agent Settings tab.
            </p>
          </div>
        )}
      </div>

      {/* Embed URL and Token */}
      {demo.is_embeddable && (
        <>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <ExternalLink className="w-5 h-5 text-gray-500" />
                <h3 className="font-medium text-gray-900">Embed URL</h3>
              </div>
              <button
                onClick={handleRegenerateToken}
                disabled={regenerating}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
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
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm font-mono"
              />
              <button
                onClick={() => handleCopy('token')}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                title="Copy URL"
              >
                {copied === 'token' ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <Copy className="w-5 h-5 text-gray-600" />
                )}
              </button>
              {embedUrl && (
                <a
                  href={embedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  title="Preview embed"
                >
                  <ExternalLink className="w-5 h-5 text-gray-600" />
                </a>
              )}
            </div>

            <p className="mt-3 text-xs text-gray-500">
              Share this URL directly or use the embed code below to add to your website.
            </p>
          </div>

          {/* iFrame Embed Code */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Code2 className="w-5 h-5 text-gray-500" />
                <div>
                  <h3 className="font-medium text-gray-900">Option 1: iFrame Embed</h3>
                  <p className="text-xs text-gray-500">For dedicated demo pages</p>
                </div>
              </div>
              <button
                onClick={() => handleCopy('iframe')}
                className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
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

            <pre className="p-4 bg-gray-900 text-gray-100 rounded-md text-sm overflow-x-auto">
              <code>{iframeCode}</code>
            </pre>

            <p className="mt-3 text-xs text-gray-500">
              Embeds the demo directly in your page. Best for dedicated demo sections.
            </p>
          </div>

          {/* Popup Button Code */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <MousePointer className="w-5 h-5 text-gray-500" />
                <div>
                  <h3 className="font-medium text-gray-900">Option 2: Popup Button</h3>
                  <p className="text-xs text-gray-500">For "Book Demo" buttons</p>
                </div>
              </div>
              <button
                onClick={() => handleCopy('popup')}
                className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
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

            <pre className="p-4 bg-gray-900 text-gray-100 rounded-md text-sm overflow-x-auto whitespace-pre-wrap">
              <code>{popupCode}</code>
            </pre>

            <p className="mt-3 text-xs text-gray-500">
              Opens the demo in a popup modal. Perfect for "Book Demo" or "Try Demo" buttons anywhere on your site.
            </p>
          </div>

          {/* Security Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Security Information</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• The embed token is unique and cannot be guessed</li>
              <li>• Only demos with embedding enabled can be accessed via the embed URL</li>
              <li>• Regenerating the token will invalidate all existing embeds</li>
              <li>• Camera and microphone access is required for the AI conversation</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
