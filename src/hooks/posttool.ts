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

// Debug logging utility - enhanced for production debugging
const DEBUG = process.env.C0NTEXTKEEPER_DEBUG === 'true';
const FORCE_LOG = false; // Enable for debugging

const debugLog = (message: string, data?: any, forceLog = false) => {
  if (!DEBUG && !forceLog && !FORCE_LOG) return;

  const logDir = path.join(process.env.HOME || '', '.c0ntextkeeper', 'debug');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logFile = path.join(logDir, `posttool-${new Date().toISOString().split('T')[0]}.log`);
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}\n\n`;

  fs.appendFileSync(logFile, logEntry, 'utf-8');
};

// Helper to check if this is a test session
const isTestSession = (sessionId: string): boolean => {
  return !!(sessionId && (
    sessionId.includes('test-session') ||
    sessionId.includes('test_session') ||
    sessionId.startsWith('test-') ||
    sessionId.includes('session-17582') // Test timestamp pattern
  ));
};

interface PostToolHookInput {
  hook_event_name: "PostToolUse" | "postToolUse" | string;
  session_id: string;
  // Test format fields
  tool?: string;
  input?: any;
  result?: any;
  // Production format fields
  tool_name?: string;
  tool_input?: any;
  tool_response?: any;
  // Common fields
  timestamp?: string;
  project_path?: string;
  cwd?: string;
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

  // Normalize fields between test and production formats
  const tool = input.tool || input.tool_name || 'unknown';
  const toolInput = input.input || input.tool_input;
  const toolResult = input.result || input.tool_response;
  const timestamp = input.timestamp || new Date().toISOString();

  debugLog('processToolUse called', {
    tool,
    session_id: input.session_id,
    hasInput: !!toolInput,
    hasResult: !!toolResult,
    timestamp,
    isTest: isTestSession(input.session_id),
    format: input.tool ? 'test' : 'production'
  });

  // Filter out test sessions from production storage
  if (isTestSession(input.session_id)) {
    debugLog('Skipping test session', { session_id: input.session_id });
    return; // Don't store test data in production folders
  }

  try {
    // Determine success/failure
    const success = !toolResult?.error && toolResult?.success !== false;

    // Create normalized input for pattern extraction
    const normalizedInput = {
      ...input,
      tool,
      input: toolInput,
      result: toolResult
    };

    // Extract pattern based on tool type
    const pattern = extractToolPattern(normalizedInput as PostToolHookInput);

    // Build tool pattern record
    const toolPattern: ToolPattern = {
      tool,
      success,
      error: toolResult?.error,
      pattern,
      timestamp,
      sessionId: input.session_id,
    };

    // Add specific metadata based on tool
    switch (tool) {
      case "Write":
      case "Edit":
      case "MultiEdit":
        toolPattern.fileModified = toolInput?.file_path || toolInput?.path;
        break;
      case "Bash":
        toolPattern.commandExecuted = securityFilter.filterText(
          toolInput?.command || "",
        );
        break;
    }

    // Store patterns for analysis in JSON format
    const dateString = new Date().toISOString().split("T")[0];
    const workingDir = input.project_path || input.cwd || process.cwd();

    // Use proper storage resolution (respects env vars and storage hierarchy)
    const basePath = getStoragePath({
      projectPath: workingDir,
      createIfMissing: true,
    });

    // Use unified project-based storage structure
    const storagePath = getHookStoragePath(
      basePath,
      "patterns",
      workingDir,
      dateString,
      "patterns.json",
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
        const existingData = fs.readFileSync(storagePath, "utf-8");
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
    fs.writeFileSync(storagePath, JSON.stringify(patterns, null, 2), "utf-8");
    
    debugLog('Pattern stored successfully', {
      storagePath,
      patternsCount: patterns.length,
      tool: toolPattern.tool,
      success: toolPattern.success
    });

    // Track error patterns for learning
    if (!success && toolPattern.error) {
      await trackErrorPattern(toolPattern, storage);
    }

    // Remove console.log to avoid interfering with Claude Code
    // Only log errors, not successes
  } catch (error) {
    debugLog('Error in processToolUse', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Only output errors to Claude Code
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
  // Handle both test and production formats
  const tool = input.tool || input.tool_name || 'unknown';
  const toolInput = input.input || input.tool_input;
  const result = input.result || input.tool_response;

  // Determine if the operation was successful
  const isSuccess = !result?.error && result?.success !== false;

  // Handle MCP tools specifically
  if (tool.startsWith("mcp__")) {
    const parts = tool.split("__");
    const server = parts[1] || "unknown";
    const method = parts[2] || "unknown";

    // Extract meaningful details based on common MCP tools
    if (tool.includes("filesystem")) {
      const operation = method.replace(/_/g, " ");
      const path = toolInput?.path || toolInput?.file_path || "unknown";
      return `MCP ${server}: ${operation} on ${path} - ${isSuccess ? "success" : "failed"}`;
    } else if (tool.includes("sequential-thinking")) {
      return `MCP ${server}: ${method} - thought ${toolInput?.thoughtNumber || "?"} of ${toolInput?.totalThoughts || "?"}`;
    } else if (tool.includes("github")) {
      const operation = method.replace(/_/g, " ");
      return `MCP ${server}: ${operation} - ${isSuccess ? "success" : "failed"}`;
    } else {
      return `MCP ${server}: ${method} - ${isSuccess ? "success" : "failed"}`;
    }
  }

  // Handle standard tools
  switch (tool) {
    case "Write":
    case "Edit":
    case "MultiEdit":
      const filePath = toolInput?.file_path || "unknown";
      return `${tool}: ${filePath} - ${isSuccess ? "modified" : "failed"}`;

    case "Bash":
      const cmd = (toolInput?.command || "").split(" ")[0];
      const exitCode = result?.exit_code;
      if (exitCode !== undefined) {
        return `Bash: ${cmd} - ${exitCode === 0 ? "success" : `exit ${exitCode}`}`;
      }
      return `Bash: ${cmd} - ${isSuccess ? "success" : "failed"}`;

    case "Read":
      const readPath = toolInput?.file_path || "unknown";
      return `Read: ${readPath} - ${isSuccess ? "success" : "failed"}`;

    case "Grep":
    case "Glob":
      const pattern = toolInput?.pattern || "unknown";
      const matches = result?.matches?.length || result?.files?.length || 0;
      return `${tool}: ${pattern} - ${matches} matches`;

    case "TodoWrite":
      const todoCount = toolInput?.todos?.length || 0;
      return `TodoWrite: ${todoCount} todos - ${isSuccess ? "updated" : "failed"}`;

    case "ExitPlanMode":
      return `ExitPlanMode: ${isSuccess ? "plan approved" : "plan rejected"}`;

    case "WebSearch":
      const query = toolInput?.query || "unknown";
      return `WebSearch: "${query}" - ${isSuccess ? "success" : "failed"}`;

    case "WebFetch":
      const url = toolInput?.url || "unknown";
      return `WebFetch: ${url} - ${isSuccess ? "fetched" : "failed"}`;

    default:
      // For unknown tools, provide a more informative pattern
      if (toolInput?.file_path) {
        return `${tool}: ${toolInput.file_path} - ${isSuccess ? "success" : "failed"}`;
      } else if (toolInput?.path) {
        return `${tool}: ${toolInput.path} - ${isSuccess ? "success" : "failed"}`;
      } else if (toolInput?.query) {
        return `${tool}: "${toolInput.query}" - ${isSuccess ? "success" : "failed"}`;
      } else {
        return `${tool}: ${isSuccess ? "success" : "failed"}`;
      }
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
      const existingData = fs.readFileSync(errorPath, "utf-8");
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
  fs.writeFileSync(errorPath, JSON.stringify(errors, null, 2), "utf-8");
}

// Main execution
async function main() {
  // ALWAYS log hook start for production debugging
  debugLog('PostToolUse hook started at ' + new Date().toISOString(), {
    pid: process.pid,
    cwd: process.cwd(),
    env_debug: process.env.C0NTEXTKEEPER_DEBUG,
    argv: process.argv
  }, true);

  let input = "";
  let inputStartTime = Date.now();

  // Read from stdin
  process.stdin.on("data", (chunk) => {
    input += chunk;
    debugLog('Receiving data chunk', { length: chunk.length }, true);
  });

  process.stdin.on("end", async () => {
    const inputTime = Date.now() - inputStartTime;
    debugLog('Input complete', {
      length: input.length,
      timeMs: inputTime,
      preview: input.substring(0, 200)
    }, true);

    if (!input) {
      debugLog('No input provided, exiting', {}, true);
      process.exit(0);
    }

    // Log raw input for debugging
    debugLog('Raw input received', { raw: input }, true);

    try {
      const hookData = JSON.parse(input) as PostToolHookInput;
      
      debugLog('Parsed hook data', {
        hook_event_name: hookData.hook_event_name,
        tool: hookData.tool,
        session_id: hookData.session_id
      });

      // Validate hook event - be VERY flexible with event names
      const validEventNames = [
        'PostToolUse', 'postToolUse', 'posttooluse', 'post-tool-use',
        'post_tool_use', 'POST_TOOL_USE', 'postTool', 'toolUse'
      ];

      // Also check if it might be a tool event without explicit event name
      const hasToolData = (hookData.tool || hookData.tool_name) &&
                        (hookData.input || hookData.tool_input ||
                         hookData.result || hookData.tool_response);

      if (!validEventNames.some(name =>
        hookData.hook_event_name?.toLowerCase() === name.toLowerCase()
      ) && !hasToolData) {
        debugLog('Not a PostToolUse event', {
          received: hookData.hook_event_name,
          expected: validEventNames,
          hasToolData
        }, true);
        process.exit(0);
      }

      await processToolUse(hookData);
      process.exit(0);
    } catch (error) {
      debugLog('Failed to parse input', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        input: input.substring(0, 500)
      }, true);

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
