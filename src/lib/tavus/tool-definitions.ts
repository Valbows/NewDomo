/**
 * Tool Definitions for Tavus CVI
 * These tools are made available to the AI agent during conversations
 */

export interface TavusTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, {
        type: string;
        description: string;
        enum?: string[];
      }>;
      required?: string[];
    };
  };
}

/**
 * Video playback tools for demo presentations
 */
export const VIDEO_TOOLS: TavusTool[] = [
  {
    type: 'function',
    function: {
      name: 'fetch_video',
      description: 'Display and play a demo video by title. Use this to show product videos during the demo.',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'The exact title of the video to fetch and display',
          },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'pause_video',
      description: 'Pause the currently playing video',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'play_video',
      description: 'Resume playing a paused video',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'close_video',
      description: 'Close the video player and return to the conversation',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
];

/**
 * CTA (Call-to-Action) tools
 */
export const CTA_TOOLS: TavusTool[] = [
  {
    type: 'function',
    function: {
      name: 'show_trial_cta',
      description: 'Display the trial signup call-to-action banner to the user',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
];

/**
 * All available tools for Domo AI agents
 */
export const DOMO_AI_TOOLS: TavusTool[] = [
  ...VIDEO_TOOLS,
  ...CTA_TOOLS,
];

/**
 * Get tools with video titles populated from database
 * This creates a dynamic enum of available video titles
 */
export function getToolsWithVideoTitles(videoTitles: string[]): TavusTool[] {
  const dynamicFetchVideo: TavusTool = {
    type: 'function',
    function: {
      name: 'fetch_video',
      description: 'Display and play a demo video by title. Use this to show product videos during the demo.',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'The exact title of the video to fetch and display',
            ...(videoTitles.length > 0 ? { enum: videoTitles } : {}),
          },
        },
        required: ['title'],
      },
    },
  };

  return [
    dynamicFetchVideo,
    ...VIDEO_TOOLS.filter(t => t.function.name !== 'fetch_video'),
    ...CTA_TOOLS,
  ];
}
