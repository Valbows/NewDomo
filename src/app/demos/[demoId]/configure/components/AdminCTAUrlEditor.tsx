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
    <div className="bg-white p-6 rounded-lg shadow space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Admin CTA URL</h3>
          <p className="text-sm text-gray-500">This URL is used for the primary CTA button across this demo and overrides any legacy metadata URL.</p>
        </div>
        {!isEditing && (
          <button
            type="button"
            onClick={beginEdit}
            className="text-sm text-indigo-600 hover:text-indigo-700 underline"
            data-testid="admin-cta-edit"
          >
            Edit URL
          </button>
        )}
      </div>

      {!isEditing && (
        <div className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-700 break-all" data-testid="admin-cta-current-url">
          {currentUrl || 'Not configured'}
        </div>
      )}

      {isEditing && (
        <div className="space-y-2">
          <label htmlFor="admin-cta-url" className="block text-sm font-medium text-gray-700">Primary Button URL</label>
          <input
            id="admin-cta-url"
            data-testid="admin-cta-url-input"
            type="url"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="https://your.site/path"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
          {error && <p className="text-xs text-red-600" data-testid="admin-cta-url-error">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-md shadow-sm hover:bg-indigo-700 disabled:opacity-60"
              data-testid="admin-cta-save"
            >
              {saving ? 'Saving…' : 'Save URL'}
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50"
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
