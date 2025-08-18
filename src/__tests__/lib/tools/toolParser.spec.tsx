import { parseToolCallFromEvent } from '@/lib/tools/toolParser';

describe('parseToolCallFromEvent', () => {
  test('parses official conversation_toolcall event', () => {
    const event = {
      event_type: 'conversation_toolcall',
      data: { name: 'fetch_video', args: { video_title: 'Intro' } },
    };
    const res = parseToolCallFromEvent(event);
    expect(res.toolName).toBe('fetch_video');
    expect(res.toolArgs).toEqual({ video_title: 'Intro' });
  });

  test('parses transcription_ready with JSON tool args', () => {
    const event = {
      event_type: 'application.transcription_ready',
      data: {
        transcript: [
          { role: 'user', content: 'something' },
          {
            role: 'assistant',
            tool_calls: [
              { function: { name: 'fetch_video', arguments: '{"title":"Fourth Video"}' } },
            ],
          },
        ],
      },
    };

    const res = parseToolCallFromEvent(event);
    expect(res.toolName).toBe('fetch_video');
    expect(res.toolArgs).toEqual({ title: 'Fourth Video' });
  });

  test('falls back to default title when tool args are malformed in transcript', () => {
    const event = {
      event_type: 'application.transcription_ready',
      data: {
        transcript: [
          {
            role: 'assistant',
            tool_calls: [
              { function: { name: 'fetch_video', arguments: 'not-json' } },
            ],
          },
        ],
      },
    };

    const res = parseToolCallFromEvent(event);
    expect(res.toolName).toBe('fetch_video');
    expect(res.toolArgs).toEqual({ title: 'Fourth Video' });
  });

  test('parses utterance with known tool name (no args)', () => {
    const event = {
      event_type: 'utterance',
      data: { speech: 'show_trial_cta' },
    };

    const res = parseToolCallFromEvent(event);
    expect(res.toolName).toBe('show_trial_cta');
    expect(res.toolArgs).toEqual({});
  });

  test('parses utterance with function-style call and JSON args', () => {
    const event = {
      event_type: 'conversation_utterance',
      data: { speech: 'fetch_video({"video_title":"Intro"})' },
    };

    const res = parseToolCallFromEvent(event);
    expect(res.toolName).toBe('fetch_video');
    expect(res.toolArgs).toEqual({ video_title: 'Intro' });
  });

  test('returns null tool for non-actionable events', () => {
    const event = { event_type: 'ping', data: {} };
    const res = parseToolCallFromEvent(event);
    expect(res.toolName).toBeNull();
    expect(res.toolArgs).toBeNull();
  });
});
