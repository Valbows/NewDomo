'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Loader2,
  Save,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';
import type { ModuleId } from '@/lib/modules/types';

// Debug logging helper
const debugLog = (message: string, data?: any) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[ModuleConfigEditor] ${message}`, data !== undefined ? data : '');
  }
};

interface DemoModule {
  id: string | null;
  demo_id: string;
  module_id: string;
  name: string;
  description: string;
  order_index: number;
  requires_video: boolean;
  upload_guidance: string;
  is_default?: boolean;
}

interface ModuleConfigurationEditorProps {
  demoId: string;
  onModulesChanged?: () => void;
  className?: string;
}

/**
 * ModuleConfigurationEditor
 *
 * Allows users to customize the demo modules for their specific product.
 * Supports add, edit, delete, reorder, and reset to defaults.
 */
export function ModuleConfigurationEditor({
  demoId,
  onModulesChanged,
  className = '',
}: ModuleConfigurationEditorProps) {
  const [modules, setModules] = useState<DemoModule[]>([]);
  const [isDefault, setIsDefault] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editing state
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<DemoModule>>({});

  // Adding new module state
  const [isAdding, setIsAdding] = useState(false);
  const [newModule, setNewModule] = useState<Partial<DemoModule>>({
    name: '',
    description: '',
    requires_video: false,
    upload_guidance: '',
  });

  // Fetch modules
  useEffect(() => {
    fetchModules();
  }, [demoId]);

  const fetchModules = async () => {
    debugLog('Fetching modules', { demoId });
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/demos/${demoId}/modules`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch modules');
      }

      debugLog('Modules loaded', { count: data.modules.length, isDefault: data.isDefault });
      setModules(data.modules);
      setIsDefault(data.isDefault);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch modules';
      debugLog('Fetch modules failed', { error: errorMsg });
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeCustomModules = async () => {
    debugLog('Initializing custom modules from defaults');
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/demos/${demoId}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useDefaults: true }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize modules');
      }

      debugLog('Custom modules initialized', { count: data.modules.length });
      setModules(data.modules);
      setIsDefault(false);
      onModulesChanged?.();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to initialize modules';
      debugLog('Initialize modules failed', { error: errorMsg });
      setError(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = async () => {
    if (!confirm('This will delete all custom modules and reset to defaults. Continue?')) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/demos/${demoId}/modules?resetToDefaults=true`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset modules');
      }

      await fetchModules();
      onModulesChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset modules');
    } finally {
      setIsSaving(false);
    }
  };

  const saveModule = async (moduleId: string) => {
    debugLog('Saving module', { moduleId, updates: editForm });
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/demos/${demoId}/modules`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId,
          updates: editForm,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save module');
      }

      debugLog('Module saved successfully', { moduleId, module: data.module });

      // Update local state
      setModules((prev) =>
        prev.map((m) => (m.id === moduleId ? { ...m, ...data.module } : m))
      );
      setEditingModuleId(null);
      setEditForm({});
      onModulesChanged?.();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save module';
      debugLog('Save module failed', { moduleId, error: errorMsg });
      setError(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteModule = async (moduleId: string) => {
    if (!confirm('Delete this module? Content assigned to it will become unassigned.')) {
      return;
    }

    debugLog('Deleting module', { moduleId });
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/demos/${demoId}/modules?moduleId=${moduleId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete module');
      }

      debugLog('Module deleted successfully', { moduleId });
      setModules((prev) => prev.filter((m) => m.id !== moduleId));
      onModulesChanged?.();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete module';
      debugLog('Delete module failed', { moduleId, error: errorMsg });
      setError(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const moveModule = async (moduleId: string, direction: 'up' | 'down') => {
    const index = modules.findIndex((m) => m.id === moduleId);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === modules.length - 1)
    ) {
      return;
    }

    debugLog('Moving module', { moduleId, direction, fromIndex: index });

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newModules = [...modules];
    const [moved] = newModules.splice(index, 1);
    newModules.splice(newIndex, 0, moved);

    // Update order indices
    const updatedModules = newModules.map((m, i) => ({
      ...m,
      order_index: i + 1,
    }));

    setModules(updatedModules);

    // Save the moved module's new order
    try {
      await fetch(`/api/demos/${demoId}/modules`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId: moved.id,
          updates: { order_index: newIndex + 1 },
        }),
      });

      // Save the swapped module's order
      const swappedModule = modules[newIndex];
      await fetch(`/api/demos/${demoId}/modules`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId: swappedModule.id,
          updates: { order_index: index + 1 },
        }),
      });

      debugLog('Module moved successfully', { moduleId, newIndex });
      onModulesChanged?.();
    } catch (err) {
      debugLog('Move module failed, reverting', { moduleId, error: err });
      // Revert on error
      fetchModules();
    }
  };

  const startEditing = (module: DemoModule) => {
    setEditingModuleId(module.id);
    setEditForm({
      name: module.name,
      description: module.description,
      requires_video: module.requires_video,
      upload_guidance: module.upload_guidance,
    });
  };

  const cancelEditing = () => {
    setEditingModuleId(null);
    setEditForm({});
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Loader2 className="h-6 w-6 animate-spin text-domo-text-muted" />
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-domo-primary" />
          <h3 className="text-lg font-semibold text-white">Module Configuration</h3>
          {isDefault && (
            <span className="px-2 py-0.5 text-xs font-medium bg-domo-bg-elevated text-domo-text-muted rounded">
              Using Defaults
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isDefault ? (
            <button
              onClick={initializeCustomModules}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-domo-primary text-white hover:bg-domo-secondary disabled:opacity-50 transition-colors"
            >
              <Edit2 className="h-3 w-3" />
              Customize
            </button>
          ) : (
            <button
              onClick={resetToDefaults}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-domo-border text-domo-text-muted hover:text-white hover:border-domo-primary disabled:opacity-50 transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              Reset to Defaults
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-domo-error/10 border border-domo-error/20 rounded-lg text-domo-error text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Module List */}
      <div className="space-y-2">
        {modules.map((module, index) => (
          <div
            key={module.id || module.module_id}
            className="bg-domo-bg-card border border-domo-border rounded-lg p-4"
          >
            {editingModuleId === module.id ? (
              // Edit Mode
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-domo-text-muted mb-1">Name</label>
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-1.5 bg-domo-bg-dark border border-domo-border rounded-lg text-white text-sm focus:outline-none focus:border-domo-primary"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-xs text-domo-text-muted">
                      <input
                        type="checkbox"
                        checked={editForm.requires_video || false}
                        onChange={(e) => setEditForm({ ...editForm, requires_video: e.target.checked })}
                        className="rounded border-domo-border"
                      />
                      Requires Video
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-domo-text-muted mb-1">Description</label>
                  <textarea
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-1.5 bg-domo-bg-dark border border-domo-border rounded-lg text-white text-sm focus:outline-none focus:border-domo-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs text-domo-text-muted mb-1">Upload Guidance</label>
                  <textarea
                    value={editForm.upload_guidance || ''}
                    onChange={(e) => setEditForm({ ...editForm, upload_guidance: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-1.5 bg-domo-bg-dark border border-domo-border rounded-lg text-white text-sm focus:outline-none focus:border-domo-primary"
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={cancelEditing}
                    className="px-3 py-1.5 text-xs text-domo-text-muted hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => saveModule(module.id!)}
                    disabled={isSaving || !editForm.name?.trim()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-domo-primary text-white hover:bg-domo-secondary disabled:opacity-50 transition-colors"
                  >
                    {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                    Save
                  </button>
                </div>
              </div>
            ) : (
              // View Mode
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-domo-primary">
                      {module.order_index}.
                    </span>
                    <span className="text-sm font-medium text-white">{module.name}</span>
                    {module.requires_video && (
                      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-domo-primary/20 text-domo-primary rounded">
                        Video
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-domo-text-secondary mt-1 line-clamp-2">
                    {module.description}
                  </p>
                </div>

                {!isDefault && (
                  <div className="flex items-center gap-1 ml-4">
                    <button
                      onClick={() => moveModule(module.id!, 'up')}
                      disabled={index === 0 || isSaving}
                      className="p-1 text-domo-text-muted hover:text-white disabled:opacity-30 transition-colors"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => moveModule(module.id!, 'down')}
                      disabled={index === modules.length - 1 || isSaving}
                      className="p-1 text-domo-text-muted hover:text-white disabled:opacity-30 transition-colors"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => startEditing(module)}
                      disabled={isSaving}
                      className="p-1 text-domo-text-muted hover:text-domo-primary transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteModule(module.id!)}
                      disabled={isSaving || modules.length <= 1}
                      className="p-1 text-domo-text-muted hover:text-domo-error disabled:opacity-30 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Info for default mode */}
      {isDefault && (
        <p className="text-xs text-domo-text-muted text-center py-2">
          Click &quot;Customize&quot; to modify modules for this demo
        </p>
      )}
    </div>
  );
}

export default ModuleConfigurationEditor;
