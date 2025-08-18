export type ToolParseResult = {
  toolName: string | null;
  toolArgs: any | null;
};

/**
 * Extracts tool call name and args from a Tavus event.
 * Mirrors the Hybrid Listener logic used in the webhook route.
 */
export function parseToolCallFromEvent(event: any): ToolParseResult {
  const TOOL_CALL_REGEX = /^([a-zA-Z_]+)\((.*)\)$/;
  const KNOWN_TOOLS = ['fetch_video', 'show_trial_cta'];

  let toolName: string | null = null;
  let toolArgs: any | null = null;

  if (!event) return { toolName, toolArgs };

  const eventType = event.event_type || event.type;

  if (eventType === 'conversation_toolcall' || eventType === 'tool_call') {
    toolName = event.data?.name ?? null;
    toolArgs = event.data?.args ?? {};
    return { toolName, toolArgs };
  }

  if (eventType === 'application.transcription_ready') {
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
            toolArgs = { title: 'Fourth Video' };
          }
          return { toolName, toolArgs };
        }
      }
    }
    return { toolName, toolArgs };
  }

  if (eventType === 'conversation_utterance' || eventType === 'utterance') {
    const speech = event.data?.speech || event.speech || '';

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
        toolArgs = JSON.parse(argsString);
      } catch {
        if (toolName === 'fetch_video') {
          toolArgs = { video_title: argsString.replace(/["']/g, '') };
        } else {
          toolArgs = { arg: argsString };
        }
      }
      return { toolName, toolArgs };
    }

    return { toolName, toolArgs };
  }

  // Unhandled event types
  return { toolName, toolArgs };
}
