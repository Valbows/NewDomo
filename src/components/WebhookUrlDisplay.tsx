/**
 * Webhook URL Display Component
 * Shows the current webhook URL for easy copy/paste when creating objectives
 */

'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, RefreshCw, ExternalLink } from 'lucide-react';

interface WebhookUrlDisplayProps {
  className?: string;
}

export default function WebhookUrlDisplay({ className = '' }: WebhookUrlDisplayProps) {
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWebhookUrl = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/webhook-url');
      const data = await response.json();

      if (data.success) {
        setWebhookUrl(data.webhookUrl);
      } else {
        setError(data.error || 'Failed to get webhook URL');
      }
    } catch (err) {
      setError('Failed to fetch webhook URL');
      console.error('Error fetching webhook URL:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhookUrl();
  }, []);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const openNgrokInterface = () => {
    window.open('http://127.0.0.1:4040', '_blank');
  };

  if (loading) {
    return (
      <div className={`bg-domo-primary/10 border border-domo-primary/20 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-domo-primary" />
          <span className="text-sm text-domo-primary">Loading webhook URL...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-domo-error/10 border border-domo-error/20 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-domo-error">Webhook URL Error</h4>
            <p className="text-sm text-domo-error/80 mt-1">{error}</p>
          </div>
          <button
            onClick={fetchWebhookUrl}
            className="flex items-center gap-1 px-3 py-1 bg-domo-error/20 text-domo-error rounded hover:bg-domo-error/30 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const isNgrok = webhookUrl.includes('ngrok');
  const isLocalhost = webhookUrl.includes('localhost');

  return (
    <div className={`bg-domo-success/10 border border-domo-success/20 rounded-lg p-4 ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium text-domo-success flex items-center gap-2">
            🔗 Webhook URL for Objectives
            {isNgrok && (
              <span className="text-xs bg-domo-success/20 text-domo-success px-2 py-1 rounded-full">
                ngrok
              </span>
            )}
          </h4>
          <p className="text-sm text-domo-success/80 mt-1">
            Copy this URL and paste it in the "Callback URL" field when creating custom objectives.
            This enables automatic data collection for product interest discovery and contact information.
          </p>
        </div>
        <div className="flex gap-2">
          {isNgrok && (
            <button
              onClick={openNgrokInterface}
              className="flex items-center gap-1 px-2 py-1 bg-domo-success/20 text-domo-success rounded hover:bg-domo-success/30 transition-colors text-xs"
              title="Open ngrok interface"
            >
              <ExternalLink className="w-3 h-3" />
              ngrok
            </button>
          )}
          <button
            onClick={fetchWebhookUrl}
            className="flex items-center gap-1 px-2 py-1 bg-domo-success/20 text-domo-success rounded hover:bg-domo-success/30 transition-colors text-xs"
            title="Refresh URL"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-domo-bg-elevated border border-domo-success/30 rounded p-3 mb-3">
        <div className="flex items-center justify-between">
          <code className="text-sm font-mono text-white break-all flex-1 mr-3">
            {webhookUrl}
          </code>
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1 px-3 py-1 bg-domo-success text-white rounded hover:bg-domo-success/80 transition-colors whitespace-nowrap"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      <div className="text-xs text-domo-success/80">
        <div className="flex items-center gap-4">
          <span>Status: {isNgrok ? 'Using ngrok tunnel' : isLocalhost ? 'Local development' : 'Production'}</span>
          {isNgrok && (
            <span className="text-amber-400">⚠️ Remember to update when ngrok restarts</span>
          )}
        </div>
      </div>
    </div>
  );
}
