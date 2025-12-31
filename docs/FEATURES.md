# Complete Feature Catalog

> Everything c0ntextKeeper can do for you

---

## 🎯 Core Features (Automatic)

These features work automatically after running `c0ntextkeeper setup`. No additional configuration needed!

### 1. **Intelligent Context Extraction**
- **187 Semantic Patterns** recognize problems, solutions, implementations, and decisions
- **116 Problem Indicators**: errors, bugs, questions, dev tasks, architecture, testing, debugging
- **41 Request Indicators**: polite requests, direct asks, planning, seeking advice
- **23 Solution Indicators**: action words, code blocks, explanations
- **7 Decision Indicators**: architectural choices, approach decisions

### 2. **Automatic Archival**
- Triggers on every `/compact` (manual or automatic)
- Streams JSONL transcripts line-by-line for efficiency
- Stores as human-readable JSON for easy inspection
- Project-based organization: `~/.c0ntextkeeper/archive/projects/[name]/`

### 3. **Auto-Load Context**
- MCP resources provide instant project awareness at session start
- Smart loading strategy: recent sessions + top patterns + key decisions
- Configurable size limits (default: 10KB)
- Zero latency - loads before first user message

### 4. **Search & Indexing**
- **Inverted index** with O(1) keyword lookups
- **Natural language queries** with tokenization
- **Word expansion**: "fix" matches "fixed", "fixes", "fixing"
- **Stop word removal**: filters "the", "a", "an", etc.
- **Temporal decay**: recent content ranks higher

### 5. **Security Filtering**
- **Automatic redaction** of sensitive data:
  - API keys (OpenAI, Anthropic, AWS, GitHub, Stripe)
  - Database connection strings
  - Private keys & SSH keys
  - JWT tokens
  - Passwords & secrets
  - PII (emails, IPs, phone numbers)
- Custom pattern support for project-specific secrets

### 6. **Analytics Dashboards**
- Per-project `README.md` with statistics
- Tool usage breakdown
- File modification frequency
- Top patterns discovered
- Recent activity timeline

### 7. **Performance Optimization**
- **<10ms average** for all operations
- **<100ms** transcript parsing (1000 lines)
- **<50ms** context extraction (100 messages)
- **<5ms** search queries with index
- Non-blocking hook execution (5s timeout)

---

## 🎣 Hook System

> **📝 Note**: Storage directories are created **on-demand** when hooks are enabled and triggered. Only `sessions/` exists by default (PreCompact is enabled). Other directories (`knowledge/`, `patterns/`, `prompts/`, `notifications/`, `sessions-meta/`) appear when you enable their respective hooks.

### PreCompact Hook (Default: ✅ Enabled)

**Trigger**: Before Claude Code compaction (manual `/compact` or automatic)

**Captures**:
- Problems encountered and questions asked
- Solutions provided and implementations created
- Architectural decisions made
- Code patterns and tool usage
- File modifications
- Session metadata (duration, tools used, files modified)

**Storage**: `~/.c0ntextkeeper/archive/projects/[name]/sessions/YYYY-MM-DD-HH-MM-SS-session.json`

**Value**: ⭐⭐⭐⭐⭐ (80% of total value)

---

### Stop Hook (Default: ⭕ Disabled)

**Trigger**: After each assistant response completes

**Captures**:
- User question
- Assistant answer
- Q&A metadata (topics, relevance, has solution, has error)
- Tools used in response
- Files modified in response

**Storage**: `~/.c0ntextkeeper/archive/projects/[name]/knowledge/YYYY-MM-DD-knowledge.json`

**Value**: ⭐⭐⭐ (Builds searchable Q&A knowledge base)

**Enable**:
```bash
c0ntextkeeper hooks enable stop
```

---

### PostToolUse Hook (Default: ⭕ Disabled)

**Trigger**: After **EVERY** tool execution (Write, Edit, Bash, MCP tools, etc.)

**Captures**:
- Tool name and type
- Tool input parameters
- Tool result/output
- Success/failure status
- Error messages if failed
- File paths modified
- Commands executed

**Storage**: `~/.c0ntextkeeper/archive/projects/[name]/patterns/YYYY-MM-DD-patterns.json`

**Value**: ⭐⭐⭐⭐ (Comprehensive tool usage analytics)

**Enable**:
```bash
c0ntextkeeper hooks enable posttooluse
```

---

### UserPromptSubmit Hook (Default: ⭕ Disabled)

**Trigger**: Every time user submits a prompt/question

**Captures**:
- User prompt text
- Prompt characteristics (length, has code, has question)
- Topics detected
- Follow-up tracking (1st question vs 2nd, 3rd, etc.)
- Timestamp

**Storage**: `~/.c0ntextkeeper/archive/projects/[name]/prompts/YYYY-MM-DD-prompts.json`

**Value**: ⭐⭐ (Useful for understanding user behavior patterns)

**Enable**:
```bash
c0ntextkeeper hooks enable userpromptsubmit
```

---

### Notification Hook (Default: ⭕ Disabled)

**Trigger**: When Claude Code sends notifications (toast messages, alerts, progress updates)

**Captures**:
- Notification type and severity (info, warning, error, success)
- Notification message content
- Timestamp
- Associated session context
- Project path

**Storage**: `~/.c0ntextkeeper/archive/projects/[name]/notifications/YYYY-MM-DD-notifications.json`

**Value**: ⭐⭐ (Useful for tracking warnings and alerts during development)

**Enable**:
```bash
c0ntextkeeper hooks enable notification
```

---

### SubagentStop Hook (REMOVED in v0.7.8)

> **Note**: SubagentStop was removed because Claude Code does not send the required fields (`subagent_type`, `tools_used`, `transcript`). All captured data showed `"unknown"` types and empty tools arrays, making the feature non-functional.

---

### SessionStart Hook (Default: ⭕ Disabled)

**Trigger**: When a new Claude Code session begins

**Captures**:
- Session start timestamp
- Project path and name
- Working directory
- Initial environment context
- Session identifier

**Storage**: `~/.c0ntextkeeper/archive/projects/[name]/sessions-meta/YYYY-MM-DD-sessions.json`

**Value**: ⭐⭐ (Useful for session lifecycle tracking and analytics)

**Enable**:
```bash
c0ntextkeeper hooks enable sessionstart
```

---

### SessionEnd Hook (Default: ⭕ Disabled)

**Trigger**: When a Claude Code session ends (user exits or session timeout)

**Captures**:
- Session end timestamp
- Session duration
- Summary of tools used
- Files modified count
- Session identifier (for pairing with SessionStart)

**Storage**: `~/.c0ntextkeeper/archive/projects/[name]/sessions-meta/YYYY-MM-DD-sessions.json`

**Value**: ⭐⭐ (Useful for session lifecycle tracking and analytics)

**Enable**:
```bash
c0ntextkeeper hooks enable sessionend
```

---

## 🛠️ MCP Server Features

### MCP Tools (3 total)

#### 1. `fetch_context`
**Purpose**: Retrieve relevant archived context for current task

**Parameters**:
- `query` (optional): Search query or description
- `limit` (default: 5, max: 100): Number of results
- `scope` (default: "project"): "session", "project", or "global"
- `minRelevance` (default: 0.3): Minimum relevance score (0-1)

**Returns**: Formatted context with problems, solutions, implementations, metadata

**Example**:
```json
{
  "name": "fetch_context",
  "arguments": {
    "query": "authentication implementation",
    "limit": 10,
    "scope": "project"
  }
}
```

---

#### 2. `search_archive`
**Purpose**: Advanced search with filters and sorting

**Parameters**:
- `query` (required): Search keywords
- `filePattern` (optional): Filter by file pattern (e.g., "*.ts", "src/**/*.js")
- `dateRange` (optional): `{ from: "YYYY-MM-DD", to: "YYYY-MM-DD" }`
- `projectPath` (optional): Filter by project
- `limit` (default: 10, max: 100): Max results
- `sortBy` (default: "relevance"): "relevance", "date", or "frequency"

**Returns**: Search results with matches, snippets, and relevance scores

**Example**:
```json
{
  "name": "search_archive",
  "arguments": {
    "query": "database error fix",
    "filePattern": "*.ts",
    "limit": 20,
    "sortBy": "date"
  }
}
```

---

#### 3. `get_patterns`
**Purpose**: Retrieve recurring patterns and common solutions

**Parameters**:
- `type` (default: "all"): "code", "command", "architecture", or "all"
- `minFrequency` (default: 2): Minimum occurrences
- `limit` (default: 10, max: 50): Max patterns

**Returns**: Pattern frequency analysis with examples

**Example**:
```json
{
  "name": "get_patterns",
  "arguments": {
    "type": "command",
    "minFrequency": 3,
    "limit": 15
  }
}
```

---

### MCP Resources (3 total)

#### 1. `context://project/[name]/current`
**Purpose**: Main project context auto-loaded at session start

**Contains**:
- Recent sessions (default: 3)
- Top patterns (default: 5)
- Key decisions
- Session metadata

**Configuration**: Via `c0ntextkeeper context configure`

---

#### 2. `context://project/[name]/patterns`
**Purpose**: Recurring patterns from this project

**Contains**:
- Tool usage patterns
- Command patterns
- Code modification patterns
- Error handling patterns

---

#### 3. `context://project/[name]/knowledge`
**Purpose**: Q&A knowledge base from Stop hook

**Contains**:
- Q&A pairs (default: 20 most recent)
- Solutions to common problems
- Error resolutions
- Implementation examples

---

## 🖥️ CLI Commands (28 total)

### Setup & Installation (3 commands)

```bash
c0ntextkeeper setup           # Configure hooks (one-time)
c0ntextkeeper init            # Initialize project storage
c0ntextkeeper init --global   # Initialize global storage
```

---

### Core Operations (5 commands)

```bash
c0ntextkeeper archive <file>  # Manually archive transcript JSONL
c0ntextkeeper search [query]  # Search archives (no query = recent)
c0ntextkeeper patterns        # Analyze recurring patterns
c0ntextkeeper stats           # Show storage statistics
c0ntextkeeper status          # Check automation status
```

---

### Hook Management (6 commands)

```bash
c0ntextkeeper hooks list      # List all hooks & status
c0ntextkeeper hooks enable <hook>   # Enable specific hook
c0ntextkeeper hooks disable <hook>  # Disable specific hook
c0ntextkeeper hooks test <hook>     # Test hook with sample data
c0ntextkeeper hooks stats     # Show hook statistics
c0ntextkeeper hooks health    # Comprehensive health diagnostics
```

---

### Context Management (3 commands)

```bash
c0ntextkeeper context preview # Preview auto-load content
c0ntextkeeper context test    # Test context loading
c0ntextkeeper context configure # Configure auto-load settings
  --enable                    # Enable auto-loading
  --disable                   # Disable auto-loading
  --strategy <type>           # Set strategy (smart|recent|relevant|custom)
  --max-size <kb>             # Set max size in KB
  --session-count <n>         # Recent sessions to include
  --pattern-count <n>         # Top patterns to include
```

---

### Diagnostics & Testing (6 commands)

```bash
c0ntextkeeper validate        # Validate installation
c0ntextkeeper doctor          # Comprehensive diagnostics
c0ntextkeeper benchmark       # Performance benchmarks
c0ntextkeeper debug           # Verbose logging mode
  -c, --component <name>      # Filter by component
  -s, --severity <level>      # Filter by severity
  -f, --follow                # Follow logs in real-time
c0ntextkeeper test-hook       # Test all hooks
c0ntextkeeper test-mcp        # Test MCP tools
```

---

### Maintenance (5 commands)

```bash
c0ntextkeeper cleanup         # Clean invalid entries from global index
  --dry-run                   # Preview changes
  --backup                    # Create backup (default: true)
c0ntextkeeper migrate         # Migrate old archives to new format
  --dry-run                   # Preview migration
c0ntextkeeper migrate:restore # Restore from migration backup
c0ntextkeeper rebuild-index   # Rebuild search index
  -p, --project <path>        # Rebuild for specific project
c0ntextkeeper server          # Start MCP server (for testing)
```

---

## 📊 Storage Architecture

### Directory Structure

```
~/.c0ntextkeeper/
├── archive/                    # All archived data
│   └── projects/               # Project-specific archives
│       └── [project-name]/     # E.g., "my-app"
│           ├── sessions/       # PreCompact hook data
│           │   └── YYYY-MM-DD-HH-MM-SS-session.json
│           ├── knowledge/      # Stop hook Q&A data
│           │   └── YYYY-MM-DD-knowledge.json
│           ├── patterns/       # PostToolUse hook data
│           │   └── YYYY-MM-DD-patterns.json
│           ├── prompts/        # UserPromptSubmit hook data
│           │   └── YYYY-MM-DD-prompts.json
│           ├── notifications/  # Notification hook data (v0.7.7)
│           │   └── YYYY-MM-DD-notifications.json
│           ├── sessions-meta/  # SessionStart/End hook data (v0.7.7)
│           │   └── YYYY-MM-DD-sessions.json
│           ├── test/           # Test data (auto-filtered)
│           ├── index.json      # Project session index
│           ├── README.md       # Analytics dashboard
│           └── search-index.json # Search inverted index
├── config.json                 # Configuration settings
├── index.json                  # Global project index
└── debug/                      # Debug logs (when enabled)
    ├── precompact-YYYY-MM-DD.log
    ├── stop-YYYY-MM-DD.log
    ├── posttool-YYYY-MM-DD.log
    ├── userprompt-YYYY-MM-DD.log
    ├── notification-YYYY-MM-DD.log
    ├── sessionstart-YYYY-MM-DD.log
    └── sessionend-YYYY-MM-DD.log
```

---

## 🔍 Search Features

### Natural Language Queries

```bash
# Simple keyword
c0ntextkeeper search "authentication"

# Multi-word queries
c0ntextkeeper search "fix database error"

# File pattern filtering
c0ntextkeeper search "bug fix" --limit 20

# Project filtering
c0ntextkeeper search "performance" --project ~/my-app
```

### Search Index Features

- **Inverted Index**: O(1) keyword lookups
- **Tokenization**: Splits queries into meaningful words
- **Stop Words**: Filters common words (the, a, an, and, or, etc.)
- **Word Variations**: Automatically expands search terms
- **Snippet Extraction**: Shows ±50 characters around matches
- **Relevance Scoring**: Combines term frequency + temporal decay

---

## ⚙️ Configuration System

### Configuration Levels

1. **Global** (`~/.c0ntextkeeper/config.json`)
   - Applies to all projects
   - Default settings

2. **Project** (`<project>/.c0ntextkeeper/config.json`)
   - Overrides global settings
   - Project-specific customization

### Configurable Settings

- **Auto-Load**: Enable/disable, strategy, size limits, content types
- **Hooks**: Enable/disable each hook, matchers, filters
- **Extraction**: Relevance threshold, max items, content limits
- **Storage**: Base path, retention days, size limits
- **Security**: Enable/disable filtering, custom patterns

See [CONFIGURATION.md](./CONFIGURATION.md) for complete reference.

---

## 📈 Performance Characteristics

### Benchmark Targets

| Operation | Target | Actual | Status |
|-----------|--------|--------|--------|
| Transcript Parsing (1000 lines) | <100ms | ~50ms | ✅ |
| Context Extraction (100 messages) | <50ms | ~30ms | ✅ |
| Storage Write | <10ms | ~5ms | ✅ |
| Storage Read | <10ms | ~7ms | ✅ |
| Search Query | <10ms | <5ms | ✅ |
| Index Rebuild | <500ms | ~200ms | ✅ |

**Average Operation**: **<10ms** (exceeds all targets!)

---

## 🎓 Learning Features

### Pattern Recognition

- Identifies recurring command sequences
- Detects repeated code modifications
- Recognizes common error patterns
- Discovers workflow patterns

### Knowledge Base Building

- Q&A pairs from Stop hook
- Solutions index for quick retrieval
- Error pattern tracking
- Implementation examples

### Analytics

- Tool usage frequency
- File modification heat maps
- Session duration trends
- Decision impact assessment

---

## 🔒 Security Features

### Automatic Filtering

- **API Keys**: OpenAI, Anthropic, AWS, GitHub, Stripe, etc.
- **Database**: Connection strings for Postgres, MySQL, MongoDB
- **Cryptographic**: Private keys, SSH keys, JWT tokens
- **Credentials**: Passwords, secrets, auth tokens
- **PII**: Emails (partial), IPs (partial), phone numbers (partial)

### Custom Patterns

Add project-specific patterns to `config.json`:

```json
{
  "security": {
    "filterSensitiveData": true,
    "customPatterns": [
      "MY_CUSTOM_SECRET_.*",
      "INTERNAL_API_KEY_.*"
    ]
  }
}
```

---

## 🚀 Advanced Features

### Temporal Decay

- Recent context ranks higher in search
- 60-day half-life for relevance scoring
- Balances recency with quality

### Session Naming

- Intelligent session ID generation
- Deterministic for consistency
- Human-readable timestamps

### Project Detection

- Automatic project name extraction
- Multi-project support
- Cross-project search capability

### Test Data Filtering

- Automatic detection of test sessions
- Separate test/ directory
- Prevents pollution of production archives

---

## 📚 Integration Features

### Claude Code Integration

- Hooks into compaction lifecycle
- MCP server provides tools & resources
- Zero-latency context loading
- Non-blocking operation

### CLI Integration

- Comprehensive command suite
- Piping support for automation
- JSON output for scripting
- Beautiful chalk styling

### Tool Support

- Tracks ALL Claude Code tools (Write, Edit, Bash, etc.)
- Tracks ALL MCP server tools
- Custom tool recognition
- Success/failure tracking

---

## 🎯 Coming Soon

- Vector search for semantic queries
- Cloud sync for cross-machine context
- Team sharing capabilities
- VS Code extension
- Web dashboard

---

**Need help?** See [QUICKSTART.md](./QUICKSTART.md) to get started or [USE-CASES.md](./USE-CASES.md) for real-world examples!
