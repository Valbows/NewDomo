import crypto from 'crypto';

export async function checkAndRecordIdempotency(
  supabase: any,
  event: any,
  rawBody: string
): Promise<boolean> {
  try {
    const eventIdCandidate =
      event?.id || event?.event_id || event?.data?.id || event?.data?.event_id;
    const eventId = String(
      eventIdCandidate || crypto.createHash('sha256').update(rawBody).digest('hex')
    );

    const { data: existing } = await supabase
      .from('processed_webhook_events')
      .select('event_id')
      .eq('event_id', eventId)
      .single();

    if (existing?.event_id) {
      return true; // Is duplicate
    }

    await supabase
      .from('processed_webhook_events')
      .insert({ event_id: eventId });

    return false; // Not a duplicate
  } catch (idemErr) {
    // Do not fail the webhook if idempotency table is missing or other non-critical errors occur
    console.warn('Idempotency check/insert failed (non-fatal):', idemErr);
    return false; // Assume not duplicate on error
  }
}
