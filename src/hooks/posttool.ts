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

// Debug logging utility
const DEBUG = process.env.C0NTEXTKEEPER_DEBUG === 'true';
const debugLog = (message: string, data?: any) => {
  if (!DEBUG) return;
  
  const logDir = path.join(process.env.HOME || '', '.c0ntextkeeper', 'debug');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const logFile = path.join(logDir, `posttool-${new Date().toISOString().split('T')[0]}.log`);
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}\n\n`;
  
  fs.appendFileSync(logFile, logEntry, 'utf-8');
};

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
  
  debugLog('processToolUse called', { 
    tool: input.tool,
    session_id: input.session_id,
    hasInput: !!input.input,
    hasResult: !!input.result,
    timestamp: input.timestamp
  });

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
  const { tool, input: toolInput, result } = input;

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
  debugLog('PostToolUse hook started');
  
  let input = "";

  // Read from stdin
  process.stdin.on("data", (chunk) => {
    input += chunk;
  });

  process.stdin.on("end", async () => {
    debugLog('Input received', { length: input.length });
    
    if (!input) {
      debugLog('No input provided, exiting');
      // Remove console output to avoid interfering with Claude Code
      process.exit(0);
    }

    try {
      const hookData = JSON.parse(input) as PostToolHookInput;
      
      debugLog('Parsed hook data', {
        hook_event_name: hookData.hook_event_name,
        tool: hookData.tool,
        session_id: hookData.session_id
      });

      // Validate hook event - be more flexible with event names
      const validEventNames = ['PostToolUse', 'postToolUse', 'posttooluse', 'post-tool-use'];
      if (!validEventNames.some(name => 
        hookData.hook_event_name?.toLowerCase() === name.toLowerCase()
      )) {
        debugLog('Not a PostToolUse event', { 
          received: hookData.hook_event_name,
          expected: validEventNames 
        });
        // Remove console output to avoid interfering with Claude Code
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
