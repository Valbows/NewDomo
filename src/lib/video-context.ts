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
  chapterNumber?: number;
  description?: string;
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

  // Split into lines and process each line separately to avoid greedy matching issues
  const lines = chapterSection.split('\n');

  for (const line of lines) {
    // Match chapter pattern: "1. [0:00 - 1:30] Chapter title" or "1. [0:00 - 1:30]"
    // Description should NOT start with another chapter pattern (digit followed by period)
    const chapterRegex = /^(\d+)\.\s*\[(\d+):(\d+)\s*-\s*(\d+):(\d+)\]\s*(.*)$/;
    const match = line.trim().match(chapterRegex);

    if (match) {
      const chapterNumber = parseInt(match[1], 10);
      const startMins = parseInt(match[2], 10);
      const startSecs = parseInt(match[3], 10);
      const endMins = parseInt(match[4], 10);
      const endSecs = parseInt(match[5], 10);
      let description = match[6]?.trim() || '';

      // Clean up description: remove any trailing chapter patterns that might have been captured
      // e.g., if description is "2. [0:21 - 0:56] Something", extract only "Something" or clear it
      const nextChapterPattern = /^\d+\.\s*\[\d+:\d+\s*-\s*\d+:\d+\]/;
      if (nextChapterPattern.test(description)) {
        // Description contains another chapter pattern - this means no real description
        description = '';
      }

      // Create a user-friendly title: use description if available, otherwise "Chapter N"
      const title = description || `Chapter ${chapterNumber}`;

      chapters.push({
        start: startMins * 60 + startSecs,
        end: endMins * 60 + endSecs,
        title,
        chapterNumber,
        description: description || undefined,
      });
    }
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
