'use client';

import React, { useEffect, useCallback, useState, useRef } from 'react';
import { useDaily, useMeetingState } from '@daily-co/daily-react';
import { Conversation } from '@/components/cvi/components/conversation';
import { parseToolCallFromEvent } from '@/lib/tools/toolParser';

interface TavusConversationCVIProps {
  conversationUrl: string;
  onLeave: () => void;
  onToolCall?: (toolName: string, args: any) => void;
  debugVideoTitles?: string[]; // dev-only helper to avoid typos
}

export const TavusConversationCVI: React.FC<TavusConversationCVIProps> = ({
  conversationUrl,
  onLeave,
  onToolCall,
  debugVideoTitles,
}) => {
  const daily = useDaily();
  const meetingState = useMeetingState();
  const [selectedTitle, setSelectedTitle] = useState<string>('');
  const lastForwardRef = useRef<{ key: string; ts: number } | null>(null);
  const lastUserSpeechRef = useRef<string>('');
  const lastAssistantSpeechRef = useRef<string>('');
  const lastFallbackTsRef = useRef<number>(0);
  const fallbackEnabled = (process.env.NEXT_PUBLIC_TAVUS_TOOLCALL_TEXT_FALLBACK ?? 'true').toLowerCase() !== 'false';

  const shouldForward = useCallback((toolName: string, args: any) => {
    const argKey = toolName === 'fetch_video'
      ? (typeof args?.title === 'string' ? args.title.trim().toLowerCase() : JSON.stringify(args || {}))
      : '';
    const key = `${toolName}:${argKey}`;
    const now = Date.now();
    const last = lastForwardRef.current;
    if (last && last.key === key && now - last.ts < 1500) {
      console.warn('⏳ Suppressing duplicate tool call within window:', key);
      return false;
    }
    lastForwardRef.current = { key, ts: now };
    return true;
  }, []);

  // Debug Daily instance and meeting state
  useEffect(() => {
    console.log('🔍 TavusConversationCVI Debug:');
    console.log('  - Daily instance:', daily ? 'Available' : 'Not available');
    console.log('  - Meeting state:', meetingState);
    console.log('  - Conversation URL:', conversationUrl);
  }, [daily, meetingState, conversationUrl]);

  // Set up tool call event listeners as soon as Daily instance is available
  useEffect(() => {
    if (!daily) return;

    console.log('🎯 Setting up tool call listeners for CVI (meetingState=', meetingState, ')');

    const handleAppMessage = (event: any) => {
      console.log('=== CVI APP MESSAGE RECEIVED ===');
      try {
        console.log('Full event (json):', JSON.stringify(event, null, 2));
      } catch {}
      const { data } = event || {};
      try {
        console.log('Event.data (json):', JSON.stringify(data, null, 2));
      } catch {}

      // Track latest utterances for voice-based fallback
      const role = data?.properties?.role as string | undefined;
      const speech = typeof data?.properties?.speech === 'string' ? data.properties.speech : '';
      if (role === 'user' && speech) {
        lastUserSpeechRef.current = speech;
      } else if ((role === 'replica' || role === 'assistant') && speech) {
        lastAssistantSpeechRef.current = speech;
      }

      // Unified parsing using shared helper on multiple shapes
      let parsed = parseToolCallFromEvent(data);
      if (!parsed.toolName) parsed = parseToolCallFromEvent(event);

      console.log('Parsed tool call result:', parsed);

      const SUPPORTED = new Set(['fetch_video','pause_video','play_video','next_video','close_video','show_trial_cta']);
      if (parsed.toolName && SUPPORTED.has(parsed.toolName) && onToolCall) {
        const args = parsed.toolArgs ?? {};
        if (parsed.toolName === 'fetch_video' && (!args || Object.keys(args).length === 0)) {
          console.warn('fetch_video detected but args missing/null; ignoring');
          return;
        }
        if (!shouldForward(parsed.toolName, args)) return;
        console.log(`🔧 Forwarding parsed tool call: ${parsed.toolName}`, args);
        onToolCall(parsed.toolName, args);
        return;
      }

      // Fallback: legacy direct fields if any
      if (data?.event_type === 'conversation_toolcall' || data?.type === 'tool_call') {
        const toolName = data.name || data.function?.name;
        const rawArgs = data.args || data.arguments;
        if (toolName && SUPPORTED.has(toolName) && onToolCall) {
          if (toolName === 'fetch_video') {
            if (!rawArgs) {
              console.warn('fetch_video legacy call missing args; ignoring');
              return;
            }
            // Coerce string args to { title } for compatibility
            let coercedArgs: any = rawArgs;
            if (typeof rawArgs === 'string') {
              try {
                const parsed = JSON.parse(rawArgs);
                coercedArgs = typeof parsed === 'string'
                  ? { title: parsed.replace(/^["']|["']$/g, '') }
                  : parsed;
              } catch {
                coercedArgs = { title: String(rawArgs).trim().replace(/^["']|["']$/g, '') };
              }
            }
            if (!shouldForward(toolName, coercedArgs || {})) return;
            console.log('🔧 Forwarding legacy tool call (coerced):', toolName, coercedArgs || {});
            onToolCall(toolName, coercedArgs || {});
            return;
          }
          if (!shouldForward(toolName, rawArgs || {})) return;
          console.log('🔧 Forwarding legacy tool call:', toolName, rawArgs || {});
          onToolCall(toolName, rawArgs || {});
          return;
        }
      }

      // Transcript-based tool calls
      if (data?.transcript) {
        console.log('📝 Checking transcript for tool calls');
        const transcript = data.transcript;
        const toolCallMessages = transcript.filter((msg: any) =>
          msg.role === 'assistant' && msg.tool_calls && msg.tool_calls.length > 0
        );
        if (toolCallMessages.length > 0) {
          const lastToolCall = toolCallMessages[toolCallMessages.length - 1];
          const toolCall = lastToolCall.tool_calls[0];
          const name = toolCall.function?.name;
          if (name && SUPPORTED.has(name) && onToolCall) {
            try {
              const raw = toolCall.function.arguments;
              const args = raw ? JSON.parse(raw) : {};
              if (name === 'fetch_video' && (!args || Object.keys(args).length === 0)) {
                console.warn('fetch_video transcript call missing args; ignoring');
                return;
              }
              if (!shouldForward(name, args)) return;
              console.log('🔧 Forwarding transcript tool call:', name, args);
              onToolCall(name, args);
            } catch (error) {
              console.error('Error parsing tool call arguments:', error);
            }
          }
        }
      }

      // Conservative voice-based fallback: only when assistant explicitly promises a video
      // and no explicit tool call was forwarded above
      try {
        if (fallbackEnabled && (role === 'replica' || role === 'assistant')) {
          const text = (speech || '').toString();
          const lower = text.toLowerCase();
          const promised = /\b(show|play|fetch|get|pull|bring up)\b.{0,60}\b(video|demo)\b/.test(lower)
            || /\b(i'm going to fetch a video|let me (show|play) you a video)\b/.test(lower);

          if (promised) {
            // Extract a quoted title if present, else pick best match from known titles or last user request
            const quotedMatch = text.match(/"([^"\n]{2,120})"/);
            const candidateRaw = quotedMatch?.[1]?.trim();

            const pickBestTitle = (input: string | undefined | null): string | null => {
              if (!input || !Array.isArray(debugVideoTitles) || debugVideoTitles.length === 0) return null;
              const cleaned = input.toLowerCase();
              let best: string | null = null;
              let bestScore = 0;
              for (const t of debugVideoTitles) {
                const tl = (t || '').toLowerCase();
                if (!tl) continue;
                let score = 0;
                if (cleaned.includes(tl) || tl.includes(cleaned)) {
                  score += 5;
                } else {
                  const words = cleaned.split(/[^a-z0-9]+/i).filter(w => w.length >= 3);
                  const uniq = Array.from(new Set(words));
                  const hits = uniq.reduce((acc, w) => acc + (tl.includes(w) ? 1 : 0), 0);
                  score += hits;
                }
                if (score > bestScore) {
                  bestScore = score;
                  best = t;
                }
              }
              return bestScore > 0 ? best : null;
            };

            const inferred = candidateRaw
              ? (pickBestTitle(candidateRaw) || candidateRaw)
              : (pickBestTitle(lastUserSpeechRef.current) || pickBestTitle(text));

            if (inferred && Date.now() - lastFallbackTsRef.current > 2500) {
              lastFallbackTsRef.current = Date.now();
              const args = { title: inferred.replace(/^['"]|['"]$/g, '') };
              if (!shouldForward('fetch_video', args)) return;
              console.log('🎯 Voice-fallback triggering fetch_video with inferred title:', args);
              onToolCall?.('fetch_video', args);
              return;
            } else if (!inferred) {
              console.warn('Voice-fallback detected promise to show video but could not infer a matching title');
            }
          }
        }
      } catch (e) {
        console.warn('Voice-fallback processing error (ignored)', e);
      }
    };

    // Add event listener
    daily.on('app-message', handleAppMessage);

    // Cleanup
    return () => {
      daily.off('app-message', handleAppMessage);
    };
  }, [daily, onToolCall, meetingState, debugVideoTitles]);

  return (
    <div className="w-full h-full">
      <Conversation 
        conversationUrl={conversationUrl}
        onLeave={onLeave}
      />
      
      {/* Manual test button for debugging */}
      {(process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true') && (
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-white/90 p-2 rounded shadow">
          {Array.isArray(debugVideoTitles) && debugVideoTitles.length > 0 ? (
            <>
              <select
                className="text-xs border rounded px-2 py-1 max-w-xs"
                value={selectedTitle}
                onChange={(e) => setSelectedTitle(e.target.value)}
                onFocus={() => {
                  // Default to first title if nothing selected
                  if (!selectedTitle && debugVideoTitles.length > 0) {
                    setSelectedTitle(debugVideoTitles[0]);
                  }
                }}
                data-testid="cvi-dev-dropdown"
              >
                <option value="" disabled>
                  Select exact video title…
                </option>
                {debugVideoTitles.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <button
                data-testid="cvi-dev-play"
                onClick={() => {
                  if (selectedTitle && selectedTitle.trim()) {
                    console.log('Manual tool call test (dropdown) triggered:', selectedTitle);
                    onToolCall?.('fetch_video', { title: selectedTitle.trim() });
                  } else {
                    console.log('No title selected');
                  }
                }}
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 shadow"
              >
                Play
              </button>
            </>
          ) : (
            <button
              data-testid="cvi-dev-button"
              onClick={() => {
                console.log('Manual tool call test triggered');
                const title = window.prompt('Enter exact video title to fetch:');
                if (title && title.trim()) {
                  onToolCall?.('fetch_video', { title: title.trim() });
                } else {
                  console.log('Manual tool call cancelled: no title provided');
                }
              }}
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 shadow"
            >
              Test Tool Call
            </button>
          )}
          {/* Additional dev controls for exercising other tools */}
          <div className="flex items-center gap-2 ml-2">
            <button
              data-testid="cvi-dev-pause"
              onClick={() => onToolCall?.('pause_video', {})}
              className="px-3 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-800 shadow"
              title="Pause video"
            >
              Pause
            </button>
            <button
              data-testid="cvi-dev-resume"
              onClick={() => onToolCall?.('play_video', {})}
              className="px-3 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-800 shadow"
              title="Resume video"
            >
              Resume
            </button>
            <button
              data-testid="cvi-dev-next"
              onClick={() => onToolCall?.('next_video', {})}
              className="px-3 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-800 shadow"
              title="Next video"
            >
              Next
            </button>
            <button
              data-testid="cvi-dev-close"
              onClick={() => onToolCall?.('close_video', {})}
              className="px-3 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-800 shadow"
              title="Close video"
            >
              Close
            </button>
            <button
              data-testid="cvi-dev-cta"
              onClick={() => onToolCall?.('show_trial_cta', {})}
              className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 shadow"
              title="Show CTA"
            >
              Show CTA
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
