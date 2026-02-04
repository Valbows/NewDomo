/**
 * HubSpot CRM Integration Types
 *
 * TypeScript interfaces for HubSpot contact sync functionality.
 */

/**
 * HubSpot contact properties that we sync from Domo
 */
export interface HubSpotContactProperties {
  email: string;
  firstname?: string;
  lastname?: string;
  jobtitle?: string;
  domo_demo_id?: string;
  domo_conversation_id?: string;
}

/**
 * HubSpot API contact response structure
 */
export interface HubSpotContact {
  id: string;
  properties: HubSpotContactProperties & {
    createdate?: string;
    lastmodifieddate?: string;
    hs_object_id?: string;
  };
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

/**
 * Result of a HubSpot sync operation
 */
export interface HubSpotSyncResult {
  success: boolean;
  contactId?: string;
  action: 'created' | 'updated' | 'skipped' | 'failed';
  error?: string;
}

/**
 * Configuration for HubSpot integration
 */
export interface HubSpotConfig {
  apiKey: string;
  enabled: boolean;
}

/**
 * Contact data from Domo to sync to HubSpot
 */
export interface DomoContactData {
  firstName?: string;
  lastName?: string;
  email: string;
  position?: string;
  demoId?: string;
  conversationId?: string;
}

/**
 * HubSpot API error response
 */
export interface HubSpotApiError {
  status: string;
  message: string;
  correlationId: string;
  category: string;
}

/**
 * HubSpot search request body
 */
export interface HubSpotSearchRequest {
  filterGroups: Array<{
    filters: Array<{
      propertyName: string;
      operator: string;
      value: string;
    }>;
  }>;
  properties: string[];
  limit: number;
}

/**
 * HubSpot search response
 */
export interface HubSpotSearchResponse {
  total: number;
  results: HubSpotContact[];
}
