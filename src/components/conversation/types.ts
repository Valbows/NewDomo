/**
 * Shared types for conversation components
 */

/**
 * Represents a single message in the conversation transcript
 */
export interface TranscriptMessage {
  /** Unique identifier for the message */
  id: string;
  /** Who sent this message */
  role: 'user' | 'assistant';
  /** The message content */
  content: string;
  /** When the message was sent */
  timestamp: Date;
}

/**
 * Speaking status for the agent
 */
export type SpeakingStatus = 'listening' | 'speaking' | 'processing';
