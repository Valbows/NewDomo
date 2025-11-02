/**
 * Tool Validation Utilities
 * Validation logic for tool names and arguments
 */

import {CANONICAL_TOOLS, KNOWN_TOOLS} from './tool-parsing-utils';

/**
 * Map short/alias command names to canonical tool names
 */
export function canonicalizeShortToolName(
  name: string | null | undefined
): string | null {
  if (!name || typeof name !== "string") return null;
  const n = name.trim().toLowerCase();
  
  if (
    n === "pause" ||
    n === "pause_video" ||
    n === "hold" ||
    n === "hold on" ||
    n === "pause the video" ||
    n === "pause video"
  ) {
    return "pause_video";
  }
  
  if (
    n === "resume" ||
    n === "play" ||
    n === "play_video" ||
    n === "continue" ||
    n === "unpause" ||
    n === "start" ||
    n === "start video" ||
    n === "resume video" ||
    n === "play the video" ||
    n === "play video"
  ) {
    return "play_video";
  }
  
  if (
    n === "next" ||
    n === "next_video" ||
    n === "skip" ||
    n === "skip video" ||
    n === "next video"
  ) {
    return "next_video";
  }
  
  if (
    n === "close" ||
    n === "close_video" ||
    n === "exit" ||
    n === "stop" ||
    n === "stop video" ||
    n === "end video" ||
    n === "hide video" ||
    n === "close the video" ||
    n === "close video"
  ) {
    return "close_video";
  }
  
  return null;
}

/**
 * Attempt to map a spoken utterance (free text) directly to a canonical tool
 */
export function mapUtteranceToCanonicalTool(
  speech: string | null | undefined
): string | null {
  if (!speech || typeof speech !== "string") return null;
  const text = speech
    .trim()
    .toLowerCase()
    .replace(/[.!?]+$/g, "")
    .replace(/\s+/g, " ");

  // 1) Exact match to known short/alias names
  const direct = canonicalizeShortToolName(text);
  if (direct) return direct;

  // 2) Guard against explicit negations to avoid accidental triggers
  const hasNegation =
    /\b(don't|do not|dont|no)\s+(pause|close|stop|end|hide|play|resume|continue|start|next|skip)\b/.test(
      text
    );
  if (hasNegation) return null;

  // 3) Keyword-based detection within longer utterances
  // Pause: allow generic "pause" or "hold on" without requiring the word "video"
  if (/\b(pause|hold(?:\s+on)?)\b/.test(text)) {
    return "pause_video";
  }
  // Play/Resume
  if (
    /\b(resume|play|continue|unpause|start)(?:\s+(?:the\s+)?video)?\b/.test(
      text
    )
  ) {
    return "play_video";
  }
  // Next/Skip
  if (/\b(next|skip)(?:\s+(?:the\s+)?video)?\b/.test(text)) {
    return "next_video";
  }
  // Close/Exit require explicit video context for generic verbs like stop/end/hide
  if (
    /\b(close|exit)\b(?:.*\bvideo\b)?/.test(text) ||
    /\b(stop|end|hide)\b\s+(?:the\s+)?video\b/.test(text)
  ) {
    return "close_video";
  }

  return null;
}

/**
 * Validate if a tool name is known/supported
 */
export function isKnownTool(toolName: string | null): boolean {
  return typeof toolName === "string" && KNOWN_TOOLS.includes(toolName);
}

/**
 * Validate if a tool name is canonical
 */
export function isCanonicalTool(toolName: string | null): boolean {
  return typeof toolName === "string" && CANONICAL_TOOLS.includes(toolName as any);
}

/**
 * Normalize event type for consistent processing
 */
export function normalizeEventType(eventTypeRaw: any): string {
  const eventType = typeof eventTypeRaw === "string" ? eventTypeRaw.toLowerCase() : "";
  return eventType.replace(/[.\-]/g, "_");
}

/**
 * Check if event type indicates a tool call
 */
export function isToolCallEvent(normalizedType: string): boolean {
  return (
    normalizedType === "conversation_toolcall" ||
    normalizedType === "conversation_tool_call" ||
    normalizedType === "tool_call" ||
    normalizedType.endsWith("_toolcall") ||
    normalizedType.endsWith("_tool_call") ||
    normalizedType.includes("tool_call")
  );
}

/**
 * Check if event type indicates a transcription event
 */
export function isTranscriptionEvent(normalizedType: string): boolean {
  return (
    normalizedType === "application_transcription_ready" ||
    normalizedType.includes("transcription")
  );
}

/**
 * Check if event type indicates an utterance event
 */
export function isUtteranceEvent(normalizedType: string): boolean {
  return (
    normalizedType === "conversation_utterance" ||
    normalizedType === "utterance" ||
    normalizedType.includes("utterance")
  );
}