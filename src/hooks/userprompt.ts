#!/usr/bin/env node
/**
 * UserPromptSubmit Hook Handler for c0ntextKeeper
 *
 * Captures user prompts as they're submitted to Claude Code
 * Helps track what problems users are trying to solve
 */

import { SecurityFilter } from "../utils/security-filter";
import { getStoragePath } from "../utils/path-resolver";
import { writeHookData, getHookStorageDir } from "../utils/hook-storage";
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
    `userprompt-${new Date().toISOString().split("T")[0]}.log`,
  );
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}${data ? "\n" + JSON.stringify(data, null, 2) : ""}\n\n`;

  fs.appendFileSync(logFile, logEntry, "utf-8");
};

interface UserPromptHookInput {
  hook_event_name: "UserPromptSubmit" | "userPromptSubmit";
  session_id: string;
  prompt: string;
  timestamp: string;
  project_path?: string;
}

interface UserPromptContext {
  sessionId: string;
  timestamp: string;
  projectPath?: string;
  prompt: string;
  promptLength: number;
  hasCodeBlock: boolean;
  hasQuestion: boolean;
  topics: string[];
  isFollowUp?: boolean;
  promptNumber?: number; // Track prompt number in session
}

async function processUserPrompt(input: UserPromptHookInput): Promise<void> {
  const securityFilter = new SecurityFilter();

  debugLog("processUserPrompt called", {
    session_id: input.session_id,
    promptLength: input.prompt?.length,
    timestamp: input.timestamp,
  });

  try {
    // Filter sensitive data from prompt
    const safePrompt = securityFilter.filterText(input.prompt);

    // Analyze prompt characteristics
    const context: UserPromptContext = {
      sessionId: input.session_id,
      timestamp: input.timestamp || new Date().toISOString(),
      projectPath: input.project_path || process.cwd(),
      prompt: safePrompt,
      promptLength: safePrompt.length,
      hasCodeBlock: /```[\s\S]*?```/.test(safePrompt),
      hasQuestion: /\?|how|what|why|when|where|can|should|could/i.test(
        safePrompt,
      ),
      topics: extractTopics(safePrompt),
    };

    // Skip very short prompts (likely mistakes or tests)
    if (context.promptLength < 10) {
      console.log(
        JSON.stringify({
          status: "skipped",
          message: "Prompt too short to preserve",
        }),
      );
      return;
    }

    // Store in unique per-session JSON file
    // Uses timestamped filenames like: 2025-12-29_1305_MT_abc12345-prompts.json
    const workingDir = context.projectPath || process.cwd();

    // Use proper storage resolution (respects env vars and storage hierarchy)
    const basePath = getStoragePath({
      projectPath: workingDir,
      createIfMissing: true,
    });

    // Check if this is a follow-up prompt by counting existing files with session ID
    const promptsDir = getHookStorageDir(basePath, "prompts", workingDir);
    const shortSessionId = context.sessionId.slice(-8);
    let promptNumber = 1;

    if (fs.existsSync(promptsDir)) {
      const existingFiles = fs.readdirSync(promptsDir)
        .filter((f) => f.includes(shortSessionId) && f.endsWith("-prompts.json"));
      promptNumber = existingFiles.length + 1;
    }

    context.isFollowUp = promptNumber > 1;
    context.promptNumber = promptNumber;

    if (context.isFollowUp) {
      debugLog("Follow-up prompt detected", {
        sessionId: context.sessionId,
        promptNumber: context.promptNumber,
      });
    }

    // Write single prompt to unique per-session file (no read-modify-write needed)
    const storagePath = writeHookData(
      basePath,
      "prompts",
      workingDir,
      context.sessionId,
      context,
    );

    debugLog("Prompt stored successfully", {
      storagePath,
      promptNumber: context.promptNumber,
      isFollowUp: context.isFollowUp,
      topics: context.topics,
    });

    // Remove console.log to avoid interfering with Claude Code
  } catch (error) {
    debugLog("Error in processUserPrompt", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Only output errors to Claude Code
    console.error(
      JSON.stringify({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }),
    );
    // Non-blocking error - don't prevent prompt submission
    process.exit(0);
  }
}

function extractTopics(text: string): string[] {
  const topics: string[] = [];

  // Common programming topics
  const topicPatterns = [
    { pattern: /auth(entication|orization)?/gi, topic: "authentication" },
    { pattern: /database|db|sql|postgres|mysql|mongo/gi, topic: "database" },
    { pattern: /api|endpoint|rest|graphql/gi, topic: "api" },
    { pattern: /test(ing)?|jest|mocha|vitest/gi, topic: "testing" },
    { pattern: /error|bug|fix|issue|problem/gi, topic: "debugging" },
    {
      pattern: /deploy|deployment|ci\/cd|docker|kubernetes/gi,
      topic: "deployment",
    },
    { pattern: /typescript|javascript|node|npm/gi, topic: "javascript" },
    { pattern: /react|vue|angular|svelte/gi, topic: "frontend" },
    { pattern: /css|style|tailwind|sass/gi, topic: "styling" },
    { pattern: /security|encrypt|hash|token|jwt/gi, topic: "security" },
  ];

  for (const { pattern, topic } of topicPatterns) {
    if (pattern.test(text) && !topics.includes(topic)) {
      topics.push(topic);
    }
  }

  return topics;
}

// Main execution
async function main() {
  debugLog("UserPromptSubmit hook started");

  let input = "";

  // Read from stdin
  process.stdin.on("data", (chunk) => {
    input += chunk;
  });

  process.stdin.on("end", async () => {
    debugLog("Input received", { length: input.length });

    if (!input) {
      debugLog("No input provided, exiting");
      // Remove console output to avoid interfering with Claude Code
      process.exit(0);
    }

    try {
      const hookData = JSON.parse(input) as UserPromptHookInput;

      debugLog("Parsed hook data", {
        hook_event_name: hookData.hook_event_name,
        session_id: hookData.session_id,
        promptLength: hookData.prompt?.length,
      });

      // Validate hook event - be more flexible with event names
      const validEventNames = [
        "UserPromptSubmit",
        "userPromptSubmit",
        "userpromptsubmit",
        "user-prompt-submit",
      ];
      if (
        !validEventNames.some(
          (name) =>
            hookData.hook_event_name?.toLowerCase() === name.toLowerCase(),
        )
      ) {
        debugLog("Not a UserPromptSubmit event", {
          received: hookData.hook_event_name,
          expected: validEventNames,
        });
        // Remove console output to avoid interfering with Claude Code
        process.exit(0);
      }

      await processUserPrompt(hookData);
      process.exit(0);
    } catch (error) {
      console.error(
        JSON.stringify({
          status: "error",
          message: `Failed to parse input: ${error instanceof Error ? error.message : "Unknown error"}`,
        }),
      );
      process.exit(0); // Non-blocking
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

export { processUserPrompt, extractTopics, UserPromptHookInput, UserPromptContext };
