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

import { broadcastToDemo } from '../utils/broadcast';
import { syncContactToHubSpotAsync } from '@/lib/hubspot/sync';

/**
 * Normalize a spoken email address to proper format.
 * Converts common speech-to-text patterns:
 * - "at" / "at sign" → "@"
 * - "dot" → "."
 * - Removes extra spaces
 *
 * Examples:
 * - "john at gmail dot com" → "john@gmail.com"
 * - "john at sign gmail dot com" → "john@gmail.com"
 * - "john.doe at company dot co dot uk" → "john.doe@company.co.uk"
 */
function normalizeSpokenEmail(email: string | null | undefined): string | null {
  if (!email) return null;

  let normalized = email
    .toLowerCase()
    .trim()
    // Handle "at sign" or "at-sign" first (before handling plain "at")
    .replace(/\s*at[\s-]*sign\s*/gi, '@')
    // Handle " at " with spaces (to avoid replacing "at" in words like "chat")
    .replace(/\s+at\s+/gi, '@')
    // Handle "dot com", "dot org", etc. with space
    .replace(/\s+dot\s+/gi, '.')
    // Handle any remaining spaces around @ or .
    .replace(/\s*@\s*/g, '@')
    .replace(/\s*\.\s*/g, '.')
    // Remove any remaining spaces (email should have none)
    .replace(/\s+/g, '');

  // Basic validation - should have @ and at least one dot after @
  const atIndex = normalized.indexOf('@');
  const hasDotAfterAt = atIndex > 0 && normalized.indexOf('.', atIndex) > atIndex;

  if (atIndex > 0 && hasDotAfterAt) {
    return normalized;
  }

  // If still doesn't look like an email, return original (trimmed)
  return email.trim();
}

/**
 * Helper to resolve demoId from a Tavus conversationId.
 *
 * This is needed because webhooks only receive the conversationId, but
 * real-time broadcasts require the demoId (used as channel name).
 *
 * Lookup Strategy:
 * 1. First tries demos table (tavus_conversation_id column)
 * 2. Falls back to conversation_details table if not found
 *
 * @param supabase - Supabase client instance
 * @param conversationId - Tavus conversation ID from the webhook payload
 * @returns The demo ID if found, null otherwise
 */
async function getDemoIdFromConversation(supabase: any, conversationId: string): Promise<string | null> {
  // Primary lookup: demos table has direct reference to conversation
  const { data: demo } = await supabase
    .from('demos')
    .select('id')
    .eq('tavus_conversation_id', conversationId)
    .maybeSingle();

  if (demo?.id) {
    return demo.id;
  }

  // Fallback lookup: conversation_details table for complex scenarios
  const { data: convDetails } = await supabase
    .from('conversation_details')
    .select('demo_id')
    .eq('tavus_conversation_id', conversationId)
    .maybeSingle();

  return convDetails?.demo_id || null;
}

/**
 * Handles the product_interest_discovery objective completion.
 *
 * Stores the visitor's primary interest and pain points to product_interest_data table.
 * Then broadcasts a 'topics_captured' event for real-time insights panel updates.
 *
 * Output Variables Expected:
 * - primary_interest: string (e.g., "Analytics Dashboard")
 * - pain_points: string | string[] (e.g., ["Manual reporting", "Data silos"])
 *
 * Broadcasts: 'topics_captured' event to demo-{demoId} channel
 *
 * @affects Domo Score - "Reason For Visit" criterion
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
      // Broadcast topics captured for real-time insights panel update
      const demoId = await getDemoIdFromConversation(supabase, conversationId);
      if (demoId) {
        await broadcastToDemo(supabase, demoId, 'topics_captured', {
          primary_interest: outputVariables.primary_interest || null,
          pain_points: painPointsArray || [],
        });
      }
    }
  } catch (error) {
    console.error('Error processing product interest discovery:', error);
  }
}

/**
 * Handles the contact_information_collection objective completion.
 *
 * Stores visitor qualification data (name, email, position) to qualification_data table.
 * Then broadcasts individual 'field_captured' events for each captured field,
 * enabling real-time granular updates in the insights panel.
 *
 * Output Variables Expected:
 * - first_name: string
 * - last_name: string
 * - email: string
 * - position: string (job title/role)
 *
 * Broadcasts: 'field_captured' event for each non-null field to demo-{demoId} channel
 * Field names are mapped to camelCase for frontend consistency:
 *   - first_name → firstName
 *   - last_name → lastName
 *   - email → email
 *   - position → position
 *
 * @affects Domo Score - "Contact Confirmation" criterion
 */
export async function handleContactInfoCollection(
  supabase: any,
  conversationId: string,
  objectiveName: string,
  outputVariables: any,
  event: any
): Promise<void> {
  try {
    // Normalize spoken email to proper format (e.g., "john at gmail dot com" → "john@gmail.com")
    const normalizedEmail = normalizeSpokenEmail(outputVariables.email);

    const { error: insertError } = await supabase
      .from('qualification_data')
      .insert({
        conversation_id: conversationId,
        first_name: outputVariables.first_name || null,
        last_name: outputVariables.last_name || null,
        email: normalizedEmail,
        position: outputVariables.position || null,
        objective_name: objectiveName,
        event_type: event.event_type,
        raw_payload: event,
        received_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Failed to store qualification data:', insertError);
    } else {
      // Broadcast field captures for real-time insights panel update
      const demoId = await getDemoIdFromConversation(supabase, conversationId);
      if (demoId) {
        // Broadcast each captured field individually for granular updates
        if (outputVariables.first_name) {
          await broadcastToDemo(supabase, demoId, 'field_captured', {
            field: 'firstName',
            value: outputVariables.first_name,
          });
        }
        if (outputVariables.last_name) {
          await broadcastToDemo(supabase, demoId, 'field_captured', {
            field: 'lastName',
            value: outputVariables.last_name,
          });
        }
        if (normalizedEmail) {
          await broadcastToDemo(supabase, demoId, 'field_captured', {
            field: 'email',
            value: normalizedEmail,
          });
        }
        if (outputVariables.position) {
          await broadcastToDemo(supabase, demoId, 'field_captured', {
            field: 'position',
            value: outputVariables.position,
          });
        }

        // Sync contact to HubSpot CRM (fire-and-forget, non-blocking)
        if (normalizedEmail) {
          syncContactToHubSpotAsync(
            {
              firstName: outputVariables.first_name || undefined,
              lastName: outputVariables.last_name || undefined,
              email: normalizedEmail,
              position: outputVariables.position || undefined,
              demoId,
              conversationId,
            },
            supabase
          );
        }
      }
    }
  } catch (error) {
    console.error('Error processing contact information collection:', error);
  }
}

/**
 * Handles the demo_video_showcase objective completion.
 *
 * Tracks which videos have been shown during the demo conversation.
 * Uses upsert logic: updates existing record if found, otherwise inserts new.
 * Merges new videos with previously shown videos (no duplicates).
 *
 * Output Variables Expected:
 * - videos_shown: string | string[] (video title or array of titles)
 *
 * Note: This handler does NOT broadcast real-time events because video tracking
 * in the insights panel is handled locally by DemoExperienceView when the
 * fetch_video tool is called (faster feedback than waiting for webhook).
 *
 * @affects Domo Score - "Platform Feature Interest" criterion
 */
export async function handleVideoShowcaseObjective(
  supabase: any,
  conversationId: string,
  outputVariables: any,
  event: any
): Promise<void> {
  try {
    // Normalize videos_shown to array format (handles both string and array inputs)
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
