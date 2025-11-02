/**
 * Tool Parsing Utilities
 * Core parsing logic for extracting tool calls from various event formats
 * 
 * This module contains the core parsing logic for extracting tool calls
 * from different Tavus webhook event types. It handles the complexity of
 * different event structures and argument formats.
 * 
 * @example
 * ```typescript
 * import { parseToolCallEvent, parseUtteranceEvent } from './tool-parsing-utils';
 * 
 * // Parse a structured tool call event
 * const toolEvent = { data: { name: 'fetch_video', args: { title: 'Demo' } } };
 * const result = parseToolCallEvent(toolEvent);
 * 
 * // Parse natural language from utterance
 * const utteranceEvent = { data: { speech: 'pause the video' } };
 * const result2 = parseUtteranceEvent(utteranceEvent);
 * ```
 */

export type ToolParseResult = {
  toolName: string | null;
  toolArgs: any | null;
};

// Canonical tool names supported by the client UI
export const CANONICAL_TOOLS = [
  "fetch_video",
  "pause_video",
  "play_video",
  "next_video",
  "close_video",
  "show_trial_cta",
] as const;

export const KNOWN_TOOLS = [
  "fetch_video",
  "pause_video",
  "play_video",
  "next_video",
  "close_video",
  "show_trial_cta",
];

export const NO_ARG_TOOLS = [
  "pause_video",
  "play_video",
  "next_video",
  "close_video",
  "show_trial_cta",
];

// Match a function call anywhere in the string, e.g. "... text ... fetch_video(\"Title\") ..."
export const TOOL_CALL_REGEX = /\b([a-zA-Z_]+)\s*\(([^)]*)\)/;

/**
 * Parse tool call from tool call event type
 * 
 * Extracts tool name and arguments from structured tool call events.
 * Handles various nested structures and argument formats.
 * 
 * @param event - Tool call event object
 * @returns Parsed tool name and arguments
 * 
 * @example
 * ```typescript
 * const event = {
 *   data: {
 *     name: 'fetch_video',
 *     args: { title: 'Product Demo' }
 *   }
 * };
 * const result = parseToolCallEvent(event);
 * // Returns: { toolName: 'fetch_video', toolArgs: { title: 'Product Demo' } }
 * ```
 */
export function parseToolCallEvent(event: any): ToolParseResult {
  let toolName: string | null = null;
  let toolArgs: any | null = null;

  // Prefer nested function fields if present
  toolName =
    event.data?.name ??
    event.data?.function?.name ??
    event.name ??
    event.function?.name ??
    event.data?.properties?.name ??
    event.data?.properties?.function?.name ??
    event.properties?.name ??
    event.properties?.function?.name ??
    null;

  let rawArgs =
    event.data?.args ??
    event.data?.arguments ??
    event.data?.function?.arguments ??
    event.args ??
    event.arguments ??
    event.function?.arguments ??
    event.data?.properties?.args ??
    event.data?.properties?.arguments ??
    event.data?.properties?.function?.arguments ??
    event.properties?.args ??
    event.properties?.arguments ??
    event.properties?.function?.arguments ??
    null;

  if (typeof rawArgs === "string") {
    toolArgs = parseStringArguments(rawArgs);
  } else if (rawArgs && typeof rawArgs === "object") {
    // Preserve original object shape
    toolArgs = rawArgs;
  } else {
    toolArgs = rawArgs ?? null;
  }

  return { toolName, toolArgs };
}

/**
 * Parse tool call from transcription event
 * 
 * Extracts tool calls from transcription events by analyzing the
 * transcript for assistant messages with tool_calls.
 * 
 * @param event - Transcription event object
 * @returns Parsed tool name and arguments
 * 
 * @example
 * ```typescript
 * const event = {
 *   data: {
 *     transcript: [{
 *       role: 'assistant',
 *       tool_calls: [{
 *         function: {
 *           name: 'fetch_video',
 *           arguments: '{"title": "Demo Video"}'
 *         }
 *       }]
 *     }]
 *   }
 * };
 * const result = parseTranscriptionEvent(event);
 * // Returns: { toolName: 'fetch_video', toolArgs: { title: 'Demo Video' } }
 * ```
 */
export function parseTranscriptionEvent(event: any): ToolParseResult {
  let toolName: string | null = null;
  let toolArgs: any | null = null;

  const transcript = event.data?.transcript || [];
  const assistantMessages = transcript.filter(
    (msg: any) => msg.role === "assistant" && msg.tool_calls
  );

  if (assistantMessages.length > 0) {
    const lastToolCallMsg = assistantMessages[assistantMessages.length - 1];
    if (lastToolCallMsg.tool_calls?.length > 0) {
      const toolCall = lastToolCallMsg.tool_calls[0];
      const name = toolCall.function?.name;
      
      if (typeof name === "string" && KNOWN_TOOLS.includes(name)) {
        toolName = name;
        try {
          const parsed = JSON.parse(toolCall.function.arguments || "{}");
          if (typeof parsed === "string") {
            toolArgs = { title: parsed.replace(/^[&quot;']|[&quot;']$/g, "") };
          } else if (parsed && typeof parsed === "object") {
            toolArgs = parsed;
          } else {
            toolArgs = NO_ARG_TOOLS.includes(name) ? {} : null;
          }
        } catch {
          toolArgs = parseNonJsonArguments(toolCall.function?.arguments, name);
        }
      }
    }
  }

  return { toolName, toolArgs };
}

/**
 * Parse tool call from utterance event
 * 
 * Extracts tool calls from natural language utterances by analyzing
 * speech patterns and matching against known commands.
 * 
 * @param event - Utterance event object
 * @returns Parsed tool name and arguments
 * 
 * @example
 * ```typescript
 * const event = {
 *   data: {
 *     speech: 'pause the video'
 *   }
 * };
 * const result = parseUtteranceEvent(event);
 * // Returns: { toolName: 'pause_video', toolArgs: {} }
 * 
 * // Function call syntax in speech
 * const event2 = {
 *   data: {
 *     speech: 'fetch_video("Product Demo")'
 *   }
 * };
 * const result2 = parseUtteranceEvent(event2);
 * // Returns: { toolName: 'fetch_video', toolArgs: { title: 'Product Demo' } }
 * ```
 */
export function parseUtteranceEvent(event: any): ToolParseResult {
  let toolName: string | null = null;
  let toolArgs: any | null = null;

  const TEXT_FALLBACK_ENABLED =
    (typeof process.env.NEXT_PUBLIC_TAVUS_TOOLCALL_TEXT_FALLBACK === "string" &&
      process.env.NEXT_PUBLIC_TAVUS_TOOLCALL_TEXT_FALLBACK.toLowerCase() === "true") ||
    process.env.NEXT_PUBLIC_E2E_TEST_MODE === "true";

  if (!TEXT_FALLBACK_ENABLED) {
    try {
      // Helps surface why voice parsing didn't trigger in dev
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          "[toolParser] Text fallback disabled. Set NEXT_PUBLIC_TAVUS_TOOLCALL_TEXT_FALLBACK=true (or NEXT_PUBLIC_E2E_TEST_MODE=true) to parse tool calls from assistant speech."
        );
      }
    } catch {}
    return { toolName, toolArgs };
  }

  const speech =
    event.data?.speech ||
    event.data?.properties?.speech ||
    event.speech ||
    event.properties?.speech ||
    "";

  if (KNOWN_TOOLS.includes(speech)) {
    toolName = speech;
    toolArgs = {};
    return { toolName, toolArgs };
  }

  const match = speech.match(TOOL_CALL_REGEX);
  if (match) {
    toolName = match[1];
    const argsString = match[2];
    toolArgs = parseStringArguments(argsString, toolName || undefined);
  }

  return { toolName, toolArgs };
}

/**
 * Parse string arguments into structured format
 */
function parseStringArguments(rawArgs: string, toolName?: string): any {
  try {
    const parsed = JSON.parse(rawArgs);
    if (typeof parsed === "string") {
      // Normalize string args to an object with title
      return { title: parsed.replace(/^[&quot;']|[&quot;']$/g, "") };
    } else if (parsed && typeof parsed === "object") {
      // Preserve original object shape
      return parsed;
    } else {
      return null;
    }
  } catch {
    // Be tolerant of non-JSON argument strings
    const s = rawArgs.trim();
    // Case 1: quoted single argument string
    const singleArg = s.match(/^[&quot;'](.+?)[&quot;']$/);
    if (singleArg) {
      return { title: singleArg[1] };
    } else {
      // Case 2: key:value with quotes around value
      const kv = s.match(
        /(?:title|video_title|videoName|video_name)\s*[:=]\s*[&quot;'](.+?)[&quot;']/i
      );
      if (kv) {
        return { title: kv[1] };
      } else {
        // Case 3: bare string without quotes (e.g., Strategic Planning)
        return { title: s };
      }
    }
  }
}

/**
 * Parse non-JSON arguments from transcription
 */
function parseNonJsonArguments(raw: any, toolName: string): any {
  if (typeof raw === "string") {
    const s = raw.trim();
    // Case 1: single quoted string only
    const singleArg = s.match(/^[&quot;'](.+?)[&quot;']$/);
    if (singleArg) {
      return { title: singleArg[1] };
    } else {
      // Case 2: key:value with quotes around value
      const kv = s.match(
        /(?:title|video_title|videoName|video_name)\s*[:=]\s*[&quot;'](.+?)[&quot;']/i
      );
      if (kv) {
        return { title: kv[1] };
      } else {
        return NO_ARG_TOOLS.includes(toolName) ? {} : null;
      }
    }
  } else {
    return NO_ARG_TOOLS.includes(toolName) ? {} : null;
  }
}

/**
 * Extract a title-like value from various argument shapes
 * 
 * Normalizes different argument formats to extract a title value.
 * Handles string arguments, objects with various title properties.
 * 
 * @param args - Arguments object or string
 * @returns Extracted title string or null if not found
 * 
 * @example
 * ```typescript
 * // String argument
 * extractTitleFromArgs('Product Demo'); // Returns: 'Product Demo'
 * 
 * // Object with title property
 * extractTitleFromArgs({ title: 'Demo Video' }); // Returns: 'Demo Video'
 * 
 * // Object with alternative property names
 * extractTitleFromArgs({ video_title: 'Tutorial' }); // Returns: 'Tutorial'
 * extractTitleFromArgs({ videoName: 'Overview' }); // Returns: 'Overview'
 * 
 * // No title found
 * extractTitleFromArgs({ id: 123 }); // Returns: null
 * ```
 */
export function extractTitleFromArgs(args: any): string | null {
  if (!args) return null;
  if (typeof args === "string") return args;
  if (typeof args === "object") {
    const t =
      args.title ?? args.video_title ?? args.videoName ?? args.video_name;
    return typeof t === "string" ? t : null;
  }
  return null;
}