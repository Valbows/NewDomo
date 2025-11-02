/**
 * Tool Transformation Utilities
 * Logic for transforming and normalizing tool calls
 */

import {canonicalizeShortToolName, mapUtteranceToCanonicalTool} from './tool-validation-utils';
import {extractTitleFromArgs, KNOWN_TOOLS} from './tool-parsing-utils';

/**
 * If the provided title actually encodes a control command (e.g. "pause"),
 * convert it to the appropriate no-arg tool.
 */
export function canonicalFromTitleIfCommand(
  title: string | null | undefined
): string | null {
  if (!title || typeof title !== "string") return null;
  
  // Normalize and strip quotes/punctuation
  let normalized = title
    .trim()
    .replace(/^['&quot;]|['"]$/g, "")
    .toLowerCase();
  normalized = normalized.replace(/[.!?]+$/g, "").replace(/\s+/g, " ");

  // Remove common politeness/filler words while preserving intent
  const polite =
    /\b(please|kindly|can you|could you|would you|will you|the|this|that)\b/g;
  const sanitized = normalized.replace(polite, " ").replace(/\s+/g, " ").trim();

  // Try exact canonicalization first, then keyword-based utterance mapping
  return (
    canonicalizeShortToolName(sanitized) ||
    mapUtteranceToCanonicalTool(sanitized)
  );
}

/**
 * Transform tool call result by applying canonicalization and command detection
 */
export function transformToolCall(
  toolName: string | null,
  toolArgs: any,
  fromUtterance: boolean = false
): { toolName: string | null; toolArgs: any } {
  if (!toolName) {
    return { toolName, toolArgs };
  }

  // For utterance events, try direct mapping from natural language commands
  if (fromUtterance) {
    const directTool = mapUtteranceToCanonicalTool(toolName);
    if (directTool) {
      return { toolName: directTool, toolArgs: {} };
    }
  }

  // Normalize short/alias function names to canonical tools ONLY if the provided name 
  // is not already a known tool
  if (typeof toolName === "string" && !KNOWN_TOOLS.includes(toolName)) {
    const canonicalTool = canonicalizeShortToolName(toolName);
    if (canonicalTool) {
      return { toolName: canonicalTool, toolArgs: {} };
    }
  }

  // If fetch_video was called but the "title" is actually a command, 
  // remap to the appropriate control tool
  if (toolName === "fetch_video") {
    const title = extractTitleFromArgs(toolArgs);
    const controlTool = canonicalFromTitleIfCommand(title);
    if (controlTool) {
      return { toolName: controlTool, toolArgs: {} };
    }
  }

  return { toolName, toolArgs };
}

/**
 * Apply canonicalization to tool name from transcription
 */
export function canonicalizeTranscriptionTool(toolName: string): string {
  // Normalize short/alias names first
  const canonical = canonicalizeShortToolName(toolName);
  return canonical ?? toolName;
}

/**
 * Apply canonicalization to tool name from utterance with function syntax
 */
export function canonicalizeUtteranceTool(toolName: string): string | null {
  // Normalize short/alias names like pause(), resume(), next(), close()
  return canonicalizeShortToolName(toolName);
}