'use client';

import { useState } from 'react';
import { Settings, ChevronDown, ChevronRight, CheckCircle2 } from 'lucide-react';

interface CollapsibleSettingsProps {
  title: string;
  description?: string;
  isConfigured: boolean;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function CollapsibleSettings({
  title,
  description,
  isConfigured,
  children,
  defaultOpen = false,
}: CollapsibleSettingsProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-domo-border rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-domo-bg-elevated hover:bg-domo-bg-elevated/80 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5 text-domo-text-muted" />
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-medium text-white">{title}</span>
              {isConfigured && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-domo-success/10 text-domo-success border border-domo-success/20">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Configured
                </span>
              )}
            </div>
            {description && (
              <p className="text-sm text-domo-text-secondary">{description}</p>
            )}
          </div>
        </div>
        {isOpen ? (
          <ChevronDown className="w-5 h-5 text-domo-text-muted" />
        ) : (
          <ChevronRight className="w-5 h-5 text-domo-text-muted" />
        )}
      </button>

      {isOpen && (
        <div className="p-4 bg-domo-bg-card border-t border-domo-border">
          {children}
        </div>
      )}
    </div>
  );
}

interface SettingsPanelProps {
  children: React.ReactNode;
}

export function SettingsPanel({ children }: SettingsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm text-domo-text-secondary hover:text-white mb-3 transition-colors"
      >
        <Settings className="w-4 h-4" />
        <span>Advanced Settings</span>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>

      {isExpanded && (
        <div className="space-y-4 pl-6 border-l-2 border-domo-border">
          {children}
        </div>
      )}
    </div>
  );
}
