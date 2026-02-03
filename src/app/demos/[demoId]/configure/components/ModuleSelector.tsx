'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Layers, Check } from 'lucide-react';
import { DEFAULT_PRODUCT_DEMO_MODULES } from '@/lib/modules/default-modules';
import type { ModuleId } from '@/lib/modules/types';

// Debug logging helper
const debugLog = (message: string, data?: any) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[ModuleSelector] ${message}`, data !== undefined ? data : '');
  }
};

interface ModuleSelectorProps {
  value: ModuleId | null;
  onChange: (moduleId: ModuleId | null) => void;
  placeholder?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  /** If true, shows "No module" option. Default false (module required). */
  allowUnassigned?: boolean;
}

/**
 * ModuleSelector
 *
 * Dropdown component for selecting which module content belongs to.
 * Used during video/knowledge upload to assign content to a specific module.
 */
export function ModuleSelector({
  value,
  onChange,
  placeholder = 'Select module...',
  disabled = false,
  size = 'md',
  className = '',
  allowUnassigned = false,
}: ModuleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedModule = value
    ? DEFAULT_PRODUCT_DEMO_MODULES.find((m) => m.moduleId === value)
    : null;

  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-3 py-2 text-sm',
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between gap-2
          bg-domo-bg-dark border border-domo-border rounded-lg
          text-left transition-colors
          ${sizeClasses[size]}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-domo-primary/50'}
          ${isOpen ? 'border-domo-primary ring-1 ring-domo-primary' : ''}
        `}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Layers
            className={`h-4 w-4 flex-shrink-0 ${
              selectedModule ? 'text-domo-primary' : 'text-domo-text-muted'
            }`}
          />
          {selectedModule ? (
            <span className="text-white truncate">
              {selectedModule.orderIndex}. {selectedModule.name}
            </span>
          ) : (
            <span className="text-domo-text-muted">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-domo-text-muted flex-shrink-0 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-domo-bg-elevated border border-domo-border rounded-lg shadow-lg overflow-hidden">
          {/* Clear Selection Option - only show if allowed */}
          {allowUnassigned && (
            <>
              <button
                type="button"
                onClick={() => {
                  debugLog('Clearing module selection', { previousValue: value });
                  onChange(null);
                  setIsOpen(false);
                }}
                className={`
                  w-full flex items-center gap-2 px-3 py-2 text-left text-sm
                  hover:bg-domo-bg-card transition-colors
                  ${!value ? 'text-domo-primary' : 'text-domo-text-muted'}
                `}
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  {!value && <Check className="h-3 w-3" />}
                </div>
                <span>No module (unassigned)</span>
              </button>

              <div className="border-t border-domo-border" />
            </>
          )}

          {/* Module Options */}
          {DEFAULT_PRODUCT_DEMO_MODULES.map((module) => {
            const isSelected = value === module.moduleId;

            return (
              <button
                key={module.moduleId}
                type="button"
                onClick={() => {
                  debugLog('Module selected', { moduleId: module.moduleId, moduleName: module.name });
                  onChange(module.moduleId);
                  setIsOpen(false);
                }}
                className={`
                  w-full flex items-start gap-2 px-3 py-2 text-left
                  hover:bg-domo-bg-card transition-colors
                  ${isSelected ? 'bg-domo-primary/10' : ''}
                `}
              >
                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {isSelected && <Check className="h-3 w-3 text-domo-primary" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium ${
                        isSelected ? 'text-domo-primary' : 'text-white'
                      }`}
                    >
                      {module.orderIndex}. {module.name}
                    </span>
                    {module.requiresVideo && (
                      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-domo-primary/20 text-domo-primary rounded">
                        Video
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-domo-text-muted mt-0.5 line-clamp-1">
                    {module.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ModuleSelector;
