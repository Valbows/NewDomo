'use client';

import React, { useEffect, useCallback, useState, useRef } from 'react';
import { useDaily, useMeetingState } from '@daily-co/daily-react';
import { Conversation } from '@/components/cvi/components/conversation';
import { parseToolCallFromEvent } from '@/lib/tools/toolParser';
import { createClientLogger } from '@/lib/client-logger';

const log = createClientLogger('TavusConversationCVI');

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

  const shouldForward = useCallback((toolName: string, args: any) => {
    const argKey = toolName === 'fetch_video'
      ? (typeof args?.title === 'string' ? args.title.trim().toLowerCase() : JSON.stringify(args || {}))
      : '';
    const key = `${toolName}:${argKey}`;
    const now = Date.now();
    const last = lastForwardRef.current;
    if (last && last.key === key && now - last.ts < 1500) {
      log.warn('Suppressing duplicate tool call within window', { key });
      return false;
    }
    lastForwardRef.current = { key, ts: now };
    return true;
  }, []);

  // Debug Daily instance and meeting state
  useEffect(() => {
    log.debug('TavusConversationCVI Debug', {
      dailyInstance: daily ? 'Available' : 'Not available',
      meetingState,
      conversationUrl,
    });
  }, [daily, meetingState, conversationUrl]);

  // Set up tool call event listeners as soon as Daily instance is available
  useEffect(() => {
    if (!daily) return;

    log.info('Setting up tool call listeners for CVI', { meetingState });

    const handleAppMessage = (event: any) => {
      log.info('CVI APP MESSAGE RECEIVED', { event });
      const { data } = event || {};

      // Unified parsing using shared helper on multiple shapes
      let parsed = parseToolCallFromEvent(data);
      if (!parsed.toolName) parsed = parseToolCallFromEvent(event);

      log.debug('Parsed tool call result', { parsed });

      // Handle objective completion events - forward to webhook
      if (data?.event_type === 'conversation.objective.completed') {
        log.info('Objective completion detected, forwarding to webhook');
        try {
          fetch('/api/tavus-webhook?t=' + encodeURIComponent(process.env.NEXT_PUBLIC_TAVUS_WEBHOOK_TOKEN || 'domo_webhook_token_2025'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          }).then(response => {
            if (response.ok) {
              log.info('Objective completion forwarded to webhook successfully');
            } else {
              log.error('Failed to forward objective completion to webhook', { status: response.status });
            }
          }).catch(error => {
            log.error('Error forwarding objective completion to webhook', { error });
          });
        } catch (error) {
          log.error('Error forwarding objective completion', { error });
        }
      }

      const SUPPORTED = new Set(['fetch_video','pause_video','play_video','next_video','close_video','show_trial_cta']);
      if (parsed.toolName && SUPPORTED.has(parsed.toolName) && onToolCall) {
        const args = parsed.toolArgs ?? {};
        if (parsed.toolName === 'fetch_video' && (!args || Object.keys(args).length === 0)) {
          log.warn('fetch_video detected but args missing/null; ignoring');
          return;
        }
        if (!shouldForward(parsed.toolName, args)) return;
        log.info('Forwarding parsed tool call', { toolName: parsed.toolName, args });

        // Forward to client-side handler
        onToolCall(parsed.toolName, args);

        // ALSO forward fetch_video to webhook for database tracking
        if (parsed.toolName === 'fetch_video') {
          log.info('Forwarding fetch_video to webhook for tracking');
          try {
            fetch('/api/tavus-webhook?t=' + encodeURIComponent(process.env.NEXT_PUBLIC_TAVUS_WEBHOOK_TOKEN || 'domo_webhook_token_2025'), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                conversation_id: data.conversation_id,
                event_type: 'conversation.tool_call',
                properties: {
                  name: 'fetch_video',
                  arguments: JSON.stringify(args)
                }
              }),
            }).then(response => {
              if (response.ok) {
                log.info('fetch_video forwarded to webhook successfully');
              } else {
                log.error('Failed to forward fetch_video to webhook', { status: response.status });
              }
            }).catch(error => {
              log.error('Error forwarding fetch_video to webhook', { error });
            });
          } catch (error) {
            log.error('Error forwarding fetch_video', { error });
          }
        }

        return;
      }

      // Fallback: legacy direct fields if any
      if (data?.event_type === 'conversation_toolcall' || data?.type === 'tool_call') {
        const toolName = data.name || data.function?.name;
        const rawArgs = data.args || data.arguments;
        if (toolName && SUPPORTED.has(toolName) && onToolCall) {
          if (toolName === 'fetch_video') {
            if (!rawArgs) {
              log.warn('fetch_video legacy call missing args; ignoring');
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
            log.info('Forwarding legacy tool call (coerced)', { toolName, coercedArgs });

            // Forward to client-side handler
            onToolCall(toolName, coercedArgs || {});

            // ALSO forward to webhook for database tracking
            log.info('Forwarding legacy fetch_video to webhook for tracking');
            try {
              fetch('/api/tavus-webhook?t=' + encodeURIComponent(process.env.NEXT_PUBLIC_TAVUS_WEBHOOK_TOKEN || 'domo_webhook_token_2025'), {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  conversation_id: data.conversation_id,
                  event_type: 'conversation.tool_call',
                  properties: {
                    name: 'fetch_video',
                    arguments: JSON.stringify(coercedArgs || {})
                  }
                }),
              }).then(response => {
                if (response.ok) {
                  log.info('Legacy fetch_video forwarded to webhook successfully');
                } else {
                  log.error('Failed to forward legacy fetch_video to webhook', { status: response.status });
                }
              }).catch(error => {
                log.error('Error forwarding legacy fetch_video to webhook', { error });
              });
            } catch (error) {
              log.error('Error forwarding legacy fetch_video', { error });
            }

            return;
          }
          if (!shouldForward(toolName, rawArgs || {})) return;
          log.info('Forwarding legacy tool call', { toolName, rawArgs });
          onToolCall(toolName, rawArgs || {});
          return;
        }
      }

      // Transcript-based tool calls
      if (data?.transcript) {
        log.debug('Checking transcript for tool calls');
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
                log.warn('fetch_video transcript call missing args; ignoring');
                return;
              }
              if (!shouldForward(name, args)) return;
              log.info('Forwarding transcript tool call', { name, args });

              // Forward to client-side handler
              onToolCall(name, args);

              // ALSO forward fetch_video to webhook for database tracking
              if (name === 'fetch_video') {
                log.info('Forwarding transcript fetch_video to webhook for tracking');
                try {
                  fetch('/api/tavus-webhook?t=' + encodeURIComponent(process.env.NEXT_PUBLIC_TAVUS_WEBHOOK_TOKEN || 'domo_webhook_token_2025'), {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      conversation_id: data.conversation_id,
                      event_type: 'conversation.tool_call',
                      properties: {
                        name: 'fetch_video',
                        arguments: JSON.stringify(args)
                      }
                    }),
                  }).then(response => {
                    if (response.ok) {
                      log.info('Transcript fetch_video forwarded to webhook successfully');
                    } else {
                      log.error('Failed to forward transcript fetch_video to webhook', { status: response.status });
                    }
                  }).catch(error => {
                    log.error('Error forwarding transcript fetch_video to webhook', { error });
                  });
                } catch (error) {
                  log.error('Error forwarding transcript fetch_video', { error });
                }
              }
            } catch (error) {
              log.error('Error parsing tool call arguments', { error });
            }
          }
        }
      }
    };

    // Add event listener
    daily.on('app-message', handleAppMessage);

    // Cleanup
    return () => {
      daily.off('app-message', handleAppMessage);
    };
  }, [daily, onToolCall, meetingState]);

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
                    log.debug('Manual tool call test (dropdown) triggered', { selectedTitle });
                    onToolCall?.('fetch_video', { title: selectedTitle.trim() });
                  } else {
                    log.debug('No title selected');
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
                log.debug('Manual tool call test triggered');
                const title = window.prompt('Enter exact video title to fetch:');
                if (title && title.trim()) {
                  onToolCall?.('fetch_video', { title: title.trim() });
                } else {
                  log.debug('Manual tool call cancelled: no title provided');
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
