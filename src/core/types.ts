/**
 * Core type definitions for c0ntextKeeper
 */

// Tool input interface for Claude Code tools
// Covers common properties across Read, Write, Edit, Bash, Glob, etc.
export interface ToolInput {
  file_path?: string;
  path?: string;
  uri?: string;
  notebook_path?: string;
  content?: string;
  new_string?: string;
  new_content?: string;
  old_string?: string;
  command?: string;
  cwd?: string;
  pattern?: string;
  query?: string;
  [key: string]: unknown; // Allow other properties
}

// Transcript-related types
export interface TranscriptEntry {
  type:
    | "user"
    | "assistant"
    | "tool_use"
    | "tool_result"
    | "system"
    | "unknown";
  timestamp: string;
  sessionId: string;
  cwd?: string;
  message?: {
    role: string;
    content:
      | string
      | Array<{ type: string; text?: string; [key: string]: unknown }>;
  };
  toolUse?: {
    name: string;
    input: ToolInput;
  };
  toolResult?: {
    output?: string;
    error?: string;
  };
}

// Context extraction types
export interface ExtractedContext {
  sessionId: string;
  projectPath: string;
  timestamp: string;
  extractedAt: "preCompact" | "manual" | "scheduled";
  problems: Problem[];
  implementations: Implementation[];
  decisions: Decision[];
  patterns: Pattern[];
  metadata: ContextMetadata;
}

export interface Problem {
  id: string;
  question: string;
  timestamp: string;
  solution?: Solution;
  tags: string[];
  relevance: number;
}

export interface Solution {
  approach: string;
  files: string[];
  successful: boolean;
  implementation?: string;
}

export interface Implementation {
  id: string;
  tool: string;
  file: string;
  description: string;
  timestamp: string;
  changes?: CodeChange[];
  relevance: number;
}

export interface CodeChange {
  type: "addition" | "deletion" | "modification";
  lineStart: number;
  lineEnd: number;
  content: string;
}

export interface Decision {
  id: string;
  decision: string;
  context: string;
  rationale?: string;
  timestamp: string;
  impact: "high" | "medium" | "low";
  tags: string[];
}

export interface Pattern {
  id: string;
  type: "code" | "command" | "architecture" | "error-handling";
  value: string;
  frequency: number;
  lastSeen: string;
  firstSeen: string;
  examples: string[];
}

export interface ContextMetadata {
  entryCount: number;
  duration: number; // in milliseconds
  toolsUsed: string[];
  toolCounts: Record<string, number>; // Count of each tool usage
  filesModified: string[];
  relevanceScore: number;
  extractionVersion: string;
  isTest?: boolean; // Flag to indicate test/validation data
}

// Storage types
export interface ProjectIndex {
  projectPath: string;
  projectHash: string;
  sessions: SessionSummary[];
  totalProblems: number;
  totalImplementations: number;
  totalDecisions: number;
  totalPatterns: number;
  lastUpdated: string;
  created: string;
  // Enhanced analytics fields
  totalToolUsage?: Record<string, number>; // Aggregate tool usage counts
  mostUsedTools?: string[]; // Top 5 most frequently used tools
  totalFilesModified?: number; // Total unique files modified
  averageRelevanceScore?: number; // Average relevance across all sessions
  version?: string; // c0ntextKeeper version
}

export interface SessionSummary {
  sessionId: string;
  timestamp: string;
  file: string;
  stats: {
    problems: number;
    implementations: number;
    decisions: number;
    patterns: number;
  };
  relevanceScore: number;
  // Enhanced fields for better analytics
  toolsUsed?: string[]; // List of tools used in session
  toolCounts?: Record<string, number>; // Tool usage counts
  filesModified?: number; // Count of files modified
  duration?: number; // Session duration in milliseconds
  topProblem?: string; // Most relevant problem excerpt
  extractionVersion?: string; // Version that created this archive
}

// MCP Tool types
export interface FetchContextInput {
  query?: string;
  limit?: number;
  scope?: "session" | "project" | "global";
  timeRange?: DateRange;
  minRelevance?: number;
}

export interface SearchArchiveInput {
  query: string;
  filePattern?: string;
  dateRange?: DateRange;
  projectPath?: string;
  limit?: number;
  sortBy?: "relevance" | "date" | "frequency";
}

export interface GetPatternsInput {
  type?: "code" | "command" | "architecture" | "error-handling" | "all";
  minFrequency?: number;
  projectPath?: string;
  limit?: number;
}

export interface DateRange {
  from: string;
  to: string;
}

export interface SearchResult {
  context: ExtractedContext;
  matches: Match[];
  relevance: number;
}

export interface Match {
  field: string;
  snippet: string;
  score: number;
}

// Configuration types
export interface C0ntextKeeperConfig {
  storage: {
    basePath: string;
    maxArchiveSize: number; // in MB
    compressionEnabled: boolean;
    retentionDays: number;
  };
  extraction: {
    relevanceThreshold: number; // 0-1
    maxContextItems: number;
    patterns: {
      code: boolean;
      commands: boolean;
      decisions: boolean;
      problems: boolean;
    };
  };
  search: {
    defaultLimit: number;
    enableSemanticSearch: boolean;
    similarityThreshold: number;
  };
  team?: {
    syncEnabled: boolean;
    syncUrl?: string;
    teamId?: string;
  };
}

// Hook types
export interface HookInput {
  hook_event_name: "PreCompact" | "preCompact" | string; // Accept both capitalizations
  session_id: string;
  transcript_path: string;
  trigger?: "manual" | "auto"; // How compaction was triggered
  custom_instructions?: string; // User instructions for manual compaction
  project_path?: string; // Optional project directory path
  timestamp?: string; // Optional ISO 8601 timestamp
}

export interface HookOutput {
  status: "success" | "error" | "skipped";
  message?: string;
  archiveLocation?: string;
  stats?: {
    problems: number;
    implementations: number;
    decisions: number;
    patterns: number;
  };
}

// New Hook Types (Claude Code v1.0.55+)

/**
 * Notification Hook Input
 * Triggered when Claude Code shows notifications to the user
 */
export interface NotificationHookInput {
  hook_event_name: "Notification";
  session_id: string;
  notification_type: "permission_prompt" | "idle_prompt" | "auth_success" | "elicitation_dialog" | string;
  message?: string;
  details?: Record<string, unknown>;
  timestamp?: string;
  project_path?: string;
}

/**
 * Record stored for each notification
 */
export interface NotificationRecord {
  sessionId: string;
  notificationType: string;
  message?: string;
  timestamp: string;
  projectPath?: string;
  details?: Record<string, unknown>;
}

// NOTE: SubagentStopHookInput and SubagentRecord removed in v0.7.8
// Claude Code doesn't send the required fields (subagent_type, tools_used, transcript)
// Making the feature non-functional - removed rather than keeping broken feature

/**
 * SessionStart Hook Input
 * Triggered when a Claude Code session starts
 */
export interface SessionStartHookInput {
  hook_event_name: "SessionStart";
  session_id: string;
  session_type: "startup" | "resume" | "clear" | "compact" | string;
  timestamp?: string;
  project_path?: string;
  cwd?: string;
  env?: Record<string, string>;
}

/**
 * Record stored for session metadata
 */
export interface SessionMetaRecord {
  sessionId: string;
  sessionType: string;
  startTime: string;
  endTime?: string;
  durationMs?: number;
  projectPath?: string;
  cwd?: string;
  status: "active" | "completed" | "ended";
}

/**
 * SessionEnd Hook Input
 * Triggered when a Claude Code session ends
 */
export interface SessionEndHookInput {
  hook_event_name: "SessionEnd";
  session_id: string;
  reason?: "user_exit" | "timeout" | "error" | "compact" | string;
  timestamp?: string;
  project_path?: string;
  stats?: {
    messages_exchanged?: number;
    tools_used?: number;
    duration_ms?: number;
  };
}

// Relevance scoring types
export interface RelevanceFactors {
  hasCodeChanges: boolean;
  hasErrorResolution: boolean;
  hasDecision: boolean;
  hasProblemSolution: boolean;
  toolComplexity: number;
  userEngagement: number;
}

export interface ScoringWeights {
  codeChanges: number;
  errorResolution: number;
  decisions: number;
  problemSolution: number;
  toolComplexity: number;
  userEngagement: number;
}
