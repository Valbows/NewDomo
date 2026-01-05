/**
 * Integration tests for Video Context utilities
 *
 * Tests the video context parsing and matching logic
 * used for providing context-aware information to the AI agent.
 */

import {
  parseChaptersFromContext,
  findChapterAtTimestamp,
  formatTime,
  buildVideoContextDescription,
  createVideoContextMessage,
  VideoChapter,
  VideoContextInfo,
} from '@/lib/video-context';

describe('Video Context Utilities', () => {
  describe('parseChaptersFromContext', () => {
    it('should parse chapters from a valid context string', () => {
      const contextString = `## Video Content Overview

This is a demo video showing the product features.

## Video Chapters

1. [0:00 - 1:30] Introduction and Overview
2. [1:30 - 3:45] Feature Demonstration
3. [3:45 - 5:00] Advanced Settings
4. [5:00 - 6:30] Conclusion and Next Steps

## Additional Notes
`;

      const chapters = parseChaptersFromContext(contextString);

      expect(chapters).toHaveLength(4);
      expect(chapters[0]).toEqual({
        start: 0,
        end: 90, // 1:30 = 90 seconds
        title: 'Introduction and Overview',
      });
      expect(chapters[1]).toEqual({
        start: 90,
        end: 225, // 3:45 = 225 seconds
        title: 'Feature Demonstration',
      });
      expect(chapters[2]).toEqual({
        start: 225,
        end: 300, // 5:00 = 300 seconds
        title: 'Advanced Settings',
      });
      expect(chapters[3]).toEqual({
        start: 300,
        end: 390, // 6:30 = 390 seconds
        title: 'Conclusion and Next Steps',
      });
    });

    it('should return empty array when no chapters section exists', () => {
      const contextString = `## Video Content Overview

Just a simple video without chapters.
`;

      const chapters = parseChaptersFromContext(contextString);
      expect(chapters).toEqual([]);
    });

    it('should return empty array for empty string', () => {
      const chapters = parseChaptersFromContext('');
      expect(chapters).toEqual([]);
    });

    it('should handle chapters with different time formats', () => {
      const contextString = `## Video Chapters

1. [0:05 - 0:30] Quick intro
2. [10:00 - 15:30] Long section
`;

      const chapters = parseChaptersFromContext(contextString);

      expect(chapters).toHaveLength(2);
      expect(chapters[0]).toEqual({
        start: 5,
        end: 30,
        title: 'Quick intro',
      });
      expect(chapters[1]).toEqual({
        start: 600, // 10:00
        end: 930, // 15:30
        title: 'Long section',
      });
    });
  });

  describe('findChapterAtTimestamp', () => {
    const testChapters: VideoChapter[] = [
      { start: 0, end: 60, title: 'Chapter 1' },
      { start: 60, end: 120, title: 'Chapter 2' },
      { start: 120, end: 180, title: 'Chapter 3' },
    ];

    it('should find the correct chapter for a timestamp within range', () => {
      const chapter = findChapterAtTimestamp(testChapters, 30);
      expect(chapter?.title).toBe('Chapter 1');
    });

    it('should find the correct chapter at start boundary of next chapter', () => {
      // At exactly 60, we're at end of Chapter 1 (which ends at 60) - still in Chapter 1
      const chapter = findChapterAtTimestamp(testChapters, 60);
      expect(chapter?.title).toBe('Chapter 1');
    });

    it('should find the correct chapter just past boundary', () => {
      // At 61, we're in Chapter 2 (which starts at 60)
      const chapter = findChapterAtTimestamp(testChapters, 61);
      expect(chapter?.title).toBe('Chapter 2');
    });

    it('should find the correct chapter at end boundary', () => {
      // At 120, we're at end of Chapter 2 (which ends at 120) - still in Chapter 2
      const chapter = findChapterAtTimestamp(testChapters, 120);
      expect(chapter?.title).toBe('Chapter 2');
    });

    it('should find the correct chapter past last boundary', () => {
      // At 121, we're in Chapter 3 (which starts at 120)
      const chapter = findChapterAtTimestamp(testChapters, 121);
      expect(chapter?.title).toBe('Chapter 3');
    });

    it('should return closest chapter for timestamp beyond last chapter', () => {
      const chapter = findChapterAtTimestamp(testChapters, 200);
      expect(chapter?.title).toBe('Chapter 3');
    });

    it('should return first chapter for empty chapters array', () => {
      const chapter = findChapterAtTimestamp([], 30);
      expect(chapter).toBeNull();
    });

    it('should return first chapter for very early timestamp', () => {
      const chapter = findChapterAtTimestamp(testChapters, 0);
      expect(chapter?.title).toBe('Chapter 1');
    });
  });

  describe('formatTime', () => {
    it('should format zero seconds correctly', () => {
      expect(formatTime(0)).toBe('0:00');
    });

    it('should format seconds under a minute', () => {
      expect(formatTime(45)).toBe('0:45');
    });

    it('should format exactly one minute', () => {
      expect(formatTime(60)).toBe('1:00');
    });

    it('should format minutes and seconds', () => {
      expect(formatTime(125)).toBe('2:05');
    });

    it('should pad single digit seconds', () => {
      expect(formatTime(65)).toBe('1:05');
    });

    it('should handle large timestamps', () => {
      expect(formatTime(3661)).toBe('61:01');
    });

    it('should handle decimal seconds by flooring', () => {
      expect(formatTime(90.7)).toBe('1:30');
    });
  });

  describe('buildVideoContextDescription', () => {
    it('should build description for video being watched', () => {
      const info: VideoContextInfo = {
        currentTimestamp: 45,
        formattedTime: '0:45',
        currentChapter: null,
        chapterDescription: '',
        videoTitle: 'Product Demo',
        isPaused: false,
      };

      const description = buildVideoContextDescription(info);
      expect(description).toBe('User is watching "Product Demo" at 0:45');
    });

    it('should build description for paused video', () => {
      const info: VideoContextInfo = {
        currentTimestamp: 90,
        formattedTime: '1:30',
        currentChapter: null,
        chapterDescription: '',
        videoTitle: 'Tutorial Video',
        isPaused: true,
      };

      const description = buildVideoContextDescription(info);
      expect(description).toBe('User is paused "Tutorial Video" at 1:30');
    });

    it('should include chapter info when available', () => {
      const info: VideoContextInfo = {
        currentTimestamp: 90,
        formattedTime: '1:30',
        currentChapter: { start: 60, end: 120, title: 'Feature Walkthrough' },
        chapterDescription: '',
        videoTitle: 'Product Demo',
        isPaused: false,
      };

      const description = buildVideoContextDescription(info);
      expect(description).toBe(
        'User is watching "Product Demo" at 1:30. Currently viewing: "Feature Walkthrough"'
      );
    });
  });

  describe('createVideoContextMessage', () => {
    it('should create a complete message payload', () => {
      const info: VideoContextInfo = {
        currentTimestamp: 90,
        formattedTime: '1:30',
        currentChapter: { start: 60, end: 120, title: 'Feature Walkthrough' },
        chapterDescription: '',
        videoTitle: 'Product Demo',
        isPaused: false,
      };

      const message = createVideoContextMessage(info);

      expect(message).toEqual({
        type: 'video_context_update',
        video_title: 'Product Demo',
        timestamp: 90,
        formatted_time: '1:30',
        is_paused: false,
        current_chapter: {
          title: 'Feature Walkthrough',
          start: 60,
          end: 120,
        },
        description: 'User is watching "Product Demo" at 1:30. Currently viewing: "Feature Walkthrough"',
      });
    });

    it('should handle null chapter', () => {
      const info: VideoContextInfo = {
        currentTimestamp: 30,
        formattedTime: '0:30',
        currentChapter: null,
        chapterDescription: '',
        videoTitle: 'Short Clip',
        isPaused: true,
      };

      const message = createVideoContextMessage(info);

      expect(message).toEqual({
        type: 'video_context_update',
        video_title: 'Short Clip',
        timestamp: 30,
        formatted_time: '0:30',
        is_paused: true,
        current_chapter: null,
        description: 'User is paused "Short Clip" at 0:30',
      });
    });
  });

  describe('Integration: Parse and Find Chapter', () => {
    it('should parse chapters and find correct chapter at timestamp', () => {
      const contextString = `## Video Chapters

1. [0:00 - 2:00] Welcome
2. [2:00 - 5:00] Main Content
3. [5:00 - 7:00] Summary
`;

      const chapters = parseChaptersFromContext(contextString);

      // At 30 seconds, should be in "Welcome"
      expect(findChapterAtTimestamp(chapters, 30)?.title).toBe('Welcome');

      // At 3 minutes (180 seconds), should be in "Main Content"
      expect(findChapterAtTimestamp(chapters, 180)?.title).toBe('Main Content');

      // At 6 minutes (360 seconds), should be in "Summary"
      expect(findChapterAtTimestamp(chapters, 360)?.title).toBe('Summary');
    });
  });
});
