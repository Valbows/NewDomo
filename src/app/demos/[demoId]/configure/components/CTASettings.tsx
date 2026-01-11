import React, { useState } from 'react';
import { Demo } from '../types';

interface CTASettingsProps {
  demo: Demo | null;
  ctaTitle: string;
  setCTATitle: (title: string) => void;
  ctaMessage: string;
  setCTAMessage: (message: string) => void;
  ctaButtonText: string;
  setCTAButtonText: (text: string) => void;
  onSaveCTA: (url: string) => Promise<void>;
}

export const CTASettings = ({
  demo,
  ctaTitle,
  setCTATitle,
  ctaMessage,
  setCTAMessage,
  ctaButtonText,
  setCTAButtonText,
  onSaveCTA
}: CTASettingsProps) => {
  const [ctaUrl, setCtaUrl] = useState(demo?.cta_button_url || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Update URL when demo changes
  React.useEffect(() => {
    if (demo?.cta_button_url) {
      setCtaUrl(demo.cta_button_url);
    }
  }, [demo?.cta_button_url]);

  const validateUrl = (url: string): string | null => {
    let u = (url || '').trim();
    if (!u) return null; // Empty is invalid
    if (!/^https?:\/\//i.test(u)) {
      u = `https://${u}`;
    }
    try {
      const parsed = new URL(u);
      if (!/^https?:$/i.test(parsed.protocol)) {
        return null;
      }
      return parsed.toString();
    } catch {
      return null;
    }
  };

  const handleSave = async () => {
    setError(null);
    setSaved(false);

    const normalizedUrl = validateUrl(ctaUrl);
    if (!normalizedUrl) {
      setError('Please enter a valid URL (e.g., https://yoursite.com/signup)');
      return;
    }

    setSaving(true);
    try {
      await onSaveCTA(normalizedUrl);
      setCtaUrl(normalizedUrl);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const isUrlConfigured = Boolean(demo?.cta_button_url);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Call-to-Action</h2>
      <p className="text-gray-600 mb-6">Configure what visitors see when they're ready to take action.</p>

      <div className="bg-white p-6 rounded-lg shadow max-w-2xl mx-auto space-y-5">
        {/* Button URL - Most Important */}
        <div>
          <label htmlFor="cta-url" className="block text-sm font-medium text-gray-700 mb-1">
            Button URL <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Where should visitors go when they click the CTA button? (e.g., your signup page, calendar link, or contact form)
          </p>
          <input
            type="url"
            id="cta-url"
            value={ctaUrl}
            onChange={(e) => setCtaUrl(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
              !ctaUrl.trim() ? 'border-amber-300 bg-amber-50' : 'border-gray-300'
            }`}
            placeholder="https://yoursite.com/signup"
          />
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>

        {/* Button Text */}
        <div>
          <label htmlFor="cta-button-text" className="block text-sm font-medium text-gray-700 mb-1">
            Button Text
          </label>
          <input
            type="text"
            id="cta-button-text"
            value={ctaButtonText}
            onChange={(e) => setCTAButtonText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Start Free Trial"
          />
        </div>

        {/* Title */}
        <div>
          <label htmlFor="cta-title" className="block text-sm font-medium text-gray-700 mb-1">
            Headline <span className="text-gray-400 text-xs">(optional)</span>
          </label>
          <input
            type="text"
            id="cta-title"
            value={ctaTitle}
            onChange={(e) => setCTATitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Ready to Get Started?"
          />
        </div>

        {/* Message */}
        <div>
          <label htmlFor="cta-message" className="block text-sm font-medium text-gray-700 mb-1">
            Message <span className="text-gray-400 text-xs">(optional)</span>
          </label>
          <textarea
            id="cta-message"
            value={ctaMessage}
            onChange={(e) => setCTAMessage(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Start your free trial today and see the difference!"
          />
        </div>

        {/* Success/Status Message */}
        {saved && (
          <div className="p-3 rounded-md bg-green-50 border border-green-200 text-green-800">
            <p className="text-sm font-medium">Settings saved!</p>
          </div>
        )}

        {isUrlConfigured && !saved && (
          <div className="p-3 rounded-md bg-green-50 border border-green-200 text-green-800">
            <p className="text-sm font-medium">CTA configured</p>
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving || !ctaUrl.trim()}
          className="w-full px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving...' : 'Save CTA Settings'}
        </button>
      </div>

      {/* Preview */}
      <div className="bg-white p-6 rounded-lg shadow max-w-2xl mx-auto mt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Preview</h3>
        <div className="bg-gradient-to-r from-green-400 to-blue-500 rounded-lg p-5 text-white">
          <div className="flex items-center mb-3">
            <div className="text-xl mr-2">✅</div>
            <div>
              <h4 className="text-lg font-bold">{ctaTitle || 'Ready to Get Started?'}</h4>
              <p className="text-green-100 text-sm">{ctaMessage || 'Start your free trial today!'}</p>
            </div>
          </div>
          <button className="px-5 py-2 bg-white text-green-600 font-semibold rounded-lg text-sm">
            {ctaButtonText || 'Start Free Trial'}
          </button>
        </div>
      </div>
    </div>
  );
};
