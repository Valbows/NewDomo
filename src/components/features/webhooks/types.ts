/**
 * Type definitions for webhooks feature components
 */

export interface WebhookUrlDisplayProps {
  url: string;
  label?: string;
  showCopy?: boolean;
  showQR?: boolean;
  className?: string;
}

export interface WebhookEvent {
  id: string;
  type: string;
  payload: Record<string, any>;
  timestamp: string;
  status: 'pending' | 'processed' | 'failed';
  retries?: number;
}

export interface WebhookLogProps {
  events: WebhookEvent[];
  loading?: boolean;
  onRetry?: (eventId: string) => void;
  onClear?: () => void;
}

export interface WebhookConfigProps {
  url: string;
  onUrlChange: (url: string) => void;
  onTest?: () => void;
  testing?: boolean;
}

// Webhook event types
export const WEBHOOK_EVENT_TYPES = {
  CONVERSATION_START: 'conversation.start',
  CONVERSATION_END: 'conversation.end',
  CTA_CLICK: 'cta.click',
  TOOL_CALL: 'tool.call',
  ERROR: 'error',
} as const;

// Webhook status options
export const WEBHOOK_STATUSES = ['pending', 'processed', 'failed'] as const;