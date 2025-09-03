# c0ntextKeeper - MCP Context Preservation System

> **📋 NOTE**: This file contains workflow guidelines. For technical specifications and current project state, see **[PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md)** - the authoritative source of truth.

## Project Vision
Building an MCP server that intelligently preserves valuable context from Claude Code sessions during compaction, ensuring no critical knowledge is lost between conversations.

## Purpose
c0ntextKeeper addresses the context loss problem in Claude Code by:
- Extracting valuable patterns, decisions, and solutions from JSONL transcripts
- Preserving context before compaction hooks trigger
- Providing searchable access to historical context via MCP tools
- Building a knowledge graph of project-specific learnings

## 📋 CRITICAL: PROJECT_CONTEXT.md is the Single Source of Truth

**MANDATORY READING**: Before starting ANY work on this project, you MUST:
1. Read the complete PROJECT_CONTEXT.md file
2. Use it as your primary reference for project state
3. Update it IMMEDIATELY when making significant changes

PROJECT_CONTEXT.md contains:
- Complete project identification and purpose
- All technical specifications and architecture
- Current implementation status
- Known issues and technical debt
- Important file references
- Analysis metadata

⚠️ **This CLAUDE.md file provides workflow guidelines, but PROJECT_CONTEXT.md is the authoritative technical reference.**

## Current Development Status

### Phase 1: Foundation ✅
- [x] Project directory created
- [x] MCP server configurations set up
- [x] Project isolation enforced
- [x] Documentation structure initialized

### Phase 2: Project Setup ✅
- [x] Initialize Node.js project with TypeScript
- [x] Set up package.json with dependencies
- [x] Configure TypeScript (tsconfig.json)
- [x] Set up ESLint and Prettier
- [x] Initialize git repository
- [x] Create basic project structure

### Phase 3: Core Implementation ✅
- [x] Convert POC extractor.py to TypeScript
- [x] Implement JSONL transcript parser
- [x] Create context extraction logic
- [x] Build relevance scoring algorithm
- [x] Design storage system architecture

### Phase 4: MCP Server Development ✅
- [x] Implement basic MCP server
- [x] Create context retrieval tools
- [x] Add search functionality
- [x] Integrate with Claude Code hooks
- [x] Handle preCompact events

### Phase 5: Testing & Optimization ✅
- [x] Unit tests for all modules
- [x] Integration tests for MCP server
- [x] Performance optimization
- [x] Documentation completion
- [x] Package for distribution

### Phase 6: Complete Hook System ✅ (2025-08-28)
- [x] Implemented UserPromptSubmit hook for tracking questions
- [x] Implemented PostToolUse hook for tool pattern analysis
- [x] Implemented Stop hook for Q&A knowledge base
- [x] Created CLI hook management system
- [x] Built configuration system (config.json)
- [x] Added hook enable/disable/test commands
- [x] Updated all documentation for consistency
- [x] Emphasized automatic compaction support

### Phase 7: Critical Bug Fixes & v0.2.0 Release ✅ (2025-08-29 AM)
- [x] Fixed TypeError "content.toLowerCase is not a function" throughout extraction pipeline
- [x] Added comprehensive type guards for non-string content (arrays, objects)
- [x] Resolved 504 timeout errors with 55-second timeout protection
- [x] Fixed generic archive folder names to show actual project names
- [x] Relaxed extraction patterns to capture more context
- [x] Added detailed debug logging for extraction diagnostics
- [x] Created test-extraction.js validation script
- [x] Ensured archives created even with minimal content
- [x] Bumped version to 0.2.0 with CHANGELOG.md

### Phase 8: Analytics & Enhanced Archives - v0.3.0 ✅ (2025-08-29 PM)
- [x] Added comprehensive tool usage tracking (toolCounts)
- [x] Enhanced SessionSummary with 6 new analytics fields
- [x] Extended ProjectIndex with aggregate metrics
- [x] Implemented analytics dashboard in archive README.md
- [x] Added 8 new formatting utilities for display
- [x] Fixed project name extraction for complex paths
- [x] Added version tracking to archives
- [x] Created modern GitHub-style README format with emojis
- [x] Implemented aggregate statistics calculation
- [x] Added quality metrics and relevance scoring
- [x] Updated all documentation to reflect v0.3.0
- [x] Bumped version to 0.3.0

### Phase 9: Public Repository Migration - v0.4.0 ✅ (2025-08-30)
- [x] Removed sensitive data and .env file with exposed token
- [x] Added GitHub issue and PR templates for community contributions
- [x] Created CODE_OF_CONDUCT.md with Contributor Covenant
- [x] Added SECURITY.md for vulnerability reporting
- [x] Enhanced README with dynamic npm/coverage/download badges
- [x] Created branch strategy documentation (.github/BRANCH_STRATEGY.md)
- [x] Added repository settings guide (.github/REPOSITORY_SETTINGS.md)
- [x] Created validation script for public readiness (scripts/validate-public-ready.sh)
- [x] Added post-install script for npm setup
- [x] Prepared for npm publishing and community contributions
- [x] Bumped version to 0.4.0

### Phase 10: Claude Code Format Compatibility - v0.5.0 ✅ (2025-09-02)
- [x] Fixed critical JSONL parsing to handle Claude's embedded content arrays
- [x] Corrected relevance scoring - user questions now score 1.0 (was 0.06)
- [x] Added 50+ semantic problem indicators for enhanced extraction
- [x] Implemented proper tool_use and tool_result parsing from embedded content
- [x] Updated all test files to use Claude's array format
- [x] Converted example archives to v0.5.0 format
- [x] Enhanced extractProblems() with comprehensive semantic patterns
- [x] Fixed calculateUserEngagement() to properly score questions
- [x] Added extractToolResultContent() helper for result extraction
- [x] Updated normalizeEntry() with complete content array handling
- [x] Bumped extraction version to 0.5.0

## Implementation Summary

### What We Built (2025-08-27 to 2025-09-02)
Successfully implemented the complete c0ntextKeeper system with Claude Code format compatibility, fully automatic operation, and critical bug fixes:

**18 Core Modules:**
- `extractor.ts` - Intelligent context extraction with problem/solution mapping
- `scorer.ts` - Multi-factor relevance scoring engine with scoreContent method
- `archiver.ts` - Context archival management
- `retriever.ts` - Fast context retrieval and search
- `patterns.ts` - Pattern recognition and analysis
- `file-store.ts` - Efficient file-based storage with getBasePath method
- `precompact.ts` - PreCompact hook handler (automatic + manual compaction)
- `userprompt.ts` - UserPromptSubmit hook for tracking questions
- `posttool.ts` - PostToolUse hook for tool patterns
- `stop.ts` - Stop hook for Q&A knowledge base
- `hooks-manager.ts` - CLI hook management system
- `config.ts` - Configuration management system
- `transcript.ts` - JSONL streaming parser
- `logger.ts` - Logging utility for MCP servers
- `filesystem.ts` - File system utilities
- `index.ts` - MCP server entry point
- `cli.ts` - Enhanced CLI with hook commands
- `types.ts` - Comprehensive TypeScript definitions

**Key Achievements (v0.5.0):**
- ✅ **Claude Code Compatibility** - Properly parses embedded content arrays
- ✅ **Fixed Relevance Scoring** - Questions now score 1.0 instead of 0.06
- ✅ **50+ Semantic Patterns** - Comprehensive problem detection
- ✅ **Tool Tracking Fixed** - Extracts tool_use/tool_result from messages
- ✅ **Enhanced Extraction** - Captures significantly more valuable context
- ✅ **Test Suite Updated** - All tests use Claude's array format

**Key Achievements (v0.3.0):**
- ✅ **Analytics Dashboard** - Beautiful statistics in every archive README
- ✅ **Tool Usage Tracking** - Comprehensive counts and frequency analysis
- ✅ **Aggregate Metrics** - Project-wide statistics and trends
- ✅ **Enhanced Metadata** - Session duration, files modified, top problems
- ✅ **Quality Scoring** - Average relevance across all sessions
- ✅ **8 New Formatters** - Professional display utilities
- ✅ **Modern GitHub README** - Emojis, sections, and analytics

**Key Achievements (v0.2.0):**
- ✅ **Fully automatic operation** - Works reliably with both manual and automatic compaction
- ✅ **Type safety for all content** - Handles strings, arrays, objects without errors
- ✅ **Timeout protection** - 55-second limit prevents 504 errors during auto-compact
- ✅ **Enhanced extraction** - Relaxed patterns capture more valuable context
- ✅ **Debug logging** - Detailed extraction diagnostics for troubleshooting
- ✅ **4 working hooks** - PreCompact, UserPromptSubmit, PostToolUse, Stop
- ✅ Full MCP server with 3 working tools (fetch_context, search_archive, get_patterns)
- ✅ **Hook management CLI** - Enable/disable/test hooks via commands
- ✅ **Configuration system** - Centralized config.json for all settings
- ✅ Intelligent extraction identifying problems, solutions, decisions, and patterns
- ✅ Relevance scoring with configurable thresholds
- ✅ PreCompact hook integration for automatic capture (manual + auto)
- ✅ CLI tools for manual operations and hook management
- ✅ Jest testing framework with comprehensive test suite
- ✅ Complete TypeScript implementation with strict type safety
- ✅ npm package ready for distribution
- ✅ Security filtering for API keys, passwords, and PII
- ✅ GitHub Actions CI/CD pipeline with multi-version testing
- ✅ ESLint v9 flat configuration format
- ✅ All dependencies updated to latest stable versions

## Key Project Structure
```
c0ntextKeeper/
├── .mcp.json                 # MCP server configurations
├── .gitignore              # Security configuration
├── MCP-USAGE.md           # MCP server documentation
├── CLAUDE.md             # This file - project context
├── README.md             # User-facing documentation
├── LICENSE               # MIT license
├── package.json          # Node.js configuration
├── tsconfig.json        # TypeScript configuration
├── jest.config.js       # Jest testing configuration
├── eslint.config.js     # ESLint v9 flat configuration
├── CONTRIBUTING.md      # Open source contribution guidelines
├── src/
│   ├── cli.ts          # CLI entry point
│   ├── cli/
│   │   └── hooks-manager.ts # Hook management commands
│   ├── server/
│   │   └── index.ts    # MCP server entry point
│   ├── hooks/
│   │   ├── precompact.ts # PreCompact hook handler
│   │   ├── userprompt.ts # UserPromptSubmit hook
│   │   ├── posttool.ts   # PostToolUse hook
│   │   └── stop.ts       # Stop hook handler
│   ├── core/
│   │   ├── types.ts     # Type definitions
│   │   ├── extractor.ts # Context extraction
│   │   ├── scorer.ts    # Relevance scoring
│   │   ├── archiver.ts  # Storage logic
│   │   ├── retriever.ts # Context retrieval
│   │   ├── patterns.ts  # Pattern analysis
│   │   └── config.ts    # Configuration management
│   ├── storage/
│   │   └── file-store.ts # File-based storage
│   └── utils/
│       ├── filesystem.ts     # File utilities
│       ├── transcript.ts     # JSONL parser
│       ├── logger.ts         # Logging utility
│       └── security-filter.ts # Security filtering
├── scripts/
│   └── setup-hooks.js    # Installation script
├── .github/
│   └── workflows/
│       └── ci.yml          # GitHub Actions CI/CD
└── tests/
    ├── setup.ts           # Test configuration
    └── unit/              # Jest test files
        ├── extractor.test.ts
        └── security-filter.test.ts
```

## Development Commands

### Core Commands
```bash
# Start development
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Lint code
npm run lint

# Type check
npm run typecheck

# Format code
npm run format
```

### Hook Management
```bash
# Check automation status
c0ntextkeeper status

# List all hooks
c0ntextkeeper hooks list

# Enable hooks
c0ntextkeeper hooks enable userprompt
c0ntextkeeper hooks enable posttool
c0ntextkeeper hooks enable stop

# Test hooks
c0ntextkeeper hooks test precompact

# View statistics
c0ntextkeeper hooks stats
```

## MCP Server Configuration

### Server Status (All Operational ✅)
All 5 MCP servers have been tested and verified working as of 2025-08-27:

| Server | Package | Status | Purpose |
|--------|---------|--------|----------|
| filesystem | @modelcontextprotocol/server-filesystem | ✅ Operational | File management |
| sequential-thinking | @modelcontextprotocol/server-sequential-thinking | ✅ Operational | Complex reasoning |
| github-mcp | @modelcontextprotocol/server-github | ✅ Operational | Code research |
| context7 | @upstash/context7-mcp | ✅ Operational | Documentation |
| fetch | @kazuph/mcp-fetch | ✅ Operational | Web content |

### Primary Servers for This Project
1. **filesystem** - All code generation and file management
2. **sequential-thinking** - Algorithm design and architecture decisions
3. **github-mcp** - Research MCP patterns and implementations
4. **context7** - TypeScript and MCP SDK documentation
5. **fetch** - Competitor research (optional)

### Usage Pattern
Always start with sequential-thinking for complex problems, then research with github-mcp, verify with context7, and implement with filesystem.

### Quick Test Commands
```bash
# Verify all servers are connected
/mcp  # Should list all 5 servers

# Test each server individually:
# Filesystem
"Use mcp__filesystem__list_allowed_directories"

# Sequential Thinking
"Use mcp__sequential-thinking__sequentialthinking to plan context extraction"

# GitHub
"Use mcp__github-mcp__search_repositories for 'MCP server language:TypeScript'"

# Context7
"Use mcp__context7__resolve-library-id for 'typescript'"

# Fetch
"Use mcp__fetch__imageFetch to get https://modelcontextprotocol.io"
```

## Task Execution Protocol

### 🎯 MANDATORY: Sequential-Thinking First Policy

**BEFORE starting ANY task, you MUST:**
0. Read PROJECT_CONTEXT.md for current project state
1. Use `mcp__sequential-thinking__sequentialthinking` to analyze the task
2. Determine the most optimal MCP server(s) for the job
3. Plan the approach and execution strategy
4. Only then proceed with implementation

This applies to ALL tasks including:
- Code generation or modification
- Documentation updates
- Research and analysis
- Problem solving
- Architecture decisions
- Bug fixes
- Feature implementations

### Example Task Analysis
```typescript
// For any task, ALWAYS start with:
"Use mcp__sequential-thinking__sequentialthinking to analyze [task description] and determine optimal MCP servers and approach"

// Example outputs from sequential-thinking:
// - "For this file creation task, use filesystem server"
// - "For this research task, combine github-mcp and context7"
// - "For this complex feature, use sequential-thinking → github-mcp → filesystem"
```

### MCP Server Selection Guide
After analysis with sequential-thinking, select servers based on task type:
- **File Operations**: `filesystem`
- **Code Research**: `github-mcp`
- **Documentation Lookup**: `context7`
- **Web Content**: `fetch`
- **Complex Planning**: Continue with `sequential-thinking`

---

## Git Workflow & GitHub Standards

### Core Git Principles
- **NEVER** perform `git commit`, `git push`, or `git rm` commands
- **ONLY** execute git operations when explicitly requested by user
- **ALWAYS** draft commit messages for user to copy and execute

### When User Requests Git Operations

#### Step-by-Step Process
1. **Run git status** to analyze all changes
   ```bash
   git status
   ```

2. **Review all modified files** to understand changes
   ```bash
   git diff  # Review unstaged changes
   git diff --staged  # Review staged changes
   ```

3. **Draft commit message** following conventional format

4. **Provide message** for user to copy/paste

### Commit Message Standards

#### Conventional Commit Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code change that neither fixes bug nor adds feature
- `test`: Adding missing tests
- `chore`: Maintenance, dependencies
- `perf`: Performance improvements
- `ci`: CI/CD changes
- `build`: Build system changes

#### Rules
- **NO EMOJIS** in commit messages
- Subject line under 50 characters
- Use imperative mood ("Add" not "Added")
- Body line wrap at 72 characters
- Reference issues when applicable

#### Example Commit Messages
```bash
# Feature
feat(extractor): implement JSONL transcript parser

- Add streaming parser for large files
- Extract tool usage patterns
- Score relevance based on context value

Closes #42

# Bug Fix
fix(hooks): resolve preCompact event timing issue

Prevent race condition when multiple hooks trigger
simultaneously by implementing queue system.

# Documentation
docs(mcp): add comprehensive testing procedures

- Create MCP-TESTING.md with all test commands
- Include expected outputs for verification
- Add troubleshooting section
```

### Modern GitHub README Standards

#### Essential Structure
1. **Project Title & Description**
   - Clear, concise project name
   - One-line description
   - Detailed overview paragraph

2. **Badges** (shields.io)
   - Build status
   - Test coverage
   - Version
   - License
   - Downloads/Stars

3. **Table of Contents**
   - For READMEs over 100 lines
   - Link to all major sections

4. **Quick Start**
   - Get running in < 5 minutes
   - Minimal steps
   - Copy-paste commands

5. **Installation**
   - Prerequisites
   - Step-by-step instructions
   - Multiple installation methods

6. **Usage**
   - Basic examples
   - Common use cases
   - Code snippets with syntax highlighting

7. **API Documentation**
   - Endpoints/Methods
   - Parameters
   - Response examples

8. **Configuration**
   - Environment variables
   - Config files
   - Options explanation

9. **Contributing**
   - How to contribute
   - Code of conduct
   - Development setup

10. **License**
    - License type
    - Link to full license

#### Best Practices
- Use proper markdown formatting
- Include screenshots/GIFs for UI features
- Add diagrams for architecture
- Keep language clear and concise
- Test all code examples
- Include troubleshooting section
- Add FAQ for common issues
- Update changelog regularly

#### Example README Template
```markdown
# Project Name

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

> One-line description of your project

Detailed description explaining what the project does and why it exists.

## Table of Contents
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Usage](#usage)
- [API](#api)
- [Contributing](#contributing)
- [License](#license)

## Quick Start
\`\`\`bash
npm install
npm start
\`\`\`

## Installation
...
```

---

## Documentation Maintenance

### 🎯 PROJECT_CONTEXT.md Update Policy (HIGHEST PRIORITY)

**PROJECT_CONTEXT.md is the AUTHORITATIVE SOURCE OF TRUTH and must be updated IMMEDIATELY when:**

#### Mandatory Update Triggers
1. **Version Changes**
   - Package version updates
   - Extraction algorithm version changes
   - MCP server version updates

2. **Architecture Changes**
   - New modules or components added
   - Directory structure modifications
   - Design pattern changes
   - Storage system updates

3. **Feature Implementation**
   - New features completed
   - Features deprecated or removed
   - Feature behavior modifications
   - Hook implementations

4. **Dependencies**
   - New packages added/removed
   - Major version updates
   - Security patches applied

5. **API/Interface Changes**
   - New MCP tools added
   - Tool parameters modified
   - CLI commands added/changed
   - Hook interfaces updated

6. **Testing & Quality**
   - Test coverage changes
   - New test files added
   - Performance benchmarks documented
   - Known issues discovered

7. **Configuration Changes**
   - New environment variables
   - Config file format updates
   - Default settings modified

#### How to Update PROJECT_CONTEXT.md
1. **Read current version** before making changes
2. **Update relevant sections** as you work
3. **Keep version history** accurate
4. **Update "Last Generated" date** at the top
5. **Verify all technical details** are correct
6. **Cross-reference** with other documentation

#### Documentation Hierarchy
1. **PROJECT_CONTEXT.md** - Single source of truth (UPDATE FIRST)
2. **README.md** - User-facing documentation (UPDATE SECOND)
3. **CLAUDE.md** - This file - workflow guidelines (UPDATE THIRD)
4. Other documentation files as needed

### README Update Policy

**After updating PROJECT_CONTEXT.md, update README.md when ANY user-facing changes occur:**

#### Triggers for README Updates
1. **Dependencies** - User-visible changes
2. **Features** - New functionality
3. **Configuration** - Setup changes
4. **Installation** - Process modifications
5. **Usage** - Command changes
6. **API** - Public interface updates

### Version Tracking
Include last updated timestamp:
```markdown
> Last Updated: YYYY-MM-DD
```

### Cross-Reference Maintenance
When updating documentation:
1. **Start with PROJECT_CONTEXT.md**
2. Update other files based on changes
3. Ensure consistency across all docs
4. Verify all links work

---

## Architecture Decisions

### Technology Stack
- **Language**: TypeScript (type safety, better IDE support)
- **Runtime**: Node.js (MCP SDK compatibility)
- **Testing**: Jest (comprehensive testing framework)
- **Storage**: File-based initially (simplicity, portability)
- **Schema Validation**: Zod (runtime type checking)

### Design Principles
1. **Stream Processing**: Handle large JSONL files efficiently
2. **Modular Architecture**: Separate concerns clearly
3. **Type Safety**: Leverage TypeScript fully
4. **Progressive Enhancement**: Start simple, add complexity
5. **Context Preservation**: Never lose valuable information

### Context Extraction Strategy
- Parse JSONL transcripts line by line
- Identify high-value patterns (problems, solutions, decisions)
- Score relevance based on multiple factors
- Store in searchable, structured format
- Provide quick retrieval via MCP tools

## Implementation Notes

### JSONL Processing
- Use Node.js readline for streaming
- Parse each line as JSON
- Extract tool uses, responses, and decisions
- Build context objects progressively

### Relevance Scoring Factors
1. Problem-solution pairs
2. Architectural decisions
3. Error resolutions
4. Tool usage patterns
5. User preferences
6. Code generation results

### Storage Considerations
- Start with file-based JSON storage
- Index by project, date, and relevance
- Consider SQLite for future scaling
- Potential vector DB integration later

## Testing Strategy
- Unit tests for each module
- Integration tests for MCP server
- Mock JSONL transcripts for testing
- Performance benchmarks for large files
- End-to-end hook testing
- CI/CD pipeline with Node.js 18.x, 20.x, 22.x matrix
- Automated security audits
- Code coverage reporting with Codecov

## Security Considerations
- Never store sensitive tokens in context
- Sanitize extracted content
- Respect .gitignore patterns
- Isolate to project directory only
- No external network calls without permission
- **Security Filter Implementation:**
  - Redacts API keys (OpenAI, Anthropic, AWS, GitHub)
  - Filters database connection strings
  - Removes private keys and SSH keys
  - Sanitizes passwords and secrets
  - Partially redacts PII (emails, IPs, phone numbers)
  - Detects and filters JWT tokens
  - Custom pattern support for project-specific secrets

## Development Workflow

### Standard Development Flow

**📋 STEP 0: ALWAYS READ PROJECT_CONTEXT.md FIRST**

**⚠️ IMPORTANT: Always start with Task Execution Protocol (sequential-thinking first)**

1. **Analyze task** with `mcp__sequential-thinking__sequentialthinking`
   - Understand requirements
   - Select optimal MCP servers
   - Plan execution strategy

2. **Research patterns** with `mcp__github-mcp__search_code` or `search_repositories`
   - Find existing implementations
   - Study best practices
   - Identify useful patterns

3. **Check documentation** with `mcp__context7__get-library-docs`
   - Verify API usage
   - Confirm syntax
   - Check for deprecations

4. **Implement** with `mcp__filesystem__write_file` and `edit_file`
   - Follow planned approach
   - Write clean, documented code
   - Handle edge cases

5. **Test thoroughly** using filesystem tools
   - Unit tests
   - Integration tests
   - Manual verification

6. **Update documentation** 
   - Update PROJECT_CONTEXT.md FIRST for any significant changes
   - Update README.md for user-facing changes
   - Sync CLAUDE.md if workflow changes
   - Update MCP-USAGE.md for new patterns

7. **Update PROJECT_CONTEXT.md** 
   - Document any architecture changes
   - Update feature status
   - Add new dependencies
   - Update known issues
   - Modify version information

8. **Prepare git commit** (when requested)
   - Run git status
   - Review changes
   - Draft conventional commit message
   - Provide for user to execute

### Example Workflow Commands
```typescript
// 1. Plan the context extraction feature
"Use mcp__sequential-thinking__sequentialthinking to design JSONL parsing strategy"

// 2. Research existing implementations
"Use mcp__github-mcp__search_code for 'JSONL readline TypeScript'"

// 3. Get TypeScript stream documentation
"Use mcp__context7__resolve-library-id for 'node' then get stream docs"

// 4. Create the implementation
"Use mcp__filesystem__write_file to create src/core/extractor.ts"

// 5. Add tests
"Use mcp__filesystem__write_file to create tests/extractor.test.ts"
```

## Production Readiness Status

### Completed Production Optimizations (2025-08-28)
- ✅ **Dependency Updates**: All packages updated to latest stable versions
  - Zod v3 → v4 (breaking changes handled)
  - Jest v29 → v30 
  - Commander v12 → v14
  - ESLint v8 → v9 (flat config migration)
- ✅ **Security Hardening**: Comprehensive filtering for sensitive data
- ✅ **CI/CD Pipeline**: GitHub Actions with multi-version testing
- ✅ **Open Source Ready**: CONTRIBUTING.md with guidelines
- ✅ **Code Quality**: ESLint v9, TypeScript strict mode, Prettier
- ✅ **Test Coverage**: Unit tests passing with security filter tests

## Next Steps

### Immediate Actions
1. **Publish to npm registry** - Make available for community use
2. **Create GitHub release** - Tag v1.0.0 with full feature set
3. **Community outreach** - Share with Claude Code users
4. **Create demo video** - Show automatic operation and hook system

### Future Enhancements
1. **SessionStart/SessionEnd hooks** - Complete lifecycle tracking
2. **PreToolUse hook** - Capture tool intent before execution
3. **Vector database integration** - Semantic search capabilities
4. **Team sharing features** - Collaborative context preservation
5. **VS Code extension** - Inline context display
6. **Web dashboard** - Visual analytics and browsing
7. **Cloud sync** - Cross-machine context availability
8. **Custom hook creation API** - Allow users to create their own hooks

## Resources
- [MCP SDK Docs](https://modelcontextprotocol.io)
- [Claude Code Hooks](https://docs.anthropic.com/en/docs/claude-code/hooks)
- [Project Repository](https://github.com/Capnjbrown/c0ntextKeeper)
- [Project Website](https://c0ntextkeeper.com)

## License
MIT - Open source for the community

## Notes

### Critical Reminders
- **ALWAYS** read PROJECT_CONTEXT.md before starting work
- **IMMEDIATELY** update PROJECT_CONTEXT.md for any significant changes
- **PROJECT_CONTEXT.md** is the single source of truth - keep it current
- **ALWAYS** use sequential-thinking BEFORE any task
- **NEVER** execute git commits - only draft messages
- **IMMEDIATELY** update README.md for any user-facing changes
- **ALWAYS** use current date when adding timestamps (run `date` or `node scripts/get-timestamp.js`)
- MCP servers are configured at project level for isolation
- Filesystem access restricted to this directory only: `/Users/jasonbrown/Projects/c0ntextKeeper`
- Environment variables in .env (never commit)
- All code must pass lint and typecheck before commit
- Use `/mcp` command to verify all servers are connected
- Refer to MCP-USAGE.md for detailed tool documentation
- See MCP-TESTING.md for comprehensive testing procedures
- Follow GitHub README best practices for all documentation

### Getting Current Timestamp
Use the utility script for consistent timestamps:
```bash
# Get date (YYYY-MM-DD)
node scripts/get-timestamp.js

# Get date and time
node scripts/get-timestamp.js datetime

# Get full timestamp with timezone
node scripts/get-timestamp.js full
```