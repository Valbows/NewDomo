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
  const KNOWN_TOOLS = ['fetch_video', 'show_trial_cta'];

  let toolName: string | null = null;
  let toolArgs: any | null = null;

  if (!event) return { toolName, toolArgs };

  const eventTypeRaw = event.event_type || event.type;
  const eventType = typeof eventTypeRaw === 'string' ? eventTypeRaw : '';
  const normalizedType = eventType.replace(/\./g, '_');

  if (normalizedType === 'conversation_toolcall' || normalizedType === 'tool_call') {
    // Prefer nested function fields if present
    toolName = event.data?.name
      ?? event.data?.function?.name
      ?? event.name
      ?? event.function?.name
      ?? null;

    let rawArgs = event.data?.args
      ?? event.data?.arguments
      ?? event.data?.function?.arguments
      ?? event.args
      ?? event.arguments
      ?? event.function?.arguments
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
        // Only return null when JSON fails; caller can ignore gracefully
        toolArgs = null;
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
        if (toolCall.function?.name === 'fetch_video') {
          toolName = 'fetch_video';
          try {
            const args = JSON.parse(toolCall.function.arguments);
            toolArgs = args;
          } catch {
            // If arguments cannot be parsed, do not assume a default title.
            // Returning null args allows callers to ignore or request clarification.
            toolArgs = null;
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
