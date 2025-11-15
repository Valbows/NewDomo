import { sanitizeAnalyticsPayload } from '@/lib/tavus/analytics';

describe('sanitizeAnalyticsPayload', () => {
  test('redacts emails and phone numbers inside strings', () => {
    const input = {
      note: 'Contact me at john.doe@example.com or +1-555-123-4567',
      nested: {
        s: 'Send to jane+test@sub.mail.co.uk and (212) 555 1212 please',
      },
    };

    const out = sanitizeAnalyticsPayload(input);
    expect(out.note).toContain('[REDACTED_EMAIL]');
    expect(out.note).toContain('[REDACTED_PHONE]');
    expect(out.nested.s).toContain('[REDACTED_EMAIL]');
    expect(out.nested.s).toContain('[REDACTED_PHONE]');
  });

  test('prunes heavy media/transcript keys and redacts sensitive-keyed fields', () => {
    const input = {
      transcript: 'very long transcript data',
      utterances: ['u1', 'u2'],
      raw: { anything: 'big' },
      audio: { blob: '...' },
      media: 'big media',
      video: 'frames',
      frames: [1, 2, 3],
      email: 'should be removed',
      user: { name: 'Alice', email: 'alice@example.com' },
      details: {
        phoneNumber: '123-456-7890',
        speaker_label: 'agent-1',
      },
      keep: 'ok',
    };

    const out = sanitizeAnalyticsPayload(input);

    // Pruned keys
    for (const k of ['transcript', 'utterances', 'raw', 'audio', 'media', 'video', 'frames']) {
      expect(out[k]).toBe('[REDACTED]');
    }

    // Redacted sensitive-keyed fields
    expect(out.email).toBe('[REDACTED]');
    expect(out.user).toBe('[REDACTED]');
    expect(out.details.phoneNumber).toBe('[REDACTED]');
    expect(out.details.speaker_label).toBe('[REDACTED]');

    // Non-sensitive key is preserved
    expect(out.keep).toBe('ok');
  });

  test('caps arrays to 50 items', () => {
    const arr = Array.from({ length: 120 }, (_, i) => `item-${i}`);
    const input = { arr };
    const out = sanitizeAnalyticsPayload(input);
    expect(Array.isArray(out.arr)).toBe(true);
    expect(out.arr.length).toBe(50);
    // ensure redaction still applies within arrays
    const withPhones = { arr: ['Call me at +49 160 1234567', 'no phone'] };
    const out2 = sanitizeAnalyticsPayload(withPhones);
    expect(out2.arr[0]).toContain('[REDACTED_PHONE]');
  });

  test('caps object keys to 100', () => {
    const big: Record<string, any> = {};
    for (let i = 0; i < 130; i++) big[`k${i}`] = i;
    const out = sanitizeAnalyticsPayload(big);
    expect(Object.keys(out).length).toBe(100);
  });

  test('handles null and undefined gracefully', () => {
    expect(sanitizeAnalyticsPayload(null)).toBeNull();
    const out = sanitizeAnalyticsPayload({ a: undefined, b: null });
    // undefined remains undefined on traversal; key still exists
    expect(Object.prototype.hasOwnProperty.call(out, 'a')).toBe(true);
    expect(out.a).toBeUndefined();
    expect(out.b).toBeNull();
  });
});
