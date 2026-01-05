#!/usr/bin/env node
/**
 * Notification Hook Handler for c0ntextKeeper
 *
 * Captures notification events from Claude Code
 * Tracks permission prompts, idle states, and other notifications
 */

import { getStoragePath } from "../utils/path-resolver";
import { writeHookData } from "../utils/hook-storage";
import { NotificationHookInput, NotificationRecord } from "../core/types";
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
    `notification-${new Date().toISOString().split("T")[0]}.log`,
  );
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}${data ? "\n" + JSON.stringify(data, null, 2) : ""}\n\n`;

  fs.appendFileSync(logFile, logEntry, "utf-8");
};

async function processNotification(
  input: NotificationHookInput,
): Promise<void> {
  debugLog("processNotification called", {
    session_id: input.session_id,
    notification_type: input.notification_type,
    timestamp: input.timestamp,
  });

  try {
    const now = new Date();
    const timestamp = input.timestamp || now.toISOString();
    const workingDir = input.project_path || process.cwd();

    // Create notification record
    const record: NotificationRecord = {
      sessionId: input.session_id,
      notificationType: input.notification_type,
      message: input.message,
      timestamp,
      projectPath: workingDir,
      details: input.details,
    };

    // Store in unique per-session JSON file
    // Uses timestamped filenames like: 2025-12-29_1305_MT_abc12345-notifications.json
    const basePath = getStoragePath({
      projectPath: workingDir,
      createIfMissing: true,
    });

    // Write single notification to unique per-session file (no read-modify-write needed)
    const storagePath = writeHookData(
      basePath,
      "notifications",
      workingDir,
      input.session_id,
      record,
    );

    debugLog("Notification stored successfully", {
      storagePath,
      notificationType: record.notificationType,
    });

    // Categorize the notification type for analytics
    const category = categorizeNotification(record.notificationType);
    debugLog("Notification categorized", {
      type: record.notificationType,
      category,
    });
  } catch (error) {
    debugLog("Error in processNotification", {
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

/**
 * Categorize notification types for analytics
 */
function categorizeNotification(type: string): string {
  const lowerType = type.toLowerCase();

  if (lowerType.includes("permission") || lowerType.includes("auth")) {
    return "security";
  }
  if (lowerType.includes("idle") || lowerType.includes("timeout")) {
    return "status";
  }
  if (lowerType.includes("error") || lowerType.includes("fail")) {
    return "error";
  }
  if (lowerType.includes("success") || lowerType.includes("complete")) {
    return "success";
  }
  if (lowerType.includes("elicitation") || lowerType.includes("dialog")) {
    return "interaction";
  }

  return "general";
}

// Main execution
async function main() {
  debugLog("Notification hook started");

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
      const hookData = JSON.parse(input) as NotificationHookInput;

      debugLog("Parsed hook data", {
        hook_event_name: hookData.hook_event_name,
        session_id: hookData.session_id,
        notification_type: hookData.notification_type,
      });

      // Validate hook event
      const validEventNames = ["Notification", "notification"];
      if (
        !validEventNames.some(
          (name) =>
            hookData.hook_event_name?.toLowerCase() === name.toLowerCase(),
        )
      ) {
        debugLog("Not a Notification event", {
          received: hookData.hook_event_name,
          expected: validEventNames,
        });
        process.exit(0);
      }

      await processNotification(hookData);
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

export {
  processNotification,
  categorizeNotification,
  NotificationHookInput,
  NotificationRecord,
};
