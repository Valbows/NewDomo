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
  ctaReturnUrl: string;
  setCTAReturnUrl: (url: string) => void;
  onSaveCTA: (url: string, returnUrl: string) => Promise<void>;
  isOnboarding?: boolean; // If true, only allow save once, not update
}

export const CTASettings = ({
  demo,
  ctaTitle,
  setCTATitle,
  ctaMessage,
  setCTAMessage,
  ctaButtonText,
  setCTAButtonText,
  ctaReturnUrl,
  setCTAReturnUrl,
  onSaveCTA,
  isOnboarding = false,
}: CTASettingsProps) => {
  const [ctaUrl, setCtaUrl] = useState(demo?.cta_button_url || '');
  const [returnUrl, setReturnUrl] = useState(demo?.cta_return_url || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Update URLs when demo changes
  React.useEffect(() => {
    if (demo?.cta_button_url) {
      setCtaUrl(demo.cta_button_url);
    }
    if (demo?.cta_return_url) {
      setReturnUrl(demo.cta_return_url);
      setCTAReturnUrl(demo.cta_return_url);
    }
  }, [demo?.cta_button_url, demo?.cta_return_url, setCTAReturnUrl]);

  const validateUrl = (url: string, allowEmpty = false): string | null => {
    let u = (url || '').trim();
    if (!u) return allowEmpty ? '' : null; // Empty is invalid unless allowed
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
      setError('Please enter a valid CTA URL (e.g., https://yoursite.com/signup)');
      return;
    }

    // Return URL is optional, but if provided must be valid
    const normalizedReturnUrl = validateUrl(returnUrl, true);
    if (normalizedReturnUrl === null) {
      setError('Please enter a valid Return URL (e.g., https://yoursite.com)');
      return;
    }

    setSaving(true);
    try {
      await onSaveCTA(normalizedUrl, normalizedReturnUrl);
      setCtaUrl(normalizedUrl);
      setReturnUrl(normalizedReturnUrl);
      setCTAReturnUrl(normalizedReturnUrl);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const isUrlConfigured = Boolean(demo?.cta_button_url);

  // During onboarding, if CTA is already configured, show success message
  const ctaAlreadyConfigured = isUrlConfigured;

  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-2 font-heading">Call-to-Action</h2>
      <p className="text-domo-text-secondary mb-6">Configure what visitors see when they're ready to take action.</p>

      {/* During onboarding, if CTA exists, just show success */}
      {isOnboarding && ctaAlreadyConfigured ? (
        <div className="bg-domo-bg-card border border-domo-border p-6 rounded-xl max-w-2xl mx-auto">
          <div className="p-4 rounded-lg bg-domo-success/10 border border-domo-success/20 text-domo-success text-center">
            <p className="text-lg font-medium">CTA Settings Saved!</p>
            <p className="text-sm mt-2 opacity-80">You can update CTA settings after completing the onboarding.</p>
          </div>
          {/* Show preview of saved CTA */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-domo-text-secondary mb-3">Your CTA Preview</h3>
            <div className="bg-gradient-to-r from-domo-success to-domo-primary rounded-lg p-5 text-white">
              <div className="flex items-center mb-3">
                <div className="text-xl mr-2">✅</div>
                <div>
                  <h4 className="text-lg font-bold">{ctaTitle || 'Ready to Get Started?'}</h4>
                  <p className="text-white/80 text-sm">{ctaMessage || 'Start your free trial today!'}</p>
                </div>
              </div>
              <button className="px-5 py-2 bg-white text-domo-primary font-semibold rounded-lg text-sm">
                {ctaButtonText || 'Start Free Trial'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-domo-bg-card border border-domo-border p-6 rounded-xl max-w-2xl mx-auto space-y-5">
            {/* Button URL - Most Important */}
            <div>
              <label htmlFor="cta-url" className="block text-sm font-medium text-domo-text-secondary mb-1">
                Button URL <span className="text-domo-error">*</span>
              </label>
              <p className="text-xs text-domo-text-muted mb-2">
                Where should visitors go when they click the CTA button? (e.g., your signup page, calendar link, or contact form)
              </p>
              <input
                type="url"
                id="cta-url"
                value={ctaUrl}
                onChange={(e) => setCtaUrl(e.target.value)}
                className={`w-full px-3 py-2.5 bg-domo-bg-dark border rounded-lg text-white placeholder-domo-text-muted focus:outline-none focus:border-domo-primary focus:ring-1 focus:ring-domo-primary sm:text-sm ${
                  !ctaUrl.trim() ? 'border-amber-500/50 bg-amber-500/5' : 'border-domo-border'
                }`}
                placeholder="https://yoursite.com/signup"
              />
              {error && <p className="mt-1 text-sm text-domo-error">{error}</p>}
            </div>

            {/* Return URL - Where to redirect after conversation ends */}
            <div>
              <label htmlFor="cta-return-url" className="block text-sm font-medium text-domo-text-secondary mb-1">
                Return URL <span className="text-domo-text-muted text-xs">(optional)</span>
              </label>
              <p className="text-xs text-domo-text-muted mb-2">
                Where should visitors return to after the conversation ends? (e.g., your main website)
              </p>
              <input
                type="url"
                id="cta-return-url"
                value={returnUrl}
                onChange={(e) => setReturnUrl(e.target.value)}
                className="w-full px-3 py-2.5 bg-domo-bg-dark border border-domo-border rounded-lg text-white placeholder-domo-text-muted focus:outline-none focus:border-domo-primary focus:ring-1 focus:ring-domo-primary sm:text-sm"
                placeholder="https://yoursite.com"
              />
              <p className="mt-1 text-xs text-domo-text-muted">
                After the countdown, the CTA will open in a new tab and visitors will be redirected here.
              </p>
            </div>

            {/* Button Text */}
            <div>
              <label htmlFor="cta-button-text" className="block text-sm font-medium text-domo-text-secondary mb-2">
                Button Text
              </label>
              <input
                type="text"
                id="cta-button-text"
                value={ctaButtonText}
                onChange={(e) => setCTAButtonText(e.target.value)}
                className="w-full px-3 py-2.5 bg-domo-bg-dark border border-domo-border rounded-lg text-white placeholder-domo-text-muted focus:outline-none focus:border-domo-primary focus:ring-1 focus:ring-domo-primary sm:text-sm"
                placeholder="Start Free Trial"
              />
            </div>

            {/* Title */}
            <div>
              <label htmlFor="cta-title" className="block text-sm font-medium text-domo-text-secondary mb-2">
                Headline <span className="text-domo-text-muted text-xs">(optional)</span>
              </label>
              <input
                type="text"
                id="cta-title"
                value={ctaTitle}
                onChange={(e) => setCTATitle(e.target.value)}
                className="w-full px-3 py-2.5 bg-domo-bg-dark border border-domo-border rounded-lg text-white placeholder-domo-text-muted focus:outline-none focus:border-domo-primary focus:ring-1 focus:ring-domo-primary sm:text-sm"
                placeholder="Ready to Get Started?"
              />
            </div>

            {/* Message */}
            <div>
              <label htmlFor="cta-message" className="block text-sm font-medium text-domo-text-secondary mb-2">
                Message <span className="text-domo-text-muted text-xs">(optional)</span>
              </label>
              <textarea
                id="cta-message"
                value={ctaMessage}
                onChange={(e) => setCTAMessage(e.target.value)}
                rows={2}
                className="w-full px-3 py-2.5 bg-domo-bg-dark border border-domo-border rounded-lg text-white placeholder-domo-text-muted focus:outline-none focus:border-domo-primary focus:ring-1 focus:ring-domo-primary sm:text-sm"
                placeholder="Start your free trial today and see the difference!"
              />
            </div>

            {/* Success/Status Message */}
            {saved && (
              <div className="p-3 rounded-lg bg-domo-success/10 border border-domo-success/20 text-domo-success">
                <p className="text-sm font-medium">Settings saved!</p>
              </div>
            )}

            {/* Show configured status only outside onboarding */}
            {!isOnboarding && isUrlConfigured && !saved && (
              <div className="p-3 rounded-lg bg-domo-success/10 border border-domo-success/20 text-domo-success">
                <p className="text-sm font-medium">CTA configured</p>
              </div>
            )}

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving || !ctaUrl.trim()}
              className="w-full px-6 py-3 bg-domo-primary text-white font-medium rounded-lg hover:bg-domo-secondary disabled:bg-domo-bg-elevated disabled:text-domo-text-muted disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving...' : 'Save CTA Settings'}
            </button>
          </div>

          {/* Preview */}
          <div className="bg-domo-bg-card border border-domo-border p-6 rounded-xl max-w-2xl mx-auto mt-6">
            <h3 className="text-sm font-medium text-domo-text-secondary mb-3">Preview</h3>
            <div className="bg-gradient-to-r from-domo-success to-domo-primary rounded-lg p-5 text-white">
              <div className="flex items-center mb-3">
                <div className="text-xl mr-2">✅</div>
                <div>
                  <h4 className="text-lg font-bold">{ctaTitle || 'Ready to Get Started?'}</h4>
                  <p className="text-white/80 text-sm">{ctaMessage || 'Start your free trial today!'}</p>
                </div>
              </div>
              <button className="px-5 py-2 bg-white text-domo-primary font-semibold rounded-lg text-sm">
                {ctaButtonText || 'Start Free Trial'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
