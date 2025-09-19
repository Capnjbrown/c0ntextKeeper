# c0ntextKeeper File Format Reference

## Overview

c0ntextKeeper uses **JSON format exclusively** for all archive files. This provides human readability, consistency across all components, and easy inspection of preserved context. All hook data (prompts, patterns, knowledge, errors) is stored as formatted JSON arrays, not JSONL.

## Storage Modes (v0.7.4+)

c0ntextKeeper v0.7.4 introduces hybrid storage with flexible location options:

### Project-Local Storage
- **Location**: `.c0ntextkeeper/` within your project directory
- **Scope**: Context specific to the current project
- **Initialize**: `c0ntextkeeper init`
- **Use Case**: Recommended for project-specific context

### Global Storage  
- **Location**: `~/.c0ntextkeeper/` in your home directory
- **Scope**: Shared context across all projects
- **Initialize**: `c0ntextkeeper init --global`
- **Use Case**: Good for cross-project patterns and knowledge

### Storage Resolution
The system automatically finds the appropriate storage:
1. Checks `CONTEXTKEEPER_HOME` environment variable (if set)
2. Looks for `.c0ntextkeeper/` in current directory
3. Walks up parent directories searching for `.c0ntextkeeper/`
4. Falls back to global storage at `~/.c0ntextkeeper/`

## File Format Table

| Archive Type | Format | File Pattern | Storage Location | Description |
|-------------|--------|--------------|------------------|-------------|
| **Sessions** | JSON | `YYYY-MM-DD_HHMM_MT_description.json` | `archive/projects/[name]/sessions/` | Individual session archives with full extracted context |
| **Test Sessions** | JSON | `validation-*.json` | `archive/projects/[name]/test/` | Test/validation data (automatically separated from production) |
| **Prompts** | JSON | `YYYY-MM-DD-prompts.json` | `archive/projects/[name]/prompts/` | Daily JSON array of UserPromptSubmit hook data |
| **Patterns** | JSON | `YYYY-MM-DD-patterns.json` | `archive/projects/[name]/patterns/` | Daily JSON array of PostToolUse hook data (includes MCP tools) |
| **Knowledge** | JSON | `YYYY-MM-DD-knowledge.json` | `archive/projects/[name]/knowledge/` | Daily JSON array of Stop hook Q&A pairs |
| **Errors** | JSON | `YYYY-MM-DD-errors.json` | `errors/` | Daily JSON array of error patterns from all tools |
| **Solutions** | JSON | `index.json` | `solutions/` | Indexed solutions for quick retrieval |
| **Project Index** | JSON | `index.json` | `archive/projects/[name]/` | Project statistics, tool usage, analytics |
| **Global Index** | JSON | `index.json` | `archive/global/` | Master index with test project filtering |
| **README Analytics** | Markdown | `README.md` | `archive/projects/[name]/` | Auto-generated analytics dashboard |

## Storage Structure

The storage structure is the same for both project-local and global modes, just at different root locations:

### Project-Local Mode
```
.c0ntextkeeper/                          # In your project directory
├── archive/
│   ├── global/
│   │   └── index.json                    # Master index (JSON)
│   └── projects/
│       └── [project-name]/
│           ├── README.md                 # Rich analytics dashboard
│           ├── index.json                # Project statistics (JSON)
│           ├── sessions/                 # Real session data
│           │   └── YYYY-MM-DD_HHMM_MT_description.json
│           └── test/                     # Test/validation data
│               └── validation-*.json
├── prompts/
│   └── [project-name]/
│       └── YYYY-MM-DD-prompts.json      # Daily prompts array (JSON)
├── patterns/
│   └── [project-name]/
│       └── YYYY-MM-DD-patterns.json     # Daily patterns array (JSON)
├── knowledge/
│   └── [project-name]/
│       └── YYYY-MM-DD-knowledge.json    # Daily Q&A pairs array (JSON)
├── errors/
│   └── YYYY-MM-DD-errors.json           # Daily error patterns (JSON)
├── solutions/
│   └── index.json                       # Solutions index (JSON)
├── config.json                          # System configuration (JSON)
└── logs/
    └── hook.log                          # Execution logs (Plain text)
```

### Global Mode
```
~/.c0ntextkeeper/                        # In your home directory
├── projects/                            # Per-project storage (by name)
│   └── [project-name]/                  # Project-specific archives
│       └── (same structure as above)
├── global/
│   └── solutions/                       # Shared solutions
├── config.json                          # Global configuration
├── index.json                           # Project registry
└── logs/                               # Global logs
```

## File Format Details

### Session Files (`sessions/*.json`)

Individual JSON files containing complete extracted context from a Claude Code session:

```json
{
  "sessionId": "unique-session-id",
  "projectPath": "/path/to/project",
  "timestamp": "2025-09-05T10:30:00Z",
  "extractedAt": "preCompact",
  "problems": [...],
  "implementations": [...],
  "decisions": [...],
  "patterns": [...],
  "metadata": {
    "entryCount": 150,
    "duration": 3600000,
    "toolsUsed": ["Read", "Write", "Edit"],
    "toolCounts": {"Read": 45, "Write": 12, "Edit": 8},
    "filesModified": ["file1.ts", "file2.js"],
    "relevanceScore": 0.85,
    "extractionVersion": "0.5.1",
    "isTest": false
  }
}
```

### Daily Hook Archives (`prompts/*.json`, `patterns/*.json`, `knowledge/*.json`)

JSON arrays containing entries from throughout the day. **Important: These are JSON arrays, not JSONL files.**

#### Prompts Format (UserPromptSubmit Hook)
```json
[
  {
    "sessionId": "session-123",
    "timestamp": "2025-09-05T10:00:00Z",
    "projectPath": "/Users/user/project",
    "prompt": "How do I implement authentication?",
    "promptLength": 35,
    "hasCodeBlock": false,
    "hasQuestion": true,
    "topics": ["authentication"]
  }
]
```

#### Patterns Format (PostToolUse Hook - with MCP Tool Support)
```json
[
  {
    "tool": "mcp__filesystem__write_file",
    "success": true,
    "pattern": "MCP filesystem: write file on src/auth.ts - success",
    "timestamp": "2025-09-05T10:00:00Z",
    "sessionId": "session-123",
    "fileModified": "src/auth.ts"
  },
  {
    "tool": "TodoWrite",
    "success": true,
    "pattern": "TodoWrite: 5 todos - updated",
    "timestamp": "2025-09-05T10:05:00Z",
    "sessionId": "session-123"
  }
]
```

#### Knowledge Format (Stop Hook)
```json
[
  {
    "sessionId": "session-123",
    "timestamp": "2025-09-05T10:00:00Z",
    "question": "How do I implement JWT authentication?",
    "answer": "Use the jsonwebtoken library with refresh tokens...",
    "toolsUsed": ["Write", "Edit", "mcp__filesystem__read_file"],
    "filesModified": ["auth.ts", "middleware.ts"],
    "topics": ["authentication", "security"],
    "relevanceScore": 0.85,
    "hasSolution": true,
    "hasError": false
  }
]
```

### Test Data Separation

Test and validation data is automatically separated from real session data:

- Real sessions: `projects/[name]/sessions/*.json`
- Test data: `projects/[name]/test/*.json`

Test data is identified by the `isTest: true` flag in metadata and excluded from project statistics.

## Benefits of JSON Format

1. **Human Readable**: Can be opened in any text editor or browser
2. **Consistent**: All archives use the same format
3. **Queryable**: Easy to search and analyze with standard tools
4. **Debuggable**: Clear structure for troubleshooting
5. **Version Control Friendly**: Diff-able and mergeable
6. **Tool Support**: Wide ecosystem of JSON tools and viewers

## Key Implementation Details

### JSON vs JSONL Clarification

**All c0ntextKeeper storage uses JSON format:**
- Session archives: Individual JSON files
- Hook data: Daily JSON arrays (not JSONL)
- Indexes: Formatted JSON with statistics
- Configuration: Standard JSON

**Note:** While Claude Code transcripts use JSONL format, c0ntextKeeper converts and stores everything as formatted JSON for better readability and consistency.

### MCP Tool Support in Patterns

The PostToolUse hook captures ALL tools including MCP server tools:
- Standard tools: Write, Edit, Read, Bash, Grep, etc.
- MCP filesystem tools: `mcp__filesystem__write_file`, `mcp__filesystem__read_file`, etc.
- MCP sequential-thinking: `mcp__sequential-thinking__sequentialthinking`
- Administrative tools: TodoWrite, ExitPlanMode
- Web tools: WebSearch, WebFetch

### Test Data Separation

c0ntextKeeper automatically identifies and separates test data:
- Test sessions stored in `archive/projects/[name]/test/`
- Test projects filtered from global index
- Prevents `/tmp`, `/var/folders`, and test pattern pollution
- Identified by `isTest: true` flag in metadata

## Viewing Archive Files

### Command Line

```bash
# View a session file
cat ~/.c0ntextkeeper/archive/projects/*/sessions/*.json | jq '.'

# View daily prompts
cat ~/.c0ntextkeeper/prompts/*/2025-09-05-prompts.json | jq '.'

# Search across all JSON files
grep -r "authentication" ~/.c0ntextkeeper/**/*.json
```

### macOS Finder

1. Press `Cmd + Shift + G` in Finder
2. Enter `~/.c0ntextkeeper/archive`
3. Double-click any `.json` file to open in your default JSON viewer

### VS Code

```bash
# Open entire archive in VS Code
code ~/.c0ntextkeeper/archive
```

## File Size Considerations

- **Session files**: Typically 5-50 KB each
- **Daily hook files**: 10-100 KB per day (depending on activity)
- **Index files**: 1-10 KB
- **Total daily usage**: ~750KB-1.5MB with all hooks enabled

Daily files keep sizes manageable while maintaining chronological organization.

## Security Notes

All files are:
- Stored locally on your machine
- Filtered for sensitive data (API keys, passwords, PII)
- Accessible only by your user account
- Never uploaded to cloud services

---

*Last Updated: 2025-09-10 | c0ntextKeeper v0.7.4*