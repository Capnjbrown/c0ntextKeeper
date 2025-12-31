/**
 * c0ntextKeeper - MCP Context Preservation System
 *
 * Public API exports for programmatic usage.
 * For CLI usage, use the `c0ntextkeeper` command.
 * For MCP server, use `c0ntextkeeper-server` or configure via Claude Code.
 *
 * @packageDocumentation
 */

// Core exports - Main classes for context operations
export { ContextArchiver } from "./core/archiver.js";
export { ContextRetriever } from "./core/retriever.js";
export { PatternAnalyzer } from "./core/patterns.js";

// Type exports - All public interfaces and types
export type {
  ToolInput,
  TranscriptEntry,
  ExtractedContext,
  Problem,
  Solution,
  Implementation,
  CodeChange,
  Decision,
  Pattern,
  ContextMetadata,
  ProjectIndex,
  SessionSummary,
  FetchContextInput,
  SearchArchiveInput,
  GetPatternsInput,
  DateRange,
  SearchResult,
  Match,
  C0ntextKeeperConfig,
} from "./core/types.js";

// Utility exports - Helper functions and classes
export { SecurityFilter } from "./utils/security-filter.js";
export {
  getStoragePath,
  getProjectPaths,
  initializeStorage,
  CONTEXTKEEPER_DIR,
  GLOBAL_DIR,
} from "./utils/path-resolver.js";
export type { StorageOptions, ProjectStorage } from "./utils/path-resolver.js";
