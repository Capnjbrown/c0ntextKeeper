#!/usr/bin/env node
/**
 * UserPromptSubmit Hook Handler for c0ntextKeeper
 *
 * Captures user prompts as they're submitted to Claude Code
 * Helps track what problems users are trying to solve
 */

import { SecurityFilter } from "../utils/security-filter";
import { FileStore } from "../storage/file-store";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

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
}

async function processUserPrompt(input: UserPromptHookInput): Promise<void> {
  const securityFilter = new SecurityFilter();
  const storage = new FileStore();

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

    // Store in lightweight format
    const projectHash = crypto
      .createHash("md5")
      .update(context.projectPath || "global")
      .digest("hex")
      .substring(0, 8);

    const storagePath = path.join(
      storage.getBasePath(),
      "prompts",
      projectHash,
      `${new Date().toISOString().split("T")[0]}-prompts.jsonl`,
    );

    // Ensure directory exists
    const dir = path.dirname(storagePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Append to JSONL file (lightweight storage)
    const entry = JSON.stringify(context) + "\n";
    fs.appendFileSync(storagePath, entry);

    console.log(
      JSON.stringify({
        status: "success",
        message: `Prompt captured: "${safePrompt.substring(0, 50)}..."`,
        stats: {
          length: context.promptLength,
          hasCode: context.hasCodeBlock,
          isQuestion: context.hasQuestion,
          topics: context.topics.length,
        },
      }),
    );
  } catch (error) {
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
  let input = "";

  // Read from stdin
  process.stdin.on("data", (chunk) => {
    input += chunk;
  });

  process.stdin.on("end", async () => {
    if (!input) {
      console.log(
        JSON.stringify({
          status: "skipped",
          message: "No input provided",
        }),
      );
      process.exit(0);
    }

    try {
      const hookData = JSON.parse(input) as UserPromptHookInput;

      // Validate hook event (handle both capitalizations)
      if (
        hookData.hook_event_name !== "UserPromptSubmit" &&
        hookData.hook_event_name !== "userPromptSubmit"
      ) {
        console.log(
          JSON.stringify({
            status: "skipped",
            message: "Not a UserPromptSubmit event",
          }),
        );
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

export { processUserPrompt, UserPromptHookInput, UserPromptContext };
