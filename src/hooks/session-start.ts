#!/usr/bin/env node
/**
 * SessionStart Hook Handler for c0ntextKeeper
 *
 * Captures session start events from Claude Code
 * Tracks session metadata for duration and activity analysis
 */

import { getStoragePath } from "../utils/path-resolver";
import { writeHookData, getHookStorageDir } from "../utils/hook-storage";
import { SessionStartHookInput, SessionMetaRecord } from "../core/types";
import * as fs from "fs";
import * as path from "path";

// Debug logging utility
const DEBUG = process.env.C0NTEXTKEEPER_DEBUG === "true";
const debugLog = (message: string, data?: any) => {
  if (!DEBUG) return;

  const logDir = path.join(process.env.HOME || "", ".c0ntextkeeper", "debug");
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logFile = path.join(
    logDir,
    `session-start-${new Date().toISOString().split("T")[0]}.log`,
  );
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}${data ? "\n" + JSON.stringify(data, null, 2) : ""}\n\n`;

  fs.appendFileSync(logFile, logEntry, "utf-8");
};

async function processSessionStart(
  input: SessionStartHookInput,
): Promise<void> {
  debugLog("processSessionStart called", {
    session_id: input.session_id,
    session_type: input.session_type,
    timestamp: input.timestamp,
  });

  try {
    const now = new Date();
    const timestamp = input.timestamp || now.toISOString();
    const workingDir = input.project_path || input.cwd || process.cwd();

    // Create session meta record
    const record: SessionMetaRecord = {
      sessionId: input.session_id,
      sessionType: input.session_type || "startup",
      startTime: timestamp,
      projectPath: workingDir,
      cwd: input.cwd,
      status: "active",
    };

    // Store in unique per-session JSON file
    // Uses timestamped filenames like: 2025-12-29_1305_MT_abc12345-sessions-meta.json
    const basePath = getStoragePath({
      projectPath: workingDir,
      createIfMissing: true,
    });

    // Check if this session already has a start record (resume case)
    const sessionsDir = getHookStorageDir(
      basePath,
      "sessions-meta",
      workingDir,
    );
    const shortSessionId = record.sessionId.slice(-8);
    let isResume = false;

    if (fs.existsSync(sessionsDir)) {
      const existingFiles = fs
        .readdirSync(sessionsDir)
        .filter(
          (f) => f.includes(shortSessionId) && f.includes("session-start"),
        );
      isResume = existingFiles.length > 0;
    }

    if (isResume) {
      debugLog("Session resume detected, skipping duplicate start record", {
        sessionId: record.sessionId,
      });
    }

    // Write session start to unique per-session file
    const storagePath = writeHookData(
      basePath,
      "sessions-meta",
      workingDir,
      record.sessionId,
      { ...record, eventType: "session-start" },
    );

    debugLog("Session start stored successfully", {
      storagePath,
      isResume,
    });

    // Output additional context that Claude Code can use
    console.log(
      JSON.stringify({
        additionalContext: `Session started: ${record.sessionType} (${record.sessionId.substring(0, 8)}...)`,
      }),
    );
  } catch (error) {
    debugLog("Error in processSessionStart", {
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
async function main() {
  debugLog("SessionStart hook started");

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
      const hookData = JSON.parse(input) as SessionStartHookInput;

      debugLog("Parsed hook data", {
        hook_event_name: hookData.hook_event_name,
        session_id: hookData.session_id,
        session_type: hookData.session_type,
      });

      // Validate hook event
      const validEventNames = [
        "SessionStart",
        "sessionStart",
        "session-start",
        "session_start",
      ];
      if (
        !validEventNames.some(
          (name) =>
            hookData.hook_event_name?.toLowerCase() ===
            name.toLowerCase().replace(/[-_]/g, ""),
        )
      ) {
        debugLog("Not a SessionStart event", {
          received: hookData.hook_event_name,
          expected: validEventNames,
        });
        process.exit(0);
      }

      await processSessionStart(hookData);
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

export { processSessionStart, SessionStartHookInput, SessionMetaRecord };
