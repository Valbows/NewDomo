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

  test('returns null toolArgs when tool args are malformed in transcript', () => {
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
    expect(res.toolArgs).toBeNull();
  });

  test('parses utterance with known tool name (no args)', () => {
    const prev = process.env.NEXT_PUBLIC_TAVUS_TOOLCALL_TEXT_FALLBACK;
    process.env.NEXT_PUBLIC_TAVUS_TOOLCALL_TEXT_FALLBACK = 'true';
    const event = {
      event_type: 'utterance',
      data: { speech: 'show_trial_cta' },
    };
    const res = parseToolCallFromEvent(event);
    expect(res.toolName).toBe('show_trial_cta');
    expect(res.toolArgs).toEqual({});
    if (prev === undefined) delete process.env.NEXT_PUBLIC_TAVUS_TOOLCALL_TEXT_FALLBACK; else process.env.NEXT_PUBLIC_TAVUS_TOOLCALL_TEXT_FALLBACK = prev;
  });

  test('parses utterance with function-style call and JSON args', () => {
    const prev = process.env.NEXT_PUBLIC_TAVUS_TOOLCALL_TEXT_FALLBACK;
    process.env.NEXT_PUBLIC_TAVUS_TOOLCALL_TEXT_FALLBACK = 'true';
    const event = {
      event_type: 'conversation_utterance',
      data: { speech: 'fetch_video({"video_title":"Intro"})' },
    };
    const res = parseToolCallFromEvent(event);
    expect(res.toolName).toBe('fetch_video');
    expect(res.toolArgs).toEqual({ video_title: 'Intro' });
    if (prev === undefined) delete process.env.NEXT_PUBLIC_TAVUS_TOOLCALL_TEXT_FALLBACK; else process.env.NEXT_PUBLIC_TAVUS_TOOLCALL_TEXT_FALLBACK = prev;
  });

  test('returns null tool for non-actionable events', () => {
    const event = { event_type: 'ping', data: {} };
    const res = parseToolCallFromEvent(event);
    expect(res.toolName).toBeNull();
    expect(res.toolArgs).toBeNull();
  });

  test('parses conversation_toolcall with bare string argument (non-JSON, non-quoted)', () => {
    const event = {
      event_type: 'conversation_toolcall',
      data: { name: 'fetch_video', args: 'Strategic Planning' },
    };
    const res = parseToolCallFromEvent(event);
    expect(res.toolName).toBe('fetch_video');
    expect(res.toolArgs).toEqual({ title: 'Strategic Planning' });
  });

  test('parses conversation.tool_call with properties name/arguments JSON', () => {
    const event = {
      event_type: 'conversation.tool_call',
      data: {
        properties: {
          name: 'fetch_video',
          arguments: '{"title":"Intro 2"}',
        },
      },
    };
    const res = parseToolCallFromEvent(event);
    expect(res.toolName).toBe('fetch_video');
    expect(res.toolArgs).toEqual({ title: 'Intro 2' });
  });

  test('parses conversation.tool_call with properties args object', () => {
    const event = {
      event_type: 'conversation.tool_call',
      data: {
        properties: {
          name: 'fetch_video',
          args: { title: 'Intro 3' },
        },
      },
    };
    const res = parseToolCallFromEvent(event);
    expect(res.toolName).toBe('fetch_video');
    expect(res.toolArgs).toEqual({ title: 'Intro 3' });
  });

  test('parses conversation_toolcall with no-arg tool (pause_video)', () => {
    const event = {
      event_type: 'conversation_toolcall',
      data: { name: 'pause_video' },
    };
    const res = parseToolCallFromEvent(event);
    expect(res.toolName).toBe('pause_video');
    expect(res.toolArgs).toBeNull();
  });

  test('parses conversation.tool_call properties with no-arg tool (next_video)', () => {
    const event = {
      event_type: 'conversation.tool_call',
      data: {
        properties: {
          name: 'next_video',
        },
      },
    };
    const res = parseToolCallFromEvent(event);
    expect(res.toolName).toBe('next_video');
    expect(res.toolArgs).toBeNull();
  });

  test('parses transcription_ready tool call with empty string args for play_video', () => {
    const event = {
      event_type: 'application.transcription_ready',
      data: {
        transcript: [
          {
            role: 'assistant',
            tool_calls: [
              { function: { name: 'play_video', arguments: '' } },
            ],
          },
        ],
      },
    };
    const res = parseToolCallFromEvent(event);
    expect(res.toolName).toBe('play_video');
    expect(res.toolArgs).toEqual({});
  });
});
