'use client';

import React from 'react';
import {
  Video,
  FileText,
  Info,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import type { ModuleDefinition, ModuleId } from '@/lib/modules/types';
import type { DemoVideo, KnowledgeChunk } from '../types';

interface ModuleContentSectionProps {
  module: ModuleDefinition;
  videos: DemoVideo[];
  knowledgeChunks: KnowledgeChunk[];
  isExpanded: boolean;
  onToggle: () => void;
  isActive?: boolean;
}

/**
 * ModuleContentSection
 *
 * Displays a single module's content with its associated videos and knowledge chunks.
 * Shows upload guidance and completion status for the module.
 */
export function ModuleContentSection({
  module,
  videos,
  knowledgeChunks,
  isExpanded,
  onToggle,
  isActive = false,
}: ModuleContentSectionProps) {
  // Filter content for this module
  const moduleVideos = videos.filter((v) => v.module_id === module.moduleId);
  const moduleKnowledge = knowledgeChunks.filter(
    (k) => k.module_id === module.moduleId
  );

  const hasVideos = moduleVideos.length > 0;
  const hasKnowledge = moduleKnowledge.length > 0;
  const hasContent = hasVideos || hasKnowledge;

  // Determine completion status
  const isVideoRequired = module.requiresVideo;
  const videoRequirementMet = !isVideoRequired || hasVideos;
  const isComplete = videoRequirementMet && hasKnowledge;

  return (
    <div
      className={`rounded-xl border transition-all ${
        isActive
          ? 'border-domo-primary bg-domo-primary/5'
          : 'border-domo-border bg-domo-bg-card'
      }`}
    >
      {/* Module Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-domo-bg-elevated/50 transition-colors rounded-xl"
      >
        <div className="flex items-center gap-3">
          {/* Expand/Collapse Icon */}
          <span className="text-domo-text-muted">
            {isExpanded ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </span>

          {/* Module Info */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">
                {module.orderIndex}. {module.name}
              </span>
              {isActive && (
                <span className="px-2 py-0.5 text-xs font-medium bg-domo-primary/20 text-domo-primary rounded-full">
                  Active
                </span>
              )}
            </div>
            <p className="text-xs text-domo-text-secondary mt-0.5">
              {module.description}
            </p>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          {isComplete ? (
            <span className="flex items-center gap-1 text-xs text-domo-success">
              <CheckCircle2 className="h-4 w-4" />
              Ready
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-amber-400">
              <Clock className="h-4 w-4" />
              Needs Content
            </span>
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Upload Guidance */}
          <div className="flex items-start gap-2 p-3 bg-domo-bg-dark rounded-lg">
            <Info className="h-4 w-4 text-domo-primary flex-shrink-0 mt-0.5" />
            <p className="text-xs text-domo-text-secondary">
              {module.uploadGuidance}
            </p>
          </div>

          {/* Content Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Video
                className={`h-4 w-4 ${
                  hasVideos ? 'text-domo-success' : 'text-domo-text-muted'
                }`}
              />
              <span
                className={
                  hasVideos ? 'text-white' : 'text-domo-text-muted'
                }
              >
                {moduleVideos.length} video{moduleVideos.length !== 1 ? 's' : ''}
              </span>
              {isVideoRequired && !hasVideos && (
                <span className="text-xs text-amber-400">(required)</span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <FileText
                className={`h-4 w-4 ${
                  hasKnowledge ? 'text-domo-success' : 'text-domo-text-muted'
                }`}
              />
              <span
                className={
                  hasKnowledge ? 'text-white' : 'text-domo-text-muted'
                }
              >
                {moduleKnowledge.length} knowledge item
                {moduleKnowledge.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Content Lists */}
          {hasContent && (
            <div className="space-y-3">
              {/* Videos */}
              {hasVideos && (
                <div>
                  <h4 className="text-xs font-medium text-domo-text-muted uppercase tracking-wide mb-2">
                    Videos
                  </h4>
                  <ul className="space-y-1">
                    {moduleVideos.map((video) => (
                      <li
                        key={video.id}
                        className="flex items-center gap-2 text-sm text-domo-text-secondary"
                      >
                        <Video className="h-3.5 w-3.5 text-domo-primary" />
                        <span className="truncate">{video.title}</span>
                        {video.processing_status === 'completed' && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-domo-success" />
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Knowledge Chunks */}
              {hasKnowledge && (
                <div>
                  <h4 className="text-xs font-medium text-domo-text-muted uppercase tracking-wide mb-2">
                    Knowledge
                  </h4>
                  <ul className="space-y-1">
                    {moduleKnowledge.slice(0, 5).map((chunk) => (
                      <li
                        key={chunk.id}
                        className="flex items-center gap-2 text-sm text-domo-text-secondary"
                      >
                        <FileText className="h-3.5 w-3.5 text-domo-primary" />
                        <span className="truncate">
                          {chunk.source ||
                            (chunk.chunk_type === 'qa' ? 'Q&A Pair' : 'Content')}
                        </span>
                      </li>
                    ))}
                    {moduleKnowledge.length > 5 && (
                      <li className="text-xs text-domo-text-muted pl-5">
                        +{moduleKnowledge.length - 5} more items
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!hasContent && (
            <div className="text-center py-6">
              <p className="text-sm text-domo-text-muted">
                No content uploaded for this module yet.
              </p>
              <p className="text-xs text-domo-text-muted mt-1">
                Upload videos and knowledge to populate this module.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ModuleContentSection;
