#!/usr/bin/env node
/**
 * PostToolUse Hook Handler for c0ntextKeeper
 *
 * Captures tool results to track successful patterns and common errors
 * Especially useful for tracking file modifications and command executions
 */

import { SecurityFilter } from "../utils/security-filter";
import { FileStore } from "../storage/file-store";
import { getStoragePath } from "../utils/path-resolver";
import { getHookStoragePath } from "../utils/project-utils";
import * as fs from "fs";
import * as path from "path";

interface PostToolHookInput {
  hook_event_name: "PostToolUse" | "postToolUse";
  session_id: string;
  tool: string;
  input: any;
  result: any;
  timestamp: string;
  project_path?: string;
}

interface ToolPattern {
  tool: string;
  success: boolean;
  error?: string;
  fileModified?: string;
  commandExecuted?: string;
  pattern: string;
  timestamp: string;
  sessionId: string;
}

async function processToolUse(input: PostToolHookInput): Promise<void> {
  const securityFilter = new SecurityFilter();
  const storage = new FileStore();

  try {
    // Determine success/failure
    const success = !input.result?.error && input.result?.success !== false;

    // Extract pattern based on tool type
    const pattern = extractToolPattern(input);

    // Build tool pattern record
    const toolPattern: ToolPattern = {
      tool: input.tool,
      success,
      error: input.result?.error,
      pattern,
      timestamp: input.timestamp || new Date().toISOString(),
      sessionId: input.session_id,
    };

    // Add specific metadata based on tool
    switch (input.tool) {
      case "Write":
      case "Edit":
      case "MultiEdit":
        toolPattern.fileModified = input.input?.file_path;
        break;
      case "Bash":
        toolPattern.commandExecuted = securityFilter.filterText(
          input.input?.command || "",
        );
        break;
    }

    // Store patterns for analysis in JSON format
    const dateString = new Date().toISOString().split("T")[0];
    const workingDir = input.project_path || process.cwd();
    
    // Use proper storage resolution (respects env vars and storage hierarchy)
    const basePath = getStoragePath({ 
      projectPath: workingDir,
      createIfMissing: true
    });
    
    // Use unified project-based storage structure
    const storagePath = getHookStoragePath(
      basePath,
      'patterns',
      workingDir,
      dateString,
      'patterns.json'
    );

    // Ensure directory exists
    const dir = path.dirname(storagePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Read existing patterns or create new array
    let patterns: ToolPattern[] = [];
    if (fs.existsSync(storagePath)) {
      try {
        const existingData = fs.readFileSync(storagePath, 'utf-8');
        patterns = JSON.parse(existingData);
        // Ensure it's an array
        if (!Array.isArray(patterns)) {
          patterns = [];
        }
      } catch (error) {
        console.error(`Failed to parse existing patterns file: ${error}`);
        patterns = [];
      }
    }

    // Add new pattern to array
    patterns.push(toolPattern);

    // Write back as formatted JSON
    fs.writeFileSync(storagePath, JSON.stringify(patterns, null, 2), 'utf-8');

    // Track error patterns for learning
    if (!success && toolPattern.error) {
      await trackErrorPattern(toolPattern, storage);
    }

    console.log(
      JSON.stringify({
        status: "success",
        message: `Tool use captured: ${input.tool} (${success ? "success" : "failed"})`,
        stats: {
          tool: input.tool,
          success,
          pattern: pattern.substring(0, 50),
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
    // Non-blocking error
    process.exit(0);
  }
}

function extractToolPattern(input: PostToolHookInput): string {
  const { tool, input: toolInput, result } = input;

  switch (tool) {
    case "Write":
    case "Edit":
    case "MultiEdit":
      return `${tool}: ${toolInput?.file_path || "unknown"} - ${result?.success ? "modified" : "failed"}`;

    case "Bash":
      const cmd = (toolInput?.command || "").split(" ")[0];
      return `Bash: ${cmd} - ${result?.exit_code === 0 ? "success" : `exit ${result?.exit_code}`}`;

    case "Read":
      return `Read: ${toolInput?.file_path || "unknown"}`;

    case "Grep":
    case "Glob":
      return `${tool}: ${toolInput?.pattern || "unknown"} - ${result?.matches?.length || 0} matches`;

    default:
      return `${tool}: ${result?.success ? "success" : "failed"}`;
  }
}

async function trackErrorPattern(
  pattern: ToolPattern,
  _storage: FileStore,
): Promise<void> {
  // Store common errors for pattern recognition in JSON format
  const dateStr = new Date().toISOString().split("T")[0];
  // Store errors at root level, not under archive/
  const errorPath = path.join(
    process.env.HOME || "",
    ".c0ntextkeeper",
    "errors",
    `${dateStr}-errors.json`,
  );

  const dir = path.dirname(errorPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const errorEntry = {
    tool: pattern.tool,
    error: pattern.error,
    pattern: pattern.pattern,
    timestamp: pattern.timestamp,
    file: pattern.fileModified,
    command: pattern.commandExecuted,
  };

  // Read existing errors or create new array
  let errors: any[] = [];
  if (fs.existsSync(errorPath)) {
    try {
      const existingData = fs.readFileSync(errorPath, 'utf-8');
      errors = JSON.parse(existingData);
      // Ensure it's an array
      if (!Array.isArray(errors)) {
        errors = [];
      }
    } catch (error) {
      console.error(`Failed to parse existing errors file: ${error}`);
      errors = [];
    }
  }

  // Add new error to array
  errors.push(errorEntry);

  // Write back as formatted JSON
  fs.writeFileSync(errorPath, JSON.stringify(errors, null, 2), 'utf-8');
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
      const hookData = JSON.parse(input) as PostToolHookInput;

      // Validate hook event
      if (
        hookData.hook_event_name !== "PostToolUse" &&
        hookData.hook_event_name !== "postToolUse"
      ) {
        console.log(
          JSON.stringify({
            status: "skipped",
            message: "Not a PostToolUse event",
          }),
        );
        process.exit(0);
      }

      await processToolUse(hookData);
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

export { processToolUse, PostToolHookInput, ToolPattern };
