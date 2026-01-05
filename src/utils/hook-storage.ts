/**
 * Hook Storage Utility
 * Generates unique per-session filenames for hook data
 * Matches the sessions/ folder naming convention for consistency
 */

import * as path from "path";
import * as fs from "fs";
import { getProjectName } from "./project-utils";

/**
 * Format timestamp for Mountain Time filenames
 * Format: YYYY-MM-DD_HHMM_MT
 */
function formatTimestampForFilename(date: Date): string {
  const year = date.toLocaleDateString("en-US", {
    timeZone: "America/Denver",
    year: "numeric",
  });
  const month = date.toLocaleDateString("en-US", {
    timeZone: "America/Denver",
    month: "2-digit",
  });
  const day = date.toLocaleDateString("en-US", {
    timeZone: "America/Denver",
    day: "2-digit",
  });
  const time = date
    .toLocaleTimeString("en-US", {
      timeZone: "America/Denver",
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(":", "");

  return `${year}-${month}-${day}_${time}_MT`;
}

/**
 * Generate unique per-session filename for hook data
 * Matches sessions/ folder naming convention for consistency
 *
 * Format: YYYY-MM-DD_HHMM_MT_{sessionId}-{hookType}.json
 * Example: 2025-12-29_1305_MT_abc12345-knowledge.json
 *
 * @param sessionId - The Claude Code session ID
 * @param hookType - Type of hook data (knowledge, prompts, patterns, etc.)
 * @returns Unique filename with timestamp and session ID
 */
export function generateHookFileName(
  sessionId: string,
  hookType: string,
): string {
  const timestamp = formatTimestampForFilename(new Date());
  // Use last 8 chars of session ID for brevity while maintaining uniqueness
  const shortSessionId = sessionId.slice(-8);
  return `${timestamp}_${shortSessionId}-${hookType}.json`;
}

/**
 * Valid hook storage types for c0ntextKeeper
 * - sessions: Full session context files (per-session, unique names)
 * - knowledge: Q&A pairs from Stop hook (per-session)
 * - patterns: Tool usage patterns from PostToolUse hook (per-session)
 * - prompts: User prompts from UserPromptSubmit hook (per-session)
 * - notifications: Notification events (per-session)
 * - sessions-meta: Session lifecycle events (start/end, per-session)
 *
 * Note: subagents/ was removed in v0.7.8 when Claude Code deprecated SubagentStop
 */
export type HookStorageType =
  | "sessions"
  | "knowledge"
  | "patterns"
  | "prompts"
  | "notifications"
  | "sessions-meta";

/**
 * Get the directory path for hook storage (without filename)
 *
 * @param basePath - Base storage path (from getStoragePath)
 * @param hookType - Type of hook data
 * @param workingDir - Project working directory
 * @returns Directory path for hook storage
 */
export function getHookStorageDir(
  basePath: string,
  hookType: HookStorageType,
  workingDir: string,
): string {
  const projectName = getProjectName(workingDir);
  return path.join(basePath, "archive", "projects", projectName, hookType);
}

/**
 * Write hook data to a unique per-session file
 * Creates the directory if it doesn't exist
 *
 * @param basePath - Base storage path
 * @param hookType - Type of hook data (excludes "sessions" which uses file-store.ts)
 * @param workingDir - Project working directory
 * @param sessionId - Session ID for unique filename
 * @param data - Data to write (will be JSON stringified)
 * @returns The full path where data was written
 */
export function writeHookData<T>(
  basePath: string,
  hookType: Exclude<HookStorageType, "sessions">,
  workingDir: string,
  sessionId: string,
  data: T,
): string {
  const dir = getHookStorageDir(basePath, hookType, workingDir);
  const fileName = generateHookFileName(sessionId, hookType);
  const filePath = path.join(dir, fileName);

  // Ensure directory exists
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write data as formatted JSON (single item, not array)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");

  return filePath;
}

/**
 * Export timestamp formatter for use in other modules if needed
 */
export { formatTimestampForFilename };
