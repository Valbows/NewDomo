import { Plus, Trash2, Upload, Link, FileText, Loader2, AlertCircle, Video, Globe, MessageSquare, ChevronDown, ChevronRight, Layers } from 'lucide-react';
import { KnowledgeChunk, DemoVideo } from '@/app/demos/[demoId]/configure/types';
import React, { useState, useMemo } from 'react';
import { ModuleSelector } from './ModuleSelector';
import { DEFAULT_PRODUCT_DEMO_MODULES } from '@/lib/modules/default-modules';
import type { ModuleId } from '@/lib/modules/types';

interface KnowledgeBaseManagementProps {
  knowledgeChunks: KnowledgeChunk[];
  demoVideos?: DemoVideo[];
  newQuestion: string;
  setNewQuestion: (question: string) => void;
  newAnswer: string;
  setNewAnswer: (answer: string) => void;
  handleAddQAPair: (moduleId?: ModuleId | null) => void;
  handleDeleteKnowledgeChunk: (id: string) => void;
  knowledgeDoc: File | null;
  setKnowledgeDoc: (file: File | null) => void;
  handleKnowledgeDocUpload: (moduleId?: ModuleId | null) => void;
  knowledgeUrl?: string;
  setKnowledgeUrl?: (url: string) => void;
  handleUrlImport?: (moduleId?: ModuleId | null) => void;
  isUploadingFile?: boolean;
  isUploadingUrl?: boolean;
}

interface GroupedKnowledge {
  key: string;
  type: 'video' | 'url' | 'document' | 'qa';
  label: string;
  icon: React.ReactNode;
  link?: string;
  chunks: KnowledgeChunk[];
  moduleId?: ModuleId | null;
}

// Group knowledge chunks by source
function groupKnowledgeChunks(chunks: KnowledgeChunk[], demoVideos: DemoVideo[]): GroupedKnowledge[] {
  const groups: Map<string, GroupedKnowledge> = new Map();

  chunks.forEach(chunk => {
    const source = chunk.source || '';
    let groupKey: string;
    let groupData: Omit<GroupedKnowledge, 'key' | 'chunks'>;

    // Video transcript
    if (source.startsWith('video:') || chunk.chunk_type === 'transcript') {
      const videoId = source.replace('video:', '');
      const video = demoVideos.find(v => v.id === videoId);
      groupKey = `video:${videoId || 'unknown'}`;
      groupData = {
        type: 'video',
        label: video?.title || 'Video Transcript',
        icon: <Video className="h-4 w-4" />
      };
    }
    // URL import
    else if (source.startsWith('http://') || source.startsWith('https://')) {
      groupKey = `url:${source}`;
      try {
        const url = new URL(source);
        groupData = {
          type: 'url',
          label: url.hostname + (url.pathname !== '/' ? url.pathname : ''),
          icon: <Globe className="h-4 w-4" />,
          link: source
        };
      } catch {
        groupData = {
          type: 'url',
          label: source,
          icon: <Globe className="h-4 w-4" />
        };
      }
    }
    // Document
    else if (source && chunk.chunk_type === 'document') {
      groupKey = `document:${source}`;
      groupData = {
        type: 'document',
        label: source,
        icon: <FileText className="h-4 w-4" />
      };
    }
    // Q&A pair - each is its own group
    else if (chunk.chunk_type === 'qa') {
      groupKey = `qa:${chunk.id}`;
      groupData = {
        type: 'qa',
        label: 'Q&A Pair',
        icon: <MessageSquare className="h-4 w-4" />
      };
    }
    // Fallback
    else {
      groupKey = `other:${chunk.id}`;
      groupData = {
        type: 'document',
        label: source || 'Unknown Source',
        icon: <FileText className="h-4 w-4" />
      };
    }

    if (groups.has(groupKey)) {
      groups.get(groupKey)!.chunks.push(chunk);
    } else {
      groups.set(groupKey, {
        key: groupKey,
        ...groupData,
        chunks: [chunk]
      });
    }
  });

  return Array.from(groups.values());
}

export const KnowledgeBaseManagement = ({
  knowledgeChunks,
  demoVideos = [],
  newQuestion,
  setNewQuestion,
  newAnswer,
  setNewAnswer,
  handleAddQAPair,
  handleDeleteKnowledgeChunk,
  knowledgeDoc,
  setKnowledgeDoc,
  handleKnowledgeDocUpload,
  knowledgeUrl = '',
  setKnowledgeUrl,
  handleUrlImport,
  isUploadingFile = false,
  isUploadingUrl = false,
}: KnowledgeBaseManagementProps) => {
  // Track expanded groups
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Module selection states for each upload type
  const [docModuleId, setDocModuleId] = useState<ModuleId | null>(null);
  const [urlModuleId, setUrlModuleId] = useState<ModuleId | null>(null);
  const [qaModuleId, setQaModuleId] = useState<ModuleId | null>(null);

  // Filter videos that are pending/processing transcription
  const pendingVideos = demoVideos.filter(
    v => v.processing_status === 'pending' || v.processing_status === 'processing'
  );
  const failedVideos = demoVideos.filter(v => v.processing_status === 'failed');

  // Group knowledge chunks by source
  const groupedKnowledge = useMemo(
    () => groupKnowledgeChunks(knowledgeChunks, demoVideos),
    [knowledgeChunks, demoVideos]
  );

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleDeleteGroup = (group: GroupedKnowledge) => {
    // Delete all chunks in the group
    group.chunks.forEach(chunk => {
      handleDeleteKnowledgeChunk(chunk.id);
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-2 font-heading">Knowledge Base</h2>
        <p className="text-domo-text-secondary">Upload documents, import URLs, and add Q&A pairs to train your agent.</p>
      </div>

      {/* Add Knowledge section - Three columns at TOP */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Upload Document */}
        <div className="bg-domo-bg-card border border-domo-border p-4 rounded-xl">
          <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-domo-text-muted" />
            Upload Document
          </h3>
          <div className="space-y-3">
            <div className="flex justify-center px-3 py-3 border-2 border-domo-border border-dashed rounded-lg hover:border-domo-primary/50 transition-colors">
              <div className="text-center">
                <label htmlFor="doc-upload" className="cursor-pointer text-sm font-medium text-domo-primary hover:text-domo-secondary transition-colors">
                  Choose file
                  <input id="doc-upload" name="doc-upload" type="file" className="sr-only" onChange={(e) => setKnowledgeDoc(e.target.files ? e.target.files[0] : null)} accept=".pdf,.docx,.txt" />
                </label>
                <p className="text-xs text-domo-text-muted mt-1">PDF, DOCX, TXT</p>
                {knowledgeDoc && <p className="text-xs text-white mt-1 truncate max-w-[150px]">{knowledgeDoc.name}</p>}
              </div>
            </div>
            <ModuleSelector
              value={docModuleId}
              onChange={setDocModuleId}
              placeholder="Select module *"
              size="sm"
            />
            {!docModuleId && knowledgeDoc && (
              <p className="text-xs text-amber-400">Select a module first</p>
            )}
            <button
              onClick={() => {
                handleKnowledgeDocUpload(docModuleId);
                setDocModuleId(null);
              }}
              disabled={!knowledgeDoc || isUploadingFile || !docModuleId}
              className="w-full inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg text-white bg-domo-primary hover:bg-domo-secondary disabled:bg-domo-bg-elevated disabled:text-domo-text-muted disabled:cursor-not-allowed transition-colors"
            >
              {isUploadingFile ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="-ml-1 mr-2 h-4 w-4" />
                  Upload
                </>
              )}
            </button>
          </div>
        </div>

        {/* Import from URL */}
        {setKnowledgeUrl && handleUrlImport && (
          <div className="bg-domo-bg-card border border-domo-border p-4 rounded-xl">
            <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
              <Globe className="h-4 w-4 text-domo-text-muted" />
              Import from URL
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex rounded-lg overflow-hidden">
                  <span className="inline-flex items-center px-2.5 border border-r-0 border-domo-border bg-domo-bg-dark text-domo-text-muted">
                    <Link className="h-3.5 w-3.5" />
                  </span>
                  <input
                    type="url"
                    id="url-input"
                    value={knowledgeUrl}
                    onChange={(e) => setKnowledgeUrl(e.target.value)}
                    className="flex-1 block w-full px-3 py-2 bg-domo-bg-dark border border-domo-border text-white placeholder-domo-text-muted focus:outline-none focus:border-domo-primary focus:ring-1 focus:ring-domo-primary text-sm"
                    placeholder="https://example.com"
                  />
                </div>
              </div>
              <ModuleSelector
                value={urlModuleId}
                onChange={setUrlModuleId}
                placeholder="Select module *"
                size="sm"
              />
              {!urlModuleId && knowledgeUrl.trim() && (
                <p className="text-xs text-amber-400">Select a module first</p>
              )}
              <button
                onClick={() => {
                  handleUrlImport(urlModuleId);
                  setUrlModuleId(null);
                }}
                disabled={!knowledgeUrl.trim() || isUploadingUrl || !urlModuleId}
                className="w-full inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg text-white bg-domo-primary hover:bg-domo-secondary disabled:bg-domo-bg-elevated disabled:text-domo-text-muted disabled:cursor-not-allowed transition-colors"
              >
                {isUploadingUrl ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Globe className="-ml-1 mr-2 h-4 w-4" />
                    Import
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Add Q&A Pair */}
        <div className="bg-domo-bg-card border border-domo-border p-4 rounded-xl">
          <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-domo-text-muted" />
            Add Q&A Pair
          </h3>
          <div className="space-y-2">
            <input
              type="text"
              id="question"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              className="block w-full px-3 py-1.5 bg-domo-bg-dark border border-domo-border rounded-lg text-white placeholder-domo-text-muted focus:outline-none focus:border-domo-primary focus:ring-1 focus:ring-domo-primary text-sm"
              placeholder="Question..."
            />
            <textarea
              id="answer"
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              rows={2}
              className="block w-full px-3 py-1.5 bg-domo-bg-dark border border-domo-border rounded-lg text-white placeholder-domo-text-muted focus:outline-none focus:border-domo-primary focus:ring-1 focus:ring-domo-primary text-sm"
              placeholder="Answer..."
            ></textarea>
            <ModuleSelector
              value={qaModuleId}
              onChange={setQaModuleId}
              placeholder="Select module *"
              size="sm"
            />
            {!qaModuleId && newQuestion.trim() && newAnswer.trim() && (
              <p className="text-xs text-amber-400">Select a module first</p>
            )}
            <button
              onClick={() => {
                handleAddQAPair(qaModuleId);
                setQaModuleId(null);
              }}
              disabled={!newQuestion.trim() || !newAnswer.trim() || !qaModuleId}
              className="w-full inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg text-white bg-domo-primary hover:bg-domo-secondary disabled:bg-domo-bg-elevated disabled:text-domo-text-muted disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="-ml-1 mr-2 h-4 w-4" />
              Add Q&A
            </button>
          </div>
        </div>
      </div>

      {/* Existing Knowledge section */}
      <div className="bg-domo-bg-card border border-domo-border p-6 rounded-xl">
        <h3 className="text-lg font-medium text-white mb-4">Existing Knowledge</h3>
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {/* Show pending transcriptions at the top */}
          {pendingVideos.map(video => (
            <div key={`pending-${video.id}`} className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/10 flex items-start gap-3">
              <Loader2 className="h-5 w-5 text-amber-400 animate-spin flex-shrink-0 mt-0.5" />
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Video className="h-4 w-4 text-amber-400" />
                  <span className="text-sm font-medium text-amber-400">{video.title}</span>
                </div>
                <p className="text-xs text-amber-400/70">Transcribing... This will appear here once complete.</p>
              </div>
            </div>
          ))}

          {/* Show failed transcriptions */}
          {failedVideos.map(video => (
            <div key={`failed-${video.id}`} className="p-4 rounded-lg border border-domo-error/30 bg-domo-error/10 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-domo-error flex-shrink-0 mt-0.5" />
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Video className="h-4 w-4 text-domo-error" />
                  <span className="text-sm font-medium text-domo-error">{video.title}</span>
                </div>
                <p className="text-xs text-domo-error/70">Transcription failed - retry from Video Segments tab</p>
              </div>
            </div>
          ))}

          {/* Show grouped knowledge chunks */}
          {groupedKnowledge.map(group => {
            const isExpanded = expandedGroups.has(group.key);
            const hasMultipleChunks = group.chunks.length > 1;

            return (
              <div key={group.key} className="rounded-lg border border-domo-border bg-domo-bg-dark overflow-hidden">
                {/* Group Header - Always clickable to expand/collapse */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-domo-bg-elevated/50 transition-colors"
                  onClick={() => toggleGroup(group.key)}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-grow">
                    <span className="text-domo-text-muted flex-shrink-0">
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </span>
                    <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-domo-bg-elevated text-sm font-medium text-domo-text-secondary flex-shrink-0">
                      {group.icon}
                      {group.link ? (
                        <a
                          href={group.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-domo-primary transition-colors"
                          onClick={(e) => e.stopPropagation()}
                          title={group.link}
                        >
                          {group.label}
                        </a>
                      ) : (
                        <span>{group.label}</span>
                      )}
                    </span>
                    {hasMultipleChunks && (
                      <span className="text-xs text-domo-text-muted">
                        {group.chunks.length} segments
                      </span>
                    )}
                    {/* Show module badge if any chunk has a module */}
                    {(() => {
                      const moduleId = group.chunks.find(c => c.module_id)?.module_id as ModuleId | undefined;
                      if (!moduleId) return null;
                      const module = DEFAULT_PRODUCT_DEMO_MODULES.find(m => m.moduleId === moduleId);
                      return module ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-domo-primary/10 text-domo-primary">
                          <Layers className="h-3 w-3" />
                          {module.name}
                        </span>
                      ) : null;
                    })()}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteGroup(group);
                    }}
                    className="text-domo-error hover:text-domo-error/80 flex-shrink-0 transition-colors p-1 ml-2"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Group Content - Only shown when expanded */}
                {isExpanded && (
                  <div className="border-t border-domo-border">
                    {group.chunks.map((chunk, index) => (
                      <div
                        key={chunk.id}
                        className={`p-4 ${index > 0 ? 'border-t border-domo-border/50' : ''}`}
                      >
                        {hasMultipleChunks && (
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-domo-text-muted">Segment {index + 1}</span>
                            <button
                              onClick={() => handleDeleteKnowledgeChunk(chunk.id)}
                              className="text-domo-error/60 hover:text-domo-error text-xs transition-colors"
                            >
                              Remove segment
                            </button>
                          </div>
                        )}
                        <p className="text-sm text-domo-text-secondary whitespace-pre-wrap break-words">
                          {chunk.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {knowledgeChunks.length === 0 && pendingVideos.length === 0 && failedVideos.length === 0 && (
            <div className="text-center text-sm text-domo-text-muted py-8">
              No knowledge added yet. Use the options above to add content.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
