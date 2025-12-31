#!/usr/bin/env node
/**
 * SessionEnd Hook Handler for c0ntextKeeper
 *
 * Captures session end events from Claude Code
 * Updates session metadata with duration and completion status
 */

import { getStoragePath } from "../utils/path-resolver";
import { writeHookData, getHookStorageDir } from "../utils/hook-storage";
import { SessionEndHookInput, SessionMetaRecord } from "../core/types";
import * as fs from "fs";
import * as path from "path";

// Debug logging utility
const DEBUG = process.env.C0NTEXTKEEPER_DEBUG === "true";
export const debugLog = (message: string, data?: unknown): void => {
  if (!DEBUG) return;

  const logDir = path.join(process.env.HOME || "", ".c0ntextkeeper", "debug");
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logFile = path.join(
    logDir,
    `session-end-${new Date().toISOString().split("T")[0]}.log`,
  );
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}${data ? "\n" + JSON.stringify(data, null, 2) : ""}\n\n`;

  fs.appendFileSync(logFile, logEntry, "utf-8");
};

export async function processSessionEnd(input: SessionEndHookInput): Promise<void> {
  debugLog("processSessionEnd called", {
    session_id: input.session_id,
    reason: input.reason,
    timestamp: input.timestamp,
  });

  try {
    const now = new Date();
    const timestamp = input.timestamp || now.toISOString();
    const workingDir = input.project_path || process.cwd();

    // Store in unique per-session JSON file
    // Uses timestamped filenames like: 2025-12-29_1430_MT_abc12345-sessions-meta.json
    const basePath = getStoragePath({
      projectPath: workingDir,
      createIfMissing: true,
    });

    // Try to find matching session-start file to calculate duration
    const sessionsDir = getHookStorageDir(basePath, "sessions-meta", workingDir);
    const shortSessionId = input.session_id.slice(-8);
    let durationMs: number | undefined;
    let startTime: string | undefined;

    if (fs.existsSync(sessionsDir)) {
      // Find session-start files with matching session ID
      const startFiles = fs.readdirSync(sessionsDir)
        .filter((f) => f.includes(shortSessionId) && f.endsWith("-sessions-meta.json"))
        .sort(); // Sort to get earliest first

      if (startFiles.length > 0) {
        try {
          const startFilePath = path.join(sessionsDir, startFiles[0]);
          const startData = JSON.parse(fs.readFileSync(startFilePath, "utf-8")) as { startTime?: string };
          if (startData.startTime) {
            startTime = startData.startTime;
            const startMs = new Date(startData.startTime).getTime();
            const endMs = new Date(timestamp).getTime();
            durationMs = endMs - startMs;
            debugLog("Calculated session duration from start file", {
              startFile: startFiles[0],
              durationMs,
            });
          }
        } catch (error) {
          debugLog("Failed to read session start file", { error });
        }
      }
    }

    // Build session end record with duration info
    const record: SessionMetaRecord & { eventType: string; durationMs?: number } = {
      sessionId: input.session_id,
      sessionType: "unknown",
      startTime: startTime || timestamp, // Use start time if found, else end time
      endTime: timestamp,
      projectPath: workingDir,
      status: "completed",
      eventType: "session-end",
      durationMs,
    };

    // Write session end to unique per-session file
    const storagePath = writeHookData(
      basePath,
      "sessions-meta",
      workingDir,
      input.session_id,
      record,
    );

    debugLog("Session end stored successfully", {
      storagePath,
      durationMs,
      reason: input.reason,
    });
  } catch (error) {
    debugLog("Error in processSessionEnd", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    console.error(
      JSON.stringify({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }),
    );
    process.exit(0);
  }
}

// Main execution
export async function main(): Promise<void> {
  debugLog("SessionEnd hook started");

  let input = "";

  process.stdin.on("data", (chunk) => {
    input += chunk;
  });

  process.stdin.on("end", async () => {
    debugLog("Input received", { length: input.length });

    if (!input) {
      debugLog("No input provided, exiting");
      process.exit(0);
    }

    try {
      const hookData = JSON.parse(input) as SessionEndHookInput;

      debugLog("Parsed hook data", {
        hook_event_name: hookData.hook_event_name,
        session_id: hookData.session_id,
        reason: hookData.reason,
      });

      // Validate hook event
      const validEventNames = [
        "SessionEnd",
        "sessionEnd",
        "session-end",
        "session_end",
      ];
      if (
        !validEventNames.some(
          (name) =>
            hookData.hook_event_name?.toLowerCase() === name.toLowerCase().replace(/[-_]/g, ""),
        )
      ) {
        debugLog("Not a SessionEnd event", {
          received: hookData.hook_event_name,
          expected: validEventNames,
        });
        process.exit(0);
      }

      await processSessionEnd(hookData);
      process.exit(0);
    } catch (error) {
      console.error(
        JSON.stringify({
          status: "error",
          message: `Failed to parse input: ${error instanceof Error ? error.message : "Unknown error"}`,
        }),
      );
      process.exit(0);
    }
  });

  // Handle timeout
  setTimeout(() => {
    console.error(
      JSON.stringify({
        status: "error",
        message: "Hook timeout after 5 seconds",
      }),
    );
    process.exit(0);
  }, 5000);
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error(
      JSON.stringify({
        status: "error",
        message: error.message,
      }),
    );
    process.exit(0);
  });
}

// Types re-exported for testing convenience
export type { SessionEndHookInput, SessionMetaRecord };
