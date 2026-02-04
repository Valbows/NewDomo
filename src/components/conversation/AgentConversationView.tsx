'use client';

/**
 * ============================================================================
 * AGENT CONVERSATION VIEW - Daily.co Video Call Integration
 * ============================================================================
 *
 * This component wraps the Daily.co video call SDK and handles:
 *   - Joining/leaving video calls
 *   - Tool call parsing from app-message events
 *   - Real-time transcript and subtitle updates
 *   - Microphone state management
 *
 * KEY ARCHITECTURE DECISIONS:
 *
 * 1. SUBTITLE LIFECYCLE (setSubtitleWithTimeout)
 *    Subtitles auto-clear after 8 seconds to prevent stale text.
 *    Uses a ref to cancel previous timeouts when new text arrives.
 *    This prevents flickering while ensuring cleanup.
 *
 * 2. TOOL CALL DEDUPLICATION (shouldForward + lastForwardRef)
 *    Daily.co may send the same tool call multiple times within 1.5s.
 *    We track the last forwarded call and suppress duplicates.
 *    This prevents double video fetches and CTA displays.
 *
 * 3. APP MESSAGE PARSING
 *    Tavus sends events in multiple formats. We try to parse tool calls from:
 *      - parseToolCallFromEvent (utility function)
 *      - Direct data.event_type === 'conversation_toolcall'
 *      - Transcript array with tool_calls property
 *    This handles various Tavus API versions.
 *
 * 4. EXTERNAL MIC CONTROL
 *    Parent component can control mic via isMicMuted prop.
 *    We sync this to Daily via daily.setLocalAudio().
 *
 * RELATED FILES:
 *   - DemoExperienceView.tsx: Parent component that handles tool call logic
 *   - toolParser.ts: Tool name canonicalization and parsing
 *   - types.ts: TranscriptMessage interface
 *
 * ============================================================================
 */

import React, { useEffect, useCallback, useRef, useState } from 'react';
import {
  DailyAudio,
  useDaily,
  useMeetingState,
  useLocalSessionId,
  useDailyEvent,
  useDevices,
  useAudioTrack,
} from '@daily-co/daily-react';
import * as Sentry from '@sentry/nextjs';
import { AgentAvatarView } from './AgentAvatarView';
import { useCVICall } from '@/components/cvi/hooks/use-cvi-call';
import { parseToolCallFromEvent } from '@/lib/tools/toolParser';
import { createClientLogger } from '@/lib/client-logger';
import type { TranscriptMessage } from './types';

const log = createClientLogger('AgentConversationView');

interface AgentConversationViewProps {
  /** Daily conversation URL to join */
  conversationUrl: string;
  /** Agent name to display */
  agentName?: string;
  /** Callback when conversation ends/leaves */
  onLeave: () => void;
  /** Callback when a tool call is received */
  onToolCall?: (toolName: string, args: any) => void;
  /** Callback when transcript updates */
  onTranscriptUpdate?: (messages: TranscriptMessage[]) => void;
  /** Callback when subtitle text changes */
  onSubtitleChange?: (text: string | null) => void;
  /** External mic mute control */
  isMicMuted?: boolean;
  /** Debug video titles for dev mode */
  debugVideoTitles?: string[];
  /** Text message to send to the agent */
  pendingTextMessage?: string | null;
  /** Callback when text message is sent */
  onTextMessageSent?: () => void;
}

export const AgentConversationView = React.memo(function AgentConversationView({
  conversationUrl,
  agentName,
  onLeave,
  onToolCall,
  onTranscriptUpdate,
  onSubtitleChange,
  isMicMuted: externalMicMuted,
  debugVideoTitles,
  pendingTextMessage,
  onTextMessageSent,
}: AgentConversationViewProps) {
  const { joinCall, leaveCall } = useCVICall();
  const daily = useDaily();
  const meetingState = useMeetingState();
  const localId = useLocalSessionId();
  const { hasMicError, micState } = useDevices();
  const { isOff: localMicMuted } = useAudioTrack(localId);
  const isE2E = process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true';
  const isMicReady = micState === 'granted';

  // State for subtitles
  const [currentSubtitle, setCurrentSubtitle] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const subtitleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-clear subtitle after display duration
  const setSubtitleWithTimeout = useCallback((text: string | null) => {
    if (subtitleTimeoutRef.current) {
      clearTimeout(subtitleTimeoutRef.current);
      subtitleTimeoutRef.current = null;
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('[SUBTITLE DEBUG] setSubtitleWithTimeout called:', {
        text: text ? text.substring(0, 80) + (text.length > 80 ? '...' : '') : null,
        textLength: text?.length || 0,
      });
    }

    setCurrentSubtitle(text);

    // Auto-clear after 10 seconds as fallback (SubtitleDisplay handles its own chunk timing)
    // Primary clear is on stop-speaking event
    if (text) {
      subtitleTimeoutRef.current = setTimeout(() => {
        if (process.env.NODE_ENV !== 'production') {
          console.log('[SUBTITLE DEBUG] Auto-clearing subtitle after timeout');
        }
        setCurrentSubtitle(null);
      }, 10000);
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (subtitleTimeoutRef.current) {
        clearTimeout(subtitleTimeoutRef.current);
      }
    };
  }, []);

  // Sync external mic mute control with Daily
  useEffect(() => {
    if (daily && typeof externalMicMuted === 'boolean') {
      daily.setLocalAudio(!externalMicMuted);
    }
  }, [daily, externalMicMuted]);

  // Notify parent when subtitle changes
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[SUBTITLE DEBUG] Notifying parent of subtitle change:', {
        hasSubtitle: !!currentSubtitle,
        preview: currentSubtitle ? currentSubtitle.substring(0, 50) : null,
      });
    }
    onSubtitleChange?.(currentSubtitle);
  }, [currentSubtitle, onSubtitleChange]);

  // Send text messages to the agent via Daily
  useEffect(() => {
    if (!daily || !pendingTextMessage || meetingState !== 'joined-meeting') return;

    // Send the message to the conversation
    // Tavus agents receive text via app-message with a specific format
    try {
      daily.sendAppMessage(
        {
          type: 'user_text_message',
          text: pendingTextMessage,
          message: pendingTextMessage,
        },
        '*' // Send to all participants
      );
      log.info('Sent text message to agent', { message: pendingTextMessage });
      onTextMessageSent?.();
    } catch (error) {
      log.error('Failed to send text message', { error });
    }
  }, [daily, pendingTextMessage, meetingState, onTextMessageSent]);

  // Refs for deduplication and state tracking
  // hasCalledOnLeaveRef: Ensures onLeave callback fires only once (Daily may fire multiple left events)
  // lastForwardRef: Tracks last forwarded tool call to suppress duplicates within 1.5s window
  // lastProcessedRef: Tracks last processed transcript content to avoid duplicate state updates
  const hasCalledOnLeaveRef = useRef(false);
  const lastForwardRef = useRef<{ key: string; ts: number } | null>(null);
  const lastProcessedRef = useRef<string>('');

  // Dev mode state
  const [selectedTitle, setSelectedTitle] = useState<string>('');

  // Deduplication helper
  const shouldForward = useCallback((toolName: string, args: any) => {
    const argKey =
      toolName === 'fetch_video'
        ? typeof args?.title === 'string'
          ? args.title.trim().toLowerCase()
          : JSON.stringify(args || {})
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

  // ========== Daily Event Handlers ==========

  // Log meeting state changes
  useEffect(() => {
    try {
      Sentry.addBreadcrumb({
        category: 'daily',
        level: 'info',
        message: 'meeting-state',
        data: { meetingState },
      });
    } catch {}
  }, [meetingState]);

  // Handle joined-meeting event
  useDailyEvent('joined-meeting', () => {
    try {
      Sentry.addBreadcrumb({
        category: 'daily',
        level: 'info',
        message: 'joined-meeting',
        data: { localSessionId: localId, url: conversationUrl },
      });
    } catch {}
  });

  // Handle left-meeting event
  useDailyEvent('left-meeting', () => {
    try {
      Sentry.addBreadcrumb({ category: 'daily', level: 'info', message: 'left-meeting' });
    } catch {}
    if (!hasCalledOnLeaveRef.current) {
      hasCalledOnLeaveRef.current = true;
      onLeave();
    }
  });

  // Log participant events
  useDailyEvent('participant-joined', (ev) => {
    try {
      Sentry.addBreadcrumb({
        category: 'daily',
        level: 'info',
        message: 'participant-joined',
        data: { id: ev?.participant?.session_id },
      });
    } catch {}
  });

  useDailyEvent('participant-left', (ev) => {
    try {
      Sentry.addBreadcrumb({
        category: 'daily',
        level: 'info',
        message: 'participant-left',
        data: { id: ev?.participant?.session_id },
      });
    } catch {}
  });

  // Handle errors
  useDailyEvent('camera-error', (ev) => {
    console.error('Camera error', ev);
    try {
      Sentry.addBreadcrumb({ category: 'daily', level: 'error', message: 'camera-error' });
    } catch {}
  });

  useDailyEvent('error', (ev) => {
    console.error('Daily error event', ev);
    try {
      Sentry.addBreadcrumb({ category: 'daily', level: 'error', message: 'daily-error-event' });
    } catch {}
  });

  // Log mic access issues
  useEffect(() => {
    if (hasMicError) {
      console.error('Microphone error detected via devices hook');
      try {
        Sentry.addBreadcrumb({ category: 'daily', level: 'error', message: 'mic-error-detected' });
      } catch {}
    }
  }, [hasMicError]);

  // Log meeting error state
  useEffect(() => {
    if (meetingState === 'error') {
      console.warn('Daily meeting entered error state');
      try {
        Sentry.addBreadcrumb({ category: 'daily', level: 'warning', message: 'meeting-state-error' });
      } catch {}
    }
  }, [meetingState]);

  // ========== Call Management ==========

  // Join call when URL is available
  useEffect(() => {
    if (!conversationUrl) return;
    if (isE2E || conversationUrl === 'about:blank') return;

    try {
      Sentry.addBreadcrumb({
        category: 'daily',
        level: 'info',
        message: 'join-call',
        data: { url: conversationUrl },
      });
    } catch {}
    joinCall({ url: conversationUrl });
  }, [conversationUrl, joinCall, isE2E]);

  // Leave call on unmount
  useEffect(() => {
    return () => {
      if (isE2E) return;
      try {
        leaveCall();
      } catch (_) {
        // no-op
      }
    };
  }, [leaveCall, isE2E]);

  // Retry join handler
  const retryJoin = useCallback(() => {
    if (isE2E || conversationUrl === 'about:blank') return;
    try {
      Sentry.addBreadcrumb({ category: 'daily', level: 'info', message: 'retry-join' });
    } catch {}
    try {
      leaveCall();
    } catch (_) {}
    joinCall({ url: conversationUrl });
  }, [joinCall, leaveCall, conversationUrl, isE2E]);

  // ========== App Message Handler (Tool Calls & Transcript) ==========

  useEffect(() => {
    if (!daily) return;

    const handleAppMessage = (event: any) => {
      const { data } = event || {};

      // Debug logging for all app messages (dev only)
      if (process.env.NODE_ENV !== 'production') {
        const msgKeys = data ? Object.keys(data) : [];
        if (msgKeys.length > 0 && !msgKeys.includes('ping')) {
          console.log('[AgentConversationView] App message received:', {
            eventType: data?.event_type || data?.type,
            keys: msgKeys,
            hasTranscript: !!data?.transcript,
            hasPartial: !!(data?.partial_transcript || data?.speech || data?.text),
          });
        }
      }

      // Clear subtitle when agent stops speaking
      if (data?.event_type === 'conversation.replica.stopped_speaking') {
        if (process.env.NODE_ENV !== 'production') {
          console.log('[SUBTITLE DEBUG] Agent stopped speaking - clearing subtitle');
        }
        setSubtitleWithTimeout(null);
        return;
      }

      // ===== Handle transcript updates =====
      if (data?.transcript && Array.isArray(data.transcript)) {
        const messages: TranscriptMessage[] = [];

        data.transcript.forEach((msg: any, index: number) => {
          if (msg.tool_calls || msg.role === 'system') return;

          if ((msg.role === 'user' || msg.role === 'assistant') && msg.content) {
            messages.push({
              id: `${msg.role}-${index}-${Date.now()}`,
              role: msg.role,
              content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
              timestamp: new Date(),
            });
          }
        });

        if (messages.length > 0) {
          const lastMsgContent = messages[messages.length - 1].content;

          if (lastMsgContent !== lastProcessedRef.current) {
            lastProcessedRef.current = lastMsgContent;

            setTranscript((prev) => {
              const existingContents = new Set(prev.map((m) => m.content));
              const newMessages = messages.filter((m) => !existingContents.has(m.content));
              if (newMessages.length === 0) return prev;
              const updated = [...prev, ...newMessages];
              onTranscriptUpdate?.(updated);
              return updated;
            });

            // Update subtitle with latest assistant message
            const lastAssistantMsg = messages.filter((m) => m.role === 'assistant').pop();
            if (lastAssistantMsg) {
              if (process.env.NODE_ENV !== 'production') {
                console.log('[SUBTITLE DEBUG] Source: TRANSCRIPT', {
                  content: lastAssistantMsg.content.substring(0, 80),
                  totalMessages: messages.length,
                });
              }
              setSubtitleWithTimeout(lastAssistantMsg.content);
            }
          }
        }
      }

      // Handle partial transcript (real-time captions) - check multiple possible fields
      const partialText =
        data?.partial_transcript ||
        data?.speech ||
        data?.text ||
        data?.caption ||
        data?.subtitle ||
        data?.message?.text ||
        data?.content?.text;

      if (partialText && typeof partialText === 'string' && partialText.trim()) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('[SUBTITLE DEBUG] Source: PARTIAL_TRANSCRIPT', {
            content: partialText.substring(0, 80),
            sourceField: data?.partial_transcript ? 'partial_transcript' :
                         data?.speech ? 'speech' :
                         data?.text ? 'text' :
                         data?.caption ? 'caption' :
                         data?.subtitle ? 'subtitle' : 'other',
          });
        }
        setSubtitleWithTimeout(partialText);
      }

      // Also check for Tavus-specific conversation.utterance events
      if (data?.event_type === 'conversation.utterance' || data?.type === 'utterance') {
        if (process.env.NODE_ENV !== 'production') {
          console.log('[AgentConversationView] Utterance event full data:', JSON.stringify(data, null, 2));
        }

        const role = data?.properties?.role;

        // Try multiple possible locations for the utterance text - including properties.speech!
        const utteranceText =
          data?.properties?.speech ||  // Tavus sends speech here!
          data?.text ||
          data?.content ||
          data?.utterance ||
          data?.properties?.text ||
          data?.properties?.content ||
          data?.properties?.utterance ||
          data?.message ||
          data?.properties?.message;

        if (utteranceText && typeof utteranceText === 'string' && utteranceText.trim()) {
          if (process.env.NODE_ENV !== 'production') {
            console.log('[SUBTITLE DEBUG] Source: UTTERANCE_EVENT', {
              content: utteranceText.substring(0, 80),
              eventType: data?.event_type || data?.type,
              role: role,
            });
          }

          // Add to transcript for BOTH user and agent speech
          const messageRole = role === 'user' ? 'user' : 'assistant';
          setTranscript((prev) => {
            // Avoid duplicate messages by checking content
            const isDuplicate = prev.some(
              (m) => m.content === utteranceText && m.role === messageRole
            );
            if (isDuplicate) return prev;

            const newMessage: TranscriptMessage = {
              id: `${messageRole}-utterance-${Date.now()}`,
              role: messageRole,
              content: utteranceText,
              timestamp: new Date(),
            };
            const updated = [...prev, newMessage];
            onTranscriptUpdate?.(updated);
            return updated;
          });

          // Only show subtitle for agent (replica) speech
          if (role !== 'user') {
            setSubtitleWithTimeout(utteranceText);
          }
        }
      }

      // ===== Handle tool calls =====
      let parsed = parseToolCallFromEvent(data);
      if (!parsed.toolName) parsed = parseToolCallFromEvent(event);

      // Handle objective completion events
      if (data?.event_type === 'conversation.objective.completed') {
        log.info('Objective completion detected, forwarding to webhook');
        try {
          fetch(
            '/api/tavus-webhook?t=' +
              encodeURIComponent(process.env.NEXT_PUBLIC_TAVUS_WEBHOOK_TOKEN || 'domo_webhook_token_2025'),
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
            }
          ).catch((error) => {
            log.error('Error forwarding objective completion to webhook', { error });
          });
        } catch (error) {
          log.error('Error forwarding objective completion', { error });
        }
      }

      // Whitelist of tool calls we handle on the frontend
      // Other tool calls are ignored (may be handled by Tavus backend)
      const SUPPORTED = new Set([
        'fetch_video',    // Play a product video by title
        'pause_video',    // Pause current video
        'play_video',     // Resume paused video
        'next_video',     // Skip to next video
        'close_video',    // Close video overlay, return to conversation
        'show_trial_cta', // Show the call-to-action banner
        'seek_video',     // Jump to specific timestamp
      ]);

      if (parsed.toolName && SUPPORTED.has(parsed.toolName) && onToolCall) {
        const args = parsed.toolArgs ?? {};
        if (parsed.toolName === 'fetch_video' && (!args || Object.keys(args).length === 0)) {
          log.warn('fetch_video detected but args missing/null; ignoring');
          return;
        }
        if (!shouldForward(parsed.toolName, args)) return;
        log.info('Forwarding parsed tool call', { toolName: parsed.toolName, args });
        onToolCall(parsed.toolName, args);

        // Forward fetch_video to webhook for tracking
        if (parsed.toolName === 'fetch_video') {
          try {
            fetch(
              '/api/tavus-webhook?t=' +
                encodeURIComponent(process.env.NEXT_PUBLIC_TAVUS_WEBHOOK_TOKEN || 'domo_webhook_token_2025'),
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  conversation_id: data.conversation_id,
                  event_type: 'conversation.tool_call',
                  properties: { name: 'fetch_video', arguments: JSON.stringify(args) },
                }),
              }
            ).catch((error) => {
              log.error('Error forwarding fetch_video to webhook', { error });
            });
          } catch (error) {
            log.error('Error forwarding fetch_video', { error });
          }
        }
        return;
      }

      // Fallback: legacy direct fields
      if (data?.event_type === 'conversation_toolcall' || data?.type === 'tool_call') {
        const toolName = data.name || data.function?.name;
        const rawArgs = data.args || data.arguments;
        if (toolName && SUPPORTED.has(toolName) && onToolCall) {
          if (toolName === 'fetch_video') {
            if (!rawArgs) {
              log.warn('fetch_video legacy call missing args; ignoring');
              return;
            }
            let coercedArgs: any = rawArgs;
            if (typeof rawArgs === 'string') {
              try {
                const parsedArgs = JSON.parse(rawArgs);
                coercedArgs =
                  typeof parsedArgs === 'string' ? { title: parsedArgs.replace(/^["']|["']$/g, '') } : parsedArgs;
              } catch {
                coercedArgs = { title: String(rawArgs).trim().replace(/^["']|["']$/g, '') };
              }
            }
            if (!shouldForward(toolName, coercedArgs || {})) return;
            onToolCall(toolName, coercedArgs || {});
            return;
          }
          if (!shouldForward(toolName, rawArgs || {})) return;
          onToolCall(toolName, rawArgs || {});
          return;
        }
      }

      // Transcript-based tool calls
      if (data?.transcript) {
        const transcriptData = data.transcript;
        const toolCallMessages = transcriptData.filter(
          (msg: any) => msg.role === 'assistant' && msg.tool_calls && msg.tool_calls.length > 0
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
              onToolCall(name, args);

              if (name === 'fetch_video') {
                try {
                  fetch(
                    '/api/tavus-webhook?t=' +
                      encodeURIComponent(process.env.NEXT_PUBLIC_TAVUS_WEBHOOK_TOKEN || 'domo_webhook_token_2025'),
                    {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        conversation_id: data.conversation_id,
                        event_type: 'conversation.tool_call',
                        properties: { name: 'fetch_video', arguments: JSON.stringify(args) },
                      }),
                    }
                  ).catch((error) => {
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

    daily.on('app-message', handleAppMessage);
    return () => {
      daily.off('app-message', handleAppMessage);
    };
  }, [daily, onToolCall, onTranscriptUpdate, shouldForward, setSubtitleWithTimeout]);

  // ========== Render ==========

  return (
    <div className="relative w-full h-full flex flex-col bg-domo-bg-dark">
      {/* Error states */}
      {hasMicError && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500/90 text-white px-4 py-2 rounded-lg text-sm z-10">
          Microphone access denied. Please check your settings.
        </div>
      )}

      {meetingState === 'error' && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500/90 text-white px-4 py-3 rounded-lg text-sm z-10 flex items-center gap-3">
          <span>Connection error. Try again.</span>
          <button
            onClick={retryJoin}
            className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Agent avatar - fills entire space */}
      <div className="flex-1 w-full">
        <AgentAvatarView agentName={agentName} />
      </div>

      {/* Daily Audio - required for audio playback */}
      <DailyAudio />

      {/* Dev mode controls */}
      {(process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true') && (
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-domo-bg-card/90 p-2 rounded shadow border border-domo-border">
          {Array.isArray(debugVideoTitles) && debugVideoTitles.length > 0 ? (
            <>
              <select
                className="text-xs border border-domo-border rounded px-2 py-1 max-w-xs bg-domo-bg-elevated text-white"
                value={selectedTitle}
                onChange={(e) => setSelectedTitle(e.target.value)}
                onFocus={() => {
                  if (!selectedTitle && debugVideoTitles.length > 0) {
                    setSelectedTitle(debugVideoTitles[0]);
                  }
                }}
                data-testid="agent-dev-dropdown"
              >
                <option value="" disabled>
                  Select exact video title...
                </option>
                {debugVideoTitles.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <button
                data-testid="agent-dev-play"
                onClick={() => {
                  if (selectedTitle && selectedTitle.trim()) {
                    onToolCall?.('fetch_video', { title: selectedTitle.trim() });
                  }
                }}
                className="px-3 py-1 bg-domo-primary text-white text-xs rounded hover:bg-domo-secondary shadow"
              >
                Play
              </button>
            </>
          ) : (
            <button
              data-testid="agent-dev-button"
              onClick={() => {
                const title = window.prompt('Enter exact video title to fetch:');
                if (title && title.trim()) {
                  onToolCall?.('fetch_video', { title: title.trim() });
                }
              }}
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 shadow"
            >
              Test Tool Call
            </button>
          )}
          <div className="flex items-center gap-2 ml-2">
            <button
              data-testid="agent-dev-close"
              onClick={() => onToolCall?.('close_video', {})}
              className="px-3 py-1 bg-domo-bg-elevated text-white text-xs rounded hover:bg-domo-border shadow"
              title="Close video"
            >
              Close
            </button>
            <button
              data-testid="agent-dev-cta"
              onClick={() => onToolCall?.('show_trial_cta', {})}
              className="px-3 py-1 bg-domo-success text-white text-xs rounded hover:bg-domo-success/80 shadow"
              title="Show CTA"
            >
              Show CTA
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
