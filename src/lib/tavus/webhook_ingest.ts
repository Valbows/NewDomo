import { sanitizeAnalyticsPayload } from '@/lib/tavus';

export function normalizeEventType(event: any): string {
  const eventTypeRaw = event?.event_type || event?.type || event?.data?.event_type || event?.data?.type || '';
  return typeof eventTypeRaw === 'string' ? eventTypeRaw.replace(/\./g, '_').toLowerCase() : '';
}

export function shouldIngestEvent(event: any): boolean {
  const t = normalizeEventType(event);
  const needles = [
    'conversation_completed',
    'conversation_complete',
    'conversation_ended',
    'conversation_end',
    'application_conversation_completed',
    'perception',
    'analytics',
    'summary_ready',
  ];
  return needles.some((n) => t.includes(n));
}

export function extractPerceptionPayload(event: any): any {
  // Support multiple shapes observed in Tavus docs and real-world events:
  // - Perception Analysis Event: event.properties.analysis (Per docs: application.perception_analysis)
  // - Generic perception/analytics/summary under data.* or top-level
  const properties = event?.properties || event?.data?.properties;
  if (properties?.analysis) {
    // If analysis is a string, wrap it in an object to keep structure consistent
    return typeof properties.analysis === 'string'
      ? { analysis: properties.analysis }
      : properties;
  }
  return (
    event?.data?.perception ??
    event?.perception ??
    properties ??
    event?.data?.analytics ??
    event?.analytics ??
    event?.data?.summary ??
    event?.summary ??
    event?.data ??
    {}
  );
}

export async function ingestAnalyticsForEvent(supabase: any, conversationId: string, event: any) {
  if (!conversationId) return;

  // 1) Find the demo associated with this conversation
  const { data: demo, error: demoError } = await supabase
    .from('demos')
    .select('id, metadata')
    .eq('tavus_conversation_id', conversationId)
    .single();

  if (demoError || !demo) {
    // swallow errors in ingest path; the route should still 200 to avoid retries
    return;
  }

  // 2) Extract and sanitize
  const payload = extractPerceptionPayload(event);
  const sanitized = sanitizeAnalyticsPayload(payload);

  // Normalize metadata to object (Supabase JSONB usually returns object, but guard if string)
  const rawMetadata = (demo as any).metadata;
  const metadataObj =
    typeof rawMetadata === 'string'
      ? (() => {
          try {
            return JSON.parse(rawMetadata);
          } catch {
            return {} as any;
          }
        })()
      : (rawMetadata || {});

  // 3) Merge into metadata.analytics
  const now = new Date().toISOString();
  const currentAnalytics = ((metadataObj as any)?.analytics as any) || {};
  const conversations = { ...(currentAnalytics.conversations || {}) } as Record<string, any>;
  const existing = conversations[conversationId] || {};
  conversations[conversationId] = {
    ...existing,
    perception: sanitized,
    updated_at: now,
  };

  const newAnalytics = {
    ...currentAnalytics,
    last_updated: now,
    conversations,
    last_perception_event: sanitized,
  };

  const newMetadata = {
    ...metadataObj,
    analytics: newAnalytics,
  } as any;

  const { error: updateError } = await supabase
    .from('demos')
    .update({ metadata: newMetadata })
    .eq('id', demo.id);

  if (updateError) {
    // Non-fatal: keep webhook 200, but log for diagnosis
    console.warn('Ingest: failed to update demo metadata', {
      demoId: demo.id,
      conversationId,
      error: updateError?.message || updateError,
    });
  }
}

