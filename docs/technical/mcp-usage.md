# MCP Server Documentation - c0ntextKeeper Project

## Overview
Model Context Protocol (MCP) servers extend Claude Code's capabilities by providing specialized tools for different aspects of development. This document explains each server's purpose, capabilities, and optimal usage patterns for developing c0ntextKeeper - the intelligent context preservation system for Claude Code.

### v0.7.2 Unified Storage Architecture
As of v0.7.2, c0ntextKeeper features a unified storage architecture with intelligent path resolution, project-name based organization, and seamless global/local storage support. Archives are now organized by readable project names instead of cryptic hashes.

## Configuration
All MCP servers are configured at **project level** in `.mcp.json` to ensure:
- **STRICT PROJECT ISOLATION** - Each project has its own MCP configuration
- **No cross-pollination** - Servers cannot access files from other projects
- **Security** - Filesystem access limited to THIS project directory only
- **Portability** - Configuration travels with the project
- **Team collaboration** - Shared configuration in version control

⚠️ **CRITICAL**: The filesystem server must be configured with the absolute path to your project directory.
ONLY access files within the configured project directory.

### Recommended Servers for c0ntextKeeper Development
The following servers are essential for building our MCP server:
1. **filesystem** - Code generation and file management
2. **sequential-thinking** - Architecture planning and complex problem-solving
3. **github-mcp** - Research MCP implementations and patterns
4. **context7** - Current TypeScript, Node.js, and MCP SDK documentation
5. **fetch** - Research competitor tools and documentation

## Server Capabilities for c0ntextKeeper Development

### 1. filesystem (@modelcontextprotocol/server-filesystem)
**Purpose**: Generate and manage all c0ntextKeeper source code

**Status**: ✅ Fully Operational (Tested 2025-08-27)

**Available Tools**:
- `mcp__filesystem__read_text_file` - Read file contents
- `mcp__filesystem__write_file` - Create or overwrite files
- `mcp__filesystem__edit_file` - Make line-based edits
- `mcp__filesystem__create_directory` - Create directories
- `mcp__filesystem__list_directory` - List directory contents
- `mcp__filesystem__list_directory_with_sizes` - List with file sizes
- `mcp__filesystem__directory_tree` - Get recursive tree view
- `mcp__filesystem__move_file` - Move or rename files
- `mcp__filesystem__search_files` - Search for files by pattern
- `mcp__filesystem__get_file_info` - Get file metadata
- `mcp__filesystem__list_allowed_directories` - View accessible directories
- `mcp__filesystem__read_multiple_files` - Batch file reading

**Capabilities**:
- Read, write, edit, and delete TypeScript files
- Create project structure and directories  
- Search for patterns across the codebase
- Batch file operations for refactoring
- Precise code replacements

**c0ntextKeeper Development Uses**:
- Generate TypeScript interfaces for context types
- Create MCP server implementation files
- Build extraction and archival modules
- Implement hook integration scripts
- Manage test files and fixtures
- Update package.json and configurations

**Working Examples**:
```typescript
// List project files
"Use mcp__filesystem__list_directory to show all files in current project"

// Read a file
"Use mcp__filesystem__read_text_file to read CLAUDE.md"

// Create a new TypeScript file
"Use mcp__filesystem__write_file to create src/core/types.ts with interface definitions"

// Search for patterns
"Use mcp__filesystem__search_files to find all .ts files in the project"
```

**Critical Tasks**:
```typescript
// Generate core type definitions
- src/core/types.ts (ExtractedContext, Problem, Decision, Pattern)
- src/server/index.ts (MCP server setup)
- src/hooks/precompact.ts (Hook handler)
- src/core/extractor.ts (Context extraction logic)
```

**Best Practices**:
- Always read existing code before modifications
- Use batch operations when updating multiple files
- Create comprehensive test files alongside implementations

---

### 2. sequential-thinking (@modelcontextprotocol/server-sequential-thinking)
**Purpose**: Design complex algorithms and architecture decisions

**Status**: ✅ Fully Operational (Tested 2025-08-27)

**Available Tools**:
- `mcp__sequential-thinking__sequentialthinking` - Multi-step reasoning and planning

**Tool Parameters**:
- `thought`: Current thinking step
- `nextThoughtNeeded`: Continue reasoning (true/false)
- `thoughtNumber`: Current step number
- `totalThoughts`: Estimated total steps
- `isRevision`: Revising previous thought
- `revisesThought`: Which thought to revise
- `branchFromThought`: Branching point
- `branchId`: Branch identifier

**Capabilities**:
- Break down complex extraction logic into steps
- Plan relevance scoring algorithms
- Design storage architecture
- Debug systematic issues
- Document architectural decisions

**c0ntextKeeper Development Uses**:
- **Design extraction pipeline**: How to identify valuable context
- **Plan relevance scoring**: Multi-factor algorithm design
- **Architect storage system**: File structure vs vector DB
- **Design pattern recognition**: Identifying recurring solutions
- **Plan MCP tool interfaces**: Tool design and parameters
- **Debug context loss**: Why certain contexts aren't captured

**Working Examples**:
```typescript
// Plan a complex feature
"Use mcp__sequential-thinking__sequentialthinking to design the context extraction pipeline for JSONL transcripts"

// Debug an issue
"Use sequential-thinking to analyze why certain contexts are not being preserved during compaction"

// Architecture decision
"Use sequential-thinking to evaluate file-based vs database storage for extracted contexts"
```

**Example Workflows**:
```markdown
1. Design Context Extraction Algorithm
   - Identify high-value indicators
   - Score relevance factors
   - Handle edge cases
   - Optimize performance

2. Plan Storage Architecture
   - Directory structure design
   - Index organization
   - Search optimization
   - Migration strategies
```

**Best Practices**:
- Document all architectural decisions
- Use for algorithm design before implementation
- Create step-by-step debugging plans

---

### 3. github-mcp (@modelcontextprotocol/server-github)
**Purpose**: Research existing MCP servers and context management patterns

**Status**: ✅ Fully Operational (Tested 2025-08-27)

**Available Tools**:
- `mcp__github-mcp__search_repositories` - Search for repositories
- `mcp__github-mcp__search_code` - Search code across GitHub
- `mcp__github-mcp__search_issues` - Search issues and PRs
- `mcp__github-mcp__get_file_contents` - Read file from repository
- `mcp__github-mcp__list_commits` - Get commit history
- `mcp__github-mcp__create_repository` - Create new repo
- `mcp__github-mcp__create_issue` - Create GitHub issue
- `mcp__github-mcp__create_pull_request` - Create PR
- `mcp__github-mcp__fork_repository` - Fork a repository
- `mcp__github-mcp__create_branch` - Create new branch

**Capabilities**:
- Search for MCP server implementations
- Find hook integration patterns
- Discover JSONL parsing strategies
- Research similar tools
- Learn from established patterns

**Working Examples**:
```typescript
// Search for MCP servers
"Use mcp__github-mcp__search_repositories with query 'MCP server language:TypeScript'"

// Find specific code patterns
"Use mcp__github-mcp__search_code to find 'preCompact hook' implementations"

// Read implementation example
"Use mcp__github-mcp__get_file_contents to read modelcontextprotocol/servers filesystem server implementation"
```

**c0ntextKeeper Research Queries**:
```
- "MCP server TypeScript implementation"
- "Claude Code hooks preCompact"
- "JSONL transcript parser"
- "context extraction algorithm"
- "relevance scoring NLP"
- "TypeScript AST parsing"
- "vector similarity search JavaScript"
- "knowledge graph construction"
```

**Specific Research Goals**:
- Find other MCP server implementations as reference
- Discover JSONL parsing best practices
- Research context extraction patterns
- Study relevance scoring algorithms
- Learn file-based storage optimizations
- Find testing strategies for MCP servers

**Key Repositories to Study**:
- modelcontextprotocol/servers (official examples)
- Other Claude Code tools and extensions
- Context management systems
- Knowledge extraction tools

---

### 4. context7 (@upstash/context7-mcp)
**Purpose**: Current documentation for all technologies used

**Status**: ✅ Fully Operational (Tested 2025-08-27)

**Available Tools**:
- `mcp__context7__resolve-library-id` - Find library ID by name
- `mcp__context7__get-library-docs` - Retrieve documentation

**Tool Parameters**:
- `libraryName`: Name to search (e.g., "typescript", "jest")
- `context7CompatibleLibraryID`: Format /org/project (e.g., "/microsoft/typescript")
- `tokens`: Max documentation tokens (default: 10000)
- `topic`: Specific topic focus (optional)

**Capabilities**:
- TypeScript 5.x best practices
- Node.js stream processing
- MCP SDK documentation
- Jest testing patterns
- npm package publishing

**c0ntextKeeper Documentation Needs**:
- **MCP SDK**: Server implementation, tool registration
- **TypeScript**: Advanced types, generics for context
- **Node.js**: Stream processing for JSONL files
- **Jest**: Testing MCP servers and async operations
- **Zod**: Schema validation for tool inputs
- **Commander**: CLI tool creation
- **File System**: Efficient file operations

**Working Examples**:
```typescript
// Get TypeScript documentation
"Use mcp__context7__resolve-library-id to find TypeScript library"
"Use mcp__context7__get-library-docs with /microsoft/typescript for generics documentation"

// Get MCP SDK documentation  
"Use context7 to resolve 'model context protocol' and get server implementation docs"

// Get Jest testing patterns
"Use context7 to get Jest documentation for testing async functions"
```

**Critical Documentation**:
```typescript
// MCP Server setup
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

// JSONL streaming
import { createReadStream } from 'fs';
import { createInterface } from 'readline';

// TypeScript utility types
type ExtractedContext<T> = {
  [K in keyof T]: T[K] extends object ? ExtractedContext<T[K]> : T[K]
};
```

---

### 5. fetch (@kazuph/mcp-fetch)
**Purpose**: Research competitor tools and documentation

**Status**: ✅ Fully Operational (Tested 2025-08-27)

**Available Tools**:
- `mcp__fetch__imageFetch` - Fetch and process web content

**Tool Parameters**:
- `url`: The URL to fetch (required)
- `maxLength`: Max content length (default: 20000)
- `startIndex`: Starting position in content (default: 0)
- `imageStartIndex`: Starting position for images (default: 0)
- `raw`: Return raw content vs markdown (default: false)
- `imageMaxCount`: Max images to process (default: 3)
- `enableFetchImages`: Enable image fetching (default: false)
- `returnBase64`: Return base64 encoded images (default: false)

**Capabilities**:
- Extract documentation from websites
- Analyze competitor features
- Gather implementation ideas
- Research best practices articles
- Process images from web pages

**Working Examples**:
```typescript
// Fetch MCP documentation
"Use mcp__fetch__imageFetch to get content from https://modelcontextprotocol.io"

// Research competitor tool
"Use fetch to analyze Cursor's codebase indexing documentation"

// Get implementation guide
"Use fetch to extract TypeScript best practices from official docs"
```

**c0ntextKeeper Research Uses**:
- Analyze Cline Memory Bank approach
- Research other context management tools
- Study AI coding assistant patterns
- Extract relevant blog posts and guides

**Research Targets**:
- Cursor's documentation on codebase indexing
- Continue's context management
- Cody's memory features
- GitHub Copilot's context awareness

---

### 6. c0ntextKeeper (Local MCP Server)
**Purpose**: Retrieve preserved context from previous Claude Code sessions

**Status**: ✅ v0.7.2 - Unified Storage Architecture

**Available Tools**:
- `mcp__c0ntextkeeper__fetch_context` - Get relevant archived context
- `mcp__c0ntextkeeper__search_archive` - Search through all archives  
- `mcp__c0ntextkeeper__get_patterns` - Find recurring patterns

**Tool Parameters**:

**fetch_context**:
- `query`: Search query for relevant context
- `limit`: Maximum results (default: 5, max: 100)
- `minRelevance`: Minimum relevance score (0-1, default: 0.5)
- `scope`: Search scope (session/project/global, default: project)

**search_archive**:
- `query`: Search query (required)
- `limit`: Maximum results (default: 10, max: 100)
- `filePattern`: File pattern filter (e.g., "*.ts")
- `dateRange`: Date range for filtering
- `sortBy`: Sort order (relevance/date/frequency)

**get_patterns**:
- `type`: Pattern type (code/command/architecture/all)
- `limit`: Maximum patterns (default: 10, max: 50)
- `minFrequency`: Minimum occurrence frequency (default: 2)

**Capabilities**:
- Retrieve context from previous sessions
- Search across all archived knowledge
- Identify recurring solutions and patterns
- Access implementation history
- Find previous decisions and rationale

**Storage Architecture (v0.7.2)**:
- **Global Storage**: `~/.c0ntextkeeper/archive/`
- **Project Organization**: Archives organized by readable project names
- **Smart Resolution**: Automatic storage location detection
- **Test Separation**: Test archives isolated in `test/` folders

**Working Examples**:
```typescript
// Get relevant context
"Use mcp__c0ntextkeeper__fetch_context to find previous authentication implementations"

// Search archives
"Use mcp__c0ntextkeeper__search_archive to find all Redis configuration decisions"

// Find patterns
"Use mcp__c0ntextkeeper__get_patterns to show recurring TypeScript patterns"
```

**Integration with Hooks**:
1. **PreCompact Hook** captures session transcripts
2. **UserPromptSubmit Hook** tracks questions
3. **PostToolUse Hook** captures tool results
4. **Stop Hook** saves Q&A exchanges
5. **MCP Tools** retrieve all captured data

---

## Development Workflow Integration

### Phase 1: Project Setup
1. **filesystem**: Create project structure
2. **context7**: Verify TypeScript and Node.js patterns
3. **github-mcp**: Reference MCP server examples

### Phase 2: Core Implementation
1. **sequential-thinking**: Design extraction algorithm
2. **filesystem**: Implement core modules
3. **github-mcp**: Find JSONL parsing patterns
4. **context7**: Ensure modern TypeScript usage

### Phase 3: MCP Server Development
1. **github-mcp**: Study MCP server implementations
2. **filesystem**: Generate server code
3. **context7**: Verify MCP SDK usage
4. **sequential-thinking**: Design tool interfaces

### Phase 4: Testing & Optimization
1. **filesystem**: Create comprehensive tests
2. **sequential-thinking**: Debug complex issues
3. **github-mcp**: Research testing strategies
4. **context7**: Jest best practices

---

## c0ntextKeeper-Specific Patterns

### Context Extraction Pipeline
1. **sequential-thinking**: Design extraction stages
2. **github-mcp**: Find AST parsing examples
3. **filesystem**: Implement extractor modules
4. **context7**: Stream processing documentation

### Relevance Scoring System
1. **sequential-thinking**: Algorithm design
2. **github-mcp**: Research scoring patterns
3. **filesystem**: Implement scorer service
4. **context7**: TypeScript type safety

### Storage Architecture
1. **sequential-thinking**: Design storage strategy
2. **github-mcp**: File-based DB examples
3. **filesystem**: Create storage layer
4. **context7**: File system best practices

### MCP Tool Implementation
1. **github-mcp**: Tool registration patterns
2. **filesystem**: Generate tool handlers
3. **context7**: Zod schema validation
4. **sequential-thinking**: Tool parameter design

---

## Security & Configuration

### Project Isolation
- **CRITICAL**: Filesystem server is configured for THIS project only
- **NEVER** use a filesystem server with root (/) access
- **ALWAYS** use project-scoped configurations
- **Path**: Your project directory

### GitHub PAT Setup
```bash
# Create a GitHub Personal Access Token:
# 1. Go to https://github.com/settings/tokens
# 2. Generate new token (classic)
# 3. Select 'repo' scope
# 4. Copy the token

# Add to .env file (DO NOT COMMIT):
GITHUB_TOKEN=ghp_your_token_here
```

### Environment Variables
```bash
# .env (for development - DO NOT COMMIT)
GITHUB_TOKEN=your_token
CONTEXT7_API_KEY=your_optional_api_key
C0NTEXTKEEPER_DEBUG=true
C0NTEXTKEEPER_LOG_LEVEL=debug
```

---

## Testing with MCP Servers

### Unit Test Generation
```typescript
// Use filesystem to create test files
- tests/unit/extractor.test.ts
- tests/unit/archiver.test.ts
- tests/unit/retriever.test.ts

// Use github-mcp to find testing patterns
- "Jest MCP server testing"
- "Mock file system testing"
- "Async generator testing TypeScript"
```

### Integration Testing
```typescript
// Test the complete pipeline
- Hook trigger simulation
- Context extraction verification
- Storage operations
- MCP tool responses
```

---

## Performance Considerations

### JSONL Processing
- **sequential-thinking**: Design streaming approach
- **github-mcp**: Find efficient parsers
- **filesystem**: Implement stream handlers
- **context7**: Node.js streams documentation

### Large File Handling
- Stream processing for large transcripts
- Chunked extraction for memory efficiency
- Progressive summarization strategies

---

## Troubleshooting

### Common Issues

**MCP Servers Not Available**:
```bash
# Restart Claude Code to load configuration
exit
cd ~/Projects/c0ntextKeeper
claude
```

**Filesystem Access Denied**:
- Verify the absolute path in .mcp.json
- Check directory permissions
- Ensure path matches your project location

**GitHub Token Issues**:
```bash
# Test token
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user

# Set in current session
export GITHUB_TOKEN="your_token"
```

---

## Development Best Practices

### For c0ntextKeeper Development
1. **Plan with sequential-thinking** before coding
2. **Research with github-mcp** for patterns
3. **Verify with context7** for current APIs
4. **Generate with filesystem** for consistency
5. **Test early and often** using filesystem
6. **Document architectural decisions** 
7. **Use TypeScript strictly** for type safety
8. **Stream large files** for performance
9. **Cache aggressively** to reduce processing
10. **Version control everything** including .mcp.json

### Workflow Example
```bash
# 1. Start Claude Code in project
cd ~/Projects/c0ntextKeeper
claude

# 2. Verify MCP servers are connected
/mcp  # Should show all 5 servers

# 3. Plan the feature
"Use mcp__sequential-thinking__sequentialthinking to design the context extraction algorithm"

# 4. Research implementations
"Use mcp__github-mcp__search_code to find JSONL parsing patterns"

# 5. Check documentation
"Use mcp__context7__resolve-library-id for 'MCP SDK' then get docs"

# 6. Implement
"Use mcp__filesystem__write_file to create src/core/extractor.ts"

# 7. Test
"Use mcp__filesystem__write_file to create tests/extractor.test.ts"
```

---

## Quick Reference

### Essential Commands
```bash
# Start Claude Code with MCP servers
cd ~/Projects/c0ntextKeeper
claude

# Verify MCP servers are connected
/mcp  # Should list all 5 servers
/status  # Check overall status

# View server configuration
cat .mcp.json

# Test each server:
# Filesystem: "Use mcp__filesystem__list_allowed_directories"
# Sequential: "Use mcp__sequential-thinking__sequentialthinking to test reasoning"
# GitHub: "Use mcp__github-mcp__search_repositories for 'MCP server'"
# Context7: "Use mcp__context7__resolve-library-id for 'typescript'"
# Fetch: "Use mcp__fetch__imageFetch to get https://modelcontextprotocol.io"
```

### File Structure to Generate
```
c0ntextKeeper/
├── src/
│   ├── server/index.ts      # MCP server entry
│   ├── hooks/precompact.ts  # Hook handler
│   ├── core/
│   │   ├── types.ts         # Type definitions
│   │   ├── extractor.ts     # Context extraction
│   │   ├── archiver.ts      # Storage logic
│   │   └── retriever.ts     # Context retrieval
│   └── tools/
│       ├── fetch-context.ts # MCP tool
│       └── search-archive.ts # MCP tool
└── tests/
    └── unit/                 # Jest tests
```

---

## Additional Resources

- [MCP SDK Documentation](https://modelcontextprotocol.io)
- [c0ntextKeeper Repository](https://github.com/yourusername/c0ntextKeeper)
- [Claude Code Hooks Guide](https://docs.anthropic.com/en/docs/claude-code/hooks)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Jest Testing Guide](https://jestjs.io/docs/getting-started)