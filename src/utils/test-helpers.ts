/**
 * Test Utilities for c0ntextKeeper
 *
 * Shared helpers for test detection and management across the codebase.
 * Used by hooks to filter out test sessions from production storage.
 */

/**
 * Determines if a session ID belongs to a test session.
 *
 * Test sessions are identified by:
 * - Containing "test-session" or "test_session"
 * - Starting with "test-"
 * - Containing "session-17582" (test timestamp pattern)
 *
 * @param sessionId - The session ID to check
 * @returns true if this is a test session, false otherwise
 *
 * @example
 * ```typescript
 * if (isTestSession(sessionId)) {
 *   console.log("Skipping test session");
 *   return;
 * }
 * ```
 */
export function isTestSession(sessionId: string): boolean {
  return !!(
    sessionId &&
    (sessionId.includes("test-session") ||
      sessionId.includes("test_session") ||
      sessionId.startsWith("test-") ||
      sessionId.includes("session-17582"))
  ); // Test timestamp pattern
}

/**
 * Generates a test session ID for testing purposes.
 *
 * @param suffix - Optional suffix to make the ID unique
 * @returns A test session ID
 *
 * @example
 * ```typescript
 * const testId = generateTestSessionId("unit-test");
 * // Returns: "test-session-unit-test-1234567890"
 * ```
 */
export function generateTestSessionId(suffix?: string): string {
  const timestamp = Date.now();
  const parts = ["test-session"];

  if (suffix) {
    parts.push(suffix);
  }

  parts.push(timestamp.toString());

  return parts.join("-");
}

/**
 * Checks if a path is a temporary test directory.
 *
 * @param path - The path to check
 * @returns true if this is a test directory
 *
 * @example
 * ```typescript
 * if (isTestPath("/tmp/test-123")) {
 *   console.log("Temporary test directory");
 * }
 * ```
 */
export function isTestPath(path: string): boolean {
  return !!(
    path &&
    (path.includes("/tmp/") ||
      path.includes("/var/folders/") ||
      path.includes("c0ntextkeeper-test") ||
      path.includes("test-project"))
  );
}
