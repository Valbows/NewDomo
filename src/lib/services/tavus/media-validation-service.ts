/**
 * Media Validation Service
 * Handles validation of media requests and parameters
 */

import {TavusClient} from './tavus-client';

export class MediaValidationService {
  private client: TavusClient;

  constructor(client: TavusClient) {
    this.client = client;
  }

  /**
   * Validate video title
   */
  validateVideoTitle(videoTitle: string): { valid: boolean; error?: string } {
    if (!videoTitle || typeof videoTitle !== 'string') {
      return {
        valid: false,
        error: 'Video title is required and must be a string',
      };
    }

    const cleanTitle = videoTitle.trim().replace(/^['&quot;]|['&quot;]$/g, '');
    
    if (!cleanTitle) {
      return {
        valid: false,
        error: 'Video title cannot be empty',
      };
    }

    return { valid: true };
  }

  /**
   * Validate video request parameters
   */
  validateVideoRequest(request: any): { valid: boolean; error?: string } {
    if (!request) {
      return {
        valid: false,
        error: 'Video request is required',
      };
    }

    const { video_title, conversation_id } = request;

    // Validate video title
    const titleValidation = this.validateVideoTitle(video_title);
    if (!titleValidation.valid) {
      return titleValidation;
    }

    // Validate conversation ID
    if (!conversation_id || typeof conversation_id !== 'string') {
      return {
        valid: false,
        error: 'Conversation ID is required and must be a string',
      };
    }

    return { valid: true };
  }

  /**
   * Validate storage URL format
   */
  validateStorageUrl(storageUrl: string): { valid: boolean; error?: string } {
    if (!storageUrl || typeof storageUrl !== 'string') {
      return {
        valid: false,
        error: 'Storage URL is required and must be a string',
      };
    }

    const trimmedUrl = storageUrl.trim();
    if (!trimmedUrl) {
      return {
        valid: false,
        error: 'Storage URL cannot be empty',
      };
    }

    // Basic URL format validation
    if (!trimmedUrl.includes('/') || trimmedUrl.startsWith('/')) {
      return {
        valid: false,
        error: 'Invalid storage URL format',
      };
    }

    return { valid: true };
  }

  /**
   * Validate demo ID format
   */
  validateDemoId(demoId: string): { valid: boolean; error?: string } {
    if (!demoId || typeof demoId !== 'string') {
      return {
        valid: false,
        error: 'Demo ID is required and must be a string',
      };
    }

    const trimmedId = demoId.trim();
    if (!trimmedId) {
      return {
        valid: false,
        error: 'Demo ID cannot be empty',
      };
    }

    return { valid: true };
  }

  /**
   * Validate conversation ID format
   */
  validateConversationId(conversationId: string): { valid: boolean; error?: string } {
    if (!conversationId || typeof conversationId !== 'string') {
      return {
        valid: false,
        error: 'Conversation ID is required and must be a string',
      };
    }

    const trimmedId = conversationId.trim();
    if (!trimmedId) {
      return {
        valid: false,
        error: 'Conversation ID cannot be empty',
      };
    }

    return { valid: true };
  }

  /**
   * Validate signed URL expiry time
   */
  validateExpiryTime(expirySeconds: number): { valid: boolean; error?: string } {
    if (typeof expirySeconds !== 'number' || isNaN(expirySeconds)) {
      return {
        valid: false,
        error: 'Expiry time must be a valid number',
      };
    }

    if (expirySeconds <= 0) {
      return {
        valid: false,
        error: 'Expiry time must be positive',
      };
    }

    // Maximum 24 hours
    if (expirySeconds > 86400) {
      return {
        valid: false,
        error: 'Expiry time cannot exceed 24 hours',
      };
    }

    return { valid: true };
  }

  /**
   * Validate broadcast channel name
   */
  validateChannelName(channelName: string): { valid: boolean; error?: string } {
    if (!channelName || typeof channelName !== 'string') {
      return {
        valid: false,
        error: 'Channel name is required and must be a string',
      };
    }

    const trimmedName = channelName.trim();
    if (!trimmedName) {
      return {
        valid: false,
        error: 'Channel name cannot be empty',
      };
    }

    // Basic format validation for demo channels
    if (!trimmedName.startsWith('demo-')) {
      return {
        valid: false,
        error: 'Channel name must start with "demo-"',
      };
    }

    return { valid: true };
  }
}

/**
 * Create a new media validation service instance
 */
export function createMediaValidationService(client: TavusClient): MediaValidationService {
  return new MediaValidationService(client);
}