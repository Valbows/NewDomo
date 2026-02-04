/**
 * Module Content Builder
 *
 * Groups knowledge chunks and videos by module for structured system prompts.
 * This enables the LLM to understand content organization and provides the
 * foundation for future module-aware retrieval.
 */

import { DEFAULT_PRODUCT_DEMO_MODULES } from './default-modules';
import type { ModuleId } from './types';

interface KnowledgeChunk {
  content: string;
  chunk_type: string;
  source?: string | null;
  module_id?: string | null;
}

interface DemoVideo {
  title: string;
  metadata?: {
    twelvelabs?: {
      generatedContext?: string;
    };
  } | null;
  module_id?: string | null;
}

/**
 * Group knowledge chunks by module ID
 */
export function groupChunksByModule(
  chunks: KnowledgeChunk[]
): Map<string, KnowledgeChunk[]> {
  const byModule = new Map<string, KnowledgeChunk[]>();

  for (const chunk of chunks) {
    const moduleKey = chunk.module_id || 'global';
    if (!byModule.has(moduleKey)) {
      byModule.set(moduleKey, []);
    }
    byModule.get(moduleKey)!.push(chunk);
  }

  return byModule;
}

/**
 * Group videos by module ID
 */
export function groupVideosByModule(
  videos: DemoVideo[]
): Map<string, DemoVideo[]> {
  const byModule = new Map<string, DemoVideo[]>();

  for (const video of videos) {
    const moduleKey = video.module_id || 'global';
    if (!byModule.has(moduleKey)) {
      byModule.set(moduleKey, []);
    }
    byModule.get(moduleKey)!.push(video);
  }

  return byModule;
}

/**
 * Build a module-structured knowledge section for the system prompt.
 *
 * This organizes all content by module, making it easier for the LLM
 * to understand what content is relevant at each stage of the demo.
 */
export function buildModuleContentSection(
  chunks: KnowledgeChunk[],
  videos: DemoVideo[]
): string {
  const chunksByModule = groupChunksByModule(chunks);
  const videosByModule = groupVideosByModule(videos);

  let content = '\n\n## KNOWLEDGE BASE BY MODULE\n';
  content +=
    'Content is organized by conversation module. Use the most relevant content based on where you are in the demo flow.\n';

  // Process modules in order
  for (const moduleDef of DEFAULT_PRODUCT_DEMO_MODULES) {
    const moduleChunks = chunksByModule.get(moduleDef.moduleId) || [];
    const moduleVideos = videosByModule.get(moduleDef.moduleId) || [];

    // Skip empty modules
    if (moduleChunks.length === 0 && moduleVideos.length === 0) continue;

    content += `\n### Module: ${moduleDef.name} (id: ${moduleDef.moduleId})\n`;
    content += `*${moduleDef.description}*\n`;

    // Videos for this module
    if (moduleVideos.length > 0) {
      content += `\n**Available Videos:**\n`;
      for (const video of moduleVideos) {
        content += `- ${video.title}`;
        if (video.metadata?.twelvelabs?.generatedContext) {
          // Include abbreviated context (first few lines, limited chars)
          const ctx = video.metadata.twelvelabs.generatedContext;
          const summary = ctx.split('\n').slice(0, 3).join(' ').substring(0, 200);
          content += `: ${summary}...`;
        }
        content += '\n';
      }
    }

    // Knowledge for this module
    if (moduleChunks.length > 0) {
      const qaChunks = moduleChunks.filter((c) => c.chunk_type === 'qa');
      const docChunks = moduleChunks.filter((c) => c.chunk_type === 'document');
      const transcriptChunks = moduleChunks.filter(
        (c) => c.chunk_type === 'transcript'
      );

      if (qaChunks.length > 0) {
        content += `\n**Q&A (${qaChunks.length} items):**\n`;
        // Show first few Q&A pairs
        qaChunks.slice(0, 5).forEach((qa) => {
          content += `${qa.content.substring(0, 300)}${qa.content.length > 300 ? '...' : ''}\n`;
        });
        if (qaChunks.length > 5) {
          content += `*(${qaChunks.length - 5} more Q&A pairs available)*\n`;
        }
      }

      if (docChunks.length > 0) {
        content += `\n**Documentation (${docChunks.length} chunks):**\n`;
        // Show abbreviated content from first few docs
        docChunks.slice(0, 3).forEach((doc) => {
          const source = doc.source ? `[${doc.source}]: ` : '';
          content += `${source}${doc.content.substring(0, 200)}...\n`;
        });
        if (docChunks.length > 3) {
          content += `*(${docChunks.length - 3} more document chunks available)*\n`;
        }
      }

      if (transcriptChunks.length > 0) {
        content += `\n**Video Transcripts (${transcriptChunks.length} chunks available)**\n`;
      }
    }
  }

  // Global content (no module assigned)
  const globalChunks = chunksByModule.get('global') || [];
  const globalVideos = videosByModule.get('global') || [];

  if (globalChunks.length > 0 || globalVideos.length > 0) {
    content += `\n### Global Content (available in all modules)\n`;

    if (globalVideos.length > 0) {
      content += `**Videos:** ${globalVideos.map((v) => v.title).join(', ')}\n`;
    }

    if (globalChunks.length > 0) {
      const qaCount = globalChunks.filter((c) => c.chunk_type === 'qa').length;
      const docCount = globalChunks.filter((c) => c.chunk_type === 'document').length;
      const transcriptCount = globalChunks.filter(
        (c) => c.chunk_type === 'transcript'
      ).length;

      const parts: string[] = [];
      if (qaCount > 0) parts.push(`${qaCount} Q&A`);
      if (docCount > 0) parts.push(`${docCount} docs`);
      if (transcriptCount > 0) parts.push(`${transcriptCount} transcripts`);

      content += `**Knowledge:** ${parts.join(', ')}\n`;
    }
  }

  return content;
}

/**
 * Build a modules and objectives section showing the demo flow structure.
 */
export function buildModulesObjectivesSection(): string {
  let section = '\n\n## MODULES AND OBJECTIVES\n';
  section += 'This demo follows a structured flow through these modules:\n';

  for (const moduleDef of DEFAULT_PRODUCT_DEMO_MODULES) {
    section += `\n### Module: ${moduleDef.name} (id: ${moduleDef.moduleId})\n`;
    section += `${moduleDef.description}\n`;
    if (moduleDef.objectiveIds.length > 0) {
      section += `Objectives: ${moduleDef.objectiveIds.join(', ')}\n`;
    }
    if (moduleDef.requiresVideo) {
      section += `*This module typically involves showing videos.*\n`;
    }
  }

  return section;
}

/**
 * Get summary stats for module content
 */
export function getModuleContentStats(
  chunks: KnowledgeChunk[],
  videos: DemoVideo[]
): Record<
  ModuleId | 'global',
  { videoCount: number; chunkCount: number; hasContent: boolean }
> {
  const chunksByModule = groupChunksByModule(chunks);
  const videosByModule = groupVideosByModule(videos);

  const stats: Record<
    string,
    { videoCount: number; chunkCount: number; hasContent: boolean }
  > = {};

  // Initialize all modules
  for (const moduleDef of DEFAULT_PRODUCT_DEMO_MODULES) {
    const moduleVideos = videosByModule.get(moduleDef.moduleId) || [];
    const moduleChunks = chunksByModule.get(moduleDef.moduleId) || [];
    stats[moduleDef.moduleId] = {
      videoCount: moduleVideos.length,
      chunkCount: moduleChunks.length,
      hasContent: moduleVideos.length > 0 || moduleChunks.length > 0,
    };
  }

  // Add global stats
  const globalVideos = videosByModule.get('global') || [];
  const globalChunks = chunksByModule.get('global') || [];
  stats['global'] = {
    videoCount: globalVideos.length,
    chunkCount: globalChunks.length,
    hasContent: globalVideos.length > 0 || globalChunks.length > 0,
  };

  return stats as Record<
    ModuleId | 'global',
    { videoCount: number; chunkCount: number; hasContent: boolean }
  >;
}
