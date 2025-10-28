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

  test('normalizes short alias tool name in conversation_toolcall (pause -> pause_video)', () => {
    const event = {
      event_type: 'conversation_toolcall',
      data: { name: 'pause' },
    };
    const res = parseToolCallFromEvent(event);
    expect(res.toolName).toBe('pause_video');
    // alias normalization returns an empty args object
    expect(res.toolArgs).toEqual({});
  });

  test('remaps fetch_video with command-like title to control tool ("pause")', () => {
    const event = {
      event_type: 'conversation_toolcall',
      data: { name: 'fetch_video', args: '"pause"' },
    };
    const res = parseToolCallFromEvent(event);
    expect(res.toolName).toBe('pause_video');
    expect(res.toolArgs).toEqual({});
  });

  test('remaps fetch_video with bare command-like title to control tool (close)', () => {
    const event = {
      event_type: 'conversation_toolcall',
      data: { name: 'fetch_video', args: 'close' },
    };
    const res = parseToolCallFromEvent(event);
    expect(res.toolName).toBe('close_video');
    expect(res.toolArgs).toEqual({});
  });

  test('transcription_ready normalizes short alias tool name (resume/play -> play_video)', () => {
    const event = {
      event_type: 'application.transcription_ready',
      data: {
        transcript: [
          {
            role: 'assistant',
            tool_calls: [
              { function: { name: 'resume', arguments: '' } },
            ],
          },
        ],
      },
    };
    const res = parseToolCallFromEvent(event);
    expect(res.toolName).toBe('play_video');
    expect(res.toolArgs).toEqual({});
  });

  test('transcription_ready remaps fetch_video when argument is a control command', () => {
    const event = {
      event_type: 'application.transcription_ready',
      data: {
        transcript: [
          {
            role: 'assistant',
            tool_calls: [
              { function: { name: 'fetch_video', arguments: '"next"' } },
            ],
          },
        ],
      },
    };
    const res = parseToolCallFromEvent(event);
    expect(res.toolName).toBe('next_video');
    expect(res.toolArgs).toEqual({});
  });

  test('utterance maps natural language command to canonical tool ("pause the video")', () => {
    const prev = process.env.NEXT_PUBLIC_TAVUS_TOOLCALL_TEXT_FALLBACK;
    process.env.NEXT_PUBLIC_TAVUS_TOOLCALL_TEXT_FALLBACK = 'true';
    const event = {
      event_type: 'utterance',
      data: { speech: 'Pause the video.' },
    };
    const res = parseToolCallFromEvent(event);
    expect(res.toolName).toBe('pause_video');
    expect(res.toolArgs).toEqual({});
    if (prev === undefined) delete process.env.NEXT_PUBLIC_TAVUS_TOOLCALL_TEXT_FALLBACK; else process.env.NEXT_PUBLIC_TAVUS_TOOLCALL_TEXT_FALLBACK = prev;
  });

  test('utterance maps function-style short call pause() to canonical tool', () => {
    const prev = process.env.NEXT_PUBLIC_TAVUS_TOOLCALL_TEXT_FALLBACK;
    process.env.NEXT_PUBLIC_TAVUS_TOOLCALL_TEXT_FALLBACK = 'true';
    const event = {
      event_type: 'conversation_utterance',
      data: { speech: 'pause()' },
    };
    const res = parseToolCallFromEvent(event);
    expect(res.toolName).toBe('pause_video');
    expect(res.toolArgs).toEqual({});
    if (prev === undefined) delete process.env.NEXT_PUBLIC_TAVUS_TOOLCALL_TEXT_FALLBACK; else process.env.NEXT_PUBLIC_TAVUS_TOOLCALL_TEXT_FALLBACK = prev;
  });

  test('utterance remaps fetch_video("close") to control tool close_video', () => {
    const prev = process.env.NEXT_PUBLIC_TAVUS_TOOLCALL_TEXT_FALLBACK;
    process.env.NEXT_PUBLIC_TAVUS_TOOLCALL_TEXT_FALLBACK = 'true';
    const event = {
      event_type: 'conversation_utterance',
      data: { speech: 'fetch_video("close")' },
    };
    const res = parseToolCallFromEvent(event);
    expect(res.toolName).toBe('close_video');
    expect(res.toolArgs).toEqual({});
    if (prev === undefined) delete process.env.NEXT_PUBLIC_TAVUS_TOOLCALL_TEXT_FALLBACK; else process.env.NEXT_PUBLIC_TAVUS_TOOLCALL_TEXT_FALLBACK = prev;
  });

  test('utterance parsing returns null when fallback disabled', () => {
    const prevFallback = process.env.NEXT_PUBLIC_TAVUS_TOOLCALL_TEXT_FALLBACK;
    const prevE2E = process.env.NEXT_PUBLIC_E2E_TEST_MODE;
    process.env.NEXT_PUBLIC_TAVUS_TOOLCALL_TEXT_FALLBACK = 'false';
    process.env.NEXT_PUBLIC_E2E_TEST_MODE = 'false';
    const event = {
      event_type: 'utterance',
      data: { speech: 'pause()' },
    };
    const res = parseToolCallFromEvent(event);
    expect(res.toolName).toBeNull();
    expect(res.toolArgs).toBeNull();
    // restore
    if (prevFallback === undefined) delete process.env.NEXT_PUBLIC_TAVUS_TOOLCALL_TEXT_FALLBACK; else process.env.NEXT_PUBLIC_TAVUS_TOOLCALL_TEXT_FALLBACK = prevFallback;
    if (prevE2E === undefined) delete process.env.NEXT_PUBLIC_E2E_TEST_MODE; else process.env.NEXT_PUBLIC_E2E_TEST_MODE = prevE2E;
  });
});
