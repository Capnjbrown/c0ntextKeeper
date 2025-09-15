/**
 * Transcript parsing utilities
 */

import { createReadStream } from "fs";
import * as fs from "fs";
import readline from "readline";
import crypto from "crypto";
import { TranscriptEntry } from "../core/types.js";

/**
 * Parse a JSONL transcript file line by line with limits for large files
 */
export async function parseTranscript(
  transcriptPath: string,
  options: {
    maxEntries?: number;
    maxTimeMs?: number;
    prioritizeRecent?: boolean;
  } = {},
): Promise<TranscriptEntry[]> {
  // Check if file exists before attempting to read
  if (!fs.existsSync(transcriptPath)) {
    throw new Error(`File not found: ${transcriptPath}`);
  }

  const maxEntries = options.maxEntries || 10000; // Default: limit to 10k entries
  const maxTimeMs = options.maxTimeMs || 45000; // Default: 45 seconds max
  const prioritizeRecent = options.prioritizeRecent !== false; // Default: true
  const startTime = Date.now();

  const fileStream = createReadStream(transcriptPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let lineCount = 0;
  const allEntries: TranscriptEntry[] = [];

  for await (const line of rl) {
    lineCount++;

    // Check time limit
    if (Date.now() - startTime > maxTimeMs) {
      console.warn(
        `Transcript parsing timeout after ${lineCount} lines, ${allEntries.length} valid entries`,
      );
      rl.close();
      break;
    }

    if (line.trim()) {
      try {
        const entry = JSON.parse(line);
        allEntries.push(normalizeEntry(entry));

        // Stop if we have enough entries
        if (allEntries.length >= maxEntries * 2) {
          // Read extra to allow for prioritization
          console.warn(
            `Transcript parsing stopped after ${maxEntries * 2} entries`,
          );
          rl.close();
          break;
        }
      } catch (error) {
        // Skip invalid JSON lines silently to avoid log spam
        if (lineCount <= 10) {
          // Only log first few errors
          console.error(
            `Failed to parse transcript line ${lineCount}: ${error}`,
          );
        }
      }
    }
  }

  // If we have too many entries and prioritizeRecent is true, keep the most recent ones
  if (prioritizeRecent && allEntries.length > maxEntries) {
    // Keep first 20% and last 80% to preserve context and recent work
    const firstPart = Math.floor(maxEntries * 0.2);
    const lastPart = maxEntries - firstPart;
    const result = [
      ...allEntries.slice(0, firstPart),
      ...allEntries.slice(-lastPart),
    ];
    console.log(
      `Prioritized ${result.length} entries from ${allEntries.length} total (kept first ${firstPart} and last ${lastPart})`,
    );
    return result;
  }

  return allEntries.slice(0, maxEntries);
}

/**
 * Parse transcript from string content
 */
export function parseTranscriptContent(content: string): TranscriptEntry[] {
  const entries: TranscriptEntry[] = [];
  const lines = content.split("\n");

  for (const line of lines) {
    if (line.trim()) {
      try {
        const entry = JSON.parse(line);
        entries.push(normalizeEntry(entry));
      } catch (error) {
        console.error(`Failed to parse transcript line: ${error}`);
      }
    }
  }

  return entries;
}

/**
 * Generate a deterministic session ID from content
 */
function generateSessionId(entry: any): string {
  const timestamp = entry.timestamp || new Date().toISOString();
  const content = JSON.stringify(entry);
  const hash = crypto.createHash('sha256').update(content).digest('hex');
  
  // Format: session-YYYYMMDD-HASH8
  const date = timestamp.split('T')[0].replace(/-/g, '');
  const shortHash = hash.substring(0, 8);
  
  return `session-${date}-${shortHash}`;
}

/**
 * Normalize a transcript entry to ensure consistent structure
 * Handles both old format and new Claude Code format with embedded content arrays
 */
function normalizeEntry(entry: any): TranscriptEntry {
  // Generate a proper sessionId if missing
  const sessionId = entry.sessionId || entry.session_id || generateSessionId(entry);
  
  // Handle different entry formats that might exist
  const normalized: TranscriptEntry = {
    type: entry.type || "unknown",
    timestamp: entry.timestamp || new Date().toISOString(),
    sessionId: sessionId,
  };

  // Add optional fields if present
  if (entry.cwd) {
    normalized.cwd = entry.cwd;
  }

  // Handle Claude Code's actual format with embedded content arrays
  if (entry.message) {
    const message = entry.message;
    
    // Extract content from array format (Claude's actual format)
    if (Array.isArray(message.content)) {
      // Process each content item
      for (const contentItem of message.content) {
        // Handle tool_use embedded in assistant messages
        if (contentItem.type === "tool_use") {
          normalized.type = "tool_use";
          normalized.toolUse = {
            name: contentItem.name || "",
            input: contentItem.input || {},
          };
          // Keep the assistant context
          if (message.role === "assistant") {
            normalized.message = {
              role: "assistant",
              content: `Using tool: ${contentItem.name}`,
            };
          }
        }
        // Handle tool_result embedded in user messages
        else if (contentItem.type === "tool_result") {
          normalized.type = "tool_result";
          normalized.toolResult = {
            output: extractToolResultContent(contentItem),
            error: contentItem.is_error ? extractToolResultContent(contentItem) : undefined,
          };
          // Don't override user type for actual user messages
          if (message.role === "user" && !contentItem.tool_use_id) {
            normalized.type = "user";
          }
        }
        // Handle regular text content
        else if (contentItem.type === "text") {
          // Only set message if we haven't found a tool use/result
          if (!normalized.toolUse && !normalized.toolResult) {
            normalized.message = {
              role: message.role || "unknown",
              content: contentItem.text || "",
            };
          }
        }
      }
      
      // If no specific content was extracted, try to get text
      if (!normalized.message && !normalized.toolUse && !normalized.toolResult) {
        const textContent = message.content
          .filter((c: any) => c.type === "text")
          .map((c: any) => c.text || "")
          .join("\n");
        if (textContent) {
          normalized.message = {
            role: message.role || "unknown",
            content: textContent,
          };
        }
      }
    }
    // Handle old format with string content
    else {
      normalized.message = {
        role: message.role || "unknown",
        content: message.content || "",
      };
    }
  }

  // Handle old format with separate toolUse/toolResult fields
  if (entry.toolUse || entry.tool_use) {
    const toolUse = entry.toolUse || entry.tool_use;
    normalized.toolUse = {
      name: toolUse.name || "",
      input: toolUse.input || {},
    };
    if (!normalized.type || normalized.type === "unknown") {
      normalized.type = "tool_use";
    }
  }

  if (entry.toolResult || entry.tool_result) {
    const toolResult = entry.toolResult || entry.tool_result;
    normalized.toolResult = {
      output: toolResult.output,
      error: toolResult.error,
    };
    if (!normalized.type || normalized.type === "unknown") {
      normalized.type = "tool_result";
    }
  }

  return normalized;
}

/**
 * Extract content from tool result which may be string or nested array
 */
function extractToolResultContent(toolResult: any): string {
  if (typeof toolResult.content === "string") {
    return toolResult.content;
  }
  if (Array.isArray(toolResult.content)) {
    return toolResult.content
      .map((item: any) => {
        if (typeof item === "string") return item;
        if (item.type === "text" && item.text) return item.text;
        return JSON.stringify(item);
      })
      .join("\n");
  }
  if (toolResult.output) {
    return toolResult.output;
  }
  return "";
}

/**
 * Validate transcript entries
 */
export function validateTranscriptEntries(entries: TranscriptEntry[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!entries || entries.length === 0) {
    errors.push("No entries found in transcript");
    return { valid: false, errors };
  }

  // Check for required fields
  entries.forEach((entry, index) => {
    if (!entry.type) {
      errors.push(`Entry ${index} missing type field`);
    }
    if (!entry.timestamp) {
      errors.push(`Entry ${index} missing timestamp field`);
    }
    if (!entry.sessionId) {
      errors.push(`Entry ${index} missing sessionId field`);
    }
  });

  // Check for logical consistency
  const sessionIds = new Set(entries.map((e) => e.sessionId));
  if (sessionIds.size > 1) {
    errors.push(
      `Multiple session IDs found: ${Array.from(sessionIds).join(", ")}`,
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Extract session metadata from transcript entries
 */
export function extractSessionMetadata(entries: TranscriptEntry[]): {
  sessionId: string;
  startTime: string;
  endTime: string;
  duration: number;
  projectPath: string;
  entryCount: number;
  toolsUsed: string[];
} {
  if (entries.length === 0) {
    throw new Error("No entries to extract metadata from");
  }

  const firstEntry = entries[0];
  const lastEntry = entries[entries.length - 1];

  const startTime = firstEntry.timestamp;
  const endTime = lastEntry.timestamp;
  const duration = new Date(endTime).getTime() - new Date(startTime).getTime();

  const toolsUsed = new Set<string>();
  let projectPath = "unknown";

  for (const entry of entries) {
    if (entry.cwd && projectPath === "unknown") {
      projectPath = entry.cwd;
    }
    if (entry.toolUse?.name) {
      toolsUsed.add(entry.toolUse.name);
    }
  }

  return {
    sessionId: firstEntry.sessionId,
    startTime,
    endTime,
    duration,
    projectPath,
    entryCount: entries.length,
    toolsUsed: Array.from(toolsUsed),
  };
}

/**
 * Filter transcript entries by type
 */
export function filterEntriesByType(
  entries: TranscriptEntry[],
  types: TranscriptEntry["type"][],
): TranscriptEntry[] {
  return entries.filter((entry) => types.includes(entry.type));
}

/**
 * Get transcript summary
 */
export function getTranscriptSummary(entries: TranscriptEntry[]): {
  totalEntries: number;
  userMessages: number;
  assistantMessages: number;
  toolUses: number;
  errors: number;
} {
  const summary = {
    totalEntries: entries.length,
    userMessages: 0,
    assistantMessages: 0,
    toolUses: 0,
    errors: 0,
  };

  for (const entry of entries) {
    switch (entry.type) {
      case "user":
        summary.userMessages++;
        break;
      case "assistant":
        summary.assistantMessages++;
        break;
      case "tool_use":
        summary.toolUses++;
        if (entry.toolResult?.error) {
          summary.errors++;
        }
        break;
    }
  }

  return summary;
}
