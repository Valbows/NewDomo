/**
 * HubSpot CRM Integration
 *
 * This module provides contact creation and update capabilities
 * for syncing demo visitor information to HubSpot CRM.
 */

import type {
  HubSpotContact,
  HubSpotContactProperties,
  HubSpotSearchRequest,
  HubSpotSearchResponse,
  DomoContactData,
} from './types';

const HUBSPOT_API_KEY = process.env.HUBSPOT_API_KEY || '';
const HUBSPOT_BASE_URL = 'https://api.hubapi.com';

/**
 * Check if HubSpot integration is enabled
 */
export function isHubSpotEnabled(): boolean {
  return !!HUBSPOT_API_KEY;
}

/**
 * Make an authenticated request to the HubSpot API
 */
async function apiRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
  body?: unknown
): Promise<T> {
  const url = `${HUBSPOT_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `HubSpot API error: ${response.status}`;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorMessage;
    } catch {
      // Not JSON, use status code
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Search for a contact by email address
 */
export async function searchContactByEmail(email: string): Promise<HubSpotContact | null> {
  const searchRequest: HubSpotSearchRequest = {
    filterGroups: [
      {
        filters: [
          {
            propertyName: 'email',
            operator: 'EQ',
            value: email,
          },
        ],
      },
    ],
    properties: [
      'email',
      'firstname',
      'lastname',
      'jobtitle',
    ],
    limit: 1,
  };

  const response = await apiRequest<HubSpotSearchResponse>(
    '/crm/v3/objects/contacts/search',
    'POST',
    searchRequest
  );

  return response.results.length > 0 ? response.results[0] : null;
}

/**
 * Create a new contact in HubSpot
 */
async function createContact(properties: HubSpotContactProperties): Promise<HubSpotContact> {
  return apiRequest<HubSpotContact>(
    '/crm/v3/objects/contacts',
    'POST',
    { properties }
  );
}

/**
 * Update an existing contact in HubSpot
 */
async function updateContact(
  contactId: string,
  properties: Partial<HubSpotContactProperties>
): Promise<HubSpotContact> {
  return apiRequest<HubSpotContact>(
    `/crm/v3/objects/contacts/${contactId}`,
    'PATCH',
    { properties }
  );
}

/**
 * Create or update a contact in HubSpot based on email
 *
 * This performs an upsert operation:
 * - If a contact with the email exists, update their properties
 * - If no contact exists, create a new one
 *
 * Note: Only standard HubSpot properties are sent. Custom properties
 * (domo_demo_id, domo_conversation_id) require creating them in HubSpot first:
 * Settings → Data Management → Properties → Create property
 *
 * @param contactData - Contact information from Domo
 * @returns The created or updated HubSpot contact
 */
export async function createOrUpdateContact(
  contactData: DomoContactData
): Promise<{ contact: HubSpotContact; action: 'created' | 'updated' }> {
  // Build the properties object with standard HubSpot properties only
  // Custom properties (domo_demo_id, domo_conversation_id) require setup in HubSpot
  const properties: HubSpotContactProperties = {
    email: contactData.email,
  };

  if (contactData.firstName) {
    properties.firstname = contactData.firstName;
  }
  if (contactData.lastName) {
    properties.lastname = contactData.lastName;
  }
  if (contactData.position) {
    properties.jobtitle = contactData.position;
  }
  // Note: To use custom properties, create them in HubSpot first:
  // 1. Go to Settings → Data Management → Properties
  // 2. Create "domo_demo_id" (single-line text)
  // 3. Create "domo_conversation_id" (single-line text)
  // Then uncomment below:
  // if (contactData.demoId) {
  //   properties.domo_demo_id = contactData.demoId;
  // }
  // if (contactData.conversationId) {
  //   properties.domo_conversation_id = contactData.conversationId;
  // }

  // Check if contact already exists
  const existingContact = await searchContactByEmail(contactData.email);

  if (existingContact) {
    // Update existing contact
    const updatedContact = await updateContact(existingContact.id, properties);
    return { contact: updatedContact, action: 'updated' };
  }

  // Create new contact
  const newContact = await createContact(properties);
  return { contact: newContact, action: 'created' };
}

export default {
  isHubSpotEnabled,
  searchContactByEmail,
  createOrUpdateContact,
};
