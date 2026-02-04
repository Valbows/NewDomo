'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { DEFAULT_PRODUCT_DEMO_MODULES } from '@/lib/modules/default-modules';
import type { ModuleId, ModuleState } from '@/lib/modules/types';
import { supabase } from '@/lib/supabase';

// Debug logging helper
const debugLog = (message: string, data?: any) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[ModuleProgress] ${message}`, data !== undefined ? data : '');
  }
};

interface ModuleProgressIndicatorProps {
  conversationId: string | null;
  demoId: string;
  compact?: boolean;
  className?: string;
}

/**
 * ModuleProgressIndicator
 *
 * Displays real-time module progress during the demo experience.
 * Subscribes to Supabase realtime for module_changed events.
 */
export function ModuleProgressIndicator({
  conversationId,
  demoId,
  compact = false,
  className = '',
}: ModuleProgressIndicatorProps) {
  const [currentModuleId, setCurrentModuleId] = useState<ModuleId | null>('intro');
  const [moduleState, setModuleState] = useState<ModuleState>({
    completedModules: [],
    completedObjectives: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial state and subscribe to updates
  useEffect(() => {
    debugLog('Initializing', { conversationId, demoId, compact });

    if (!conversationId) {
      debugLog('No conversationId, skipping fetch');
      setIsLoading(false);
      return;
    }

    const fetchModuleState = async () => {
      debugLog('Fetching module state from conversation_details');
      try {
        const { data, error } = await supabase
          .from('conversation_details')
          .select('current_module_id, module_state')
          .eq('tavus_conversation_id', conversationId)
          .single();

        if (error) {
          debugLog('No conversation_details found yet', { error: error.message });
        } else if (data) {
          debugLog('Loaded initial state', {
            currentModule: data.current_module_id,
            moduleState: data.module_state,
          });
          setCurrentModuleId(data.current_module_id as ModuleId | null);
          if (data.module_state) {
            setModuleState(data.module_state as ModuleState);
          }
        }
      } catch (err) {
        console.error('[ModuleProgress] Error fetching state:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchModuleState();

    // Subscribe to realtime updates via demo channel
    const channelName = `demo-${demoId}-modules`;
    debugLog('Subscribing to realtime channel', { channelName });

    const channel = supabase
      .channel(channelName)
      .on(
        'broadcast',
        { event: 'module_changed' },
        (payload) => {
          debugLog('Module changed event received', payload);
          const { currentModule, completedModules, completedObjectives } = payload.payload || {};
          if (currentModule) {
            debugLog('Updating current module', { from: currentModuleId, to: currentModule });
            setCurrentModuleId(currentModule as ModuleId);
          }
          if (completedModules || completedObjectives) {
            setModuleState((prev) => {
              const newState = {
                ...prev,
                completedModules: completedModules || prev.completedModules,
                completedObjectives: completedObjectives || prev.completedObjectives,
              };
              debugLog('Updated module state', newState);
              return newState;
            });
          }
        }
      )
      .on(
        'broadcast',
        { event: 'objective_completed' },
        (payload) => {
          debugLog('Objective completed event received', payload);
          const { currentModule, completedObjectives } = payload.payload || {};
          if (currentModule) {
            setCurrentModuleId(currentModule as ModuleId);
          }
          if (completedObjectives) {
            setModuleState((prev) => ({
              ...prev,
              completedObjectives,
            }));
          }
        }
      )
      .subscribe((status) => {
        debugLog('Channel subscription status', { channelName, status });
      });

    return () => {
      debugLog('Cleaning up channel subscription', { channelName });
      supabase.removeChannel(channel);
    };
  }, [conversationId, demoId]);

  // Calculate progress
  const totalModules = DEFAULT_PRODUCT_DEMO_MODULES.length;
  const completedCount = moduleState.completedModules?.length || 0;
  const progressPercentage = Math.round((completedCount / totalModules) * 100);

  // Find current module definition
  const currentModule = currentModuleId
    ? DEFAULT_PRODUCT_DEMO_MODULES.find((m) => m.moduleId === currentModuleId)
    : null;

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin text-domo-text-muted" />
        <span className="text-xs text-domo-text-muted">Loading progress...</span>
      </div>
    );
  }

  // Compact view - just shows current module and progress bar
  if (compact) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="flex items-center gap-2">
          {currentModule && (
            <span className="text-xs font-medium text-domo-primary">
              {currentModule.name}
            </span>
          )}
          <span className="text-xs text-domo-text-muted">
            {completedCount}/{totalModules}
          </span>
        </div>
        <div className="w-20 h-1.5 bg-domo-bg-dark rounded-full overflow-hidden">
          <div
            className="h-full bg-domo-success transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    );
  }

  // Full view - shows all modules with status
  return (
    <div className={`bg-domo-bg-card border border-domo-border rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-white">Demo Progress</h3>
        <span className="text-xs text-domo-text-muted">
          {progressPercentage}% complete
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-domo-bg-dark rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-domo-success transition-all duration-500"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Module steps */}
      <div className="flex items-center justify-between">
        {DEFAULT_PRODUCT_DEMO_MODULES.map((module, index) => {
          const isCompleted = moduleState.completedModules?.includes(module.moduleId);
          const isCurrent = currentModuleId === module.moduleId;
          const isPending = !isCompleted && !isCurrent;

          return (
            <div key={module.moduleId} className="flex items-center">
              {/* Step indicator */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center transition-all
                    ${isCompleted
                      ? 'bg-domo-success text-white'
                      : isCurrent
                      ? 'bg-domo-primary text-white ring-2 ring-domo-primary/30'
                      : 'bg-domo-bg-dark text-domo-text-muted border border-domo-border'
                    }
                  `}
                  title={module.name}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <span className="text-xs font-medium">{module.orderIndex}</span>
                  )}
                </div>
                <span
                  className={`text-[10px] mt-1 text-center max-w-[60px] truncate ${
                    isCurrent ? 'text-domo-primary font-medium' : 'text-domo-text-muted'
                  }`}
                >
                  {module.name}
                </span>
              </div>

              {/* Connector line */}
              {index < DEFAULT_PRODUCT_DEMO_MODULES.length - 1 && (
                <div
                  className={`w-8 h-0.5 mx-1 ${
                    isCompleted ? 'bg-domo-success' : 'bg-domo-border'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Current module description */}
      {currentModule && (
        <div className="mt-4 pt-3 border-t border-domo-border">
          <p className="text-xs text-domo-text-secondary">
            <span className="font-medium text-white">Currently:</span>{' '}
            {currentModule.description}
          </p>
        </div>
      )}
    </div>
  );
}

export default ModuleProgressIndicator;
