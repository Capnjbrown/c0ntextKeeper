/**
 * Core type definitions for c0ntextKeeper
 */

// Transcript-related types
export interface TranscriptEntry {
  type: 'user' | 'assistant' | 'tool_use' | 'system';
  timestamp: string;
  sessionId: string;
  cwd?: string;
  message?: {
    role: string;
    content: string;
  };
  toolUse?: {
    name: string;
    input: any;
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
  extractedAt: 'preCompact' | 'manual' | 'scheduled';
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
  type: 'addition' | 'deletion' | 'modification';
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
  impact: 'high' | 'medium' | 'low';
  tags: string[];
}

export interface Pattern {
  id: string;
  type: 'code' | 'command' | 'architecture' | 'error-handling';
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
  filesModified: string[];
  relevanceScore: number;
  extractionVersion: string;
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
}

// MCP Tool types
export interface FetchContextInput {
  query?: string;
  limit?: number;
  scope?: 'session' | 'project' | 'global';
  timeRange?: DateRange;
  minRelevance?: number;
}

export interface SearchArchiveInput {
  query: string;
  filePattern?: string;
  dateRange?: DateRange;
  projectPath?: string;
  limit?: number;
  sortBy?: 'relevance' | 'date' | 'frequency';
}

export interface GetPatternsInput {
  type?: 'code' | 'command' | 'architecture' | 'error-handling' | 'all';
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
  hook_event_name: string;
  transcript_path?: string;
  session_id?: string;
  project_path?: string;
  timestamp: string;
}

export interface HookOutput {
  status: 'success' | 'error' | 'skipped';
  message?: string;
  archiveLocation?: string;
  stats?: {
    problems: number;
    implementations: number;
    decisions: number;
    patterns: number;
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