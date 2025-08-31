# Changelog

All notable changes to c0ntextKeeper will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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