# Changelog

All notable changes to c0ntextKeeper will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.7.0] - 2025-09-10

### Added
- **Automatic Context Loading**: Revolutionary auto-load feature for MCP server
  - Context automatically provided when Claude Code connects to MCP server
  - Zero-configuration with sensible defaults - works out of the box
  - Configurable loading strategies: smart, recent, relevant, or custom
  - Size-aware loading with configurable limits (default 50KB)
  - MCP resource exposure at `context://project/{name}/current`
- **Context Loader Module** (`src/core/context-loader.ts`):
  - Intelligent context aggregation from multiple sources
  - Smart strategy combines sessions, patterns, knowledge, and prompts
  - Recent strategy focuses on latest sessions
  - Relevant strategy uses keyword matching
  - Custom strategy allows full user control
  - Automatic size management and truncation
- **Enhanced Configuration System**:
  - New `autoLoad` configuration section with comprehensive settings
  - Configurable session, pattern, knowledge, and prompt counts
  - Time window filtering (default 7 days)
  - Priority keyword matching for relevant content
  - Format style options: summary, detailed, or minimal
- **New CLI Commands**:
  - `c0ntextkeeper context preview`: Preview auto-loaded context
  - `c0ntextkeeper context test`: Test context loading strategies
  - `c0ntextkeeper context configure`: Interactive configuration wizard
  - Enhanced output formatting with size indicators
- **MCP Resource Support**:
  - Automatic resource listing when auto-load is enabled
  - Dynamic resource generation based on configuration
  - Support for patterns and knowledge base resources
  - Proper MIME type handling (text/markdown)

### Enhanced
- **MCP Server**: Now supports ListResourcesRequestSchema and ReadResourceRequestSchema
- **Configuration Manager**: Added getAutoLoadSettings() and updateAutoLoadSettings() methods
- **CLI Architecture**: Added new context command group with subcommands
- **Documentation**: Added comprehensive auto-load guide
- **Test Coverage**: Added tests for context-loader module

### Changed
- Updated all version references to 0.7.0
- Enhanced server startup to support resource handlers
- Improved CLI help text with better command descriptions

## [0.6.0] - 2025-09-09

### Added
- **Unified Storage Architecture**: Streamlined storage system with intelligent organization
  - Archives organized by project name instead of cryptic hashes
  - Global storage default at `~/.c0ntextkeeper/archive/`
  - Project-local storage optional with `.c0ntextkeeper/`
  - `CONTEXTKEEPER_FORCE_GLOBAL` environment variable for development
- **Enhanced Storage Management**:
  - `c0ntextkeeper init`: Initialize project-local or global storage
  - `c0ntextkeeper status`: Shows storage configuration and automation status
  - `c0ntextkeeper hooks test <hook>`: Test individual hooks
  - Test archives separated from production data in `test/` folder
- **Improved Path Resolution** (`src/utils/path-resolver.ts`):
  - 5-step resolution: FORCE_GLOBAL → CONTEXTKEEPER_HOME → local → walk up → global
  - Project name extraction utilities in `src/utils/project-utils.ts`
  - Dynamic path resolution for all hooks
  - No hardcoded usernames - fully portable
- **Cleaner Archive Structure**:
  - Removed duplicate folders at root level
  - Everything organized under `archive/projects/[project-name]/`
  - Separate folders for sessions, knowledge, patterns, prompts
- **Documentation Updates**: Comprehensive updates to all documentation

### Enhanced
- **FileStore Module**: Now uses path resolver for dynamic storage location
- **All Hooks**: Updated to use consistent path resolution across all hooks
- **Config System**: Supports merged global + project configuration hierarchy
- **CLI Architecture**: Reorganized with new init command module (`src/cli/init.ts`)
- **Test Coverage**: Added comprehensive tests for path resolution (19 tests)

### Changed
- Storage path resolution now follows intelligent hierarchy with fallback
- Hooks automatically find appropriate storage location without configuration
- Configuration loading merges global and project settings seamlessly
- Default storage location can be overridden via environment variables

## [0.5.3] - 2025-09-05

### Changed
- **BREAKING**: Migrated all archive files from JSONL to JSON format for consistency
  - Prompts: Now stored as `YYYY-MM-DD-prompts.json` (was `.jsonl`)
  - Patterns: Now stored as `YYYY-MM-DD-patterns.json` (was `.jsonl`)
  - Knowledge: Now stored as `YYYY-MM-DD-knowledge.json` (was `.jsonl`)
  - Errors: Now stored as `YYYY-MM-DD-errors.json` (was `.jsonl`)
  - All files now use formatted JSON with 2-space indentation

### Added
- **Test Data Separation**: Automatic separation of test/validation data from real session data
  - Test sessions stored in `projects/[name]/test/` directory
  - Real sessions remain in `projects/[name]/sessions/` directory
  - Test data excluded from project statistics and indexes
  - Added `isTest` flag to metadata for identification
- **File Format Documentation**: Comprehensive file formats documentation
  - Complete format specifications for all archive types
  - Storage structure documentation
  - Migration guidance from JSONL to JSON

### Enhanced
- **Data Readability**: All archive files now human-readable with proper formatting
- **Consistency**: Unified JSON format across all storage types
- **File Naming**: Standardized naming conventions across all archive types
- **Storage Management**: Daily files now use consistent patterns

### Fixed
- Documentation inconsistencies about file formats
- File naming conventions across different archive types
- Test data contamination in project statistics

## [0.5.2] - 2025-09-04

### Fixed
- **Storage Size Display**: Fixed `c0ntextkeeper stats` showing "0 Bytes" for archives under 1MB
  - Changed file-store.ts to return bytes instead of pre-converted MB
  - CLI now properly formats bytes using formatFileSize()
- **Version Display**: CLI now correctly shows v0.5.1+ instead of v0.1.0
- **MCP Server Version**: Updated from v0.5.0 to v0.5.1 for consistency
- **Status Command Formatting**: Fixed excessive line breaks with '═' characters
  - Resolved issue with characters appearing on individual lines

### Enhanced
- **Search Command UX**: Made query parameter optional
  - Shows 5 most recent archives when no query provided
  - Displays helpful search examples
  - Provides tips for new users with empty archives
- **CLI Error Messages**: Improved user experience for missing arguments
  - Added `showHelpAfterError()` for helpful hints on all commands
  - Hook commands now show available options (PreCompact, UserPromptSubmit, PostToolUse, Stop)
  - Archive command description includes example usage

### Changed
- Search command syntax from `search <query>` to `search [query]`
- Hook command descriptions now list all available hook names
- Archive command description now shows example: "path/to/transcript.jsonl"
- Prefixed unused formatter imports with underscore to satisfy linter

## [0.5.1] - 2025-09-03

### Fixed
- **Content Truncation**: Increased limits from 200-500 chars to configurable 1000-2000 chars
  - Questions and solutions now preserve up to 2000 characters
  - Implementation descriptions preserve up to 1000 characters
  - Decision descriptions preserve up to 500 characters
- **Session Naming**: Fixed unhelpful names like "that" and "then"
  - Added 100+ common English stopwords to filter
  - Improved keyword extraction with length preference
  - Better fallback strategies using timestamp when no keywords found
- **File Path Tracking**: Improved for all tools
  - Bash commands now show cwd or "bash_session"
  - TodoWrite shows "todo_management"
  - Tools without files use tool name as fallback
- **Duration Calculation**: Fixed negative duration values
  - Uses Math.min/max for proper timestamp ordering
  - Returns absolute value to prevent negative durations

### Added
- **Configurable Content Limits** in `config.ts`
  - `contentLimits.question`: 2000 (default)
  - `contentLimits.solution`: 2000 (default)
  - `contentLimits.implementation`: 1000 (default)
  - `contentLimits.decision`: 500 (default)

### Enhanced
- **Relevance Scoring** for administrative tools
  - TodoWrite: Now scores 0.5 with decision factor
  - Bash: Base score 0.4 (0.5 for git commands)
  - Grep/Search: 0.3-0.4 based on complexity
- **Session Naming** with comprehensive stopword list
  - Filters articles, pronouns, prepositions, auxiliary verbs
  - Prefers longer, more specific technical terms
  - Debug logging for troubleshooting naming issues

### Changed
- Extractor constructor now accepts contentLimits parameter
- Session namer extractKeywords function rewritten for better filtering
- Updated package version to 0.5.1

## [0.5.0] - 2025-09-02

**Note**: v0.5.0 refers to both the npm package version and the internal extraction algorithm version. These are aligned in this release to ensure compatibility.

### Fixed
- **Critical**: Claude Code JSONL format parsing now handles embedded content arrays correctly
- **Critical**: User questions now score 1.0 relevance (was incorrectly 0.06)
- **Important**: Tool tracking now properly extracts tool_use and tool_result from embedded content
- Test files updated to use Claude's array format instead of strings
- Example archives updated to version 0.5.0

### Added
- 50+ semantic problem indicators for enhanced extraction
- 30+ request patterns for better problem detection
- Support for "tool_result" and "unknown" entry types
- Comprehensive content array parsing in normalizeEntry()
- extractToolResultContent() helper for proper result extraction

### Enhanced
- Relevance scoring algorithm with special handling for questions
- Problem extraction with semantic patterns like "how do", "why", "implement", etc.
- Solution detection with action verbs and code blocks
- Decision extraction with improved pattern matching
- Tool tracking with proper embedded content handling

### Changed
- Extraction version updated from 0.2.0 to 0.5.0
- All test fixtures updated to Claude Code format
- Example transcripts converted to array format
- Archive generation now captures significantly more context

## [0.4.0] - 2025-08-30

### Added
- **GitHub Templates** for issues and pull requests
- **CODE_OF_CONDUCT.md** with Contributor Covenant
- **SECURITY.md** with vulnerability reporting guidelines
- **Repository Settings Guide** in .github/REPOSITORY_SETTINGS.md
- **Branch Strategy Documentation** in .github/BRANCH_STRATEGY.md
- **Public Readiness Validation Script** at scripts/validate-public-ready.sh
- **Enhanced README Badges** including npm downloads, codecov, and GitHub stars
- **Post-install script** for automatic setup after npm install

### Changed
- **README badges** updated to use dynamic shields.io badges
- **Repository prepared for public release** with comprehensive documentation
- **Security improvements** with removal of sensitive files

### Security
- Removed exposed GitHub token from .env file
- Enhanced .gitignore for better security
- Added security policy for vulnerability reporting

## [0.3.0] - 2025-08-29

### Added
- **Analytics Dashboard** in auto-generated archive README files
- **Tool Usage Tracking** with counts and unique tool lists per session
- **Aggregate Statistics** across all sessions in project index
- **Session Metrics** including duration, files modified, and top problems
- **8 New Formatting Utilities** for enhanced display:
  - `formatFileCount()` - Proper pluralization for file counts
  - `formatDuration()` - Human-readable time display
  - `formatToolStats()` - Tool usage visualization
  - `getTopTools()` - Extract most-used tools
  - `calculateAverage()` - Relevance score averaging
  - `formatRelevance()` - Percentage formatting
  - `truncateText()` - Smart text truncation
  - `getPackageVersion()` - Version tracking
- **Version Tracking** in project index files
- **Quality Metrics** including average relevance scores

### Enhanced
- **SessionSummary** interface with 6 new analytics fields
- **ProjectIndex** interface with aggregate metrics and version tracking
- **Archive README** format with modern GitHub styling and emojis
- **Metadata** capture with comprehensive tool usage data
- **Index Generation** with real-time analytics calculation

### Fixed
- Project name extraction for complex directory paths
- Tool tracking with proper type safety for non-string content
- Archive folder naming (no more "Users-project" folders)

### Improved
- Archive readability with structured analytics sections
- Session insights with inline statistics
- Tool usage visibility across project history
- Context quality tracking with relevance metrics

## [0.2.0] - 2025-08-29

### Fixed
- TypeError "content.toLowerCase is not a function" in extraction pipeline
- 504 timeout errors during auto-compact with 55-second timeout protection
- Generic archive folder names (project/validation) now show actual project names
- Security filter test failures for nested objects and sensitive keys
- Path case mismatch in settings.json (Projects vs projects)
- Extract methods failing with non-string content (arrays, objects)

### Added
- Type guards for all string operations in scorer.ts and extractor.ts
- Comprehensive debug logging in archiver.ts showing extraction results
- Support for non-string content types in transcript processing
- File logging capability for debugging (C0NTEXTKEEPER_FILE_LOGGING=true)
- Test script for extraction with various content types
- Smart prioritization in parseTranscript (keeps first 20% and last 80% of entries)

### Changed
- Relaxed extraction patterns to capture more context
- Any user question (with "?") now captured as problem
- All tool uses tracked as implementations (not just Write/Edit)
- Assistant responses with action words captured as solutions
- Expanded problem indicators to include request phrases
- Solution detection now includes code blocks and action phrases

### Improved
- Archive creation guaranteed even with minimal extracted content
- Project name extraction from complex directory paths
- Relevance scoring accuracy with better type handling
- Session naming with better keyword extraction
- Timeout handling with proper race conditions

## [0.1.0] - 2025-08-28

### Initial Release
- Core extraction engine for problems, solutions, implementations, and decisions
- PreCompact hook integration with Claude Code
- MCP server with fetch_context, search_archive, and get_patterns tools
- File-based storage system with project organization
- Security filtering for sensitive data
- CLI with hook management commands
- Comprehensive test suite with Jest
- TypeScript implementation with strict type safety