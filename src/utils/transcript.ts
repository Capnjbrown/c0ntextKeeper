/**
 * Transcript parsing utilities
 */

import { createReadStream } from 'fs';
import readline from 'readline';
import { TranscriptEntry } from '../core/types.js';

/**
 * Parse a JSONL transcript file line by line
 */
export async function parseTranscript(transcriptPath: string): Promise<TranscriptEntry[]> {
  const entries: TranscriptEntry[] = [];
  
  const fileStream = createReadStream(transcriptPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (line.trim()) {
      try {
        const entry = JSON.parse(line);
        entries.push(normalizeEntry(entry));
      } catch (error) {
        console.error(`Failed to parse transcript line: ${error}`);
        // Continue parsing other lines
      }
    }
  }

  return entries;
}

/**
 * Parse transcript from string content
 */
export function parseTranscriptContent(content: string): TranscriptEntry[] {
  const entries: TranscriptEntry[] = [];
  const lines = content.split('\n');

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
 * Normalize a transcript entry to ensure consistent structure
 */
function normalizeEntry(entry: any): TranscriptEntry {
  // Handle different entry formats that might exist
  const normalized: TranscriptEntry = {
    type: entry.type || 'unknown',
    timestamp: entry.timestamp || new Date().toISOString(),
    sessionId: entry.sessionId || entry.session_id || 'unknown'
  };

  // Add optional fields if present
  if (entry.cwd) {
    normalized.cwd = entry.cwd;
  }

  if (entry.message) {
    normalized.message = {
      role: entry.message.role || 'unknown',
      content: entry.message.content || ''
    };
  }

  if (entry.toolUse || entry.tool_use) {
    const toolUse = entry.toolUse || entry.tool_use;
    normalized.toolUse = {
      name: toolUse.name || '',
      input: toolUse.input || {}
    };
  }

  if (entry.toolResult || entry.tool_result) {
    const toolResult = entry.toolResult || entry.tool_result;
    normalized.toolResult = {
      output: toolResult.output,
      error: toolResult.error
    };
  }

  return normalized;
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
    errors.push('No entries found in transcript');
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
  const sessionIds = new Set(entries.map(e => e.sessionId));
  if (sessionIds.size > 1) {
    errors.push(`Multiple session IDs found: ${Array.from(sessionIds).join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors
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
    throw new Error('No entries to extract metadata from');
  }

  const firstEntry = entries[0];
  const lastEntry = entries[entries.length - 1];
  
  const startTime = firstEntry.timestamp;
  const endTime = lastEntry.timestamp;
  const duration = new Date(endTime).getTime() - new Date(startTime).getTime();

  const toolsUsed = new Set<string>();
  let projectPath = 'unknown';

  for (const entry of entries) {
    if (entry.cwd && projectPath === 'unknown') {
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
    toolsUsed: Array.from(toolsUsed)
  };
}

/**
 * Filter transcript entries by type
 */
export function filterEntriesByType(
  entries: TranscriptEntry[],
  types: TranscriptEntry['type'][]
): TranscriptEntry[] {
  return entries.filter(entry => types.includes(entry.type));
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
    errors: 0
  };

  for (const entry of entries) {
    switch (entry.type) {
      case 'user':
        summary.userMessages++;
        break;
      case 'assistant':
        summary.assistantMessages++;
        break;
      case 'tool_use':
        summary.toolUses++;
        if (entry.toolResult?.error) {
          summary.errors++;
        }
        break;
    }
  }

  return summary;
}