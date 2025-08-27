# c0ntextKeeper - MCP Context Preservation System

## Project Vision
Building an MCP server that intelligently preserves valuable context from Claude Code sessions during compaction, ensuring no critical knowledge is lost between conversations.

## Purpose
c0ntextKeeper addresses the context loss problem in Claude Code by:
- Extracting valuable patterns, decisions, and solutions from JSONL transcripts
- Preserving context before compaction hooks trigger
- Providing searchable access to historical context via MCP tools
- Building a knowledge graph of project-specific learnings

## Current Development Status

### Phase 1: Foundation ✅
- [x] Project directory created
- [x] MCP server configurations set up
- [x] Project isolation enforced
- [x] Documentation structure initialized

### Phase 2: Project Setup (Current)
- [ ] Initialize Node.js project with TypeScript
- [ ] Set up package.json with dependencies
- [ ] Configure TypeScript (tsconfig.json)
- [ ] Set up ESLint and Prettier
- [ ] Initialize git repository
- [ ] Create basic project structure

### Phase 3: Core Implementation
- [ ] Convert POC extractor.py to TypeScript
- [ ] Implement JSONL transcript parser
- [ ] Create context extraction logic
- [ ] Build relevance scoring algorithm
- [ ] Design storage system architecture

### Phase 4: MCP Server Development
- [ ] Implement basic MCP server
- [ ] Create context retrieval tools
- [ ] Add search functionality
- [ ] Integrate with Claude Code hooks
- [ ] Handle preCompact events

### Phase 5: Testing & Optimization
- [ ] Unit tests for all modules
- [ ] Integration tests for MCP server
- [ ] Performance optimization
- [ ] Documentation completion
- [ ] Package for distribution

## Key Project Structure
```
c0ntextKeeper/
├── .mcp.json                 # MCP server configurations
├── .env.example             # Environment template
├── .gitignore              # Security configuration
├── MCP-USAGE.md           # MCP server documentation
├── CLAUDE.md             # This file - project context
├── package.json          # Node.js configuration
├── tsconfig.json        # TypeScript configuration
├── src/
│   ├── server/
│   │   └── index.ts    # MCP server entry point
│   ├── hooks/
│   │   └── precompact.ts # Hook handler
│   ├── core/
│   │   ├── types.ts     # Type definitions
│   │   ├── extractor.ts # Context extraction
│   │   ├── archiver.ts  # Storage logic
│   │   └── retriever.ts # Context retrieval
│   └── tools/
│       ├── fetch-context.ts  # MCP tool
│       └── search-archive.ts # MCP tool
└── tests/
    └── unit/           # Jest test files
```

## Development Commands
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

### Proactive README Update Policy

**IMMEDIATELY update README.md when ANY of the following occur:**

#### Triggers for Updates
1. **Dependencies**
   - New package added
   - Package removed
   - Version updates (major/minor)
   - Security patches

2. **Features**
   - New feature implemented
   - Feature removed or deprecated
   - Feature behavior changed

3. **Configuration**
   - Environment variables added/changed
   - Config file format modified
   - Default settings updated

4. **Architecture**
   - Project structure changes
   - New directories/files added
   - Design patterns modified

5. **API/Interface**
   - New endpoints/methods
   - Parameter changes
   - Response format updates

6. **Build/Deployment**
   - Build process changes
   - Deployment steps modified
   - New scripts added

#### Update Process
1. Detect change during development
2. Immediately update relevant README section
3. Ensure examples still work
4. Update version/date if applicable
5. Verify links and references

#### Documentation Sync
- Keep README.md in sync with:
  - CLAUDE.md (project context)
  - MCP-USAGE.md (server documentation)
  - MCP-TESTING.md (testing procedures)
  - package.json (dependencies)
  - .env.example (configuration)

### Version Tracking
Include last updated timestamp in README:
```markdown
> Last Updated: 2025-08-27
```

### Cross-Reference Maintenance
When updating any documentation file:
1. Check for references in other files
2. Update cross-references
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

## Security Considerations
- Never store sensitive tokens in context
- Sanitize extracted content
- Respect .gitignore patterns
- Isolate to project directory only
- No external network calls without permission

## Development Workflow

### Standard Development Flow

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
   - Update README.md immediately for any changes
   - Sync CLAUDE.md if architecture changes
   - Update MCP-USAGE.md for new patterns

7. **Prepare git commit** (when requested)
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

## Next Immediate Steps
1. Initialize npm project
2. Install MCP SDK and dependencies
3. Set up TypeScript configuration
4. Create basic file structure
5. Implement JSONL parser
6. Test with sample transcripts

## Resources
- [Original POC](./extractor.py) - Python implementation reference
- [MCP SDK Docs](https://modelcontextprotocol.io)
- [Claude Code Hooks](https://docs.anthropic.com/en/docs/claude-code/hooks)
- [Project Repository](https://github.com/yourusername/c0ntextKeeper)

## License
MIT - Open source for the community

## Notes

### Critical Reminders
- **ALWAYS** use sequential-thinking BEFORE any task
- **NEVER** execute git commits - only draft messages
- **IMMEDIATELY** update README.md for any project changes
- MCP servers are configured at project level for isolation
- Filesystem access restricted to this directory only: `/Users/jasonbrown/Projects/c0ntextKeeper`
- Environment variables in .env (never commit)
- All code must pass lint and typecheck before commit
- Use `/mcp` command to verify all servers are connected
- Refer to MCP-USAGE.md for detailed tool documentation
- See MCP-TESTING.md for comprehensive testing procedures
- Follow GitHub README best practices for all documentation