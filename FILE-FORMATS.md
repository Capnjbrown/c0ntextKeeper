# c0ntextKeeper File Format Reference

## Overview

As of v0.5.3, c0ntextKeeper uses **JSON format exclusively** for all archive files. This provides consistency, readability, and easy inspection of preserved context.

## File Format Table

| Archive Type | Format | File Pattern | Storage Location | Description |
|-------------|--------|--------------|------------------|-------------|
| **Sessions** | JSON | `YYYY-MM-DD_HHMM_MT_description.json` | `projects/[name]/sessions/` | Individual session archives with full context |
| **Test Sessions** | JSON | `validation-*.json` | `projects/[name]/test/` | Test/validation data (separated from real data) |
| **Prompts** | JSON | `YYYY-MM-DD-prompts.json` | `prompts/[hash]/` | Daily array of user prompts |
| **Patterns** | JSON | `YYYY-MM-DD-patterns.json` | `patterns/[hash]/` | Daily array of tool usage patterns |
| **Knowledge** | JSON | `YYYY-MM-DD-knowledge.json` | `knowledge/[hash]/` | Daily array of Q&A pairs |
| **Errors** | JSON | `YYYY-MM-DD-errors.json` | `errors/` | Daily array of error patterns |
| **Solutions** | JSON | `index.json` | `solutions/` | Indexed solutions for quick retrieval |
| **Project Index** | JSON | `index.json` | `projects/[name]/` | Project statistics and metadata |
| **Global Index** | JSON | `index.json` | `global/` | Master index of all projects |

## Storage Structure

```
~/.c0ntextkeeper/
├── archive/
│   ├── global/
│   │   └── index.json                    # Master index (JSON)
│   └── projects/
│       └── [project-name]/
│           ├── README.md                 # Analytics dashboard (Markdown)
│           ├── index.json                # Project statistics (JSON)
│           ├── sessions/                 # Real session data
│           │   └── YYYY-MM-DD_HHMM_MT_description.json
│           └── test/                     # Test/validation data
│               └── validation-*.json
├── prompts/
│   └── [project-hash]/
│       └── YYYY-MM-DD-prompts.json      # Daily prompts array (JSON)
├── patterns/
│   └── [project-hash]/
│       └── YYYY-MM-DD-patterns.json     # Daily patterns array (JSON)
├── knowledge/
│   └── [project-hash]/
│       └── YYYY-MM-DD-knowledge.json    # Daily Q&A pairs array (JSON)
├── errors/
│   └── YYYY-MM-DD-errors.json           # Daily error patterns (JSON)
├── solutions/
│   └── index.json                       # Solutions index (JSON)
├── config.json                          # System configuration (JSON)
└── logs/
    └── hook.log                          # Execution logs (Plain text)
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

JSON arrays containing entries from throughout the day:

```json
[
  {
    "sessionId": "session-123",
    "timestamp": "2025-09-05T10:00:00Z",
    "prompt": "How do I implement authentication?",
    "promptLength": 35,
    "hasCodeBlock": false,
    "hasQuestion": true,
    "topics": ["authentication"]
  },
  {
    "sessionId": "session-124",
    "timestamp": "2025-09-05T11:00:00Z",
    "prompt": "Fix the login error",
    "promptLength": 20,
    "hasCodeBlock": false,
    "hasQuestion": false,
    "topics": ["debugging", "authentication"]
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

## Migration from JSONL

Prior to v0.5.3, some archive types used JSONL (JSON Lines) format. The migration to JSON provides:

- Better readability (formatted with indentation)
- Easier manual inspection
- Consistent format across all archive types
- Simplified retrieval logic

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

*Last Updated: 2025-09-05 | c0ntextKeeper v0.5.3*