/**
 * HubSpot Sync Orchestration
 *
 * Handles the synchronization of contact data from Domo to HubSpot CRM.
 * This module provides the main sync function with error handling and logging.
 */

import { createOrUpdateContact, isHubSpotEnabled } from './index';
import type { DomoContactData, HubSpotSyncResult } from './types';
import { logError } from '../errors';

/**
 * Sync a contact to HubSpot CRM
 *
 * This is the main orchestration function that:
 * 1. Checks if HubSpot integration is enabled
 * 2. Validates the contact data (email required)
 * 3. Creates or updates the contact in HubSpot
 * 4. Logs the sync result to Supabase (if client provided)
 *
 * @param contactData - Contact information from the demo
 * @param supabase - Optional Supabase client for sync logging
 * @returns Sync result indicating success/failure and action taken
 */
export async function syncContactToHubSpot(
  contactData: DomoContactData,
  supabase?: any
): Promise<HubSpotSyncResult> {
  // Check if HubSpot is enabled
  if (!isHubSpotEnabled()) {
    return {
      success: true,
      action: 'skipped',
      error: 'HubSpot integration not configured',
    };
  }

  // Validate required fields
  if (!contactData.email) {
    return {
      success: false,
      action: 'skipped',
      error: 'Email is required for HubSpot sync',
    };
  }

  try {
    // Perform the sync
    const { contact, action } = await createOrUpdateContact(contactData);

    const result: HubSpotSyncResult = {
      success: true,
      contactId: contact.id,
      action,
    };

    // Log to Supabase if client provided
    if (supabase) {
      await logSyncResult(supabase, contactData, result);
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logError(error, 'HubSpot sync failed');

    const result: HubSpotSyncResult = {
      success: false,
      action: 'failed',
      error: errorMessage,
    };

    // Log failure to Supabase if client provided
    if (supabase) {
      await logSyncResult(supabase, contactData, result);
    }

    return result;
  }
}

/**
 * Log sync result to the hubspot_sync_log table
 */
async function logSyncResult(
  supabase: any,
  contactData: DomoContactData,
  result: HubSpotSyncResult
): Promise<void> {
  try {
    await supabase.from('hubspot_sync_log').insert({
      demo_id: contactData.demoId || null,
      conversation_id: contactData.conversationId || null,
      email: contactData.email,
      hubspot_contact_id: result.contactId || null,
      action: result.action,
      success: result.success,
      error_message: result.error || null,
      synced_at: new Date().toISOString(),
    });
  } catch (logError) {
    // Don't throw on log failure - sync already succeeded/failed
    console.error('Failed to log HubSpot sync result:', logError);
  }
}

/**
 * Fire-and-forget wrapper for HubSpot sync
 *
 * Use this when you don't want to block the calling code
 * (e.g., in webhook handlers where response time matters)
 */
export function syncContactToHubSpotAsync(
  contactData: DomoContactData,
  supabase?: any
): void {
  // Fire and forget - don't await
  syncContactToHubSpot(contactData, supabase).catch((error) => {
    logError(error, 'Async HubSpot sync failed');
  });
}
