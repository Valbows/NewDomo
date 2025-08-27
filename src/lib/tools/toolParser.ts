export type ToolParseResult = {
  toolName: string | null;
  toolArgs: any | null;
};

/**
 * Extracts tool call name and args from a Tavus event.
 * Mirrors the Hybrid Listener logic used in the webhook route.
 */
export function parseToolCallFromEvent(event: any): ToolParseResult {
  // Match a function call anywhere in the string, e.g. "... text ... fetch_video(\"Title\") ..."
  const TOOL_CALL_REGEX = /\b([a-zA-Z_]+)\s*\(([^)]*)\)/;
  const KNOWN_TOOLS = ['fetch_video', 'pause_video', 'play_video', 'next_video', 'close_video', 'show_trial_cta'];
  const NO_ARG_TOOLS = ['pause_video', 'play_video', 'next_video', 'close_video', 'show_trial_cta'];

  let toolName: string | null = null;
  let toolArgs: any | null = null;

  if (!event) return { toolName, toolArgs };

  const eventTypeRaw = event.event_type || event.type || event.data?.event_type || event.data?.type;
  const eventType = typeof eventTypeRaw === 'string' ? eventTypeRaw : '';
  const normalizedType = eventType.replace(/\./g, '_');

  if (normalizedType === 'conversation_toolcall' || normalizedType === 'conversation_tool_call' || normalizedType === 'tool_call') {
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
    return { toolName, toolArgs };
  }

  if (normalizedType === 'application_transcription_ready') {
    const transcript = event.data?.transcript || [];
    const assistantMessages = transcript.filter((msg: any) => msg.role === 'assistant' && msg.tool_calls);
    if (assistantMessages.length > 0) {
      const lastToolCallMsg = assistantMessages[assistantMessages.length - 1];
      if (lastToolCallMsg.tool_calls?.length > 0) {
        const toolCall = lastToolCallMsg.tool_calls[0];
        const name = toolCall.function?.name;
        if (typeof name === 'string' && KNOWN_TOOLS.includes(name)) {
          toolName = name;
          try {
            const parsed = JSON.parse(toolCall.function.arguments || '{}');
            if (typeof parsed === 'string') {
              toolArgs = { title: parsed.replace(/^["']|["']$/g, '') };
            } else if (parsed && typeof parsed === 'object') {
              toolArgs = parsed;
            } else {
              toolArgs = NO_ARG_TOOLS.includes(name) ? {} : null;
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
                  toolArgs = NO_ARG_TOOLS.includes(name) ? {} : null;
                }
              }
            } else {
              toolArgs = NO_ARG_TOOLS.includes(name) ? {} : null;
            }
          }
          return { toolName, toolArgs };
        }
      }
    }
    return { toolName, toolArgs };
  }

  if (normalizedType === 'conversation_utterance' || normalizedType === 'utterance') {
    const TEXT_FALLBACK_ENABLED = process.env.NEXT_PUBLIC_TAVUS_TOOLCALL_TEXT_FALLBACK === 'true';
    if (!TEXT_FALLBACK_ENABLED) {
      try {
        // Helps surface why voice parsing didn't trigger in dev
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[toolParser] Text fallback disabled. Set NEXT_PUBLIC_TAVUS_TOOLCALL_TEXT_FALLBACK=true to parse tool calls from assistant speech.');
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
      return { toolName, toolArgs };
    }

    return { toolName, toolArgs };
  }

  // Unhandled event types
  return { toolName, toolArgs };
}
