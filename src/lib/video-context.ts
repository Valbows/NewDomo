/**
 * Video Context Utility
 *
 * Matches video timestamps to Twelve Labs chapter data
 * to provide context-aware information to the AI agent.
 */

export interface VideoChapter {
  start: number;
  end: number;
  title: string;
}

export interface VideoContextInfo {
  currentTimestamp: number;
  formattedTime: string;
  currentChapter: VideoChapter | null;
  chapterDescription: string;
  videoTitle: string;
  isPaused: boolean;
}

/**
 * Parse chapters from the Twelve Labs generated context string
 */
export function parseChaptersFromContext(generatedContext: string): VideoChapter[] {
  const chapters: VideoChapter[] = [];

  // Look for chapter section in the context
  const chapterMatch = generatedContext.match(/## Video Chapters\s*\n([\s\S]*?)(?=\n##|$)/);
  if (!chapterMatch) return chapters;

  const chapterSection = chapterMatch[1];

  // Parse each chapter line: "1. [0:00 - 1:30] Chapter title"
  const chapterRegex = /\d+\.\s*\[(\d+):(\d+)\s*-\s*(\d+):(\d+)\]\s*(.+)/g;
  let match;

  while ((match = chapterRegex.exec(chapterSection)) !== null) {
    const startMins = parseInt(match[1], 10);
    const startSecs = parseInt(match[2], 10);
    const endMins = parseInt(match[3], 10);
    const endSecs = parseInt(match[4], 10);
    const title = match[5].trim();

    chapters.push({
      start: startMins * 60 + startSecs,
      end: endMins * 60 + endSecs,
      title
    });
  }

  return chapters;
}

/**
 * Find the chapter that contains the given timestamp
 */
export function findChapterAtTimestamp(chapters: VideoChapter[], timestamp: number): VideoChapter | null {
  for (const chapter of chapters) {
    if (timestamp >= chapter.start && timestamp <= chapter.end) {
      return chapter;
    }
  }

  // If no exact match, find the closest chapter before this timestamp
  const sortedChapters = [...chapters].sort((a, b) => b.start - a.start);
  for (const chapter of sortedChapters) {
    if (timestamp >= chapter.start) {
      return chapter;
    }
  }

  return chapters[0] || null;
}

/**
 * Format seconds to MM:SS
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Build a context description for the current video position
 */
export function buildVideoContextDescription(info: VideoContextInfo): string {
  let description = `User is ${info.isPaused ? 'paused' : 'watching'} "${info.videoTitle}" at ${info.formattedTime}`;

  if (info.currentChapter) {
    description += `. Currently viewing: "${info.currentChapter.title}"`;
  }

  return description;
}

/**
 * Create a message payload to send to the Tavus agent
 */
export function createVideoContextMessage(info: VideoContextInfo): object {
  return {
    type: 'video_context_update',
    video_title: info.videoTitle,
    timestamp: info.currentTimestamp,
    formatted_time: info.formattedTime,
    is_paused: info.isPaused,
    current_chapter: info.currentChapter ? {
      title: info.currentChapter.title,
      start: info.currentChapter.start,
      end: info.currentChapter.end
    } : null,
    description: buildVideoContextDescription(info)
  };
}
