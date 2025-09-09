# Project Context Document
<!-- Generated: 2025-09-03 -->
<!-- Generator: Claude Code CLI Context Discovery -->
<!-- Last Updated: 2025-09-09 for v0.6.0 -->

## Project Identification

### Basic Information
- **Project Name**: c0ntextKeeper
- **Project Type**: MCP Server / CLI Tool / Node.js Library
- **Primary Language(s)**: TypeScript (100%)
- **Version**: 0.6.0 (Package) / 0.6.0 (Extraction Algorithm) / 0.6.0 (MCP Server)
- **Repository**: https://github.com/Capnjbrown/c0ntextKeeper

### Purpose Statement
c0ntextKeeper is an intelligent context preservation and retrieval system for Claude Code that **automatically** captures valuable context before compaction - both when you manually run `/compact` AND when Claude Code automatically compacts context due to size limits. It solves the critical problem of context loss during Claude Code sessions by extracting, scoring, and archiving problems, solutions, implementations, and decisions with 50+ semantic patterns, making them instantly retrievable through MCP tools. The system features a comprehensive analytics dashboard (v0.3.0+) showing tool usage statistics, session metrics, and quality scores. With v0.5.0's Claude Code JSONL format compatibility, it properly handles embedded content arrays and ensures user questions score 1.0 relevance. Version 0.5.1 enhances content preservation with configurable limits (2000 chars for questions/solutions), improved session naming with 100+ stopwords, better file path tracking, and enhanced relevance scoring for administrative tools. Version 0.5.3 standardizes all archive storage to JSON format for consistency and readability, adds automatic test data separation, and provides comprehensive file format documentation. Version 0.6.0 introduces a hybrid storage architecture with intelligent path resolution, supporting both project-local (`.c0ntextkeeper/`) and global (`~/.c0ntextkeeper/`) storage modes, along with new CLI commands for storage management (`init`, `status`). The system works fully automatically, requiring zero manual intervention after initial setup.

## Discovery Findings

### Detected Stack
- **Languages Found**: 
  - TypeScript (.ts files): Primary language for all source code
  - JavaScript (.js files): Scripts and configuration
  - Shell (.sh files): Setup and validation scripts
- **Frameworks/Libraries**: 
  - @modelcontextprotocol/sdk: MCP server implementation
  - Zod v4: Runtime type validation and schema definition
  - Commander v14: CLI interface construction
  - dotenv v17: Environment variable management
- **Build Tools**: 
  - TypeScript v5.9.2: Compilation with strict mode
  - tsx v4.19.2: Development runtime
  - npm: Package management
- **Package Managers**: npm (with package-lock.json)
- **Database/Storage**: File-based JSON storage with hybrid architecture (v0.6.0)
  - Project-local: `.c0ntextkeeper/` within project directories
  - Global: `~/.c0ntextkeeper/` for shared context
  - Intelligent path resolution with directory tree walking
  - Environment variable override via `CONTEXTKEEPER_HOME`
- **Testing Frameworks**: 
  - Jest v30: Unit and integration testing
  - ts-jest v29: TypeScript test execution

### Project Structure
```
c0ntextKeeper/
├── src/                       # Source code (TypeScript)
│   ├── cli/                   # CLI command implementations
│   │   ├── hooks-manager.ts   # Hook configuration management
│   │   └── init.ts            # Storage initialization commands
│   ├── core/                  # Core business logic
│   │   ├── archiver.ts        # Context archival logic
│   │   ├── config.ts          # Configuration management (v0.5.1: contentLimits)
│   │   ├── extractor.ts       # Context extraction engine (v0.5.1: 2000 char limits)
│   │   ├── patterns.ts        # Pattern recognition and analysis
│   │   ├── retriever.ts       # Context retrieval and search
│   │   ├── scorer.ts          # Relevance scoring (v0.5.1: enhanced admin tools)
│   │   └── types.ts           # TypeScript type definitions
│   ├── hooks/                 # Claude Code hook handlers
│   │   ├── precompact.ts      # PreCompact hook (auto/manual capture)
│   │   ├── userprompt.ts      # UserPromptSubmit hook (v0.5.3: JSON storage)
│   │   ├── posttool.ts        # PostToolUse hook (v0.5.3: JSON storage)
│   │   └── stop.ts            # Stop hook for Q&A pairs (v0.5.3: JSON storage)
│   ├── server/                # MCP server implementation
│   │   └── index.ts           # MCP server entry point
│   ├── storage/               # Storage abstraction layer
│   │   └── file-store.ts      # File-based storage implementation
│   ├── tools/                 # MCP tool implementations (empty - integrated in server)
│   ├── utils/                 # Utility functions
│   │   ├── filesystem.ts      # File system operations
│   │   ├── formatter.ts       # Display formatting utilities
│   │   ├── logger.ts          # Logging infrastructure
│   │   ├── path-resolver.ts   # Hybrid storage path resolution (v0.6.0)
│   │   ├── security-filter.ts # Sensitive data filtering
│   │   ├── session-namer.ts   # Session naming (v0.5.1: 100+ stopwords)
│   │   └── transcript.ts      # JSONL transcript parser
│   └── cli.ts                 # CLI entry point
├── scripts/                   # Utility and setup scripts
│   ├── setup-hooks.js         # Hook installation
│   ├── test-extraction.js     # Extraction testing
│   └── validate-public-ready.sh # Public release validation
├── tests/                     # Test suite
│   ├── unit/                  # Unit tests
│   ├── integration/           # Integration tests
│   └── fixtures/              # Test data
├── dist/                      # Compiled JavaScript output
├── docs/                      # Additional documentation
│   └── STORAGE.md             # Storage architecture documentation (v0.6.0)
└── examples/                  # Usage examples
```

### Entry Points & Main Components
- **Main Entry**: `dist/cli.js` (CLI) and `dist/server/index.js` (MCP server)
- **Core Modules**:
  - **Extractor**: Analyzes JSONL transcripts with 50+ semantic patterns (v0.5.1: configurable content limits up to 2000 chars)
  - **Scorer**: Multi-factor relevance scoring (v0.5.1: TodoWrite 0.5, Bash 0.4, improved admin tools)
  - **Archiver**: Manages context storage with analytics
  - **Retriever**: Fast context search and retrieval
  - **Patterns**: Identifies recurring solutions and approaches
- **Configuration Loading**: Via `config.ts` with contentLimits (v0.5.1) and `~/.c0ntextkeeper/config.json`

## Functionality Analysis

### Identified Features
| Feature | Location | Evidence | Status |
|---------|----------|----------|--------|
| Automatic context preservation | `/src/hooks/precompact.ts` | Captures on BOTH manual `/compact` AND automatic compaction | ✅ Active |
| PreCompact hook | `/src/hooks/precompact.ts` | Primary hook, enabled by default, fully automatic | ✅ Active |
| UserPromptSubmit hook | `/src/hooks/userprompt.ts` | Tracks user questions and prompts | ✅ Implemented |
| PostToolUse hook | `/src/hooks/posttool.ts` | Captures tool usage patterns | ✅ Implemented |
| Stop hook | `/src/hooks/stop.ts` | Saves complete Q&A exchanges | ✅ Implemented |
| JSONL transcript parsing | `/src/utils/transcript.ts` | Claude Code format with embedded arrays | ✅ Active |
| Problem/solution extraction | `/src/core/extractor.ts` | 50+ semantic patterns, configurable limits (v0.5.1) | ✅ Active |
| Relevance scoring | `/src/core/scorer.ts` | Enhanced admin tool scoring (v0.5.1) | ✅ Active |
| Session naming | `/src/utils/session-namer.ts` | 100+ stopwords, smart fallbacks (v0.5.1) | ✅ Active |
| Content preservation | `/src/core/config.ts` | Configurable limits: 2000/1000 chars (v0.5.1) | ✅ Active |
| Pattern recognition | `/src/core/patterns.ts` | Recurring pattern identification | ✅ Active |
| Security filtering | `/src/utils/security-filter.ts` | API key and PII redaction | ✅ Active |
| Analytics dashboard | `/src/core/archiver.ts` | Rich statistics in README.md per archive | ✅ Active |
| MCP tool serving | `/src/server/index.ts` | Three active tools (version needs update) | ✅ Active |
| CLI interface | `/src/cli.ts` | Comprehensive command set | ✅ Active |
| Hook management | `/src/cli/hooks-manager.ts` | Enable/disable/test/configure hooks | ✅ Active |

### API Surface

#### MCP Tools (via MCP Server)
1. **fetch_context**
   - Query: Optional search query
   - Limit: 1-100 results (default: 5)
   - Scope: session/project/global
   - MinRelevance: 0-1 threshold

2. **search_archive**
   - Query: Required search term
   - FilePattern: Optional file filter
   - DateRange: Optional time filter
   - SortBy: relevance/date/frequency

3. **get_patterns**
   - Type: code/command/architecture/all
   - MinFrequency: Minimum occurrences
   - Limit: 1-50 results

#### CLI Commands
```bash
c0ntextkeeper init              # Initialize storage (project-local or global)
c0ntextkeeper init --global     # Initialize global storage
c0ntextkeeper status            # Check storage configuration and status
c0ntextkeeper setup             # Configure hooks
c0ntextkeeper archive <file>    # Manual archive
c0ntextkeeper search [query]    # Search archives (shows recent if no query)
c0ntextkeeper patterns          # Analyze patterns
c0ntextkeeper stats             # Storage statistics
c0ntextkeeper migrate           # Migrate old archives
c0ntextkeeper validate          # Verify installation
c0ntextkeeper hooks <subcommand> # Hook management
```

## Data & State Management

### Data Models
```typescript
// Core entities discovered in types.ts
- ExtractedContext: Main context container
- Problem: Question with optional solution
- Solution: Approach, files, success status
- Implementation: Tool usage and file changes
- Decision: Architectural decisions with rationale
- Pattern: Recurring code/command patterns
- SessionSummary: Session metadata and statistics
- ProjectIndex: Project-level aggregation
```

### State Persistence
- **Primary Storage**: File-based JSON in `~/.c0ntextkeeper/archive/`
- **Caching Layer**: None detected
- **Session Management**: Session-based file organization

### Data Flow
1. Claude Code triggers hook (PreCompact/UserPrompt/PostTool/Stop)
2. Hook reads JSONL transcript from Claude Code
3. Extractor processes transcript with 50+ patterns
4. Scorer calculates relevance (0-1 scale)
5. Archiver stores in structured JSON with analytics
6. MCP tools provide retrieval access

## Dependencies & Integrations

### Direct Dependencies
| Dependency | Version | Purpose (inferred) | Critical? |
|------------|---------|-------------------|-----------|
| @modelcontextprotocol/sdk | ^1.17.4 | MCP server implementation | Yes |
| zod | ^4.1.5 | Runtime type validation | Yes |
| dotenv | ^17.2.1 | Environment configuration | No |
| commander | ^14.0.0 | CLI interface | Yes |
| p-queue | ^8.0.1 | Queue management | No |
| debounce-fn | ^6.0.0 | Function debouncing | No |

### External Services
| Service | Integration Point | Authentication | Purpose |
|---------|------------------|----------------|---------|
| Claude Code | Hook system | Local file access | Context preservation trigger |
| npm registry | Package distribution | NPM_TOKEN | Package publishing |
| GitHub | CI/CD and repository | GITHUB_TOKEN | Source control and automation |
| Codecov | CI pipeline | Token | Coverage reporting |

### Environment Requirements
```bash
# From .env.example and code analysis
LOG_LEVEL=INFO           # Logging verbosity
RETENTION_DAYS=90        # Archive retention period
MAX_CONTEXT_ITEMS=50     # Extraction limit
RELEVANCE_THRESHOLD=0.5  # Minimum relevance score
C0NTEXTKEEPER_FILE_LOGGING=true # Enable file logging
```

## Development Workflow

### Build Process
```bash
# Development
npm run dev              # Start with watch mode (tsx)
npm run cli             # Run CLI directly

# Production
npm run build           # TypeScript compilation
npm run prepublishOnly  # Pre-publish build

# Quality
npm run lint            # ESLint v9 checking
npm run typecheck       # TypeScript validation
npm run format          # Prettier formatting
```

### Test Infrastructure
- **Test Files Found**: 2 unit test files (extractor.test.ts, security-filter.test.ts)
- **Test Types**: Unit tests, integration tests planned
- **Coverage**: Coverage reporting via Jest with Codecov integration
- **Test Commands**: 
  ```bash
  npm test                # Run all tests
  npm run test:watch      # Watch mode
  npm run test:coverage   # Generate coverage report
  ```

### Development Setup
```bash
# Inferred setup process
git clone https://github.com/Capnjbrown/c0ntextKeeper.git
cd c0ntextKeeper
npm install              # Install dependencies
npm run build           # Build TypeScript
npm link                # Global CLI access
c0ntextkeeper setup     # Configure hooks
```

## Quality & Standards

### Code Organization Patterns
- **Architecture Style**: Modular with clear separation of concerns
- **Design Patterns**: 
  - Command pattern (CLI)
  - Strategy pattern (storage)
  - Observer pattern (hooks)
- **File Naming**: Kebab-case for files, PascalCase for classes
- **Code Style**: ESLint v9 flat config, Prettier formatting

### Documentation Coverage
- **Inline Documentation**: Comprehensive JSDoc comments
- **API Documentation**: Technical docs for tool documentation
- **User Documentation**: README.md, user guides, extensive documentation
- **Developer Documentation**: CONTRIBUTING.md, migration guides

## Deployment & Operations

### Deployment Configuration
- **Target Environment**: Local development machines (macOS/Linux/Windows)
- **Distribution**: npm package + GitHub releases
- **CI/CD Pipeline**: GitHub Actions with semantic release
- **Infrastructure as Code**: Not applicable (local tool)

### Monitoring & Observability
- **Logging**: File-based logging in ~/.c0ntextkeeper/logs/
- **Metrics**: Session statistics and analytics
- **Error Tracking**: Error logging with stack traces
- **Debugging**: Debug scripts in /scripts/ directory

## Security Considerations

### Detected Security Measures
- **Authentication Methods**: None (local tool)
- **Authorization Patterns**: File system permissions
- **Sensitive Data Handling**: 
  - API key redaction (OpenAI, Anthropic, AWS, GitHub)
  - PII partial redaction (emails, IPs, phones)
  - Password and secret filtering
  - JWT token detection
- **Security Headers/Configs**: Not applicable (local tool)

### Potential Concerns
- Relies on file system permissions for security
- No encryption of stored archives
- Sensitive data filtering is pattern-based (may miss custom patterns)

## Project Metadata

### Contributor Information
- **Primary Maintainer**: Jason Brown (@Capnjbrown)
- **License**: MIT
- **Last Activity**: 2025-09-05 (v0.5.3 release)
- **Release Pattern**: Semantic versioning with CHANGELOG.md

### Version History
- **Current Version**: 0.5.3
- **Major Milestones**:
  - v0.5.3: JSON format standardization and test data separation
  - v0.5.2: CLI UX improvements and bug fixes
  - v0.5.1: Enhanced content preservation
  - v0.5.0: Claude Code format compatibility
  - v0.4.0: Open source preparation
  - v0.3.0: Analytics dashboard
  - v0.2.0: Critical bug fixes
  - v0.1.0: Initial release

### Recent Changes (v0.5.3)
- **Storage Format**: Migrated all archives from JSONL to JSON for consistency
- **Test Data Separation**: Automatic separation of test data to `test/` directory
- **File Format Documentation**: Added comprehensive file formats reference
- **Archive Readability**: All files now human-readable with proper formatting

### Previous Fixes (v0.5.2)
- **Storage Size Display**: Fixed stats command showing "0 Bytes" for archives under 1MB
- **Version Consistency**: All components now report v0.5.1+ correctly
- **Status Command**: Fixed excessive line breaks in output formatting
- **Search Command UX**: Made query optional, shows recent archives when none provided
- **CLI Error Messages**: Added helpful hints and available options in error messages

## Technical Debt & Issues

### Code Quality Indicators
- **TODO/FIXME Count**: Minimal (well-maintained codebase)
- **Test Coverage**: Limited (2 unit test files - needs expansion)
- **Integration Tests**: Directory exists but empty (needs implementation)
- **Complex Functions**: Extractor has high complexity (50+ patterns - by design)
- **TypeScript Strict Mode**: Enabled (excellent type safety)
- **Linting**: 66 warnings (mostly `any` types), 0 errors after fixes

### Known Issues
- **Test coverage needs expansion** - Only 2 unit test files
- **Integration tests missing** - Directory exists but empty
- **Tools directory unused** - Integrated directly in server/index.ts
- **Performance benchmarks missing** - No documented metrics
- **TypeScript `any` types** - 66 instances need proper typing

## Recommendations for Context Improvement

### Missing Documentation
- Detailed architecture diagrams
- API response examples
- Performance benchmarks
- Troubleshooting guide for specific errors

### Ambiguous Areas
- Queue management purpose (p-queue dependency)
- Debounce function usage
- Migration path from older versions

### Suggested Next Steps
1. **Expand test coverage** - Add tests for all core modules
2. **Implement integration tests** - Test complete workflows
3. **Document performance** - Benchmark extraction speed and memory usage
4. **Create architecture diagrams** - Visual system overview
5. **Add code examples** - More usage examples in docs
6. **Implement remaining hooks** - SessionStart, SessionEnd, PreToolUse
7. **Replace `any` types** - Add proper TypeScript types for 66 instances

## Quick Reference

### Common Tasks
```bash
# How to run the project
c0ntextkeeper setup     # Initial setup
npm run dev            # Development mode

# How to test
npm test              # Run tests
npm run test:coverage # Coverage report

# How to build
npm run build         # Compile TypeScript

# How to deploy
npm publish           # Publish to npm
```

### Important Files
- **Configuration**: 
  - `~/.c0ntextkeeper/config.json` - Hook and system configuration
  - `.env` - Environment variables (never commit)
  - `.mcp.json` - MCP server configurations
  - `~/.claude/settings.json` - Claude Code hook settings
- **Core Documentation**: 
  - `README.md` - User-facing documentation with badges
  - `/docs/development/claude.md` - Project context for development
  - `/docs/development/project-context.md` - This file - single source of truth
- **Technical Documentation**:
  - `/docs/technical/mcp-usage.md` - MCP server usage patterns
  - `/docs/technical/mcp-testing.md` - Testing procedures for all servers
  - `/docs/technical/mcp-activation.md` - MCP activation guide
- **Hook Documentation**:
  - `/docs/technical/hook-integration.md` - Hook setup and troubleshooting
  - `/docs/technical/hooks-customization.md` - Hook customization guide
  - `/docs/technical/file-formats.md` - Comprehensive file format reference (v0.5.3)
- **User Documentation**:
  - `/docs/guides/user-guide.md` - Data access and storage locations
  - `/docs/guides/migration-guide.md` - Version migration procedures
  - `CHANGELOG.md` - Detailed version history
- **Community Documentation**:
  - `CONTRIBUTING.md` - Contribution guidelines
  - `CODE_OF_CONDUCT.md` - Community standards
  - `SECURITY.md` - Security policy
- **Entry Points**: 
  - `src/cli.ts` - CLI entry point
  - `src/server/index.ts` - MCP server (v0.5.3)
- **Critical Logic**: 
  - `src/core/extractor.ts` - 50+ semantic patterns for extraction
  - `src/core/scorer.ts` - Relevance scoring (1.0 for questions)
  - `src/hooks/precompact.ts` - Automatic capture hook
  - `src/core/archiver.ts` - Analytics dashboard generation

## Analysis Metadata

### Discovery Coverage
- **Files Analyzed**: ~50+ source files
- **Directories Scanned**: All project directories
- **Code Lines Reviewed**: Approximately 5,000+
- **Confidence Level**: High (comprehensive analysis with source code review)

### Assumptions Made
- File-based storage is intentional for simplicity and portability
- Empty directories (tools, integration tests) are placeholders for future development
- Queue and debounce utilities are for handling concurrent operations during auto-compaction
- Extraction algorithm version (0.5.3) now aligned with package version
- All component versions synchronized in v0.5.3

### Areas Requiring Human Verification
- Exact performance characteristics under load
- Maximum practical archive size limitations
- Specific use cases for p-queue and debounce-fn
- Future roadmap priorities

---

*This document was generated through automated project analysis and updated to reflect the current state of the c0ntextKeeper project as of 2025-09-05 (v0.5.3). The project is actively maintained and demonstrates professional software engineering practices with room for test coverage expansion.*