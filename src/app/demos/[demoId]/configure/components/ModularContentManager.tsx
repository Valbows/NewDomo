'use client';

import React, { useState, useMemo } from 'react';
import {
  Layers,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Video,
  FileText,
  Loader2,
  Check,
} from 'lucide-react';
import { DEFAULT_PRODUCT_DEMO_MODULES } from '@/lib/modules/default-modules';
import type { ModuleId, ModuleDefinition } from '@/lib/modules/types';
import type { DemoVideo, KnowledgeChunk } from '../types';
import { ModuleContentSection } from './ModuleContentSection';
import { ModuleSelector } from './ModuleSelector';

// Debug logging helper
const debugLog = (message: string, data?: any) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[ModularContentManager] ${message}`, data !== undefined ? data : '');
  }
};

interface ModularContentManagerProps {
  videos: DemoVideo[];
  knowledgeChunks: KnowledgeChunk[];
  activeModuleId?: ModuleId | null;
  onModuleSelect?: (moduleId: ModuleId) => void;
  onContentUpdated?: () => void;
  className?: string;
}

interface ModuleStats {
  moduleId: ModuleId;
  videoCount: number;
  knowledgeCount: number;
  isComplete: boolean;
  requiresVideo: boolean;
}

/**
 * ModularContentManager
 *
 * Organizes and displays content by module, showing completion status
 * and allowing users to understand how their content maps to the demo flow.
 */
export function ModularContentManager({
  videos,
  knowledgeChunks,
  activeModuleId,
  onModuleSelect,
  onContentUpdated,
  className = '',
}: ModularContentManagerProps) {
  const [expandedModules, setExpandedModules] = useState<Set<ModuleId>>(
    new Set()
  );
  const [showUnassigned, setShowUnassigned] = useState(false);

  // Bulk assignment state
  const [selectedVideoIds, setSelectedVideoIds] = useState<Set<string>>(new Set());
  const [selectedChunkIds, setSelectedChunkIds] = useState<Set<string>>(new Set());
  const [bulkAssignModuleId, setBulkAssignModuleId] = useState<ModuleId | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);

  const hasSelection = selectedVideoIds.size > 0 || selectedChunkIds.size > 0;

  const toggleVideoSelection = (videoId: string) => {
    setSelectedVideoIds((prev) => {
      const next = new Set(prev);
      if (next.has(videoId)) {
        next.delete(videoId);
      } else {
        next.add(videoId);
      }
      return next;
    });
  };

  const toggleChunkSelection = (chunkId: string) => {
    setSelectedChunkIds((prev) => {
      const next = new Set(prev);
      if (next.has(chunkId)) {
        next.delete(chunkId);
      } else {
        next.add(chunkId);
      }
      return next;
    });
  };

  const selectAllUnassigned = () => {
    setSelectedVideoIds(new Set(unassignedVideos.map((v) => v.id)));
    setSelectedChunkIds(new Set(unassignedKnowledge.map((k) => k.id)));
  };

  const clearSelection = () => {
    setSelectedVideoIds(new Set());
    setSelectedChunkIds(new Set());
  };

  const handleBulkAssign = async () => {
    if (!hasSelection) return;

    debugLog('Starting bulk assignment', {
      videoIds: Array.from(selectedVideoIds),
      chunkIds: Array.from(selectedChunkIds),
      targetModule: bulkAssignModuleId,
    });

    setIsAssigning(true);
    setAssignmentError(null);

    try {
      const response = await fetch('/api/content/bulk-assign-module', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoIds: Array.from(selectedVideoIds),
          knowledgeChunkIds: Array.from(selectedChunkIds),
          moduleId: bulkAssignModuleId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Assignment failed');
      }

      debugLog('Bulk assignment successful', data);

      // Clear selection and refresh
      clearSelection();
      setBulkAssignModuleId(null);
      onContentUpdated?.();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Assignment failed';
      debugLog('Bulk assignment failed', { error: errorMsg });
      setAssignmentError(errorMsg);
    } finally {
      setIsAssigning(false);
    }
  };

  // Calculate stats for each module
  const moduleStats = useMemo<ModuleStats[]>(() => {
    return DEFAULT_PRODUCT_DEMO_MODULES.map((module) => {
      const moduleVideos = videos.filter((v) => v.module_id === module.moduleId);
      const moduleKnowledge = knowledgeChunks.filter(
        (k) => k.module_id === module.moduleId
      );

      const hasVideos = moduleVideos.length > 0;
      const hasKnowledge = moduleKnowledge.length > 0;
      const videoRequirementMet = !module.requiresVideo || hasVideos;
      const isComplete = videoRequirementMet && hasKnowledge;

      return {
        moduleId: module.moduleId,
        videoCount: moduleVideos.length,
        knowledgeCount: moduleKnowledge.length,
        isComplete,
        requiresVideo: module.requiresVideo,
      };
    });
  }, [videos, knowledgeChunks]);

  // Find unassigned content (no module_id)
  const unassignedVideos = useMemo(
    () => videos.filter((v) => !v.module_id),
    [videos]
  );
  const unassignedKnowledge = useMemo(
    () => knowledgeChunks.filter((k) => !k.module_id),
    [knowledgeChunks]
  );
  const hasUnassigned =
    unassignedVideos.length > 0 || unassignedKnowledge.length > 0;

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    const completedCount = moduleStats.filter((m) => m.isComplete).length;
    const totalModules = moduleStats.length;
    return {
      completed: completedCount,
      total: totalModules,
      percentage: Math.round((completedCount / totalModules) * 100),
    };
  }, [moduleStats]);

  const toggleModule = (moduleId: ModuleId) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });

    // Notify parent if provided
    if (onModuleSelect) {
      onModuleSelect(moduleId);
    }
  };

  const expandAll = () => {
    setExpandedModules(
      new Set(DEFAULT_PRODUCT_DEMO_MODULES.map((m) => m.moduleId))
    );
  };

  const collapseAll = () => {
    setExpandedModules(new Set());
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Layers className="h-5 w-5 text-domo-primary" />
          <div>
            <h3 className="text-lg font-semibold text-white">Content by Module</h3>
            <p className="text-xs text-domo-text-secondary">
              Organize your content to match the demo flow
            </p>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-white">
              {overallProgress.completed}/{overallProgress.total} modules ready
            </p>
            <p className="text-xs text-domo-text-muted">
              {overallProgress.percentage}% complete
            </p>
          </div>
          <div className="w-24 h-2 bg-domo-bg-dark rounded-full overflow-hidden">
            <div
              className="h-full bg-domo-success transition-all duration-300"
              style={{ width: `${overallProgress.percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="flex items-center gap-2 p-3 bg-domo-bg-card rounded-lg border border-domo-border">
        <div className="flex items-center gap-4 flex-1">
          {moduleStats.map((stat) => {
            const module = DEFAULT_PRODUCT_DEMO_MODULES.find(
              (m) => m.moduleId === stat.moduleId
            );
            if (!module) return null;

            return (
              <button
                key={stat.moduleId}
                onClick={() => toggleModule(stat.moduleId)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  activeModuleId === stat.moduleId
                    ? 'bg-domo-primary text-white'
                    : stat.isComplete
                    ? 'bg-domo-success/10 text-domo-success hover:bg-domo-success/20'
                    : 'bg-domo-bg-dark text-domo-text-muted hover:text-white'
                }`}
                title={module.name}
              >
                {stat.isComplete ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <AlertCircle className="h-3 w-3" />
                )}
                <span>{module.orderIndex}</span>
              </button>
            );
          })}
        </div>

        {/* Expand/Collapse Controls */}
        <div className="flex items-center gap-2 border-l border-domo-border pl-4">
          <button
            onClick={expandAll}
            className="text-xs text-domo-text-muted hover:text-white transition-colors"
          >
            Expand All
          </button>
          <span className="text-domo-border">|</span>
          <button
            onClick={collapseAll}
            className="text-xs text-domo-text-muted hover:text-white transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Module Sections */}
      <div className="space-y-3">
        {DEFAULT_PRODUCT_DEMO_MODULES.map((module) => (
          <ModuleContentSection
            key={module.moduleId}
            module={module}
            videos={videos}
            knowledgeChunks={knowledgeChunks}
            isExpanded={expandedModules.has(module.moduleId)}
            onToggle={() => toggleModule(module.moduleId)}
            isActive={activeModuleId === module.moduleId}
          />
        ))}
      </div>

      {/* Unassigned Content Section */}
      {hasUnassigned && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5">
          <button
            onClick={() => setShowUnassigned(!showUnassigned)}
            className="w-full flex items-center justify-between p-4 text-left"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-400" />
              <div>
                <span className="text-sm font-semibold text-amber-400">
                  Unassigned Content
                </span>
                <p className="text-xs text-amber-400/70 mt-0.5">
                  {unassignedVideos.length} video
                  {unassignedVideos.length !== 1 ? 's' : ''},{' '}
                  {unassignedKnowledge.length} knowledge item
                  {unassignedKnowledge.length !== 1 ? 's' : ''} not assigned to
                  any module
                </p>
              </div>
            </div>
            <ChevronDown
              className={`h-5 w-5 text-amber-400 transition-transform ${
                showUnassigned ? 'rotate-180' : ''
              }`}
            />
          </button>

          {showUnassigned && (
            <div className="px-4 pb-4 space-y-4">
              {/* Bulk Assignment Controls */}
              <div className="flex items-center gap-3 p-3 bg-amber-500/10 rounded-lg">
                <div className="flex-1 flex items-center gap-3">
                  <button
                    onClick={hasSelection ? clearSelection : selectAllUnassigned}
                    className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    {hasSelection ? 'Clear selection' : 'Select all'}
                  </button>
                  {hasSelection && (
                    <span className="text-xs text-amber-400/70">
                      {selectedVideoIds.size + selectedChunkIds.size} selected
                    </span>
                  )}
                </div>

                {hasSelection && (
                  <div className="flex items-center gap-2">
                    <ModuleSelector
                      value={bulkAssignModuleId}
                      onChange={setBulkAssignModuleId}
                      placeholder="Assign to..."
                      size="sm"
                      allowUnassigned={true}
                    />
                    <button
                      onClick={handleBulkAssign}
                      disabled={isAssigning || !bulkAssignModuleId}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-500 text-white hover:bg-amber-400 disabled:bg-amber-500/50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isAssigning ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Assigning...
                        </>
                      ) : (
                        <>
                          <Check className="h-3 w-3" />
                          Assign
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {assignmentError && (
                <p className="text-xs text-red-400">{assignmentError}</p>
              )}

              {/* Unassigned Videos */}
              {unassignedVideos.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-amber-400/70 uppercase tracking-wide mb-2">
                    Videos
                  </h4>
                  <ul className="space-y-1">
                    {unassignedVideos.map((video) => (
                      <li
                        key={video.id}
                        className="flex items-center gap-2 text-sm text-amber-400"
                      >
                        <button
                          onClick={() => toggleVideoSelection(video.id)}
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            selectedVideoIds.has(video.id)
                              ? 'bg-amber-500 border-amber-500 text-white'
                              : 'border-amber-400/50 hover:border-amber-400'
                          }`}
                        >
                          {selectedVideoIds.has(video.id) && (
                            <Check className="h-3 w-3" />
                          )}
                        </button>
                        <Video className="h-3.5 w-3.5" />
                        <span className="truncate">{video.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Unassigned Knowledge */}
              {unassignedKnowledge.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-amber-400/70 uppercase tracking-wide mb-2">
                    Knowledge
                  </h4>
                  <ul className="space-y-1">
                    {unassignedKnowledge.slice(0, 10).map((chunk) => (
                      <li
                        key={chunk.id}
                        className="flex items-center gap-2 text-sm text-amber-400"
                      >
                        <button
                          onClick={() => toggleChunkSelection(chunk.id)}
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            selectedChunkIds.has(chunk.id)
                              ? 'bg-amber-500 border-amber-500 text-white'
                              : 'border-amber-400/50 hover:border-amber-400'
                          }`}
                        >
                          {selectedChunkIds.has(chunk.id) && (
                            <Check className="h-3 w-3" />
                          )}
                        </button>
                        <FileText className="h-3.5 w-3.5" />
                        <span className="truncate">
                          {chunk.source ||
                            (chunk.chunk_type === 'qa' ? 'Q&A Pair' : 'Content')}
                        </span>
                      </li>
                    ))}
                    {unassignedKnowledge.length > 10 && (
                      <li className="text-xs text-amber-400/50 pl-5">
                        +{unassignedKnowledge.length - 10} more items
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ModularContentManager;
