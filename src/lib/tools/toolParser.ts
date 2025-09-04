export type ToolParseResult = {
  toolName: string | null;
  toolArgs: any | null;
};

/**
 * Extracts tool call name and args from a Tavus event.
 * Mirrors the Hybrid Listener logic used in the webhook route.
 */
// Canonical tool names supported by the client UI
const CANONICAL_TOOLS = ['fetch_video', 'pause_video', 'play_video', 'next_video', 'close_video', 'show_trial_cta'] as const;

// Map short/alias command names to canonical tool names
function canonicalizeShortToolName(name: string | null | undefined): string | null {
  if (!name || typeof name !== 'string') return null;
  const n = name.trim().toLowerCase();
  if (n === 'pause' || n === 'pause_video' || n === 'hold' || n === 'hold on' || n === 'pause the video' || n === 'pause video') {
    return 'pause_video';
  }
  if (n === 'resume' || n === 'play' || n === 'play_video' || n === 'continue' || n === 'unpause' || n === 'start' || n === 'start video' || n === 'resume video' || n === 'play the video' || n === 'play video') {
    return 'play_video';
  }
  if (n === 'next' || n === 'next_video' || n === 'skip' || n === 'skip video' || n === 'next video') {
    return 'next_video';
  }
  if (n === 'close' || n === 'close_video' || n === 'exit' || n === 'stop' || n === 'stop video' || n === 'end video' || n === 'hide video' || n === 'close the video' || n === 'close video') {
    return 'close_video';
  }
  return null;
}

// Attempt to map a spoken utterance (free text) directly to a canonical tool
function mapUtteranceToCanonicalTool(speech: string | null | undefined): string | null {
  if (!speech || typeof speech !== 'string') return null;
  const text = speech.trim().toLowerCase().replace(/[.!?]+$/g, '').replace(/\s+/g, ' ');

  // 1) Exact match to known short/alias names
  const direct = canonicalizeShortToolName(text);
  if (direct) return direct;

  // 2) Guard against explicit negations to avoid accidental triggers
  const hasNegation = /\b(don't|do not|dont|no)\s+(pause|close|stop|end|hide|play|resume|continue|start|next|skip)\b/.test(text);
  if (hasNegation) return null;

  // 3) Keyword-based detection within longer utterances
  // Pause: allow generic "pause" or "hold on" without requiring the word "video"
  if (/\b(pause|hold(?:\s+on)?)\b/.test(text)) {
    return 'pause_video';
  }
  // Play/Resume
  if (/\b(resume|play|continue|unpause|start)(?:\s+(?:the\s+)?video)?\b/.test(text)) {
    return 'play_video';
  }
  // Next/Skip
  if (/\b(next|skip)(?:\s+(?:the\s+)?video)?\b/.test(text)) {
    return 'next_video';
  }
  // Close/Exit require explicit video context for generic verbs like stop/end/hide
  if (/\b(close|exit)\b(?:.*\bvideo\b)?/.test(text) || /\b(stop|end|hide)\b\s+(?:the\s+)?video\b/.test(text)) {
    return 'close_video';
  }

  return null;
}

// Extract a title-like value from various argument shapes
function extractTitleFromArgs(args: any): string | null {
  if (!args) return null;
  if (typeof args === 'string') return args;
  if (typeof args === 'object') {
    const t = args.title ?? args.video_title ?? args.videoName ?? args.video_name;
    return typeof t === 'string' ? t : null;
  }
  return null;
}

// If the provided title actually encodes a control command (e.g. "pause"),
// convert it to the appropriate no-arg tool.
function canonicalFromTitleIfCommand(title: string | null | undefined): string | null {
  if (!title || typeof title !== 'string') return null;
  // Normalize and strip quotes/punctuation
  let normalized = title.trim().replace(/^['"]|['"]$/g, '').toLowerCase();
  normalized = normalized.replace(/[.!?]+$/g, '').replace(/\s+/g, ' ');

  // Remove common politeness/filler words while preserving intent
  const polite = /\b(please|kindly|can you|could you|would you|will you|the|this|that)\b/g;
  const sanitized = normalized.replace(polite, ' ').replace(/\s+/g, ' ').trim();

  // Try exact canonicalization first, then keyword-based utterance mapping
  return canonicalizeShortToolName(sanitized) || mapUtteranceToCanonicalTool(sanitized);
}

export function parseToolCallFromEvent(event: any): ToolParseResult {
  // Match a function call anywhere in the string, e.g. "... text ... fetch_video(\"Title\") ..."
  const TOOL_CALL_REGEX = /\b([a-zA-Z_]+)\s*\(([^)]*)\)/;
  const KNOWN_TOOLS = ['fetch_video', 'pause_video', 'play_video', 'next_video', 'close_video', 'show_trial_cta'];
  const NO_ARG_TOOLS = ['pause_video', 'play_video', 'next_video', 'close_video', 'show_trial_cta'];

  let toolName: string | null = null;
  let toolArgs: any | null = null;

  if (!event) return { toolName, toolArgs };

  const eventTypeRaw = event.event_type || event.type || event.data?.event_type || event.data?.type;
  // Normalize: lowercase and replace both dots and hyphens with underscores
  const eventType = typeof eventTypeRaw === 'string' ? eventTypeRaw.toLowerCase() : '';
  const normalizedType = eventType.replace(/[.\-]/g, '_');

  // Treat any variant that contains "tool_call" as a tool call event
  if (
    normalizedType === 'conversation_toolcall' ||
    normalizedType === 'conversation_tool_call' ||
    normalizedType === 'tool_call' ||
    normalizedType.endsWith('_toolcall') ||
    normalizedType.endsWith('_tool_call') ||
    normalizedType.includes('tool_call')
  ) {
    // Prefer nested function fields if present
    toolName = event.data?.name
      ?? event.data?.function?.name
      ?? event.name
      ?? event.function?.name
      ?? event.data?.properties?.name
      ?? event.data?.properties?.function?.name
      ?? event.properties?.name
      ?? event.properties?.function?.name
      ?? null;

    let rawArgs = event.data?.args
      ?? event.data?.arguments
      ?? event.data?.function?.arguments
      ?? event.args
      ?? event.arguments
      ?? event.function?.arguments
      ?? event.data?.properties?.args
      ?? event.data?.properties?.arguments
      ?? event.data?.properties?.function?.arguments
      ?? event.properties?.args
      ?? event.properties?.arguments
      ?? event.properties?.function?.arguments
      ?? null;

    if (typeof rawArgs === 'string') {
      try {
        const parsed = JSON.parse(rawArgs);
        if (typeof parsed === 'string') {
          // Normalize string args to an object with title
          toolArgs = { title: parsed.replace(/^["']|["']$/g, '') };
        } else if (parsed && typeof parsed === 'object') {
          // Preserve original object shape
          toolArgs = parsed;
        } else {
          toolArgs = null;
        }
      } catch {
        // Be tolerant of non-JSON argument strings, similar to transcript fallback
        const s = rawArgs.trim();
        // Case 1: quoted single argument string
        const singleArg = s.match(/^["'](.+?)["']$/);
        if (singleArg) {
          toolArgs = { title: singleArg[1] };
        } else {
          // Case 2: key:value with quotes around value
          const kv = s.match(/(?:title|video_title|videoName|video_name)\s*[:=]\s*["'](.+?)["']/i);
          if (kv) {
            toolArgs = { title: kv[1] };
          } else {
            // Case 3: bare string without quotes (e.g., Strategic Planning)
            toolArgs = { title: s };
          }
        }
      }
    } else if (rawArgs && typeof rawArgs === 'object') {
      // Preserve original object shape
      toolArgs = rawArgs;
    } else {
      toolArgs = rawArgs ?? null;
    }

    // Normalize short/alias function names to canonical tools ONLY if the provided name is not already a known tool.
    // This preserves legacy behavior where official no-arg tools like "pause_video" yield null args in this event type.
    if (typeof toolName === 'string' && !KNOWN_TOOLS.includes(toolName)) {
      const canonicalTool = canonicalizeShortToolName(toolName);
      if (canonicalTool) {
        return { toolName: canonicalTool, toolArgs: {} };
      }
    }

    // If fetch_video was called but the "title" is actually a command, remap to the appropriate control tool
    if (toolName === 'fetch_video') {
      const t = extractTitleFromArgs(toolArgs);
      const controlTool = canonicalFromTitleIfCommand(t);
      if (controlTool) {
        return { toolName: controlTool, toolArgs: {} };
      }
    }
    return { toolName, toolArgs };
  }

  // Many shapes exist, e.g. application_transcription_ready, application_transcription_delta, etc.
  if (normalizedType === 'application_transcription_ready' || normalizedType.includes('transcription')) {
    const transcript = event.data?.transcript || [];
    const assistantMessages = transcript.filter((msg: any) => msg.role === 'assistant' && msg.tool_calls);
    if (assistantMessages.length > 0) {
      const lastToolCallMsg = assistantMessages[assistantMessages.length - 1];
      if (lastToolCallMsg.tool_calls?.length > 0) {
        const toolCall = lastToolCallMsg.tool_calls[0];
        const name = toolCall.function?.name;
        // Normalize short/alias names first
        const canonical = canonicalizeShortToolName(name);
        const effectiveName = canonical ?? name;
        if (typeof effectiveName === 'string' && KNOWN_TOOLS.includes(effectiveName)) {
          toolName = effectiveName;
          try {
            const parsed = JSON.parse(toolCall.function.arguments || '{}');
            if (typeof parsed === 'string') {
              toolArgs = { title: parsed.replace(/^["']|["']$/g, '') };
            } else if (parsed && typeof parsed === 'object') {
              toolArgs = parsed;
            } else {
              toolArgs = NO_ARG_TOOLS.includes(effectiveName) ? {} : null;
            }
          } catch {
            // Be tolerant of non-JSON arguments occasionally emitted in transcripts.
            // Examples we want to support:
            //   "Strategic Planning"
            //   'Strategic Planning'
            //   title:"Strategic Planning"
            //   video_title:'Strategic Planning'
            const raw = toolCall.function?.arguments;
            if (typeof raw === 'string') {
              const s = raw.trim();
              // Case 1: single quoted string only
              const singleArg = s.match(/^["'](.+?)["']$/);
              if (singleArg) {
                toolArgs = { title: singleArg[1] };
              } else {
                // Case 2: key:value with quotes around value
                const kv = s.match(/(?:title|video_title|videoName|video_name)\s*[:=]\s*["'](.+?)["']/i);
                if (kv) {
                  toolArgs = { title: kv[1] };
                } else {
                  toolArgs = NO_ARG_TOOLS.includes(effectiveName) ? {} : null;
                }
              }
            } else {
              toolArgs = NO_ARG_TOOLS.includes(effectiveName) ? {} : null;
            }
          }
          // If fetch_video was called with a command-like title, remap to control tool
          if (toolName === 'fetch_video') {
            const t = extractTitleFromArgs(toolArgs);
            const controlTool = canonicalFromTitleIfCommand(t);
            if (controlTool) {
              return { toolName: controlTool, toolArgs: {} };
            }
          }
          return { toolName, toolArgs };
        }
      }
    }
    return { toolName, toolArgs };
  }

  // Utterance variants: conversation_utterance, application_utterance_created/delta/final, etc.
  if (normalizedType === 'conversation_utterance' || normalizedType === 'utterance' || normalizedType.includes('utterance')) {
    const TEXT_FALLBACK_ENABLED = (
      (typeof process.env.NEXT_PUBLIC_TAVUS_TOOLCALL_TEXT_FALLBACK === 'string' &&
        process.env.NEXT_PUBLIC_TAVUS_TOOLCALL_TEXT_FALLBACK.toLowerCase() === 'true') ||
      process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true'
    );
    if (!TEXT_FALLBACK_ENABLED) {
      try {
        // Helps surface why voice parsing didn't trigger in dev
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[toolParser] Text fallback disabled. Set NEXT_PUBLIC_TAVUS_TOOLCALL_TEXT_FALLBACK=true (or NEXT_PUBLIC_E2E_TEST_MODE=true) to parse tool calls from assistant speech.');
        }
      } catch {}
      return { toolName, toolArgs };
    }
    const speech = event.data?.speech
      || event.data?.properties?.speech
      || event.speech
      || event.properties?.speech
      || '';

    if (KNOWN_TOOLS.includes(speech)) {
      toolName = speech;
      toolArgs = {};
      return { toolName, toolArgs };
    }

    // Direct mapping from natural language commands (no function syntax)
    const directTool = mapUtteranceToCanonicalTool(speech);
    if (directTool) {
      return { toolName: directTool, toolArgs: {} };
    }

    const match = speech.match(TOOL_CALL_REGEX);
    if (match) {
      toolName = match[1];
      const argsString = match[2];
      try {
        const parsed = JSON.parse(argsString);
        if (typeof parsed === 'string') {
          toolArgs = { title: parsed.replace(/^["']|["']$/g, '') };
        } else if (parsed && typeof parsed === 'object') {
          // Preserve original object shape
          toolArgs = parsed;
        } else {
          toolArgs = null;
        }
      } catch {
        const cleaned = argsString.trim();
        if (toolName === 'fetch_video') {
          toolArgs = { title: cleaned.replace(/["']/g, '') };
        } else if (toolName && NO_ARG_TOOLS.includes(toolName)) {
          toolArgs = {};
        } else {
          toolArgs = { arg: cleaned };
        }
      }
      // Normalize short/alias names like pause(), resume(), next(), close()
      const canonicalTool = canonicalizeShortToolName(toolName);
      if (canonicalTool) {
        return { toolName: canonicalTool, toolArgs: {} };
      }
      // If fetch_video(...) provided a command-like string, convert to control tool
      if (toolName === 'fetch_video') {
        const t = extractTitleFromArgs(toolArgs);
        const controlTool = canonicalFromTitleIfCommand(t);
        if (controlTool) {
          return { toolName: controlTool, toolArgs: {} };
        }
      }
      return { toolName, toolArgs };
    }

    return { toolName, toolArgs };
  }

  // Unhandled event types
  return { toolName, toolArgs };
}
