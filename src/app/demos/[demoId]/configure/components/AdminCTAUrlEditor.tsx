import React, { useState } from 'react';

interface AdminCTAUrlEditorProps {
  currentUrl?: string | null;
  onSave: (url: string) => Promise<void> | void;
}

export const AdminCTAUrlEditor: React.FC<AdminCTAUrlEditorProps> = ({ currentUrl, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState<string>(currentUrl || '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const beginEdit = () => {
    setValue(currentUrl || '');
    setError(null);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setError(null);
  };

  const validateAndNormalize = (raw: string): string | null => {
    let u = (raw || '').trim();
    if (!u) return '';
    if (!/^https?:\/\//i.test(u)) {
      u = `https://${u}`;
    }
    try {
      // Must be http(s)
      const parsed = new URL(u);
      if (!/^https?:$/i.test(parsed.protocol)) {
        return null;
      }
      return parsed.toString();
    } catch {
      return null;
    }
  }

  const handleSave = async () => {
    setError(null);
    const normalized = validateAndNormalize(value);
    if (normalized === null) {
      setError('Enter a valid URL (must start with http:// or https://)');
      return;
    }
    try {
      setSaving(true);
      await onSave(normalized);
      setIsEditing(false);
    } catch (e) {
      setError('Failed to save URL. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-domo-bg-card border border-domo-border p-6 rounded-xl space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-white">Admin CTA URL</h3>
          <p className="text-sm text-domo-text-secondary">This URL is used for the primary CTA button across this demo and overrides any legacy metadata URL.</p>
        </div>
        {!isEditing && (
          <button
            type="button"
            onClick={beginEdit}
            className="text-sm text-domo-primary hover:text-domo-secondary underline transition-colors"
            data-testid="admin-cta-edit"
          >
            Edit URL
          </button>
        )}
      </div>

      {!isEditing && (
        <div className="w-full px-3 py-2.5 border border-domo-border rounded-lg bg-domo-bg-dark text-domo-text-secondary break-all" data-testid="admin-cta-current-url">
          {currentUrl || 'Not configured'}
        </div>
      )}

      {isEditing && (
        <div className="space-y-2">
          <label htmlFor="admin-cta-url" className="block text-sm font-medium text-domo-text-secondary">Primary Button URL</label>
          <input
            id="admin-cta-url"
            data-testid="admin-cta-url-input"
            type="url"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="https://your.site/path"
            className="w-full px-3 py-2.5 bg-domo-bg-dark border border-domo-border rounded-lg text-white placeholder-domo-text-muted focus:outline-none focus:border-domo-primary focus:ring-1 focus:ring-domo-primary"
          />
          {error && <p className="text-xs text-domo-error" data-testid="admin-cta-url-error">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-domo-primary text-white font-medium rounded-lg hover:bg-domo-secondary disabled:bg-domo-bg-elevated disabled:text-domo-text-muted disabled:cursor-not-allowed transition-colors"
              data-testid="admin-cta-save"
            >
              {saving ? 'Saving…' : 'Save URL'}
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="px-4 py-2 border border-domo-border text-domo-text-secondary font-medium rounded-lg hover:bg-domo-bg-elevated hover:text-white transition-colors"
              data-testid="admin-cta-cancel"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
