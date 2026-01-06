/**
 * Twelve Labs Video Understanding Integration
 *
 * This module provides video indexing and AI-powered video understanding
 * capabilities for Domo demos.
 */

const TWELVE_LABS_API_KEY = process.env.TWELVE_LABS_API_KEY || '';
const TWELVE_LABS_BASE_URL = 'https://api.twelvelabs.io/v1.3';

// Index name for Domo demo videos
const DOMO_INDEX_NAME = 'domo-demo-videos';

export interface VideoIndexResult {
  indexId: string;
  videoId: string;
  taskId: string;
  status: 'pending' | 'indexing' | 'ready' | 'failed';
}

export interface VideoSearchResult {
  start: number;
  end: number;
  confidence: number;
  text?: string;
  thumbnailUrl?: string;
}

export interface VideoContext {
  timestamp: { start: number; end: number };
  description: string;
  confidence: number;
}

/**
 * Make an authenticated request to the Twelve Labs API
 */
async function apiRequest(
  endpoint: string,
  method: 'GET' | 'POST' | 'DELETE' = 'GET',
  body?: any
): Promise<any> {
  const url = `${TWELVE_LABS_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: {
      'x-api-key': TWELVE_LABS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[TwelveLabs] API Error: ${response.status} - ${errorText}`);
    throw new Error(`Twelve Labs API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Get or create the Domo index for storing video embeddings
 */
export async function getOrCreateIndex(): Promise<string> {
  try {
    // List existing indexes to find our Domo index
    const indexesResponse = await apiRequest('/indexes');
    const existingIndex = indexesResponse.data?.find((idx: any) => idx.index_name === DOMO_INDEX_NAME);

    if (existingIndex) {
      return existingIndex._id;
    }

    // Create a new index if it doesn't exist
    const newIndex = await apiRequest('/indexes', 'POST', {
      index_name: DOMO_INDEX_NAME,
      models: [
        {
          model_name: 'marengo3.0',
          model_options: ['visual', 'audio'],
        },
        {
          model_name: 'pegasus1.2',
          model_options: ['visual', 'audio'],
        },
      ],
    });

    return newIndex._id;
  } catch (error) {
    console.error('[TwelveLabs] Error getting/creating index:', error);
    throw error;
  }
}

/**
 * Index a video from a URL
 * This should be called when a user uploads a demo video
 */
export async function indexVideo(
  videoUrl: string,
  videoTitle?: string
): Promise<VideoIndexResult> {
  try {
    const indexId = await getOrCreateIndex();

    // Create a task to index the video
    const task = await apiRequest('/tasks', 'POST', {
      index_id: indexId,
      video_url: videoUrl,
    });

    return {
      indexId,
      videoId: task.video_id || '',
      taskId: task._id,
      status: 'indexing',
    };
  } catch (error) {
    console.error('[TwelveLabs] Error indexing video:', error);
    throw error;
  }
}

/**
 * Check the status of a video indexing task
 */
export async function getIndexingStatus(taskId: string): Promise<string> {
  try {
    const task = await apiRequest(`/tasks/${taskId}`);
    return task.status || 'unknown';
  } catch (error) {
    console.error('[TwelveLabs] Error checking task status:', error);
    throw error;
  }
}

/**
 * Wait for a video to finish indexing (with timeout)
 */
export async function waitForIndexing(
  taskId: string,
  timeoutMs: number = 600000 // 10 minutes default
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const status = await getIndexingStatus(taskId);

    if (status === 'ready') {
      return true;
    }

    if (status === 'failed') {
      throw new Error('Video indexing failed');
    }

    // Wait 5 seconds before checking again
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  throw new Error('Video indexing timed out');
}

/**
 * Search for content within indexed videos
 * Returns relevant timestamps and descriptions
 */
export async function searchVideo(
  query: string,
  indexId?: string,
  videoId?: string
): Promise<VideoSearchResult[]> {
  try {
    const targetIndexId = indexId || await getOrCreateIndex();

    const searchBody: any = {
      query_text: query,
      search_options: ['visual', 'conversation'],
    };

    // If specific video, filter to that video
    if (videoId) {
      searchBody.filter = { id: [videoId] };
    }

    const results = await apiRequest(`/indexes/${targetIndexId}/search`, 'POST', searchBody);

    return (results.data || []).map((result: any) => ({
      start: result.start || 0,
      end: result.end || 0,
      confidence: result.confidence || 0,
      text: result.metadata?.text || result.transcription,
      thumbnailUrl: result.thumbnail_url,
    }));
  } catch (error) {
    console.error('[TwelveLabs] Error searching video:', error);
    throw error;
  }
}

/**
 * Generate a complete summary of a video
 * Useful for giving the agent overall context
 */
export async function generateVideoSummary(videoId: string): Promise<string> {
  try {
    const result = await apiRequest('/summarize', 'POST', {
      video_id: videoId,
      type: 'summary',
      prompt: 'Provide a detailed summary of this demo video. Include the main features demonstrated, key UI elements shown, and the flow of the demonstration. Format as bullet points.',
    });

    return result.summary || 'Unable to generate summary';
  } catch (error) {
    console.error('[TwelveLabs] Error generating summary:', error);
    throw error;
  }
}

/**
 * Get chapter-like breakdown of a video
 * Returns segments with timestamps and descriptions
 */
export async function getVideoChapters(videoId: string): Promise<VideoContext[]> {
  try {
    const result = await apiRequest('/summarize', 'POST', {
      video_id: videoId,
      type: 'chapter',
    });

    // The chapter response contains chapters array
    if (result.chapters && Array.isArray(result.chapters)) {
      return result.chapters.map((chapter: any) => ({
        timestamp: { start: chapter.start || 0, end: chapter.end || 0 },
        description: chapter.chapter_title || chapter.chapter_summary || '',
        confidence: 1,
      }));
    }

    return [];
  } catch (error) {
    console.error('[TwelveLabs] Error getting video chapters:', error);
    return [];
  }
}

/**
 * Build context string for the AI agent
 * This combines video summary, chapters, and can be injected into agent prompts
 */
export async function buildAgentVideoContext(videoId: string): Promise<string> {
  try {
    const [summary, chapters] = await Promise.all([
      generateVideoSummary(videoId),
      getVideoChapters(videoId),
    ]);

    let context = `## Video Content Overview\n\n${summary}\n\n`;

    if (chapters.length > 0) {
      context += `## Video Chapters\n\n`;
      chapters.forEach((chapter, index) => {
        const startTime = formatTimestamp(chapter.timestamp.start);
        const endTime = formatTimestamp(chapter.timestamp.end);
        context += `${index + 1}. [${startTime} - ${endTime}] ${chapter.description}\n`;
      });
    }

    return context;
  } catch (error) {
    console.error('[TwelveLabs] Error building agent context:', error);
    return '';
  }
}

/**
 * Format seconds to MM:SS timestamp
 */
function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default {
  getOrCreateIndex,
  indexVideo,
  getIndexingStatus,
  waitForIndexing,
  searchVideo,
  generateVideoSummary,
  getVideoChapters,
  buildAgentVideoContext,
};
