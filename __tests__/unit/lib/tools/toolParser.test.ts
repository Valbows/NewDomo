/**
 * Unit tests for tool call parsing utilities
 * Tests parsing of tool calls from various Tavus event formats
 */

import { parseToolCallFromEvent } from '@/lib/tools/toolParser';

describe('Tool Parser', () => {
  describe('parseToolCallFromEvent', () => {
    describe('Tool Call Events', () => {
      it('parses conversation_toolcall event with nested function data', () => {
        const event = {
          event_type: 'conversation_toolcall',
          data: {
            name: 'fetch_video',
            function: {
              name: 'fetch_video',
              arguments: '{"title": "Strategic Planning"}'
            }
          }
        };

        const result = parseToolCallFromEvent(event);
        expect(result.toolName).toBe('fetch_video');
        expect(result.toolArgs).toEqual({ title: 'Strategic Planning' });
      });

      it('parses conversation_tool_call event (underscore variant)', () => {
        const event = {
          event_type: 'conversation_tool_call',
          data: {
            name: 'pause_video',
            args: '{}'
          }
        };

        const result = parseToolCallFromEvent(event);
        expect(result.toolName).toBe('pause_video');
        expect(result.toolArgs).toEqual({});
      });

      it('parses tool_call event with direct properties', () => {
        const event = {
          type: 'tool_call',
          name: 'show_trial_cta',
          arguments: '{}'
        };

        const result = parseToolCallFromEvent(event);
        expect(result.toolName).toBe('show_trial_cta');
        expect(result.toolArgs).toEqual({});
      });

      it('handles string arguments that are single quoted strings', () => {
        const event = {
          event_type: 'conversation_toolcall',
          data: {
            name: 'fetch_video',
            arguments: '"Workforce Planning"'
          }
        };

        const result = parseToolCallFromEvent(event);
        expect(result.toolName).toBe('fetch_video');
        expect(result.toolArgs).toEqual({ title: 'Workforce Planning' });
      });

      it('handles malformed JSON arguments gracefully', () => {
        const event = {
          event_type: 'conversation_toolcall',
          data: {
            name: 'fetch_video',
            arguments: 'title:"Strategic Planning"'
          }
        };

        const result = parseToolCallFromEvent(event);
        expect(result.toolName).toBe('fetch_video');
        expect(result.toolArgs).toEqual({ title: 'Strategic Planning' });
      });

      it('handles bare string arguments without quotes', () => {
        const event = {
          event_type: 'conversation_toolcall',
          data: {
            name: 'fetch_video',
            arguments: 'Strategic Planning'
          }
        };

        const result = parseToolCallFromEvent(event);
        expect(result.toolName).toBe('fetch_video');
        expect(result.toolArgs).toEqual({ title: 'Strategic Planning' });
      });

      it('canonicalizes short tool names to full names', () => {
        const event = {
          event_type: 'conversation_toolcall',
          data: {
            name: 'pause',
            arguments: '{}'
          }
        };

        const result = parseToolCallFromEvent(event);
        expect(result.toolName).toBe('pause_video');
        expect(result.toolArgs).toEqual({});
      });

      it('converts fetch_video with command-like title to control tool', () => {
        const event = {
          event_type: 'conversation_toolcall',
          data: {
            name: 'fetch_video',
            arguments: '{"title": "pause"}'
          }
        };

        const result = parseToolCallFromEvent(event);
        expect(result.toolName).toBe('pause_video');
        expect(result.toolArgs).toEqual({});
      });
    });

    describe('Transcription Events', () => {
      it('parses application_transcription_ready event', () => {
        const event = {
          event_type: 'application_transcription_ready',
          data: {
            transcript: [
              {
                role: 'user',
                content: 'Show me the strategic planning video'
              },
              {
                role: 'assistant',
                content: 'I\'ll show you that video now.',
                tool_calls: [
                  {
                    function: {
                      name: 'fetch_video',
                      arguments: '{"title": "Strategic Planning"}'
                    }
                  }
                ]
              }
            ]
          }
        };

        const result = parseToolCallFromEvent(event);
        expect(result.toolName).toBe('fetch_video');
        expect(result.toolArgs).toEqual({ title: 'Strategic Planning' });
      });

      it('handles transcription event with malformed JSON arguments', () => {
        const event = {
          event_type: 'application_transcription_ready',
          data: {
            transcript: [
              {
                role: 'assistant',
                tool_calls: [
                  {
                    function: {
                      name: 'fetch_video',
                      arguments: '"Strategic Planning"'
                    }
                  }
                ]
              }
            ]
          }
        };

        const result = parseToolCallFromEvent(event);
        expect(result.toolName).toBe('fetch_video');
        expect(result.toolArgs).toEqual({ title: 'Strategic Planning' });
      });

      it('handles transcription event with key:value arguments', () => {
        const event = {
          event_type: 'application_transcription_ready',
          data: {
            transcript: [
              {
                role: 'assistant',
                tool_calls: [
                  {
                    function: {
                      name: 'fetch_video',
                      arguments: 'title:"Strategic Planning"'
                    }
                  }
                ]
              }
            ]
          }
        };

        const result = parseToolCallFromEvent(event);
        expect(result.toolName).toBe('fetch_video');
        expect(result.toolArgs).toEqual({ title: 'Strategic Planning' });
      });

      it('canonicalizes short tool names in transcription events', () => {
        const event = {
          event_type: 'application_transcription_ready',
          data: {
            transcript: [
              {
                role: 'assistant',
                tool_calls: [
                  {
                    function: {
                      name: 'pause',
                      arguments: '{}'
                    }
                  }
                ]
              }
            ]
          }
        };

        const result = parseToolCallFromEvent(event);
        expect(result.toolName).toBe('pause_video');
        expect(result.toolArgs).toEqual({});
      });

      it('returns null for transcription events without tool calls', () => {
        const event = {
          event_type: 'application_transcription_ready',
          data: {
            transcript: [
              {
                role: 'user',
                content: 'Hello there'
              },
              {
                role: 'assistant',
                content: 'Hi! How can I help you?'
              }
            ]
          }
        };

        const result = parseToolCallFromEvent(event);
        expect(result.toolName).toBeNull();
        expect(result.toolArgs).toBeNull();
      });
    });

    describe('Utterance Events', () => {
      // Mock environment variable for text fallback
      const originalEnv = process.env.NEXT_PUBLIC_TAVUS_TOOLCALL_TEXT_FALLBACK;
      
      beforeAll(() => {
        process.env.NEXT_PUBLIC_TAVUS_TOOLCALL_TEXT_FALLBACK = 'true';
      });

      afterAll(() => {
        if (originalEnv !== undefined) {
          process.env.NEXT_PUBLIC_TAVUS_TOOLCALL_TEXT_FALLBACK = originalEnv;
        } else {
          delete process.env.NEXT_PUBLIC_TAVUS_TOOLCALL_TEXT_FALLBACK;
        }
      });

      it('parses conversation_utterance event with function call syntax', () => {
        const event = {
          event_type: 'conversation_utterance',
          data: {
            speech: 'Let me show you that. fetch_video("Strategic Planning")'
          }
        };

        const result = parseToolCallFromEvent(event);
        expect(result.toolName).toBe('fetch_video');
        expect(result.toolArgs).toEqual({ title: 'Strategic Planning' });
      });

      it('parses direct tool commands from speech', () => {
        const event = {
          event_type: 'conversation_utterance',
          data: {
            speech: 'pause'
          }
        };

        const result = parseToolCallFromEvent(event);
        expect(result.toolName).toBe('pause_video');
        expect(result.toolArgs).toEqual({});
      });

      it('parses natural language commands', () => {
        const event = {
          event_type: 'conversation_utterance',
          data: {
            speech: 'Let me pause the video for a moment'
          }
        };

        const result = parseToolCallFromEvent(event);
        expect(result.toolName).toBe('pause_video');
        expect(result.toolArgs).toEqual({});
      });

      it('handles "hold on" as pause command', () => {
        const event = {
          event_type: 'conversation_utterance',
          data: {
            speech: 'Hold on, let me check something'
          }
        };

        const result = parseToolCallFromEvent(event);
        expect(result.toolName).toBe('pause_video');
        expect(result.toolArgs).toEqual({});
      });

      it('parses resume/play commands', () => {
        const event = {
          event_type: 'conversation_utterance',
          data: {
            speech: 'Let me resume the video'
          }
        };

        const result = parseToolCallFromEvent(event);
        expect(result.toolName).toBe('play_video');
        expect(result.toolArgs).toEqual({});
      });

      it('parses next/skip commands', () => {
        const event = {
          event_type: 'conversation_utterance',
          data: {
            speech: 'Let\'s skip to the next video'
          }
        };

        const result = parseToolCallFromEvent(event);
        expect(result.toolName).toBe('next_video');
        expect(result.toolArgs).toEqual({});
      });

      it('parses close/exit commands', () => {
        const event = {
          event_type: 'conversation_utterance',
          data: {
            speech: 'Let me close this video'
          }
        };

        const result = parseToolCallFromEvent(event);
        expect(result.toolName).toBe('close_video');
        expect(result.toolArgs).toEqual({});
      });

      it('ignores negated commands', () => {
        const event = {
          event_type: 'conversation_utterance',
          data: {
            speech: 'Don\'t pause the video yet'
          }
        };

        const result = parseToolCallFromEvent(event);
        expect(result.toolName).toBeNull();
        expect(result.toolArgs).toBeNull();
      });

      it('handles function call with malformed JSON', () => {
        const event = {
          event_type: 'conversation_utterance',
          data: {
            speech: 'fetch_video(Strategic Planning)'
          }
        };

        const result = parseToolCallFromEvent(event);
        expect(result.toolName).toBe('fetch_video');
        expect(result.toolArgs).toEqual({ title: 'Strategic Planning' });
      });

      it('canonicalizes short function names in speech', () => {
        const event = {
          event_type: 'conversation_utterance',
          data: {
            speech: 'pause()'
          }
        };

        const result = parseToolCallFromEvent(event);
        expect(result.toolName).toBe('pause_video');
        expect(result.toolArgs).toEqual({});
      });
    });

    describe('Event Type Normalization', () => {
      it('normalizes event types with dots to underscores', () => {
        const event = {
          event_type: 'conversation.toolcall',
          data: {
            name: 'fetch_video',
            arguments: '{"title": "Test"}'
          }
        };

        const result = parseToolCallFromEvent(event);
        expect(result.toolName).toBe('fetch_video');
        expect(result.toolArgs).toEqual({ title: 'Test' });
      });

      it('normalizes event types with hyphens to underscores', () => {
        const event = {
          event_type: 'conversation-toolcall',
          data: {
            name: 'fetch_video',
            arguments: '{"title": "Test"}'
          }
        };

        const result = parseToolCallFromEvent(event);
        expect(result.toolName).toBe('fetch_video');
        expect(result.toolArgs).toEqual({ title: 'Test' });
      });

      it('handles mixed case event types', () => {
        const event = {
          event_type: 'Conversation_ToolCall',
          data: {
            name: 'fetch_video',
            arguments: '{"title": "Test"}'
          }
        };

        const result = parseToolCallFromEvent(event);
        expect(result.toolName).toBe('fetch_video');
        expect(result.toolArgs).toEqual({ title: 'Test' });
      });
    });

    describe('Edge Cases', () => {
      it('returns null for null/undefined events', () => {
        expect(parseToolCallFromEvent(null)).toEqual({ toolName: null, toolArgs: null });
        expect(parseToolCallFromEvent(undefined)).toEqual({ toolName: null, toolArgs: null });
      });

      it('returns null for empty events', () => {
        expect(parseToolCallFromEvent({})).toEqual({ toolName: null, toolArgs: null });
      });

      it('returns null for unrecognized event types', () => {
        const event = {
          event_type: 'unknown_event',
          data: {
            name: 'fetch_video',
            arguments: '{"title": "Test"}'
          }
        };

        const result = parseToolCallFromEvent(event);
        expect(result.toolName).toBeNull();
        expect(result.toolArgs).toBeNull();
      });

      it('handles events with missing data', () => {
        const event = {
          event_type: 'conversation_toolcall'
        };

        const result = parseToolCallFromEvent(event);
        expect(result.toolName).toBeNull();
        expect(result.toolArgs).toBeNull();
      });

      it('handles deeply nested event structures', () => {
        const event = {
          event_type: 'conversation_toolcall',
          data: {
            properties: {
              function: {
                name: 'fetch_video',
                arguments: '{"title": "Deep Nested"}'
              }
            }
          }
        };

        const result = parseToolCallFromEvent(event);
        expect(result.toolName).toBe('fetch_video');
        expect(result.toolArgs).toEqual({ title: 'Deep Nested' });
      });

      it('handles object arguments directly', () => {
        const event = {
          event_type: 'conversation_toolcall',
          data: {
            name: 'fetch_video',
            arguments: { title: 'Object Args' }
          }
        };

        const result = parseToolCallFromEvent(event);
        expect(result.toolName).toBe('fetch_video');
        expect(result.toolArgs).toEqual({ title: 'Object Args' });
      });
    });

    describe('Command-like Title Conversion', () => {
      it('converts fetch_video with "pause" title to pause_video', () => {
        const event = {
          event_type: 'conversation_toolcall',
          data: {
            name: 'fetch_video',
            arguments: '{"title": "pause"}'
          }
        };

        const result = parseToolCallFromEvent(event);
        expect(result.toolName).toBe('pause_video');
        expect(result.toolArgs).toEqual({});
      });

      it('converts fetch_video with "resume" title to play_video', () => {
        const event = {
          event_type: 'conversation_toolcall',
          data: {
            name: 'fetch_video',
            arguments: '{"title": "resume"}'
          }
        };

        const result = parseToolCallFromEvent(event);
        expect(result.toolName).toBe('play_video');
        expect(result.toolArgs).toEqual({});
      });

      it('converts fetch_video with "next" title to next_video', () => {
        const event = {
          event_type: 'conversation_toolcall',
          data: {
            name: 'fetch_video',
            arguments: '{"title": "next"}'
          }
        };

        const result = parseToolCallFromEvent(event);
        expect(result.toolName).toBe('next_video');
        expect(result.toolArgs).toEqual({});
      });

      it('converts fetch_video with "close" title to close_video', () => {
        const event = {
          event_type: 'conversation_toolcall',
          data: {
            name: 'fetch_video',
            arguments: '{"title": "close"}'
          }
        };

        const result = parseToolCallFromEvent(event);
        expect(result.toolName).toBe('close_video');
        expect(result.toolArgs).toEqual({});
      });

      it('preserves actual video titles that are not commands', () => {
        const event = {
          event_type: 'conversation_toolcall',
          data: {
            name: 'fetch_video',
            arguments: '{"title": "Strategic Planning Overview"}'
          }
        };

        const result = parseToolCallFromEvent(event);
        expect(result.toolName).toBe('fetch_video');
        expect(result.toolArgs).toEqual({ title: 'Strategic Planning Overview' });
      });

      it('handles quoted command titles', () => {
        const event = {
          event_type: 'conversation_toolcall',
          data: {
            name: 'fetch_video',
            arguments: '{"title": "\\"pause\\""}'
          }
        };

        const result = parseToolCallFromEvent(event);
        expect(result.toolName).toBe('pause_video');
        expect(result.toolArgs).toEqual({});
      });

      it('handles polite command titles', () => {
        const event = {
          event_type: 'conversation_toolcall',
          data: {
            name: 'fetch_video',
            arguments: '{"title": "please pause the video"}'
          }
        };

        const result = parseToolCallFromEvent(event);
        expect(result.toolName).toBe('pause_video');
        expect(result.toolArgs).toEqual({});
      });
    });
  });
});