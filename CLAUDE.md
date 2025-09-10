# c0ntextKeeper - MCP Context Preservation System
<!-- This file is automatically detected by Claude Code CLI when running `claude` commands -->

> **📋 NOTE**: This file contains workflow guidelines. For technical specifications and current project state, see **[project-context.md](docs/development/project-context.md)** - the authoritative source of truth.

## Project Vision
Building an MCP server that intelligently preserves valuable context from Claude Code sessions during compaction, ensuring no critical knowledge is lost between conversations.

## Purpose
c0ntextKeeper addresses the context loss problem in Claude Code by:
- Extracting valuable patterns, decisions, and solutions from JSONL transcripts
- Preserving context before compaction hooks trigger
- Providing searchable access to historical context via MCP tools
- Building a knowledge graph of project-specific learnings

## 📋 CRITICAL: project-context.md is the Single Source of Truth

**MANDATORY READING**: Before starting ANY work on this project, you MUST:
1. Read the complete project-context.md file
2. Use it as your primary reference for project state
3. Update it IMMEDIATELY when making significant changes

project-context.md contains:
- Complete project identification and purpose
- All technical specifications and architecture
- Current implementation status
- Known issues and technical debt
- Important file references
- Analysis metadata

⚠️ **This CLAUDE.md file provides workflow guidelines, but project-context.md is the authoritative technical reference.**

## Current State: Production Ready v0.7.0 🎉

c0ntextKeeper is now a fully functional, production-ready tool with:
- ✅ **Unified Storage Architecture** - Intelligent project-name based organization
- ✅ **Fully Automatic Operation** - Works with manual and auto compaction
- ✅ **Claude Code Compatibility** - Handles all JSONL formats correctly
- ✅ **50+ Semantic Patterns** - Superior context extraction
- ✅ **4 Working Hooks** - Complete lifecycle coverage
- ✅ **3 MCP Tools** - Instant context retrieval
- ✅ **Analytics Dashboard** - Rich insights in every archive
- ✅ **Security Filtering** - Automatic sensitive data protection
- ✅ **Open Source Ready** - Complete documentation and community support

## Implementation Summary

### Core System (18 Modules)

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

### Production Features
- **Automatic Context Preservation** - Zero manual intervention required
- **Intelligent Extraction** - 50+ semantic patterns for context detection
- **Rich Analytics** - Tool usage, patterns, and session insights
- **Security First** - Automatic filtering of sensitive data
- **Full TypeScript** - Type-safe with strict mode
- **Comprehensive Testing** - Jest with full coverage
- **CI/CD Pipeline** - GitHub Actions with multi-version testing

## Completed Development Milestones

### Version History
- **v0.7.0** (2025-09-10) - Auto-load context via MCP resources, intelligent loading strategies
- **v0.6.0** (2025-09-09) - Unified storage architecture with project-name organization
- **v0.5.x** (2025-09-02 to 09-05) - Claude Code compatibility, JSON format, quality improvements
- **v0.4.0** (2025-08-30) - Open source migration, security hardening
- **v0.3.0** (2025-08-29 PM) - Analytics dashboard, tool tracking
- **v0.2.0** (2025-08-29 AM) - Critical bug fixes, timeout protection
- **v0.1.0** (2025-08-28) - Initial release with core functionality

## Key Project Structure
```
c0ntextKeeper/
├── .mcp.json                 # MCP server configurations
├── .gitignore              # Security configuration
├── docs/
│   ├── technical/          # Technical documentation
│   ├── guides/            # User guides
│   └── development/       # Development docs
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
│   │   ├── hooks-manager.ts # Hook management commands
│   │   └── init.ts         # Storage initialization (v0.6.0)
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
│       ├── path-resolver.ts  # Hybrid storage paths (v0.6.0)
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
0. Read project-context.md for current project state
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

- Create testing documentation with all test commands
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

### 🎯 project-context.md Update Policy (HIGHEST PRIORITY)

**project-context.md is the AUTHORITATIVE SOURCE OF TRUTH and must be updated IMMEDIATELY when:**

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

#### How to Update project-context.md
1. **Read current version** before making changes
2. **Update relevant sections** as you work
3. **Keep version history** accurate
4. **Update "Last Generated" date** at the top
5. **Verify all technical details** are correct
6. **Cross-reference** with other documentation

#### Documentation Hierarchy
1. **project-context.md** - Single source of truth (UPDATE FIRST)
2. **README.md** - User-facing documentation (UPDATE SECOND)
3. **CLAUDE.md** - This file - workflow guidelines (UPDATE THIRD)
4. Other documentation files as needed

### README Update Policy

**After updating project-context.md, update README.md when ANY user-facing changes occur:**

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
1. **Start with project-context.md**
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

**📋 STEP 0: ALWAYS READ project-context.md FIRST**

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
   - Update project-context.md FIRST for any significant changes
   - Update README.md for user-facing changes
   - Sync CLAUDE.md if workflow changes
   - Update technical documentation for new patterns

7. **Update project-context.md** 
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

## Next Steps

### Immediate Priorities
1. **Community Engagement** - Promote to Claude Code users
2. **User Feedback** - Collect real-world usage patterns
3. **Documentation Videos** - Create demo content
4. **Performance Optimization** - Scale for larger transcripts

### Future Enhancements
- **Vector Search** - Semantic context queries
- **Team Sharing** - Collaborative context preservation
- **VS Code Extension** - Inline context display
- **Web Dashboard** - Visual analytics and browsing
- **Cloud Sync** - Cross-machine context availability

## Resources
- [MCP SDK Docs](https://modelcontextprotocol.io)
- [Claude Code Hooks](https://docs.anthropic.com/en/docs/claude-code/hooks)
- [Project Repository](https://github.com/Capnjbrown/c0ntextKeeper)
- [Project Website](https://c0ntextkeeper.com)

## License
MIT - Open source for the community

## Notes

### Development Guidelines
- **ALWAYS** read project-context.md before starting work
- **IMMEDIATELY** update project-context.md for significant changes
- **ALWAYS** use sequential-thinking for complex tasks
- **NEVER** execute git commits - only draft messages
- **IMMEDIATELY** update README.md for user-facing changes
- All code must pass lint and typecheck before commit
- MCP servers configured at project level for isolation
- Environment variables in .env (never commit)
- Follow GitHub README best practices for documentation

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