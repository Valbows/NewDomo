/**
 * ============================================================================
 * ⚠️  DOMO SCORE DEPENDENCY - DO NOT MODIFY WITHOUT TESTING SCORE ⚠️
 * ============================================================================
 *
 * These handlers write to tables that directly affect Domo Score:
 *   - handleProductInterestDiscovery → product_interest_data → "Reason For Visit" criterion
 *   - handleContactInfoCollection → qualification_data → "Contact Confirmation" criterion
 *   - handleVideoShowcaseObjective → video_showcase_data → "Platform Feature Interest" criterion
 *
 * Before modifying these handlers:
 *   1. Run existing tests: npm run test:all
 *   2. After changes, verify Domo Score still calculates correctly
 *   3. Test with a real Tavus webhook event
 *
 * See: src/lib/domo-score/index.ts for centralized Domo Score documentation
 * ============================================================================
 */

export async function handleProductInterestDiscovery(
  supabase: any,
  conversationId: string,
  objectiveName: string,
  outputVariables: any,
  event: any
): Promise<void> {
  try {
    // Store product interest data
    // Handle pain_points - convert to array if it's a string
    let painPointsArray = null;
    if (outputVariables.pain_points) {
      if (Array.isArray(outputVariables.pain_points)) {
        painPointsArray = outputVariables.pain_points;
      } else if (typeof outputVariables.pain_points === 'string') {
        painPointsArray = [outputVariables.pain_points];
      }
    }

    const { error: insertError } = await supabase
      .from('product_interest_data')
      .insert({
        conversation_id: conversationId,
        objective_name: objectiveName,
        primary_interest: outputVariables.primary_interest || null,
        pain_points: painPointsArray,
        event_type: event.event_type,
        raw_payload: event,
        received_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Failed to store product interest data:', insertError);
    } else {
    }
  } catch (error) {
    console.error('Error processing product interest discovery:', error);
  }
}

export async function handleContactInfoCollection(
  supabase: any,
  conversationId: string,
  objectiveName: string,
  outputVariables: any,
  event: any
): Promise<void> {

  try {
    const { error: insertError } = await supabase
      .from('qualification_data')
      .insert({
        conversation_id: conversationId,
        first_name: outputVariables.first_name || null,
        last_name: outputVariables.last_name || null,
        email: outputVariables.email || null,
        position: outputVariables.position || null,
        objective_name: objectiveName,
        event_type: event.event_type,
        raw_payload: event,
        received_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('❌ Failed to store qualification data:', insertError);
    } else {
    }
  } catch (error) {
    console.error('❌ Error processing contact information collection:', error);
  }
}

export async function handleVideoShowcaseObjective(
  supabase: any,
  conversationId: string,
  outputVariables: any,
  event: any
): Promise<void> {
  try {
    // Normalize arrays
    const shown = outputVariables?.videos_shown;
    const shownArray = Array.isArray(shown) ? shown : (typeof shown === 'string' ? [shown] : null);

    // Read existing record (if any)
    const { data: existingShowcase } = await supabase
      .from('video_showcase_data')
      .select('id, videos_shown')
      .eq('conversation_id', conversationId)
      .single();

    const prevShown = Array.isArray(existingShowcase?.videos_shown)
      ? (existingShowcase!.videos_shown as string[])
      : [];

    const updatedShown = Array.from(new Set([...(prevShown || []), ...(shownArray || [])].filter(Boolean)));

    const payload = {
      conversation_id: conversationId,
      objective_name: 'demo_video_showcase',
      videos_shown: updatedShown.length ? updatedShown : null,
      event_type: event.event_type,
      raw_payload: event,
      received_at: new Date().toISOString(),
    } as any;

    if (existingShowcase?.id) {
      const { error: updateErr } = await supabase
        .from('video_showcase_data')
        .update({
          videos_shown: payload.videos_shown,
          raw_payload: payload.raw_payload,
          received_at: payload.received_at,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingShowcase.id);

      if (updateErr) {
        console.error('❌ Failed to update video_showcase_data:', updateErr);
      } else {
      }
    } else {
      const { error: insertErr } = await supabase
        .from('video_showcase_data')
        .insert(payload);

      if (insertErr) {
        console.error('❌ Failed to insert video_showcase_data:', insertErr);
      } else {
      }
    }
  } catch (error) {
    console.error('❌ Error processing video showcase objective:', error);
  }
}
